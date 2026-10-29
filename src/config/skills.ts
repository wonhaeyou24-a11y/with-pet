// M3 식감 스킬 트리 1단계 (6개 가지 × 3개 노드 = 18종) & 전투 성향 설정
// 모든 스킬은 고유한 디저트 식감 ASMR 사운드와 시각적 파편 이펙트를 가집니다.

import type { DessertSoundKind } from '../lib/sound'

export type SkillBranchId = 'assault' | 'fortress' | 'bond' | 'mystic' | 'quirky' | 'elemental'
export type BattleStanceId = 'aggressive' | 'balanced' | 'defensive' | 'trickster'

export interface SkillBranchMeta {
  id: SkillBranchId
  name: string
  subtitle: string
  icon: string
  color: string
  desc: string
}

export const SKILL_BRANCHES: SkillBranchMeta[] = [
  {
    id: 'assault',
    name: '크런치 맹공',
    subtitle: '바사삭 몰아치는 공격',
    icon: '🌾',
    color: '#FF7A59',
    desc: '카다이프와 쿠키 크런치를 폭발시켜 기세를 쌓고 강하게 몰아칩니다.',
  },
  {
    id: 'fortress',
    name: '슈가코팅 철벽',
    subtitle: '단단하고 탱글한 반사',
    icon: '💎',
    color: '#F5B82E',
    desc: '탕후루 설탕 코팅과 모찌·푸딩 탄성으로 공격을 버티고 되받아칩니다.',
  },
  {
    id: 'bond',
    name: '달콤 교감',
    subtitle: '주인과의 유대와 회복',
    icon: '💖',
    color: '#F48FB1',
    desc: '파티시에 주인의 애정과 한입 투표 응원을 힘으로 바꿔 회복합니다.',
  },
  {
    id: 'mystic',
    name: '퐁듀 요술',
    subtitle: '사르르 녹이는 상태이상',
    icon: '🍫',
    color: '#9575CD',
    desc: '따끈한 스모어와 꾸덕한 가나슈 늪으로 상대를 재우거나 홀립니다.',
  },
  {
    id: 'quirky',
    name: '깜짝 레시피',
    subtitle: '운과 변칙의 마카롱 룰렛',
    icon: '🎲',
    color: '#4DB6AC',
    desc: '랜덤 주사위와 카멜레온 미러링으로 짜릿하게 판을 뒤집습니다.',
  },
  {
    id: 'elemental',
    name: '원소 플레이팅',
    subtitle: '속성과 테루아 날씨',
    icon: '🌈',
    color: '#4FA3E0',
    desc: '자기 속성의 시럽 드리즐과 파티세리 날씨로 전장을 지배합니다.',
  },
]

export interface SkillNodeDef {
  id: string
  branch: SkillBranchId
  tier: 1
  name: string
  kind: 'active' | 'passive'
  power: number // 액티브 기본 위력 (패시브는 0)
  spCost: number
  icon: string
  asmr: DessertSoundKind
  onomatopoeia: string
  effectText: string
  kindTag: 'attack' | 'shield' | 'heal' | 'debuff' | 'dice' | 'mirror' | 'weather' | 'passive'
}

