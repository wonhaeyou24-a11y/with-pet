// M5 탐험(보내 놓고 기다리기)의 서버 판정용 순수 계산 (DB·네트워크 없음).
// 서버(care 함수)와 화면이 같은 파일을 쓴다. 같은 시드·같은 입력이면 항상 같은 결과가 나온다.
// 수치는 기획서 초안이므로 이 파일의 표(EXPLORE, REGIONS)에서만 고친다. scripts/test-explore.mjs 가 검증한다.

import { battlePower, mulberry32 } from './activity.ts'
import { applyExpAndLevelUp, type CareState, type Stats } from './logic.ts'

export type TripTier = 'great' | 'success' | 'struggle' | 'retreat'

export const EXPLORE = {
  // 1시간이 실제 몇 초인지. 출시는 3600, 테스트할 때만 줄여서 확인한다.
  secondsPerHour: 3600,
  hours: [1, 2, 4, 8],
  // 오래 보낼수록 보상이 늘지만 효율은 조금 낮아진다 (1시간 ×1 → 8시간 ×6)
  hourMult: { 1: 1, 2: 1.9, 4: 3.6, 8: 6 } as Record<number, number>,
  zonesPerRegion: 10,
  fatiguePerHour: 5,
  fatigueBlock: 80,
  // 전투력 ÷ 권장 전투력 비율 경계 (기획서)
  ratio: { great: 1.3, success: 1.0, struggle: 0.8 },
  // 결과별 보상 배율
  tierMult: { great: 1.5, success: 1, struggle: 0.5, retreat: 0.2 } as Record<TripTier, number>,
  // 고전이면 피로가 1.5배, 중도 귀환은 절반만 쌓인다
  tierFatigue: { great: 1, success: 1, struggle: 1.5, retreat: 0.5 } as Record<TripTier, number>,
  exp: { base: 20, perZone: 10 },
  coins: { base: 12, perZone: 4 },
  gearChancePerHour: 0.04, // 시간 배율을 곱한다
  eventChance: 0.1,
  // 같은 속성 지역이면 전투력 +10%
  elementBonus: 0.1,
  focusBonusMax: 0.1,
}

export interface Region {
  id: string
  name: string
  icon: string
  element: string
  // 처음부터 / 레벨 / 진화 단계로 열린다
  unlock: { kind: 'start' } | { kind: 'level'; value: number } | { kind: 'stage'; value: number }
  focus: (keyof Stats)[]
  power: [number, number] // 1구역 → 10구역 권장 전투력
  foods: string[]
  gear: Partial<Record<'common' | 'fine' | 'rare' | 'legend', number>>
  unlockText: string
  journals: Record<TripTier, string[]>
}

