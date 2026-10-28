import { BipedArt, INK, SW, type BipedSpec, type Palette } from '../Biped'
import type { ArtProps, SpeciesDef } from '../types'

// 번개꼬리 팔레트 6개 (전기 속성 족제비). 꼬리 수정(accent2)이 번개 느낌을 만든다.
const PALETTES: Palette[] = [
  { fur: '#B8E6D4', shade: '#8FCDB8', belly: '#F2FBF6', inner: '#F4B5B5', accent: '#5FA9D8', accent2: '#CDEBFF', pad: '#6FB5A0', blush: '#FF9FA8', pattern: '#6FB5A0', eye: '#3B2A38' },
  { fur: '#BFDDF7', shade: '#93BDE6', belly: '#F3F9FF', inner: '#F4B5C2', accent: '#6C8FE0', accent2: '#E1EBFF', pad: '#7AA6D6', blush: '#FF9FB4', pattern: '#6C8FE0', eye: '#3B2A38' },
  { fur: '#D9CCF5', shade: '#B6A3E6', belly: '#F8F4FF', inner: '#F4B0CC', accent: '#8F6FE0', accent2: '#EFE2FF', pad: '#9A86D6', blush: '#FF9FC0', pattern: '#8F6FE0', eye: '#3B2A38' },
  { fur: '#F7C9BC', shade: '#E49F90', belly: '#FFF3EE', inner: '#F59E9E', accent: '#E0765E', accent2: '#FFE1D6', pad: '#D8806C', blush: '#FF8F8F', pattern: '#D8806C', eye: '#4A2A28' },
  { fur: '#CFE7B9', shade: '#A3CC86', belly: '#F6FBEE', inner: '#F2B4B4', accent: '#6EAF58', accent2: '#E1F6D2', pad: '#88B86C', blush: '#FF9FA0', pattern: '#88B86C', eye: '#33302A' },
  { fur: '#B3C7D6', shade: '#889FB3', belly: '#EFF4F8', inner: '#E8AAB8', accent: '#4F7C9E', accent2: '#D6E9F7', pad: '#6B88A0', blush: '#F59AAA', pattern: '#4F7C9E', eye: '#33303A' },
]

function crystal(p: Palette, d: string, shine?: string) {
  return (
    <g strokeLinejoin="round">
      <path d={d} fill={p.accent2} stroke={INK} strokeWidth={SW} />
      <path d={shine ?? ''} fill="#fff" opacity={0.7} />
    </g>
  )
}

