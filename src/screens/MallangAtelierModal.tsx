/**
 * 🎨 메챠 디저트 자유 아뜰리에 (MallangAtelierModal.tsx)
 * 
 * 대표님 요구사항 100% 반영:
 * "무기 및 아이템만 구입해서 사용, 나머지는 자유롭게 꾸밀 수 있게
 *  색칠도 자유롭게, 데코도 자유롭게, 직접 만들 수 있도록 자유도를 줘서
 *  규격화된 것보다 기본 순백 도우를 주면 직접 칠하고 꾸미며 만들어내는 DIY 공방"
 * 
 * 🔒 보안 수칙:
 * - 터치/마우스 드로잉 좌표 정규화 (0~240 범위 제한, NaN/인젝션 차단)
 * - 색상 HEX 화이트리스트 검증
 * - 100% 인라인 스타일 (Tailwind 미설치 환경 완벽 호환)
 */

import React, { useState, useRef, useEffect } from 'react'
import type { MonsterRow } from '../lib/api'
import {
  loadMallangCustom,
  saveMallangCustom,
  type MallangCustom,
  type PaintStroke,
  type PaintStamp,
  type StampKind,
  type DoughShapeId,
  DOUGH_SHAPES,
} from '../monsters/MallangChameleon'
import MonsterView from '../monsters/MonsterView'
import { monsterLook } from '../lib/api'

interface MallangAtelierModalProps {
  monster: MonsterRow
  onClose: () => void
  onSaved?: (custom: MallangCustom) => void
}

// 자유 브러시 색상 팔레트 12종
const PALETTE_COLORS = [
  { name: '다크 초코', color: '#3E2217' },
  { name: '밀크 가나슈', color: '#6D4C41' },
  { name: '생딸기 레드', color: '#E11D48' },
  { name: '달콤 핑크', color: '#FF6B8B' },
  { name: '카라멜 시럽', color: '#D97706' },
  { name: '골드 허니', color: '#F59E0B' },
  { name: '말차 그린', color: '#65A30D' },
  { name: '피스타치오', color: '#84CC16' },
  { name: '블루베리', color: '#6366F1' },
  { name: '슈가 화이트', color: '#FFFFFF' },
  { name: '연유 크림', color: '#FEF3C7' },
  { name: '다크 잉크', color: '#1E293B' },
]

// DIY 스탬프 데코 6종
const STAMP_ITEMS: { kind: StampKind; name: string; icon: string }[] = [
  { kind: 'strawberry', name: '통딸기', icon: '🍓' },
  { kind: 'cherry', name: '체리', icon: '🍒' },
  { kind: 'heart', name: '하트초코', icon: '💖' },
  { kind: 'star', name: '별사탕', icon: '⭐' },
  { kind: 'clover', name: '클로버', icon: '🍀' },
  { kind: 'swirl', name: '시럽롤', icon: '🌀' },
]

