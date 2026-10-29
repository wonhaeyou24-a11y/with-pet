import { ClayGradientDefs, Eye, INK, SW, type Palette } from '../Biped'
import Pattern from '../Pattern'
import type { ArtProps, SpeciesDef } from '../types'

// 강철등 팔레트 6개 (땅 속성 4족 판갑 늑대/아르마딜로 가디언)
const PALETTES: Palette[] = [
  { fur: '#B7A592', shade: '#8A7662', belly: '#F2E5D0', inner: '#F2C3B8', accent: '#6F829E', accent2: '#B4C4DC', pad: '#6A5A4C', blush: '#F59E9E', pattern: '#7E6D5C', eye: '#3B2A28' },
  { fur: '#9AA3AD', shade: '#6E7885', belly: '#E8EDF2', inner: '#EBBFC4', accent: '#5E7E70', accent2: '#A5C6B6', pad: '#58606B', blush: '#F5A0AA', pattern: '#5E6772', eye: '#2F2A34' },
  { fur: '#8A7A74', shade: '#61514C', belly: '#E2D2C9', inner: '#E8B2AE', accent: '#A67450', accent2: '#D8B290', pad: '#4A3D39', blush: '#F59C98', pattern: '#4F423D', eye: '#3B2A28' },
  { fur: '#D2BE9A', shade: '#A6906A', belly: '#FAF2E1', inner: '#F2C2AE', accent: '#7D8494', accent2: '#C2C8D6', pad: '#8A7858', blush: '#F5A092', pattern: '#9A8662', eye: '#3B2A28' },
  { fur: '#A3AFC4', shade: '#74829C', belly: '#ECF0F8', inner: '#EDBCCC', accent: '#AD747E', accent2: '#DEB2BA', pad: '#606C84', blush: '#F5A0B4', pattern: '#66728C', eye: '#2A2D3E' },
  { fur: '#9DB097', shade: '#71856B', belly: '#EBF2E2', inner: '#EEBCB0', accent: '#84826E', accent2: '#C2BFA8', pad: '#5E7058', blush: '#F5A09A', pattern: '#62775C', eye: '#33302A' },
]

// 자세 D: 대지를 디디고 앉은 다부진 4족 보행(앞발 2개 + 뒷다리 2개) 판갑 체형
const BODY_D =
  'M 72 152 C 62 172 64 210 78 224 C 94 234 146 234 162 224 C 176 210 178 172 168 152 Z'
const HEAD_D =
  'M 120 60 C 156 60 178 80 176 108 C 174 132 152 146 120 146 C 88 146 66 132 64 108 C 62 80 84 60 120 60 Z'

