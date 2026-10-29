// 알 관련 서버 로직: 동기화(기본 알 지급), 쓰다듬기, 따뜻하게 하기, 부화.
// 시간 계산과 난수는 모두 여기서만 한다. 화면은 요청하고 결과만 받는다.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { EGG, type Rarity } from './config.ts'
import { rollMonster } from './roll.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify({ ...body, now: new Date().toISOString() }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const rand = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32

// 한국 시간 기준 날짜 문자열 (하루 횟수 제한용)
const dayKey = (now: Date) => new Date(now.getTime() + EGG.dayOffsetHours * 3600_000).toISOString().slice(0, 10)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: auth } = await admin.auth.getUser(token)
  const uid = auth.user?.id
  if (!uid) return json({ ok: false, code: 'auth', message: '다시 로그인해 주세요.' }, 401)

  const body = await req.json().catch(() => ({}))
  const action = body.action as string
  const now = new Date()

  const { data: player } = await admin.from('players').select('id, starter_egg_granted').eq('id', uid).maybeSingle()
  if (!player) return json({ ok: false, code: 'no_player', message: '닉네임을 먼저 정해 주세요.' })

  const currentEgg = async () => {
    const { data } = await admin.from('eggs').select('*').eq('owner', uid).is('hatched_at', null).order('created_at').limit(1).maybeSingle()
    return data
  }

  if (action === 'sync') {
    // 기본 알은 한 번만, 동시에 두 번 요청이 와도 한 개만 만들어지도록 표시를 먼저 선점한다
    if (!player.starter_egg_granted) {
      const { data: claimed } = await admin.from('players').update({ starter_egg_granted: true }).eq('id', uid).eq('starter_egg_granted', false).select('id').maybeSingle()
      if (claimed) {
        const rarity = EGG.startingRarity
        await admin.from('eggs').insert({ owner: uid, rarity, hatch_at: new Date(now.getTime() + EGG.hatchMinutes[rarity] * 60_000).toISOString() })
      }
    }
    // 이미 지급된 미부화 알의 남은 시간이 현재 설정된 최대 부화 시간(테스트 1분 등)보다 길면 즉시 단축해 준다
    let egg = await currentEgg()
    if (egg) {
      const maxTarget = now.getTime() + (EGG.hatchMinutes[egg.rarity as Rarity] ?? 1) * 60_000
      if (Date.parse(egg.hatch_at) > maxTarget) {
        const { data: shortened } = await admin
          .from('eggs')
          .update({ hatch_at: new Date(maxTarget).toISOString() })
          .eq('id', egg.id)
          .select('*')
          .maybeSingle()
        if (shortened) egg = shortened
      }
    }
    const { data: monsters } = await admin.from('monsters').select('*').eq('owner', uid).order('created_at')
    return json({ ok: true, egg, monsters: monsters ?? [], limits: { pet: EGG.pet.dailyLimit, warm: EGG.warm.dailyLimit } })
  }

  if (action === 'pet' || action === 'warm') {
    const egg = await currentEgg()
    if (!egg || egg.id !== body.eggId) return json({ ok: false, code: 'no_egg', message: '알을 찾지 못했어요.' })
    if (new Date(egg.hatch_at) <= now) return json({ ok: false, code: 'ready', message: '알이 곧 깨어날 거예요!', egg })

    const rule = action === 'pet' ? EGG.pet : EGG.warm
    const today = dayKey(now)
    const sameDay = egg.care_day === today
    const used = sameDay ? (action === 'pet' ? egg.pets_today : egg.warms_today) : 0
    if (used >= rule.dailyLimit) return json({ ok: false, code: 'limit', message: '오늘은 충분히 돌봤어요. 내일 또 해 주세요!', egg })

    const hatchAt = new Date(Math.max(now.getTime(), new Date(egg.hatch_at).getTime() - rule.minutesOff * 60_000))
    const patch =
      action === 'pet'
        ? { pet_count: egg.pet_count + 1, pets_today: used + 1, warms_today: sameDay ? egg.warms_today : 0 }
        : { warm_count: egg.warm_count + 1, warms_today: used + 1, pets_today: sameDay ? egg.pets_today : 0 }

    // 같은 알에 동시에 요청이 와도 한 번만 반영되도록, 읽은 시점의 값과 같을 때만 고친다
    const { data: updated } = await admin
      .from('eggs')
      .update({ ...patch, care_day: today, hatch_at: hatchAt.toISOString() })
      .eq('id', egg.id)
      .eq('hatch_at', egg.hatch_at)
      .select('*')
      .maybeSingle()
    if (!updated) return json({ ok: false, code: 'busy', message: '잠시 후 다시 해 주세요.', egg: await currentEgg() })
    return json({ ok: true, egg: updated })
  }

  if (action === 'hatch') {
    const { data: egg } = await admin.from('eggs').select('*').eq('id', body.eggId).eq('owner', uid).maybeSingle()
    if (!egg) return json({ ok: false, code: 'no_egg', message: '알을 찾지 못했어요.' })

    // 이미 부화한 알이면 그 몬스터를 다시 돌려준다 (중복 요청 대비)
    if (egg.hatched_at) {
      const { data: existing } = await admin.from('monsters').select('*').eq('id', egg.monster_id).maybeSingle()
      return json({ ok: true, monster: existing })
    }
    if (new Date(egg.hatch_at) > now) return json({ ok: false, code: 'not_ready', message: '아직 알이 깨어날 때가 아니에요.', egg })

    const { data: claimed } = await admin.from('eggs').update({ hatched_at: now.toISOString() }).eq('id', egg.id).is('hatched_at', null).select('id').maybeSingle()
    if (!claimed) return json({ ok: false, code: 'busy', message: '잠시 후 다시 해 주세요.' })

    const rolled = rollMonster(rand, egg.rarity as Rarity, egg.pet_count, egg.warm_count, { bond: EGG.pet.bondShift, active: EGG.warm.activeShift })
    const { data: monster, error } = await admin
      .from('monsters')
      .insert({
        owner: uid,
        species: rolled.species,
        element: rolled.element,
        element2: rolled.element2,
        parts: rolled.parts,
        talents: rolled.talents,
        stats: rolled.stats,
        trait: rolled.trait,
        fav_food: rolled.fav_food,
        disliked_food: rolled.disliked_food,
        personality_active: rolled.personality_active,
        personality_bond: rolled.personality_bond,
        is_shiny: rolled.is_shiny,
        mutation: rolled.mutation,
        hatched_at: now.toISOString(),
      })
      .select('*')
      .single()
    if (error || !monster) {
      await admin.from('eggs').update({ hatched_at: null }).eq('id', egg.id)
      return json({ ok: false, code: 'error', message: '부화에 실패했어요. 다시 시도해 주세요.' }, 500)
    }
    await admin.from('eggs').update({ monster_id: monster.id }).eq('id', egg.id)
    await admin.from('players').update({ main_monster_id: monster.id }).eq('id', uid).is('main_monster_id', null)
    return json({ ok: true, monster })
  }

  return json({ ok: false, code: 'bad_action', message: '알 수 없는 요청이에요.' }, 400)
})
