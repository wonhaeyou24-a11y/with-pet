// M3 화면 2: ⚔️🎧 리얼 액션 턴제 식감 ASMR 대전 아레나 (원스크린 100dvh 레이아웃)
// - 상태바를 상단 헤더 뒤쪽으로 슬림하게 배치하여 3D 몬스터 모션 공간을 극대화했습니다.
// - 글 설명 대신 펫 주변에 플로팅 대미지/힐/치명타/회피 텍스트가 솟아오르며 스르륵 사라지는 직관적 RPG 방식을 적용했습니다.
// - 하단 공간을 심플하고 직관적인 컨트롤 위주로 정돈하여 화면 밖 잘림을 100% 방지했습니다.

import { useEffect, useMemo, useState } from 'react'
import { addRibbonCoins } from '../config/boutique'
import { recordMissionAction } from '../config/missions'
import { SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { simulateAsmrBattle, type BattleSimulationResult } from '../lib/battleEngine'
import { playDessertAsmr } from '../lib/sound'
import BattleFighter, { type Pose } from '../ui/BattleFighter'
import BattleFx from '../ui/BattleFx'
import MonsterView from '../monsters/MonsterView'
import { BackIcon, ElementIcon } from '../ui/Icons'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'

interface Props {
  challenger: MonsterRow
  defender: MonsterRow
  defenderOwnerName: string
  initialSeed?: number
  // 실제 서비스: 서버가 정한 결과(시드·턴 기록)를 그대로 재생한다
  precomputed?: BattleSimulationResult
  onRematch?: () => void
  onRewardClaimed?: (coinsEarned: number) => void
  onBack: () => void
}

export default function AsmrBattleArena({
  challenger,
  defender,
  defenderOwnerName,
  initialSeed,
  precomputed,
  onRematch,
  onRewardClaimed,
  onBack,
}: Props) {
  const [seed, setSeed] = useState<number>(() => initialSeed ?? Math.floor(100000 + Math.random() * 899999))
  const [stepIdx, setStepIdx] = useState<number>(0)
  const [playing, setPlaying] = useState<boolean>(true)
  const [rewarded, setRewarded] = useState<boolean>(false)

  // 관전 중 실시간 터치 응원 손맛 상태
  const [cheerCount, setCheerCount] = useState<number>(0)
  const [cheerToast, setCheerToast] = useState<string | null>(null)
  const [actionPhase, setActionPhase] = useState<'idle' | 'windup' | 'strike' | 'reaction'>('idle')
  // 🔥 필살기 컷인 배너 상태 (슬로우 모션 & 극적 연출)
  const [cutin, setCutin] = useState<{
    actor: 'challenger' | 'defender'
    title: string
    name: string
    icon: string
    quote: string
  } | null>(null)

  // 🎬 대전 명장면 리플레이 짤 모달 탭 상태
  const [showHighlightModal, setShowHighlightModal] = useState<boolean>(false)
  const [copiedClipToast, setCopiedClipToast] = useState<boolean>(false)

  const sim = useMemo(() => precomputed ?? simulateAsmrBattle(challenger, defender, seed), [precomputed, challenger, defender, seed])
  const currentTurn = stepIdx > 0 ? sim.turns[stepIdx - 1] : null
  const isFinished = stepIdx >= sim.turns.length

  // 대전 중 가장 극적이었던 하이라이트 턴 산출 (최대 대미지 또는 치명타 씬)
  const bestHighlight = useMemo(() => {
    if (!sim.turns || sim.turns.length === 0) return null
    let maxDmgTurn = sim.turns[0]
    for (const t of sim.turns) {
      if (t.damage > maxDmgTurn.damage || (t.isCrit && !maxDmgTurn.isCrit)) {
        maxDmgTurn = t
      }
    }
    return maxDmgTurn
  }, [sim.turns])

  const cLook = monsterLook(challenger)
  const dLook = monsterLook(defender)
  const cInfo = SPECIES_INFO[cLook.mallang?.morphForm ?? challenger.species] ?? SPECIES_INFO[challenger.species]
  const dInfo = SPECIES_INFO[dLook.mallang?.morphForm ?? defender.species] ?? SPECIES_INFO[defender.species]

  const cHp = currentTurn ? currentTurn.challengerHp : sim.challengerMaxHp
  const dHp = currentTurn ? currentTurn.defenderHp : sim.defenderMaxHp
  const cPct = Math.max(0, Math.min(100, Math.round((cHp / sim.challengerMaxHp) * 100)))
  const dPct = Math.max(0, Math.min(100, Math.round((dHp / sim.defenderMaxHp) * 100)))

  // 자동 턴제 공방 루프 (마운트 즉시 0.4초 후 자동 시작)
  useEffect(() => {
    if (!playing || isFinished) return

    const nextTurn = sim.turns[stepIdx]
    const isSpecialTurn = nextTurn && (nextTurn.isCrit || nextTurn.damage >= 24)
    const turnInterval = isSpecialTurn ? 1650 : 1200 // 필살기일 때 슬로우 모션 연출

    // 0단계: 필살기/치명타 컷인 배너 트리거 (스페셜 턴인 경우)
    let tCutin: any = null
    if (isSpecialTurn) {
      const isChallenger = nextTurn.actor === 'challenger'
      const actorName = isChallenger ? challenger.name || cInfo?.name || '두바이쫀득이' : defender.name || dInfo?.name || '카다이프킹'
      setCutin({
        actor: nextTurn.actor,
        title: nextTurn.isCrit ? `🔥 [${actorName} 필살기 발동]` : `⚡ [${actorName} 극의 식감 스킬]`,
        name: nextTurn.skillName || '골든 카다이프 버스트!!',
        icon: nextTurn.skillIcon || '💥',
        quote: isChallenger
          ? `바사삭 부서지는 황금빛 크런치로 결정타를 날려요!`
          : `상대 파티시에의 달콤한 식감 반격이 시작돼요!`,
      })
      tCutin = setTimeout(() => {
        setCutin(null)
      }, 750)
    }

    // 1단계: 턴 개시 및 도약/기 모으기 모션
    const t1 = setTimeout(() => {
      setActionPhase('windup')
    }, isSpecialTurn ? 350 : 50)

    // 2단계: 타격 & ASMR 사운드 폭발
    const t2 = setTimeout(() => {
      setActionPhase('strike')
      const nextStep = stepIdx + 1
      const turn = sim.turns[nextStep - 1]
      if (turn) {
        playDessertAsmr(turn.asmr, turn.hitCount ?? (turn.isCrit ? 4 : 1))
      }
    }, turnInterval * 0.42)

    // 3단계: 피격 찌그러짐 반응 & 체력 갱신
    const t3 = setTimeout(() => {
      setActionPhase('reaction')
      const nextStep = stepIdx + 1
      setStepIdx(nextStep)
      if (nextStep >= sim.turns.length && !rewarded) {
        setRewarded(true)
        const isWin = sim.winner === 'challenger'
        // 서버 결과를 보는 중이면 코인은 서버가 이미 지급했다
        if (!precomputed) onRewardClaimed?.(isWin ? 30 : 15)
        addRibbonCoins(isWin ? 30 : 10, '친선 대전 보상')
        recordMissionAction('d-battle', 1)
        if (isWin) recordMissionAction('w-battle-win', 1)
      }
    }, turnInterval * 0.75)

    // 4단계: 턴 복귀
    const t4 = setTimeout(() => {
      setActionPhase('idle')
    }, turnInterval)

    return () => {
      if (tCutin) clearTimeout(tCutin)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [playing, isFinished, stepIdx])

  // 플레이어 실시간 터치 응원 (유대감 및 손맛 피드백)
  function handleCheer() {
    setCheerCount((c) => c + 1)
    playDessertAsmr('sugar-crack', 2)
    const cheers = [
      '💖 힘내라 힘! 기세가 솟아나요!',
      '⚡ 식감 버스트 파워 업!',
      '🍓 달콤한 응원이 닿았어요!',
      '✨ 완벽한 타이밍 응원!',
    ]
    setCheerToast(cheers[cheerCount % cheers.length])
    setTimeout(() => setCheerToast(null), 1200)
  }

  function handleReplaySameSeed() {
    setStepIdx(0)
    setPlaying(true)
  }

  function handleRematchNewSeed() {
    if (precomputed && onRematch) {
      onRematch()
      return
    }
    setSeed(Math.floor(100000 + Math.random() * 899999))
    setStepIdx(0)
    setPlaying(true)
  }

  // 양측 애니메이션 계산. 준비·돌진 중에는 stepIdx 가 아직 안 올라갔으므로 "이번에 행동할 턴"을 따로 본다
  const actTurn = actionPhase === 'reaction' ? currentTurn : (sim.turns[stepIdx] ?? null)
  const isChallengerActor = actTurn?.actor === 'challenger'
  const isDefenderActor = actTurn?.actor === 'defender'
  const isCrit = actTurn?.isCrit
  const isMultiHit = (actTurn?.hitCount ?? 0) >= 2
  const dir = isChallengerActor ? 1 : -1 // 공격자가 달려가는 방향

  const REST: Pose = { transform: 'translateX(0) translateY(0) scale(1)', ms: 420, ease: 'cubic-bezier(0.2, 1.6, 0.4, 1)' }
  let cPose: Pose = REST
  let dPose: Pose = REST
  const DASH = 'cubic-bezier(0.1, 0.9, 0.2, 1)'
  const attackerPose = (): Pose => {
    if (actionPhase === 'windup') {
      return { transform: `translateX(${-22 * dir}px) translateY(6px) scale(0.88, 0.94) rotate(${-8 * dir}deg)`, ms: 240, ease: 'ease-out' }
    }
    if (isCrit) {
      return { transform: `translateY(-38px) translateX(${76 * dir}px) scale(1.4) rotate(${16 * dir}deg)`, ms: 150, ease: DASH }
    }
    if (isMultiHit) {
      return { transform: `translateX(${70 * dir}px) scale(1.26) rotate(${360 * dir}deg)`, ms: 190, ease: DASH }
    }
    return { transform: `translateX(${66 * dir}px) scale(1.22, 1.1)`, ms: 130, ease: DASH }
  }
  const victimPose = (): Pose => {
    if (actTurn?.isDodge) return { transform: `translateY(-44px) translateX(${-16 * dir}px) scale(1.12) rotate(${12 * dir}deg)`, ms: 200, ease: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)' }
    if (actTurn?.isBlock) return { transform: `translateX(${12 * dir}px) scale(0.86, 1.16)`, ms: 110, ease: 'ease-out' }
    if (isCrit) return { transform: `translateX(${52 * dir}px) translateY(-14px) scale(1.34, 0.7) rotate(${26 * dir}deg)`, ms: 100, ease: DASH }
    return { transform: `translateX(${34 * dir}px) scale(1.12, 0.86) rotate(${9 * dir}deg)`, ms: 100, ease: DASH }
  }
  if (actionPhase === 'windup' || actionPhase === 'strike') {
    if (isChallengerActor) cPose = attackerPose()
    if (isDefenderActor) dPose = attackerPose()
  } else if (actionPhase === 'reaction') {
    // 맞은 쪽만 밀려나고, 공격자는 돌진한 자리에서 잠깐 버틴다
    const holdPose: Pose = { transform: `translateX(${30 * dir}px) scale(1.1)`, ms: 160, ease: 'ease-out' }
    if (isChallengerActor) {
      cPose = holdPose
      dPose = victimPose()
    }
    if (isDefenderActor) {
      dPose = holdPose
      cPose = victimPose()
    }
  }
  const isHitMoment =
    actionPhase === 'reaction' && !!actTurn && !actTurn.isDodge && !actTurn.isBlock && (actTurn.damage ?? 0) > 0
  const fxTint = (() => {
    const cat = actTurn ? getSensoryReactionClass(actTurn.asmr ?? 'sugar-crack') : ''
    if (cat === 'mon-react-crispy') return '#FFB300'
    if (cat === 'mon-react-jiggly') return '#FFD54F'
    if (cat === 'mon-react-melty') return '#A1887F'
    return '#F48FB1'
  })()

  const cHitReaction =
    isHitMoment && isDefenderActor
      ? getSensoryReactionClass(currentTurn?.asmr ?? 'sugar-crack')
      : ''
  const dHitReaction =
    isHitMoment && isChallengerActor
      ? getSensoryReactionClass(currentTurn?.asmr ?? 'sugar-crack')
      : ''

  // 턴마다 등장하는 플로팅 전투 텍스트 데이터 산출
  const challengerFloating = useMemo(() => {
    if (!currentTurn) return null
    // 내가 피격당했을 때
    if (currentTurn.actor === 'defender') {
      if (currentTurn.isDodge) return { type: 'dodge', text: '💨 MISS!', sub: '회피 성공' }
      if (currentTurn.isBlock) return { type: 'block', text: `🛡️ GUARD! -${currentTurn.damage}`, sub: '가드 방어' }
      if (currentTurn.isCrit) return { type: 'crit', text: `💥 -${currentTurn.damage}`, sub: '치명타 (CRITICAL)!' }
      if (currentTurn.damage > 0) return { type: 'dmg', text: `-${currentTurn.damage}` }
    }
    // 내가 공격자이면서 회복/스킬 시전했을 때
    if (currentTurn.actor === 'challenger') {
      if (currentTurn.heal > 0) return { type: 'heal', text: `+${currentTurn.heal} 💖`, sub: '체력 회복' }
      if (currentTurn.shield > 0) return { type: 'shield', text: `+${currentTurn.shield} 🛡️`, sub: '보호막 생성' }
      return { type: 'skill', text: `${currentTurn.skillIcon} ${currentTurn.skillName}` }
    }
    return null
  }, [currentTurn, stepIdx])

  const defenderFloating = useMemo(() => {
    if (!currentTurn) return null
    // 상대가 피격당했을 때
    if (currentTurn.actor === 'challenger') {
      if (currentTurn.isDodge) return { type: 'dodge', text: '💨 MISS!', sub: '회피 성공' }
      if (currentTurn.isBlock) return { type: 'block', text: `🛡️ GUARD! -${currentTurn.damage}`, sub: '가드 방어' }
      if (currentTurn.isCrit) return { type: 'crit', text: `💥 -${currentTurn.damage}`, sub: '치명타 (CRITICAL)!' }
      if (currentTurn.damage > 0) return { type: 'dmg', text: `-${currentTurn.damage}` }
    }
    // 상대가 공격자이면서 회복/스킬 시전했을 때
    if (currentTurn.actor === 'defender') {
      if (currentTurn.heal > 0) return { type: 'heal', text: `+${currentTurn.heal} 💖`, sub: '체력 회복' }
      if (currentTurn.shield > 0) return { type: 'shield', text: `+${currentTurn.shield} 🛡️`, sub: '보호막 생성' }
      return { type: 'skill', text: `${currentTurn.skillIcon} ${currentTurn.skillName}` }
    }
    return null
  }, [currentTurn, stepIdx])

  return (
    <main
      className="screen"
      style={{
        padding: '8px 12px calc(8px + env(safe-area-inset-bottom, 0px))',
        gap: 6,
        background: '#FAF6EE',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <style>{`
        @keyframes floatCombatNum {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.75);
          }
          18% {
            opacity: 1;
            transform: translateY(-8px) scale(1.15);
          }
          75% {
            opacity: 0.95;
            transform: translateY(-26px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-48px) scale(0.9);
          }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes cutinBanner {
          0% {
            opacity: 0;
            transform: scale(0.85) skewX(-12deg) translateY(-20px);
          }
          20% {
            opacity: 1;
            transform: scale(1.04) skewX(-12deg) translateY(0);
          }
          80% {
            opacity: 1;
            transform: scale(1) skewX(-12deg) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(1.08) skewX(-12deg) translateY(15px);
          }
        }
        @keyframes cutinVignette {
          0% { opacity: 0; }
          25% { opacity: 0.75; }
          80% { opacity: 0.75; }
          100% { opacity: 0; }
        }
        @keyframes fxRing { 0% { transform: translate(-50%, -50%) rotateX(60deg) scale(0.2); opacity: 1; } 100% { transform: translate(-50%, -50%) rotateX(60deg) scale(1.8); opacity: 0; } }
        @keyframes fxBurst { 0% { transform: translate(-50%, -50%) scale(0.3) rotate(-20deg); opacity: 1; } 40% { transform: translate(-50%, -50%) scale(1.35) rotate(8deg); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.6) rotate(0); opacity: 0; } }
        @keyframes fxSlash { 0% { transform: rotate(var(--a)) translateX(10px); opacity: 1; } 100% { transform: rotate(var(--a)) translateX(var(--d)); opacity: 0; } }
        @keyframes fxSpeed { 0% { transform: translateX(var(--from)); opacity: 0; } 25% { opacity: 1; } 100% { transform: translateX(var(--to)); opacity: 0; } }
        @keyframes fxDust { 0% { transform: translate(0, 0) scale(0.4); opacity: 0.9; } 100% { transform: translate(var(--dx), var(--dy)) scale(1.5); opacity: 0; } }
        @keyframes fxFlash { 0% { opacity: 0.85; } 100% { opacity: 0; } }
        @keyframes fxRays { 0% { opacity: 1; transform: scale(0.7); } 100% { opacity: 0; transform: scale(1.25); } }
        @keyframes cutinBanner {
          0% { transform: scale(0.7) skewX(-4deg); opacity: 0; }
          20% { transform: scale(1.03) skewX(-4deg); opacity: 1; }
          80% { transform: scale(1) skewX(-4deg); opacity: 1; }
          100% { transform: scale(1.08) skewX(-4deg); opacity: 0; }
        }
        @keyframes stageShake { 0%,100% { transform: translate(0,0); } 15% { transform: translate(-7px, 4px); } 30% { transform: translate(6px, -5px); } 45% { transform: translate(-5px, -3px); } 60% { transform: translate(4px, 3px); } 80% { transform: translate(-2px, 1px); } }
        @keyframes stageShakeSoft { 0%,100% { transform: translate(0,0); } 25% { transform: translate(-3px, 2px); } 50% { transform: translate(3px, -2px); } 75% { transform: translate(-1px, 1px); } }
        @media (prefers-reduced-motion: reduce) { .battle-stage { animation: none !important; } }
        @keyframes screenShake {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-4px, 3px); }
          40% { transform: translate(4px, -3px); }
          60% { transform: translate(-3px, -2px); }
          80% { transform: translate(2px, 3px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>

      {/* 상단 헤더 */}
      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로" style={{ width: 34, height: 34 }}>
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 15, margin: 0 }}>⚔️ 실시간 턴제 식감 대전</h1>
        <span className="chip" style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px' }}>
          #{seed}
        </span>
      </div>

      {/* 🛡️ 상단 뒤쪽 배치: 슬림 통합 대전 상태바 (HUD) */}
      <div
        style={{
          width: '100%',
          background: '#FFFDF9',
          borderRadius: 14,
          border: '1.5px solid #F0DFB8',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          flexShrink: 0,
        }}
      >
        {/* 왼쪽: 내 펫 정보 & 체력 게이지 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="row between" style={{ fontSize: 11, fontWeight: 900 }}>
            <span style={{ color: '#3B2F2F', display: 'flex', alignItems: 'center', gap: 3, maxWidth: 95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <ElementIcon element={challenger.element} size={12} />
              {challenger.name || cInfo?.name}
            </span>
            <span style={{ color: '#D84315', fontSize: 10 }}>나 · Lv.{challenger.level}</span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
            <div
              style={{
                width: `${cPct}%`,
                height: '100%',
                borderRadius: 999,
                background: cPct > 30 ? 'linear-gradient(90deg, #66BB6A, #43A047)' : '#E53935',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#7A6A60', textAlign: 'right' }}>
            {cHp}/{sim.challengerMaxHp}
          </div>
        </div>

        {/* 중앙: VS 엠블럼 */}
        <div
          style={{
            padding: '3px 7px',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #FF7043, #D84315)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: '0.5px',
            boxShadow: '0 2px 5px rgba(216,67,21,0.25)',
            flexShrink: 0,
          }}
        >
          VS
        </div>

        {/* 오른쪽: 상대 펫 정보 & 체력 게이지 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="row between" style={{ fontSize: 11, fontWeight: 900 }}>
            <span style={{ color: '#E65100', fontSize: 10 }}>Lv.{defender.level} · {defenderOwnerName}</span>
            <span style={{ color: '#3B2F2F', display: 'flex', alignItems: 'center', gap: 3, maxWidth: 85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {defender.name || dInfo?.name}
              <ElementIcon element={defender.element} size={12} />
            </span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
            <div
              style={{
                width: `${dPct}%`,
                height: '100%',
                borderRadius: 999,
                background: dPct > 30 ? 'linear-gradient(90deg, #FFA726, #FB8C00)' : '#E53935',
                transition: 'width 0.3s ease',
                marginLeft: 'auto',
              }}
            />
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#7A6A60', textAlign: 'left' }}>
            {dHp}/{sim.defenderMaxHp}
          </div>
        </div>
      </div>

      {/* 🎮 3D 캐릭터 실시간 전투 액션 대치 스테이지 (글 상자 없이 펫 공간 극대화) */}
      <div
        className="card battle-stage"
        style={{
          animation: isHitMoment ? (isCrit ? 'stageShake 0.42s ease-out' : 'stageShakeSoft 0.26s ease-out') : undefined,
          background: 'radial-gradient(ellipse at 50% 60%, #FFF9EC 0%, #FFF3E0 60%, #FFE0B2 100%)',
          padding: '8px 10px',
          position: 'relative',
          overflow: 'hidden',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          border: '1.5px solid #FFE082',
          borderRadius: 16,
        }}
      >
        <BattleFx
          stepKey={stepIdx}
          phase={actionPhase}
          actor={actTurn?.actor}
          isCrit={!!isCrit}
          isDodge={!!actTurn?.isDodge}
          isBlock={!!actTurn?.isBlock}
          damage={actTurn?.damage ?? 0}
          multiHit={isMultiHit}
          tint={fxTint}
        />

        {/* 🔥 필살기 / 치명타 극적 컷인 배너 연출 (대각선 번쩍임 & 슬로우 모션) */}
        {cutin && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 35,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* 배경 암전 비네트 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.85) 100%)',
                animation: 'cutinVignette 0.75s ease forwards',
              }}
            />
            {/* 번쩍이는 대각선 슬라이드 배너 (화면 밖 짤림 방지 및 중앙 정렬) */}
            <div
              style={{
                position: 'relative',
                zIndex: 40,
                width: '92%',
                maxWidth: 420,
                boxSizing: 'border-box',
                background:
                  cutin.actor === 'challenger'
                    ? 'linear-gradient(90deg, #D84315 0%, #FF6F00 50%, #FFB300 100%)'
                    : 'linear-gradient(90deg, #6A1B9A 0%, #AD1457 50%, #E91E63 100%)',
                padding: '12px 18px',
                borderRadius: 16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.4)',
                textAlign: 'center',
                animation: 'cutinBanner 0.75s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
                border: '2.5px solid #FFF',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 900, color: '#FFEB3B', letterSpacing: '1px', textShadow: '0 2px 4px #000' }}>
                {cutin.title}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                {cutin.icon} {cutin.name}
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#FFF8E1', marginTop: 2, textShadow: '0 1px 3px #000' }}>
                "{cutin.quote}"
              </div>
            </div>
          </div>
        )}

        {/* 현재 턴 ASMR 파편 & 의성어 버스트 이펙트 */}
        {currentTurn && (
          <SensoryBurst
            kind={currentTurn.asmr}
            triggerKey={stepIdx}
            bubble={`${currentTurn.skillIcon} ${currentTurn.onomatopoeia}`}
            combo={currentTurn.hitCount ?? (currentTurn.isCrit ? 3 : 1)}
          />
        )}

        {/* 🌟 포켓몬고 스타일 전/후 원근감 3D 배틀 필드 & 플로팅 대미지/힐 텍스트 */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* 바닥 원근감 그리드 라인 & 타원형 배틀 플랫폼 (Pedestal) */}
          {/* [후면 상단] 상대 펫 발판 */}
          <div
            style={{
              position: 'absolute',
              top: '32%',
              right: '18%',
              width: 120,
              height: 44,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(144, 202, 249, 0.45) 0%, rgba(227, 242, 253, 0.2) 65%, transparent 100%)',
              border: '1.5px solid rgba(66, 165, 245, 0.45)',
              transform: 'rotateX(55deg)',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
          {/* [전면 하단] 내 펫 발판 */}
          <div
            style={{
              position: 'absolute',
              bottom: '14%',
              left: '16%',
              width: 150,
              height: 52,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(255, 183, 77, 0.5) 0%, rgba(255, 243, 224, 0.2) 65%, transparent 100%)',
              border: '1.5px solid rgba(255, 167, 38, 0.5)',
              transform: 'rotateX(55deg)',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {/* ⚡ 치명타 / 스킬 발동 시 다이내믹 컷인 배너 */}
          {currentTurn && (currentTurn.isCrit || currentTurn.skillName) && actionPhase === 'strike' && (
            <div
              key={`cutin-${stepIdx}`}
              style={{
                position: 'absolute',
                top: '46%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 30,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: currentTurn.isCrit
                  ? 'linear-gradient(90deg, rgba(216, 27, 96, 0.95), rgba(255, 87, 34, 0.95))'
                  : 'linear-gradient(90deg, rgba(255, 152, 0, 0.95), rgba(255, 193, 7, 0.95))',
                padding: '8px 24px',
                borderRadius: 999,
                boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 15px rgba(255,215,0,0.6)',
                border: '2px solid #FFFFFF',
                animation: 'cutinBanner 0.75s ease-out both',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 22 }}>{currentTurn.isCrit ? '💥' : '✨'}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                {currentTurn.isCrit ? '🔥 치명타 식감 버스트!' : `⚡ ${currentTurn.skillName || '필살 스킬'}!`}
              </span>
            </div>
          )}

          {/* [전면 좌하단] 내 디저트 몬스터 (전면이라 130px 크기로 위풍당당하게 배치) */}
          <div
            style={{
              position: 'absolute',
              bottom: '15%',
              left: '16%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 15,
            }}
          >
            {/* 🌟 내 캐릭터 주변 플로팅 전투 텍스트 (Floating Combat Text) */}
            {challengerFloating && (
              <div
                key={`c-float-${stepIdx}`}
                style={{
                  position: 'absolute',
                  top: '-32%',
                  zIndex: 25,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: 'floatCombatNum 1.25s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
                  pointerEvents: 'none',
                }}
              >
                {challengerFloating.sub && (
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      color: '#FFFFFF',
                      background:
                        challengerFloating.type === 'crit'
                          ? '#D81B60'
                          : challengerFloating.type === 'dodge'
                            ? '#1E88E5'
                            : challengerFloating.type === 'block'
                              ? '#FB8C00'
                              : '#43A047',
                      padding: '2px 8px',
                      borderRadius: 999,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      marginBottom: 2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {challengerFloating.sub}
                  </div>
                )}
                <div
                  style={{
                    fontSize:
                      challengerFloating.type === 'crit'
                        ? 26
                        : challengerFloating.type === 'skill'
                          ? 13
                          : 22,
                    fontWeight: 900,
                    color:
                      challengerFloating.type === 'crit'
                        ? '#FF1744'
                        : challengerFloating.type === 'heal'
                          ? '#00E676'
                          : challengerFloating.type === 'dodge'
                            ? '#29B6F6'
                            : challengerFloating.type === 'block'
                              ? '#FFA726'
                              : challengerFloating.type === 'skill'
                                ? '#5D4037'
                                : '#FF5252',
                    textShadow:
                      challengerFloating.type === 'skill'
                        ? '0 1px 3px rgba(255,255,255,0.9)'
                        : '0 2px 8px rgba(0,0,0,0.45), 0 0 5px #FFFFFF',
                    letterSpacing: '-0.5px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {challengerFloating.text}
                </div>
              </div>
            )}

            {/* 3D 몬스터 뷰 & 물리 모션 트랜스폼 */}
            <BattleFighter
              look={cLook}
              size={130}
              title={challenger.name ?? cInfo?.name}
              pose={cPose}
              hitClass={cHitReaction || undefined}
              hitKey={stepIdx}
              flash={isHitMoment && isDefenderActor}
              trail={actionPhase === 'strike' && isChallengerActor}
            />
          </div>

          {/* [후면 우상단] 지인 디저트 몬스터 (원근감으로 105px 크기로 뒤에 위치) */}
          <div
            style={{
              position: 'absolute',
              top: '12%',
              right: '18%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 8,
            }}
          >
            {/* 🌟 상대 캐릭터 주변 플로팅 전투 텍스트 (Floating Combat Text) */}
            {defenderFloating && (
              <div
                key={`d-float-${stepIdx}`}
                style={{
                  position: 'absolute',
                  top: '-32%',
                  zIndex: 25,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: 'floatCombatNum 1.25s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
                  pointerEvents: 'none',
                }}
              >
                {defenderFloating.sub && (
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      color: '#FFFFFF',
                      background:
                        defenderFloating.type === 'crit'
                          ? '#D81B60'
                          : defenderFloating.type === 'dodge'
                            ? '#1E88E5'
                            : defenderFloating.type === 'block'
                              ? '#FB8C00'
                              : '#43A047',
                      padding: '2px 8px',
                      borderRadius: 999,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      marginBottom: 2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {defenderFloating.sub}
                  </div>
                )}
                <div
                  style={{
                    fontSize:
                      defenderFloating.type === 'crit'
                        ? 26
                        : defenderFloating.type === 'skill'
                          ? 13
                          : 22,
                    fontWeight: 900,
                    color:
                      defenderFloating.type === 'crit'
                        ? '#FF1744'
                        : defenderFloating.type === 'heal'
                          ? '#00E676'
                          : defenderFloating.type === 'dodge'
                            ? '#29B6F6'
                            : defenderFloating.type === 'block'
                              ? '#FFA726'
                              : defenderFloating.type === 'skill'
                                ? '#5D4037'
                                : '#FF5252',
                    textShadow:
                      defenderFloating.type === 'skill'
                        ? '0 1px 3px rgba(255,255,255,0.9)'
                        : '0 2px 8px rgba(0,0,0,0.45), 0 0 5px #FFFFFF',
                    letterSpacing: '-0.5px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {defenderFloating.text}
                </div>
              </div>
            )}

            {/* 3D 몬스터 뷰 & 물리 모션 트랜스폼 */}
            <BattleFighter
              look={dLook}
              size={105}
              title={defender.name ?? dInfo?.name}
              pose={dPose}
              hitClass={dHitReaction || undefined}
              hitKey={stepIdx}
              flash={isHitMoment && isChallengerActor}
              trail={actionPhase === 'strike' && isDefenderActor}
            />
          </div>
        </div>

        {/* 1줄 미니멀 실시간 ASMR 사운드 뱃지 (장황한 설명글 대신 사운드와 의성어만 간결하게) */}
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.94)',
            border: '1px solid #FFE082',
            borderRadius: 999,
            padding: '2px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10,
            fontWeight: 800,
            color: '#795548',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {isFinished ? (
            <span style={{ color: sim.winner === 'challenger' ? '#2E7D32' : '#C2185B' }}>
              {sim.winner === 'challenger' ? '🏆 배틀 종료 · 승리!' : '👏 배틀 종료 · 멋진 승부!'}
            </span>
          ) : currentTurn ? (
            <span>
              턴 {currentTurn.turn}/{sim.turns.length} · 🔊 {currentTurn.onomatopoeia}
            </span>
          ) : (
            <span>🍮 달콤한 ASMR 대전 시작!</span>
          )}
        </div>
      </div>

      {/* 🎮 하단 직관적 게임 컨트롤 바 (심플 & 효율적인 공간 배치) */}
      <div
        className="card"
        style={{
          background: '#FFFDF9',
          border: '1.5px solid #F0DFB8',
          padding: '6px 8px',
          gap: 6,
          flexShrink: 0,
        }}
      >
        {/* 실시간 관전 터치 응원 버튼 */}
        {!isFinished && (
          <div className="row between" style={{ gap: 6 }}>
            <button
              onClick={handleCheer}
              style={{
                flex: 1,
                cursor: 'pointer',
                border: 'none',
                borderRadius: 10,
                fontWeight: 900,
                fontSize: 11,
                padding: '6px 10px',
                background: 'linear-gradient(90deg, #FF7043, #FF5722)',
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(255,87,34,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              💖 펫 응원 터치! {cheerCount > 0 ? `(${cheerCount})` : ''}
            </button>
            {cheerToast && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#D84315',
                  animation: 'pulseGlow 0.8s ease infinite',
                  whiteSpace: 'nowrap',
                }}
              >
                {cheerToast}
              </span>
            )}
          </div>
        )}

        {/* 조작 버튼 그룹: 대전 종료 시에만 결과 액션 버튼 표시 (정지, 배속, 스킵 삭제) */}
        {isFinished && (
          <div className="row between" style={{ gap: 5 }}>
            <button
              className="chip coral"
              onClick={handleReplaySameSeed}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11, flex: 1, padding: '6px 0' }}
            >
              🔄 다시 보기
            </button>
            <button
              className="chip honey"
              onClick={handleRematchNewSeed}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11, flex: 1, padding: '6px 0' }}
            >
              🎲 새 대결
            </button>
            <button
              className="chip"
              onClick={onBack}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11, flex: 1, padding: '6px 0', background: '#5D4037', color: '#FFFFFF' }}
            >
              🚪 대전 종료
            </button>
          </div>
        )}
      </div>

      {/* 대전 종료 결과 팝업 & 광장 복귀 모달 */}
      {isFinished && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 310,
              background: '#FFFDF9',
              borderRadius: 20,
              border: '2px solid #FFD54F',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              padding: '16px 14px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 36 }}>{sim.winner === 'challenger' ? '🎉🏆🎉' : '👏🍮✨'}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#3E2723' }}>
              {sim.winner === 'challenger'
                ? `승리! [${challenger.name || cInfo?.name}] 압승!`
                : `명승부! [${defender.name || dInfo?.name}] 대등한 접전!`}
            </div>
            <div style={{ fontSize: 12, color: '#795548', lineHeight: 1.4 }}>
              달콤한 식감 ASMR 대전이 마무리되었습니다.<br />
              <b style={{ color: '#E65100' }}>
                {sim.winner === 'challenger' ? '보상: +30 리본코인 획득! 🎀' : '보상: +10 리본코인 획득! 🎀'}
              </b>
            </div>

            {/* 🎬 배틀 명장면 리플레이 짤 보기 & 공유 버튼 (임팩트 업그레이드) */}
            <button
              onClick={() => {
                setShowHighlightModal(true)
                playDessertAsmr('sugar-crack', 2)
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 14,
                border: '2px solid #FF9800',
                background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
                color: '#E65100',
                fontWeight: 900,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 3px 8px rgba(255,152,0,0.25)',
              }}
            >
              <span style={{ fontSize: 16 }}>🎬</span>
              <span>배틀 명장면 리플레이 짤 보기 & 공유</span>
            </button>

            <div className="row wrap center" style={{ gap: 6, marginTop: 2 }}>
              <button
                className="chip coral"
                onClick={handleReplaySameSeed}
                style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11, padding: '7px 12px' }}
              >
                🔄 다시 감상
              </button>
              <button
                className="chip honey"
                onClick={handleRematchNewSeed}
                style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11, padding: '7px 12px' }}
              >
                ⚔️ 새 시드 대결
              </button>
              <button
                className="btn primary"
                onClick={onBack}
                style={{
                  width: '100%',
                  marginTop: 4,
                  fontWeight: 900,
                  fontSize: 13,
                  padding: '9px 0',
                  background: 'linear-gradient(135deg, #FF7043, #D84315)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#FFFFFF',
                }}
              >
                🚪 광장으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎬 배틀 명장면 리플레이 짤 & 공유 전용 모달 */}
      {showHighlightModal && bestHighlight && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setShowHighlightModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#FFFDF9',
              borderRadius: 22,
              border: '2px solid #FFB74D',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              padding: '16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row between" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#E65100' }}>
                🎬 배틀 명장면 리플레이 짤
              </span>
              <button
                onClick={() => setShowHighlightModal(false)}
                style={{ border: 'none', background: 'none', fontSize: 14, cursor: 'pointer', color: '#8D6E63', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            {/* 움직이는 짤(GIF 애니메이션 프레임) 캔버스 카드 */}
            <div
              style={{
                position: 'relative',
                borderRadius: 16,
                background: 'radial-gradient(ellipse at center, #FFF8E1 0%, #FFE082 100%)',
                border: '1.5px solid #FFD54F',
                padding: '14px 10px',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              {/* 상단 짤 배지 */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#FFEB3B',
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF1744', display: 'inline-block' }} />
                GIF 리플레이 짤
              </div>

              {/* 3D 펫들의 결정타 도약 액션 짤 애니메이션 */}
              <div
                style={{
                  height: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  position: 'relative',
                }}
              >
                <div style={{ animation: 'bounce 0.8s infinite alternate ease-in-out' }}>
                  <MonsterView look={cLook} size={90} title={challenger.name || cInfo?.name} />
                </div>
                <div style={{ fontSize: 24, animation: 'pulseGlow 0.5s infinite alternate' }}>💥</div>
                <div style={{ animation: 'shake 0.8s infinite ease-in-out', opacity: 0.85 }}>
                  <MonsterView look={dLook} size={75} title={defender.name || dInfo?.name} />
                </div>
              </div>

              {/* 하단 짤 정보 오버레이 */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  borderRadius: 12,
                  padding: '6px 10px',
                  border: '1px solid #FFE082',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 900, color: '#D84315' }}>
                  {bestHighlight.isCrit ? '🔥 [필살기 결정타] ' : '⚡ [최대 식감 타격] '}
                  {bestHighlight.skillIcon} {bestHighlight.skillName}
                </div>
                <div style={{ fontSize: 10, color: '#5D4037', fontWeight: 800, marginTop: 1 }}>
                  대미지 -{bestHighlight.damage} HP · ASMR {bestHighlight.onomatopoeia}
                </div>
              </div>
            </div>

            {/* 짤 공유 / 복사 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(
                      `[파티세리 디저트 대전] #${seed} 시드에서 ${challenger.name || cInfo?.name}의 ${bestHighlight.skillName} 필살기 명장면! 대미지 -${bestHighlight.damage} 폭발!`
                    )
                    setCopiedClipToast(true)
                    setTimeout(() => setCopiedClipToast(false), 2500)
                  } catch {}
                  playDessertAsmr('cookie-crisp')
                }}
                style={{
                  padding: '9px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(90deg, #FF7043, #FF5722)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(255,87,34,0.3)',
                }}
              >
                {copiedClipToast ? '✅ 배틀 명장면 링크 복사 완료!' : '📸 배틀 명장면 짤 링크 복사 & 공유'}
              </button>

              <button
                onClick={() => setShowHighlightModal(false)}
                style={{
                  padding: '8px 0',
                  borderRadius: 10,
                  border: '1px solid #CFD8DC',
                  background: '#ECEFF1',
                  color: '#455A64',
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
