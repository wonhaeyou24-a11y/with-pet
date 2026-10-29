// 화면에 보여 줄 이름·설명·식감·기본 플레이팅 받침대 같은 표시용 설정
import type { DessertBaseId } from '../monsters/MallangChameleon'
import type { Element } from '../monsters/types'

export const SPECIES_INFO: Record<
  string,
  { name: string; desc: string; textureLabel: string; defaultBase: DessertBaseId }
> = {
  'dubai-cookie': {
    name: '두바이쫀득쿠키',
    desc: '꾸덕한 초코 쿠키 속에 바삭한 금빛 카다이프와 피스타치오 크림이 가득 찬 캐릭터',
    textureLabel: '💚 바사삭 카다이프 & 쫀득 쿠키',
    defaultBase: 'choco-cookie',
  },
  'wax-ball': {
    name: '톡톡왁싱볼',
    desc: '얇은 파스텔 밀랍 왁스 캡슐을 깨물면 진한 과일 시럽이 쭈욱 터져 나오는 ASMR 인기 캐릭터',
    textureLabel: '🫧 톡! 파삭 과즙팡 왁싱볼',
    defaultBase: 'parfait-cup',
  },
  tanghulu: {
    name: '유리알탕후루',
    desc: '투명하고 바삭한 유리알 설탕 시럽 코팅이 반짝이는 과일 탕후루',
    textureLabel: '🍓 빠작! 유리알 설탕 코팅',
    defaultBase: 'parfait-cup',
  },
  smore: {
    name: '스모어마시멜로',
    desc: '모닥불에 노릇노릇하게 구워진 폭신쫀득 고양이 발바닥 마시멜로',
    textureLabel: '🔥 바삭 크래커 & 폭신 마시멜로',
    defaultBase: 'choco-cookie',
  },
  mochi: {
    name: '찹쌀떡모찌',
    desc: '케이크와 쿠키 위에 사르르 녹아내리는 쫀득 말랑 디저트 모찌',
    textureLabel: '🍡 쫀득~ 말랑말랑 찹쌀떡',
    defaultBase: 'strawberry-cake',
  },
  pudding: {
    name: '말랑푸딩',
    desc: '달콤쌉싸름한 카라멜 시럽이 흐르는 탱글탱글 커스터드 푸딩',
    textureLabel: '🍮 탱글탱글~ 출렁 커스터드',
    defaultBase: 'custard-pudding',
  },
  jelly: {
    name: '쫀득젤리',
    desc: '영롱한 유리알 광택과 달콤한 과일 코어가 비치는 탱글 구미 젤리',
    textureLabel: '🐻 탱글~ 뽀용 과일 구미',
    defaultBase: 'macaron-cushion',
  },
  choco: {
    name: '달콤초코',
    desc: '진한 가나슈 위에 따뜻한 퐁듀 시럽이 사르르 녹아내리는 달콤 초코',
    textureLabel: '🍫 사르르~ 꾸덕 퐁듀 가나슈',
    defaultBase: 'strawberry-cake',
  },
  chameleon: {
    name: '말랑카멜레온',
    desc: '무엇으로든 변신하고 몸에 직접 그림을 그릴 수 있는 모찌 카멜레온',
    textureLabel: '🦎 말랑말랑 만능 모찌 반죽',
    defaultBase: 'macaron-cushion',
  },
  mongsil: {
    name: '몽실',
    desc: '바람을 타고 둥실 떠다니는 구름 솜사탕 양 몬스터',
    textureLabel: '☁️ 폭신폭신 구름 솜사탕',
    defaultBase: 'macaron-cushion',
  },
  kongkong: {
    name: '콩콩',
    desc: '씨앗 모자를 쓰고 숲을 뛰어다니는 도토리 쿠키 다람쥐 몬스터',
    textureLabel: '🌰 오독오독 도토리 쿠키',
    defaultBase: 'choco-cookie',
  },
  beongaekkori: {
    name: '번개꼬리',
    desc: '수정 번개 꼬리를 흔드는 날쌘 레몬 소다 족제비 몬스터',
    textureLabel: '⚡ 톡톡 스파클링 소다캔디',
    defaultBase: 'parfait-cup',
  },
  gangcheoldeung: {
    name: '강철등',
    desc: '등에 단단한 비스킷 판갑을 두른 듬직한 가디언 몬스터',
    textureLabel: '🍪 단단 바삭 비스킷 크러스트',
    defaultBase: 'choco-cookie',
  },
  heugyeom: {
    name: '흑염',
    desc: '검은 불꽃 갈기를 가진 다크초코 플람베 사자 몬스터',
    textureLabel: '🔥 다크초코 크림 브륄레',
    defaultBase: 'custard-pudding',
  },
  byeolbineul: {
    name: '별비늘',
    desc: '별자리 무늬 비늘을 가진 은하수 별사탕 작은 용 몬스터',
    textureLabel: '✨ 빠작 별사탕 크리스탈',
    defaultBase: 'parfait-cup',
  },
}

export function defaultDessertBase(species: string): DessertBaseId {
  return SPECIES_INFO[species]?.defaultBase ?? 'strawberry-cake'
}

export const ELEMENT_INFO: Record<Element, { label: string; color: string }> = {
  fire: { label: '불', color: 'var(--el-fire)' },
  water: { label: '물', color: 'var(--el-water)' },
  grass: { label: '풀', color: 'var(--el-grass)' },
  electric: { label: '전기', color: 'var(--el-electric)' },
  wind: { label: '바람', color: 'var(--el-wind)' },
  earth: { label: '땅', color: 'var(--el-earth)' },
}

export const RARITY_INFO = {
  common: { label: '일반 알' },
  rare: { label: '희귀 알' },
  legendary: { label: '전설 알' },
} as const

export const STAT_INFO = [
  { key: 'hp', label: '체력', color: 'var(--stat-hp)' },
  { key: 'atk', label: '공격', color: 'var(--stat-atk)' },
  { key: 'def', label: '방어', color: 'var(--stat-def)' },
  { key: 'spd', label: '속도', color: 'var(--stat-spd)' },
  { key: 'int', label: '지능', color: 'var(--stat-int)' },
  { key: 'cha', label: '매력', color: 'var(--stat-cha)' },
] as const

// 능력치 막대의 꽉 찬 기준. 실제 능력치 범위가 정해지면 여기서 조정한다.
export const STAT_BAR_MAX = 100

export const MUTATION_LABEL: Record<string, string> = {
  crystal: '수정 몸',
  shadow: '그림자 몸',
  gold: '황금 몸',
}

// 성격 축 두 개(활발↔차분, 응석↔독립)의 위치에 이름을 붙인다
export function personalityLabel(active: number, bond: number) {
  if (active >= 0 && bond >= 0) return '어리광쟁이'
  if (active >= 0) return '씩씩이'
  if (bond >= 0) return '몽글이'
  return '의젓이'
}
