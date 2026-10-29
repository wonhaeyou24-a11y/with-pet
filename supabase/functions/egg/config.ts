// 알·부화 수치 설정. 기획서의 숫자는 초안이므로 코드 곳곳에 박지 말고 여기서만 고친다.

export type Rarity = 'common' | 'rare' | 'legendary'

export const EGG = {
  // 신규 가입 시 받는 기본 알의 등급
  startingRarity: 'common' as Rarity,
  // 등급별 부화 시간(분). 테스트할 때는 1로 줄여서 쓴다.
  hatchMinutes: { common: 60, rare: 360, legendary: 1440 } as Record<Rarity, number>,
  // 쓰다듬기: 부화 시간을 줄이고 첫 성격을 응석 쪽(+)으로 조금 민다
  pet: { minutesOff: 3, dailyLimit: 5, bondShift: 4 },
  // 따뜻하게 하기: 부화 시간을 줄이고 첫 성격을 차분 쪽(-)으로 조금 민다
  warm: { minutesOff: 5, dailyLimit: 5, activeShift: -3 },
  // 하루가 바뀌는 기준 (한국 시간)
  dayOffsetHours: 9,
}

export const HATCH = {
  shinyChance: 0.01,
  mutationChance: 0.002,
  mutations: ['crystal', 'shadow', 'gold'],
  // 알 등급별로 속성이 하나 더 붙을 확률
  secondElementChance: { common: 0, rare: 0.3, legendary: 1 } as Record<Rarity, number>,
  // 재능(능력치별 성장 보너스, 숨김값) 범위. 등급이 높을수록 최소값이 올라간다.
  talentMax: 15,
  talentMin: { common: 0, rare: 3, legendary: 6 } as Record<Rarity, number>,
  // 시작 능력치 = 종족 기본값 + 0~statJitter
  statJitter: 3,
  bodyTypeWeights: { chubby: 3, normal: 4, slim: 3 },
  scaleRange: [0.9, 1.1] as const,
  // 시작 성격 축(-100~100)의 무작위 범위
  personalityStart: 30,
  // 눈매 판정: 응석↔독립 축이 -20 이하면 날카로운 눈, 활발↔차분 축이 -15 이하면 반쯤 감은 눈
  expression: { sharpBondMax: -20, sleepyActiveMax: -15 },
  // 클라이언트 그림(src/monsters/species)의 부품 개수와 맞춰야 한다
  partCounts: { palettes: 6, ears: 4, tail: 4, top: 4 },
  traits: ['먹보', '노력파', '겁쟁이', '호기심쟁이', '의리파', '잠꾸러기'],
  // 좋아하는 음식·싫어하는 음식을 고르는 후보 (기본 사료 제외)
  foods: ['고급 사료', '숲 열매', '바다 조개구이', '화산 고구마', '눈꽃 빙수', '구름 솜사탕'],
}

export type Stats = { hp: number; atk: number; def: number; spd: number; int: number; cha: number }
export const STAT_KEYS: (keyof Stats)[] = ['hp', 'atk', 'def', 'spd', 'int', 'cha']

// 1차 버전의 종족 6종. weights는 알 등급별 등장 비중 (귀여움은 흔하고 카리스마는 높은 등급에서 잘 나온다)
export const SPECIES: Record<string, { element: string; base: Stats; weights: Record<Rarity, number> }> = {
  mongsil: { element: 'wind', base: { hp: 46, atk: 20, def: 30, spd: 34, int: 30, cha: 38 }, weights: { common: 3, rare: 2, legendary: 1 } },
  kongkong: { element: 'grass', base: { hp: 42, atk: 24, def: 28, spd: 36, int: 32, cha: 34 }, weights: { common: 3, rare: 2, legendary: 1 } },
  beongaekkori: { element: 'electric', base: { hp: 36, atk: 28, def: 24, spd: 44, int: 34, cha: 28 }, weights: { common: 3, rare: 3, legendary: 2 } },
  gangcheoldeung: { element: 'earth', base: { hp: 48, atk: 30, def: 40, spd: 22, int: 24, cha: 26 }, weights: { common: 3, rare: 3, legendary: 2 } },
  heugyeom: { element: 'fire', base: { hp: 40, atk: 40, def: 26, spd: 30, int: 28, cha: 32 }, weights: { common: 1, rare: 3, legendary: 5 } },
  byeolbineul: { element: 'water', base: { hp: 38, atk: 26, def: 28, spd: 30, int: 44, cha: 34 }, weights: { common: 1, rare: 3, legendary: 5 } },
}

export const ELEMENTS = ['fire', 'water', 'grass', 'electric', 'wind', 'earth']