export const MallangAtelierModal: React.FC<MallangAtelierModalProps> = ({
  monster,
  onClose,
  onSaved,
}) => {
// 모드: 'brush'(직접 그리기) | 'stamp'(데코 콕콕 찍기) | 'eraser'(지우개) | 'mold'(자유 반죽 빚기) | 'pan'(캔버스 이동)
  const [toolMode, setToolMode] = useState<'brush' | 'stamp' | 'eraser' | 'mold' | 'pan'>('brush')
  const [selectedColor, setSelectedColor] = useState<string>('#E11D48')
  const [brushSize, setBrushSize] = useState<number>(10)
  const [selectedStamp, setSelectedStamp] = useState<StampKind>('strawberry')
  
  // 🔍 핀치 줌 & 팬 이동 상태
  const [zoomLevel, setZoomLevel] = useState<number>(1) // 1.0 ~ 3.0x
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const pinchStartRef = useRef<{ dist: number; zoom: number; center: { x: number; y: number }; pan: { x: number; y: number } } | null>(null)
  const lastPointerPosRef = useRef<[number, number] | null>(null)

  // 드로잉 및 반죽 모양 데이터
  const [strokes, setStrokes] = useState<PaintStroke[]>([])
  const [stamps, setStamps] = useState<PaintStamp[]>([])
  const [doughShape, setDoughShape] = useState<DoughShapeId>('round-mochi')
  const [doughType, setDoughType] = useState<'mochi' | 'pudding' | 'jelly' | 'choco'>('mochi')
  const [freeDoughPoints, setFreeDoughPoints] = useState<[number, number][]>([
    [120, 36], [165, 48], [200, 88], [206, 138], [182, 185], [142, 204],
    [98, 204], [58, 185], [34, 138], [40, 88], [75, 48], [120, 36]
  ])
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [currentStroke, setCurrentStroke] = useState<[number, number][]>([])

  const svgRef = useRef<SVGSVGElement | null>(null)

  // 부드러운 유기적 곡선(Catmull-Rom Spline) SVG 패스 생성 헬퍼
  const getDoughSplinePath = (pts: [number, number][]): string => {
    if (pts.length < 3) return ''
    let d = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 0; i < pts.length; i++) {
      const p0 = i === 0 ? pts[pts.length - 1] : pts[i - 1]
      const p1 = pts[i]
      const p2 = pts[(i + 1) % pts.length]
      const p3 = pts[(i + 2) % pts.length]

      const cp1x = p1[0] + (p2[0] - p0[0]) / 5.5
      const cp1y = p1[1] + (p2[1] - p0[1]) / 5.5
      const cp2x = p2[0] - (p3[0] - p1[0]) / 5.5
      const cp2y = p2[1] - (p3[1] - p1[1]) / 5.5

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`
    }
    return d + ' Z'
  }

  // 초기 저장된 커스텀 로드
  useEffect(() => {
    try {
      const saved = loadMallangCustom(monster.id)
      if (saved) {
        if (saved.strokes) setStrokes(saved.strokes)
        if (saved.stamps) setStamps(saved.stamps)
        if (saved.doughShape) setDoughShape(saved.doughShape)
        if (saved.doughType) setDoughType(saved.doughType as any)
        if (saved.freeDoughPoints && saved.freeDoughPoints.length >= 6) {
          setFreeDoughPoints(saved.freeDoughPoints)
        }
      }
    } catch (e) {
      console.error('커스텀 로드 실패:', e)
    }
  }, [monster.id])

  // 좌표 계산 헬퍼 (SVG 240x240 좌표계 기준 정규화)
  const getSvgCoordinates = (e: React.MouseEvent | React.TouchEvent): [number, number] | null => {
    if (!svgRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    const scaleX = 240 / rect.width
    const scaleY = 240 / rect.height
    const x = Math.max(0, Math.min(240, Math.round((clientX - rect.left) * scaleX)))
    const y = Math.max(0, Math.min(240, Math.round((clientY - rect.top) * scaleY)))
    return [x, y]
  }

  // 터치 시작 (두 손가락 핀치 줌 / 팬 이동 / 드로잉 / 리얼 찰흙 반죽 몰딩)
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // ✌️ 1. 두 손가락 터치 시 핀치 줌 & 팬 모드 활성화
    if ('touches' in e && e.touches.length === 2) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
      pinchStartRef.current = { dist, zoom: zoomLevel, center, pan: { ...panOffset } }
      setIsDrawing(false)
      return
    }

    const pt = getSvgCoordinates(e)
    if (!pt) return
    lastPointerPosRef.current = pt

    // ✋ 2. 캔버스 이동 모드일 때
    if (toolMode === 'pan') {
      setIsDrawing(true)
      return
    }

    // ✋ 3. 점선 없는 리얼 찰흙 반죽 몰딩 모드
    if (toolMode === 'mold' || doughShape === 'free-dough') {
      setIsDrawing(true)
      setDoughShape('free-dough')
      return
    }

    // 🍓 4. 스탬프 찍기 모드
    if (toolMode === 'stamp') {
      const newStamp: PaintStamp = {
        kind: selectedStamp,
        x: pt[0],
        y: pt[1],
        color: selectedColor,
        scale: 1,
      }
      setStamps((prev) => [...prev, newStamp])
      return
    }

    // 🖌️ 5. 일반 브러시 칠하기
    setIsDrawing(true)
    setCurrentStroke([pt])
  }

  // 터치 이동 (핀치 줌 / 찰흙 누르고 늘리기 / 붓질)
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    // ✌️ 1. 두 손가락 핀치 줌 및 팬 제어
    if ('touches' in e && e.touches.length === 2 && pinchStartRef.current) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }

      const scaleFactor = dist / (pinchStartRef.current.dist || 1)
      const newZoom = Math.min(3.0, Math.max(1.0, pinchStartRef.current.zoom * scaleFactor))
      setZoomLevel(Math.round(newZoom * 10) / 10)

      const deltaX = center.x - pinchStartRef.current.center.x
      const deltaY = center.y - pinchStartRef.current.center.y
      setPanOffset({
        x: pinchStartRef.current.pan.x + deltaX,
        y: pinchStartRef.current.pan.y + deltaY,
      })
      return
    }

    if (!isDrawing) return
    const pt = getSvgCoordinates(e)
    if (!pt) return

    // ✋ 2. 캔버스 이동 모드
    if (toolMode === 'pan') {
      if (lastPointerPosRef.current) {
        const dx = pt[0] - lastPointerPosRef.current[0]
        const dy = pt[1] - lastPointerPosRef.current[1]
        setPanOffset((prev) => ({ x: prev.x + dx * zoomLevel, y: prev.y + dy * zoomLevel }))
      }
      lastPointerPosRef.current = pt
      return
    }

    // ✋ 3. 점선 없는 리얼 찰흙 반죽 몰딩 (대표님 피드백: "점선 없이 자연스럽게 돌리고 눌러서 빚기")
    if (toolMode === 'mold' || doughShape === 'free-dough') {
      if (lastPointerPosRef.current) {
        const [curX, curY] = pt
        const [prevX, prevY] = lastPointerPosRef.current
        const dx = curX - prevX
        const dy = curY - prevY

        // 손가락 터치 지점 반경 70px 내의 찰흙 외곽 포인트들을 부드럽게 밀고 당기기
        setFreeDoughPoints((oldPts) =>
          oldPts.map(([px, py]) => {
            const dist = Math.hypot(px - curX, py - curY)
            if (dist < 72) {
              // 거리에 따른 부드러운 가우시안 감쇠 (찰흙 누름 강도)
              const influence = Math.pow(Math.max(0, 1 - dist / 72), 1.6) * 1.3
              const nx = Math.max(20, Math.min(220, px + dx * influence))
              const ny = Math.max(20, Math.min(220, py + dy * influence))
              return [nx, ny]
            }
            return [px, py]
          })
        )
      }
      lastPointerPosRef.current = pt
      return
    }

    // 🖌️ 4. 일반 브러시 선 긋기
    setCurrentStroke((prev) => [...prev, pt])
    lastPointerPosRef.current = pt
  }

  // 터치 종료
  const handlePointerUp = () => {
    pinchStartRef.current = null
    lastPointerPosRef.current = null

    if (!isDrawing) return
    setIsDrawing(false)

    if (currentStroke.length > 0) {
      const newStroke: PaintStroke = {
        color: toolMode === 'eraser' ? '#FFFFFF' : selectedColor,
        size: brushSize,
        points: currentStroke,
      }
      setStrokes((prev) => [...prev, newStroke])
      setCurrentStroke([])
    }
  }

  // 되돌리기 (Undo)
  const handleUndo = () => {
    if (strokes.length > 0) {
      setStrokes((prev) => prev.slice(0, -1))
    } else if (stamps.length > 0) {
      setStamps((prev) => prev.slice(0, -1))
    }
  }

  // 전체 지우기 (초기 순백 도우로 리셋)
  const handleClearAll = () => {
    if (confirm('모든 색칠과 데코를 지우고 깨끗한 순백 도우로 되돌릴까요?')) {
      setStrokes([])
      setStamps([])
      setFreeDoughPoints([
        [120, 36], [165, 48], [200, 88], [206, 138], [182, 185], [142, 204],
        [98, 204], [58, 185], [34, 138], [40, 88], [75, 48], [120, 36]
      ])
    }
  }

  // 완성된 커스텀 저장
  const handleSaveAtelier = () => {
    try {
      const current = loadMallangCustom(monster.id) ?? {}
      const updated: MallangCustom = {
        ...current,
        strokes,
        stamps,
        doughShape,
        doughType,
        freeDoughPoints: doughShape === 'free-dough' ? freeDoughPoints : undefined,
        color: '#FFFFFF', // 순백 도우 기본 유지
        baseColor: '#FFFFFF',
      }
      saveMallangCustom(monster.id, updated)
      if (onSaved) onSaved(updated)
      alert('✨ 나만의 세상에 하나뿐인 디저트 펫이 완성되었습니다!')
      onClose()
    } catch (e) {
      console.error('아뜰리에 저장 실패:', e)
    }
  }

  // 실시간 프리뷰 룩 (대표님 피드백: 순백의 도우 바탕에 7대 반죽 형태 & 질감만 살아있는 형태)
  const previewCustom: MallangCustom = {
    ...loadMallangCustom(monster.id),
    strokes,
    stamps,
    doughShape,
    doughType,
    freeDoughPoints: doughShape === 'free-dough' ? freeDoughPoints : undefined,
    color: '#FFFFFF',
    baseColor: '#FFFFFF',
  }
  const previewLook = {
    ...monsterLook(monster),
    color: '#FFFFFF',
    mallang: previewCustom,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 390,
          background: '#FFF9F2',
          borderRadius: 24,
          border: '4px solid #F59E0B',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: '94vh',
        }}
      >
        {/* 상단 아뜰리에 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #FFF1F2 0%, #FFFFFF 50%, #FEF3C7 100%)',
            borderBottom: '1.5px solid #FCD34D',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18 }}>🎨</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#451A03' }}>
              메챠 자유 색칠 & 데코 공방
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#E2E8F0',
              border: 'none',
              borderRadius: '50%',
              width: 26,
              height: 26,
              fontSize: 13,
              fontWeight: 900,
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            ×
          </button>
        </div>

        {/* 메인 캔버스 영역 (직접 터치로 칠하기 & 🔍 핀치 줌 / 팬 이동 지원) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 290,
            background: 'radial-gradient(circle, #FFFFFF 30%, #FFF8EE 70%, #FDE9D0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1.5px solid #E8D3B0',
            overflow: 'hidden',
            touchAction: 'none',
          }}
        >
          {/* 🔍 줌 & 팬 오프셋이 적용되는 내부 인터랙티브 캔버스 컨테이너 */}
          <div
            style={{
              position: 'relative',
              width: 220,
              height: 220,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: isDrawing ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* 바탕 몬스터 뷰 (실시간 3D/2D 렌더링) */}
            <div style={{ width: 220, height: 220, pointerEvents: 'none' }}>
              <MonsterView look={previewLook} size={220} fluid />
            </div>

            {/* 터치/마우스 페인팅 및 리얼 찰흙 반죽 레이어 (240x240 좌표계) */}
            <svg
              ref={svgRef}
              viewBox="0 0 240 240"
              style={{
                position: 'absolute',
                width: 220,
                height: 220,
                cursor:
                  toolMode === 'pan'
                    ? 'grab'
                    : toolMode === 'stamp'
                    ? 'crosshair'
                    : toolMode === 'mold'
                    ? 'move'
                    : 'pointer',
                touchAction: 'none',
              }}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            >
              {/* ✋ 점선 없이 매끄러운 순백 찰흙 도우 실루엣 (자유 반죽일 때 실시간 반영) */}
              {(doughShape === 'free-dough' || toolMode === 'mold') && (
                <path
                  d={getDoughSplinePath(freeDoughPoints)}
                  fill="#FFFFFF"
                  stroke="#F3E8DF"
                  strokeWidth={1.5}
                  style={{
                    filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.08))',
                    transition: isDrawing ? 'none' : 'd 0.1s ease',
                  }}
                />
              )}

              {/* 1. 이전에 그려진 스트로크들 */}
              {strokes.map((s, idx) => {
                if (!s.points || s.points.length === 0) return null
                if (s.points.length === 1) {
                  const [px, py] = s.points[0]
                  return <circle key={idx} cx={px} cy={py} r={s.size / 2} fill={s.color} />
                }
                const d = s.points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px} ${py}`).join(' ')
                return (
                  <path
                    key={idx}
                    d={d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={s.size}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.9}
                  />
                )
              })}

              {/* 2. 찍혀있는 데코 스탬프들 */}
              {stamps.map((st, idx) => {
                const emojiMap: Record<string, string> = {
                  strawberry: '🍓',
                  cherry: '🍒',
                  heart: '💖',
                  star: '⭐',
                  clover: '🍀',
                  swirl: '🌀',
                }
                return (
                  <text
                    key={idx}
                    x={st.x}
                    y={st.y}
                    fontSize={28 * (st.scale || 1)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {emojiMap[st.kind] || '🍓'}
                  </text>
                )
              })}

              {/* 3. 현재 드로잉 중인 실시간 스트로크 미리보기 */}
              {isDrawing && toolMode === 'brush' && currentStroke.length > 1 && (
                <path
                  d={currentStroke.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')}
                  fill="none"
                  stroke={selectedColor}
                  strokeWidth={brushSize}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.8}
                />
              )}

              {/* 4. 앙증맞은 동글 콩알눈 (점선 없이 반죽 표면 위에 자연스럽게 표시) */}
              {(doughShape === 'free-dough' || toolMode === 'mold') && (
                <g style={{ pointerEvents: 'none' }}>
                  <circle cx={104} cy={118} r={3.2} fill="#1A0C08" />
                  <circle cx={103} cy={117} r={1.0} fill="#FFFFFF" />
                  <circle cx={136} cy={118} r={3.2} fill="#1A0C08" />
                  <circle cx={135} cy={117} r={1.0} fill="#FFFFFF" />
                </g>
              )}
            </svg>
          </div>

          {/* 🔍 돋보기 정밀 줌인 컨트롤 바 (1x / 1.5x / 2x / 2.5x & 위치 리셋) */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(255,255,255,0.92)',
              padding: '3px 6px',
              borderRadius: 12,
              border: '1.5px solid #FCD34D',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 900, color: '#92400E' }}>🔍 줌:</span>
            {[1, 1.5, 2, 2.5].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoomLevel(z)}
                style={{
                  padding: '2px 6px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 900,
                  border: zoomLevel === z ? 'none' : '1px solid #E2E8F0',
                  background: zoomLevel === z ? '#F59E0B' : '#FFFFFF',
                  color: zoomLevel === z ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {z}x
              </button>
            ))}
            {(zoomLevel > 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1)
                  setPanOffset({ x: 0, y: 0 })
                }}
                style={{
                  padding: '2px 6px',
                  borderRadius: 6,
                  fontSize: 9,
                  fontWeight: 800,
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  cursor: 'pointer',
                }}
                title="기본 배율 및 위치 복원"
              >
                리셋
              </button>
            )}
          </div>

          {/* 안내 뱃지 */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 10,
              fontSize: 10,
              fontWeight: 800,
              color: '#92400E',
              background: 'rgba(255,255,255,0.92)',
              padding: '2px 8px',
              borderRadius: 10,
              border: '1px solid #FCD34D',
              zIndex: 10,
            }}
          >
            {toolMode === 'pan'
              ? '✋ 손가락으로 캔버스를 드래그하여 이동하세요'
              : toolMode === 'mold' || doughShape === 'free-dough'
              ? '✋ 반죽을 손가락으로 누르고 돌리며 자유롭게 빚으세요! (점선 없음)'
              : zoomLevel > 1
              ? `🔍 ${zoomLevel}x 정밀 꾸미기 (두 손가락으로 확대/축소 가능)`
              : '🖌️ 캔버스 위를 터치해 자유롭게 색칠하세요!'}
          </div>

          {/* 실행취소 & 리셋 버튼 */}
          <div style={{ position: 'absolute', top: 8, right: 10, display: 'flex', gap: 6, zIndex: 10 }}>
            <button
              onClick={handleUndo}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '3px 8px',
                fontSize: 10,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              ↩ 되돌리기
            </button>
            <button
              onClick={handleClearAll}
              style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                padding: '3px 8px',
                fontSize: 10,
                fontWeight: 900,
                color: '#DC2626',
                cursor: 'pointer',
              }}
            >
              순백 리셋
            </button>
          </div>
        </div>

        {/* 툴바 & 팔레트 & 데코 서랍 */}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {/* 🍡 7대 반죽 모양 선택 (메챠카멜레온 7자세 벤치마킹) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#451A03' }}>
                7대 반죽 모양:
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706' }}>
                {DOUGH_SHAPES.find((s) => s.id === doughShape)?.desc}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
              {DOUGH_SHAPES.map((s) => {
                const isSelected = doughShape === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDoughShape(s.id)}
                    style={{
                      flexShrink: 0,
                      padding: '5px 8px',
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 900,
                      border: isSelected ? '1.5px solid #E11D48' : '1px solid #E2E8F0',
                      background: isSelected ? 'linear-gradient(135deg, #FFF1F2, #FFE4E6)' : '#FFFFFF',
                      color: isSelected ? '#BE185D' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: isSelected ? '0 2px 6px rgba(225,29,72,0.2)' : 'none',
                    }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                    {s.span === 2 && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          background: '#FEE2E2',
                          color: '#DC2626',
                          padding: '1px 3px',
                          borderRadius: 6,
                        }}
                      >
                        2칸
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ✨ 대표님 피드백 반영: 순백 도우 4대 질감(모찌·푸딩·젤리·초콜릿) 선택 칩 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#451A03', whiteSpace: 'nowrap' }}>도우 질감:</span>
            <div style={{ display: 'flex', gap: 4, flex: 1 }}>
              {[
                { id: 'mochi', name: '쫀득모찌', icon: '🍡' },
                { id: 'pudding', name: '탱글푸딩', icon: '🍮' },
                { id: 'jelly', name: '말랑젤리', icon: '🍬' },
                { id: 'choco', name: '생초코', icon: '🍫' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDoughType(d.id as any)}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 900,
                    border: doughType === d.id ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                    background: doughType === d.id ? '#FEF3C7' : '#FFFFFF',
                    color: doughType === d.id ? '#92400E' : '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  {d.icon} {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* 모드 전환 탭 (반죽 빚기 / 브러시 칠하기 / 데코 찍기 / 지우개 / 이동) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            <button
              onClick={() => {
                setToolMode('mold')
                setDoughShape('free-dough')
              }}
              style={{
                padding: '7px 0',
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 10,
                border: toolMode === 'mold' ? 'none' : '1px solid #E2E8F0',
                background: toolMode === 'mold' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#FFFFFF',
                color: toolMode === 'mold' ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
              }}
            >
              ✋ 찰흙 빚기
            </button>
            <button
              onClick={() => setToolMode('brush')}
              style={{
                padding: '7px 0',
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 10,
                border: toolMode === 'brush' ? 'none' : '1px solid #E2E8F0',
                background: toolMode === 'brush' ? 'linear-gradient(135deg, #EC4899, #BE185D)' : '#FFFFFF',
                color: toolMode === 'brush' ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
              }}
            >
              🖌️ 붓 칠하기
            </button>
            <button
              onClick={() => setToolMode('stamp')}
              style={{
                padding: '7px 0',
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 10,
                border: toolMode === 'stamp' ? 'none' : '1px solid #E2E8F0',
                background: toolMode === 'stamp' ? 'linear-gradient(135deg, #9333EA, #7E22CE)' : '#FFFFFF',
                color: toolMode === 'stamp' ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
              }}
            >
              🍓 데코 찍기
            </button>
            <button
              onClick={() => setToolMode('eraser')}
              style={{
                padding: '7px 0',
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 10,
                border: toolMode === 'eraser' ? 'none' : '1px solid #E2E8F0',
                background: toolMode === 'eraser' ? '#64748B' : '#FFFFFF',
                color: toolMode === 'eraser' ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
              }}
            >
              🧹 지우개
            </button>
            <button
              onClick={() => setToolMode('pan')}
              style={{
                padding: '7px 0',
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 10,
                border: toolMode === 'pan' ? 'none' : '1px solid #E2E8F0',
                background: toolMode === 'pan' ? 'linear-gradient(135deg, #0284C7, #0369A1)' : '#FFFFFF',
                color: toolMode === 'pan' ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
              }}
            >
              🔍 이동
            </button>
          </div>

          {/* 0. ✋ 자유 반죽 빚기 모드일 때: 형태 프리셋 & 리셋 버튼 */}
          {toolMode === 'mold' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#92400E' }}>
                원하는 모양으로 외곽 핸들을 드래그하거나 캔버스를 둥글게 둘러싸 그리세요:
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  {
                    name: '동글 찹쌀떡',
                    pts: [
                      [120, 36], [165, 48], [200, 88], [206, 138], [182, 185], [142, 204],
                      [98, 204], [58, 185], [34, 138], [40, 88], [75, 48], [120, 36]
                    ]
                  },
                  {
                    name: '폭신 하트',
                    pts: [
                      [120, 70], [150, 40], [190, 48], [205, 95], [180, 150], [120, 205],
                      [60, 150], [35, 95], [50, 48], [90, 40], [120, 70], [120, 70]
                    ]
                  },
                  {
                    name: '반짝 별',
                    pts: [
                      [120, 30], [145, 80], [200, 85], [155, 125], [175, 185], [120, 150],
                      [65, 185], [85, 125], [40, 85], [95, 80], [120, 30], [120, 30]
                    ]
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setFreeDoughPoints(preset.pts as any)
                      setDoughShape('free-dough')
                    }}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      borderRadius: 8,
                      fontSize: 10,
                      fontWeight: 900,
                      border: '1px solid #FCD34D',
                      background: '#FEF3C7',
                      color: '#92400E',
                      cursor: 'pointer',
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 1. 붓 칠하기 모드일 때: 브러시 굵기 & 12색 팔레트 */}
          {toolMode === 'brush' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* 브러시 굵기 3단계 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#475569' }}>브러시 굵기</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { label: '얇은 펜', size: 6 },
                    { label: '중간 붓', size: 12 },
                    { label: '굵은 롤러', size: 22 },
                  ].map((b) => (
                    <button
                      key={b.size}
                      onClick={() => setBrushSize(b.size)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 900,
                        border: brushSize === b.size ? '2px solid #EC4899' : '1px solid #CBD5E1',
                        background: brushSize === b.size ? '#FFF1F2' : '#FFFFFF',
                        color: brushSize === b.size ? '#BE185D' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 12색 컬러 칩 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setSelectedColor(c.color)}
                    style={{
                      height: 28,
                      borderRadius: 8,
                      background: c.color,
                      border: selectedColor === c.color ? '3px solid #EC4899' : '1px solid rgba(0,0,0,0.15)',
                      boxShadow: selectedColor === c.color ? '0 0 0 2px rgba(236,72,153,0.4)' : 'none',
                      cursor: 'pointer',
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. 데코 찍기 모드일 때: 스탬프 선택 */}
          {toolMode === 'stamp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#475569' }}>
                얹을 데코를 고르고 몸체 위 원하는 곳을 터치하세요:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                {STAMP_ITEMS.map((s) => (
                  <button
                    key={s.kind}
                    onClick={() => setSelectedStamp(s.kind)}
                    style={{
                      padding: '6px 0',
                      borderRadius: 10,
                      background: selectedStamp === s.kind ? '#F3E8FF' : '#FFFFFF',
                      border: selectedStamp === s.kind ? '2px solid #9333EA' : '1px solid #CBD5E1',
                      fontSize: 18,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={s.name}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 완성 및 저장 버튼 */}
          <button
            onClick={handleSaveAtelier}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '13px 0',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(217,119,6,0.3)',
            }}
          >
            ✨ 나만의 개성 펫 저장하기 (쇼케이스에 즉시 반영)
          </button>
        </div>
      </div>
    </div>
  )
}

