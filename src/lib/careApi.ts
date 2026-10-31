// M2 돌보기·토핑 가방·베이커리 상점·파티세리 훈련 API 클라이언트 (자가 복구 및 로컬 폴백 내장)
// 서버 Edge Function(`care`)을 우선 호출하며, 미배포 또는 오프라인 환경에서도 앱이 절대 멈추지 않고
// 동일한 규칙으로 안전하게 동작하도록 Zero-Crash Self-Healing 폴백을 지원합니다.

import { DESSERT_FOODS, expForNextLevel, TRAINING_COURSES, type TrainingId } from '../config/care'
import { serverNow, syncServerTime, type MonsterRow, type Stats } from './api'
import { IS_DEV_MOCK } from './devMode'
import { NETWORK_MESSAGE, readFunctionError, SERVER_TIMEOUT_MS, withTimeout } from './net'
import { supabase } from './supabase'

export interface CareResponse {
  ok: boolean
  code?: string
  message?: string
  monster?: MonsterRow
  coins?: number
  foodBag?: Record<string, number>
  freeGranted?: boolean
  leveledUp?: boolean
}

const LOCAL_CARE_PREFIX = 'pet_m2_care_state_v1_'
const STAT_KEYS: (keyof Stats)[] = ['hp', 'atk', 'def', 'spd', 'int', 'cha']
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

interface LocalCareCache {
  monster: MonsterRow
  coins: number
  foodBag: Record<string, number>
  freeFoodDay: string
}

function loadLocalCareCache(monster: MonsterRow, initialCoins = 200): LocalCareCache {
  try {
    const raw = localStorage.getItem(LOCAL_CARE_PREFIX + monster.id)
    if (raw) {
      const parsed = JSON.parse(raw) as LocalCareCache
      if (parsed && parsed.monster && parsed.foodBag) {
        return {
          ...parsed,
          monster: {
            ...monster,
            ...parsed.monster,
            name: monster.name ?? parsed.monster.name,
          },
        }
      }
    }
  } catch {
    // 스토리지 접근 제한 시 메모리 기본값으로 폴백
  }
  return {
    monster: {
      ...monster,
      hunger: monster.hunger ?? 80,
      mood: monster.mood ?? 80,
      fatigue: monster.fatigue ?? 0,
      cleanliness: monster.cleanliness ?? 100,
      exp: monster.exp ?? 0,
      sp: monster.sp ?? 0,
      fav_food: monster.fav_food ?? '생딸기 슈가시럽',
      disliked_food: monster.disliked_food ?? '초코 퐁듀볼',
      discovered_fav: monster.discovered_fav ?? false,
      discovered_disliked: monster.discovered_disliked ?? false,
      recent_foods: monster.recent_foods ?? [],
      care_counts: monster.care_counts ?? {},
      last_calc_at: monster.last_calc_at ?? new Date(serverNow()).toISOString(),
    },
    coins: Math.max(initialCoins, 200),
    foodBag: {
      '기본 슈가파우더': 3,
      '생딸기 슈가시럽': 1,
      '피스타치오 크림': 1,
      '황금 카다이프칩': 1,
    },
    freeFoodDay: '',
  }
}

function saveLocalCareCache(monsterId: string, cache: LocalCareCache) {
  try {
    localStorage.setItem(LOCAL_CARE_PREFIX + monsterId, JSON.stringify(cache))
  } catch {
    // 스토리지 예외 무시 (Zero-Crash)
  }
}

