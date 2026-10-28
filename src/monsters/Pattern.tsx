import type { ReactNode } from 'react'
import { rng } from './random'

type Props = { seed: number; color: string; clipId: string }

// 몬스터 고유번호(시드)에서 점·줄무늬·얼룩·고리 무늬를 자동으로 만든다. 몸 모양(clipId) 안에만 그려진다.
export default function Pattern({ seed, color, clipId }: Props) {
  const r = rng(seed)
  const kind = Math.floor(r() * 4)
  const items: ReactNode[] = []

  if (kind === 0) {
    const n = 9 + Math.floor(r() * 5)
    for (let i = 0; i < n; i++) {
      items.push(<circle key={i} cx={62 + r() * 116} cy={50 + r() * 166} r={3 + r() * 4.5} fill={color} />)
    }
  } else if (kind === 1) {
    const n = 4 + Math.floor(r() * 3)
    const amp = 6 + r() * 8
    for (let i = 0; i < n; i++) {
      const y = 62 + i * (150 / n) + r() * 8
      items.push(
        <path
          key={i}
          d={`M 40 ${y} q 20 ${-amp} 40 0 t 40 0 t 40 0 t 40 0 t 40 0`}
          fill="none"
          stroke={color}
          strokeWidth={4 + r() * 3}
          strokeLinecap="round"
        />,
      )
    }
  } else if (kind === 2) {
    const n = 5 + Math.floor(r() * 4)
    for (let i = 0; i < n; i++) {
      items.push(
        <ellipse
          key={i}
          cx={64 + r() * 112}
          cy={52 + r() * 164}
          rx={6 + r() * 9}
          ry={5 + r() * 6}
          transform={`rotate(${Math.floor(r() * 180)} ${120} ${130})`}
          fill={color}
        />,
      )
    }
  } else {
    const n = 6 + Math.floor(r() * 4)
    for (let i = 0; i < n; i++) {
      items.push(
        <circle key={i} cx={64 + r() * 112} cy={52 + r() * 164} r={4 + r() * 5} fill="none" stroke={color} strokeWidth={2.6} />,
      )
    }
  }

  return (
    <g clipPath={`url(#${clipId})`} opacity={0.6}>
      {items}
    </g>
  )
}
