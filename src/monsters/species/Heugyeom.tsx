import { ClayGradientDefs, Eye, INK, SW, type Palette } from '../Biped'
import Pattern from '../Pattern'
import { flamePath } from '../shapes'
import type { ArtProps, SpeciesDef } from '../types'

// 흑염 팔레트 6개 (불 속성 카리스마 아기 사자: 차콜·퍼플 털 + 코랄·엠버 이중 불꽃 갈기)
const PALETTES: Palette[] = [
  { fur: '#685C78', shade: '#483E56', belly: '#D6CCE2', inner: '#E89B96', accent: '#FF784E', accent2: '#FFD670', pad: '#FF9E8A', blush: '#FF8278', pattern: '#4C425C', eye: '#E85D2A' },
  { fur: '#5C708E', shade: '#3E506C', belly: '#CDE0F2', inner: '#A8B8DC', accent: '#3EC2F0', accent2: '#B8F4FF', pad: '#7AD4F5', blush: '#E898A6', pattern: '#3E506C', eye: '#1E9CD8' },
  { fur: '#84606E', shade: '#60424E', belly: '#E6CED8', inner: '#DE9CA8', accent: '#F2A828', accent2: '#FFE894', pad: '#F7B860', blush: '#EE8C90', pattern: '#60424E', eye: '#D9821E' },
  { fur: '#5E7C6A', shade: '#405A4C', belly: '#CCE2D4', inner: '#A6C4B0', accent: '#82D042', accent2: '#DCF898', pad: '#9CE066', blush: '#E8908C', pattern: '#405A4C', eye: '#58A824' },
  { fur: '#847492', shade: '#60506E', belly: '#E4DAEE', inner: '#D8A8C2', accent: '#F578AD', accent2: '#FFD0E6', pad: '#F8A0C4', blush: '#F28CA8', pattern: '#60506E', eye: '#D94E8E' },
  { fur: '#585864', shade: '#3C3C46', belly: '#C8C8D2', inner: '#D89690', accent: '#E84A32', accent2: '#FFB284', pad: '#F2846E', blush: '#E48884', pattern: '#3C3C46', eye: '#D93822' },
]

// 자세 E: 당당하게 가슴을 펴고 앉은 아기 사자 실루엣 (불꽃 갈기가 머리와 가슴을 감싸는 형태)
const BODY_D =
  'M 84 146 C 72 166 72 204 82 224 C 92 234 148 234 158 224 C 168 204 168 166 156 146 Z'
const HEAD_D =
  'M 120 60 C 154 60 174 78 172 106 C 170 130 150 144 120 144 C 90 144 70 130 68 106 C 66 78 86 60 120 60 Z'

function flameTail(p: Palette, d: string, flame: string, innerFlame?: string, goldMane?: boolean) {
  return (
    <g strokeLinejoin="round">
      <path d={d} fill={p.fur} stroke={INK} strokeWidth={SW} />
      <path d={flame} fill={goldMane ? '#FFB800' : p.accent} stroke={INK} strokeWidth={SW} />
      {innerFlame && <path d={innerFlame} fill={goldMane ? '#FFF3B0' : p.accent2} />}
    </g>
  )
}

function renderEars(v: number, p: Palette) {
  switch (v % 4) {
    case 0: // 둥근 아기 사자 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <circle cx={78} cy={68} r={14} fill={p.fur} />
          <circle cx={78} cy={69} r={7.5} fill={p.inner} strokeWidth={0} />
        </g>
      )
    case 1: // 불꽃 끝 사자 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 82 80 C 70 64 70 48 78 38 C 90 44 100 58 100 74 Z" fill={p.fur} />
          <path d="M 84 72 C 78 62 78 54 82 48 C 89 54 94 62 94 70 Z" fill={p.inner} strokeWidth={0} />
        </g>
      )
    case 2: // 드래곤-라이온 날개 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 84 82 C 62 76 50 60 54 42 C 64 50 72 52 80 50 C 78 60 84 68 96 74 Z" fill={p.fur} />
          <path d="M 66 58 C 72 64 78 66 86 68" fill="none" strokeWidth={2} />
        </g>
      )
    default: // 금빛 염화 뿔귀
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 86 72 C 72 62 68 46 74 32 C 88 42 98 56 98 70 Z" fill={p.accent2} />
        </g>
      )
  }
}