function applyExpAndLevel(
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

// 자가 복구(Self-Healing) 로컬 연산 엔진
function runLocalCareFallback(
  baseMonster: MonsterRow,
  initialCoins: number,
  action: 'sync' | 'feed' | 'care_action' | 'train' | 'buy_food',
  params: { foodId?: string; kind?: 'play' | 'clean' | 'rest'; courseId?: TrainingId; grade?: 'normal' | 'great' | 'perfect' },
): CareResponse {
  try {
    const cache = loadLocalCareCache(baseMonster, initialCoins)
    const nowMs = serverNow()
    const today = new Date(nowMs + 9 * 3600_000).toISOString().slice(0, 10)
    let freeGranted = false

    if (cache.freeFoodDay !== today) {
      cache.foodBag['기본 슈가파우더'] = (cache.foodBag['기본 슈가파우더'] ?? 0) + 2
      cache.freeFoodDay = today
      freeGranted = true
    }

    // 경과 시간에 따른 상태 변화 반영
    const lastMs = Date.parse(cache.monster.last_calc_at ?? new Date(nowMs).toISOString())
    const elapsedHours = Math.max(0, (nowMs - lastMs) / 3600_000)
    if (elapsedHours >= 0.05) {
      cache.monster.hunger = clamp(Math.round((cache.monster.hunger ?? 80) - elapsedHours * 5), 0, 100)
      cache.monster.mood = clamp(Math.round((cache.monster.mood ?? 80) - elapsedHours * 3), 0, 100)
      cache.monster.fatigue = clamp(Math.round((cache.monster.fatigue ?? 0) - elapsedHours * 4), 0, 100)
      cache.monster.cleanliness = clamp(Math.round((cache.monster.cleanliness ?? 100) - elapsedHours * 2), 0, 100)
      cache.monster.last_calc_at = new Date(nowMs).toISOString()
    }

    if (action === 'sync') {
      saveLocalCareCache(baseMonster.id, cache)
      return {
        ok: true,
        monster: cache.monster,
        coins: cache.coins,
        foodBag: { ...cache.foodBag },
        freeGranted,
      }
    }

    if (action === 'buy_food') {
      const food = DESSERT_FOODS.find((f) => f.id === params.foodId)
      if (!food) return { ok: false, code: 'bad_food', message: '존재하지 않는 토핑이에요.' }
      if (cache.coins < food.price) {
        return { ok: false, code: 'no_coins', message: '코인이 부족해요! 돌보기나 파티세리 훈련으로 코인을 모아 보세요.' }
      }
      cache.coins -= food.price
      cache.foodBag[food.id] = (cache.foodBag[food.id] ?? 0) + 1
      saveLocalCareCache(baseMonster.id, cache)
      return {
        ok: true,
        monster: cache.monster,
        coins: cache.coins,
        foodBag: { ...cache.foodBag },
        message: `🍰 [${food.name}] 토핑을 구매해 가방에 담았어요!`,
      }
    }

    const m = { ...cache.monster, stats: { ...cache.monster.stats } }
    const recentFoods = [...(m.recent_foods ?? [])]
    const careCounts = { ...(m.care_counts ?? {}) }

    if (action === 'feed') {
      const food = DESSERT_FOODS.find((f) => f.id === params.foodId)
      if (!food) return { ok: false, code: 'bad_food', message: '알 수 없는 토핑이에요.' }

      // 🍓 포만감 가드: 당충전이 이미 100%이면 과식 방지
      if ((m.hunger ?? 80) >= 100) {
        return {
          ok: false,
          code: 'full',
          message: '😋 배가 빵빵해서 더는 들어가지 않아요! (포만감 100% 달성)',
        }
      }

      if ((cache.foodBag[food.id] ?? 0) <= 0) {
        return { ok: false, code: 'empty_food', message: `[${food.name}] 토핑이 다 떨어졌어요! 베이커리 상점에서 구해 볼까요?` }
      }

      cache.foodBag[food.id] = Math.max(0, (cache.foodBag[food.id] ?? 1) - 1)
      let mult = 1.0
      let reaction = `🍓 냠냠! [${food.name}] 토핑을 맛있게 먹었어요! (+5 코인)`

      if (m.fav_food === food.id) {
        mult = 1.5
        m.discovered_fav = true
        m.mood = clamp((m.mood ?? 80) + 15, 0, 100)
        reaction = `💖 우와!! 최애 토핑인 [${food.name}]이에요! 행복해서 사르르 녹아요! (효과 1.5배)`
      } else if (m.disliked_food === food.id) {
        mult = 0.5
        m.discovered_disliked = true
        m.mood = clamp((m.mood ?? 80) - 5, 0, 100)
        reaction = `💦 으앙… [${food.name}] 토핑은 식감이 안 맞나 봐요 (효과 절반)`
      } else if (recentFoods.length >= 2 && recentFoods.slice(-2).every((f) => f === food.id)) {
        mult = 0.85
        reaction = `🍡 같은 토핑만 연속으로 먹어서 조금 물렸나 봐요. 골고루 먹이면 보너스가 붙어요!`
      }

      if (m.trait === '먹보' || m.trait === '달콤과즙') mult += 0.15

      m.hunger = clamp((m.hunger ?? 80) + Math.round(food.hunger * mult), 0, 100)
      m.mood = clamp((m.mood ?? 80) + Math.round(food.mood * mult), 0, 100)
      m.fatigue = clamp((m.fatigue ?? 0) + food.fatigue, 0, 100)
      if (food.bondShift) m.personality_bond = clamp(m.personality_bond + food.bondShift, -100, 100)
      if (food.bonusStat) m.stats[food.bonusStat] = (m.stats[food.bonusStat] ?? 20) + 1

      m.recent_foods = [...recentFoods.slice(-3), food.id]
      careCounts.feed = (careCounts.feed ?? 0) + 1
      m.care_counts = careCounts
      cache.coins += 5

      const lv = applyExpAndLevel(m.level, m.exp ?? 0, m.sp ?? 0, m.stats, m.talents, 10)
      m.level = lv.level
      m.exp = lv.exp
      m.sp = lv.sp
      m.stats = lv.stats
      m.last_calc_at = new Date(nowMs).toISOString()

      cache.monster = m
      saveLocalCareCache(baseMonster.id, cache)
      return {
        ok: true,
        monster: m,
        coins: cache.coins,
        foodBag: { ...cache.foodBag },
        leveledUp: lv.leveledUp,
        message: reaction,
      }
    }

    if (action === 'care_action') {
      const kind = params.kind ?? 'play'
      let expGain = 10
      let coinGain = 12
      let message = ''

      if (kind === 'play') {
        if ((m.fatigue ?? 0) >= 80) {
          return { ok: false, code: 'tired', message: '💤 너무 노곤해서 놀 힘이 없어요! 먼저 쇼케이스 낮잠 휴식을 해 주세요.' }
        }
        m.mood = clamp((m.mood ?? 80) + 20, 0, 100)
        m.fatigue = clamp((m.fatigue ?? 0) + 16, 0, 100) // 신나게 놀아서 피로도 누적
        m.hunger = clamp((m.hunger ?? 80) - 8, 0, 100) // 신체 활동으로 당 소모 (선순환)
        m.personality_active = clamp(m.personality_active + 3, -100, 100)
        m.personality_bond = clamp(m.personality_bond + 3, -100, 100)
        expGain = 12
        coinGain = 15
        careCounts.play = (careCounts.play ?? 0) + 1
        message = '🎈 탱글탱글 볼살을 톡톡 튀기며 신나게 놀았어요! (노곤함 +16, 당충전 -8, +15 코인)'
      } else if (kind === 'clean') {
        if ((m.cleanliness ?? 100) >= 100) {
          return { ok: false, code: 'already_clean', message: '✨ 이미 온몸이 눈부시게 깨끗해서 더 닦을 부스러기가 없어요!' }
        }
        m.cleanliness = clamp((m.cleanliness ?? 100) + 35, 0, 100)
        m.mood = clamp((m.mood ?? 80) + 6, 0, 100)
        expGain = 10
        coinGain = 12
        careCounts.clean = (careCounts.clean ?? 0) + 1
        message = '✨ 부스러기를 털고 반짝반짝 슈가 글레이즈 윤기를 냈어요! (+12 코인)'
      } else {
        if ((m.fatigue ?? 0) <= 10) {
          return { ok: false, code: 'not_tired', message: '✨ 지금은 노곤함 없이 아주 쌩쌩해요! (낮잠 휴식 불필요)' }
        }
        m.fatigue = clamp((m.fatigue ?? 0) - 40, 0, 100)
        m.hunger = clamp((m.hunger ?? 80) - 10, 0, 100) // 푹 자고 일어나서 당 소모 (배고픔 발생 -> 먹이기 선순환)
        m.mood = clamp((m.mood ?? 80) + 5, 0, 100)
        m.personality_active = clamp(m.personality_active - 3, -100, 100)
        expGain = 8
        coinGain = 10
        careCounts.rest = (careCounts.rest ?? 0) + 1
        message = '🌙 시원한 쇼케이스에서 푹 자고 쫀득한 탄력을 되찾았어요! (노곤함 -40, 당충전 -10, +10 코인)'
      }

      m.care_counts = careCounts
      cache.coins += coinGain
      const lv = applyExpAndLevel(m.level, m.exp ?? 0, m.sp ?? 0, m.stats, m.talents, expGain)
      m.level = lv.level
      m.exp = lv.exp
      m.sp = lv.sp
      m.stats = lv.stats
      m.last_calc_at = new Date(nowMs).toISOString()

      cache.monster = m
      saveLocalCareCache(baseMonster.id, cache)
      return {
        ok: true,
        monster: m,
        coins: cache.coins,
        foodBag: { ...cache.foodBag },
        leveledUp: lv.leveledUp,
        message,
      }
    }

    if (action === 'train') {
      const course = TRAINING_COURSES.find((c) => c.id === params.courseId)
      if (!course) return { ok: false, code: 'bad_course', message: '알 수 없는 훈련 코스예요.' }
      if ((m.fatigue ?? 0) >= 80) {
        return {
          ok: false,
          code: 'too_tired',
          message: '💤 노곤함이 80 이상이라 반죽이 녹아내려요! 쇼케이스 휴식이나 메이플 허니버터로 피로를 풀어 주세요.',
        }
      }

      const grade = params.grade ?? 'great'
      const uniqueRecent = new Set((m.recent_foods ?? []).slice(-3)).size
      const varietyBonus = uniqueRecent >= 3 ? 1 : 0
      const perfectBonus = grade === 'perfect' ? 1 : 0
      const moodPenalty = (m.hunger ?? 80) < 25 || (m.mood ?? 80) < 25 ? -1 : 0

      const mainDelta = Math.max(1, course.mainGain + perfectBonus + varietyBonus + moodPenalty)
      const subDelta = course.subStat ? Math.max(1, course.subGain + (grade === 'perfect' ? 1 : 0)) : 0

      m.stats[course.mainStat] = (m.stats[course.mainStat] ?? 20) + mainDelta
      if (course.subStat) {
        m.stats[course.subStat] = (m.stats[course.subStat] ?? 20) + subDelta
      }

      m.fatigue = clamp((m.fatigue ?? 0) + course.fatigueCost, 0, 100)
      m.hunger = clamp((m.hunger ?? 80) - 4, 0, 100)
      m.personality_active = clamp(m.personality_active + course.personalityShift.active, -100, 100)
      m.personality_bond = clamp(m.personality_bond + course.personalityShift.bond, -100, 100)
      careCounts[course.id] = (careCounts[course.id] ?? 0) + 1
      m.care_counts = careCounts

      const earnedCoins = course.coinGain + (grade === 'perfect' ? 10 : grade === 'great' ? 5 : 0)
      const earnedExp = course.expGain + (grade === 'perfect' ? 10 : 0)
      cache.coins += earnedCoins

      const lv = applyExpAndLevel(m.level, m.exp ?? 0, m.sp ?? 0, m.stats, m.talents, earnedExp)
      m.level = lv.level
      m.exp = lv.exp
      m.sp = lv.sp
      m.stats = lv.stats
      m.last_calc_at = new Date(nowMs).toISOString()

      cache.monster = m
      saveLocalCareCache(baseMonster.id, cache)

      const gradeBadge = grade === 'perfect' ? '🔥 PERFECT 오븐 타이밍!' : grade === 'great' ? '✨ GREAT!' : '👍 완료!'
      return {
        ok: true,
        monster: m,
        coins: cache.coins,
        foodBag: { ...cache.foodBag },
        leveledUp: lv.leveledUp,
        message: `${gradeBadge} [${course.name}] 성공! 주 능력치 +${mainDelta}${course.subStat ? `, 보조 +${subDelta}` : ''} 상승! (+${earnedCoins} 코인)`,
      }
    }

    return { ok: false, code: 'bad_action', message: '알 수 없는 요청이에요.' }
  } catch {
    return { ok: false, code: 'fallback_error', message: '잠시 후 다시 시도해 주세요.' }
  }
}

export async function callCare(
  baseMonster: MonsterRow,
  initialCoins: number,
  action: 'sync' | 'feed' | 'care_action' | 'train' | 'buy_food',
  params: { foodId?: string; kind?: 'play' | 'clean' | 'rest'; courseId?: TrainingId; grade?: 'normal' | 'great' | 'perfect' } = {},
): Promise<CareResponse> {
  // 개발용 로컬 모드(?dev=true)와 가짜 ID 프리뷰(m1, m2 등)에서만 로컬 엔진을 쓴다
  if (IS_DEV_MOCK || baseMonster.id.length < 10) {
    return runLocalCareFallback(baseMonster, initialCoins, action, params)
  }

  // 실제 서비스: 돌보기·훈련·상점은 서버(care 함수)만 결정한다. 서버가 안 되면 로컬에서 대신 계산하지 않고 오류를 알린다.
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('care', {
        body: { action, monsterId: baseMonster.id, ...params },
      }),
      SERVER_TIMEOUT_MS,
    )
    if (error) return { ok: false, code: 'server', message: await readFunctionError(error) }
    if (data && typeof data === 'object' && 'ok' in data) {
      syncServerTime((data as { now?: string }).now)
      return data as CareResponse
    }
    return { ok: false, code: 'network', message: NETWORK_MESSAGE }
  } catch {
    return { ok: false, code: 'network', message: NETWORK_MESSAGE }
  }
}