export const REGIONS: Region[] = [
  {
    id: 'dew-forest',
    name: '이슬 숲',
    icon: '🌲',
    element: 'grass',
    unlock: { kind: 'start' },
    focus: ['hp', 'atk', 'def', 'spd', 'int', 'cha'],
    power: [60, 200],
    foods: ['기본 슈가파우더', '우유 생크림', '생딸기 슈가시럽'],
    gear: { common: 80, fine: 20 },
    unlockText: '처음부터 열려 있어요',
    journals: {
      great: ['아침 이슬이 맺힌 덤불에서 딸기를 한가득 주워 왔어요!', '숲속 친구들이 길을 안내해 줘서 보물 같은 열매를 찾았어요.'],
      success: ['이끼 낀 오솔길을 따라 산책하며 열매를 모아 왔어요.', '나뭇잎 사이로 반짝이는 이슬을 구경하다 돌아왔어요.'],
      struggle: ['덤불에서 길을 잃었다가 겨우 돌아왔어요. 조금 지쳤지만 무사해요!', '가시덤불에 걸려 서둘러 돌아왔어요.'],
      retreat: ['숲이 너무 깊어서 입구에서 발길을 돌렸어요. 다음에 더 강해져서 가요!'],
    },
  },
  {
    id: 'sparkle-beach',
    name: '반짝 바닷가',
    icon: '🏖️',
    element: 'water',
    unlock: { kind: 'level', value: 5 },
    focus: ['spd', 'int'],
    power: [120, 320],
    foods: ['눈꽃 우유빙수', '피스타치오 크림', '구름 솜사탕'],
    gear: { common: 60, fine: 40 },
    unlockText: '레벨 5부터',
    journals: {
      great: ['강가에서 반짝이는 조개를 한가득 주웠어요! 파도 소리가 노래 같았어요.', '모래사장에서 진주처럼 빛나는 보물을 발견했어요!'],
      success: ['모래성을 쌓으며 놀다가 조개를 몇 개 주워 왔어요.', '파도가 밀려오는 걸 구경하다 시원하게 돌아왔어요.'],
      struggle: ['큰 파도에 휩쓸릴 뻔했지만 무사히 돌아왔어요.', '밀물이 들어와 서둘러 돌아왔어요.'],
      retreat: ['파도가 너무 높아서 해변 입구에서 돌아왔어요.'],
    },
  },
  {
    id: 'bubbling-volcano',
    name: '부글 화산',
    icon: '🌋',
    element: 'fire',
    unlock: { kind: 'stage', value: 2 },
    focus: ['hp', 'def'],
    power: [200, 480],
    foods: ['초코 퐁듀볼', '황금 카다이프칩', '메이플 허니버터'],
    gear: { fine: 70, rare: 30 },
    unlockText: '진화 2단계부터',
    journals: {
      great: ['따끈한 화산 동굴에서 반짝이는 캐러멜 결정을 찾았어요!', '용암 옆 바위틈에서 고소한 보물을 발견했어요!'],
      success: ['부글부글 끓는 초코 웅덩이 옆에서 재료를 모아 왔어요.', '뜨거운 김을 헤치고 무사히 다녀왔어요.'],
      struggle: ['화산 동굴에서 길을 잃었다가 무사히 돌아왔어요.', '뜨거운 열기에 지쳐 서둘러 돌아왔어요.'],
      retreat: ['열기가 너무 세서 입구에서 돌아왔어요.'],
    },
  },
  {
    id: 'frost-field',
    name: '얼음 설원',
    icon: '🏔️',
    element: 'water',
    unlock: { kind: 'level', value: 15 },
    focus: ['def', 'int'],
    power: [280, 600],
    foods: ['눈꽃 우유빙수', '우유 생크림', '피스타치오 크림'],
    gear: { fine: 50, rare: 50 },
    unlockText: '레벨 15부터',
    journals: {
      great: ['눈 속에서 반짝이는 눈 결정을 한 아름 안고 왔어요!', '오로라 아래에서 보물을 발견했어요!'],
      success: ['포근한 눈밭을 걸으며 눈 결정을 몇 개 주워 왔어요.', '눈사람 친구와 놀다 돌아왔어요.'],
      struggle: ['눈보라에 길이 막혀 조금 늦게 돌아왔어요.', '꽁꽁 언 발로 서둘러 돌아왔어요.'],
      retreat: ['눈보라가 너무 거세서 입구에서 돌아왔어요.'],
    },
  },
  {
    id: 'cloud-island',
    name: '구름섬',
    icon: '☁️',
    element: 'wind',
    unlock: { kind: 'level', value: 20 },
    focus: ['spd'],
    power: [360, 720],
    foods: ['구름 솜사탕', '눈꽃 우유빙수', '과즙팡 왁싱볼'],
    gear: { rare: 70, legend: 30 },
    unlockText: '레벨 20부터',
    journals: {
      great: ['푹신한 구름 위를 뛰어다니다 하늘 열매를 가득 따 왔어요!', '무지개 다리 끝에서 보물을 발견했어요!'],
      success: ['구름 사이를 폴짝폴짝 뛰며 열매를 모아 왔어요.', '바람을 타고 상쾌하게 다녀왔어요.'],
      struggle: ['센 바람에 날려 먼 길을 돌아왔어요.', '구름 틈에 빠질 뻔했지만 무사해요!'],
      retreat: ['바람이 너무 세서 입구에서 돌아왔어요.'],
    },
  },
  {
    id: 'forgotten-ruins',
    name: '잊혀진 유적',
    icon: '🏛️',
    element: 'earth',
    unlock: { kind: 'stage', value: 3 },
    focus: ['atk', 'int'],
    power: [480, 900],
    foods: ['황금 카다이프칩', '초코 퐁듀볼', '우유 생크림'],
    gear: { rare: 60, legend: 40 },
    unlockText: '진화 3단계부터',
    journals: {
      great: ['오래된 석상 아래에서 전설의 장식을 찾았어요!', '숨겨진 방에서 반짝이는 보물을 발견했어요!'],
      success: ['이끼 낀 벽화를 구경하며 오래된 조각을 주워 왔어요.', '유적의 계단을 조심조심 올랐다 내려왔어요.'],
      struggle: ['함정 방에 갇혔다가 간신히 빠져나왔어요.', '무너지는 돌길을 달려 돌아왔어요.'],
      retreat: ['유적이 너무 어두워서 입구에서 돌아왔어요.'],
    },
  },
]

