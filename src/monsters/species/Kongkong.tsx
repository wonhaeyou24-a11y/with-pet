import { BipedArt, INK, SW, type BipedSpec, type Palette } from '../Biped'
import { scallopPath } from '../shapes'
import type { ArtProps, SpeciesDef } from '../types'

// 콩콩 팔레트 6개 (풀 속성 다람쥐)
const PALETTES: Palette[] = [
  { fur: '#F2C98F', shade: '#D9A872', belly: '#FFF1D6', inner: '#F2A99B', accent: '#8B5E3C', accent2: '#8CCB7A', pad: '#B98059', blush: '#FF9C8F', pattern: '#C98B52', eye: '#4A3330' },
  { fur: '#F6D58A', shade: '#E0B253', belly: '#FFF6DA', inner: '#F4B58A', accent: '#A9743A', accent2: '#7CC47A', pad: '#C79347', blush: '#FF9E86', pattern: '#D79C34', eye: '#4A3330' },
  { fur: '#C99066', shade: '#A86F4A', belly: '#F2DABB', inner: '#E8A59A', accent: '#6E4528', accent2: '#8CCB7A', pad: '#8A5A3C', blush: '#FF9C9C', pattern: '#7E5033', eye: '#3B2A28' },
  { fur: '#B58B72', shade: '#8F6650', belly: '#EBD3C2', inner: '#E2A0A8', accent: '#5F3C2C', accent2: '#9BD3A8', pad: '#6F4A3C', blush: '#FF9AAE', pattern: '#6A4636', eye: '#3B2A28' },
  { fur: '#F4C6C6', shade: '#DE9FA6', belly: '#FFEFEA', inner: '#F59AAA', accent: '#B5686E', accent2: '#8CCB9C', pad: '#C77F88', blush: '#FF8FA8', pattern: '#D77F8E', eye: '#4A3330' },
  { fur: '#A9C4D6', shade: '#7F9EB6', belly: '#E8F1F7', inner: '#E4A6B2', accent: '#5C7A92', accent2: '#8CCB9C', pad: '#6C8AA3', blush: '#FFA0AE', pattern: '#5C7A92', eye: '#3B2A28' },
]

function plume(p: Palette, d: string, tip?: string) {
  return (
    <g>
      <path d={d} fill={p.fur} stroke={INK} strokeWidth={SW} />
      {tip && <path d={tip} fill={p.accent2} stroke={INK} strokeWidth={SW} />}
    </g>
  )
}

