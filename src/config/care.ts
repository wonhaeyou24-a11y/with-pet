// M2 디저트 돌보기·토핑 가방·베이커리 상점·파티세리 훈련 수치 및 카탈로그 설정
// 기획서의 모든 수치는 이 파일에 모아 두어 밸런스 조정이 쉽도록 관리합니다.

import type { DessertSoundKind } from '../lib/sound'
import type { Stats } from '../lib/api'

export type CareStatusKey = 'hunger' | 'mood' | 'fatigue' | 'cleanliness'

export interface CareStatusMeta {
  key: CareStatusKey
  label: string
  subLabel: string
  icon: string
  color: string
  invertWarning?: boolean // fatigue는 높을수록 피곤함(경고)
}

// 디저트 세계관에 맞춘 4대 상태값 표시 정보
export const CARE_STATUS_INFO: CareStatusMeta[] = [
  {
    key: 'hunger',
    label: '당충전',
    subLabel: '배고픔',
    icon: '🍓',
    color: '#FF7A59',
  },
  {
    key: 'mood',
    label: '달콤함',
    subLabel: '기분',
    icon: '💖',
    color: '#F48FB1',
  },
  {
    key: 'fatigue',
    label: '노곤함',
    subLabel: '피로도',
    icon: '💤',
    color: '#9575CD',
    invertWarning: true,
  },
  {
    key: 'cleanliness',
    label: '슈가윤기',
    subLabel: '청결도',
    icon: '✨',
    color: '#4DB6AC',
  },
]

// 시간 경과에 따른 상태 변화 규칙 (1시간 기준)
export const CARE_DECAY = {
  hungerPerHour: 5, // 1시간에 당충전 5 감소
  moodPerHour: 3, // 1시간에 달콤함(기분) 3 감소
  cleanlinessPerHour: 2, // 1시간에 슈가윤기(청결) 2 감소
  fatigueRecoveryPerHour: 4, // 자연 휴식으로 1시간에 노곤함(피로) 4 감소
  maxDailyCoins: 500, // 하루 코인 획득 상한
  dailyFreeFoodId: '기본 슈가파우더',
  dailyFreeFoodCount: 2,
} as const

// 디저트 토핑 & 간식 카탈로그 (먹이 가방 & 베이커리 상점 공용)
export interface DessertFoodItem {
  id: string
  name: string
  icon: string
  price: number // 코인 가격
  hunger: number // 당충전 회복량
  mood: number // 달콤함(기분) 회복량
  fatigue: number // 노곤함(피로) 증감 (음수면 회복)
  bonusStat?: keyof Stats // 먹였을 때 소량 오르는 보너스 능력치
  bondShift?: number // 응석(+) / 독립(-) 성격 축 이동
  desc: string
  asmr: DessertSoundKind
  tag: string
}

