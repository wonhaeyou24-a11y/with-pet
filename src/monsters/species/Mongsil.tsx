import type { ReactNode } from 'react'
import Pattern from '../Pattern'
import { scallopPath } from '../shapes'
import type { ArtProps, Expression, SpeciesDef } from '../types'

const INK = '#4A3330'
const SW = 3.2

interface Palette {
  wool: string
  shade: string
  skin: string
  ear: string
  horn: string
  accent: string
  leaf: string
  hoof: string
  blush: string
  pattern: string
}

// 몽실 팔레트 6개: 어울리는 색만 모아 아무 색이나 섞여 촌스러워지는 것을 막는다
const PALETTES: Palette[] = [
  { wool: '#FFF4DE', shade: '#BCE6D2', skin: '#FCE0BE', ear: '#F2B79A', horn: '#F2C48A', accent: '#8FD3B6', leaf: '#7CC08E', hoof: '#6B4A45', blush: '#FF9C9C', pattern: '#8FD3B6' },
  { wool: '#FFE9F0', shade: '#F6B9D0', skin: '#FFE4D2', ear: '#F5A9B5', horn: '#F0B6C8', accent: '#F58FB0', leaf: '#8CCB9A', hoof: '#6B4A52', blush: '#FF8FA8', pattern: '#F58FB0' },
  { wool: '#EAF4FF', shade: '#A9CFF5', skin: '#FBE4D2', ear: '#F2B9A6', horn: '#9FC4EE', accent: '#6FB1EA', leaf: '#7CC0A0', hoof: '#55464F', blush: '#FFA0A6', pattern: '#6FB1EA' },
  { wool: '#FFF7CF', shade: '#F5D77A', skin: '#FFE7C4', ear: '#F2B88C', horn: '#E8B85A', accent: '#F2B134', leaf: '#8DC27A', hoof: '#6B4F3A', blush: '#FF9E8A', pattern: '#F2B134' },
  { wool: '#F2EAFF', shade: '#CBB6F2', skin: '#FBE3D8', ear: '#E9B3C4', horn: '#BDA4EA', accent: '#A582E6', leaf: '#86C79C', hoof: '#5B4560', blush: '#FF9CB4', pattern: '#A582E6' },
  { wool: '#DDE2EC', shade: '#9EA9BE', skin: '#F2D7C6', ear: '#D9A9A0', horn: '#8794AD', accent: '#6C7A96', leaf: '#7DB48E', hoof: '#463E4A', blush: '#F59A9A', pattern: '#6C7A96' },
]

const BODY_D = scallopPath(120, 174, 54, 42, 9, 0.62, -Math.PI / 2 + 0.2)
const HEAD_D = scallopPath(120, 98, 68, 58, 11, 0.62)
const BODY_HI_D = scallopPath(116, 169, 45, 33, 9, 0.62, -Math.PI / 2 + 0.2)
const HEAD_HI_D = scallopPath(117, 93, 59, 48, 11, 0.62)
// 이마를 덮는 앞머리 털 (얼굴 위쪽에만 보이도록 얼굴 모양으로 잘라 쓴다)
const BANGS_D = 'M 76 70 H 164 V 94 A 8.8 8.8 0 0 1 146.4 94 A 8.8 8.8 0 0 1 128.8 94 A 8.8 8.8 0 0 1 111.2 94 A 8.8 8.8 0 0 1 93.6 94 A 8.8 8.8 0 0 1 76 94 Z'