function armorPlate(x: number, y: number, rx: number, ry: number, rot: number, p: Palette, goldMane?: boolean) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`} stroke={INK} strokeWidth={SW}>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={goldMane ? '#E6B84D' : p.accent} />
      <ellipse cx={x - rx * 0.2} cy={y - ry * 0.25} rx={rx * 0.56} ry={ry * 0.45} fill={goldMane ? '#FFF0A8' : p.accent2} strokeWidth={0} />
    </g>
  )
}

function renderEars(v: number, p: Palette, goldMane?: boolean) {
  switch (v % 4) {
    case 0: // 뾰족 늑대 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 82 76 C 68 56 70 36 80 22 C 96 32 108 52 106 70 Z" fill={p.fur} />
          <path d="M 86 68 C 78 54 78 42 82 34 C 92 40 98 52 98 64 Z" fill={goldMane ? '#FFD54F' : p.inner} strokeWidth={0} />
        </g>
      )
    case 1: // 둥근 곰·늑대 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 80 78 C 64 66 64 46 80 38 C 94 40 104 56 100 72 Z" fill={p.fur} />
          <path d="M 82 68 C 75 62 75 52 82 48 C 90 50 94 58 93 66 Z" fill={ p.inner} strokeWidth={0} />
        </g>
      )
    case 2: // 반쯤 접힌 강아지 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 82 76 C 68 58 70 40 84 30 C 92 34 106 36 114 34 C 106 50 104 64 102 72 Z" fill={p.fur} />
          <path d="M 84 30 C 90 38 100 40 114 34" fill="none" strokeWidth={2.2} />
        </g>
      )
    default: // 판갑 깃 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 82 76 C 68 56 72 36 82 22 L 91 34 L 96 20 L 105 38 L 108 68 Z" fill={p.fur} />
          <path d="M 88 66 C 84 54 86 44 90 36 C 96 44 98 56 98 64 Z" fill={p.accent2} strokeWidth={0} />
        </g>
      )
  }
}

function renderTail(v: number, p: Palette) {
  switch (v % 4) {
    case 0: // 늠름한 늑대 복슬 꼬리
      return (
        <g>
          <path d="M 158 220 C 198 236 224 204 212 172 C 204 154 188 158 186 174 C 184 192 170 200 156 198 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
          <path d="M 198 164 C 212 166 216 182 208 196 C 204 186 198 178 198 164 Z" fill={p.belly} />
        </g>
      )
    case 1: // 말린 판갑 꼬리
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M 158 220 C 198 230 218 194 198 176 C 186 164 170 176 180 188" stroke={INK} strokeWidth={22} />
          <path d="M 158 220 C 198 230 218 194 198 176 C 186 164 170 176 180 188" stroke={p.fur} strokeWidth={15} />
        </g>
      )
    case 2: // 철퇴 판갑 꼬리
      return (
        <g strokeLinejoin="round">
          <path d="M 156 220 C 184 230 208 216 214 196 C 202 198 188 196 176 190 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
          <ellipse cx={192} cy={208} rx={10} ry={7.5} transform="rotate(-20 192 208)" fill={p.accent} stroke={INK} strokeWidth={2.5} />
          <ellipse cx={210} cy={198} rx={8.5} ry={7} transform="rotate(-30 210 198)" fill={p.accent2} stroke={INK} strokeWidth={2.5} />
        </g>
      )
    default: // 땅딸막 방패 꼬리
      return (
        <g>
          <path d="M 158 218 C 184 226 200 210 198 192 C 186 196 172 196 160 192 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
          <circle cx={195} cy={194} r={6} fill={p.accent2} stroke={INK} strokeWidth={2} />
        </g>
      )
  }
}

function renderTop(v: number, p: Palette) {
  switch (v % 4) {
    case 0: // 삐친 대장 늑대 머리털
      return (
        <path d="M 106 62 C 104 46 120 38 128 28 C 130 40 136 46 134 62" fill={p.fur} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      )
    case 1: // 대지 수정 뿔조각
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M 102 64 L 106 44 L 118 38 L 122 64 Z" fill={p.accent} />
          <path d="M 118 64 L 124 32 L 138 38 L 140 64 Z" fill={p.accent2} />
        </g>
      )
    case 2: // 삼중 판갑 투구 볏
      return (
        <g stroke={INK} strokeWidth={SW}>
          <ellipse cx={102} cy={58} rx={9} ry={6.5} fill={p.accent2} />
          <ellipse cx={120} cy={51} rx={11} ry={8} fill={p.accent} />
          <ellipse cx={138} cy={58} rx={9} ry={6.5} fill={p.accent2} />
        </g>
      )
    default: // 더블 갈기 볏
      return (
        <path
          d="M 96 62 C 96 46 108 44 114 34 C 116 44 122 40 124 30 C 128 42 136 44 136 52 C 142 48 144 56 142 62 Z"
          fill={p.fur}
          stroke={INK}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      )
  }
}

export function GangcheoldeungArt({ look, uid }: ArtProps) {
  const base = PALETTES[look.palette % PALETTES.length]
  const p = look.shiny ? { ...base, fur: base.shade, shade: base.fur } : base
  const goldMane = Boolean(look.medals?.enabled !== false && look.medals?.goldMane)
  const clipId = `${uid}-gang-clip`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={p.fur} shade={p.shade} belly={p.belly} accent={p.accent} accent2={p.accent2} />
        <clipPath id={clipId}>
          <path d={HEAD_D} />
          <path d={BODY_D} />
        </clipPath>
      </defs>

      {/* 거대 바위 등딱지 셸 (몸 뒤에서 어깨 위로 솟아오른 육중한 판갑 실루엣) */}
      <g stroke={INK} strokeWidth={SW}>
        <ellipse cx={120} cy={166} rx={62} ry={48} fill={goldMane ? '#D4A438' : p.accent} />
        <path d="M 70 156 Q 120 126 170 156" fill="none" stroke={p.accent2} strokeWidth={5} opacity={0.85} />
        <path d="M 120 120 L 120 164 M 90 132 L 100 166 M 150 132 L 140 166" fill="none" stroke={INK} strokeWidth={2.5} opacity={0.55} />
      </g>

      {/* 꼬리 */}
      {renderTail(look.tail, p)}

      {/* 4족 보행 자세: 바깥쪽에 버티고 앉은 뒷다리와 앞쪽에 나란히 짚은 굵은 앞다리 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        {/* 뒷다리 허벅지 & 뒷발 */}
        <ellipse cx={74} cy={214} rx={16} ry={18} />
        <ellipse cx={166} cy={214} rx={16} ry={18} />
        <ellipse cx={72} cy={230} rx={16} ry={8.5} />
        <ellipse cx={168} cy={230} rx={16} ry={8.5} />
      </g>

      {/* 다부진 몸통 */}
      <path d={BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      {/* 가슴 앞 복슬복슬한 늑대 가슴털(Chest Ruff) */}
      <path
        d="M 88 144 L 80 158 L 94 162 L 88 176 L 106 174 L 120 186 L 134 174 L 152 176 L 146 162 L 160 158 L 152 144 Z"
        fill={p.belly}
        stroke={INK}
        strokeWidth={2.6}
      />

      {/* 양쪽 어깨 판갑(Pauldrons) */}
      {armorPlate(76, 158, 19, 13, -26, p, goldMane)}
      {armorPlate(164, 158, 19, 13, 26, p, goldMane)}

      {/* 앞으로 나란히 디딘 튼튼한 두 앞다리 & 발톱 패드 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <rect x={90} y={182} width={22} height={52} rx={11} />
        <rect x={128} y={182} width={22} height={52} rx={11} />
        <ellipse cx={101} cy={233} rx={15} ry={8} />
        <ellipse cx={139} cy={233} rx={15} ry={8} />
      </g>
      <g fill={p.belly} stroke={INK} strokeWidth={1.8}>
        <circle cx={96} cy={234} r={3} />
        <circle cx={101} cy={235} r={3.2} />
        <circle cx={106} cy={234} r={3} />
        <circle cx={134} cy={234} r={3} />
        <circle cx={139} cy={235} r={3.2} />
        <circle cx={144} cy={234} r={3} />
      </g>

      {/* 귀 */}
      <g>{renderEars(look.ears, p, goldMane)}</g>
      <g transform="translate(240 0) scale(-1 1)">{renderEars(look.ears, p, goldMane)}</g>

      {/* 늑대 머리 (양볼에 삐죽 나온 볼털 포함) */}
      <path
        d="M 66 106 L 52 112 L 64 120 L 56 128 L 72 132 M 174 106 L 188 112 L 176 120 L 184 128 L 168 132"
        fill={p.fur}
        stroke={INK}
        strokeWidth={SW}
      />
      <path d={HEAD_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />

      {/* 고유 무늬 */}
      <Pattern seed={look.patternSeed} color={p.pattern} clipId={clipId} />

      {/* 늠름한 늑대 주둥이 + 시바/늑대 특유의 두꺼운 눈썹 점 */}
      <ellipse cx={120} cy={122} rx={22} ry={14.5} fill={p.belly} />
      <ellipse cx={101} cy={88} rx={8.5} ry={4} transform="rotate(-10 101 88)" fill={p.belly} />
      <ellipse cx={139} cy={88} rx={8.5} ry={4} transform="rotate(10 139 88)" fill={p.belly} />

      <ellipse cx={85} cy={122} rx={8.5} ry={5.4} fill={p.blush} opacity={0.85} />
      <ellipse cx={155} cy={122} rx={8.5} ry={5.4} fill={p.blush} opacity={0.85} />
      <Eye x={99} y={108} kind={look.expression} side={1} color={p.eye} lid={p.fur} />
      <Eye x={141} y={108} kind={look.expression} side={-1} color={p.eye} lid={p.fur} />
      <polygon points="114,116 126,116 120,123" fill="#3C2E2C" stroke={INK} strokeWidth={1.5} />
      <path d="M 111 126 Q 115.5 131 120 126 Q 124.5 131 129 126" fill="none" stroke={INK} strokeWidth={2.5} />

      {/* 머리 장식 */}
      {renderTop(look.top, p)}
    </g>
  )
}

export const gangcheoldeung: SpeciesDef = {
  id: 'gangcheoldeung',
  name: '강철등',
  element: 'earth',
  postureLabel: '자세 D · 4족 판갑 가디언형',
  silhouetteDesc: '대지를 딛고 앉은 4족 보행 자세와 어깨·등의 육중한 바위 판갑',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: GangcheoldeungArt,
}
