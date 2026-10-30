// M3 화면 2: ⚔️🎧 리얼 액션 턴제 식감 ASMR 대전 아레나 (원스크린 100dvh 레이아웃)
// - 상태바를 상단 헤더 뒤쪽으로 슬림하게 배치하여 3D 몬스터 모션 공간을 극대화했습니다.
// - 글 설명 대신 펫 주변에 플로팅 대미지/힐/치명타/회피 텍스트가 솟아오르며 스르륵 사라지는 직관적 RPG 방식을 적용했습니다.
// - 하단 공간을 심플하고 직관적인 컨트롤 위주로 정돈하여 화면 밖 잘림을 100% 방지했습니다.

import { useEffect, useMemo, useState } from 'react'
import { addRibbonCoins } from '../config/boutique'
import { recordMissionAction } from '../config/missions'
import { SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { simulateAsmrBattle } from '../lib/battleEngine'
import { playDessertAsmr } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { BackIcon, ElementIcon } from '../ui/Icons'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'

interface Props {
  challenger: MonsterRow
  defender: MonsterRow
  defenderOwnerName: string
  initialSeed?: number
  onRewardClaimed?: (coinsEarned: number) => void
  onBack: () => void
}

export default function AsmrBattleArena({
  challenger,
  defender,
  defenderOwnerName,
  initialSeed,
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

  const sim = useMemo(() => simulateAsmrBattle(challenger, defender, seed), [challenger, defender, seed])
  const currentTurn = stepIdx > 0 ? sim.turns[stepIdx - 1] : null
  const isFinished = stepIdx >= sim.turns.length

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

    const turnInterval = 1200

    // 1단계: 턴 개시 및 돌진 모션
    const t1 = setTimeout(() => {
      setActionPhase('windup')
    }, 50)

    // 2단계: 타격 & ASMR 사운드
    const t2 = setTimeout(() => {
      setActionPhase('strike')
      const nextStep = stepIdx + 1
      const turn = sim.turns[nextStep - 1]
      if (turn) {
        playDessertAsmr(turn.asmr, turn.hitCount ?? (turn.isCrit ? 3 : 1))
      }
    }, turnInterval * 0.4)

    // 3단계: 피격 반응 & 스텝 인덱스 증가
    const t3 = setTimeout(() => {
      setActionPhase('reaction')
      const nextStep = stepIdx + 1
      setStepIdx(nextStep)
      if (nextStep >= sim.turns.length && !rewarded) {
        setRewarded(true)
        const isWin = sim.winner === 'challenger'
        onRewardClaimed?.(isWin ? 30 : 15)
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
    setSeed(Math.floor(100000 + Math.random() * 899999))
    setStepIdx(0)
    setPlaying(true)
  }

  // 양측 애니메이션 트랜스폼 계산 (돌진, 도약, 회피 점프, 가드, 피격 반동)
  const isChallengerActor = currentTurn?.actor === 'challenger'
  const isDefenderActor = currentTurn?.actor === 'defender'

  let cTransform = 'translateX(0) translateY(0) scale(1)'
  let dTransform = 'translateX(0) translateY(0) scale(1)'

  if (actionPhase === 'windup') {
    if (isChallengerActor) cTransform = 'translateX(-8px) scale(0.96)'
    if (isDefenderActor) dTransform = 'translateX(8px) scale(0.96)'
  } else if (actionPhase === 'strike') {
    if (isChallengerActor) {
      cTransform = 'translateX(58px) scale(1.18)'
    }
    if (isDefenderActor) {
      dTransform = 'translateX(-58px) scale(1.18)'
    }
  } else if (actionPhase === 'reaction') {
    if (isChallengerActor) {
      if (currentTurn?.isDodge) dTransform = 'translateY(-30px) scale(1.05)'
      else if (currentTurn?.isBlock) dTransform = 'translateX(12px) scale(0.92)'
      else dTransform = 'translateX(26px) rotate(8deg)'
    }
    if (isDefenderActor) {
      if (currentTurn?.isDodge) cTransform = 'translateY(-30px) scale(1.05)'
      else if (currentTurn?.isBlock) cTransform = 'translateX(-12px) scale(0.92)'
      else cTransform = 'translateX(-26px) rotate(-8deg)'
    }
  }

  const cHitReaction =
    actionPhase === 'reaction' && isDefenderActor && !currentTurn?.isDodge && !currentTurn?.isBlock
      ? getSensoryReactionClass(currentTurn?.asmr ?? 'sugar-crack')
      : ''
  const dHitReaction =
    actionPhase === 'reaction' && isChallengerActor && !currentTurn?.isDodge && !currentTurn?.isBlock
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
        className="card"
        style={{
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
        {/* 현재 턴 ASMR 파편 & 의성어 버스트 이펙트 */}
        {currentTurn && (
          <SensoryBurst
            kind={currentTurn.asmr}
            triggerKey={stepIdx}
            bubble={`${currentTurn.skillIcon} ${currentTurn.onomatopoeia}`}
            combo={currentTurn.hitCount ?? (currentTurn.isCrit ? 3 : 1)}
          />
        )}

        {/* 3D 캐릭터 2인 대치 캔버스 & 플로팅 대미지/힐 텍스트 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            width: '100%',
            height: '100%',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* [왼쪽] 내 디저트 몬스터 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              height: '100%',
              justifyContent: 'center',
            }}
          >
            {/* 🌟 내 캐릭터 주변 플로팅 전투 텍스트 (Floating Combat Text) */}
            {challengerFloating && (
              <div
                key={`c-float-${stepIdx}`}
                style={{
                  position: 'absolute',
                  top: '10%',
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
            <div
              key={`c-${stepIdx}`}
              className={cHitReaction}
              style={{
                position: 'relative',
                transform: cTransform,
                transition: 'transform 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <MonsterView look={cLook} size={120} title={challenger.name ?? cInfo?.name} />
              {/* 발밑 타원형 접시 섀도우 */}
              <div
                style={{
                  width: 86,
                  height: 18,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(62,39,35,0.35) 0%, rgba(62,39,35,0.1) 60%, transparent 80%)',
                  marginTop: -10,
                }}
              />
            </div>
          </div>

          {/* [오른쪽] 지인 디저트 몬스터 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              height: '100%',
              justifyContent: 'center',
            }}
          >
            {/* 🌟 상대 캐릭터 주변 플로팅 전투 텍스트 (Floating Combat Text) */}
            {defenderFloating && (
              <div
                key={`d-float-${stepIdx}`}
                style={{
                  position: 'absolute',
                  top: '10%',
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
            <div
              key={`d-${stepIdx}`}
              className={dHitReaction}
              style={{
                position: 'relative',
                transform: dTransform,
                transition: 'transform 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <MonsterView look={dLook} size={120} title={defender.name ?? dInfo?.name} />
              {/* 발밑 타원형 접시 섀도우 */}
              <div
                style={{
                  width: 86,
                  height: 18,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(62,39,35,0.35) 0%, rgba(62,39,35,0.1) 60%, transparent 80%)',
                  marginTop: -10,
                }}
              />
            </div>
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

            <div className="row wrap center" style={{ gap: 6, marginTop: 4 }}>
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
    </main>
  )
}