function Eye({ x, y, kind, side, p }: { x: number; y: number; kind: Expression; side: 1 | -1; p: Palette }) {
  if (kind === 'sleepy') {
    return (
      <g>
        <path d={`M ${x - 8} ${y} A 8 8 0 0 0 ${x + 8} ${y} Z`} fill={INK} />
        <path d={`M ${x - 9.5} ${y} H ${x + 9.5}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <circle cx={x - 2.5} cy={y + 2.6} r={2} fill="#fff" />
      </g>
    )
  }
  if (kind === 'sharp') {
    const s = side
    return (
      <g>
        <ellipse cx={x} cy={y} rx={7.6} ry={8.4} fill={INK} />
        <polygon
          points={`${x - s * 10},${y - 13} ${x + s * 10},${y - 13} ${x + s * 10},${y - 1.5} ${x - s * 10},${y - 6}`}
          fill={p.skin}
        />
        <path d={`M ${x - s * 10} ${y - 6} L ${x + s * 10} ${y - 1.5}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <circle cx={x - 2} cy={y + 2.5} r={2.4} fill="#fff" />
      </g>
    )
  }
  return (
    <g>
      <ellipse cx={x} cy={y} rx={8.4} ry={9.8} fill={INK} />
      <circle cx={x - 2.8} cy={y - 3.4} r={3.4} fill="#fff" />
      <circle cx={x + 2.8} cy={y + 3.6} r={1.7} fill="#fff" />
    </g>
  )
}

function earsLeft(variant: number, p: Palette): ReactNode {
  switch (variant % 4) {
    case 0: // 처진 귀
      return (
        <g>
          <path d="M 84 94 C 70 82 50 90 41 103 C 38 109 44 114 51 112 C 63 110 76 108 86 104 Z" fill={p.skin} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M 76 98 C 66 92 54 97 49 105 C 58 106 68 104 78 102 Z" fill={p.ear} />
        </g>
      )
    case 1: // 쫑긋 귀
      return (
        <g>
          <path d="M 80 88 C 74 68 64 56 54 52 C 49 64 51 84 62 100 Z" fill={p.skin} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M 71 88 C 67 76 62 68 57 64 C 56 74 58 84 64 94 Z" fill={p.ear} />
        </g>
      )
    case 2: // 말린 뿔
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M 80 88 C 58 80 40 94 46 110 C 51 123 69 120 68 108 C 67 100 57 99 58 106" stroke={INK} strokeWidth={11} />
          <path d="M 80 88 C 58 80 40 94 46 110 C 51 123 69 120 68 108 C 67 100 57 99 58 106" stroke={p.horn} strokeWidth={5} />
        </g>
      )
    default: // 동글 귀
      return (
        <g>
          <circle cx={58} cy={100} r={14} fill={p.skin} stroke={INK} strokeWidth={SW} />
          <circle cx={58} cy={100} r={7} fill={p.ear} />
        </g>
      )
  }
}

function tail(variant: number, p: Palette): ReactNode {
  switch (variant % 4) {
    case 0: // 솜뭉치
      return <circle cx={172} cy={200} r={12} fill={p.wool} stroke={INK} strokeWidth={SW} />
    case 1: // 돌돌 꼬리
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M 164 206 C 176 212 186 200 178 192 C 172 187 166 194 171 197" stroke={INK} strokeWidth={9} />
          <path d="M 164 206 C 176 212 186 200 178 192 C 172 187 166 194 171 197" stroke={p.wool} strokeWidth={4} />
        </g>
      )
    case 2: // 세 갈래 털
      return (
        <g fill={p.wool} stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <circle cx={168} cy={204} r={8} />
          <circle cx={178} cy={197} r={7} />
          <circle cx={181} cy={209} r={6.5} />
        </g>
      )
    default: // 바람 꼬리
      return (
        <g>
          <path d="M 162 208 C 164 196 180 192 186 200 C 192 200 194 210 186 212 C 178 218 166 216 162 208 Z" fill={p.wool} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M 170 204 C 176 200 182 202 182 206" fill="none" stroke={p.accent} strokeWidth={2.6} strokeLinecap="round" />
        </g>
      )
  }
}

function top(variant: number, p: Palette): ReactNode {
  switch (variant % 4) {
    case 0: // 바람 소용돌이
      return (
        <path
          d="M 120 86 C 113 86 112 77 119 76 C 126 75 128 84 121 87 C 117 89 114 85 117 83"
          fill="none"
          stroke={INK}
          strokeWidth={2.8}
          strokeLinecap="round"
        />
      )
    case 1: // 새싹
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 120 52 C 112 40 100 40 96 46 C 104 54 114 56 120 52 Z" fill={p.leaf} />
          <path d="M 120 52 C 128 38 141 38 145 44 C 137 53 126 56 120 52 Z" fill={p.leaf} />
        </g>
      )
    case 2: // 솜털 꼬불
      return (
        <path
          d="M 112 52 C 108 36 126 30 130 42 C 133 50 124 54 121 48"
          fill="none"
          stroke={INK}
          strokeWidth={9}
          strokeLinecap="round"
        />
      )
    default: // 리본
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 120 52 L 100 40 L 100 62 Z" fill={p.accent} />
          <path d="M 120 52 L 140 40 L 140 62 Z" fill={p.accent} />
          <circle cx={120} cy={52} r={6} fill={p.accent} />
        </g>
      )
  }
}

function topTuftInner(variant: number, p: Palette): ReactNode {
  return variant % 4 === 2 ? (
    <path d="M 112 52 C 108 36 126 30 130 42 C 133 50 124 54 121 48" fill="none" stroke={p.wool} strokeWidth={4} strokeLinecap="round" />
  ) : null
}

