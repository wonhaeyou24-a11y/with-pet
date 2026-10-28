import { BipedArt, INK, SW, type BipedSpec, type Palette } from '../Biped'
import type { ArtProps, SpeciesDef } from '../types'

// 강철등 팔레트 6개 (땅 속성 늑대). accent는 등딱지 판갑, accent2는 판갑 밝은 면
const PALETTES: Palette[] = [
  { fur: '#B7A592', shade: '#8F7E6C', belly: '#EBDDC6', inner: '#F2C3B8', accent: '#7C8DA8', accent2: '#AEBCD2', pad: '#6A5A4C', blush: '#F5A0A0', pattern: '#7E6D5C', eye: '#3B2A28' },
  { fur: '#9AA3AD', shade: '#737C88', belly: '#E3E8EE', inner: '#EBBFC4', accent: '#6E8A7C', accent2: '#A5C0B2', pad: '#58606B', blush: '#F5A0AA', pattern: '#5E6772', eye: '#2F2A34' },
  { fur: '#8A7A74', shade: '#665752', belly: '#DCCBC2', inner: '#E8B2AE', accent: '#A97C5A', accent2: '#D2AE8C', pad: '#4A3D39', blush: '#F59C98', pattern: '#4F423D', eye: '#3B2A28' },
  { fur: '#D2BE9A', shade: '#AE9A76', belly: '#F7EEDA', inner: '#F2C2AE', accent: '#8A8F9C', accent2: '#BEC3CE', pad: '#8A7858', blush: '#F5A092', pattern: '#9A8662', eye: '#3B2A28' },
  { fur: '#A3AFC4', shade: '#7B88A0', belly: '#E7ECF5', inner: '#EDBCCC', accent: '#B07E86', accent2: '#D8AEB4', pad: '#606C84', blush: '#F5A0B4', pattern: '#66728C', eye: '#2A2D3E' },
  { fur: '#9DB097', shade: '#778A72', belly: '#E6EEDC', inner: '#EEBCB0', accent: '#8C8A78', accent2: '#BDBBA8', pad: '#5E7058', blush: '#F5A09A', pattern: '#62775C', eye: '#33302A' },
]

