import { ClayGradientDefs, Eye, INK, SW, type Palette } from '../Biped'
import Pattern from '../Pattern'
import { scallopPath } from '../shapes'
import type { ArtProps, SpeciesDef } from '../types'

// 콩콩 팔레트 6개 (풀 속성 도토리 다람쥐)
const PALETTES: Palette[] = [
  { fur: '#F2C98F', shade: '#D49A5E', belly: '#FFF4DC', inner: '#F2A99B', accent: '#8B5E3C', accent2: '#7CC874', pad: '#B98059', blush: '#FF9488', pattern: '#C98B52', eye: '#3B2F2F' },
  { fur: '#F6D58A', shade: '#DBA643', belly: '#FFF8E0', inner: '#F4B58A', accent: '#9E6830', accent2: '#6BC269', pad: '#C79347', blush: '#FF9882', pattern: '#D79C34', eye: '#3B2F2F' },
  { fur: '#C99066', shade: '#9E633C', belly: '#F5E0C4', inner: '#E8A59A', accent: '#683E21', accent2: '#86CC74', pad: '#8A5A3C', blush: '#FF9C9C', pattern: '#7E5033', eye: '#3B2A28' },
  { fur: '#B58B72', shade: '#875D46', belly: '#F0DACB', inner: '#E2A0A8', accent: '#583525', accent2: '#90D09E', pad: '#6F4A3C', blush: '#FF9AAE', pattern: '#6A4636', eye: '#3B2A28' },
  { fur: '#F4C6C6', shade: '#D69098', belly: '#FFF2EE', inner: '#F59AAA', accent: '#AD5D63', accent2: '#82C896', pad: '#C77F88', blush: '#FF88A2', pattern: '#D77F8E', eye: '#3B2F2F' },
  { fur: '#A9C4D6', shade: '#7495AF', belly: '#EDF5FA', inner: '#E4A6B2', accent: '#526F86', accent2: '#82C896', pad: '#6C8AA3', blush: '#FFA0AE', pattern: '#5C7A92', eye: '#3B2A28' },
]

// 자세 B: 볼주머니가 불룩한 땅딸보 도토리 체형 (아래쪽 볼이 넓고 다부진 조롱박 실루엣)
const HEAD_D = 'M 120 56 C 154 56 174 78 178 104 C 182 128 164 146 120 146 C 76 146 58 128 62 104 C 66 78 86 56 120 56 Z'
const BODY_D = 'M 88 136 C 70 150 66 184 74 212 C 80 230 100 234 120 234 C 140 234 160 230 166 212 C 174 184 170 150 152 136 Z'

function renderEars(v: number, p: Palette, goldMane?: boolean) {
  const tip = goldMane ? '#FFD54F' : p.accent2
  switch (v % 4) {
    case 0: // 쫑긋 다람쥐 귀 + 잎사귀 끝털
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 80 78 C 62 58 64 38 74 28 C 88 34 100 50 100 68 Z" fill={p.fur} />
          <path d="M 82 70 C 72 56 72 44 76 38 C 84 42 91 52 92 64 Z" fill={p.inner} strokeWidth={0} />
          <path d="M 74 28 C 70 20 78 18 80 26" fill="none" stroke={tip} strokeWidth={3} />
        </g>
      )
    case 1: // 동글 도토리 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <circle cx={76} cy={62} r={16} fill={p.fur} />
          <circle cx={76} cy={63} r={8.5} fill={p.inner} strokeWidth={0} />
        </g>
      )
    case 2: // 싱그러운 잎사귀 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 84 76 C 58 68 44 50 52 32 C 72 34 92 50 96 68 Z" fill={tip} />
          <path d="M 58 40 C 70 50 80 60 90 68" fill="none" strokeWidth={2.2} />
        </g>
      )
    default: // 접힌 방울 귀
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 82 76 C 64 70 56 54 64 42 C 70 48 82 52 94 64 Z" fill={p.fur} />
          <path d="M 64 42 C 68 50 74 56 84 60" fill="none" strokeWidth={2.2} />
        </g>
      )
  }
}

