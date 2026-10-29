import { ClayGradientDefs, Eye, INK, SW, type Palette } from '../Biped'
import Pattern from '../Pattern'
import type { ArtProps, SpeciesDef } from '../types'

// 번개꼬리 팔레트 6개 (전기 속성 날렵한 S자 족제비/소형룡)
const PALETTES: Palette[] = [
  { fur: '#FFE27A', shade: '#F2B830', belly: '#FFFDF0', inner: '#FFAB9C', accent: '#4FA3E0', accent2: '#FFF394', pad: '#D99626', blush: '#FF867C', pattern: '#E59E1C', eye: '#3B2A38' },
  { fur: '#B8E6D4', shade: '#82C2AA', belly: '#F4FCF8', inner: '#F4B5B5', accent: '#5FA9D8', accent2: '#CDEBFF', pad: '#6FB5A0', blush: '#FF9FA8', pattern: '#6FB5A0', eye: '#3B2A38' },
  { fur: '#BFDDF7', shade: '#8AB4E0', belly: '#F5FAFF', inner: '#F4B5C2', accent: '#6C8FE0', accent2: '#E1EBFF', pad: '#7AA6D6', blush: '#FF9FB4', pattern: '#6C8FE0', eye: '#3B2A38' },
  { fur: '#D9CCF5', shade: '#AC96E0', belly: '#F9F5FF', inner: '#F4B0CC', accent: '#8F6FE0', accent2: '#EFE2FF', pad: '#9A86D6', blush: '#FF9FC0', pattern: '#8F6FE0', eye: '#3B2A38' },
  { fur: '#F7C9BC', shade: '#DF9484', belly: '#FFF5F0', inner: '#F59E9E', accent: '#E0765E', accent2: '#FFE1D6', pad: '#D8806C', blush: '#FF8F8F', pattern: '#D8806C', eye: '#4A2A28' },
  { fur: '#B3C7D6', shade: '#8299AD', belly: '#F0F5F9', inner: '#E8AAB8', accent: '#4F7C9E', accent2: '#D6E9F7', pad: '#6B88A0', blush: '#F59AAA', pattern: '#4F7C9E', eye: '#33303A' },
]

// 자세 C: 길고 유연하게 휘어지는 S자 족제비 몸통과 역동적인 목선
const BODY_D =
  'M 98 128 C 88 152 80 182 86 212 C 90 228 106 234 124 234 C 144 234 156 224 154 202 C 152 178 140 152 136 128 Z'
const BELLY_D =
  'M 106 134 C 98 158 94 184 98 210 C 102 222 112 227 123 227 C 134 227 142 220 140 202 C 138 180 130 156 127 134 Z'
const HEAD_D =
  'M 118 56 C 150 56 168 74 166 98 C 164 120 146 134 118 134 C 90 134 70 120 68 98 C 66 74 86 56 118 56 Z'

function crystalBolt(p: Palette, d: string, shine?: string, goldMane?: boolean) {
  return (
    <g strokeLinejoin="round">
      <path d={d} fill={goldMane ? '#FFD54F' : p.accent2} stroke={INK} strokeWidth={SW} />
      {shine && <path d={shine} fill="#FFFFFF" opacity={0.78} />}
    </g>
  )
}

function renderEars(v: number, p: Palette, goldMane?: boolean) {
  const tip = goldMane ? '#FFD54F' : p.accent
  switch (v % 4) {
    case 0: // 번개 깃털형 날렵한 귀
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 86 78 C 68 62 56 42 62 26 C 78 32 90 44 98 66 Z" fill={p.fur} />
          <path d="M 62 26 C 68 30 74 36 78 44 L 68 44 Z" fill={tip} strokeWidth={0} />
          <path d="M 84 68 C 76 58 72 48 74 40 C 82 44 88 54 90 64 Z" fill={p.inner} strokeWidth={0} />
        </g>
      )
    case 1: // 작은 삼각 여우·족제비 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 88 76 C 76 60 74 46 80 36 C 92 42 102 56 102 72 Z" fill={p.fur} />
          <path d="M 88 68 C 82 58 81 50 84 44 C 90 48 95 56 95 66 Z" fill={p.inner} strokeWidth={0} />
        </g>
      )
    case 2: // 플라즈마 지느러미 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 84 82 C 62 80 48 66 50 52 C 66 54 80 60 92 70 Z" fill={p.accent2} />
          <path d="M 84 80 C 68 74 60 68 54 58" fill="none" strokeWidth={2} />
        </g>
      )
    default: // 수정 안테나 뿔귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 90 72 L 80 52" fill="none" strokeWidth={4.2} />
          <path d="M 80 52 L 72 38 L 82 32 L 90 46 Z" fill={p.accent2} />
        </g>
      )
  }
}