export const DESSERT_FOODS: DessertFoodItem[] = [
  {
    id: '기본 슈가파우더',
    name: '기본 슈가파우더',
    icon: '❄️',
    price: 20,
    hunger: 30,
    mood: 3,
    fatigue: 0,
    desc: '매일 무료로 2개씩 채워지는 고운 슈가파우더예요. 언제든 든든하게 당을 충전해 줘요.',
    asmr: 'syrup-drizzle',
    tag: '매일 무료 2개',
  },
  {
    id: '우유 생크림',
    name: '우유 생크림',
    icon: '🍦',
    price: 80,
    hunger: 60,
    mood: 8,
    fatigue: 0,
    desc: '신선한 우유로 풍성하게 휘핑한 고급 생크림! 바쁠 때 한 번에 배부르게 채워 줘요.',
    asmr: 'mochi-squish',
    tag: '대용량 당충전',
  },
  {
    id: '생딸기 슈가시럽',
    name: '생딸기 슈가시럽',
    icon: '🍓',
    price: 45,
    hunger: 25,
    mood: 14,
    fatigue: 0,
    bonusStat: 'cha',
    desc: '상큼달콤한 과즙이 톡 터지는 딸기 시럽! 찹쌀떡모찌와 탕후루가 특히 좋아해요.',
    asmr: 'syrup-drizzle',
    tag: '매력 +1 보너스',
  },
  {
    id: '피스타치오 크림',
    name: '피스타치오 크림',
    icon: '💚',
    price: 60,
    hunger: 35,
    mood: 10,
    fatigue: 0,
    bonusStat: 'int',
    desc: '진하고 고소한 에메랄드빛 피스타치오 스프레드! 두바이쫀득쿠키의 최애 토핑이에요.',
    asmr: 'choco-melt',
    tag: '지능 +1 보너스',
  },
  {
    id: '과즙팡 왁싱볼',
    name: '과즙팡 왁싱볼',
    icon: '🫧',
    price: 60,
    hunger: 32,
    mood: 18,
    fatigue: -4,
    bonusStat: 'cha',
    desc: '얇은 파스텔 밀랍 왁스 캡슐을 톡! 깨물면 진한 과즙 시럽이 쭈욱 터져 나오는 인기 간식이에요.',
    asmr: 'wax-pop',
    tag: '왁싱볼 ASMR · 매력 +1',
  },
  {
    id: '황금 카다이프칩',
    name: '황금 카다이프칩',
    icon: '🌾',
    price: 65,
    hunger: 40,
    mood: 10,
    fatigue: 0,
    bonusStat: 'atk',
    desc: '버터에 노릇하게 볶아 바사삭 부서지는 황금 카다이프! 크런치 공격력을 높여 줘요.',
    asmr: 'kataifi-crunch',
    tag: '공격 +1 보너스',
  },
  {
    id: '메이플 허니버터',
    name: '메이플 허니버터',
    icon: '🍯',
    price: 55,
    hunger: 40,
    mood: 8,
    fatigue: -12,
    desc: '따뜻하게 녹아내리는 메이플 시럽과 버터 조각! 훈련으로 쌓인 노곤함까지 녹여 줘요.',
    asmr: 'smore-sizzle',
    tag: '피로 -12 회복',
  },
  {
    id: '눈꽃 우유빙수',
    name: '눈꽃 우유빙수',
    icon: '🍧',
    price: 50,
    hunger: 22,
    mood: 20,
    fatigue: -5,
    bonusStat: 'spd',
    desc: '입안에서 사르르 녹는 시원한 눈꽃 빙수! 기분을 상쾌하게 만들고 속도를 높여 줘요.',
    asmr: 'sugar-crack',
    tag: '속도 +1 보너스',
  },
  {
    id: '구름 솜사탕',
    name: '구름 솜사탕',
    icon: '☁️',
    price: 40,
    hunger: 15,
    mood: 25,
    fatigue: 0,
    bondShift: 5,
    desc: '하늘 위 구름처럼 폭신한 핑크빛 솜사탕! 달콤함이 크게 오르고 응석 성향이 자라나요.',
    asmr: 'mochi-squish',
    tag: '달콤함 +25 · 응석↑',
  },
  {
    id: '초코 퐁듀볼',
    name: '초코 퐁듀볼',
    icon: '🍫',
    price: 55,
    hunger: 35,
    mood: 12,
    fatigue: 0,
    bonusStat: 'def',
    desc: '꾸덕한 다크 가나슈가 듬뿍 들어간 초코볼! 코팅 방어력을 든든하게 다져 줘요.',
    asmr: 'choco-melt',
    tag: '방어 +1 보너스',
  },
]

// 기본 돌보기 액션 3종 (토핑 주기 외 놀아주기 / 슈가윤기 닦기 / 쇼케이스 휴식)
export interface CareActionMeta {
  id: 'play' | 'clean' | 'rest'
  name: string
  icon: string
  desc: string
  effectLabel: string
  coinReward: number
  expReward: number
  asmr: DessertSoundKind
}

export const CARE_ACTIONS: CareActionMeta[] = [
  {
    id: 'play',
    name: '말랑 터치 놀아주기',
    icon: '🎈',
    desc: '디저트 친구의 볼살을 톡톡 튀기며 신나게 놀아줘요.',
    effectLabel: '달콤함 +22 · 노곤함 +5 · 활발/응석↑',
    coinReward: 15,
    expReward: 12,
    asmr: 'pudding-jiggle',
  },
  {
    id: 'clean',
    name: '슈가 글레이즈 윤기내기',
    icon: '✨',
    desc: '부스러기를 털어내고 반짝반짝 설탕 코팅 윤기를 내줘요.',
    effectLabel: '슈가윤기 +35 · 달콤함 +6',
    coinReward: 12,
    expReward: 10,
    asmr: 'sugar-crack',
  },
  {
    id: 'rest',
    name: '쇼케이스 쿨링 휴식',
    icon: '🌙',
    desc: '시원하고 아늑한 파티세리 쇼케이스에서 노곤함을 식혀요.',
    effectLabel: '노곤함 -35 · 달콤함 +5 · 차분↑',
    coinReward: 10,
    expReward: 8,
    asmr: 'mochi-squish',
  },
]

