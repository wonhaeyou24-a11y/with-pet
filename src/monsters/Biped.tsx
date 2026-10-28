// 둥근 머리 + 콩 모양 몸의 두 발 서기 캐릭터 공용 틀. 종족마다 귀·꼬리·머리 장식·특징 부품만 갈아 끼운다.
import type { ReactNode } from 'react'
import Pattern from './Pattern'
import type { ArtProps, Expression, MonsterLook } from './types'

export const INK = '#4A3330'
export const SW = 3.2

export interface Palette {
  fur: string
  shade: string
  belly: string
  inner: string
  accent: string
  accent2: string
  pad: string
  blush: string
  pattern: string
  eye: string
}

export interface Geom {
  headCy: number
  headRx: number
  headRy: number
  bodyCy: number
  bodyRx: number
  bodyRy: number
  eyeDx: number
  eyeDy: number
  muzzle: boolean
  armSpread: number
}

const DEFAULT_GEOM: Geom = {
  headCy: 100,
  headRx: 54,
  headRy: 46,
  bodyCy: 186,
  bodyRx: 38,
  bodyRy: 40,
  eyeDx: 21,
  eyeDy: 8,
  muzzle: true,
  armSpread: 2,
}

type Slot = (variant: number, p: Palette, look: MonsterLook) => ReactNode

export interface BipedSpec {
  palettes: Palette[]
  geom?: Partial<Geom>
  ears: Slot
  tail: Slot
  top: Slot
  back?: (p: Palette, look: MonsterLook, g: Geom) => ReactNode
  bodyExtra?: (p: Palette, look: MonsterLook, g: Geom) => ReactNode
  front?: (p: Palette, look: MonsterLook, g: Geom) => ReactNode
  nose?: (p: Palette) => string
}

