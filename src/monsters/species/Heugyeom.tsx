import { BipedArt, INK, SW, type BipedSpec, type Palette } from '../Biped'
import { flamePath } from '../shapes'
import type { ArtProps, SpeciesDef } from '../types'

// 흑염 팔레트 6개 (불 속성 사자). accent는 불꽃 바깥, accent2는 불꽃 안쪽
const PALETTES: Palette[] = [
  { fur: '#8C8098', shade: '#6C6178', belly: '#C9BFD0', inner: '#B79AA6', accent: '#FF9A62', accent2: '#FFD27A', pad: '#5A5064', blush: '#E88C86', pattern: '#5E5470', eye: '#E8743A' },
  { fur: '#7C8CA8', shade: '#5C6C88', belly: '#C4D0E2', inner: '#A8A0BC', accent: '#4FC3E8', accent2: '#B6F0FF', pad: '#4A5870', blush: '#E898A6', pattern: '#4A5A78', eye: '#2FA6D0' },
  { fur: '#9A7A86', shade: '#785A66', belly: '#DCC4CC', inner: '#C4929C', accent: '#F2B134', accent2: '#FFE59A', pad: '#664652', blush: '#EE8C90', pattern: '#684654', eye: '#D9922A' },
  { fur: '#7C9A88', shade: '#5C7A68', belly: '#C6DBCC', inner: '#B0A6A6', accent: '#8FD04F', accent2: '#D8F59A', pad: '#4A6656', blush: '#E8908C', pattern: '#4A6A58', eye: '#66B02F' },
  { fur: '#A89AAE', shade: '#85778E', belly: '#E0D8E6', inner: '#CBA2B8', accent: '#F58FB8', accent2: '#FFD0E4', pad: '#6E6078', blush: '#F28CA8', pattern: '#74667E', eye: '#D9609A' },
  { fur: '#7A7A84', shade: '#58585F', belly: '#BDBDC4', inner: '#A89C9C', accent: '#E8583F', accent2: '#FFB08A', pad: '#464650', blush: '#E48884', pattern: '#4E4E58', eye: '#D9462E' },
]

function flameTail(p: Palette, d: string, flame: string) {
  return (
    <g strokeLinejoin="round">
      <path d={d} fill={p.fur} stroke={INK} strokeWidth={SW} />
      <path d={flame} fill={p.accent} stroke={INK} strokeWidth={SW} />
    </g>
  )
}