const spec: BipedSpec = {
  palettes: PALETTES,
  // 몸이 길고 날씬한 족제비 체형
  geom: { headRx: 49, headRy: 43, headCy: 102, bodyRx: 32, bodyRy: 47, bodyCy: 190, eyeDx: 19, armSpread: 1, muzzle: true },
  nose: (p) => p.accent,

  ears: (v, p) => {
    switch (v % 4) {
      case 0: // 동글 귀 (끝이 어둡지 않은 부드러운 귀)
        return (
          <g stroke={INK} strokeWidth={SW}>
            <circle cx={84} cy={66} r={13} fill={p.fur} />
            <circle cx={84} cy={67} r={7} fill={p.inner} strokeWidth={0} />
          </g>
        )
      case 1: // 작은 뾰족 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 88 76 C 78 62 76 50 80 42 C 90 46 100 58 100 72 Z" fill={p.fur} />
            <path d="M 88 68 C 83 60 82 54 84 50 C 90 53 95 60 95 68 Z" fill={p.inner} strokeWidth={0} />
          </g>
        )
      case 2: // 지느러미 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 84 82 C 66 80 54 68 54 56 C 68 58 80 62 90 70 Z" fill={p.accent2} />
            <path d="M 84 80 C 70 76 62 70 58 62" fill="none" strokeWidth={1.8} />
          </g>
        )
      default: // 수정 안테나 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 90 72 L 82 56" fill="none" strokeWidth={4} />
            <path d="M 82 56 L 76 44 L 84 38 L 90 50 Z" fill={p.accent2} />
          </g>
        )
    }
  },

  tail: (v, p) => {
    switch (v % 4) {
      case 0: // 지그재그 수정 번개
        return crystal(
          p,
          'M 146 228 L 170 210 L 160 198 L 188 176 L 178 164 L 208 132 L 204 168 L 216 168 L 190 202 L 198 208 L 160 238 Z',
          'M 188 176 L 200 156 L 196 172 Z',
        )
      case 1: // 두 갈래 번개
        return (
          <g>
            {crystal(p, 'M 146 226 L 176 204 L 168 192 L 196 168 L 188 160 L 204 138 L 206 170 L 182 192 L 190 200 L 156 232 Z')}
            {crystal(p, 'M 160 232 L 186 220 L 182 212 L 210 202 L 204 196 L 224 188 L 214 214 L 196 220 L 200 228 L 170 240 Z')}
          </g>
        )
      case 2: // 수정 다발
        return (
          <g strokeLinejoin="round">
            <path d="M 150 230 L 164 196 L 176 218 Z" fill={p.accent2} stroke={INK} strokeWidth={SW} />
            <path d="M 160 232 L 184 174 L 198 224 Z" fill={p.accent2} stroke={INK} strokeWidth={SW} />
            <path d="M 176 236 L 206 196 L 214 236 Z" fill={p.accent2} stroke={INK} strokeWidth={SW} />
          </g>
        )
      default: // 번개 고리 꼬리
        return (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 150 228 C 188 236 214 206 200 178 C 190 160 168 168 176 184 L 190 176 L 186 190" stroke={INK} strokeWidth={13} />
            <path d="M 150 228 C 188 236 214 206 200 178 C 190 160 168 168 176 184 L 190 176 L 186 190" stroke={p.accent2} strokeWidth={7} />
          </g>
        )
    }
  },

  top: (v, p) => {
    switch (v % 4) {
      case 0: // 수정 뿔싹
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 120 62 L 112 42 L 120 30 L 128 42 Z" fill={p.accent2} />
          </g>
        )
      case 1: // 불꽃 번쩍 (튀는 앞머리)
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 108 62 L 114 40 L 120 52 L 128 34 L 130 62 Z" fill={p.fur} />
          </g>
        )
      case 2: // 별 수정
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 120 28 l 5 12 l 12 4 l -12 4 l -5 12 l -5 -12 l -12 -4 l 12 -4 Z" fill={p.accent2} />
          </g>
        )
      default: // 리본 꼬리표
        return (
          <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
            <path d="M 120 56 L 100 44 L 100 66 Z" fill={p.accent} />
            <path d="M 120 56 L 140 44 L 140 66 Z" fill={p.accent} />
            <circle cx={120} cy={56} r={6} fill={p.accent2} />
          </g>
        )
    }
  },

  // 이마의 작은 다이아 무늬 + 전기 수염
  front: (p, _look, g) => (
    <g>
      <path d={`M 120 ${g.headCy - 22} l 4 6 l -4 6 l -4 -6 Z`} fill={p.accent} stroke={INK} strokeWidth={1.8} />
      <g fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round">
        <path d={`M ${120 - 36} ${g.headCy + 22} L ${120 - 50} ${g.headCy + 18} L ${120 - 46} ${g.headCy + 24} L ${120 - 60} ${g.headCy + 22}`} />
        <path d={`M ${120 + 36} ${g.headCy + 22} L ${120 + 50} ${g.headCy + 18} L ${120 + 46} ${g.headCy + 24} L ${120 + 60} ${g.headCy + 22}`} />
      </g>
    </g>
  ),
}

export function BeongaekkoriArt(props: ArtProps) {
  return <BipedArt {...props} spec={spec} />
}

export const beongaekkori: SpeciesDef = {
  id: 'beongaekkori',
  name: '번개꼬리',
  element: 'electric',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: BeongaekkoriArt,
}