export function MongsilArt({ look, uid }: ArtProps) {
  const base = PALETTES[look.palette % PALETTES.length]
  // 빛나는 몬스터: 털 색과 그림자 색을 맞바꿔 색이 반전된 모습으로 만든다
  const p = look.shiny ? { ...base, wool: base.shade, shade: base.wool } : base
  const bodyClip = `${uid}-body`
  const headClip = `${uid}-head`
  const woolClip = `${uid}-wool`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <clipPath id={bodyClip}>
          <path d={BODY_D} />
        </clipPath>
        <clipPath id={headClip}>
          <path d={HEAD_D} />
        </clipPath>
        <clipPath id={woolClip}>
          <path d={BODY_D} />
          <path d={HEAD_D} />
        </clipPath>
      </defs>

      {/* 꼬리·다리·발 */}
      <g transform="translate(184 200) scale(1.35) translate(-174 -204)">{tail(look.tail, p)}</g>
      <g stroke={INK} strokeWidth={SW}>
        <rect x={93} y={203} width={22} height={30} rx={10} fill={p.skin} />
        <rect x={125} y={203} width={22} height={30} rx={10} fill={p.skin} />
        <path d="M 93 224 H 115 V 226 Q 115 235 106 235 H 102 Q 93 235 93 226 Z" fill={p.hoof} />
        <path d="M 125 224 H 147 V 226 Q 147 235 138 235 H 134 Q 125 235 125 226 Z" fill={p.hoof} />
        <ellipse cx={63} cy={184} rx={9} ry={12} transform="rotate(14 63 184)" fill={p.hoof} />
        <ellipse cx={177} cy={184} rx={9} ry={12} transform="rotate(-14 177 184)" fill={p.hoof} />
      </g>

      {/* 몸 털 */}
      <path d={BODY_D} fill={p.shade} stroke={INK} strokeWidth={SW} />
      <path d={BODY_HI_D} fill={p.wool} clipPath={`url(#${bodyClip})`} />
      <g fill="none" stroke={p.shade} strokeWidth={2.6} strokeLinecap="round">
        <path d="M 96 178 q 8 8 16 0" />
        <path d="M 128 188 q 8 8 16 0" />
        <path d="M 108 160 q 6 6 12 0" />
      </g>

      {/* 머리 털 */}
      <path d={HEAD_D} fill={p.shade} stroke={INK} strokeWidth={SW} />
      <path d={HEAD_HI_D} fill={p.wool} clipPath={`url(#${headClip})`} />

      {/* 고유 무늬 */}
      <Pattern seed={look.patternSeed} color={p.pattern} clipId={woolClip} />

      {/* 귀·뿔 (머리털 위로 튀어나오게) */}
      <g transform="translate(-4 4)">{earsLeft(look.ears, p)}</g>
      <g transform="translate(244 4) scale(-1 1)">{earsLeft(look.ears, p)}</g>

      {/* 얼굴 */}
      <ellipse cx={120} cy={113} rx={38} ry={31} fill={p.skin} stroke={INK} strokeWidth={SW} />
      <clipPath id={`${uid}-face`}>
        <ellipse cx={120} cy={113} rx={38} ry={31} />
      </clipPath>
      <g clipPath={`url(#${uid}-face)`}>
        <path d={BANGS_D} fill={p.wool} stroke={INK} strokeWidth={SW} />
      </g>
      <ellipse cx={91} cy={127} rx={8.5} ry={5.5} fill={p.blush} opacity={0.85} />
      <ellipse cx={149} cy={127} rx={8.5} ry={5.5} fill={p.blush} opacity={0.85} />
      <Eye x={103} y={114} kind={look.expression} side={1} p={p} />
      <Eye x={137} y={114} kind={look.expression} side={-1} p={p} />
      <ellipse cx={120} cy={123} rx={4} ry={2.8} fill="#F2A5A5" />
      <path d="M 111 129 Q 115.5 134.5 120 129 Q 124.5 134.5 129 129" fill="none" stroke={INK} strokeWidth={2.4} />

      {/* 머리 장식 */}
      <g transform={look.top % 4 === 0 ? undefined : 'translate(120 40) scale(1.35) translate(-120 -52)'}>
        {top(look.top, p)}
        {topTuftInner(look.top, p)}
      </g>
    </g>
  )
}

export const mongsil: SpeciesDef = {
  id: 'mongsil',
  name: '몽실',
  element: 'wind',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: MongsilArt,
}
