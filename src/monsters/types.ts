import type { FC } from 'react'
import type { MallangCustom } from './MallangChameleon'

export type BodyType = 'chubby' | 'normal' | 'slim'
export type Expression = 'round' | 'sleepy' | 'sharp' | 'star' | 'mochi-sparkle' | 'heart' | 'winking'
export type Element = 'fire' | 'water' | 'grass' | 'electric' | 'wind' | 'earth'
export type MutationType = 'crystal' | 'shadow' | 'gold'

// 장식 7칸 슬롯 (기획서 "장식 (외형 전용)" 7칸 기준 + 별조각 염색 팔레트 번호)
export interface MonsterDecorations {
  head?: string | null // 머리: 별마법사 모자, 딸기 베레모, 왕관 등
  face?: string | null // 얼굴: 연금술 안경, 포근 수면안대, 별 스티커 등
  neck?: string | null // 목: 룬 무늬 머플러, 방울 리본, 마법 망토 칼라 등
  back?: string | null // 등: 유성 날개, 탐험가 배낭, 천사 날개 등
  hand?: string | null // 손: 별빛 등불 지팡이, 무지개 막대사탕, 룬 마법서 등
  bg?: string | null // 배경: 밤하늘 천문대, 이슬 숲, 구름 정원 등
  effect?: string | null // 이펙트: 황금 별자리 오라, 벚꽃 꽃보라, 번개 스파크 등
  dye?: number // 별조각 염색 색상 인덱스 (0 = 기본)
}

// 키우며 생기는 흔적 (기획서 "훈장 표식" 기준, 주인이 표시 On/Off 가능)
export interface MonsterMedals {
  enabled?: boolean
  towerStar?: boolean // 시련의 탑 30층 돌파 -> 이마의 별 표식
  goldMane?: boolean // 대전 100승 -> 갈기/귀 끝에 금빛
  bossScar?: boolean // 보스 토벌 -> 볼의 작은 번개/별 흉터
  championCrown?: boolean // 주간 챔피언 -> 머리 위 황금 입자 왕관
}

// 부화할 때 서버가 정해서 monsters.parts(JSON)에 저장하는 외형 + 특수변이·꾸미기·훈장·말랑카멜레온 확장
export interface MonsterLook {
  species: string
  palette: number
  bodyType: BodyType
  scale: number
  ears: number
  tail: number
  top: number
  expression: Expression
  patternSeed: number
  shiny: boolean
  mutation?: MutationType | string | null
  decorations?: MonsterDecorations
  medals?: MonsterMedals
  mallang?: MallangCustom
  evoStage?: number
  evoBranch?: string
}

export interface ArtProps {
  look: MonsterLook
  uid: string
}

export interface SpeciesDef {
  id: string
  name: string
  element: Element
  postureLabel: string
  silhouetteDesc: string
  paletteCount: number
  partCounts: { ears: number; tail: number; top: number }
  Art: FC<ArtProps>
}