function renderTail(v: number, p: Palette, goldMane?: boolean) {
  const leafColor = goldMane ? '#FFD54F' : p.accent2
  switch (v % 4) {
    case 0: // 몸집만 한 거대 구름-다람쥐 꼬리 + 잎사귀 무늬
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path
            d="M 150 222 C 204 236 232 186 212 136 C 200 106 166 112 170 144 C 173 168 162 188 148 194 Z"
            fill={p.fur}
          />
          <path
            d="M 192 122 C 210 126 218 150 206 176 C 198 158 188 146 180 146 C 178 134 184 122 192 122 Z"
            fill={p.belly}
            strokeWidth={0}
          />
          {/* 꼬리 끝 새싹 잎사귀 */}
          <path d="M 204 124 C 216 108 206 92 192 90 C 186 102 190 116 204 124 Z" fill={leafColor} />
        </g>
      )
    case 1: // 뱅글뱅글 도토리 회오리 꼬리
      return (
        <g>
          <path
            d="M 150 220 C 208 232 228 176 200 148 C 182 132 160 150 174 168 C 184 180 198 168 190 158"
            fill="none"
            stroke={INK}
            strokeWidth={26}
            strokeLinecap="round"
          />
          <path
            d="M 150 220 C 208 232 228 176 200 148 C 182 132 160 150 174 168 C 184 180 198 168 190 158"
            fill="none"
            stroke={p.fur}
            strokeWidth={19}
            strokeLinecap="round"
          />
        </g>
      )
    case 2: // 몽글 솜방울 꼬리
      return (
        <g>
          <path d={scallopPath(192, 184, 28, 34, 9, 0.64)} fill={p.fur} stroke={INK} strokeWidth={SW} />
          <path d={scallopPath(188, 179, 17, 22, 9, 0.64)} fill={p.belly} />
        </g>
      )
    default: // 거대 나뭇잎 부채 꼬리
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path
            d="M 150 220 C 198 230 226 190 216 140 C 206 112 174 118 168 150 C 164 174 158 192 148 198 Z"
            fill={leafColor}
          />
          <path d="M 158 206 C 182 188 196 164 204 134" fill="none" strokeWidth={2.6} />
          <path d="M 182 180 L 198 174 M 190 160 L 206 154" fill="none" strokeWidth={2.2} />
        </g>
      )
  }
}

function renderTop(v: number, p: Palette) {
  switch (v % 4) {
    case 0: // 체크무늬 도토리 베레모 + 잎사귀 꼭지
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 120 38 L 120 22" fill="none" strokeWidth={5.5} />
          <path d="M 120 24 C 128 10 144 12 148 20 C 140 31 128 30 120 24 Z" fill={p.accent2} strokeWidth={2.8} />
          <path d="M 80 66 C 80 32 160 32 160 66 C 144 58 96 58 80 66 Z" fill={p.accent} />
          <path
            d="M 94 46 L 108 61 M 112 40 L 126 60 M 132 42 L 144 56 M 106 40 L 92 56 M 126 40 L 110 60 M 142 46 L 130 58"
            fill="none"
            stroke="#FFF4DC"
            strokeWidth={1.8}
            opacity={0.45}
          />
        </g>
      )
    case 1: // 쌍떡잎 새싹
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 120 58 L 120 46" fill="none" strokeWidth={4} />
          <path d="M 120 48 C 110 32 94 32 90 42 C 98 54 112 54 120 48 Z" fill={p.accent2} />
          <path d="M 120 48 C 130 30 147 30 151 40 C 142 54 128 55 120 48 Z" fill={p.accent2} />
        </g>
      )
    case 2: // 분홍 숲 꽃봉오리
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 120 58 L 120 44" fill="none" strokeWidth={4} />
          <path d="M 120 44 C 106 42 104 26 113 22 C 118 28 120 34 120 44 Z" fill="#FFB6C8" />
          <path d="M 120 44 C 134 42 136 26 127 22 C 122 28 120 34 120 44 Z" fill="#FF9DB5" />
          <path d="M 120 44 C 110 38 110 26 120 18 C 130 26 130 38 120 44 Z" fill="#FFD1DC" />
        </g>
      )
    default: // 알록달록 숲 버섯 모자
      return (
        <g stroke={INK} strokeWidth={SW}>
          <path d="M 84 64 C 84 32 156 32 156 64 C 142 69 98 69 84 64 Z" fill="#F08A7A" />
          <circle cx={104} cy={50} r={5} fill="#FFF6E8" strokeWidth={0} />
          <circle cx={123} cy={43} r={6} fill="#FFF6E8" strokeWidth={0} />
          <circle cx={140} cy={53} r={4.2} fill="#FFF6E8" strokeWidth={0} />
        </g>
      )
  }
}