function renderTail(v: number, p: Palette, goldMane?: boolean) {
  switch (v % 4) {
    case 0: // 대형 지그재그 번개 검 꼬리
      return crystalBolt(
        p,
        'M 144 222 L 176 198 L 164 186 L 198 158 L 184 146 L 222 108 L 214 156 L 226 158 L 194 196 L 204 204 L 154 232 Z',
        'M 196 158 L 214 128 L 208 154 Z',
        goldMane,
      )
    case 1: // 트윈 플라즈마 번개 꼬리
      return (
        <g>
          {crystalBolt(p, 'M 144 220 L 178 196 L 168 184 L 200 156 L 190 148 L 212 122 L 210 162 L 184 186 L 192 194 L 152 228 Z', undefined, goldMane)}
          {crystalBolt(p, 'M 154 226 L 188 212 L 182 204 L 214 192 L 208 184 L 228 176 L 218 206 L 196 214 L 202 222 L 166 234 Z', undefined, goldMane)}
        </g>
      )
    case 2: // 썬더 크리스탈 클러스터 꼬리
      return (
        <g strokeLinejoin="round">
          <path d="M 148 226 L 166 188 L 180 214 Z" fill={p.accent2} stroke={INK} strokeWidth={SW} />
          <path d="M 158 228 L 190 162 L 204 220 Z" fill={p.accent2} stroke={INK} strokeWidth={SW} />
          <path d="M 174 232 L 212 186 L 220 232 Z" fill={p.accent} stroke={INK} strokeWidth={SW} />
        </g>
      )
    default: // S자 족제비 스파크 링 꼬리
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 146 222 C 192 232 220 198 204 166 C 192 146 168 156 176 174 L 194 164 L 188 182" stroke={INK} strokeWidth={15} />
          <path d="M 146 222 C 192 232 220 198 204 166 C 192 146 168 156 176 174 L 194 164 L 188 182" stroke={p.accent2} strokeWidth={8.5} />
        </g>
      )
  }
}

function renderTop(v: number, p: Palette) {
  switch (v % 4) {
    case 0: // 번개 크레스트 뿔
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 114 60 L 108 38 L 120 44 L 126 22 L 132 46 L 122 44 L 126 60 Z" fill={p.accent2} />
        </g>
      )
    case 1: // 찌릿 스파크 앞머리
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 104 60 L 112 36 L 119 50 L 129 28 L 132 60 Z" fill={p.fur} />
        </g>
      )
    case 2: // 썬더 스타 크리스탈
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 118 24 l 5 12 l 12 4 l -12 4 l -5 12 l -5 -12 l -12 -4 l 12 -4 Z" fill={p.accent2} />
        </g>
      )
    default: // 볼트 나비 리본
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 118 54 L 98 42 L 98 64 Z" fill={p.accent} />
          <path d="M 118 54 L 138 42 L 138 64 Z" fill={p.accent} />
          <circle cx={118} cy={54} r={6} fill={p.accent2} />
        </g>
      )
  }
}

