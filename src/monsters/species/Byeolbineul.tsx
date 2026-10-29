import { ClayGradientDefs, Eye, INK, SW, type Palette } from '../Biped'
import Pattern from '../Pattern'
import type { ArtProps, SpeciesDef } from '../types'

// 별비늘 팔레트 6개 (물·은하 속성 신비로운 날개 아기 용)
const PALETTES: Palette[] = [
  { fur: '#7E90D4', shade: '#5A6BB5', belly: '#FFF6E0', inner: '#B5C4F2', accent: '#F4C862', accent2: '#FFF0A8', pad: '#5A6BB5', blush: '#FF9EAA', pattern: '#5262A8', eye: '#1F2A5A' },
  { fur: '#72C4CA', shade: '#4EA2AC', belly: '#FFF8E8', inner: '#A8E2E0', accent: '#F59E8C', accent2: '#FFD8CC', pad: '#4A94A0', blush: '#FF9EA0', pattern: '#4A94A0', eye: '#1E3A4A' },
  { fur: '#E8A0C0', shade: '#C8769C', belly: '#FFF5F8', inner: '#F4C6DA', accent: '#82C4EA', accent2: '#D4F0FF', pad: '#B0678A', blush: '#F28CA0', pattern: '#B0678A', eye: '#4A2A4A' },
  { fur: '#9CD4AA', shade: '#74B484', belly: '#FAFDF6', inner: '#C4EACC', accent: '#DCA4E8', accent2: '#F6DCFA', pad: '#68A678', blush: '#F0A0A0', pattern: '#68A678', eye: '#1F4A3A' },
  { fur: '#B29AE6', shade: '#8C74C6', belly: '#FAF5FF', inner: '#D4C4F6', accent: '#F4CE64', accent2: '#FFF2B2', pad: '#7C66B8', blush: '#E8A0B8', pattern: '#7C66B8', eye: '#2E1F5A' },
  { fur: '#F0C070', shade: '#D09842', belly: '#FFFDF5', inner: '#F6DAA4', accent: '#8496D8', accent2: '#D0DAFA', pad: '#B8823A', blush: '#F09C84', pattern: '#B8823A', eye: '#4A2E1F' },
]

// 자세 F: 은하수 날개를 펴고 물결처럼 우아하게 앉은 아기 드래곤 체형 (주름진 용 배 비늘 + 별자리 날개)
const BODY_D =
  'M 92 134 C 76 154 74 192 84 218 C 94 232 146 232 156 218 C 166 192 164 154 148 134 Z'
const HEAD_D =
  'M 120 56 C 156 56 176 76 174 102 C 172 126 152 140 120 140 C 88 140 68 126 66 102 C 64 76 84 56 120 56 Z'

function renderEars(v: number, p: Palette, goldMane?: boolean) {
  const finColor = goldMane ? '#FFE082' : p.inner
  switch (v % 4) {
    case 0: // 물결 지느러미 귀 (시안과 동일한 우아한 3겹 지느러미)
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 78 86 C 54 82 40 66 44 48 C 60 52 76 60 88 74 Z" fill={finColor} />
          <path d="M 52 56 C 64 64 74 70 84 78 M 48 68 C 60 74 72 78 82 82" fill="none" strokeWidth={2} />
        </g>
      )
    case 1: // 은하 크리스탈 귀뿔
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 84 68 C 76 56 76 44 82 34 C 94 42 98 54 96 66 Z" fill={p.accent} />
        </g>
      )
    case 2: // 동글 수룡 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <circle cx={76} cy={70} r={12} fill={p.fur} />
          <circle cx={76} cy={71} r={6} fill={finColor} strokeWidth={0} />
        </g>
      )
    default: // 해류 지느러미 수염귀
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 68 96 C 48 94 36 104 34 118 C 48 112 60 114 72 118 Z" fill={finColor} />
          <path d="M 68 96 C 56 94 48 98 40 106" fill="none" strokeWidth={2} />
        </g>
      )
  }
}