export const SKILL_NODES_T1: SkillNodeDef[] = [
  // 1. 크런치 맹공 가지
  {
    id: 'kataifi-strike',
    branch: 'assault',
    tier: 1,
    name: '바사삭 카다이프 돌진',
    kind: 'active',
    power: 45,
    spCost: 1,
    icon: '🌾',
    asmr: 'kataifi-crunch',
    onomatopoeia: '바사삭-! 자작자작 💚✨',
    effectText: '위력 45 크런치 강타 + 기세 +1 상승',
    kindTag: 'attack',
  },
  {
    id: 'cookie-flurry',
    branch: 'assault',
    tier: 1,
    name: '오독오독 연속 스냅',
    kind: 'active',
    power: 18,
    spCost: 1,
    icon: '🍪',
    asmr: 'cookie-crisp',
    onomatopoeia: '오독-! 바삭바삭 🍪✨',
    effectText: '위력 18 × 2~4회 연속 크런치 타격',
    kindTag: 'attack',
  },
  {
    id: 'wax-ball-burst',
    branch: 'assault',
    tier: 1,
    name: '왁싱볼 과즙팡 파열',
    kind: 'active',
    power: 42,
    spCost: 1,
    icon: '🫧',
    asmr: 'wax-pop',
    onomatopoeia: '톡! 파삭~ 쭈욱 츄릅! 🫧💦',
    effectText: '위력 42 + 밀랍 껍질 파열과 함께 과즙 시럽 분출로 기세 +1',
    kindTag: 'attack',
  },
  {
    id: 'crunch-excitement',
    branch: 'assault',
    tier: 1,
    name: '크런치 텐션',
    kind: 'passive',
    power: 0,
    spCost: 1,
    icon: '🔥',
    asmr: 'kataifi-crunch',
    onomatopoeia: '바사삭 텐션 업!',
    effectText: '패시브: 쌓인 기세 1당 공격력 +5% 증가',
    kindTag: 'passive',
  },

  // 2. 슈가코팅 철벽 가지
  {
    id: 'sugar-shield',
    branch: 'fortress',
    tier: 1,
    name: '유리알 설탕코팅 경화',
    kind: 'active',
    power: 0,
    spCost: 1,
    icon: '🍓',
    asmr: 'sugar-crack',
    onomatopoeia: '빠작-! 반짝반짝 🍓💎',
    effectText: '2턴간 투명 설탕 유리막으로 방어력 +40%',
    kindTag: 'shield',
  },
  {
    id: 'mochi-cushion',
    branch: 'fortress',
    tier: 1,
    name: '쫀득 모찌 쿠션 방어',
    kind: 'active',
    power: 20,
    spCost: 1,
    icon: '🍡',
    asmr: 'mochi-squish',
    onomatopoeia: '쫀득~ 포근포근 🍡🤍',
    effectText: '최대 체력 18% 보호막 생성 + 가벼운 반동 타격',
    kindTag: 'shield',
  },
  {
    id: 'pudding-bounce',
    branch: 'fortress',
    tier: 1,
    name: '탱글 탄성 둔감',
    kind: 'passive',
    power: 0,
    spCost: 1,
    icon: '🍮',
    asmr: 'pudding-jiggle',
    onomatopoeia: '탱글~ 출렁! 🍮',
    effectText: '패시브: 치명타 피해를 흡수하고 피격 피해 10% 감소',
    kindTag: 'passive',
  },

  // 3. 달콤 교감 가지
  {
    id: 'sweet-gaze',
    branch: 'bond',
    tier: 1,
    name: '파티시에 주인 바라보기',
    kind: 'active',
    power: 0,
    spCost: 1,
    icon: '💖',
    asmr: 'syrup-drizzle',
    onomatopoeia: '샤르르~ 하트 뿅뿅 💖✨',
    effectText: '유대 +2, 체력 18% 회복 + 다음 공격 필중 & 치명타율 상승',
    kindTag: 'heal',
  },
  {
    id: 'beloved-dessert',
    branch: 'bond',
    tier: 1,
    name: '사랑받는 시그니처',
    kind: 'passive',
    power: 0,
    spCost: 1,
    icon: '🍰',
    asmr: 'mochi-squish',
    onomatopoeia: '쫀득~ 사랑 듬뿍!',
    effectText: '패시브: 대전 시작 시 달콤함(기분) 80 이상이면 전 능력치 +5%',
    kindTag: 'passive',
  },
  {
    id: 'bite-cheer',
    branch: 'bond',
    tier: 1,
    name: '한입 투표 응원받기',
    kind: 'passive',
    power: 0,
    spCost: 1,
    icon: '🥄',
    asmr: 'syrup-drizzle',
    onomatopoeia: '와아~ 한입 응원!',
    effectText: '패시브: 지인에게 받은 한입 투표(좋아요)에 비례해 최대 체력 +8%',
    kindTag: 'passive',
  },

  // 4. 퐁듀 요술 가지
  {
    id: 'smore-lullaby',
    branch: 'mystic',
    tier: 1,
    name: '따끈 마시멜로 자장가',
    kind: 'active',
    power: 28,
    spCost: 1,
    icon: '🔥',
    asmr: 'smore-sizzle',
    onomatopoeia: '치익~ 폭신 사르르 🔥💤',
    effectText: '위력 28 + 포근한 마시멜로 온기로 상대 수면(50%) 부여',
    kindTag: 'debuff',
  },
  {
    id: 'ganache-swamp',
    branch: 'mystic',
    tier: 1,
    name: '꾸덕 가나슈 늪 뿌리기',
    kind: 'active',
    power: 32,
    spCost: 1,
    icon: '🍫',
    asmr: 'choco-melt',
    onomatopoeia: '사르르~ 꾸덕꾸덕 🍫✨',
    effectText: '위력 32 + 2턴간 상대 속도·명중률 -25% 감소',
    kindTag: 'debuff',
  },
  {
    id: 'topping-snatch',
    branch: 'mystic',
    tier: 1,
    name: '달콤 토핑 슬쩍하기',
    kind: 'passive',
    power: 0,
    spCost: 1,
    icon: '🍒',
    asmr: 'syrup-drizzle',
    onomatopoeia: '톡! 토핑 슬쩍 🍒',
    effectText: '패시브: 공격할 때 25% 확률로 상대 버프를 훔쳐 체력 소량 회복',
    kindTag: 'passive',
  },

  // 5. 깜짝 레시피 괴짜 가지
  {
    id: 'macaron-roulette',
    branch: 'quirky',
    tier: 1,
    name: '랜덤 마카롱 주사위',
    kind: 'active',
    power: 55,
    spCost: 1,
    icon: '🎲',
    asmr: 'syrup-drizzle',
    onomatopoeia: '데구르르~ 톡톡톡 🎲🌈',
    effectText: '주사위 눈(1~6)에 따라 위력 25 ~ 135 대폭발!',
    kindTag: 'dice',
  },
  {
    id: 'chameleon-mirror',
    branch: 'quirky',
    tier: 1,
    name: '말랑 카멜레온 따라쟁이',
    kind: 'active',
    power: 48,
    spCost: 1,
    icon: '🦎',
    asmr: 'mochi-squish',
    onomatopoeia: '말랑~ 똑같이 변신! 🦎✨',
    effectText: '상대의 특기 식감 기술을 그대로 흉내 내어 위력 48 반격',
    kindTag: 'mirror',
  },
  {
    id: 'lucky-sprinkle',
    branch: 'quirky',
    tier: 1,
    name: '뜻밖의 별사탕 행운',
    kind: 'passive',
    power: 0,
    spCost: 1,
    icon: '⭐',
    asmr: 'sugar-crack',
    onomatopoeia: '빠작! 행운의 별사탕 ⭐',
    effectText: '패시브: 상대의 강한 공격을 15% 확률로 미끄러지듯 회피',
    kindTag: 'passive',
  },

  // 6. 원소 플레이팅 가지
  {
    id: 'element-drizzle',
    branch: 'elemental',
    tier: 1,
    name: '시그니처 원소 드리즐',
    kind: 'active',
    power: 46,
    spCost: 1,
    icon: '🌈',
    asmr: 'syrup-drizzle',
    onomatopoeia: '쪼르륵~ 원소 시럽 폭발! 🌈✨',
    effectText: '자기 속성 시럽 위력 46 공격 (상성 우위 시 1.3배)',
    kindTag: 'attack',
  },
  {
    id: 'patisserie-weather',
    branch: 'elemental',
    tier: 1,
    name: '파티세리 테루아 날씨',
    kind: 'active',
    power: 25,
    spCost: 1,
    icon: '☀️',
    asmr: 'smore-sizzle',
    onomatopoeia: '화아악~ 오븐 테루아 발동! ☀️✨',
    effectText: '5턴간 내 속성 날씨를 만들어 매 턴 공격·속도 +15%',
    kindTag: 'weather',
  },
  {
    id: 'element-affinity',
    branch: 'elemental',
    tier: 1,
    name: '원소 풍미 친화',
    kind: 'passive',
    power: 0,
    spCost: 1,
    icon: '✨',
    asmr: 'syrup-drizzle',
    onomatopoeia: '풍미 가득!',
    effectText: '패시브: 자기 속성 스킬 위력 +12% 상시 증가',
    kindTag: 'passive',
  },
]

export const DEFAULT_UNLOCKED_SKILLS = ['kataifi-strike', 'sugar-shield', 'sweet-gaze', 'element-drizzle']
export const DEFAULT_EQUIPPED_SKILLS = ['kataifi-strike', 'sugar-shield', 'sweet-gaze', 'element-drizzle']

export const BATTLE_STANCES: { id: BattleStanceId; name: string; icon: string; desc: string }[] = [
  { id: 'aggressive', name: '공격형 (바사삭 올인)', icon: '⚔️', desc: '공격 스킬을 최우선으로 몰아치며 기세를 빠르게 쌓아요.' },
  { id: 'balanced', name: '균형형 (황금 레시피)', icon: '⚖️', desc: '상황에 맞춰 공격·방어·회복 스킬을 고르게 사용해요.' },
  { id: 'defensive', name: '방어형 (슈가 철벽)', icon: '🛡️', desc: '체력이 줄어들면 코팅 방어와 회복을 먼저 챙겨요.' },
  { id: 'trickster', name: '요술형 (변칙 플레이팅)', icon: '🎩', desc: '상태이상, 주사위, 날씨 스킬로 상대를 흔들어요.' },
]

