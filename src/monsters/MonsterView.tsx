import { useId, useRef, useState, type PointerEvent } from 'react'
import { BackDecorations, FrontDecorations } from './Decorations'
import { normalizeDessertSpecies } from './dessertNormalizer'
import { CHAMELEON_PALETTES, MorphBodyPaintOverlay, SyrupToppingLayer, UniversalWingLayer } from './MallangChameleon'
import Monster3DView from './Monster3DView'
import MonsterSnapshot from './MonsterSnapshot'
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
  // 레거시 호환용 (3D 스냅샷으로 안전 렌더링)
  prefer2D?: boolean
  onCanvasPoint?: (x: number, y: number, phase: 'down' | 'move' | 'up') => void
}

// 🛡️ [2D 깜빡임/노출 원천 차단] 100% 실시간 3D(Three.js) 캐릭터를 우선 렌더링하며,
// WebGL 컨텍스트 일시 부족 시에도 옛날 2D SVG가 아닌 3D 스냅샷(MonsterSnapshot)을 보여줍니다.
export default function MonsterView({
  look,
  size = 240,
  animate = true,
  title,
  fluid = false,
  interactive = false,
  prefer2D = false,
  onCanvasPoint,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [fallback2D, setFallback2D] = useState(false)
  const activeSpecies = normalizeDessertSpecies(look.mallang?.morphForm ?? look.species)
  const def = SPECIES[activeSpecies] ?? SPECIES['mochi'] ?? Object.values(SPECIES)[0]
  if (!def) return null

  const effectiveLook: MonsterLook = {
    ...look,
    species: activeSpecies,
    palette: look.mallang?.skinPalette ?? look.palette,
  }

  // 1. 공방 바디페인팅 인터랙티브 캔버스가 아니고 prefer2D도 아닐 때: Three.js 실시간 3D
  if (!prefer2D && !interactive && !fallback2D) {
    return (
      <Monster3DView
        look={effectiveLook}
        size={size || 200}
        fluid={fluid}
        onFallbackNeeded={() => setFallback2D(true)}
      />
    )
  }

  // 2. 🛡️ 핵심 수정: WebGL 컨텍스트 부족(fallback2D)이나 prefer2D 발생 시,
  // 옛날 2D 캐릭터 SVG가 노출되지 않도록 실제 3D 모델의 고화질 3D 스냅샷(MonsterSnapshot)으로 100% 안전 치유!
  if (!interactive) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
        title={title ?? def.name}
      >
        <MonsterSnapshot look={effectiveLook} size={size} title={title ?? def.name} />
      </div>
    )
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
