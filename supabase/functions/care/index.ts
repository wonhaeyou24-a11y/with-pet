// M2 디저트 육성 서버 로직 (Edge Function: care)
// 모든 시간 경과 상태 감소(배고픔·기분·피로·청결), 토핑 급여, 돌보기, 파티세리 훈련, 레벨업, 상점 구매를 서버 시각 기준으로 처리합니다.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify({ ...body, now: new Date().toISOString() }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const dayKey = (now: Date) => new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10)
const expForNextLevel = (level: number) => 60 + level * 40

type Stats = { hp: number; atk: number; def: number; spd: number; int: number; cha: number }
const STAT_KEYS: (keyof Stats)[] = ['hp', 'atk', 'def', 'spd', 'int', 'cha']

const FOODS: Record<
  string,
  { price: number; hunger: number; mood: number; fatigue: number; bonusStat?: keyof Stats; bondShift?: number }
> = {
  '기본 슈가파우더': { price: 20, hunger: 30, mood: 3, fatigue: 0 },
  '우유 생크림': { price: 80, hunger: 60, mood: 8, fatigue: 0 },
  '생딸기 슈가시럽': { price: 45, hunger: 25, mood: 14, fatigue: 0, bonusStat: 'cha' },
  '피스타치오 크림': { price: 60, hunger: 35, mood: 10, fatigue: 0, bonusStat: 'int' },
  '과즙팡 왁싱볼': { price: 60, hunger: 32, mood: 18, fatigue: -4, bonusStat: 'cha' },
  '황금 카다이프칩': { price: 65, hunger: 40, mood: 10, fatigue: 0, bonusStat: 'atk' },
  '메이플 허니버터': { price: 55, hunger: 40, mood: 8, fatigue: -12 },
  '눈꽃 우유빙수': { price: 50, hunger: 22, mood: 20, fatigue: -5, bonusStat: 'spd' },
  '구름 솜사탕': { price: 40, hunger: 15, mood: 25, fatigue: 0, bondShift: 5 },
  '초코 퐁듀볼': { price: 55, hunger: 35, mood: 12, fatigue: 0, bonusStat: 'def' },
}

const TRAININGS: Record<
  string,
  {
    mainStat: keyof Stats
    mainGain: number
    subStat: keyof Stats | null
    subGain: number
    fatigueCost: number
    expGain: number
    coinGain: number
    activeShift: number
    bondShift: number
  }
> = {
  str: { mainStat: 'atk', mainGain: 2, subStat: 'hp', subGain: 1, fatigueCost: 15, expGain: 25, coinGain: 20, activeShift: 4, bondShift: 0 },
  def: { mainStat: 'def', mainGain: 2, subStat: 'hp', subGain: 1, fatigueCost: 15, expGain: 25, coinGain: 20, activeShift: -4, bondShift: 0 },
  spd: { mainStat: 'spd', mainGain: 2, subStat: 'atk', subGain: 1, fatigueCost: 15, expGain: 25, coinGain: 20, activeShift: 5, bondShift: 0 },
  int: { mainStat: 'int', mainGain: 2, subStat: 'cha', subGain: 1, fatigueCost: 15, expGain: 25, coinGain: 20, activeShift: -4, bondShift: 2 },
  hp: { mainStat: 'hp', mainGain: 3, subStat: null, subGain: 0, fatigueCost: 15, expGain: 25, coinGain: 20, activeShift: 0, bondShift: -4 },
}

function applyTimeDecay(monster: Record<string, unknown>, now: Date) {
  const lastCalc = Date.parse(String(monster.last_calc_at ?? now.toISOString()))
  const elapsedHours = Math.max(0, (now.getTime() - lastCalc) / 3600_000)
  if (elapsedHours < 0.05) {
    return {
      hunger: Number(monster.hunger ?? 80),
      mood: Number(monster.mood ?? 80),
      fatigue: Number(monster.fatigue ?? 0),
      cleanliness: Number(monster.cleanliness ?? 100),
      last_calc_at: monster.last_calc_at ?? now.toISOString(),
    }
  }
  return {
    hunger: clamp(Math.round(Number(monster.hunger ?? 80) - elapsedHours * 5), 0, 100),
    mood: clamp(Math.round(Number(monster.mood ?? 80) - elapsedHours * 3), 0, 100),
    fatigue: clamp(Math.round(Number(monster.fatigue ?? 0) - elapsedHours * 4), 0, 100),
    cleanliness: clamp(Math.round(Number(monster.cleanliness ?? 100) - elapsedHours * 2), 0, 100),
    last_calc_at: now.toISOString(),
  }
}

