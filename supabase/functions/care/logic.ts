// M2 돌보기·훈련·상점의 순수 계산 (DB·네트워크 없이 상태를 받아 새 상태를 돌려준다).
// 서버 함수(index.ts)가 이 계산만 호출하고, scripts/test-care.mjs 가 같은 코드를 그대로 검증한다.
// 수치는 기획서 초안이므로 이 파일의 표(FOODS, TRAININGS, DECAY)에서만 고친다.

export type Stats = { hp: number; atk: number; def: number; spd: number; int: number; cha: number }
export const STAT_KEYS: (keyof Stats)[] = ['hp', 'atk', 'def', 'spd', 'int', 'cha']

// 1시간마다 줄어드는 상태값 (접속할 때 지난 시간만큼 한꺼번에 계산한다)
export const DECAY = { hunger: 5, mood: 3, fatigue: 4, cleanliness: 2, minHours: 0.05 }

export const FOODS: Record<
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

export const TRAININGS: Record<
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

export const expForNextLevel = (level: number) => 60 + level * 40

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

// 순수 계산이 다루는 몬스터·플레이어 상태 (DB 행에서 꺼내 와서 계산 뒤 다시 저장한다)
export interface CareState {
  hunger: number
  mood: number
  fatigue: number
  cleanliness: number
  active: number
  bond: number
  stats: Stats
  talents: Stats
  level: number
  exp: number
  sp: number
  coins: number
  foodBag: Record<string, number>
  recentFoods: string[]
  careCounts: Record<string, number>
  discoveredFav: boolean
  discoveredDisliked: boolean
  favFood: string
  dislikedFood: string
  trait: string
}

export type CareResult =
  | { ok: true; state: CareState; leveledUp: boolean; message: string; logAction: string; logDetail?: string }
  | { ok: false; code: string; message: string; status?: number }

const fail = (code: string, message: string, status?: number): CareResult => ({ ok: false, code, message, status })

// 경과 시간만큼 배고픔·기분·피로·청결을 한꺼번에 줄인다
export function applyTimeDecay(
  s: Pick<CareState, 'hunger' | 'mood' | 'fatigue' | 'cleanliness'>,
  lastCalcAt: string | null | undefined,
  now: Date,
) {
  const last = Date.parse(lastCalcAt ?? now.toISOString())
  const hours = Math.max(0, (now.getTime() - last) / 3600_000)
  if (hours < DECAY.minHours) return { ...s, lastCalcAt: lastCalcAt ?? now.toISOString() }
  return {
    hunger: clamp(Math.round(s.hunger - hours * DECAY.hunger), 0, 100),
    mood: clamp(Math.round(s.mood - hours * DECAY.mood), 0, 100),
    fatigue: clamp(Math.round(s.fatigue - hours * DECAY.fatigue), 0, 100),
    cleanliness: clamp(Math.round(s.cleanliness - hours * DECAY.cleanliness), 0, 100),
    lastCalcAt: now.toISOString(),
  }
}

export function applyExpAndLevelUp(s: CareState, addedExp: number) {
  let level = s.level
  let exp = s.exp + addedExp
  let sp = s.sp
  const stats = { ...s.stats }
  let leveledUp = false
  while (exp >= expForNextLevel(level)) {
    exp -= expForNextLevel(level)
    level += 1
    sp += 1
    leveledUp = true
    for (const k of STAT_KEYS) {
      const talentBonus = Math.floor((s.talents?.[k] ?? 5) / 6)
      stats[k] = (stats[k] ?? 20) + 1 + talentBonus
    }
  }
  return { level, exp, sp, stats, leveledUp }
}

export function buyFood(coins: number, foodBag: Record<string, number>, foodId: string) {
  const food = FOODS[foodId]
  if (!food) return fail('bad_food', '존재하지 않는 토핑이에요.', 400)
  if (coins < food.price) return fail('no_coins', '코인이 부족해요! 돌보기나 훈련으로 코인을 모아 보세요.')
  return {
    ok: true as const,
    coins: coins - food.price,
    foodBag: { ...foodBag, [foodId]: (foodBag[foodId] ?? 0) + 1 },
    message: `🍰 [${foodId}] 토핑을 구매해 가방에 담았어요!`,
  }
}

