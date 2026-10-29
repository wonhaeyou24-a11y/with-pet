// 알·부화 수치 설정. 기획서의 숫자는 초안이므로 코드 곳곳에 박지 말고 여기서만 고친다.

export type Rarity = 'common' | 'rare' | 'legendary'

export const EGG = {
  // 신규 가입 시 받는 기본 알의 등급
  startingRarity: 'common' as Rarity,
  // 등급별 부화 시간(분). 테스트할 때는 1로 줄여서 쓴다.
  hatchMinutes: { common: 1, rare: 6, legendary: 10 } as Record<Rarity, number>,
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
  traits: ['겉바속촉', '쫀득탄력', '달콤과즙', '과즙팡왁스', '꾸덕가나슈', '슈가글레이즈', '황금카다이프', '먹보', '노력파'],
  // 좋아하는 토핑·싫어하는 토핑을 고르는 후보 (기본 슈가파우더 제외)
  foods: ['생딸기 슈가시럽', '피스타치오 크림', '황금 카다이프칩', '과즙팡 왁싱볼', '메이플 허니버터', '우유 생크림', '초코 퐁듀볼', '구름 솜사탕', '눈꽃 빙수'],
}

export type Stats = { hp: number; atk: number; def: number; spd: number; int: number; cha: number }
export const STAT_KEYS: (keyof Stats)[] = ['hp', 'atk', 'def', 'spd', 'int', 'cha']

// 메인 디저트 종족 8종 + 클래식 호환 종족 6종.
// weights는 알 등급별 부화 등장 비중 (말랑·탱글 계열은 일반 알에서 자주 나오고, 바삭·크런치·트렌드 디저트는 희귀·전설 알에서 높은 확률로 등장)
export const SPECIES: Record<string, { element: string; base: Stats; weights: Record<Rarity, number> }> = {
  // 1) 말랑·쫀득·탱글 베이직 디저트 라인업
  mochi: { element: 'wind', base: { hp: 48, atk: 22, def: 34, spd: 32, int: 32, cha: 44 }, weights: { common: 5, rare: 3, legendary: 1 } },
  pudding: { element: 'water', base: { hp: 46, atk: 20, def: 32, spd: 34, int: 36, cha: 42 }, weights: { common: 5, rare: 3, legendary: 1 } },
  jelly: { element: 'electric', base: { hp: 42, atk: 26, def: 28, spd: 42, int: 34, cha: 40 }, weights: { common: 4, rare: 3, legendary: 2 } },
  chameleon: { element: 'grass', base: { hp: 44, atk: 24, def: 30, spd: 38, int: 36, cha: 40 }, weights: { common: 4, rare: 3, legendary: 2 } },
  // 2) 꾸덕·사르르 & 바삭·크런치 스페셜 디저트 라인업
  choco: { element: 'earth', base: { hp: 50, atk: 32, def: 38, spd: 26, int: 34, cha: 38 }, weights: { common: 2, rare: 4, legendary: 3 } },
  smore: { element: 'fire', base: { hp: 46, atk: 36, def: 30, spd: 32, int: 32, cha: 40 }, weights: { common: 2, rare: 4, legendary: 4 } },
  'wax-ball': { element: 'water', base: { hp: 44, atk: 38, def: 32, spd: 38, int: 40, cha: 48 }, weights: { common: 1, rare: 4, legendary: 5 } },
  tanghulu: { element: 'water', base: { hp: 40, atk: 38, def: 28, spd: 40, int: 42, cha: 46 }, weights: { common: 1, rare: 4, legendary: 5 } },
  'dubai-cookie': { element: 'earth', base: { hp: 52, atk: 42, def: 40, spd: 30, int: 36, cha: 48 }, weights: { common: 1, rare: 4, legendary: 6 } },
  // 3) 기존 부화 몬스터 DB 호환용 클래식 라인업 (신규 알 가중치 0, 변신 공방에서 언제든 선택 가능)
  mongsil: { element: 'wind', base: { hp: 46, atk: 20, def: 30, spd: 34, int: 30, cha: 38 }, weights: { common: 0, rare: 0, legendary: 0 } },
  kongkong: { element: 'grass', base: { hp: 42, atk: 24, def: 28, spd: 36, int: 32, cha: 34 }, weights: { common: 0, rare: 0, legendary: 0 } },
  beongaekkori: { element: 'electric', base: { hp: 36, atk: 28, def: 24, spd: 44, int: 34, cha: 28 }, weights: { common: 0, rare: 0, legendary: 0 } },
  gangcheoldeung: { element: 'earth', base: { hp: 48, atk: 30, def: 40, spd: 22, int: 24, cha: 26 }, weights: { common: 0, rare: 0, legendary: 0 } },
  heugyeom: { element: 'fire', base: { hp: 40, atk: 40, def: 26, spd: 30, int: 28, cha: 32 }, weights: { common: 0, rare: 0, legendary: 0 } },
  byeolbineul: { element: 'water', base: { hp: 38, atk: 26, def: 28, spd: 30, int: 44, cha: 34 }, weights: { common: 0, rare: 0, legendary: 0 } },
}

export const ELEMENTS = ['fire', 'water', 'grass', 'electric', 'wind', 'earth']
