import { BipedArt, INK, SW, type BipedSpec, type Palette } from '../Biped'
import type { ArtProps, SpeciesDef } from '../types'

// 별비늘 팔레트 6개 (물 속성 작은 용). accent는 뿔·날개, accent2는 별 반짝이
const PALETTES: Palette[] = [
  { fur: '#8C9CD8', shade: '#6C7CBE', belly: '#D6E8F6', inner: '#B5C2EC', accent: '#F2C86A', accent2: '#FFE7A0', pad: '#5E6CAA', blush: '#C9A3A8', pattern: '#5E6CAA', eye: '#1F2A5A' },
  { fur: '#7CC8CC', shade: '#58A8B0', belly: '#DDF3F0', inner: '#A8DEDC', accent: '#F59E8C', accent2: '#FFD4C8', pad: '#4A94A0', blush: '#E8A0A0', pattern: '#4A94A0', eye: '#1E3A4A' },
  { fur: '#E8A0C0', shade: '#CC7BA2', belly: '#FBE4EE', inner: '#F2C2D6', accent: '#8EC8E8', accent2: '#CDEBFA', pad: '#B0678A', blush: '#F28CA0', pattern: '#B0678A', eye: '#4A2A4A' },
  { fur: '#A4D8B0', shade: '#80BC90', belly: '#EAF7EC', inner: '#C4E8CC', accent: '#E0A8E8', accent2: '#F4D6F7', pad: '#68A678', blush: '#F0A0A0', pattern: '#68A678', eye: '#1F4A3A' },
  { fur: '#B8A0E8', shade: '#9680CE', belly: '#EEE6FA', inner: '#D2C2F2', accent: '#F2D06A', accent2: '#FFF0A8', pad: '#7C66B8', blush: '#E8A0B8', pattern: '#7C66B8', eye: '#2E1F5A' },
  { fur: '#F0C070', shade: '#D49E48', belly: '#FFF3D6', inner: '#F6D8A0', accent: '#8C9CD8', accent2: '#CAD4F6', pad: '#B8823A', blush: '#F09C84', pattern: '#B8823A', eye: '#4A2E1F' },
]