export function applyFeed(s: CareState, foodId: string): CareResult {
  const food = FOODS[foodId]
  if (!food) return fail('bad_food', '알 수 없는 토핑이에요.', 400)
  if ((s.foodBag[foodId] ?? 0) <= 0) return fail('empty_food', `[${foodId}] 토핑이 다 떨어졌어요! 상점에서 구해 볼까요?`)

  const next: CareState = { ...s, stats: { ...s.stats }, foodBag: { ...s.foodBag }, careCounts: { ...s.careCounts } }
  next.foodBag[foodId] = Math.max(0, (next.foodBag[foodId] ?? 1) - 1)

  let mult = 1.0
  let reaction = `🍓 냠냠! [${foodId}] 토핑을 맛있게 먹었어요!`
  if (s.favFood === foodId) {
    mult = 1.5
    next.discoveredFav = true
    next.mood = clamp(next.mood + 15, 0, 100)
    reaction = `💖 우와!! 최애 토핑인 [${foodId}]이에요! 행복해서 사르르 녹아요! (효과 1.5배)`
  } else if (s.dislikedFood === foodId) {
    mult = 0.5
    next.discoveredDisliked = true
    next.mood = clamp(next.mood - 5, 0, 100)
    reaction = `💦 으앙… [${foodId}] 토핑은 식감이 안 맞나 봐요 (효과 절반)`
  } else if (s.recentFoods.length >= 2 && s.recentFoods.slice(-2).every((f) => f === foodId)) {
    mult = 0.85
    reaction = `🍡 같은 토핑만 먹어서 조금 물렸나 봐요. 골고루 먹이면 보너스가 붙어요!`
  }
  if (s.trait === '먹보' || s.trait === '달콤과즙') mult += 0.15

  next.hunger = clamp(next.hunger + Math.round(food.hunger * mult), 0, 100)
  next.mood = clamp(next.mood + Math.round(food.mood * mult), 0, 100)
  next.fatigue = clamp(next.fatigue + food.fatigue, 0, 100)
  if (food.bondShift) next.bond = clamp(next.bond + food.bondShift, -100, 100)
  if (food.bonusStat) next.stats[food.bonusStat] = (next.stats[food.bonusStat] ?? 20) + 1
  next.recentFoods = [...s.recentFoods.slice(-3), foodId]
  next.careCounts.feed = (next.careCounts.feed ?? 0) + 1
  next.coins += 5

  const lv = applyExpAndLevelUp(next, 10)
  Object.assign(next, { level: lv.level, exp: lv.exp, sp: lv.sp, stats: lv.stats })
  return { ok: true, state: next, leveledUp: lv.leveledUp, message: reaction, logAction: 'feed', logDetail: foodId }
}

export function applyCareAction(s: CareState, kind: string): CareResult {
  const next: CareState = { ...s, careCounts: { ...s.careCounts } }
  let message = ''
  let expGain = 10
  let coinGain = 12

  if (kind === 'play') {
    if (s.fatigue >= 90) return fail('tired', '💤 너무 노곤해서 놀 힘이 없어요! 먼저 쇼케이스 휴식을 해 주세요.')
    next.mood = clamp(s.mood + 22, 0, 100)
    next.fatigue = clamp(s.fatigue + 5, 0, 100)
    next.active = clamp(s.active + 3, -100, 100)
    next.bond = clamp(s.bond + 3, -100, 100)
    expGain = 12
    coinGain = 15
    next.careCounts.play = (next.careCounts.play ?? 0) + 1
    message = '🎈 탱글탱글 볼살을 톡톡 튀기며 신나게 놀았어요! (+15 코인)'
  } else if (kind === 'clean') {
    next.cleanliness = clamp(s.cleanliness + 35, 0, 100)
    next.mood = clamp(s.mood + 6, 0, 100)
    next.careCounts.clean = (next.careCounts.clean ?? 0) + 1
    message = '✨ 부스러기를 털고 반짝반짝 슈가 글레이즈 윤기를 냈어요! (+12 코인)'
  } else if (kind === 'rest') {
    next.fatigue = clamp(s.fatigue - 35, 0, 100)
    next.mood = clamp(s.mood + 5, 0, 100)
    next.active = clamp(s.active - 3, -100, 100)
    expGain = 8
    coinGain = 10
    next.careCounts.rest = (next.careCounts.rest ?? 0) + 1
    message = '🌙 시원한 파티세리 쇼케이스에서 푹 쉬며 쫀득한 탄력을 되찾았어요! (+10 코인)'
  } else {
    return fail('bad_care', '알 수 없는 돌보기 행동이에요.', 400)
  }

  next.coins += coinGain
  const lv = applyExpAndLevelUp(next, expGain)
  Object.assign(next, { level: lv.level, exp: lv.exp, sp: lv.sp, stats: lv.stats })
  return { ok: true, state: next, leveledUp: lv.leveledUp, message, logAction: kind }
}