export const regionById = (id: string): Region | undefined => REGIONS.find((r) => r.id === id)

export interface Explorer {
  level: number
  evoStage: number
  progress: Record<string, number> // 지역별로 돌파한 가장 높은 구역
}

export function isRegionOpen(r: Region, m: Pick<Explorer, 'level' | 'evoStage'>): boolean {
  if (r.unlock.kind === 'start') return true
  if (r.unlock.kind === 'level') return m.level >= r.unlock.value
  return m.evoStage >= r.unlock.value
}

// 이 지역 몇 구역의 권장 전투력 (1구역 → 10구역을 직선으로 이어 계산)
export function recommendedPower(r: Region, zone: number): number {
  const [a, b] = r.power
  const z = Math.max(1, Math.min(EXPLORE.zonesPerRegion, zone))
  return Math.round(a + ((b - a) * (z - 1)) / (EXPLORE.zonesPerRegion - 1))
}

export function tripSeconds(hours: number): number {
  return Math.round(hours * EXPLORE.secondsPerHour)
}

export type StartCheck = { ok: true } | { ok: false; code: string; message: string }

export function checkTripStart(
  m: Explorer & { fatigue: number },
  regionId: string,
  zone: number,
  hours: number,
): StartCheck {
  const r = regionById(regionId)
  if (!r) return { ok: false, code: 'bad_region', message: '알 수 없는 지역이에요.' }
  if (!EXPLORE.hours.includes(hours)) return { ok: false, code: 'bad_hours', message: '보낼 수 없는 시간이에요.' }
  if (!Number.isInteger(zone) || zone < 1 || zone > EXPLORE.zonesPerRegion) return { ok: false, code: 'bad_zone', message: '알 수 없는 구역이에요.' }
  if (!isRegionOpen(r, m)) return { ok: false, code: 'locked', message: `🔒 ${r.name}은(는) ${r.unlockText} 열려요.` }
  const cleared = m.progress[r.id] ?? 0
  if (zone > cleared + 1) return { ok: false, code: 'zone_locked', message: `🔒 ${zone - 1}구역을 먼저 돌파해야 해요.` }
  if (m.fatigue >= EXPLORE.fatigueBlock) return { ok: false, code: 'too_tired', message: '💤 노곤함이 높아 탐험을 떠날 수 없어요! 먼저 쉬게 해 주세요.' }
  return { ok: true }
}

// 지역 중점 능력치와 속성이 맞으면 전투력이 조금 올라간다
export function effectivePower(r: Region, stats: Stats, monsterElement: string): number {
  const keys = Object.keys(stats) as (keyof Stats)[]
  const avg = (ks: (keyof Stats)[]) => ks.reduce((a, k) => a + (stats[k] ?? 0), 0) / Math.max(1, ks.length)
  const focusBonus = Math.max(0, Math.min(EXPLORE.focusBonusMax, (avg(r.focus) - avg(keys)) / 100))
  const elem = monsterElement === r.element ? EXPLORE.elementBonus : 0
  return Math.round(battlePower(stats) * (1 + focusBonus + elem))
}

export function tierOf(ratio: number): TripTier {
  if (ratio >= EXPLORE.ratio.great) return 'great'
  if (ratio >= EXPLORE.ratio.success) return 'success'
  if (ratio >= EXPLORE.ratio.struggle) return 'struggle'
  return 'retreat'
}

export interface TripResult {
  tier: TripTier
  ratio: number
  power: number
  need: number
  exp: number
  coins: number
  foods: string[]
  gearGrade: 'common' | 'fine' | 'rare' | 'legend' | null
  shards: number
  firstClear: boolean
  cleared: boolean // 성공 이상이면 다음 구역이 열린다
  fatigue: number
  journal: string
  event: string | null
}

const EVENTS = [
  { text: '🧺 숨은 상인을 만나 모아 온 것을 비싸게 팔았어요! (코인 +50%)', coins: 1.5 },
  { text: '🥚 반짝이는 알 껍데기 조각을 주웠어요. 별조각을 하나 얻었어요!', shards: 1 },
  { text: '🍬 길가에서 간식을 한 보따리 얻었어요! (토핑 +1)', food: 1 },
]