const spec: BipedSpec = {
  palettes: PALETTES,
  geom: { headRx: 57, headRy: 48, headCy: 100, muzzle: false, eyeDx: 23, eyeDy: 6 },
  nose: (p) => p.shade,

  // 박쥐 날개 (몸 뒤)
  back: (p) => (
    <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
      <path d="M 90 150 C 62 132 40 138 28 160 C 40 156 48 162 50 176 C 58 164 70 166 76 178 C 80 170 88 168 96 170 Z" fill={p.accent} />
      <path d="M 150 150 C 178 132 200 138 212 160 C 200 156 192 162 190 176 C 182 164 170 166 164 178 C 160 170 152 168 144 170 Z" fill={p.accent} />
      <path d="M 90 150 L 50 176 M 90 150 L 76 178 M 150 150 L 190 176 M 150 150 L 164 178" fill="none" strokeWidth={2} opacity={0.6} />
    </g>
  ),

  ears: (v, p) => {
    switch (v % 4) {
      case 0: // 지느러미 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 80 84 C 62 80 50 66 52 52 C 66 56 80 62 90 74 Z" fill={p.inner} />
            <path d="M 60 60 C 68 66 76 72 84 78" fill="none" strokeWidth={1.8} />
          </g>
        )
      case 1: // 작은 뿔 두 개
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 86 68 C 80 58 80 48 84 40 C 94 46 98 56 96 66 Z" fill={p.accent} />
          </g>
        )
      case 2: // 둥근 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <circle cx={78} cy={70} r={11} fill={p.fur} />
            <circle cx={78} cy={71} r={5.5} fill={p.inner} strokeWidth={0} />
          </g>
        )
      default: // 수염 지느러미
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 70 98 C 54 96 44 104 40 116 C 52 112 62 114 72 118 Z" fill={p.inner} />
            <path d="M 70 98 C 60 96 52 98 46 104" fill="none" strokeWidth={1.8} />
          </g>
        )
    }
  },

  tail: (v, p) => {
    switch (v % 4) {
      case 0: // 지느러미 꼬리
        return (
          <g strokeLinejoin="round">
            <path d="M 150 228 C 180 240 204 226 208 204 C 200 212 190 212 182 206 C 184 216 172 220 152 212 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
            <path d="M 208 204 C 214 196 222 198 224 190 C 218 214 212 224 204 228 Z" fill={p.accent} stroke={INK} strokeWidth={SW} />
          </g>
        )
      case 1: // 별 꼬리
        return (
          <g strokeLinejoin="round">
            <path d="M 150 228 C 176 238 194 228 198 212 C 184 214 168 210 152 204 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
            <path d="M 206 196 l 5 12 l 13 4 l -13 4 l -5 12 l -5 -12 l -13 -4 l 13 -4 Z" fill={p.accent2} stroke={INK} strokeWidth={SW} />
          </g>
        )
      case 2: // 말린 꼬리
        return (
          <g fill="none" strokeLinecap="round">
            <path d="M 150 228 C 192 238 212 204 194 188 C 182 178 168 190 178 198" stroke={INK} strokeWidth={21} />
            <path d="M 150 228 C 192 238 212 204 194 188 C 182 178 168 190 178 198" stroke={p.fur} strokeWidth={14} />
          </g>
        )
      default: // 뾰족 가시 꼬리
        return (
          <g strokeLinejoin="round">
            <path d="M 150 228 C 180 240 206 222 212 196 C 200 206 190 204 184 198 C 184 212 170 216 152 210 Z" fill={p.fur} stroke={INK} strokeWidth={SW} />
            <path d="M 192 212 L 198 196 L 204 210 Z" fill={p.accent} stroke={INK} strokeWidth={2.4} />
          </g>
        )
    }
  },

  top: (v, p) => {
    switch (v % 4) {
      case 0: // 외뿔
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 108 58 L 120 22 L 132 58 Z" fill={p.accent} />
            <path d="M 112 46 L 128 46 M 114 36 L 126 36" fill="none" strokeWidth={2} />
          </g>
        )
      case 1: // 쌍뿔
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 100 60 L 94 34 L 114 56 Z" fill={p.accent} />
            <path d="M 140 60 L 146 34 L 126 56 Z" fill={p.accent} />
          </g>
        )
      case 2: // 등지느러미 볏
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 100 60 C 100 44 108 38 112 30 C 114 42 120 40 120 28 C 122 40 130 42 128 34 C 134 44 140 48 140 60 Z" fill={p.accent} />
          </g>
        )
      default: // 별 한 송이
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 120 24 l 5 12 l 13 4 l -13 4 l -5 12 l -5 -12 l -13 -4 l 13 -4 Z" fill={p.accent2} />
          </g>
        )
    }
  },

  // 볼과 배의 별자리 점
  front: (p, _l, g) => (
    <g fill={p.accent2} stroke={INK} strokeWidth={1}>
      <path d={`M 84 ${g.headCy + 22} l 1.8 4 l 4 1.6 l -4 1.6 l -1.8 4 l -1.8 -4 l -4 -1.6 l 4 -1.6 Z`} />
      <path d={`M 98 ${g.headCy + 30} l 1.2 2.6 l 2.6 1 l -2.6 1 l -1.2 2.6 l -1.2 -2.6 l -2.6 -1 l 2.6 -1 Z`} />
      <path d={`M 156 ${g.headCy + 22} l 1.8 4 l 4 1.6 l -4 1.6 l -1.8 4 l -1.8 -4 l -4 -1.6 l 4 -1.6 Z`} />
      <path d="M 148 188 l 1.2 2.6 l 2.6 1 l -2.6 1 l -1.2 2.6 l -1.2 -2.6 l -2.6 -1 l 2.6 -1 Z" />
    </g>
  ),
}

export function ByeolbineulArt(props: ArtProps) {
  return <BipedArt {...props} spec={spec} />
}

export const byeolbineul: SpeciesDef = {
  id: 'byeolbineul',
  name: '별비늘',
  element: 'water',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: ByeolbineulArt,
}
