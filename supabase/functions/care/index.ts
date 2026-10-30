// M2 디저트 육성 서버 (Edge Function: care)
// 상태 감소·토핑 급여·돌보기·파티세리 훈련(시작/완료)·디저트 타워(출발/복귀)·상점 구매를 서버 시각 기준으로 처리한다.
// 계산은 logic.ts(순수 코드)가 하고, 여기서는 로그인 확인·DB 읽고 쓰기·동시 요청 보호만 맡는다.
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  ACTIVITY,
  applyTowerClaim,
  battlePower,
  coinRoomToday,
  remainingSeconds,
  rollGrade,
  towerFloorsCleared,
  towerSecPerFloor,
} from './activity.ts'
import {
  applyCareAction,
  applyFeed,
  applyTimeDecay,
  applyTrain,
  buyFood,
  type CareState,
  TRAININGS,
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

    // 몬스터 저장: 읽은 시점(last_calc_at)과 같을 때만 저장한다 (같은 몬스터에 요청이 겹치면 먼저 온 하나만 반영된다)
    const saveMonster = async (s: CareState, extra: Record<string, unknown> = {}) => {
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
          ...extra,
        })
        .eq('id', monster.id)
      guard = monster.last_calc_at ? guard.eq('last_calc_at', monster.last_calc_at) : guard.is('last_calc_at', null)
      const { data } = await guard.select('*').maybeSingle()
      return data
    }

    // 오늘 훈련·타워로 이미 받은 코인 (날짜가 바뀌면 0부터)
    const earnedToday = player.earn_day === today ? Number(player.earn_coins ?? 0) : 0
    const saveEarnings = (newCoins: number, gained: number) =>
      admin
        .from('players')
        .update({ coins: newCoins, food_bag: foodBag, earn_day: today, earn_coins: earnedToday + Math.max(0, gained) })
        .eq('id', uid)

    const entriesUsedToday = player.tower_day === today ? Number(player.tower_entries ?? 0) : 0
    const sessionOut = (row: Record<string, unknown>) => ({
      id: row.id,
      kind: row.kind,
      courseId: row.course_id ?? null,
      startFloor: row.start_floor ?? null,
      maxFloors: row.max_floors ?? null,
      secPerFloor: row.sec_per_floor ?? null,
      startedAt: row.started_at,
      finishAt: row.finish_at,
    })
    const getActive = async (kind: 'train' | 'tower') => {
      const { data } = await admin
        .from('activity_sessions')
        .select('*')
        .eq('monster_id', monster.id)
        .eq('kind', kind)
        .eq('status', 'active')
        .maybeSingle()
      return data
    }
    const newSeed = () => Math.floor(Math.random() * 2_000_000_000)

    // 진행 중인 훈련·타워와 타워 현황 (다른 기기에서 시작한 것도 이어서 볼 수 있다)
    if (action === 'activity') {
      const [train, tower] = await Promise.all([getActive('train'), getActive('tower')])
      return json({
        ok: true,
        train: train ? sessionOut(train) : null,
        tower: tower ? sessionOut(tower) : null,
        towerFloor: Number(monster.tower_floor ?? 1),
        towerEntriesLeft: Math.max(0, ACTIVITY.tower.dailyEntries - entriesUsedToday),
        coinRoom: coinRoomToday(earnedToday),
      })
    }

    if (action === 'train_start') {
      const courseId = String(body.courseId ?? '')
      const seconds = ACTIVITY.trainSeconds[courseId]
      if (!seconds || !TRAININGS[courseId]) return json({ ok: false, code: 'bad_course', message: '알 수 없는 훈련 코스예요.' }, 400)
      if (state.fatigue >= 80) {
        return json({ ok: false, code: 'too_tired', message: '💤 노곤함이 80 이상이라 반죽이 녹아내려요! 쇼케이스 휴식이나 메이플 허니버터로 피로를 풀어 주세요.' })
      }
      const existing = await getActive('train')
      if (existing) return json({ ok: true, session: sessionOut(existing), already: true })
      const { data: created, error } = await admin
        .from('activity_sessions')
        .insert({
          owner: uid,
          monster_id: monster.id,
          kind: 'train',
          course_id: courseId,
          seed: newSeed(),
          started_at: now.toISOString(),
          finish_at: new Date(now.getTime() + seconds * 1000).toISOString(),
        })
        .select('*')
        .single()
      if (error || !created) return json(BUSY)
      return json({ ok: true, session: sessionOut(created) })
    }

    if (action === 'train_finish') {
      const sess = await getActive('train')
      if (!sess) return json({ ok: false, code: 'no_session', message: '진행 중인 훈련이 없어요.' })
      const left = remainingSeconds(sess.finish_at, now)
      if (left > 0) return json({ ok: false, code: 'not_yet', message: `⏳ 아직 훈련 중이에요! ${left}초 뒤에 받을 수 있어요.`, remaining: left })

      const result = applyTrain(state, String(sess.course_id), rollGrade(Number(sess.seed)), coinRoomToday(earnedToday))
      if (!result.ok) return json({ ok: false, code: result.code, message: result.message }, result.status ?? 200)

      // 보상을 주기 전에 세션을 먼저 '받음'으로 바꾼다 (연타해도 한 번만 지급)
      const { data: claimed } = await admin
        .from('activity_sessions')
        .update({ status: 'claimed', claimed_at: now.toISOString() })
        .eq('id', sess.id)
        .eq('status', 'active')
        .select('id')
        .maybeSingle()
      if (!claimed) return json(BUSY)

      const updated = await saveMonster(result.state)
      if (!updated) {
        await admin.from('activity_sessions').update({ status: 'active', claimed_at: null }).eq('id', sess.id)
        return json(BUSY)
      }
      await saveEarnings(result.state.coins, result.state.coins - state.coins)
      await admin.from('care_logs').insert({ owner: uid, monster_id: monster.id, action: result.logAction, detail: result.logDetail ?? null })
      return json({ ok: true, monster: updated, coins: result.state.coins, foodBag, leveledUp: result.leveledUp, message: result.message })
    }

    if (action === 'tower_start') {
      if (state.fatigue >= ACTIVITY.tower.fatigueBlock) {
        return json({ ok: false, code: 'too_tired', message: '💤 노곤함이 높아 탐험할 수 없어요! 먼저 쉬게 해 주세요.' })
      }
      const existing = await getActive('tower')
      if (existing) return json({ ok: true, session: sessionOut(existing), already: true })
      if (entriesUsedToday >= ACTIVITY.tower.dailyEntries) {
        return json({ ok: false, code: 'no_entries', message: '🏰 오늘 타워 입장 횟수를 모두 썼어요. 내일 다시 도전해요!' })
      }

      const startFloor = Number(monster.tower_floor ?? 1)
      // 장착 장비 능력치도 전투력에 포함한다
      const { data: gearBonus } = await admin.rpc('gear_bonus', { p_monster: monster.id })
      const gb = (gearBonus ?? {}) as Partial<Stats>
      const gearedStats: Stats = {
        hp: state.stats.hp + (gb.hp ?? 0),
        atk: state.stats.atk + (gb.atk ?? 0),
        def: state.stats.def + (gb.def ?? 0),
        spd: state.stats.spd + (gb.spd ?? 0),
        int: state.stats.int + (gb.int ?? 0),
        cha: state.stats.cha + (gb.cha ?? 0),
      }
      const secPerFloor = towerSecPerFloor(battlePower(gearedStats), startFloor)
      const maxFloors = ACTIVITY.tower.maxFloors
      // 입장 횟수를 먼저 차감한다 (읽은 값과 같을 때만, 연타해도 한 번만)
      let entryGuard = admin.from('players').update({ tower_day: today, tower_entries: entriesUsedToday + 1 }).eq('id', uid)
      entryGuard = player.tower_day === today ? entryGuard.eq('tower_entries', entriesUsedToday).eq('tower_day', today) : entryGuard.eq('tower_entries', Number(player.tower_entries ?? 0))
      const { data: entered } = await entryGuard.select('id').maybeSingle()
      if (!entered) return json(BUSY)

      const { data: created, error } = await admin
        .from('activity_sessions')
        .insert({
          owner: uid,
          monster_id: monster.id,
          kind: 'tower',
          start_floor: startFloor,
          max_floors: maxFloors,
          sec_per_floor: secPerFloor,
          seed: newSeed(),
          started_at: now.toISOString(),
          finish_at: new Date(now.getTime() + secPerFloor * maxFloors * 1000).toISOString(),
        })
        .select('*')
        .single()
      if (error || !created) {
        await admin.from('players').update({ tower_entries: entriesUsedToday }).eq('id', uid)
        return json(BUSY)
      }
      return json({ ok: true, session: sessionOut(created), towerEntriesLeft: Math.max(0, ACTIVITY.tower.dailyEntries - entriesUsedToday - 1) })
    }

    if (action === 'tower_finish') {
      const sess = await getActive('tower')
      if (!sess) return json({ ok: false, code: 'no_session', message: '진행 중인 탐험이 없어요.' })
      const floors = towerFloorsCleared(sess.started_at, Number(sess.sec_per_floor), Number(sess.max_floors), now)
      if (floors < 1) {
        const left = Math.max(1, Math.ceil(Number(sess.sec_per_floor) - (now.getTime() - Date.parse(sess.started_at)) / 1000))
        return json({ ok: false, code: 'not_yet', message: `⏳ 첫 층을 오르는 중이에요! ${left}초 뒤에 돌아올 수 있어요.`, remaining: left })
      }

      const result = applyTowerClaim(state, Number(sess.start_floor), floors, coinRoomToday(earnedToday))
      if (!result.ok) return json({ ok: false, code: result.code, message: result.message })

      const { data: claimed } = await admin
        .from('activity_sessions')
        .update({ status: 'claimed', claimed_at: now.toISOString() })
        .eq('id', sess.id)
        .eq('status', 'active')
        .select('id')
        .maybeSingle()
      if (!claimed) return json(BUSY)

      const newFloor = Number(sess.start_floor) + floors
      const updated = await saveMonster(result.state, { tower_floor: Math.max(Number(monster.tower_floor ?? 1), newFloor) })
      if (!updated) {
        await admin.from('activity_sessions').update({ status: 'active', claimed_at: null }).eq('id', sess.id)
        return json(BUSY)
      }
      await saveEarnings(result.state.coins, result.coinsGain)
      await admin.from('care_logs').insert({ owner: uid, monster_id: monster.id, action: 'tower', detail: `${sess.start_floor}~${newFloor - 1}층` })
      // 보스 층(5층마다)을 지났으면 장비를 받는다 (이 구간은 처음 오르는 층이라 같은 층으로 반복해서 받을 수 없다)
      const { data: gearDrops } = await admin.rpc('gear_tower_drop', { p_owner: uid, p_from: Number(sess.start_floor), p_to: newFloor - 1 })
      return json({
        ok: true,
        monster: updated,
        coins: result.state.coins,
        foodBag,
        leveledUp: result.leveledUp,
        message: result.message,
        floorsCleared: floors,
        towerFloor: newFloor,
        expGain: result.expGain,
        coinsGain: result.coinsGain,
        gearDrops: gearDrops ?? [],
      })
    }

    let result
    if (action === 'feed') result = applyFeed(state, String(body.foodId ?? ''))
    else if (action === 'care_action') result = applyCareAction(state, String(body.kind ?? ''))
    else {
      // 훈련 결과는 train_start → train_finish 로만 받을 수 있다 (폰이 보낸 등급은 믿지 않는다)
      return json({ ok: false, code: 'bad_action', message: '알 수 없는 요청이에요.' }, 400)
    }

    if (!result.ok) return json({ ok: false, code: result.code, message: result.message }, result.status ?? 200)

    const updated = await saveMonster(result.state)
    if (!updated) return json(BUSY)

    await admin.from('players').update({ coins: result.state.coins, food_bag: result.state.foodBag }).eq('id', uid)
    await admin.from('care_logs').insert({ owner: uid, monster_id: monster.id, action: result.logAction, detail: result.logDetail ?? null })

    return json({ ok: true, monster: updated, coins: result.state.coins, foodBag: result.state.foodBag, leveledUp: result.leveledUp, message: result.message })
  } catch (err) {
    return json({ ok: false, code: 'server_error', message: '서버 처리 중 일시적인 문제가 발생했어요.', detail: String(err) }, 500)
  }
})