function plate(x: number, y: number, rx: number, ry: number, rot: number, p: Palette) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`} stroke={INK} strokeWidth={SW}>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={p.accent} />
      <ellipse cx={x - rx * 0.2} cy={y - ry * 0.25} rx={rx * 0.55} ry={ry * 0.45} fill={p.accent2} strokeWidth={0} />
    </g>
  )
}

const spec: BipedSpec = {
  palettes: PALETTES,
  geom: { headRx: 55, headRy: 46, bodyRx: 40, eyeDx: 21 },
  nose: () => '#3C2E2C',

  ears: (v, p) => {
    switch (v % 4) {
      case 0: // 뾰족 늑대 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 82 74 C 72 56 74 38 82 26 C 96 34 106 52 106 68 Z" fill={p.fur} />
            <path d="M 86 66 C 80 54 80 44 84 36 C 92 42 98 52 98 62 Z" fill={p.inner} strokeWidth={0} />
          </g>
        )
      case 1: // 둥근 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 80 76 C 66 66 66 46 80 40 C 94 42 102 56 100 72 Z" fill={p.fur} />
            <path d="M 82 68 C 76 62 76 52 82 48 C 90 50 94 58 93 66 Z" fill={p.inner} strokeWidth={0} />
          </g>
        )
      case 2: // 끝이 접힌 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 82 74 C 70 58 72 42 84 32 C 92 36 104 38 112 36 C 104 50 104 64 102 72 Z" fill={p.fur} />
            <path d="M 84 32 C 90 40 100 42 112 36" fill="none" strokeWidth={2} />
          </g>
        )
      default: // 털 뭉치 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 82 74 C 70 56 74 38 84 24 L 92 36 L 96 22 L 104 40 L 108 68 Z" fill={p.fur} />
            <path d="M 88 66 C 84 54 86 44 90 36 C 96 44 98 56 98 64 Z" fill={p.inner} strokeWidth={0} />
          </g>
        )
    }
  },

  tail: (v, p) => {
    switch (v % 4) {
      case 0: // 복슬 꼬리
        return (
          <g>
            <path d="M 150 228 C 188 244 214 214 204 184 C 198 168 184 170 182 184 C 180 200 166 206 152 204 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
            <path d="M 190 176 C 202 178 206 192 200 204 C 196 196 192 188 190 176 Z" fill={p.belly} />
          </g>
        )
      case 1: // 말린 꼬리
        return (
          <g fill="none" strokeLinecap="round">
            <path d="M 152 226 C 192 236 210 202 192 184 C 180 172 166 184 176 194" stroke={INK} strokeWidth={22} />
            <path d="M 152 226 C 192 236 210 202 192 184 C 180 172 166 184 176 194" stroke={p.fur} strokeWidth={15} />
          </g>
        )
      case 2: // 판갑 꼬리
        return (
          <g strokeLinejoin="round">
            <path d="M 150 226 C 176 236 202 224 208 204 C 196 206 184 204 172 198 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
            <ellipse cx={186} cy={214} rx={9} ry={7} transform="rotate(-20 186 214)" fill={p.accent} stroke={INK} strokeWidth={2.4} />
            <ellipse cx={204} cy={206} rx={7} ry={6} transform="rotate(-30 204 206)" fill={p.accent2} stroke={INK} strokeWidth={2.4} />
          </g>
        )
      default: // 짧고 통통한 꼬리
        return (
          <g>
            <path d="M 152 224 C 176 232 192 218 190 200 C 180 204 166 204 154 200 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
            <circle cx={188} cy={202} r={5} fill={p.belly} />
          </g>
        )
    }
  },

  top: (v, p) => {
    switch (v % 4) {
      case 0: // 삐친 머리털
        return (
          <path d="M 108 58 C 106 44 120 38 126 30 C 128 40 134 46 132 58" fill={p.fur} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        )
      case 1: // 돌조각
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 104 62 L 108 44 L 118 40 L 122 62 Z" fill={p.accent} />
            <path d="M 120 62 L 124 34 L 136 40 L 138 62 Z" fill={p.accent2} />
          </g>
        )
      case 2: // 판갑 볏
        return (
          <g stroke={INK} strokeWidth={SW}>
            <ellipse cx={104} cy={56} rx={8} ry={6} fill={p.accent2} />
            <ellipse cx={120} cy={50} rx={10} ry={7} fill={p.accent} />
            <ellipse cx={136} cy={56} rx={8} ry={6} fill={p.accent2} />
          </g>
        )
      default: // 풍성한 털 볏
        return (
          <path d="M 98 60 C 98 46 110 44 114 36 C 116 44 122 40 124 32 C 128 42 134 44 134 52 C 140 48 142 56 140 60 Z" fill={p.fur} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        )
    }
  },

  // 등딱지: 몸 뒤에서 어깨 위로 보이는 큰 판갑
  back: (p) => (
    <g stroke={INK} strokeWidth={SW}>
      <ellipse cx={120} cy={170} rx={52} ry={42} fill={p.accent} />
      <ellipse cx={108} cy={156} rx={30} ry={20} fill={p.accent2} strokeWidth={0} opacity={0.75} />
    </g>
  ),

  bodyExtra: (p, _l, g) => (
    <g>
      {plate(120 - g.bodyRx + 4, g.bodyCy - 30, 16, 11, -28, p)}
      {plate(120 + g.bodyRx - 4, g.bodyCy - 30, 16, 11, 28, p)}
    </g>
  ),

  // 이마의 두 줄 눈썹 무늬
  front: (p, _l, g) => (
    <g fill={p.belly} opacity={0.9}>
      <ellipse cx={104} cy={g.headCy - 14} rx={8} ry={3.4} transform={`rotate(-10 104 ${g.headCy - 14})`} />
      <ellipse cx={136} cy={g.headCy - 14} rx={8} ry={3.4} transform={`rotate(10 136 ${g.headCy - 14})`} />
    </g>
  ),
}

export function GangcheoldeungArt(props: ArtProps) {
  return <BipedArt {...props} spec={spec} />
}

export const gangcheoldeung: SpeciesDef = {
  id: 'gangcheoldeung',
  name: '강철등',
  element: 'earth',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: GangcheoldeungArt,
}