// coinRoom: 오늘 더 받을 수 있는 코인 (기본은 제한 없음). 넘으면 코인만 줄고 능력치·경험치는 그대로 오른다.
export function applyTrain(
  s: CareState,
  courseId: string,
  grade: 'normal' | 'great' | 'perfect',
  coinRoom = Number.POSITIVE_INFINITY,
): CareResult {
  const course = TRAININGS[courseId]
  if (!course) return fail('bad_course', '알 수 없는 훈련 코스예요.', 400)
  if (s.fatigue >= 80) {
    return fail('too_tired', '💤 노곤함이 80 이상이라 반죽이 녹아내려요! 쇼케이스 휴식이나 메이플 허니버터로 피로를 풀어 주세요.')
  }

  const next: CareState = { ...s, stats: { ...s.stats }, careCounts: { ...s.careCounts } }
  const varietyBonus = new Set(s.recentFoods.slice(-3)).size >= 3 ? 1 : 0
  const perfectBonus = grade === 'perfect' ? 1 : 0
  const moodPenalty = s.hunger < 25 || s.mood < 25 ? -1 : 0
  const mainDelta = Math.max(1, course.mainGain + perfectBonus + varietyBonus + moodPenalty)
  const subDelta = course.subStat ? Math.max(1, course.subGain + (grade === 'perfect' ? 1 : 0)) : 0

  next.stats[course.mainStat] = (next.stats[course.mainStat] ?? 20) + mainDelta
  if (course.subStat) next.stats[course.subStat] = (next.stats[course.subStat] ?? 20) + subDelta
  next.fatigue = clamp(s.fatigue + course.fatigueCost, 0, 100)
  next.hunger = clamp(s.hunger - 4, 0, 100)
  next.active = clamp(s.active + course.activeShift, -100, 100)
  next.bond = clamp(s.bond + course.bondShift, -100, 100)
  next.careCounts[courseId] = (next.careCounts[courseId] ?? 0) + 1

  const rawCoins = course.coinGain + (grade === 'perfect' ? 10 : grade === 'great' ? 5 : 0)
  const earnedCoins = Math.min(rawCoins, coinRoom)
  const earnedExp = course.expGain + (grade === 'perfect' ? 10 : 0)
  next.coins += earnedCoins

  const lv = applyExpAndLevelUp(next, earnedExp)
  Object.assign(next, { level: lv.level, exp: lv.exp, sp: lv.sp, stats: lv.stats })
  const badge = grade === 'perfect' ? '🔥 PERFECT 오븐 타이밍!' : grade === 'great' ? '✨ GREAT!' : '👍 완료!'
  return {
    ok: true,
    state: next,
    leveledUp: lv.leveledUp,
    message: `${badge} 주 능력치 +${mainDelta}${course.subStat ? `, 보조 +${subDelta}` : ''} 상승! (+${earnedCoins} 코인${earnedCoins < rawCoins ? ', 오늘 코인 한도에 도달했어요' : ''})`,
    logAction: `train_${courseId}`,
    logDetail: grade,
  }
}
