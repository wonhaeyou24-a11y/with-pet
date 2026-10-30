// M3 화면 1: 🌈 방사형(Radial) 식감 스킬 트리 & 전 스킬 영구 누적 강화 시스템
// - 장착 방식이 아닌, 스킬 레벨(Lv.1 ~ Lv.Max)을 올리면 즉시 펫의 능력치와 대전 액티브에 영구 누적 적용됩니다.
// - 여러 스킬을 골고루 올릴수록 펫이 다채롭게 강화되며, 방사형 캔버스를 시원하게 확장하여 펫의 공간을 극대화했습니다.

import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import {
  BRANCH_STAT_LABEL,
  computeSkillStatBonus,
  getSkillLevels,
  getSkillLockReason,
  getSkillMaxLevel,
  getSkillPowerMult,
  getSkillUpgradeCost,
} from '../config/skillLevels'
import {
  ALL_SKILL_NODES,
  BATTLE_STANCES,
  SKILL_BRANCHES,
  type BattleStanceId,
  type SkillBranchId,
  type SkillNodeDef,
} from '../config/skills'
import { SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { callBattle } from '../lib/battleApi'
import { IS_DEV_MOCK } from '../lib/devMode'
import { playDessertAsmr } from '../lib/sound'
import { supabase } from '../lib/supabase'
import MonsterView from '../monsters/MonsterView'
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
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>(() => getSkillLevels(monster))
  const [stance, setStance] = useState<BattleStanceId>(() => monster.battle_stance ?? 'balanced')
  // 개발용 로컬 모드에서만 SP를 최소 3으로 보여 준다. 실제 서비스는 서버의 SP 그대로.
  const [sp, setSp] = useState<number>(() => (IS_DEV_MOCK ? Math.max(monster.sp ?? 3, 3) : (monster.sp ?? 0)))
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string>(ALL_SKILL_NODES[0].id)
  const [toast, setToast] = useState<string | null>(null)
  const [showBonusModal, setShowBonusModal] = useState<boolean>(false)

  // 방사형 캔버스 줌(확대/축소) & 패닝(이동) 상태
  const [zoom, setZoom] = useState<number>(0.82)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  // 드래그·핀치 중의 실시간 값 (React 상태는 손을 뗄 때만 갱신해서 노드 30여 개를 매번 다시 그리지 않는다)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const liveRef = useRef<{ x: number; y: number; zoom: number }>({ x: 0, y: 0, zoom: 0.82 })
  const rafRef = useRef<number | null>(null)
  const wheelTimerRef = useRef<number | null>(null)
  const dragRef = useRef<{
    active: boolean
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false })

  // 멀티터치 핀치 줌 추적용
  const pinchedRef = useRef(false)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchDistRef = useRef<number | null>(null)

  const look = monsterLook(monster)
  const activeSpecies = look.mallang?.morphForm ?? monster.species
  const speciesInfo = SPECIES_INFO[activeSpecies] ?? SPECIES_INFO[monster.species]

  // 누적 적용 스탯 보너스 계산
  const currentBonus = useMemo(() => computeSkillStatBonus(skillLevels), [skillLevels])
  const activeLearnedCount = useMemo(
    () => ALL_SKILL_NODES.filter((s) => (skillLevels[s.id] ?? 0) > 0).length,
    [skillLevels],
  )

  // 6개 가지 360도 방사형 노드 좌표 계산
  const radialNodes = useMemo<PositionedNode[]>(() => {
    const list: PositionedNode[] = []
    const nodeCoordMap = new Map<string, { x: number; y: number }>()

    SKILL_BRANCHES.forEach((b, bIdx) => {
      const baseAngleDeg = bIdx * 60 - 90
      const baseAngleRad = (baseAngleDeg * Math.PI) / 180
      const branchSkills = ALL_SKILL_NODES.filter((s) => s.branch === b.id)

      const coreX = CENTER + Math.cos(baseAngleRad) * 62
      const coreY = CENTER + Math.sin(baseAngleRad) * 62

      branchSkills.forEach((node, sIdx) => {
        let radius = 145
        let angleOffsetDeg = 0
        if (node.tier === 1) {
          radius = 135 + sIdx * 58
          angleOffsetDeg = sIdx === 0 ? 0 : sIdx % 2 === 1 ? -13 : 13
        } else if (node.tier === 2) {
          radius = 295
          angleOffsetDeg = 0
        } else if (node.tier === 3) {
          radius = 395
          angleOffsetDeg = 0
        }

        const rad = ((baseAngleDeg + angleOffsetDeg) * Math.PI) / 180
        const x = Math.round(CENTER + Math.cos(rad) * radius)
        const y = Math.round(CENTER + Math.sin(rad) * radius)

        nodeCoordMap.set(node.id, { x, y })

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

  // 상태가 바뀌면(스킬 눌러 이동, 중앙 펫 눌러 초기화 등) 실시간 값도 맞춰 둔다
  useEffect(() => {
    liveRef.current = { x: pan.x, y: pan.y, zoom }
  }, [pan, zoom])

  function scheduleApplyView() {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const el = canvasRef.current
      if (!el) return
      const v = liveRef.current
      el.style.transition = 'none'
      el.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.zoom})`
    })
  }

  // 제스처가 끝나면 마지막 값을 React 상태로 확정한다
  function commitView() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const el = canvasRef.current
    const v = liveRef.current
    if (el) {
      el.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      el.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.zoom})`
    }
    setPan({ x: v.x, y: v.y })
    setZoom(v.zoom)
  }

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function persistChanges(nextLevels: Record<string, number>, nextSp: number, nextStance: BattleStanceId) {
    const updated: MonsterRow = {
      ...monster,
      skill_levels: nextLevels,
      sp: nextSp,
      battle_stance: nextStance,
    }
    onUpdateMonster(updated)
    try {
      await supabase
        .from('monsters')
        .update({
          skill_levels: nextLevels,
          sp: nextSp,
          battle_stance: nextStance,
        })
        .eq('id', monster.id)
    } catch {
      // 로컬/오프라인 세이프가드
    }
  }

  function focusNode(p: PositionedNode) {
    setSelectedId(p.node.id)
    playDessertAsmr(p.node.asmr)
    const targetZoom = Math.max(zoom, 1.0)
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

  // 스킬 레벨업 처리 (장착이 아닌 즉시 영구 누적 적용)
  function handleUpgradeSkill(node: SkillNodeDef) {
    const curLv = skillLevels[node.id] ?? 0
    const maxLv = getSkillMaxLevel(node)
    if (curLv >= maxLv) {
      showToastMsg(`👑 [${node.name}]은(는) 이미 최고 레벨(MAX)입니다!`)
      return
    }

    const lockReason = getSkillLockReason(node, skillLevels, monster.level ?? 1)
    if (lockReason) {
      showToastMsg(`🔒 ${lockReason}`)
      return
    }

    const cost = getSkillUpgradeCost(node, curLv)
    if (sp < cost) {
      showToastMsg(`⭐ SP가 부족해요! (필요: ${cost} SP) 파티세리 훈련으로 SP를 획득하세요.`)
      return
    }

    const nextLv = curLv + 1
    const nextLevels = { ...skillLevels, [node.id]: nextLv }
    const nextSp = sp - cost
    const statLabel = BRANCH_STAT_LABEL[node.branch]

    // 실제 서비스: SP 차감과 레벨은 서버가 정하고 저장한다. 응답을 받으면 서버 값으로 화면을 맞춘다.
    if (!IS_DEV_MOCK) {
      if (saving) return
      setSaving(true)
      playDessertAsmr(node.asmr, 2)
      void callBattle('skill_upgrade', { monsterId: monster.id, skillId: node.id }).then((res) => {
        setSaving(false)
        if (!res.ok || !res.monster) {
          showToastMsg(res.message ?? '잠시 후 다시 시도해 주세요.')
          return
        }
        setSkillLevels(getSkillLevels(res.monster))
        setSp(res.monster.sp ?? 0)
        onUpdateMonster(res.monster)
        showToastMsg(
          curLv === 0
            ? `✨ [${node.name}] 스킬 습득 완료! (${statLabel} 영구 강화 적용)`
            : `🔥 [${node.name}] Lv.${nextLv} 레벨업! (${statLabel} 및 위력 대폭 강화)`,
        )
      })
      return
    }

    playDessertAsmr(node.asmr, 2)
    setSkillLevels(nextLevels)
    setSp(nextSp)
    void persistChanges(nextLevels, nextSp, stance)

    showToastMsg(
      curLv === 0
        ? `✨ [${node.name}] 스킬 습득 완료! (${statLabel} 영구 강화 적용)`
        : `🔥 [${node.name}] Lv.${nextLv} 레벨업! (${statLabel} 및 위력 대폭 강화)`,
    )
  }

  // 전투 성향 순환
  function handleCycleStance() {
    const idx = BATTLE_STANCES.findIndex((s) => s.id === stance)
    const next = BATTLE_STANCES[(idx + 1) % BATTLE_STANCES.length]
    playDessertAsmr('syrup-drizzle')
    if (!IS_DEV_MOCK) {
      if (saving) return
      setSaving(true)
      void callBattle('set_stance', { monsterId: monster.id, stance: next.id }).then((res) => {
        setSaving(false)
        if (!res.ok || !res.monster) {
          showToastMsg(res.message ?? '잠시 후 다시 시도해 주세요.')
          return
        }
        setStance(next.id)
        onUpdateMonster(res.monster)
        showToastMsg(`${next.icon} 대전 성향: ${next.name}`)
      })
      return
    }
    setStance(next.id)
    void persistChanges(skillLevels, sp, next.id)
    showToastMsg(`${next.icon} 대전 성향: ${next.name}`)
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
      originX: liveRef.current.x,
      originY: liveRef.current.y,
      moved: false,
    }
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      if (pinchDistRef.current && pinchDistRef.current > 10) {
        const ratio = dist / pinchDistRef.current
        liveRef.current.zoom = Math.max(0.55, Math.min(1.85, Number((liveRef.current.zoom * ratio).toFixed(3))))
        pinchedRef.current = true
        scheduleApplyView()
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
    liveRef.current.x = Math.max(-340, Math.min(340, dragRef.current.originX + dx))
    liveRef.current.y = Math.max(-340, Math.min(340, dragRef.current.originY + dy))
    scheduleApplyView()
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) {
      pinchDistRef.current = null
    }
    const changed = (dragRef.current.active && dragRef.current.moved) || pinchedRef.current
    dragRef.current.active = false
    if (pointersRef.current.size === 0) pinchedRef.current = false
    if (changed) commitView()
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    const delta = e.deltaY < 0 ? 0.12 : -0.12
    liveRef.current.zoom = Math.max(0.55, Math.min(1.85, Number((liveRef.current.zoom + delta).toFixed(3))))
    scheduleApplyView()
    if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current)
    wheelTimerRef.current = window.setTimeout(commitView, 140)
  }

  const selNode = selectedPositioned.node
  const selLevel = skillLevels[selNode.id] ?? 0
  const selMaxLevel = getSkillMaxLevel(selNode)
  const isMaxLevel = selLevel >= selMaxLevel
  const upgradeCost = getSkillUpgradeCost(selNode, selLevel)
  const lockReason = getSkillLockReason(selNode, skillLevels, monster.level ?? 1)
  const currentStanceObj = BATTLE_STANCES.find((s) => s.id === stance) ?? BATTLE_STANCES[0]

  return (
    <main
      className="screen"
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
        gap: 6,
        justifyContent: 'space-between',
        position: 'relative',
        background: '#130C1E',
      }}
    >
      {/* 1. 상단 미니멀 헤더 바 (임팩트 있는 아이콘 & 공간 절약) */}
      <div className="row between" style={{ flexShrink: 0, zIndex: 30, alignItems: 'center' }}>
        <div className="row" style={{ gap: 6, alignItems: 'center' }}>
          <button className="btn-round" onClick={onBack} aria-label="뒤로" style={{ background: '#25173B', color: '#FFF' }}>
            <BackIcon />
          </button>
          <div>
            <h1 className="title" style={{ fontSize: 16, color: '#FFF', margin: 0 }}>
              🌈 식감 스킬트리
            </h1>
            <div style={{ fontSize: 10, color: '#CE93D8' }}>
              배운 스킬 {activeLearnedCount}개 펫에 영구 강화 중 ✨
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 6 }}>
          {/* 누적 보너스 요약 팝업 버튼 */}
          <button
            onClick={() => setShowBonusModal(true)}
            style={{
              padding: '4px 8px',
              borderRadius: 10,
              border: '1px solid #AB47BC',
              background: '#311B92',
              color: '#F3E5F5',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            📊 능력치 보너스
          </button>

          {/* SP 표시 & 테스트 보너스 충전 */}
          <button
            className="chip honey"
            onClick={() => {
              playDessertAsmr('syrup-drizzle')
              setSp((s) => s + 1)
              showToastMsg('🎁 연구 보너스로 SP +1을 획득했어요!')
            }}
            style={{ cursor: 'pointer', fontWeight: 900, fontSize: 11, padding: '4px 8px' }}
            title="누르면 SP +1 충전"
          >
            ⭐ {sp} SP
          </button>
        </div>
      </div>

      {/* 2. 대전 성향 슬림 칩 & 6대 계열 미니 원터치 탭 (공간 낭비 없이 1줄로 통합) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          background: 'rgba(37, 23, 59, 0.85)',
          padding: '4px 8px',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
          zIndex: 25,
        }}
      >
        <button
          onClick={handleCycleStance}
          style={{
            padding: '2px 8px',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(90deg, #EC4899, #8B5CF6)',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          title="클릭하여 대전 성향 변경"
        >
          {currentStanceObj.icon} {currentStanceObj.name.split(' ')[0]}
        </button>

        {/* 6대 계열 미니 도트 바로가기 버튼 */}
        <div style={{ display: 'flex', gap: 4 }}>
          {SKILL_BRANCHES.map((b) => (
            <button
              key={b.id}
              onClick={() => focusBranch(b.id)}
              style={{
                width: 26,
                height: 26,
                padding: 0,
                borderRadius: '50%',
                border: `1.5px solid ${b.color}`,
                background: 'rgba(25, 18, 36, 0.9)',
                fontSize: 12,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
              title={b.name}
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 360도 방사형 스킬트리 캔버스 (화면 전체 확장 & 시원한 펫 코어) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 50%, #201335 0%, #0D0716 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          touchAction: 'none',
          cursor: dragRef.current.active ? 'grabbing' : 'grab',
        }}
      >
        {/* 960x960 방사형 월드 컨테이너 */}
        <div
          ref={canvasRef}
          style={{
            willChange: 'transform',
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
          {/* 가이드 동심원 및 연결선 */}
          <svg
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {[145, 245, 345, 440].map((r, i) => (
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

            {SKILL_BRANCHES.map((b, idx) => {
              const rad = ((idx * 60 - 90) * Math.PI) / 180
              const x2 = CENTER + Math.cos(rad) * 450
              const y2 = CENTER + Math.sin(rad) * 450
              return (
                <line
                  key={b.id}
                  x1={CENTER}
                  y1={CENTER}
                  x2={x2}
                  y2={y2}
                  stroke={b.color}
                  strokeOpacity={0.25}
                  strokeWidth={2}
                />
              )
            })}

            {radialNodes.map((p) => {
              const lv = skillLevels[p.node.id] ?? 0
              const isLearned = lv > 0
              return (
                <line
                  key={`edge-${p.node.id}`}
                  x1={p.parentX}
                  y1={p.parentY}
                  x2={p.x}
                  y2={p.y}
                  stroke={isLearned ? p.color : 'rgba(255,255,255,0.2)'}
                  strokeWidth={isLearned ? 4.5 : 2}
                  strokeDasharray={isLearned ? undefined : '5 4'}
                  strokeLinecap="round"
                />
              )
            })}
          </svg>

          {/* 중앙 코어 허브: 내 실제 3D 디저트 몬스터 (디자인 일치 & 공간 대폭 확장) */}
          <div
            onClick={() => {
              setPan({ x: 0, y: 0 })
              setZoom(0.85)
              playDessertAsmr('mochi-squish')
            }}
            style={{
              position: 'absolute',
              left: CENTER - 65,
              top: CENTER - 65,
              width: 130,
              height: 130,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #FFF8EA 0%, #FFE0B2 100%)',
              border: '4px solid #FFB74D',
              boxShadow: '0 0 32px rgba(255, 183, 77, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              zIndex: 10,
              padding: 4,
            }}
          >
            <div style={{ position: 'relative', width: 78, height: 78 }}>
              <MonsterView look={look} size={78} prefer2D={false} title={monster.name ?? undefined} />
            </div>
            <strong style={{ fontSize: 12, color: '#3E2723', marginTop: 1, whiteSpace: 'nowrap' }}>
              {monster.name ?? speciesInfo?.name ?? '디저트'}
            </strong>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#D84315' }}>
              ✨ {activeLearnedCount}개 스킬 누적
            </span>
          </div>

          {/* 방사형 스킬 노드들 */}
          {radialNodes.map((p) => {
            const lv = skillLevels[p.node.id] ?? 0
            const maxLv = getSkillMaxLevel(p.node)
            const isLearned = lv > 0
            const isMax = lv >= maxLv
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
                  left: p.x - 34,
                  top: p.y - 34,
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  border: isSelected
                    ? '3px solid #FFFFFF'
                    : isLearned
                      ? `3px solid ${p.color}`
                      : '2px dashed rgba(255,255,255,0.3)',
                  background: isLearned
                    ? `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${p.color} 100%)`
                    : 'rgba(38, 30, 54, 0.92)',
                  color: isLearned ? '#231815' : '#D1C4E9',
                  boxShadow: isSelected
                    ? `0 0 0 4px ${p.color}, 0 8px 20px rgba(0,0,0,0.5)`
                    : isLearned
                      ? `0 0 14px ${p.color}88`
                      : '0 4px 10px rgba(0,0,0,0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2,
                  cursor: 'pointer',
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.16s ease',
                  zIndex: isSelected ? 12 : 5,
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{p.node.icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    marginTop: 1,
                    maxWidth: 60,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: isLearned ? '#231815' : '#EDE7F6',
                  }}
                >
                  {p.node.name.split(' ')[0]}
                </span>

                {/* 스킬 레벨 뱃지 (Lv.X 또는 MAX) */}
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -4,
                    padding: '1px 5px',
                    borderRadius: 999,
                    background: isMax ? '#FFD700' : isLearned ? '#10B981' : '#6B7280',
                    color: isMax ? '#3E2723' : '#FFFFFF',
                    fontSize: 9,
                    fontWeight: 900,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.8)',
                  }}
                >
                  {isMax ? 'MAX' : isLearned ? `Lv.${lv}` : '🔒'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. 하단 선택 스킬 간소화 플로팅 카드 (장착 슬롯 제거 -> 즉시 레벨업 적용) */}
      <div
        className="card tight"
        style={{
          flexShrink: 0,
          background: '#FFFDF9',
          border: `2px solid ${selectedPositioned.color}`,
          padding: '8px 12px',
          gap: 5,
          zIndex: 30,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.25)',
        }}
      >
        <div className="row between" style={{ alignItems: 'center', gap: 8 }}>
          <div className="row" style={{ gap: 8, minWidth: 0, flex: 1, alignItems: 'center' }}>
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: selectedPositioned.color,
                display: 'grid',
                placeItems: 'center',
                fontSize: 20,
                color: '#FFF',
                flexShrink: 0,
                boxShadow: `0 3px 8px ${selectedPositioned.color}66`,
              }}
            >
              {selNode.icon}
            </span>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="row" style={{ gap: 4, alignItems: 'center' }}>
                <strong style={{ fontSize: 13, color: '#3E2723', whiteSpace: 'nowrap' }}>
                  {selNode.name}
                </strong>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: 6,
                    background: isMaxLevel ? '#FFD700' : selLevel > 0 ? '#DCFCE7' : '#F3F4F6',
                    color: isMaxLevel ? '#3E2723' : selLevel > 0 ? '#15803D' : '#6B7280',
                  }}
                >
                  {isMaxLevel ? 'Lv.MAX' : selLevel > 0 ? `Lv.${selLevel}/${selMaxLevel}` : '미습득'}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#795548', marginTop: 1 }}>
                계열: <strong>{selectedPositioned.branchName}</strong> (+{BRANCH_STAT_LABEL[selNode.branch]} 영구 강화)
              </div>
            </div>
          </div>

          {/* 레벨업 원터치 버튼 */}
          {isMaxLevel ? (
            <span
              style={{
                padding: '8px 12px',
                borderRadius: 12,
                background: 'linear-gradient(90deg, #F59E0B, #D97706)',
                color: '#FFF',
                fontWeight: 900,
                fontSize: 12,
                boxShadow: '0 2px 6px rgba(245,158,11,0.3)',
              }}
            >
              👑 최고 레벨
            </span>
          ) : (
            <button
              className="btn"
              onClick={() => handleUpgradeSkill(selNode)}
              style={{
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 900,
                background: lockReason ? '#9E9E9E' : 'linear-gradient(90deg, #10B981, #059669)',
                boxShadow: lockReason ? 'none' : '0 3px 8px rgba(16,185,129,0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              {selLevel === 0 ? `✨ 습득 (⭐ ${upgradeCost})` : `🔥 Lv.${selLevel + 1} 강화 (⭐ ${upgradeCost})`}
            </button>
          )}
        </div>

        {/* 효과 설명 한 줄 (콤팩트) */}
        <div className="row between" style={{ alignItems: 'center', gap: 6, fontSize: 11, color: '#5D4037', marginTop: 1 }}>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selNode.effectText}
            {selLevel > 1 && ` (현재 위력 ×${getSkillPowerMult(selLevel).toFixed(2)})`}
          </span>
          <button
            onClick={() => playDessertAsmr(selNode.asmr)}
            style={{
              padding: '1px 6px',
              borderRadius: 6,
              border: '1px solid #FFAB91',
              background: '#FFF',
              color: '#D84315',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            🔊 사운드
          </button>
        </div>
      </div>

      {/* 5. 펫에 적용된 영구 스킬 능력치 보너스 모달 */}
      {showBonusModal && (
        <div
          onClick={() => setShowBonusModal(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#FFFDF9',
              borderRadius: 20,
              border: '2px solid #BA68C8',
              padding: '16px 14px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#4A148C', margin: 0 }}>
              📊 스킬 레벨 펫 영구 적용치
            </h3>
            <div style={{ fontSize: 11, color: '#6A1B9A' }}>
              스킬을 배울 때마다 펫에게 영구적으로 보너스 능력치가 합산됩니다!
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                background: '#F3E5F5',
                padding: '10px 8px',
                borderRadius: 14,
                marginTop: 4,
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: '#6A1B9A' }}>체력(HP)</div>
                <strong style={{ fontSize: 13, color: '#D81B60' }}>+{currentBonus.hp}</strong>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6A1B9A' }}>공격(ATK)</div>
                <strong style={{ fontSize: 13, color: '#E65100' }}>+{currentBonus.atk}</strong>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6A1B9A' }}>방어(DEF)</div>
                <strong style={{ fontSize: 13, color: '#F57F17' }}>+{currentBonus.def}</strong>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6A1B9A' }}>속도(SPD)</div>
                <strong style={{ fontSize: 13, color: '#2E7D32' }}>+{currentBonus.spd}</strong>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6A1B9A' }}>지능(INT)</div>
                <strong style={{ fontSize: 13, color: '#1565C0' }}>+{currentBonus.int}</strong>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6A1B9A' }}>매력(CHA)</div>
                <strong style={{ fontSize: 13, color: '#8E24AA' }}>+{currentBonus.cha}</strong>
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#795548', lineHeight: 1.35, marginTop: 4 }}>
              💡 다양한 스킬의 레벨을 골고루 올릴수록 펫이 모든 능력치에서 강력해집니다.
            </div>

            <button
              onClick={() => setShowBonusModal(false)}
              style={{
                padding: '9px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(90deg, #9C27B0, #7B1FA2)',
                color: '#FFF',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              확인 닫기
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