export function Eye({ x, y, kind, side, color, lid }: { x: number; y: number; kind: Expression; side: 1 | -1; color: string; lid: string }) {
  if (kind === 'sleepy') {
    return (
      <g>
        <path d={`M ${x - 8} ${y} A 8 8 0 0 0 ${x + 8} ${y} Z`} fill={color} />
        <path d={`M ${x - 9.5} ${y} H ${x + 9.5}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <circle cx={x - 2.5} cy={y + 2.6} r={2} fill="#fff" />
      </g>
    )
  }
  if (kind === 'sharp') {
    const s = side
    return (
      <g>
        <ellipse cx={x} cy={y} rx={7.6} ry={8.4} fill={color} />
        <polygon
          points={`${x - s * 10},${y - 13} ${x + s * 10},${y - 13} ${x + s * 10},${y - 1.5} ${x - s * 10},${y - 6}`}
          fill={lid}
        />
        <path d={`M ${x - s * 10} ${y - 6} L ${x + s * 10} ${y - 1.5}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <circle cx={x - 2} cy={y + 2.5} r={2.4} fill="#fff" />
      </g>
    )
  }
  return (
    <g>
      <ellipse cx={x} cy={y} rx={8.4} ry={9.8} fill={color} />
      <circle cx={x - 2.8} cy={y - 3.4} r={3.4} fill="#fff" />
      <circle cx={x + 2.8} cy={y + 3.6} r={1.7} fill="#fff" />
    </g>
  )
}

export function BipedArt({ look, uid, spec }: ArtProps & { spec: BipedSpec }) {
  const g = { ...DEFAULT_GEOM, ...spec.geom }
  const base = spec.palettes[look.palette % spec.palettes.length]
  // 빛나는 몬스터: 털 색과 그림자 색을 맞바꿔 색이 반전된 모습으로 만든다
  const p = look.shiny ? { ...base, fur: base.shade, shade: base.fur } : base

  const headClip = `${uid}-head`
  const bodyClip = `${uid}-body`
  const furClip = `${uid}-fur`
  const hx = 120
  const eyeY = g.headCy + g.eyeDy
  const noseColor = spec.nose ? spec.nose(p) : '#5A3A36'

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <clipPath id={headClip}>
          <ellipse cx={hx} cy={g.headCy} rx={g.headRx} ry={g.headRy} />
        </clipPath>
        <clipPath id={bodyClip}>
          <ellipse cx={hx} cy={g.bodyCy} rx={g.bodyRx} ry={g.bodyRy} />
        </clipPath>
        <clipPath id={furClip}>
          <ellipse cx={hx} cy={g.headCy} rx={g.headRx} ry={g.headRy} />
          <ellipse cx={hx} cy={g.bodyCy} rx={g.bodyRx} ry={g.bodyRy} />
        </clipPath>
      </defs>

      {/* 뒤쪽: 날개·갈기·등 장식, 꼬리 */}
      {spec.back?.(p, look, g)}
      <g>{spec.tail(look.tail, p, look)}</g>

      {/* 발 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={hx - 20} cy={231} rx={16} ry={9} />
        <ellipse cx={hx + 20} cy={231} rx={16} ry={9} />
      </g>
      <g fill={p.pad} opacity={0.9}>
        <ellipse cx={hx - 20} cy={233} rx={7} ry={3.6} />
        <ellipse cx={hx + 20} cy={233} rx={7} ry={3.6} />
      </g>

      {/* 몸 */}
      <ellipse cx={hx} cy={g.bodyCy} rx={g.bodyRx} ry={g.bodyRy} fill={p.shade} stroke={INK} strokeWidth={SW} />
      <ellipse cx={hx - 3} cy={g.bodyCy - 4} rx={g.bodyRx - 5} ry={g.bodyRy - 5} fill={p.fur} clipPath={`url(#${bodyClip})`} />
      <ellipse cx={hx} cy={g.bodyCy + 6} rx={g.bodyRx * 0.58} ry={g.bodyRy * 0.62} fill={p.belly} />

      {/* 팔 */}
      <g fill={p.fur} stroke={INK} strokeWidth={SW}>
        <ellipse cx={hx - g.bodyRx - g.armSpread} cy={g.bodyCy - 4} rx={9} ry={17} transform={`rotate(12 ${hx - g.bodyRx - g.armSpread} ${g.bodyCy - 4})`} />
        <ellipse cx={hx + g.bodyRx + g.armSpread} cy={g.bodyCy - 4} rx={9} ry={17} transform={`rotate(-12 ${hx + g.bodyRx + g.armSpread} ${g.bodyCy - 4})`} />
      </g>

      {spec.bodyExtra?.(p, look, g)}

      {/* 귀 (머리 뒤) */}
      <g>{spec.ears(look.ears, p, look)}</g>
      <g transform="translate(240 0) scale(-1 1)">{spec.ears(look.ears, p, look)}</g>

      {/* 머리 */}
      <ellipse cx={hx} cy={g.headCy} rx={g.headRx} ry={g.headRy} fill={p.shade} stroke={INK} strokeWidth={SW} />
      <ellipse cx={hx - 3} cy={g.headCy - 4} rx={g.headRx - 5} ry={g.headRy - 5} fill={p.fur} clipPath={`url(#${headClip})`} />

      {/* 고유 무늬 */}
      <Pattern seed={look.patternSeed} color={p.pattern} clipId={furClip} />

      {/* 얼굴 */}
      {g.muzzle && <ellipse cx={hx} cy={g.headCy + 20} rx={20} ry={13.5} fill={p.belly} />}
      <ellipse cx={hx - g.eyeDx - 12} cy={eyeY + 15} rx={8.5} ry={5.4} fill={p.blush} opacity={0.85} />
      <ellipse cx={hx + g.eyeDx + 12} cy={eyeY + 15} rx={8.5} ry={5.4} fill={p.blush} opacity={0.85} />
      <Eye x={hx - g.eyeDx} y={eyeY} kind={look.expression} side={1} color={p.eye} lid={p.fur} />
      <Eye x={hx + g.eyeDx} y={eyeY} kind={look.expression} side={-1} color={p.eye} lid={p.fur} />
      <ellipse cx={hx} cy={eyeY + 12} rx={4.6} ry={3.2} fill={noseColor} />
      <path
        d={`M ${hx - 8.5} ${eyeY + 17.5} Q ${hx - 4.2} ${eyeY + 23} ${hx} ${eyeY + 17.5} Q ${hx + 4.2} ${eyeY + 23} ${hx + 8.5} ${eyeY + 17.5}`}
        fill="none"
        stroke={INK}
        strokeWidth={2.4}
      />

      {spec.front?.(p, look, g)}

      {/* 머리 장식 */}
      <g>{spec.top(look.top, p, look)}</g>
    </g>
  )
}
