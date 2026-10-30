// M2 디저트 육성 서버 (Edge Function: care)
// 상태 감소·토핑 급여·돌보기·파티세리 훈련·레벨업·상점 구매를 서버 시각 기준으로 처리한다.
// 계산은 logic.ts(순수 코드)가 하고, 여기서는 로그인 확인·DB 읽고 쓰기·동시 요청 보호만 맡는다.
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  applyCareAction,
  applyFeed,
  applyTimeDecay,
  applyTrain,
  buyFood,
  type CareState,
  type Stats,
} from './logic.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify({ ...body, now: new Date().toISOString() }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const dayKey = (now: Date) => new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10)
const BUSY = { ok: false, code: 'busy', message: '잠시 후 다시 해 주세요.' }

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const { data: auth } = await admin.auth.getUser(token)
    const uid = auth.user?.id
    if (!uid) return json({ ok: false, code: 'auth', message: '다시 로그인해 주세요.' }, 401)

    const body = await req.json().catch(() => ({}))
    const action = String(body.action ?? '')
    const monsterId = String(body.monsterId ?? '')
    const now = new Date()
    const today = dayKey(now)

    const { data: player } = await admin.from('players').select('*').eq('id', uid).maybeSingle()
    if (!player) return json({ ok: false, code: 'no_player', message: '플레이어 정보를 찾지 못했어요.' }, 404)

    let coins = Number(player.coins ?? 200)
    let foodBag: Record<string, number> = {
      '기본 슈가파우더': 2,
      ...(typeof player.food_bag === 'object' && player.food_bag ? (player.food_bag as Record<string, number>) : {}),
    }
    let freeGranted = false

    // 매일 무료 기본 슈가파우더 2개: 오늘 날짜 표시를 먼저 선점한 요청 하나만 지급한다 (동시에 와도 두 번 주지 않는다)
    if (player.free_food_day !== today) {
      const { data: claimed } = await admin
        .from('players')
        .update({ free_food_day: today })
        .eq('id', uid)
        .or(`free_food_day.is.null,free_food_day.neq.${today}`)
        .select('id')
        .maybeSingle()
      if (claimed) {
        foodBag = { ...foodBag, '기본 슈가파우더': (foodBag['기본 슈가파우더'] ?? 0) + 2 }
        freeGranted = true
        await admin.from('players').update({ food_bag: foodBag }).eq('id', uid)
      }
    }

    if (action === 'buy_food') {
      const res = buyFood(coins, foodBag, String(body.foodId ?? ''))
      if (!res.ok) return json({ ok: false, code: res.code, message: res.message }, res.status ?? 200)
      // 읽은 시점의 코인과 같을 때만 차감한다 (연타해도 한 번만 계산)
      const { data: paid } = await admin
        .from('players')
        .update({ coins: res.coins, food_bag: res.foodBag })
        .eq('id', uid)
        .eq('coins', coins)
        .select('id')
        .maybeSingle()
      if (!paid) return json(BUSY)
      return json({ ok: true, coins: res.coins, foodBag: res.foodBag, message: res.message })
    }

    const { data: monster } = await admin.from('monsters').select('*').eq('id', monsterId).eq('owner', uid).maybeSingle()
    if (!monster) return json({ ok: false, code: 'no_monster', message: '몬스터를 찾지 못했어요.' }, 404)

    const decayed = applyTimeDecay(
      {
        hunger: Number(monster.hunger ?? 80),
        mood: Number(monster.mood ?? 80),
        fatigue: Number(monster.fatigue ?? 0),
        cleanliness: Number(monster.cleanliness ?? 100),
      },
      monster.last_calc_at,
      now,
    )

    const state: CareState = {
      hunger: decayed.hunger,
      mood: decayed.mood,
      fatigue: decayed.fatigue,
      cleanliness: decayed.cleanliness,
      active: Number(monster.personality_active ?? 0),
      bond: Number(monster.personality_bond ?? 0),
      stats: { ...(monster.stats as Stats) },
      talents: { ...(monster.talents as Stats) },
      level: Number(monster.level ?? 1),
      exp: Number(monster.exp ?? 0),
      sp: Number(monster.sp ?? 0),
      coins,
      foodBag,
      recentFoods: Array.isArray(monster.recent_foods) ? [...monster.recent_foods] : [],
      careCounts: typeof monster.care_counts === 'object' && monster.care_counts ? { ...(monster.care_counts as Record<string, number>) } : {},
      discoveredFav: Boolean(monster.discovered_fav),
      discoveredDisliked: Boolean(monster.discovered_disliked),
      favFood: String(monster.fav_food ?? ''),
      dislikedFood: String(monster.disliked_food ?? ''),
      trait: String(monster.trait ?? ''),
    }

    if (action === 'sync') {
      const { data: synced } = await admin
        .from('monsters')
        .update({
          hunger: state.hunger,
          mood: state.mood,
          fatigue: state.fatigue,
          cleanliness: state.cleanliness,
          last_calc_at: decayed.lastCalcAt,
        })
        .eq('id', monster.id)
        .select('*')
        .single()
      return json({ ok: true, monster: synced ?? monster, coins, foodBag, freeGranted })
    }

    let result
    if (action === 'feed') result = applyFeed(state, String(body.foodId ?? ''))
    else if (action === 'care_action') result = applyCareAction(state, String(body.kind ?? ''))
    else if (action === 'train') {
      const grade = ['normal', 'great', 'perfect'].includes(body.grade) ? body.grade : 'great'
      result = applyTrain(state, String(body.courseId ?? ''), grade)
    } else {
      return json({ ok: false, code: 'bad_action', message: '알 수 없는 요청이에요.' }, 400)
    }

    if (!result.ok) return json({ ok: false, code: result.code, message: result.message }, result.status ?? 200)

    const s = result.state
    // 읽은 시점(last_calc_at)과 같을 때만 저장한다: 같은 몬스터에 요청이 겹치면 먼저 온 하나만 반영된다
    let guard = admin
      .from('monsters')
      .update({
        hunger: s.hunger,
        mood: s.mood,
        fatigue: s.fatigue,
        cleanliness: s.cleanliness,
        personality_active: s.active,
        personality_bond: s.bond,
        stats: s.stats,
        level: s.level,
        exp: s.exp,
        sp: s.sp,
        discovered_fav: s.discoveredFav,
        discovered_disliked: s.discoveredDisliked,
        recent_foods: s.recentFoods,
        care_counts: s.careCounts,
        last_calc_at: now.toISOString(),
      })
      .eq('id', monster.id)
    guard = monster.last_calc_at ? guard.eq('last_calc_at', monster.last_calc_at) : guard.is('last_calc_at', null)
    const { data: updated } = await guard.select('*').maybeSingle()
    if (!updated) return json(BUSY)

    await admin.from('players').update({ coins: s.coins, food_bag: s.foodBag }).eq('id', uid)
    await admin.from('care_logs').insert({ owner: uid, monster_id: monster.id, action: result.logAction, detail: result.logDetail ?? null })

    return json({ ok: true, monster: updated, coins: s.coins, foodBag: s.foodBag, leveledUp: result.leveledUp, message: result.message })
  } catch (err) {
    return json({ ok: false, code: 'server_error', message: '서버 처리 중 일시적인 문제가 발생했어요.', detail: String(err) }, 500)
  }
})
