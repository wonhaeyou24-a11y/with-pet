import type { ReactNode } from 'react'
import { ClayGradientDefs, Eye, INK, SW } from '../Biped'
import Pattern from '../Pattern'
import { scallopPath } from '../shapes'
import type { ArtProps, SpeciesDef } from '../types'

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

// 몽실 팔레트 6개: 구름처럼 폭신하고 파스텔 톤이 감도는 양털 배색
const PALETTES: Palette[] = [
  { wool: '#FFF7E8', shade: '#BCE6D2', skin: '#FCE0BE', ear: '#F2B79A', horn: '#F2C48A', accent: '#76C7A2', leaf: '#7CC08E', hoof: '#6B4A45', blush: '#FF9C9C', pattern: '#8FD3B6' },
  { wool: '#FFEBF2', shade: '#F6B9D0', skin: '#FFE4D2', ear: '#F5A9B5', horn: '#F0B6C8', accent: '#F58FB0', leaf: '#8CCB9A', hoof: '#6B4A52', blush: '#FF8FA8', pattern: '#F58FB0' },
  { wool: '#EDF6FF', shade: '#A9CFF5', skin: '#FBE4D2', ear: '#F2B9A6', horn: '#9FC4EE', accent: '#6FB1EA', leaf: '#7CC0A0', hoof: '#55464F', blush: '#FFA0A6', pattern: '#6FB1EA' },
  { wool: '#FFF9D6', shade: '#F5D77A', skin: '#FFE7C4', ear: '#F2B88C', horn: '#E8B85A', accent: '#F2B134', leaf: '#8DC27A', hoof: '#6B4F3A', blush: '#FF9E8A', pattern: '#F2B134' },
  { wool: '#F4EDFF', shade: '#CBB6F2', skin: '#FBE3D8', ear: '#E9B3C4', horn: '#BDA4EA', accent: '#A582E6', leaf: '#86C79C', hoof: '#5B4560', blush: '#FF9CB4', pattern: '#A582E6' },
  { wool: '#E4E9F2', shade: '#9EA9BE', skin: '#F2D7C6', ear: '#D9A9A0', horn: '#8794AD', accent: '#6C7A96', leaf: '#7DB48E', hoof: '#463E4A', blush: '#F59A9A', pattern: '#6C7A96' },
]

// 자세 A: 둥실 떠 있는 구름 방울 체형 (통통한 구름 솜사탕 실루엣)
const BODY_D = scallopPath(120, 174, 56, 44, 10, 0.64, -Math.PI / 2 + 0.18)
const HEAD_D = scallopPath(120, 98, 70, 58, 12, 0.64)
const BODY_HI_D = scallopPath(115, 168, 46, 34, 10, 0.64, -Math.PI / 2 + 0.18)
const HEAD_HI_D = scallopPath(116, 92, 60, 48, 12, 0.64)
const BANGS_D =
  'M 76 68 H 164 V 94 A 8.8 8.8 0 0 1 146.4 94 A 8.8 8.8 0 0 1 128.8 94 A 8.8 8.8 0 0 1 111.2 94 A 8.8 8.8 0 0 1 93.6 94 A 8.8 8.8 0 0 1 76 94 Z'

function earsLeft(variant: number, p: Palette, goldMane?: boolean): ReactNode {
  const tipColor = goldMane ? '#FFD54F' : p.ear
  switch (variant % 4) {
    case 0: // 처진 복슬 귀
      return (
        <g>
          <path d="M 84 94 C 68 80 46 88 38 104 C 35 111 42 117 50 114 C 63 111 76 108 86 104 Z" fill={p.skin} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M 76 98 C 65 91 52 96 46 105 C 56 107 68 104 78 102 Z" fill={tipColor} />
        </g>
      )
    case 1: // 쫑긋 날개 귀
      return (
        <g>
          <path d="M 80 88 C 72 64 60 50 48 48 C 44 62 48 84 62 100 Z" fill={p.skin} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M 71 88 C 66 74 60 64 53 60 C 52 72 56 84 64 94 Z" fill={tipColor} />
        </g>
      )
    case 2: // 달팽이 바람 뿔
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M 80 88 C 56 78 36 92 43 110 C 48 124 68 121 67 108 C 66 99 55 98 56 106" stroke={INK} strokeWidth={12} />
          <path d="M 80 88 C 56 78 36 92 43 110 C 48 124 68 121 67 108 C 66 99 55 98 56 106" stroke={goldMane ? '#FFD54F' : p.horn} strokeWidth={6} />
        </g>
      )
    default: // 방울 구름 귀
      return (
        <g>
          <circle cx={56} cy={100} r={15} fill={p.skin} stroke={INK} strokeWidth={SW} />
          <circle cx={56} cy={100} r={8} fill={tipColor} />
        </g>
      )
  }
}