const spec: BipedSpec = {
  palettes: PALETTES,
  geom: { headRx: 52, headRy: 45, headCy: 104, bodyRx: 36, bodyCy: 188, eyeDx: 20, muzzle: true },
  nose: () => '#4A3A44',

  // 큰 불꽃 갈기 (머리 뒤)
  back: (p, _l, g) => (
    <g strokeLinejoin="round">
      <path d={flamePath(120, g.headCy - 2, 66, 58, 9, 0.38)} fill={p.accent} stroke={INK} strokeWidth={SW} />
      <path d={flamePath(120, g.headCy, 54, 48, 9, 0.3, -Math.PI / 2 + 0.17)} fill={p.accent2} opacity={0.9} />
    </g>
  ),

  ears: (v, p) => {
    switch (v % 4) {
      case 0: // 동글 사자 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <circle cx={82} cy={72} r={13} fill={p.fur} />
            <circle cx={82} cy={73} r={7} fill={p.inner} strokeWidth={0} />
          </g>
        )
      case 1: // 뾰족 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 84 82 C 74 66 74 52 80 44 C 92 50 100 62 100 76 Z" fill={p.fur} />
            <path d="M 86 74 C 81 64 81 57 84 52 C 90 57 94 64 94 72 Z" fill={p.inner} strokeWidth={0} />
          </g>
        )
      case 2: // 박쥐 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 86 84 C 66 78 54 62 58 46 C 66 54 74 56 82 54 C 80 62 86 70 96 76 Z" fill={p.fur} />
            <path d="M 70 62 C 74 66 80 68 86 70" fill="none" strokeWidth={1.8} />
          </g>
        )
      default: // 작은 뿔
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 88 74 C 76 64 72 50 76 38 C 88 46 98 58 98 72 Z" fill={p.accent2} />
          </g>
        )
    }
  },

  tail: (v, p) => {
    switch (v % 4) {
      case 0: // S자 + 불꽃
        return flameTail(
          p,
          'M 150 230 C 184 242 208 224 202 196 C 198 182 186 184 188 196 C 190 208 172 214 152 208 Z',
          'M 202 192 C 200 176 210 166 214 152 C 220 164 226 176 216 190 C 212 196 206 196 202 192 Z',
        )
      case 1: // 곧은 채찍 + 불꽃
        return flameTail(
          p,
          'M 150 224 C 174 226 196 218 214 204 C 214 198 208 194 204 196 C 192 206 172 212 152 210 Z',
          'M 210 202 C 206 190 214 182 214 170 C 224 180 228 194 220 206 C 217 208 213 206 210 202 Z',
        )
      case 2: // 술 달린 꼬리
        return (
          <g strokeLinejoin="round">
            <path d="M 150 228 C 176 238 196 226 198 206 C 186 210 168 208 152 202 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
            <path d="M 192 214 C 188 198 196 190 202 180 C 210 192 218 204 208 216 C 204 220 196 220 192 214 Z" fill={p.accent} stroke={INK} strokeWidth={SW} />
            <path d="M 200 212 C 198 202 202 196 205 190 C 209 198 212 206 206 212 Z" fill={p.accent2} />
          </g>
        )
      default: // 불씨 구슬 꼬리
        return (
          <g>
            <path d="M 150 228 C 176 238 192 230 196 212 C 184 214 166 212 152 206 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
            <circle cx={202} cy={206} r={13} fill={p.accent} stroke={INK} strokeWidth={SW} />
            <circle cx={202} cy={206} r={7} fill={p.accent2} />
          </g>
        )
    }
  },

  top: (v, p) => {
    switch (v % 4) {
      case 0: // 불꽃 한 송이
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 108 64 C 104 50 116 46 120 32 C 124 44 136 48 132 64 Z" fill={p.accent} />
            <path d="M 114 64 C 112 56 119 54 120 46 C 122 54 128 56 126 64 Z" fill={p.accent2} strokeWidth={0} />
          </g>
        )
      case 1: // 불꽃 왕관
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 98 66 L 100 46 L 110 56 L 120 38 L 130 56 L 140 46 L 142 66 Z" fill={p.accent} />
          </g>
        )
      case 2: // 불꽃 가르마
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 112 66 C 106 52 114 44 110 34 C 120 40 126 52 122 66 Z" fill={p.accent} />
            <path d="M 124 66 C 124 56 132 52 134 42 C 142 52 140 60 136 66 Z" fill={p.accent2} />
          </g>
        )
      default: // 불씨 반짝
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 120 34 l 4 10 l 10 4 l -10 4 l -4 10 l -4 -10 l -10 -4 l 10 -4 Z" fill={p.accent2} />
          </g>
        )
    }
  },

  // 턱 아래 불꽃 수염 + 이마 눈썹
  front: (p, _l, g) => (
    <g>
      <path d={`M 94 ${g.headCy + 36} C 100 ${g.headCy + 46} 108 ${g.headCy + 42} 112 ${g.headCy + 50} C 116 ${g.headCy + 42} 124 ${g.headCy + 46} 128 ${g.headCy + 50} C 132 ${g.headCy + 42} 140 ${g.headCy + 46} 146 ${g.headCy + 36} C 136 ${g.headCy + 36} 104 ${g.headCy + 36} 94 ${g.headCy + 36} Z`} fill={p.accent} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <g stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none">
        <path d={`M ${120 - 30} ${g.headCy - 10} L ${120 - 14} ${g.headCy - 6}`} />
        <path d={`M ${120 + 30} ${g.headCy - 10} L ${120 + 14} ${g.headCy - 6}`} />
      </g>
    </g>
  ),
}

export function HeugyeomArt(props: ArtProps) {
  return <BipedArt {...props} spec={spec} />
}

export const heugyeom: SpeciesDef = {
  id: 'heugyeom',
  name: '흑염',
  element: 'fire',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: HeugyeomArt,
}
