import { useId } from 'react'
import './monsters.css'
import { SPECIES } from './registry'
import type { BodyType, MonsterLook } from './types'

const BODY_SCALE: Record<BodyType, [number, number]> = {
  chubby: [1.1, 0.95],
  normal: [1, 1],
  slim: [0.92, 1.06],
}

type Props = {
  look: MonsterLook
  size?: number
  animate?: boolean
  title?: string
  // 화면 높이에 맞춰 크기가 줄어든다 (한 화면에 들어오는 홈용)
  fluid?: boolean
}

// 개체마다 다른 외형(look)을 받아 레이어 SVG 몬스터를 그린다
export default function MonsterView({ look, size = 240, animate = true, title, fluid = false }: Props) {
  const uid = useId().replace(/:/g, '')
  const def = SPECIES[look.species]
  if (!def) return null

  const [bx, by] = BODY_SCALE[look.bodyType]
  const sx = bx * look.scale
  const sy = by * look.scale
  const Art = def.Art

  return (
    <svg
      viewBox="0 0 240 260"
      {...(fluid ? {} : { width: size, height: (size * 260) / 240 })}
      role="img"
      aria-label={title ?? def.name}
      style={{ overflow: 'visible' }}
      className={look.shiny ? 'mon-shiny' : undefined}
    >
      <ellipse cx={120} cy={239} rx={60} ry={8} fill="rgba(89,62,34,0.14)" />
      <g transform={`translate(120 236) scale(${sx} ${sy}) translate(-120 -236)`}>
        <g className={animate ? 'mon-bounce' : undefined}>
          <g className={animate ? 'mon-breathe' : undefined}>
            <Art look={look} uid={uid} />
          </g>
        </g>
      </g>
      {look.shiny && (
        <g fill="#FFD84D" stroke="#fff" strokeWidth={1.2} className={animate ? 'mon-twinkle' : undefined}>
          <path d="M 28 60 l 4 10 l 10 4 l -10 4 l -4 10 l -4 -10 l -10 -4 l 10 -4 Z" />
          <path d="M 208 36 l 3 8 l 8 3 l -8 3 l -3 8 l -3 -8 l -8 -3 l 8 -3 Z" />
          <path d="M 214 150 l 3 7 l 7 3 l -7 3 l -3 7 l -3 -7 l -7 -3 l 7 -3 Z" />
        </g>
      )}
    </svg>
  )
}
