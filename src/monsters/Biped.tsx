// 공통 눈매(활발/차분/독립), 점토 입체 그라데이션 정의 및 팔레트 타입
import type { Expression } from './types'

export const INK = '#3B2F2F'
export const SW = 3.2

export interface Palette {
  fur: string
  shade: string
  belly: string
  inner: string
  accent: string
  accent2: string
  pad: string
  blush: string
  pattern: string
  eye: string
}

// 종족 공통 입체 눈매 (성격에 따라 3종: round=활발, sleepy=차분, sharp=독립 + 눈동자 하이라이트 강화)
export function Eye({
  x,
  y,
  kind,
  side,
  color,
  lid,
  ember = false,
}: {
  x: number
  y: number
  kind: Expression
  side: 1 | -1
  color: string
  lid: string
  ember?: boolean
}) {
  if (kind === 'sleepy') {
    return (
      <g>
        <path d={`M ${x - 8.5} ${y} A 8.5 8.5 0 0 0 ${x + 8.5} ${y} Z`} fill={color} />
        {ember && <circle cx={x} cy={y + 3.2} r={4} fill="#FFB347" opacity={0.85} />}
        <path d={`M ${x - 10} ${y} Q ${x} ${y + 1.5} ${x + 10} ${y}`} fill="none" stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
        <circle cx={x - 2.6} cy={y + 2.5} r={2.2} fill="#fff" />
        <circle cx={x + 2.4} cy={y + 4.2} r={1.1} fill="#fff" opacity={0.8} />
      </g>
    )
  }
  if (kind === 'sharp') {
    const s = side
    return (
      <g>
        <ellipse cx={x} cy={y} rx={8} ry={9} fill={INK} />
        <ellipse cx={x} cy={y + 0.5} rx={6.6} ry={7.4} fill={color} />
        {ember && <ellipse cx={x} cy={y + 1.5} rx={3.8} ry={4.4} fill="#FF9E44" opacity={0.9} />}
        <polygon
          points={`${x - s * 10.5},${y - 13} ${x + s * 10.5},${y - 13} ${x + s * 10.5},${y - 1.2} ${x - s * 10.5},${y - 6.2}`}
          fill={lid}
        />
        <path d={`M ${x - s * 10.5} ${y - 6.2} L ${x + s * 10.5} ${y - 1.2}`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
        <circle cx={x - 2.2} cy={y + 2.2} r={2.6} fill="#fff" />
        <circle cx={x + 2.5} cy={y + 4.2} r={1.2} fill="#fff" />
      </g>
    )
  }
  return (
    <g>
      <ellipse cx={x} cy={y} rx={8.8} ry={10.2} fill={INK} />
      <ellipse cx={x} cy={y + 0.5} rx={7.4} ry={8.6} fill={color} />
      {ember && <ellipse cx={x} cy={y + 2} rx={4.6} ry={5.2} fill="#FFA74F" opacity={0.88} />}
      <circle cx={x - 2.8} cy={y - 3.2} r={3.5} fill="#fff" />
      <circle cx={x + 2.8} cy={y + 3.6} r={1.8} fill="#fff" />
      <circle cx={x - 3.2} cy={y + 3.2} r={1} fill="#fff" opacity={0.7} />
    </g>
  )
}

// 점토(Warm Clay) 질감을 살리는 공통 입체 그라데이션 정의
export function ClayGradientDefs({ uid, fur, shade, belly, accent, accent2 }: { uid: string; fur: string; shade: string; belly: string; accent: string; accent2: string }) {
  return (
    <>
      <radialGradient id={`${uid}-clay-fur`} cx="38%" cy="30%" r="68%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.38} />
        <stop offset="28%" stopColor={fur} stopOpacity={1} />
        <stop offset="100%" stopColor={shade} stopOpacity={1} />
      </radialGradient>
      <linearGradient id={`${uid}-clay-belly`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.5} />
        <stop offset="40%" stopColor={belly} stopOpacity={1} />
        <stop offset="100%" stopColor={fur} stopOpacity={0.9} />
      </linearGradient>
      <linearGradient id={`${uid}-clay-accent`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={accent2} />
        <stop offset="100%" stopColor={accent} />
      </linearGradient>
    </>
  )
}