function renderTail(v: number, p: Palette, goldMane?: boolean) {
  const fin = goldMane ? '#FFD54F' : p.accent
  switch (v % 4) {
    case 0: // 유선형 은하 지느러미 용 꼬리
      return (
        <g strokeLinejoin="round">
          <path d="M 148 220 C 186 236 214 218 216 190 C 206 202 194 202 184 194 C 186 208 172 214 150 204 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
          <path d="M 216 190 C 224 180 232 182 234 172 C 228 202 220 214 210 220 Z" fill={fin} stroke={INK} strokeWidth={SW} />
        </g>
      )
    case 1: // 북극성 별 꼬리
      return (
        <g strokeLinejoin="round">
          <path d="M 148 220 C 178 232 198 220 202 202 C 186 206 168 202 150 196 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
          <path d="M 210 184 l 5 13 l 13 5 l -13 5 l -5 13 l -5 -13 l -13 -5 l 13 -5 Z" fill={p.accent2} stroke={INK} strokeWidth={SW} />
        </g>
      )
    case 2: // 소용돌이 해류 꼬리
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M 148 220 C 196 232 218 196 198 178 C 184 166 168 180 180 190" stroke={INK} strokeWidth={22} />
          <path d="M 148 220 C 196 232 218 196 198 178 C 184 166 168 180 180 190" stroke={p.fur} strokeWidth={15} />
        </g>
      )
    default: // 산호 볏 용 꼬리
      return (
        <g strokeLinejoin="round">
          <path d="M 148 220 C 182 234 210 214 216 186 C 202 198 192 196 184 188 C 184 204 170 210 150 202 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
          <path d="M 192 204 L 198 186 L 206 202 Z" fill={fin} stroke={INK} strokeWidth={2.4} />
        </g>
      )
  }
}

function renderTop(v: number, p: Palette) {
  switch (v % 4) {
    case 0: // 금빛 줄무늬 아기 용 외뿔 (시안과 동일)
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 107 58 C 110 38 116 24 120 18 C 124 24 130 38 133 58 Z" fill={p.accent} />
          <path d="M 111 46 Q 120 42 129 46 M 114 35 Q 120 32 126 35" fill="none" strokeWidth={2.2} />
        </g>
      )
    case 1: // 은하 쌍뿔
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 98 60 L 92 32 L 112 56 Z" fill={p.accent} />
          <path d="M 142 60 L 148 32 L 128 56 Z" fill={p.accent} />
        </g>
      )
    case 2: // 해룡 왕관 지느러미 볏
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 98 60 C 98 42 106 36 112 28 C 114 40 120 38 120 24 C 122 38 130 40 128 32 C 136 42 142 46 142 60 Z" fill={p.accent} />
        </g>
      )
    default: // 유성 별장식
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 120 20 l 5 13 l 13 4 l -13 4 l -5 13 l -5 -13 l -13 -4 l 13 -4 Z" fill={p.accent2} />
        </g>
      )
  }
}

