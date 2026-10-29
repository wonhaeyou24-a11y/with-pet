// 화면에 보여 줄 이름·설명·색 같은 표시용 설정
import type { Element } from '../monsters/types'

export const SPECIES_INFO: Record<string, { name: string; desc: string }> = {
  mongsil: { name: '몽실', desc: '바람을 타고 둥실 떠다니는 구름 양 몬스터' },
  kongkong: { name: '콩콩', desc: '씨앗 모자를 쓰고 숲을 뛰어다니는 다람쥐 몬스터' },
  beongaekkori: { name: '번개꼬리', desc: '수정 번개 꼬리를 흔드는 날쌘 족제비 몬스터' },
  gangcheoldeung: { name: '강철등', desc: '등에 단단한 판갑을 두른 듬직한 늑대 몬스터' },
  heugyeom: { name: '흑염', desc: '검은 불꽃 갈기를 가진 의젓한 사자 몬스터' },
  byeolbineul: { name: '별비늘', desc: '별자리 무늬 비늘을 가진 작은 용 몬스터' },
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
