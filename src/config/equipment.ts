// M5 장비·강화 수치표 (기획서 "장비"·"강화" 초안). 숫자는 여기서만 고친다.
// 서버(DB)의 장비 표·강화 규칙·드롭 규칙은 scripts/gen-gear-migration.mjs 가 이 파일에서 만들고,
// npm run test:gear 가 둘이 같은지 확인한다. (node 가 바로 읽을 수 있게 enum 같은 TS 전용 문법은 쓰지 않는다)

export type GearStat = 'hp' | 'atk' | 'def' | 'spd' | 'int' | 'cha'
export type GearSlot = 'weapon' | 'armor' | 'charm'
export type GearGrade = 'common' | 'fine' | 'rare' | 'legend'

export const GEAR_SLOTS: { id: GearSlot; label: string; icon: string }[] = [
  { id: 'weapon', label: '무기', icon: '🥄' },
  { id: 'armor', label: '방어구', icon: '🧤' },
  { id: 'charm', label: '장신구', icon: '🎀' },
]

export const GEAR_GRADES: Record<GearGrade, { label: string; color: string; bg: string }> = {
  common: { label: '일반', color: '#6D4C41', bg: '#F5EFE6' },
  fine: { label: '고급', color: '#2E7D32', bg: '#E8F5E9' },
  rare: { label: '희귀', color: '#1565C0', bg: '#E3F2FD' },
  legend: { label: '전설', color: '#C2410C', bg: '#FFF3E0' },
}

export const STAT_LABEL: Record<GearStat, string> = {
  hp: '체력',
  atk: '공격',
  def: '방어',
  spd: '속도',
  int: '지능',
  cha: '매력',
}

export interface GearDef {
  id: string
  slot: GearSlot
  grade: GearGrade
  name: string
  icon: string
  bonus: Partial<Record<GearStat, number>>
  // 코인으로 살 수 있으면 가격, 아니면 null(타워 보스 층에서만 나온다)
  price: number | null
  desc: string
}

export const GEAR_DEFS: GearDef[] = [
  // 일반 — 상점에서 코인으로
  { id: 'wood-spoon', slot: 'weapon', grade: 'common', name: '나무 숟가락', icon: '🥄', bonus: { atk: 6 }, price: 120, desc: '반죽을 젓던 평범한 숟가락' },
  { id: 'apron-cotton', slot: 'armor', grade: 'common', name: '면 앞치마', icon: '🧺', bonus: { def: 5, hp: 4 }, price: 120, desc: '밀가루가 폴폴 묻은 포근한 앞치마' },
  { id: 'sugar-charm', slot: 'charm', grade: 'common', name: '각설탕 참', icon: '🧊', bonus: { spd: 5 }, price: 120, desc: '한입 크기 각설탕 장식' },
  // 고급 — 타워 보스 층
  { id: 'silver-whisk', slot: 'weapon', grade: 'fine', name: '은빛 거품기', icon: '🥢', bonus: { atk: 12, spd: 3 }, price: null, desc: '휘휘 저으면 반짝 소리가 나요' },
  { id: 'mitt-quilted', slot: 'armor', grade: 'fine', name: '누빔 오븐장갑', icon: '🧤', bonus: { def: 11, hp: 8 }, price: null, desc: '뜨거운 공격도 막아 내요' },
  { id: 'macaron-charm', slot: 'charm', grade: 'fine', name: '마카롱 참', icon: '🍪', bonus: { spd: 10, int: 4 }, price: null, desc: '알록달록 파스텔 마카롱 장식' },
  // 희귀
  { id: 'caramel-torch', slot: 'weapon', grade: 'rare', name: '카라멜 토치', icon: '🔥', bonus: { atk: 20, int: 8 }, price: null, desc: '겉을 바삭하게 구워 내는 작은 불꽃' },
  { id: 'glaze-shield', slot: 'armor', grade: 'rare', name: '글레이즈 방패', icon: '🛡️', bonus: { def: 19, hp: 14 }, price: null, desc: '매끈한 설탕 유리 방패' },
  { id: 'berry-pendant', slot: 'charm', grade: 'rare', name: '베리 펜던트', icon: '🍓', bonus: { cha: 14, spd: 10 }, price: null, desc: '새콤달콤 반짝이는 목걸이' },
  // 전설
  { id: 'golden-rolling-pin', slot: 'weapon', grade: 'legend', name: '황금 밀방망이', icon: '🌟', bonus: { atk: 32, int: 12 }, price: null, desc: '전설의 파티시에가 쓰던 밀방망이' },
  { id: 'royal-cream-armor', slot: 'armor', grade: 'legend', name: '로얄 크림 갑옷', icon: '👑', bonus: { def: 30, hp: 24 }, price: null, desc: '휘핑크림이 겹겹이 올라간 갑옷' },
  { id: 'starlight-sprinkle', slot: 'charm', grade: 'legend', name: '별빛 스프링클', icon: '✨', bonus: { cha: 22, spd: 16, int: 10 }, price: null, desc: '뿌리면 반짝이는 별가루' },
]

// 강화: 단계마다 장비 능력치 +5%. 실패해도 장비가 깨지거나 단계가 내려가지 않고 코인만 쓴다.
export const GEAR_MAX_LEVEL = 10
export const GEAR_LEVEL_BONUS = 0.05
export const GEAR_ENHANCE: { level: number; chance: number; cost: number }[] = [
  { level: 1, chance: 100, cost: 50 },
  { level: 2, chance: 100, cost: 100 },
  { level: 3, chance: 100, cost: 150 },
  { level: 4, chance: 60, cost: 300 },
  { level: 5, chance: 60, cost: 450 },
  { level: 6, chance: 50, cost: 600 },
  { level: 7, chance: 35, cost: 1000 },
  { level: 8, chance: 25, cost: 1400 },
  { level: 9, chance: 15, cost: 1800 },
  { level: 10, chance: 5, cost: 3500 },
]

// 타워 보스 층(5층마다)에서 나오는 장비 등급. 그 층 이상 규칙 중 가장 높은 단계를 쓴다. weight 는 서로의 비율.
export const GEAR_BOSS_EVERY = 5
export const GEAR_DROPS: { minFloor: number; grade: GearGrade; weight: number }[] = [
  { minFloor: 5, grade: 'common', weight: 30 },
  { minFloor: 5, grade: 'fine', weight: 70 },
  { minFloor: 15, grade: 'fine', weight: 60 },
  { minFloor: 15, grade: 'rare', weight: 40 },
  { minFloor: 30, grade: 'rare', weight: 85 },
  { minFloor: 30, grade: 'legend', weight: 15 },
]

// 가방에 둘 수 있는 장비 수
export const GEAR_BAG_LIMIT = 60

export const gearDefById = (id: string): GearDef | undefined => GEAR_DEFS.find((d) => d.id === id)

// 강화 단계가 반영된 능력치 (서버 gear_bonus 함수와 같은 식: 기본값 × (20 + 단계) ÷ 20, 반올림. 정수 나눗셈이라 오차가 없다)
export function gearStatValue(base: number, level: number): number {
  return Math.round((base * (Math.round(1 / GEAR_LEVEL_BONUS) + level)) / Math.round(1 / GEAR_LEVEL_BONUS))
}