const spec: BipedSpec = {
  palettes: PALETTES,
  geom: { headRx: 56, headRy: 47, eyeDx: 22 },
  nose: () => '#5A3A36',

  ears: (v, p) => {
    switch (v % 4) {
      case 0: // 쫑긋 + 끝 털
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 80 80 C 66 62 66 44 74 34 C 86 40 98 54 100 70 Z" fill={p.fur} />
            <path d="M 82 72 C 74 60 74 50 77 44 C 84 48 91 57 92 68 Z" fill={p.inner} strokeWidth={0} />
          </g>
        )
      case 1: // 동글 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <circle cx={78} cy={62} r={15} fill={p.fur} />
            <circle cx={78} cy={63} r={8} fill={p.inner} strokeWidth={0} />
          </g>
        )
      case 2: // 잎사귀 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 84 76 C 62 70 48 54 54 38 C 72 38 90 52 96 70 Z" fill={p.accent2} />
            <path d="M 60 44 C 70 54 80 62 90 70" fill="none" strokeWidth={2} />
          </g>
        )
      default: // 접힌 귀
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 82 76 C 66 70 58 56 66 46 C 70 52 80 54 94 64 Z" fill={p.fur} />
            <path d="M 66 46 C 68 52 74 58 84 62" fill="none" strokeWidth={2} />
          </g>
        )
    }
  },

  tail: (v, p) => {
    switch (v % 4) {
      case 0: // 폭신한 S자
        return plume(p, 'M 150 226 C 192 240 214 202 196 162 C 188 142 164 148 170 170 C 173 188 162 198 150 198 Z')
      case 1: // 돌돌 꼬리
        return (
          <g fill="none" strokeLinecap="round">
            <path d="M 152 222 C 196 236 212 190 190 170 C 176 158 160 172 172 184" stroke={INK} strokeWidth={22} />
            <path d="M 152 222 C 196 236 212 190 190 170 C 176 158 160 172 172 184" stroke={p.fur} strokeWidth={15} />
          </g>
        )
      case 2: // 동글 솜뭉치
        return (
          <g>
            <path d={scallopPath(188, 196, 24, 28, 8, 0.62)} fill={p.fur} stroke={INK} strokeWidth={SW} />
            <path d={scallopPath(185, 192, 14, 18, 8, 0.62)} fill={p.belly} />
          </g>
        )
      default: // 잎끝 꼬리
        return plume(
          p,
          'M 150 226 C 186 238 206 206 198 172 C 192 150 172 144 168 160 C 164 178 160 196 150 200 Z',
          'M 198 172 C 210 156 200 138 186 134 C 180 146 184 162 198 172 Z',
        )
    }
  },

  top: (v, p) => {
    switch (v % 4) {
      case 0: // 도토리 모자
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 120 36 L 120 24" fill="none" strokeWidth={5} />
            <path d="M 120 26 C 126 14 140 14 144 20 C 138 30 128 30 120 26 Z" fill={p.accent2} strokeWidth={2.6} />
            <path d="M 88 62 C 88 34 152 34 152 62 C 140 56 100 56 88 62 Z" fill={p.accent} />
            <path d="M 100 44 L 112 58 M 116 40 L 128 58 M 134 42 L 144 54 M 106 40 L 94 54 M 124 40 L 110 58" fill="none" strokeWidth={1.6} opacity={0.5} />
          </g>
        )
      case 1: // 새싹
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 120 56 C 112 40 98 40 94 46 C 102 56 112 58 120 56 Z" fill={p.accent2} />
            <path d="M 120 56 C 128 38 143 38 147 44 C 139 56 128 59 120 56 Z" fill={p.accent2} />
          </g>
        )
      case 2: // 꽃봉오리
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 120 56 L 120 44" fill="none" strokeWidth={4} />
            <path d="M 120 44 C 108 42 106 28 114 24 C 118 30 120 34 120 44 Z" fill="#FFB6C8" />
            <path d="M 120 44 C 132 42 134 28 126 24 C 122 30 120 34 120 44 Z" fill="#FF9DB5" />
            <path d="M 120 44 C 112 40 112 30 120 22 C 128 30 128 40 120 44 Z" fill="#FFC9D6" />
          </g>
        )
      default: // 버섯 모자
        return (
          <g stroke={INK} strokeWidth={SW}>
            <path d="M 90 62 C 90 36 150 36 150 62 C 138 66 102 66 90 62 Z" fill="#F08A7A" />
            <circle cx={106} cy={50} r={4.4} fill="#FFF6E8" strokeWidth={0} />
            <circle cx={124} cy={44} r={5.2} fill="#FFF6E8" strokeWidth={0} />
            <circle cx={138} cy={54} r={3.8} fill="#FFF6E8" strokeWidth={0} />
          </g>
        )
    }
  },

  // 다람쥐 볼주머니 주름
  front: (p) => <path d="M 100 112 q -3 6 0 10 M 140 112 q 3 6 0 10" fill="none" stroke={p.shade} strokeWidth={2} />,
}

export function KongkongArt(props: ArtProps) {
  return <BipedArt {...props} spec={spec} />
}

export const kongkong: SpeciesDef = {
  id: 'kongkong',
  name: '콩콩',
  element: 'grass',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: KongkongArt,
}