// 파티세리 훈련 5종 설정
export type TrainingId = 'str' | 'def' | 'spd' | 'int' | 'hp'

export interface TrainingCourse {
  id: TrainingId
  name: string
  subtitle: string
  icon: string
  mainStat: keyof Stats
  mainGain: number
  subStat: keyof Stats | null
  subGain: number
  fatigueCost: number
  expGain: number
  coinGain: number
  personalityShift: { active: number; bond: number }
  personalityLabel: string
  asmr: DessertSoundKind
  desc: string
}

export const TRAINING_COURSES: TrainingCourse[] = [
  {
    id: 'str',
    name: '크런치 토핑 다지기',
    subtitle: '근력 훈련',
    icon: '💪',
    mainStat: 'atk',
    mainGain: 2,
    subStat: 'hp',
    subGain: 1,
    fatigueCost: 15,
    expGain: 25,
    coinGain: 20,
    personalityShift: { active: 4, bond: 0 },
    personalityLabel: '활발 성향 ↑',
    asmr: 'kataifi-crunch',
    desc: '바사삭 카다이프와 견과류 토핑을 힘차게 다져 매서운 크런치 공격력을 길러요!',
  },
  {
    id: 'def',
    name: '유리알 슈가코팅 경화',
    subtitle: '방어 훈련',
    icon: '🛡️',
    mainStat: 'def',
    mainGain: 2,
    subStat: 'hp',
    subGain: 1,
    fatigueCost: 15,
    expGain: 25,
    coinGain: 20,
    personalityShift: { active: -4, bond: 0 },
    personalityLabel: '차분 성향 ↑',
    asmr: 'sugar-crack',
    desc: '탕후루처럼 단단하고 투명한 설탕 시럽 막을 겹겹이 입혀 방어력을 높여요!',
  },
  {
    id: 'spd',
    name: '스파클링 휩핑 질주',
    subtitle: '속도 훈련',
    icon: '⚡',
    mainStat: 'spd',
    mainGain: 2,
    subStat: 'atk',
    subGain: 1,
    fatigueCost: 15,
    expGain: 25,
    coinGain: 20,
    personalityShift: { active: 5, bond: 0 },
    personalityLabel: '활발 성향 ↑',
    asmr: 'pudding-jiggle',
    desc: '탱글탱글한 탄성으로 생크림 거품기 사이를 빠르게 통통 튀어 다녀요!',
  },
  {
    id: 'int',
    name: '시크릿 파티세리 레시피',
    subtitle: '공부 훈련',
    icon: '📖',
    mainStat: 'int',
    mainGain: 2,
    subStat: 'cha',
    subGain: 1,
    fatigueCost: 15,
    expGain: 25,
    coinGain: 20,
    personalityShift: { active: -4, bond: 2 },
    personalityLabel: '차분 성향 ↑',
    asmr: 'syrup-drizzle',
    desc: '전설의 파티시에가 남긴 황금 배합비와 플레이팅 미학을 연구해 지능과 매력을 올려요!',
  },
  {
    id: 'hp',
    name: '황금 반죽 숙성 & 오븐 버티기',
    subtitle: '체력 훈련',
    icon: '🔥',
    mainStat: 'hp',
    mainGain: 3,
    subStat: null,
    subGain: 0,
    fatigueCost: 15,
    expGain: 25,
    coinGain: 20,
    personalityShift: { active: 0, bond: -4 },
    personalityLabel: '독립 성향 ↑',
    asmr: 'smore-sizzle',
    desc: '따끈한 화덕 오븐 속에서도 흐물거림 없이 쫀득한 밀도를 유지하는 기초 체력을 길러요!',
  },
]

// 레벨업에 필요한 경험치 계산 (Lv.1 -> 100, Lv.2 -> 140, Lv.3 -> 180 ...)
export function expForNextLevel(level: number): number {
  return 60 + level * 40
}

// 진화 단계 라벨 (아기 반죽 Lv 1~9 / 수제 디저트 Lv 10~24 / 그랑 파티세리 Lv 25~)
export function evoStageLabel(level: number): string {
  if (level >= 25) return '👑 3단계 · 시그니처 그랑 디저트'
  if (level >= 10) return '🍰 2단계 · 수제 파티세리 디저트'
  return '🍡 1단계 · 말랑 아기 반죽'
}
