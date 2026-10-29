// M3 화면 1: 🌈 방사형(Radial) 줌인·축소 식감 스킬 트리 & 전투 성향 장착소
// 중앙의 내 디저트 몬스터 코어에서 6개 식감 가지(맹공·철벽·교감·요술·깜짝·원소)가 360도 방사형으로 뻗어 나가며,
// 핀치 줌 / 휠 줌 / 확대·축소 버튼과 드래그 패닝으로 탐색하고 한 화면(무스크롤)에서 해금·장착합니다.

import { useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import {
  ALL_SKILL_NODES,
  BATTLE_STANCES,
  DEFAULT_EQUIPPED_SKILLS,
  DEFAULT_UNLOCKED_SKILLS,
  SKILL_BRANCHES,
  type BattleStanceId,
  type SkillBranchId,
  type SkillNodeDef,
} from '../config/skills'
import { SPECIES_INFO } from '../config/species'
import { type MonsterRow } from '../lib/api'
import { playDessertAsmr } from '../lib/sound'
import { supabase } from '../lib/supabase'
import { BackIcon } from '../ui/Icons'

interface Props {
  monster: MonsterRow
  onUpdateMonster: (updated: MonsterRow) => void
  onBack: () => void
}

interface PositionedNode {
  node: SkillNodeDef
  branchIdx: number
  stepIdx: number
  x: number
  y: number
  parentX: number
  parentY: number
  color: string
  branchName: string
}

const CANVAS_SIZE = 960
const CENTER = CANVAS_SIZE / 2

export default function SkillTreeScreen({ monster, onUpdateMonster, onBack }: Props) {
  const [unlocked, setUnlocked] = useState<string[]>(() => monster.unlocked_skills ?? DEFAULT_UNLOCKED_SKILLS)
  const [equipped, setEquipped] = useState<string[]>(() => monster.equipped_skills ?? DEFAULT_EQUIPPED_SKILLS)
  const [stance, setStance] = useState<BattleStanceId>(() => monster.battle_stance ?? 'balanced')
  const [sp, setSp] = useState<number>(() => Math.max(monster.sp ?? 3, 3))
  const [selectedId, setSelectedId] = useState<string>(ALL_SKILL_NODES[0].id)
  const [toast, setToast] = useState<string | null>(null)

  // 방사형 캔버스 줌(확대/축소) & 패닝(이동) 상태
  const [zoom, setZoom] = useState<number>(0.75)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragRef = useRef<{
    active: boolean
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false })

  // 멀티터치 핀치 줌 추적용
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchDistRef = useRef<number | null>(null)

  const speciesInfo = SPECIES_INFO[monster.species]

  // 6개 가지를 60도 간격(360도 방사형)으로 배치하고, 각 가지의 노드들을 1단계(내부링) -> 2단계(중간링) -> 3단계(외부링)로 연결
  const radialNodes = useMemo<PositionedNode[]>(() => {
    const list: PositionedNode[] = []
    const nodeCoordMap = new Map<string, { x: number; y: number }>()

    SKILL_BRANCHES.forEach((b, bIdx) => {
      const baseAngleDeg = bIdx * 60 - 90 // 위쪽(-90도)부터 시계방향 6방향
      const baseAngleRad = (baseAngleDeg * Math.PI) / 180
      const branchSkills = ALL_SKILL_NODES.filter((s) => s.branch === b.id)

      const coreX = CENTER + Math.cos(baseAngleRad) * 58
      const coreY = CENTER + Math.sin(baseAngleRad) * 58

      branchSkills.forEach((node, sIdx) => {
        // 티어별 거리: T1(130~195) -> T2(285) -> T3(385)
        let radius = 135
        let angleOffsetDeg = 0
        if (node.tier === 1) {
          radius = 125 + sIdx * 55
          angleOffsetDeg = sIdx === 0 ? 0 : sIdx % 2 === 1 ? -12 : 12
        } else if (node.tier === 2) {
          radius = 285
          angleOffsetDeg = 0
        } else if (node.tier === 3) {
          radius = 385
          angleOffsetDeg = 0
        }

        const rad = ((baseAngleDeg + angleOffsetDeg) * Math.PI) / 180
        const x = Math.round(CENTER + Math.cos(rad) * radius)
        const y = Math.round(CENTER + Math.sin(rad) * radius)

        nodeCoordMap.set(node.id, { x, y })

        // 선행 스킬이 있으면 선행 스킬 위치에서 선 연결, 없으면 코어 또는 이전 노드 연결
        let parentX = coreX
        let parentY = coreY
        if (node.requires && node.requires.length > 0) {
          const reqCoord = nodeCoordMap.get(node.requires[0])
          if (reqCoord) {
            parentX = reqCoord.x
            parentY = reqCoord.y
          }
        } else if (sIdx > 0 && list.length > 0) {
          parentX = list[list.length - 1].x
          parentY = list[list.length - 1].y
        }

        list.push({
          node,
          branchIdx: bIdx,
          stepIdx: sIdx,
          x,
          y,
          parentX,
          parentY,
          color: b.color,
          branchName: b.name,
        })
      })
    })
    return list
  }, [])

  const selectedPositioned = useMemo(
    () => radialNodes.find((p) => p.node.id === selectedId) ?? radialNodes[0],
    [radialNodes, selectedId],
  )

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  async function persistChanges(nextUnlocked: string[], nextEquipped: string[], nextStance: BattleStanceId, nextSp: number) {
    const updated: MonsterRow = {
      ...monster,
      unlocked_skills: nextUnlocked,
      equipped_skills: nextEquipped,
      battle_stance: nextStance,
      sp: nextSp,
    }
    onUpdateMonster(updated)
    try {
      await supabase
        .from('monsters')
        .update({
          unlocked_skills: nextUnlocked,
          equipped_skills: nextEquipped,
          battle_stance: nextStance,
          sp: nextSp,
        })
        .eq('id', monster.id)
    } catch {
      // 오프라인/로컬 폴백 시 상위 상태에 안전 반영됨
    }
  }

  // 특정 노드를 선택하면 해당 노드가 화면 중앙에 오도록 부드럽게 패닝 + ASMR 사운드 재생
  function focusNode(p: PositionedNode) {
    setSelectedId(p.node.id)
    playDessertAsmr(p.node.asmr)
    const targetZoom = Math.max(zoom, 0.95)
    setZoom(targetZoom)
    setPan({
      x: (CENTER - p.x) * targetZoom * 0.65,
      y: (CENTER - p.y) * targetZoom * 0.65,
    })
  }

  function focusBranch(branchId: SkillBranchId) {
    const first = radialNodes.find((p) => p.node.branch === branchId)
    if (first) focusNode(first)
  }

  function handleUnlock(node: SkillNodeDef) {
    if (unlocked.includes(node.id)) return
    const curLevel = monster.level ?? 1
    if (node.tier === 2 && curLevel < 8) {
      showToast('🔒 Tier 2 스킬은 Lv.8 (2단계 진화) 이상부터 배울 수 있어요!')
      return
    }
    if (node.tier === 3 && curLevel < 15) {
      showToast('👑 궁극기 스킬은 Lv.15 (3단계 로얄 진화) 이상부터 배울 수 있어요!')
      return
    }
    if (node.requires && node.requires.some((reqId) => !unlocked.includes(reqId))) {
      showToast('🔒 선행 식감 스킬을 먼저 습득해야 배울 수 있어요!')
      return
    }
    if (sp < node.spCost) {
      showToast('SP가 부족해요! 훈련이나 레벨업으로 SP를 모아 보세요.')
      return
    }
    playDessertAsmr(node.asmr, 2)
    const nextUnlocked = [...unlocked, node.id]
    const nextSp = sp - node.spCost
    const nextEquipped =
      node.kind === 'active' && equipped.length < 4 && !equipped.includes(node.id)
        ? [...equipped, node.id]
        : equipped
    setUnlocked(nextUnlocked)
    setSp(nextSp)
    setEquipped(nextEquipped)
    void persistChanges(nextUnlocked, nextEquipped, stance, nextSp)
    showToast(`✨ [${node.name}] 식감 스킬 해금 완료!`)
  }

  function handleToggleEquip(node: SkillNodeDef) {
    if (!unlocked.includes(node.id) || node.kind !== 'active') return
    playDessertAsmr(node.asmr, 1)
    let nextEquipped: string[]
    if (equipped.includes(node.id)) {
      if (equipped.length <= 1) {
        showToast('최소 1개의 액티브 스킬은 장착해야 해요!')
        return
      }
      nextEquipped = equipped.filter((id) => id !== node.id)
      showToast(`[${node.name}] 장착 해제`)
    } else {
      if (equipped.length >= 4) {
        nextEquipped = [...equipped.slice(1), node.id]
        showToast(`⚔️ [${node.name}] 스킬을 슬롯에 교체 장착했어요!`)
      } else {
        nextEquipped = [...equipped, node.id]
        showToast(`⚔️ [${node.name}] 스킬 장착 완료!`)
      }
    }
    setEquipped(nextEquipped)
    void persistChanges(unlocked, nextEquipped, stance, sp)
  }

  function handleCycleStance() {
    const idx = BATTLE_STANCES.findIndex((s) => s.id === stance)
    const next = BATTLE_STANCES[(idx + 1) % BATTLE_STANCES.length]
    playDessertAsmr('syrup-drizzle')
    setStance(next.id)
    void persistChanges(unlocked, equipped, next.id, sp)
    showToast(`${next.icon} 전투 성향: ${next.name}`)
  }

  // 포인터 드래그 & 핀치 줌 핸들러
  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      pinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      dragRef.current.active = false
      return
    }

    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
      moved: false,
    }
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    // 두 손가락 핀치 줌 처리
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      if (pinchDistRef.current && pinchDistRef.current > 10) {
        const ratio = dist / pinchDistRef.current
        setZoom((z) => Math.max(0.52, Math.min(1.85, Number((z * ratio).toFixed(2)))))
      }
      pinchDistRef.current = dist
      return
    }

    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true
    }
    setPan({
      x: Math.max(-340, Math.min(340, dragRef.current.originX + dx)),
      y: Math.max(-340, Math.min(340, dragRef.current.originY + dy)),
    })
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) {
      pinchDistRef.current = null
    }
    dragRef.current.active = false
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    const delta = e.deltaY < 0 ? 0.12 : -0.12
    setZoom((z) => Math.max(0.52, Math.min(1.85, Number((z + delta).toFixed(2)))))
  }

  const currentStanceObj = BATTLE_STANCES.find((s) => s.id === stance) ?? BATTLE_STANCES[0]
  const selNode = selectedPositioned.node
  const isSelUnlocked = unlocked.includes(selNode.id)
  const isSelEquipped = equipped.includes(selNode.id)

  return (
    <main className="screen">
      {/* 1. 상단 헤더 바 */}
      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title">🌈 방사형 식감 스킬 트리</h1>
        <button
          className="chip honey"
          onClick={() => {
            playDessertAsmr('syrup-drizzle')
            setSp((s) => s + 1)
            showToast('🎁 연구 보너스로 SP +1을 획득했어요!')
          }}
          style={{ cursor: 'pointer', fontWeight: 900 }}
          title="누르면 테스트용 SP +1 충전"
        >
          ⭐ SP {sp} (+충전)
        </button>
      </div>

      {/* 2. 장착 슬롯 4칸 & 전투 성향 원터치 바 */}
      <div
        className="card tight"
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
        }}
      >
        <div className="row" style={{ gap: 6, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#7A6A60', whiteSpace: 'nowrap' }}>장착({equipped.length}/4)</span>
          <div className="row" style={{ gap: 4 }}>
            {[0, 1, 2, 3].map((slotIdx) => {
              const skId = equipped[slotIdx]
              const sk = ALL_SKILL_NODES.find((s) => s.id === skId)
              return (
                <button
                  key={slotIdx}
                  onClick={() => {
                    if (sk) {
                      const pos = radialNodes.find((r) => r.node.id === sk.id)
                      if (pos) focusNode(pos)
                    }
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: sk ? '2px solid #FF8A65' : '1.5px dashed #D7C49E',
                    background: sk ? '#FFF5EE' : '#FFFDF9',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 16,
                    cursor: sk ? 'pointer' : 'default',
                    padding: 0,
                  }}
                  title={sk ? sk.name : '빈 슬롯'}
                >
                  {sk ? sk.icon : '·'}
                </button>
              )
            })}
          </div>
        </div>

        <button
          className="chip coral"
          onClick={handleCycleStance}
          style={{ cursor: 'pointer', fontWeight: 800, flexShrink: 0 }}
        >
          {currentStanceObj.icon} {currentStanceObj.name.split(' ')[0]} ↻
        </button>
      </div>

      {/* 3. 360도 방사형 줌인/축소 인터랙티브 스킬 맵 (남은 화면 영역 꽉 채움) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          borderRadius: 24,
          border: '2px solid #E8D5B5',
          background:
            'radial-gradient(circle at 50% 50%, #2D223B 0%, #1E1729 58%, #140F1D 100%)',
          boxShadow: 'inset 0 4px 24px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
          cursor: 'grab',
        }}
      >
        {/* 상단 6개 가지 빠른 줌 이동 칩 바 */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            zIndex: 15,
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 4,
          }}
        >
          {SKILL_BRANCHES.map((b) => (
            <button
              key={b.id}
              onClick={() => focusBranch(b.id)}
              style={{
                padding: '5px 2px',
                borderRadius: 999,
                border: `1.5px solid ${b.color}`,
                background: 'rgba(25, 18, 36, 0.82)',
                color: '#FFFDF9',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {b.icon} {b.name.slice(0, 2)}
            </button>
          ))}
        </div>

        {/* 우측 하단 줌인/축소/초기화 플로팅 컨트롤러 */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <button
            onClick={() => setZoom((z) => Math.min(1.85, Number((z + 0.22).toFixed(2))))}
            style={{
              width: 44,
              height: 36,
              padding: 0,
              borderRadius: 12,
              border: '1.5px solid rgba(255,255,255,0.28)',
              background: 'rgba(35, 26, 48, 0.88)',
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
            }}
            aria-label="확대"
          >
            ＋
          </button>
          <button
            onClick={() => {
              setZoom(0.82)
              setPan({ x: 0, y: 0 })
            }}
            style={{
              width: 44,
              height: 30,
              padding: 0,
              borderRadius: 10,
              border: '1.5px solid rgba(255,255,255,0.28)',
              background: 'rgba(35, 26, 48, 0.88)',
              color: '#FFE082',
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.52, Number((z - 0.22).toFixed(2))))}
            style={{
              width: 44,
              height: 36,
              padding: 0,
              borderRadius: 12,
              border: '1.5px solid rgba(255,255,255,0.28)',
              background: 'rgba(35, 26, 48, 0.88)',
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
            }}
            aria-label="축소"
          >
            －
          </button>
        </div>

        {/* 좌측 하단 안내 배지 */}
        <div
          style={{
            position: 'absolute',
            left: 10,
            bottom: 10,
            zIndex: 12,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(20, 15, 29, 0.72)',
            color: '#E2D6F3',
            fontSize: 12,
            fontWeight: 700,
            pointerEvents: 'none',
          }}
        >
          👆 드래그 이동 · 🤏 확대/축소 · 노드 터치
        </div>

        {/* 실제 확대/축소 및 패닝이 적용되는 960x960 방사형 월드 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            marginLeft: -CENTER,
            marginTop: -CENTER,
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: '50% 50%',
            transition: dragRef.current.active ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* 방사형 동심원 가이드 & 연결선 SVG */}
          <svg
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {/* 동심원 궤도 3개 */}
            {[148, 246, 344, 435].map((r, i) => (
              <circle
                key={i}
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={1.5}
                strokeDasharray="6 6"
              />
            ))}

            {/* 6방위 섹터 광선 */}
            {SKILL_BRANCHES.map((b, idx) => {
              const rad = ((idx * 60 - 90) * Math.PI) / 180
              const x2 = CENTER + Math.cos(rad) * 445
              const y2 = CENTER + Math.sin(rad) * 445
              return (
                <line
                  key={b.id}
                  x1={CENTER}
                  y1={CENTER}
                  x2={x2}
                  y2={y2}
                  stroke={b.color}
                  strokeOpacity={0.22}
                  strokeWidth={2}
                />
              )
            })}

            {/* 부모-자식 스킬 노드 연결선 */}
            {radialNodes.map((p) => {
              const isUnlocked = unlocked.includes(p.node.id)
              return (
                <line
                  key={`edge-${p.node.id}`}
                  x1={p.parentX}
                  y1={p.parentY}
                  x2={p.x}
                  y2={p.y}
                  stroke={isUnlocked ? p.color : 'rgba(255,255,255,0.22)'}
                  strokeWidth={isUnlocked ? 5 : 2.5}
                  strokeDasharray={isUnlocked ? undefined : '6 5'}
                  strokeLinecap="round"
                />
              )
            })}
          </svg>

          {/* 중앙 코어 허브: 내 디저트 몬스터 */}
          <div
            onClick={() => {
              setPan({ x: 0, y: 0 })
              setZoom(0.85)
              playDessertAsmr('mochi-squish')
            }}
            style={{
              position: 'absolute',
              left: CENTER - 58,
              top: CENTER - 58,
              width: 116,
              height: 116,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #FFF8EA 0%, #FFE0B2 100%)',
              border: '4px solid #FFB74D',
              boxShadow: '0 0 28px rgba(255, 183, 77, 0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              padding: 6,
            }}
          >
            <span style={{ fontSize: 24 }}>🍰</span>
            <strong style={{ fontSize: 13, color: '#3B2F2F', lineHeight: 1.15 }}>
              {monster.name ?? speciesInfo?.name ?? '디저트'}
            </strong>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#D85A3A' }}>
              해금 {unlocked.length}/{ALL_SKILL_NODES.length}
            </span>
          </div>

          {/* 방사형 스킬 노드들 */}
          {radialNodes.map((p) => {
            const isUnlocked = unlocked.includes(p.node.id)
            const isEquipped = equipped.includes(p.node.id)
            const isSelected = selectedId === p.node.id

            return (
              <button
                key={p.node.id}
                onClick={(e) => {
                  e.stopPropagation()
                  if (dragRef.current.moved) return
                  focusNode(p)
                }}
                style={{
                  position: 'absolute',
                  left: p.x - 36,
                  top: p.y - 36,
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: isSelected
                    ? '3.5px solid #FFFFFF'
                    : isEquipped
                      ? '3px solid #FF8A65'
                      : isUnlocked
                        ? `3px solid ${p.color}`
                        : '2px dashed rgba(255,255,255,0.38)',
                  background: isUnlocked
                    ? `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${p.color} 100%)`
                    : 'rgba(38, 30, 54, 0.92)',
                  color: isUnlocked ? '#231815' : '#D1C4E9',
                  boxShadow: isSelected
                    ? `0 0 0 5px ${p.color}, 0 8px 20px rgba(0,0,0,0.45)`
                    : isUnlocked
                      ? `0 0 16px ${p.color}88`
                      : '0 4px 10px rgba(0,0,0,0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  cursor: 'pointer',
                  transform: isSelected ? 'scale(1.16)' : 'scale(1)',
                  transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{p.node.icon}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    marginTop: 2,
                    maxWidth: 62,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: isUnlocked ? '#231815' : '#EDE7F6',
                  }}
                >
                  {p.node.name.split(' ')[0]}
                </span>
                {isEquipped && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -4,
                      padding: '1px 5px',
                      borderRadius: 999,
                      background: '#FF5252',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    장착
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. 하단 고정 선택 노드 상세 & 해금/장착 액션 바 (페이지 스크롤 없음) */}
      <div
        className="card tight"
        style={{
          flexShrink: 0,
          background: '#FFFDF9',
          border: `2px solid ${selectedPositioned.color}`,
          padding: '10px 12px',
          gap: 6,
        }}
      >
        <div className="row between" style={{ gap: 8 }}>
          <div className="row" style={{ gap: 8, minWidth: 0 }}>
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: `${selectedPositioned.color}22`,
                border: `1.5px solid ${selectedPositioned.color}`,
                display: 'grid',
                placeItems: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {selNode.icon}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 6 }}>
                <strong style={{ fontSize: 15, color: '#3B2F2F' }}>{selNode.name}</strong>
                <span className="chip" style={{ fontSize: 12, padding: '2px 7px' }}>
                  {selectedPositioned.branchName}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: 6,
                    background: selNode.tier === 3 ? '#FFD700' : selNode.tier === 2 ? '#BA68C8' : '#81C784',
                    color: selNode.tier === 3 ? '#3E2723' : '#FFFFFF',
                  }}
                >
                  {selNode.tier === 3 ? '👑 궁극기' : selNode.tier === 2 ? '⚡ Tier 2' : 'Tier 1'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#D85A3A', fontWeight: 700 }}>
                🔊 {selNode.onomatopoeia}
              </div>
            </div>
          </div>

          <button
            className="chip"
            onClick={() => playDessertAsmr(selNode.asmr)}
            style={{ cursor: 'pointer', flexShrink: 0, fontWeight: 800, background: '#FFF2EC', color: '#D85A3A' }}
          >
            🎧 소리듣기
          </button>
        </div>

        <div className="row between" style={{ gap: 8 }}>
          <p style={{ fontSize: 13, color: '#5D4037', fontWeight: 600, flex: 1 }}>
            {selNode.effectText}
          </p>

          {!isSelUnlocked ? (
            <button
              className="btn"
              onClick={() => handleUnlock(selNode)}
              style={{ padding: '9px 14px', fontSize: 13, flexShrink: 0 }}
            >
              🔓 SP {selNode.spCost} 해금
            </button>
          ) : selNode.kind === 'active' ? (
            <button
              className={isSelEquipped ? 'btn' : 'btn mint'}
              onClick={() => handleToggleEquip(selNode)}
              style={{ padding: '9px 14px', fontSize: 13, flexShrink: 0 }}
            >
              {isSelEquipped ? '장착 해제' : '⚔️ 슬롯 장착'}
            </button>
          ) : (
            <span className="chip mint" style={{ fontWeight: 900, flexShrink: 0 }}>
              ✨ 패시브 적용중
            </span>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