export function BeongaekkoriArt({ look, uid }: ArtProps) {
  const base = PALETTES[look.palette % PALETTES.length]
  const p = look.shiny ? { ...base, fur: base.shade, shade: base.fur } : base
  const goldMane = Boolean(look.medals?.enabled !== false && look.medals?.goldMane)
  const clipId = `${uid}-beon-clip`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={p.fur} shade={p.shade} belly={p.belly} accent={p.accent} accent2={p.accent2} />
        <clipPath id={clipId}>
          <path d={HEAD_D} />
          <path d={BODY_D} />
        </clipPath>
      </defs>

      {/* 수정 번개 꼬리 */}
      {renderTail(look.tail, p, goldMane)}

      {/* 날렵한 뒷발 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={98} cy={233} rx={15} ry={8.5} />
        <ellipse cx={138} cy={233} rx={15} ry={8.5} />
      </g>
      <g fill={p.pad}>
        <ellipse cx={98} cy={235} rx={6.5} ry={3.2} />
        <ellipse cx={138} cy={235} rx={6.5} ry={3.2} />
      </g>

      {/* S자로 유연하게 뻗은 족제비 몸통 */}
      <path d={BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <path d={BELLY_D} fill={`url(#${uid}-clay-belly)`} />

      {/* 목 둘레 찌릿한 전기 솜털 러프(목도리 털) — 족제비 고유 실루엣 포인트 */}
      <path
        d="M 82 132 L 72 138 L 86 145 L 78 154 L 100 152 L 118 162 L 136 152 L 156 154 L 148 144 L 162 136 L 148 130 Z"
        fill={goldMane ? '#FFE082' : p.accent2}
        stroke={INK}
        strokeWidth={SW}
      />

      {/* 날렵한 앞발 (한쪽은 가슴 앞, 한쪽은 옆으로 준비 자세) */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={82} cy={172} rx={8.5} ry={17} transform="rotate(22 82 172)" />
        <ellipse cx={154} cy={170} rx={8.5} ry={17} transform="rotate(-18 154 170)" />
      </g>

      {/* 귀 */}
      <g>{renderEars(look.ears, p, goldMane)}</g>
      <g transform="translate(236 0) scale(-1 1)">{renderEars(look.ears, p, goldMane)}</g>

      {/* 족제비 머리 */}
      <path d={HEAD_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />

      {/* 고유 무늬 */}
      <Pattern seed={look.patternSeed} color={p.pattern} clipId={clipId} />

      {/* 얼굴 디테일: 이마의 번개 다이아몬드 + 지그재그 전기 수염 */}
      <ellipse cx={118} cy={112} rx={19} ry={12.5} fill={p.belly} />
      <path d="M 118 72 l 5 7 l -5 7 l -5 -7 Z" fill={p.accent} stroke={INK} strokeWidth={2} />
      {/* 양볼 번개 스파크 마크 */}
      <path d="M 78 108 L 62 104 L 68 111 L 54 109" fill="none" stroke={p.accent} strokeWidth={2.8} />
      <path d="M 158 108 L 174 104 L 168 111 L 182 109" fill="none" stroke={p.accent} strokeWidth={2.8} />

      <ellipse cx={86} cy={114} rx={8} ry={5} fill={p.blush} opacity={0.85} />
      <ellipse cx={150} cy={114} rx={8} ry={5} fill={p.blush} opacity={0.85} />
      <Eye x={98} y={99} kind={look.expression} side={1} color={p.eye} lid={p.fur} />
      <Eye x={138} y={99} kind={look.expression} side={-1} color={p.eye} lid={p.fur} />
      <ellipse cx={118} cy={109} rx={4.4} ry={3} fill={p.accent} />
      <path d="M 109 115 Q 113.5 120.5 118 115 Q 122.5 120.5 127 115" fill="none" stroke={INK} strokeWidth={2.4} />

      {/* 머리 장식 */}
      {renderTop(look.top, p)}
    </g>
  )
}

export const beongaekkori: SpeciesDef = {
  id: 'beongaekkori',
  name: '번개꼬리',
  element: 'electric',
  postureLabel: '자세 C · 유연한 S자 족제비형',
  silhouetteDesc: '날렵하게 휘어지는 S자 체형과 전기 목도리 털, 수정 번개 꼬리',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: BeongaekkoriArt,
}