export function KongkongArt({ look, uid }: ArtProps) {
  const base = PALETTES[look.palette % PALETTES.length]
  const p = look.shiny ? { ...base, fur: base.shade, shade: base.fur } : base
  const goldMane = Boolean(look.medals?.enabled !== false && look.medals?.goldMane)
  const clipId = `${uid}-kong-clip`

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <ClayGradientDefs uid={uid} fur={p.fur} shade={p.shade} belly={p.belly} accent={p.accent} accent2={p.accent2} />
        <clipPath id={clipId}>
          <path d={HEAD_D} />
          <path d={BODY_D} />
        </clipPath>
      </defs>

      {/* 거대 다람쥐 꼬리 (몸 뒤쪽) */}
      {renderTail(look.tail, p, goldMane)}

      {/* 통통한 뒷발 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={96} cy={232} rx={18} ry={9.5} />
        <ellipse cx={144} cy={232} rx={18} ry={9.5} />
      </g>
      <g fill={p.pad} opacity={0.9}>
        <ellipse cx={96} cy={234} rx={8} ry={4} />
        <ellipse cx={144} cy={234} rx={8} ry={4} />
      </g>

      {/* 도토리 모양 통통한 몸통 + 둥근 배 패치 */}
      <path d={BODY_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      <ellipse cx={120} cy={190} rx={31} ry={34} fill={`url(#${uid}-clay-belly)`} />
      {/* 배 위 도토리 잎 무늬 포인트 */}
      <path d="M 112 166 Q 120 172 128 166" fill="none" stroke={p.shade} strokeWidth={2.2} opacity={0.6} />

      {/* 귀 (양쪽 대칭) */}
      <g>{renderEars(look.ears, p, goldMane)}</g>
      <g transform="translate(240 0) scale(-1 1)">{renderEars(look.ears, p, goldMane)}</g>

      {/* 볼주머니가 불룩한 다람쥐 머리 */}
      <path d={HEAD_D} fill={`url(#${uid}-clay-fur)`} stroke={INK} strokeWidth={SW} />
      {/* 양볼 볼주머니 하이라이트 */}
      <circle cx={80} cy={118} r={18} fill={p.belly} opacity={0.45} />
      <circle cx={160} cy={118} r={18} fill={p.belly} opacity={0.45} />

      {/* 고유 무늬 */}
      <Pattern seed={look.patternSeed} color={p.pattern} clipId={clipId} />

      {/* 다람쥐 주둥이 + 귀여운 앞니 하나 */}
      <ellipse cx={120} cy={121} rx={22} ry={14} fill={p.belly} />
      <ellipse cx={84} cy={121} rx={9.5} ry={6} fill={p.blush} opacity={0.88} />
      <ellipse cx={156} cy={121} rx={9.5} ry={6} fill={p.blush} opacity={0.88} />
      {/* 볼주머니 곡선 주름 */}
      <path d="M 68 112 Q 63 121 70 130 M 172 112 Q 177 121 170 130" fill="none" stroke={p.shade} strokeWidth={2.4} />

      <Eye x={97} y={106} kind={look.expression} side={1} color={p.eye} lid={p.fur} />
      <Eye x={143} y={106} kind={look.expression} side={-1} color={p.eye} lid={p.fur} />

      {/* 귀여운 앞니 + 코·입 */}
      <rect x={117} y={123} width={6} height={6.5} rx={2} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
      <ellipse cx={120} cy={116} rx={4.8} ry={3.4} fill="#5A3A36" />
      <path d="M 110 122 Q 115 127 120 122 Q 125 127 130 122" fill="none" stroke={INK} strokeWidth={2.5} />

      {/* 가슴 앞에 두 손을 공손히 모은 다람쥐 고유 포즈 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={103} cy={168} rx={12} ry={9} transform="rotate(24 103 168)" />
        <ellipse cx={137} cy={168} rx={12} ry={9} transform="rotate(-24 137 168)" />
      </g>

      {/* 머리 위 도토리 모자 / 장식 */}
      {renderTop(look.top, p)}
    </g>
  )
}

export const kongkong: SpeciesDef = {
  id: 'kongkong',
  name: '콩콩',
  element: 'grass',
  postureLabel: '자세 B · 통통 도토리형',
  silhouetteDesc: '불룩한 볼주머니와 가슴 앞에 모은 두 손, 몸집만 한 거대 잎사귀 꼬리',
  paletteCount: PALETTES.length,
  partCounts: { ears: 4, tail: 4, top: 4 },
  Art: KongkongArt,
}