function applyExpAndLevelUp(
  level: number,
  exp: number,
  sp: number,
  stats: Stats,
  talents: Stats,
  addedExp: number,
): { level: number; exp: number; sp: number; stats: Stats; leveledUp: boolean } {
  let nextLevel = level
  let nextExp = exp + addedExp
  let nextSp = sp
  const nextStats = { ...stats }
  let leveledUp = false

  while (nextExp >= expForNextLevel(nextLevel)) {
    nextExp -= expForNextLevel(nextLevel)
    nextLevel += 1
    nextSp += 1
    leveledUp = true
    for (const k of STAT_KEYS) {
      const talentBonus = Math.floor((talents?.[k] ?? 5) / 6)
      nextStats[k] = (nextStats[k] ?? 20) + 1 + talentBonus
    }
  }

  return { level: nextLevel, exp: nextExp, sp: nextSp, stats: nextStats, leveledUp }
}

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
    const foodBag: Record<string, number> = {
      '기본 슈가파우더': 2,
      ...(typeof player.food_bag === 'object' && player.food_bag ? (player.food_bag as Record<string, number>) : {}),
    }
    let freeGranted = false

    // 매일 무료 기본 슈가파우더 2개 지급
    if (player.free_food_day !== today) {
      foodBag['기본 슈가파우더'] = (foodBag['기본 슈가파우더'] ?? 0) + 2
      freeGranted = true
      await admin.from('players').update({ food_bag: foodBag, free_food_day: today }).eq('id', uid)
    }

    if (action === 'buy_food') {
      const foodId = String(body.foodId ?? '')
      const food = FOODS[foodId]
      if (!food) return json({ ok: false, code: 'bad_food', message: '존재하지 않는 토핑이에요.' }, 400)
      if (coins < food.price) {
        return json({ ok: false, code: 'no_coins', message: '코인이 부족해요! 돌보기나 훈련으로 코인을 모아 보세요.' })
      }
      coins -= food.price
      foodBag[foodId] = (foodBag[foodId] ?? 0) + 1
      await admin.from('players').update({ coins, food_bag: foodBag }).eq('id', uid)
      return json({
        ok: true,
        coins,
        foodBag,
        message: `🍰 [${foodId}] 토핑을 구매해 가방에 담았어요!`,
      })
    }

    const { data: monster } = await admin.from('monsters').select('*').eq('id', monsterId).eq('owner', uid).maybeSingle()
    if (!monster) return json({ ok: false, code: 'no_monster', message: '몬스터를 찾지 못했어요.' }, 404)

    const decayed = applyTimeDecay(monster, now)
    let { hunger, mood, fatigue, cleanliness } = decayed
    let active = Number(monster.personality_active ?? 0)
    let bond = Number(monster.personality_bond ?? 0)
    const stats: Stats = { ...(monster.stats as Stats) }
    const talents: Stats = { ...(monster.talents as Stats) }
    let discoveredFav = Boolean(monster.discovered_fav)
    let discoveredDisliked = Boolean(monster.discovered_disliked)
    const recentFoods: string[] = Array.isArray(monster.recent_foods) ? [...monster.recent_foods] : []
    const careCounts: Record<string, number> =
      typeof monster.care_counts === 'object' && monster.care_counts ? { ...(monster.care_counts as Record<string, number>) } : {}

    if (action === 'sync') {
      const { data: synced } = await admin
        .from('monsters')
        .update({ hunger, mood, fatigue, cleanliness, last_calc_at: decayed.last_calc_at })
        .eq('id', monster.id)
        .select('*')
        .single()
      return json({ ok: true, monster: synced ?? monster, coins, foodBag, freeGranted })
    }

    if (action === 'feed') {
      const foodId = String(body.foodId ?? '')
      const food = FOODS[foodId]
      if (!food) return json({ ok: false, code: 'bad_food', message: '알 수 없는 토핑이에요.' }, 400)
      if ((foodBag[foodId] ?? 0) <= 0) {
        return json({ ok: false, code: 'empty_food', message: `[${foodId}] 토핑이 다 떨어졌어요! 상점에서 구해 볼까요?` })
      }

      foodBag[foodId] = Math.max(0, (foodBag[foodId] ?? 1) - 1)
      let mult = 1.0
      let reaction = `🍓 냠냠! [${foodId}] 토핑을 맛있게 먹었어요!`

      if (monster.fav_food === foodId) {
        mult = 1.5
        discoveredFav = true
        mood = clamp(mood + 15, 0, 100)
        reaction = `💖 우와!! 최애 토핑인 [${foodId}]이에요! 행복해서 사르르 녹아요! (효과 1.5배)`
      } else if (monster.disliked_food === foodId) {
        mult = 0.5
        discoveredDisliked = true
        mood = clamp(mood - 5, 0, 100)
        reaction = `💦 으앙… [${foodId}] 토핑은 식감이 안 맞나 봐요 (효과 절반)`
      } else if (recentFoods.length >= 2 && recentFoods.slice(-2).every((f) => f === foodId)) {
        mult = 0.85
        reaction = `🍡 같은 토핑만 먹어서 조금 물렸나 봐요. 골고루 먹이면 보너스가 붙어요!`
      }

      if (monster.trait === '먹보' || monster.trait === '달콤과즙') mult += 0.15

      hunger = clamp(hunger + Math.round(food.hunger * mult), 0, 100)
      mood = clamp(mood + Math.round(food.mood * mult), 0, 100)
      fatigue = clamp(fatigue + food.fatigue, 0, 100)
      if (food.bondShift) bond = clamp(bond + food.bondShift, -100, 100)
      if (food.bonusStat) stats[food.bonusStat] = (stats[food.bonusStat] ?? 20) + 1

      const nextRecent = [...recentFoods.slice(-3), foodId]
      careCounts.feed = (careCounts.feed ?? 0) + 1
      coins += 5

      const lv = applyExpAndLevelUp(Number(monster.level ?? 1), Number(monster.exp ?? 0), Number(monster.sp ?? 0), stats, talents, 10)

      const { data: updated } = await admin
        .from('monsters')
        .update({
          hunger,
          mood,
          fatigue,
          cleanliness,
          personality_bond: bond,
          stats: lv.stats,
          level: lv.level,
          exp: lv.exp,
          sp: lv.sp,
          discovered_fav: discoveredFav,
          discovered_disliked: discoveredDisliked,
          recent_foods: nextRecent,
          care_counts: careCounts,
          last_calc_at: now.toISOString(),
        })
        .eq('id', monster.id)
        .select('*')
        .single()

      await admin.from('players').update({ coins, food_bag: foodBag }).eq('id', uid)
      await admin.from('care_logs').insert({ owner: uid, monster_id: monster.id, action: 'feed', detail: foodId })

      return json({
        ok: true,
        monster: updated,
        coins,
        foodBag,
        leveledUp: lv.leveledUp,
        message: reaction,
      })
    }

    if (action === 'care_action') {
      const kind = String(body.kind ?? '')
      let message = ''
      let expGain = 10
      let coinGain = 12

      if (kind === 'play') {
        if (fatigue >= 90) {
          return json({ ok: false, code: 'tired', message: '💤 너무 노곤해서 놀 힘이 없어요! 먼저 쇼케이스 휴식을 해 주세요.' })
        }
        mood = clamp(mood + 22, 0, 100)
        fatigue = clamp(fatigue + 5, 0, 100)
        active = clamp(active + 3, -100, 100)
        bond = clamp(bond + 3, -100, 100)
        expGain = 12
        coinGain = 15
        careCounts.play = (careCounts.play ?? 0) + 1
        message = '🎈 탱글탱글 볼살을 톡톡 튀기며 신나게 놀았어요! (+15 코인)'
      } else if (kind === 'clean') {
        cleanliness = clamp(cleanliness + 35, 0, 100)
        mood = clamp(mood + 6, 0, 100)
        expGain = 10
        coinGain = 12
        careCounts.clean = (careCounts.clean ?? 0) + 1
        message = '✨ 부스러기를 털고 반짝반짝 슈가 글레이즈 윤기를 냈어요! (+12 코인)'
      } else if (kind === 'rest') {
        fatigue = clamp(fatigue - 35, 0, 100)
        mood = clamp(mood + 5, 0, 100)
        active = clamp(active - 3, -100, 100)
        expGain = 8
        coinGain = 10
        careCounts.rest = (careCounts.rest ?? 0) + 1
        message = '🌙 시원한 파티세리 쇼케이스에서 푹 쉬며 쫀득한 탄력을 되찾았어요! (+10 코인)'
      } else {
        return json({ ok: false, code: 'bad_care', message: '알 수 없는 돌보기 행동이에요.' }, 400)
      }

      coins += coinGain
      const lv = applyExpAndLevelUp(Number(monster.level ?? 1), Number(monster.exp ?? 0), Number(monster.sp ?? 0), stats, talents, expGain)

      const { data: updated } = await admin
        .from('monsters')
        .update({
          hunger,
          mood,
          fatigue,
          cleanliness,
          personality_active: active,
          personality_bond: bond,
          stats: lv.stats,
          level: lv.level,
          exp: lv.exp,
          sp: lv.sp,
          care_counts: careCounts,
          last_calc_at: now.toISOString(),
        })
        .eq('id', monster.id)
        .select('*')
        .single()

      await admin.from('players').update({ coins }).eq('id', uid)
      await admin.from('care_logs').insert({ owner: uid, monster_id: monster.id, action: kind })

      return json({
        ok: true,
        monster: updated,
        coins,
        foodBag,
        leveledUp: lv.leveledUp,
        message,
      })
    }

    if (action === 'train') {
      const courseId = String(body.courseId ?? '')
      const grade = String(body.grade ?? 'great') as 'normal' | 'great' | 'perfect'
      const course = TRAININGS[courseId]
      if (!course) return json({ ok: false, code: 'bad_course', message: '알 수 없는 훈련 코스예요.' }, 400)

      if (fatigue >= 80) {
        return json({
          ok: false,
          code: 'too_tired',
          message: '💤 노곤함이 80 이상이라 반죽이 녹아내려요! 쇼케이스 휴식이나 메이플 허니버터로 피로를 풀어 주세요.',
        })
      }

      const uniqueRecent = new Set(recentFoods.slice(-3)).size
      const varietyBonus = uniqueRecent >= 3 ? 1 : 0
      const perfectBonus = grade === 'perfect' ? 1 : 0
      const moodPenalty = hunger < 25 || mood < 25 ? -1 : 0

      const mainDelta = Math.max(1, course.mainGain + perfectBonus + varietyBonus + moodPenalty)
      const subDelta = course.subStat ? Math.max(1, course.subGain + (grade === 'perfect' ? 1 : 0)) : 0

      stats[course.mainStat] = (stats[course.mainStat] ?? 20) + mainDelta
      if (course.subStat) {
        stats[course.subStat] = (stats[course.subStat] ?? 20) + subDelta
      }

      fatigue = clamp(fatigue + course.fatigueCost, 0, 100)
      hunger = clamp(hunger - 4, 0, 100)
      active = clamp(active + course.activeShift, -100, 100)
      bond = clamp(bond + course.bondShift, -100, 100)
      careCounts[courseId] = (careCounts[courseId] ?? 0) + 1

      const earnedCoins = course.coinGain + (grade === 'perfect' ? 10 : grade === 'great' ? 5 : 0)
      const earnedExp = course.expGain + (grade === 'perfect' ? 10 : 0)
      coins += earnedCoins

      const lv = applyExpAndLevelUp(Number(monster.level ?? 1), Number(monster.exp ?? 0), Number(monster.sp ?? 0), stats, talents, earnedExp)

      const { data: updated } = await admin
        .from('monsters')
        .update({
          hunger,
          mood,
          fatigue,
          cleanliness,
          personality_active: active,
          personality_bond: bond,
          stats: lv.stats,
          level: lv.level,
          exp: lv.exp,
          sp: lv.sp,
          care_counts: careCounts,
          last_calc_at: now.toISOString(),
        })
        .eq('id', monster.id)
        .select('*')
        .single()

      await admin.from('players').update({ coins }).eq('id', uid)
      await admin.from('care_logs').insert({ owner: uid, monster_id: monster.id, action: `train_${courseId}`, detail: grade })

      const gradeBadge = grade === 'perfect' ? '🔥 PERFECT 오븐 타이밍!' : grade === 'great' ? '✨ GREAT!' : '👍 완료!'
      return json({
        ok: true,
        monster: updated,
        coins,
        foodBag,
        leveledUp: lv.leveledUp,
        message: `${gradeBadge} 주 능력치 +${mainDelta}${course.subStat ? `, 보조 +${subDelta}` : ''} 상승! (+${earnedCoins} 코인)`,
      })
    }

    return json({ ok: false, code: 'bad_action', message: '알 수 없는 요청이에요.' }, 400)
  } catch (err) {
    return json({ ok: false, code: 'server_error', message: '서버 처리 중 일시적인 문제가 발생했어요.', detail: String(err) }, 500)
  }
})