export function ByeolbineulArt({ look, uid }: ArtProps) {
  const base = PALETTES[look.palette % PALETTES.length]
  const p = look.shiny ? { ...base, fur: base.shade, shade: base.fur } : base
  const goldMane = Boolean(look.medals?.enabled !== false && look.medals?.goldMane)
  const clipId = `${uid}-byeol-clip`
  const wingFill = goldMane ? '#FFE082' : p.inner

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={p.fur} shade={p.shade} belly={p.belly} accent={p.accent} accent2={p.accent2} />
        <clipPath id={clipId}>
          <path d={HEAD_D} />
          <path d={BODY_D} />
        </clipPath>
      </defs>

      {/* 등 뒤 은하수 날개 (둥글고 신비로운 드래곤 날개 + 금빛 별자리 선) */}
      <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
        <path
          d="M 90 146 C 58 122 32 130 22 156 C 36 152 46 160 48 176 C 58 162 72 164 78 176 C 82 168 88 166 96 168 Z"
          fill={wingFill}
        />
        <path
          d="M 150 146 C 182 122 208 130 218 156 C 204 152 194 160 192 176 C 182 162 168 164 162 176 C 158 168 152 166 144 168 Z"
          fill={wingFill}
        />
        <path d="M 88 148 L 48 174 M 88 148 L 76 174 M 152 148 L 192 174 M 152 148 L 164 174" fill="none" stroke={p.accent} strokeWidth={2.2} />
        <circle cx={46} cy={148} r={2.2} fill={p.accent2} strokeWidth={0} />
        <circle cx={194} cy={148} r={2.2} fill={p.accent2} strokeWidth={0} />
      </g>

      {/* 꼬리 */}
      {renderTail(look.tail, p, goldMane)}

      {/* 통통한 아기 용 뒷발 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={96} cy={228} rx={17} ry={9.5} />
        <ellipse cx={144} cy={228} rx={17} ry={9.5} />
      </g>
      <g fill={p.belly}>
        <circle cx={90} cy={229} r={2.8} />
        <circle cx={96} cy={230} r={3} />
        <circle cx={102} cy={229} r={2.8} />
        <circle cx={138} cy={229} r={2.8} />
        <circle cx={144} cy={230} r={3} />
        <circle cx={150} cy={229} r={2.8} />
      </g>

      {/* 아기 용 몸통 + 크림색 가로 주름 배 비늘(Dragon Belly Plates) */}
      <path d={BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <ellipse cx={120} cy={184} rx={27} ry={36} fill={p.belly} stroke={INK} strokeWidth={2.4} />
      <path
        d="M 97 166 Q 120 171 143 166 M 94 180 Q 120 186 146 180 M 96 194 Q 120 200 144 194 M 102 208 Q 120 212 138 208"
        fill="none"
        stroke={INK}
        strokeWidth={2}
        opacity={0.65}
      />

      {/* 귀여운 앞발 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={82} cy={176} rx={9} ry={16} transform="rotate(16 82 176)" />
        <ellipse cx={158} cy={176} rx={9} ry={16} transform="rotate(-16 158 176)" />
      </g>

      {/* 지느러미 귀 */}
      <g>{renderEars(look.ears, p, goldMane)}</g>
      <g transform="translate(240 0) scale(-1 1)">{renderEars(look.ears, p, goldMane)}</g>

      {/* 아기 용 머리 */}
      <path d={HEAD_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />

      {/* 고유 무늬 */}
      <Pattern seed={look.patternSeed} color={p.pattern} clipId={clipId} />

      {/* 양볼과 몸의 반짝이는 황금 별자리 무늬 */}
      <g fill={p.accent2} stroke={INK} strokeWidth={1.1}>
        <path d="M 80 116 l 2.2 4.5 l 4.5 1.8 l -4.5 1.8 l -2.2 4.5 l -2.2 -4.5 l -4.5 -1.8 l 4.5 -1.8 Z" />
        <path d="M 94 126 l 1.4 3 l 3 1.2 l -3 1.2 l -1.4 3 l -1.4 -3 l -3 -1.2 l 3 -1.2 Z" />
        <path d="M 160 116 l 2.2 4.5 l 4.5 1.8 l -4.5 1.8 l -2.2 4.5 l -2.2 -4.5 l -4.5 -1.8 l 4.5 -1.8 Z" />
        <path d="M 146 126 l 1.4 3 l 3 1.2 l -3 1.2 l -1.4 3 l -1.4 -3 l -3 -1.2 l 3 -1.2 Z" />
      </g>

      <ellipse cx={88} cy={118} rx={8.5} ry={5.2} fill={p.blush} opacity={0.8} />
      <ellipse cx={152} cy={118} rx={8.5} ry={5.2} fill={p.blush} opacity={0.8} />
      <Eye x={97} y={104} kind={look.expression} side={1} color={p.eye} lid={p.fur} />
      <Eye x={143} y={104} kind={look.expression} side={-1} color={p.eye} lid={p.fur} />
      {/* 귀여운 용 콧구멍 두 점과 미소 */}
      <circle cx={116} cy={112} r={1.8} fill={INK} />
      <circle cx={124} cy={112} r={1.8} fill={INK} />
      <path d="M 112 119 Q 120 125 128 119" fill="none" stroke={INK} strokeWidth={2.5} />

      {/* 머리 위 뿔/장식 */}
      {renderTop(look.top, p)}
    </g>
  )
}

export const byeolbineul: SpeciesDef = {
  id: 'byeolbineul',
  name: '별비늘',
  element: 'water',
  postureLabel: '자세 F · 은하 날개 드래곤형',
  silhouetteDesc: '은하수 별자리 비늘과 주름진 용 배 패치, 물결 지느러미 귀와 날개',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: ByeolbineulArt,
}