// 탐험 결과: 출발 때 정한 전투력·시드로 서버가 복귀할 때 계산한다. 폰이 보낸 값은 쓰지 않는다.
export function resolveTrip(input: {
  regionId: string
  zone: number
  hours: number
  power: number
  seed: number
  firstClear: boolean
  coinRoom: number
}): TripResult {
  const r = regionById(input.regionId)!
  const rng = mulberry32(input.seed)
  const need = recommendedPower(r, input.zone)
  const ratio = need > 0 ? input.power / need : 1
  const tier = tierOf(ratio)
  const hm = EXPLORE.hourMult[input.hours] ?? 1
  const tm = EXPLORE.tierMult[tier]

  const exp = Math.max(1, Math.round((EXPLORE.exp.base + EXPLORE.exp.perZone * input.zone) * hm * tm))
  let coinsRaw = tier === 'retreat' ? 0 : Math.round((EXPLORE.coins.base + EXPLORE.coins.perZone * input.zone) * hm * tm)

  // 토핑: 중도 귀환이면 없음, 아니면 시간 배율만큼 (결과가 좋으면 더)
  const foodCount = tier === 'retreat' ? 0 : Math.max(1, Math.round((hm / 2) * (tier === 'great' ? 1.5 : tier === 'struggle' ? 0.5 : 1)))
  const foods: string[] = []
  for (let i = 0; i < foodCount; i++) foods.push(r.foods[Math.floor(rng() * r.foods.length)])

  // 장비 드롭: 낮은 확률 (희귀 발견 확률은 대성공일 때 두 배)
  let gearGrade: TripResult['gearGrade'] = null
  const chance = tier === 'retreat' || tier === 'struggle' ? 0 : EXPLORE.gearChancePerHour * hm * (tier === 'great' ? 2 : 1)
  if (rng() < chance) {
    const entries = Object.entries(r.gear) as ['common' | 'fine' | 'rare' | 'legend', number][]
    const total = entries.reduce((a, [, w]) => a + w, 0)
    let pick = rng() * total
    for (const [g, w] of entries) {
      pick -= w
      if (pick < 0) {
        gearGrade = g
        break
      }
    }
  }

  let shards = 0
  const cleared = tier === 'great' || tier === 'success'
  if (cleared && input.firstClear) shards += 2 + REGIONS.findIndex((x) => x.id === r.id)

  let event: string | null = null
  if (tier !== 'retreat' && rng() < EXPLORE.eventChance) {
    const ev = EVENTS[Math.floor(rng() * EVENTS.length)]
    event = ev.text
    if ('coins' in ev && ev.coins) coinsRaw = Math.round(coinsRaw * ev.coins)
    if ('shards' in ev && ev.shards) shards += ev.shards
    if ('food' in ev && ev.food) foods.push(r.foods[Math.floor(rng() * r.foods.length)])
  }

  const coins = Math.min(coinsRaw, Math.max(0, input.coinRoom))
  const lines = r.journals[tier]
  const journal = lines[Math.floor(rng() * lines.length)]
  const fatigue = Math.round(input.hours * EXPLORE.fatiguePerHour * EXPLORE.tierFatigue[tier])

  return { tier, ratio: Math.round(ratio * 100) / 100, power: input.power, need, exp, coins, foods, gearGrade, shards, firstClear: input.firstClear, cleared, fatigue, journal, event }
}

// 돌아와 보상을 받는다: 경험치·코인·토핑·피로를 상태에 반영한다 (능력치는 깎이지 않는다)
export function applyTripClaim(s: CareState, res: TripResult): { state: CareState; leveledUp: boolean } {
  const next: CareState = { ...s, stats: { ...s.stats }, foodBag: { ...s.foodBag }, careCounts: { ...s.careCounts } }
  next.fatigue = Math.min(100, s.fatigue + res.fatigue)
  next.coins += res.coins
  for (const f of res.foods) next.foodBag[f] = (next.foodBag[f] ?? 0) + 1
  next.careCounts.explore = (next.careCounts.explore ?? 0) + 1
  const lv = applyExpAndLevelUp(next, res.exp)
  Object.assign(next, { level: lv.level, exp: lv.exp, sp: lv.sp, stats: lv.stats })
  return { state: next, leveledUp: lv.leveledUp }
}
