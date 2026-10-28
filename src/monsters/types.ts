import type { FC } from 'react'

export type BodyType = 'chubby' | 'normal' | 'slim'
export type Expression = 'round' | 'sleepy' | 'sharp'
export type Element = 'fire' | 'water' | 'grass' | 'electric' | 'wind' | 'earth'

// 부화할 때 서버가 정해서 monsters.parts(JSON)에 저장하는 외형. 화면은 이 값을 그림으로 바꿀 뿐이다.
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
}

export interface ArtProps {
  look: MonsterLook
  uid: string
}

export interface SpeciesDef {
  id: string
  name: string
  element: Element
  paletteCount: number
  partCounts: { ears: number; tail: number; top: number }
  Art: FC<ArtProps>
}