function renderTail(v: number, p: Palette, goldMane?: boolean) {
  switch (v % 4) {
    case 0: // 타오르는 S자 불꽃 술 꼬리
      return flameTail(
        p,
        'M 150 226 C 188 238 212 220 204 190 C 200 176 186 178 188 192 C 190 206 172 212 152 206 Z',
        'M 202 188 C 196 168 210 154 216 138 C 226 154 232 170 220 186 C 214 194 206 194 202 188 Z',
        'M 208 184 C 206 172 212 164 215 154 C 220 164 222 174 215 184 Z',
        goldMane,
      )
    case 1: // 채찍 염화 꼬리
      return flameTail(
        p,
        'M 150 222 C 176 224 198 216 216 200 C 216 194 210 190 204 192 C 192 204 172 210 152 208 Z',
        'M 212 198 C 206 184 216 174 216 160 C 228 172 232 188 222 202 C 219 205 215 202 212 198 Z',
        undefined,
        goldMane,
      )
    case 2: // 이중 불꽃 방울 꼬리
      return (
        <g strokeLinejoin="round">
          <path d="M 150 224 C 178 234 198 222 200 202 C 188 206 168 204 152 198 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
          <path d="M 192 210 C 188 194 196 184 204 172 C 214 186 222 200 210 212 C 205 217 196 216 192 210 Z" fill={p.accent} stroke={INK} strokeWidth={SW} />
          <path d="M 200 208 C 198 198 202 190 206 184 C 211 192 214 202 207 208 Z" fill={p.accent2} />
        </g>
      )
    default: // 태양 불씨 구슬 꼬리
      return (
        <g>
          <path d="M 150 224 C 178 234 194 226 198 208 C 186 210 166 208 152 202 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
          <circle cx={204} cy={202} r={14} fill={p.accent} stroke={INK} strokeWidth={SW} />
          <circle cx={204} cy={202} r={7.5} fill={p.accent2} />
        </g>
      )
  }
}

function renderTop(v: number, p: Palette) {
  switch (v % 4) {
    case 0: // 타오르는 엠버 불꽃 벼슬
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 104 64 C 98 46 114 40 120 22 C 126 38 142 44 136 64 Z" fill={p.accent} />
          <path d="M 112 64 C 110 52 118 48 120 38 C 123 48 130 52 128 64 Z" fill={p.accent2} strokeWidth={0} />
        </g>
      )
    case 1: // 삼지창 화염 왕관
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 96 66 L 98 42 L 110 54 L 120 32 L 130 54 L 142 42 L 144 66 Z" fill={p.accent2} />
        </g>
      )
    case 2: // 트윈 플레임 뿔털
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 110 66 C 104 50 112 40 108 28 C 120 36 126 50 122 66 Z" fill={p.accent} />
          <path d="M 124 66 C 124 54 132 48 136 36 C 144 48 142 58 136 66 Z" fill={p.accent2} />
        </g>
      )
    default: // 태양성 불씨 코어
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 120 28 l 5 12 l 12 4 l -12 4 l -5 12 l -5 -12 l -12 -4 l 12 -4 Z" fill={p.accent2} />
        </g>
      )
  }
}