// ── 2단계: 훈련·디저트 타워 (서버 전용). 시작·완료·등급·보상은 모두 서버가 정한다.
export interface ServerSession {
  id: string
  kind: 'train' | 'tower'
  courseId: TrainingId | null
  startFloor: number | null
  maxFloors: number | null
  secPerFloor: number | null
  startedAt: string
  finishAt: string
}

export interface ActivityResponse extends CareResponse {
  session?: ServerSession
  already?: boolean
  train?: ServerSession | null
  tower?: ServerSession | null
  towerFloor?: number
  towerEntriesLeft?: number
  coinRoom?: number
  remaining?: number
  floorsCleared?: number
  expGain?: number
  coinsGain?: number
}

export async function callActivity(
  monsterId: string,
  action: 'activity' | 'train_start' | 'train_finish' | 'tower_start' | 'tower_finish',
  params: { courseId?: TrainingId } = {},
): Promise<ActivityResponse> {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('care', { body: { action, monsterId, ...params } }),
      SERVER_TIMEOUT_MS,
    )
    if (error) return { ok: false, code: 'server', message: await readFunctionError(error) }
    if (data && typeof data === 'object' && 'ok' in data) {
      syncServerTime((data as { now?: string }).now)
      return data as ActivityResponse
    }
    return { ok: false, code: 'network', message: NETWORK_MESSAGE }
  } catch {
    return { ok: false, code: 'network', message: NETWORK_MESSAGE }
  }
}