function tail(variant: number, p: Palette): ReactNode {
  switch (variant % 4) {
    case 0: // 구름 방울 꼬리
      return (
        <g>
          <circle cx={174} cy={200} r={13} fill={p.wool} stroke={INK} strokeWidth={SW} />
          <circle cx={171} cy={197} r={5} fill="#FFFFFF" opacity={0.6} />
        </g>
      )
    case 1: // 회오리 꼬리
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M 164 206 C 178 214 190 198 180 189 C 173 183 165 192 172 197" stroke={INK} strokeWidth={10} />
          <path d="M 164 206 C 178 214 190 198 180 189 C 173 183 165 192 172 197" stroke={p.wool} strokeWidth={5} />
        </g>
      )
    case 2: // 세 방울 구름 꼬리
      return (
        <g fill={p.wool} stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <circle cx={168} cy={204} r={8.5} />
          <circle cx={179} cy={196} r={7.5} />
          <circle cx={182} cy={209} r={7} />
        </g>
      )
    default: // 바람 날개 꼬리
      return (
        <g>
          <path d="M 162 208 C 164 194 182 188 189 198 C 196 198 198 210 189 213 C 180 219 166 216 162 208 Z" fill={p.wool} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M 170 204 C 177 199 184 201 184 206" fill="none" stroke={p.accent} strokeWidth={2.8} strokeLinecap="round" />
        </g>
      )
  }
}

function top(variant: number, p: Palette): ReactNode {
  switch (variant % 4) {
    case 0: // 하늘 바람 소용돌이 문양
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M 120 87 C 111 87 110 75 119 74 C 128 73 130 84 122 88 C 117 90 113 85 117 82" stroke={p.accent} strokeWidth={4.5} />
          <path d="M 120 87 C 111 87 110 75 119 74 C 128 73 130 84 122 88 C 117 90 113 85 117 82" stroke={INK} strokeWidth={2.2} />
        </g>
      )
    case 1: // 바람 새싹
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 120 52 C 112 38 98 38 94 46 C 103 55 114 56 120 52 Z" fill={p.leaf} />
          <path d="M 120 52 C 128 36 143 36 147 44 C 138 54 126 56 120 52 Z" fill={p.leaf} />
        </g>
      )
    case 2: // 솜사탕 꼭지 털
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M 112 52 C 106 34 128 28 132 42 C 135 51 124 55 121 48" stroke={INK} strokeWidth={10} />
          <path d="M 112 52 C 106 34 128 28 132 42 C 135 51 124 55 121 48" stroke={p.wool} strokeWidth={4.8} />
        </g>
      )
    default: // 구름 방울 리본
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 120 52 L 98 38 L 98 62 Z" fill={p.accent} />
          <path d="M 120 52 L 142 38 L 142 62 Z" fill={p.accent} />
          <circle cx={120} cy={52} r={6.5} fill="#FFF8E7" />
        </g>
      )
  }
}