export function HeugyeomArt({ look, uid }: ArtProps) {
  const base = PALETTES[look.palette % PALETTES.length]
  const p = look.shiny ? { ...base, fur: base.shade, shade: base.fur } : base
  const goldMane = Boolean(look.medals?.enabled !== false && look.medals?.goldMane)
  const clipId = `${uid}-heug-clip`
  const maneOuter = goldMane ? '#F59E0B' : p.shade
  const maneMid = goldMane ? '#FCD34D' : p.accent
  const maneCore = goldMane ? '#FEF08A' : p.accent2

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={p.fur} shade={p.shade} belly={p.belly} accent={p.accent} accent2={p.accent2} />
        <clipPath id={clipId}>
          <path d={HEAD_D} />
          <path d={BODY_D} />
        </clipPath>
      </defs>

      {/* 머리 뒤로 타오르는 3중 흑염+코랄+엠버 불꽃 갈기 (시안과 동일한 웅장한 실루엣) */}
      <g strokeLinejoin="round">
        <path d={flamePath(120, 104, 72, 64, 10, 0.42)} fill={maneOuter} stroke={INK} strokeWidth={SW} />
        <path d={flamePath(120, 104, 62, 55, 10, 0.36, -Math.PI / 2 + 0.16)} fill={maneMid} stroke={INK} strokeWidth={2.6} />
        <path d={flamePath(120, 106, 51, 45, 10, 0.28)} fill={maneCore} opacity={0.92} />
      </g>

      {/* 불꽃 꼬리 */}
      {renderTail(look.tail, p, goldMane)}

      {/* 뒷발 (양옆으로 벌리고 앉아 핑크빛 발바닥 젤리가 살짝 보이는 사자 아기발) */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={82} cy={226} rx={18} ry={11} transform="rotate(-10 82 226)" />
        <ellipse cx={158} cy={226} rx={18} ry={11} transform="rotate(10 158 226)" />
      </g>
      <g fill={p.pad}>
        <ellipse cx={80} cy={227} rx={7} ry={4.5} />
        <ellipse cx={160} cy={227} rx={7} ry={4.5} />
      </g>

      {/* 당당한 아기 사자 몸통 */}
      <path d={BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <ellipse cx={120} cy={194} rx={28} ry={30} fill={`url(#${uid}-clay-belly)`} />

      {/* 가슴을 감싸는 풍성한 화염 목 갈기(Chest Flame Mane) */}
      <path
        d="M 78 134 C 82 154 96 160 92 174 C 104 168 114 176 120 186 C 126 176 136 168 148 174 C 144 160 158 154 162 134 C 144 142 96 142 78 134 Z"
        fill={maneMid}
        stroke={INK}
        strokeWidth={SW}
      />
      <path
        d="M 94 140 C 98 154 110 160 120 172 C 130 160 142 154 146 140 Z"
        fill={maneCore}
      />

      {/* 앞으로 짚은 두 앞발 + 귀여운 발톱 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <rect x={92} y={184} width={22} height={48} rx={11} />
        <rect x={126} y={184} width={22} height={48} rx={11} />
        <ellipse cx={103} cy={231} rx={14} ry={7.5} />
        <ellipse cx={137} cy={231} rx={14} ry={7.5} />
      </g>

      {/* 귀 */}
      <g>{renderEars(look.ears, p)}</g>
      <g transform="translate(240 0) scale(-1 1)">{renderEars(look.ears, p)}</g>

      {/* 사자 머리 */}
      <path d={HEAD_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />

      {/* 고유 무늬 */}
      <Pattern seed={look.patternSeed} color={p.pattern} clipId={clipId} />

      {/* 사자 주둥이 + 카리스마 눈썹 + 불씨처럼 빛나는 이중 눈동자(ember=true) */}
      <ellipse cx={120} cy={121} rx={21} ry={14} fill={p.belly} />
      <ellipse cx={86} cy={120} rx={8.5} ry={5.2} fill={p.blush} opacity={0.85} />
      <ellipse cx={154} cy={120} rx={8.5} ry={5.2} fill={p.blush} opacity={0.85} />

      <Eye x={99} y={107} kind={look.expression} side={1} color={p.eye} lid={p.fur} ember />
      <Eye x={141} y={107} kind={look.expression} side={-1} color={p.eye} lid={p.fur} ember />

      {/* 카리스마 있는 불꽃 눈썹 */}
      <path d="M 86 92 Q 96 96 108 98" fill="none" stroke={maneCore} strokeWidth={4.5} />
      <path d="M 154 92 Q 144 96 132 98" fill="none" stroke={maneCore} strokeWidth={4.5} />
      <path d="M 86 92 Q 96 96 108 98 M 154 92 Q 144 96 132 98" fill="none" stroke={INK} strokeWidth={2.2} />

      {/* 사자 코와 작은 송곳니 */}
      <polygon points="114,114 126,114 120,121" fill="#4A3A44" />
      <path d="M 110 124 Q 115 129 120 124 Q 125 129 130 124" fill="none" stroke={INK} strokeWidth={2.5} />
      <polygon points="112,126 115,131 117,126" fill="#FFFFFF" stroke={INK} strokeWidth={1.4} />
      <polygon points="123,126 125,131 128,126" fill="#FFFFFF" stroke={INK} strokeWidth={1.4} />

      {/* 머리 장식 */}
      {renderTop(look.top, p)}
    </g>
  )
}

export const heugyeom: SpeciesDef = {
  id: 'heugyeom',
  name: '흑염',
  element: 'fire',
  postureLabel: '자세 E · 당당한 흑염 사자형',
  silhouetteDesc: '타오르는 3중 흑염 갈기와 불씨 눈동자, 당당하게 가슴을 편 사자 자세',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: HeugyeomArt,
}
