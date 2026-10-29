import { useId, useRef, type PointerEvent } from 'react'
import { BackDecorations, FrontDecorations } from './Decorations'
import { CHAMELEON_PALETTES, MorphBodyPaintOverlay, SyrupToppingLayer, UniversalWingLayer } from './MallangChameleon'
import './monsters.css'
import { SPECIES } from './registry'
import type { BodyType, MonsterLook } from './types'

const BODY_SCALE: Record<BodyType, [number, number]> = {
  chubby: [1.1, 0.95],
  normal: [1, 1],
  slim: [0.92, 1.06],
}

type Props = {
  look: MonsterLook
  size?: number
  animate?: boolean
  title?: string
  // 화면 높이에 맞춰 크기가 줄어든다 (한 화면에 들어오는 홈용)
  fluid?: boolean
  // 메챠 카멜레온 공방에서 몸통 위에 직접 브러시/스탬프를 찍을 때 사용하는 좌표 콜백
  interactive?: boolean
  onCanvasPoint?: (x: number, y: number, phase: 'down' | 'move' | 'up') => void
}

// 개체마다 다른 외형(look) + 말랑카멜레온 체형변신·바디페인팅 + 특수변이 + 육성훈장 + 장식 7칸을 조합해 레이어 SVG 몬스터를 그린다
export default function MonsterView({
  look,
  size = 240,
  animate = true,
  title,
  fluid = false,
  interactive = false,
  onCanvasPoint,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement | null>(null)
  const activeSpecies = look.mallang?.morphForm ?? look.species
  const def = SPECIES[activeSpecies] ?? SPECIES[look.species]
  if (!def) return null

  const effectiveLook: MonsterLook = {
    ...look,
    species: activeSpecies,
    palette: look.mallang?.skinPalette ?? look.palette,
  }

  const [bx, by] = BODY_SCALE[effectiveLook.bodyType]
  const sx = bx * effectiveLook.scale
  const sy = by * effectiveLook.scale
  const Art = def.Art
  const mutClass = effectiveLook.mutation ? `mon-mut-${effectiveLook.mutation}` : ''
  const cls = [effectiveLook.shiny ? 'mon-shiny' : '', mutClass].filter(Boolean).join(' ') || undefined
  const wingPalette = CHAMELEON_PALETTES[(effectiveLook.palette ?? 0) % CHAMELEON_PALETTES.length]

  // 화면 포인터 좌표를 SVG 내부(240x260) 좌표로 안전하게 변환
  function extractPoint(e: PointerEvent<SVGSVGElement>): [number, number] | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    const x = ((e.clientX - rect.left) / rect.width) * 240
    const y = ((e.clientY - rect.top) / rect.height) * 260
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
  }

  function handlePointerDown(e: PointerEvent<SVGSVGElement>) {
    if (!interactive || !onCanvasPoint) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const pt = extractPoint(e)
    if (pt) onCanvasPoint(pt[0], pt[1], 'down')
  }

  function handlePointerMove(e: PointerEvent<SVGSVGElement>) {
    if (!interactive || !onCanvasPoint) return
    const pt = extractPoint(e)
    if (pt) onCanvasPoint(pt[0], pt[1], 'move')
  }

  function handlePointerUp(e: PointerEvent<SVGSVGElement>) {
    if (!interactive || !onCanvasPoint) return
    const pt = extractPoint(e)
    if (pt) onCanvasPoint(pt[0], pt[1], 'up')
  }

  const isDessertForm =
    activeSpecies === 'mochi' ||
    activeSpecies === 'pudding' ||
    activeSpecies === 'jelly' ||
    activeSpecies === 'choco' ||
    activeSpecies === 'smore'
  const hasInternalWing =
    isDessertForm ||
    activeSpecies === 'chameleon' ||
    activeSpecies === 'dubai-cookie' ||
    activeSpecies === 'wax-ball' ||
    activeSpecies === 'tanghulu'

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 240 260"
      {...(fluid ? {} : { width: size, height: (size * 260) / 240 })}
      role="img"
      aria-label={title ?? def.name}
      style={{
        overflow: 'visible',
        touchAction: interactive ? 'none' : undefined,
        cursor: interactive ? 'crosshair' : undefined,
      }}
      className={cls}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 발밑 따뜻한 그림자 */}
      <ellipse cx={120} cy={239} rx={62} ry={9} fill="rgba(89,62,34,0.15)" />
      <g transform={`translate(120 236) scale(${sx} ${sy}) translate(-120 -236)`}>
        <g className={animate ? 'mon-bounce' : undefined}>
          <g className={animate ? (isDessertForm ? 'mon-jiggle' : 'mon-breathe') : undefined}>
            <BackDecorations deco={effectiveLook.decorations} />
            {!hasInternalWing && (
              <UniversalWingLayer wingKind={effectiveLook.mallang?.wingKind} p={wingPalette} />
            )}
            <Art look={effectiveLook} uid={uid} />
            <MorphBodyPaintOverlay custom={effectiveLook.mallang} uid={uid} activeSpecies={activeSpecies} />
            <SyrupToppingLayer syrups={effectiveLook.mallang?.syrups} />
            <FrontDecorations
              deco={effectiveLook.decorations}
              medals={effectiveLook.medals}
              mutation={effectiveLook.mutation}
            />
          </g>
        </g>
      </g>
      {effectiveLook.shiny && (
        <g fill="#FFD84D" stroke="#fff" strokeWidth={1.2} className={animate ? 'mon-twinkle' : undefined}>
          <path d="M 28 60 l 4 10 l 10 4 l -10 4 l -4 10 l -4 -10 l -10 -4 l 10 -4 Z" />
          <path d="M 208 36 l 3 8 l 8 3 l -8 3 l -3 8 l -3 -8 l -8 -3 l 8 -3 Z" />
          <path d="M 214 150 l 3 7 l 7 3 l -7 3 l -3 7 l -3 -7 l -7 -3 l 7 -3 Z" />
        </g>
      )}
    </svg>
  )
}