export function MongsilArt({ look, uid }: ArtProps) {
  const base = PALETTES[look.palette % PALETTES.length]
  const p = look.shiny ? { ...base, wool: base.shade, shade: base.wool } : base
  const goldMane = Boolean(look.medals?.enabled !== false && look.medals?.goldMane)
  const bodyClip = `${uid}-body`
  const headClip = `${uid}-head`
  const woolClip = `${uid}-wool`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={p.wool} shade={p.shade} belly={p.skin} accent={p.accent} accent2={p.leaf} />
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

      {/* 꼬리 및 앙증맞은 발굽 */}
      <g transform="translate(184 200) scale(1.35) translate(-174 -204)">{tail(look.tail, p)}</g>
      <g stroke={INK} strokeWidth={SW}>
        <rect x={92} y={202} width={22} height={31} rx={11} fill={p.skin} />
        <rect x={126} y={202} width={22} height={31} rx={11} fill={p.skin} />
        <path d="M 92 223 H 114 V 226 Q 114 235 105 235 H 101 Q 92 235 92 226 Z" fill={p.hoof} />
        <path d="M 126 223 H 148 V 226 Q 148 235 139 235 H 135 Q 126 235 126 226 Z" fill={p.hoof} />
        {/* 앞발굽 (가슴 옆에 살짝 모은 자세) */}
        <ellipse cx={64} cy={180} rx={10} ry={13} transform="rotate(20 64 180)" fill={p.hoof} />
        <ellipse cx={176} cy={180} rx={10} ry={13} transform="rotate(-20 176 180)" fill={p.hoof} />
      </g>

      {/* 구름 방울 몸통 털 (Warm Clay 그라데이션 + 입체 하이라이트) */}
      <path d={BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <path d={BODY_HI_D} fill={p.wool} opacity={0.85} clipPath={`url(#${bodyClip})`} />
      {/* 몸통 몽글몽글 양털 결 디테일 */}
      <g fill="none" stroke={p.shade} strokeWidth={2.8} strokeLinecap="round">
        <path d="M 94 178 q 9 9 18 0" />
        <path d="M 126 188 q 9 9 18 0" />
        <path d="M 107 160 q 7 7 14 0" />
      </g>
      {/* 가슴 앞 구름 스카프 볼륨 */}
      <path d="M 88 150 Q 104 162 120 152 Q 136 162 152 150" fill="none" stroke="#FFFFFF" strokeWidth={3.5} opacity={0.65} />

      {/* 구름 방울 머리 털 */}
      <path d={HEAD_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <path d={HEAD_HI_D} fill={p.wool} opacity={0.9} clipPath={`url(#${headClip})`} />
      {/* 정수리 점토 하이라이트 광택 */}
      <ellipse cx={106} cy={56} rx={18} ry={7} fill="#FFFFFF" opacity={0.55} transform="rotate(-12 106 56)" />

      {/* 고유 무늬 */}
      <Pattern seed={look.patternSeed} color={p.pattern} clipId={woolClip} />

      {/* 귀·뿔 */}
      <g transform="translate(-4 4)">{earsLeft(look.ears, p, goldMane)}</g>
      <g transform="translate(244 4) scale(-1 1)">{earsLeft(look.ears, p, goldMane)}</g>

      {/* 복숭아빛 얼굴과 몽글 앞머리 */}
      <ellipse cx={120} cy={113} rx={39} ry={32} fill={`url(#${uid}-clay-belly)`} stroke={INK} strokeWidth={SW} />
      <clipPath id={`${uid}-face`}>
        <ellipse cx={120} cy={113} rx={39} ry={32} />
      </clipPath>
      <g clipPath={`url(#${uid}-face)`}>
        <path d={BANGS_D} fill={goldMane ? '#FFE082' : p.wool} stroke={INK} strokeWidth={SW} />
      </g>
      <ellipse cx={90} cy={127} rx={9} ry={5.8} fill={p.blush} opacity={0.85} />
      <ellipse cx={150} cy={127} rx={9} ry={5.8} fill={p.blush} opacity={0.85} />
      <Eye x={102} y={114} kind={look.expression} side={1} color={INK} lid={p.skin} />
      <Eye x={138} y={114} kind={look.expression} side={-1} color={INK} lid={p.skin} />
      <ellipse cx={120} cy={123} rx={4.2} ry={3} fill="#F29B9B" />
      <path d="M 111 129 Q 115.5 134.8 120 129 Q 124.5 134.8 129 129" fill="none" stroke={INK} strokeWidth={2.5} />

      {/* 머리 장식 */}
      <g transform={look.top % 4 === 0 ? undefined : 'translate(120 40) scale(1.35) translate(-120 -52)'}>
        {top(look.top, p)}
      </g>
    </g>
  )
}

export const mongsil: SpeciesDef = {
  id: 'mongsil',
  name: '몽실',
  element: 'wind',
  postureLabel: '자세 A · 구름 방울형',
  silhouetteDesc: '둥실 떠 있는 솜사탕 구름 체형과 이마의 소용돌이 무늬',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: MongsilArt,
}
