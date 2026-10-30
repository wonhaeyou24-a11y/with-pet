// M3 화면 2: ⚔️🎧 리얼 액션 턴제 식감 ASMR 대전 아레나 (원스크린 100dvh 레이아웃)
// 두 3D 디저트 몬스터가 속도와 AI 성향에 따라 돌진 타격, 점프 회피(MISS), 슈가 가드(BLOCK),
// 치명타(CRITICAL) 등 다양한 리얼 액션을 주고받으며, 관전 중 실시간 터치 응원 손맛을 즐깁니다.

import { useEffect, useMemo, useState } from 'react'
import { addRibbonCoins } from '../config/boutique'
import { recordMissionAction } from '../config/missions'
import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
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
  const [speed, setSpeed] = useState<1 | 2>(1)
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

    const turnInterval = speed === 2 ? 800 : 1400

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
  }, [playing, isFinished, stepIdx, speed])

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

  function handleSkipToEnd() {
    const last = sim.turns[sim.turns.length - 1]
    if (last) playDessertAsmr(last.asmr, 3)
    setStepIdx(sim.turns.length)
    setPlaying(false)
    if (!rewarded) {
      setRewarded(true)
      const isWin = sim.winner === 'challenger'
      onRewardClaimed?.(isWin ? 30 : 15)
      addRibbonCoins(isWin ? 30 : 10, '친선 대전 보상')
      recordMissionAction('d-battle', 1)
      if (isWin) recordMissionAction('w-battle-win', 1)
    }
  }

  // 양측 애니메이션 트랜스폼 계산 (돌진, 도약, 회피 점프, 가드, 피격 반동)
  const isChallengerActor = currentTurn?.actor === 'challenger'
  const isDefenderActor = currentTurn?.actor === 'defender'

  let cTransform = 'none'
  let dTransform = 'none'

  if (actionPhase === 'strike' || actionPhase === 'reaction') {
    if (isChallengerActor) {
      // 내 몬스터 공격 중
      if (currentTurn?.motion === 'jump') cTransform = 'translate(24px, -18px) scale(1.12)'
      else if (currentTurn?.motion === 'rush') cTransform = 'translateX(28px) scale(1.08)'
      else cTransform = 'scale(1.06)'

      // 상대방 반응
      if (currentTurn?.targetReaction === 'dodge') dTransform = 'translate(10px, -24px)'
      else if (currentTurn?.targetReaction === 'block') dTransform = 'scale(0.92)'
      else if (currentTurn?.targetReaction === 'hit') dTransform = 'translateX(18px) scale(0.94)'
    } else if (isDefenderActor) {
      // 상대 몬스터 공격 중
      if (currentTurn?.motion === 'jump') dTransform = 'translate(-24px, -18px) scale(1.12)'
      else if (currentTurn?.motion === 'rush') dTransform = 'translateX(-28px) scale(1.08)'
      else dTransform = 'scale(1.06)'

      // 내 몬스터 반응
      if (currentTurn?.targetReaction === 'dodge') cTransform = 'translate(-10px, -24px)'
      else if (currentTurn?.targetReaction === 'block') cTransform = 'scale(0.92)'
      else if (currentTurn?.targetReaction === 'hit') cTransform = 'translateX(-18px) scale(0.94)'
    }
  }

  const cHitReaction =
    currentTurn && currentTurn.actor === 'defender' && currentTurn.targetReaction === 'hit'
      ? getSensoryReactionClass(currentTurn.asmr)
      : ''
  const dHitReaction =
    currentTurn && currentTurn.actor === 'challenger' && currentTurn.targetReaction === 'hit'
      ? getSensoryReactionClass(currentTurn.asmr)
      : ''

  const visibleLogs = sim.turns.slice(Math.max(0, stepIdx - 3), Math.max(1, stepIdx))

  return (
    <main
      className="screen"
      style={{
        justifyContent: 'space-between',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        padding: '10px 12px calc(12px + env(safe-area-inset-bottom, 0px))',
        gap: 6,
      }}
    >
      {/* 상단 헤더 */}
      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 16 }}>⚔️ 실시간 턴제 식감 대전</h1>
        <span className="chip" style={{ fontSize: 11, fontWeight: 800 }}>
          시드 #{seed}
        </span>
      </div>

      {/* 대전 아레나 실시간 3D 스테이지 카드 */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(180deg, #FFF7EC 0%, #FFFFFF 100%)',
          padding: '10px 12px',
          gap: 6,
          position: 'relative',
          overflow: 'hidden',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* 현재 턴 ASMR 파편 & 의성어 버스트 */}
        {currentTurn && (
          <SensoryBurst
            kind={currentTurn.asmr}
            triggerKey={stepIdx}
            bubble={`${currentTurn.skillIcon} ${currentTurn.onomatopoeia}`}
            combo={currentTurn.hitCount ?? (currentTurn.isCrit ? 3 : 1)}
          />
        )}

        {/* 양측 체력 바 & 3D 캐릭터 실시간 대치 및 모션 액션 스테이지 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8, flex: 1, alignItems: 'center' }}>
          {/* 내 디저트 몬스터 (왼쪽) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', padding: '5px 7px', borderRadius: 12, background: '#FFFDF9', border: '1.5px solid #F0DFB8' }}>
              <div className="row between">
                <span style={{ fontSize: 12, fontWeight: 900, color: '#3B2F2F' }}>
                  {challenger.name || cInfo?.name}
                </span>
                <span className="chip coral" style={{ fontSize: 11, padding: '1px 5px' }}>
                  나 · Lv.{challenger.level}
                </span>
              </div>
              <div className="row between" style={{ marginTop: 2, marginBottom: 2 }}>
                <span style={{ fontSize: 11, color: '#7A6A60', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ElementIcon element={challenger.element} size={13} />
                  {ELEMENT_INFO[challenger.element].label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>
                  {cHp}/{sim.challengerMaxHp}
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${cPct}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: cPct > 30 ? '#4CAF6A' : '#D9534F',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* 3D 몬스터 뷰 & 실시간 물리 모션 트랜스폼 */}
            <div
              key={`c-${stepIdx}`}
              className={cHitReaction}
              style={{
                position: 'relative',
                transform: cTransform,
                transition: 'transform 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
              }}
            >
              {currentTurn?.actor === 'defender' && currentTurn.bannerText && (
                <div
                  style={{
                    position: 'absolute',
                    top: -6,
                    left: 4,
                    zIndex: 10,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: currentTurn.isDodge ? '#2196F3' : currentTurn.isBlock ? '#FF9800' : '#E91E63',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 900,
                    animation: 'bounce 0.8s ease',
                  }}
                >
                  {currentTurn.bannerText}
                </div>
              )}
              <MonsterView look={cLook} size={92} title={challenger.name ?? cInfo?.name} />
            </div>
          </div>

          {/* 지인 디저트 몬스터 (오른쪽) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', padding: '5px 7px', borderRadius: 12, background: '#FFFDF9', border: '1.5px solid #F0DFB8' }}>
              <div className="row between">
                <span style={{ fontSize: 12, fontWeight: 900, color: '#3B2F2F' }}>
                  {defender.name || dInfo?.name}
                </span>
                <span className="chip honey" style={{ fontSize: 11, padding: '1px 5px' }}>
                  {defenderOwnerName} · Lv.{defender.level}
                </span>
              </div>
              <div className="row between" style={{ marginTop: 2, marginBottom: 2 }}>
                <span style={{ fontSize: 11, color: '#7A6A60', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ElementIcon element={defender.element} size={13} />
                  {ELEMENT_INFO[defender.element].label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>
                  {dHp}/{sim.defenderMaxHp}
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${dPct}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: dPct > 30 ? '#FF8A65' : '#D9534F',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* 3D 몬스터 뷰 & 실시간 물리 모션 트랜스폼 */}
            <div
              key={`d-${stepIdx}`}
              className={dHitReaction}
              style={{
                position: 'relative',
                transform: dTransform,
                transition: 'transform 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
              }}
            >
              {currentTurn?.actor === 'challenger' && currentTurn.bannerText && (
                <div
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: 4,
                    zIndex: 10,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: currentTurn.isDodge ? '#2196F3' : currentTurn.isBlock ? '#FF9800' : '#E91E63',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 900,
                    animation: 'bounce 0.8s ease',
                  }}
                >
                  {currentTurn.bannerText}
                </div>
              )}
              <MonsterView look={dLook} size={92} title={defender.name ?? dInfo?.name} />
            </div>
          </div>
        </div>

        {/* 실시간 턴 중계 & 액션 배너 */}
        <div
          style={{
            padding: '7px 10px',
            borderRadius: 14,
            background: isFinished ? (sim.winner === 'challenger' ? '#E8F8F0' : '#FFF2EC') : '#FFFBF2',
            border: isFinished ? '2px solid #FF8A65' : '1.5px solid #F0DFB8',
            textAlign: 'center',
          }}
        >
          {isFinished ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#3B2F2F' }}>
                {sim.winner === 'challenger'
                  ? `🏆 승리! [${challenger.name || cInfo?.name}]의 식감 액션이 빛났어요! (+30 코인)`
                  : `👏 아까운 명승부! [${defender.name || dInfo?.name}] 친구와 멋지게 겨뤘어요! (+15 코인)`}
              </div>
              <div style={{ fontSize: 11, color: '#7A6A60', marginTop: 2 }}>
                시드 #{seed} · 같은 시드로 다시 감상하거나 새 시드로 재대결할 수 있어요.
              </div>
            </div>
          ) : currentTurn ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#D85A3A' }}>
                턴 {currentTurn.turn}/{sim.turns.length} · 🔊 {currentTurn.onomatopoeia}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', marginTop: 1 }}>
                {currentTurn.narrative}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, fontWeight: 800, color: '#5D4037' }}>
              🍮 식감 ASMR 실시간 턴제 대전이 시작됩니다…!
            </div>
          )}
        </div>

        {/* 관전 중 실시간 터치 응원 손맛 & 컨트롤 바 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {!isFinished && (
            <div className="row between" style={{ background: '#FFFDF9', padding: '4px 8px', borderRadius: 12, border: '1px solid #FFE082' }}>
              <button
                className="chip honey"
                onClick={handleCheer}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: 12,
                  padding: '4px 10px',
                  background: 'linear-gradient(90deg, #FF9800, #FF5722)',
                  color: '#FFFFFF',
                }}
              >
                💖 터치 응원하기! {cheerCount > 0 ? `(${cheerCount}회)` : ''}
              </button>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#D85A3A' }}>
                {cheerToast ?? '타이밍 맞춰 펫을 응원해 보세요!'}
              </span>
            </div>
          )}

          <div className="row wrap center" style={{ gap: 6 }}>
            {!isFinished ? (
              <>
                <button
                  className="chip coral"
                  onClick={() => setPlaying((p) => !p)}
                  style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11 }}
                >
                  {playing ? '⏸️ 일시정지' : '▶️ 재생'}
                </button>
                <button
                  className="chip honey"
                  onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
                  style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11 }}
                >
                  ⚡ 배속 {speed}x
                </button>
                <button
                  className="chip"
                  onClick={handleSkipToEnd}
                  style={{ cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: 11 }}
                >
                  ⏩ 결과 스킵
                </button>
              </>
            ) : (
              <>
                <button
                  className="chip coral"
                  onClick={handleReplaySameSeed}
                  style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12 }}
                >
                  🔄 같은 시드(#{seed}) 리플레이
                </button>
                <button
                  className="chip honey"
                  onClick={handleRematchNewSeed}
                  style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12 }}
                >
                  🎲 새 시드로 재대결
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 하단 턴별 상세 식감 로그 덱 (컴팩트 높이로 모바일 화면 잘림 100% 방지) */}
      <div className="card deck-card" style={{ padding: '4px 8px', gap: 2, flexShrink: 0, maxHeight: 80 }}>
        <div className="row between" style={{ flexShrink: 0 }}>
          <h2 className="title" style={{ fontSize: 13 }}>
            📜 배틀 액션 로그 ({Math.max(1, stepIdx)}/{sim.turns.length}턴)
          </h2>
          <div className="row" style={{ gap: 4 }}>
            <button
              className="chip"
              disabled={stepIdx <= 1}
              onClick={() => {
                setPlaying(false)
                const prev = Math.max(1, stepIdx - 1)
                setStepIdx(prev)
                const t = sim.turns[prev - 1]
                if (t) playDessertAsmr(t.asmr, t.hitCount ?? 1)
              }}
              style={{ cursor: 'pointer', border: 'none', fontSize: 10, padding: '1px 6px' }}
            >
              ◀ 이전
            </button>
            <button
              className="chip"
              disabled={stepIdx >= sim.turns.length}
              onClick={() => {
                setPlaying(false)
                const next = Math.min(sim.turns.length, stepIdx + 1)
                setStepIdx(next)
                const t = sim.turns[next - 1]
                if (t) playDessertAsmr(t.asmr, t.hitCount ?? 1)
              }}
              style={{ cursor: 'pointer', border: 'none', fontSize: 10, padding: '1px 6px' }}
            >
              다음 ▶
            </button>
          </div>
        </div>

        <div className="deck-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflowY: 'auto' }}>
          {visibleLogs.map((t) => {
            const isLatest = t.turn === stepIdx
            return (
              <div
                key={t.turn}
                onClick={() => playDessertAsmr(t.asmr, t.hitCount ?? 1)}
                style={{
                  padding: '4px 6px',
                  borderRadius: 8,
                  border: isLatest ? '1.5px solid #FF8A65' : '1px solid #F0DFB8',
                  background: isLatest ? '#FFF4EE' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#3B2F2F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    [턴 {t.turn}] {t.narrative}
                  </div>
                  <div style={{ fontSize: 9, color: '#D85A3A', fontWeight: 700 }}>
                    🔊 {t.onomatopoeia} {t.bannerText ? `· ${t.bannerText}` : ''}
                  </div>
                </div>
                <span className="chip" style={{ fontSize: 9, flexShrink: 0, padding: '1px 4px' }}>
                  🎧 ASMR
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 대전 종료 결과 팝업 & 광장 복귀 모달 (모바일 화면 내 100% 노출 보장) */}
      {isFinished && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 14,
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              maxHeight: '86dvh',
              overflowY: 'auto',
              background: '#FFFDF9',
              borderRadius: 20,
              border: '2px solid #FFD54F',
              padding: '16px 14px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontSize: 38 }}>
              {sim.winner === 'challenger' ? '🎉🏆🎉' : '💔🍪💦'}
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                margin: 0,
                color: sim.winner === 'challenger' ? '#E65100' : '#4E342E',
              }}
            >
              {sim.winner === 'challenger' ? '달콤한 승리 달성!' : '아쉬운 패배!'}
            </h2>
            <div style={{ fontSize: 12, color: '#6D4C41', lineHeight: 1.35 }}>
              {sim.winner === 'challenger'
                ? `[${defender.name ?? '상대'}]와의 친선전에서 승리하여 🪙 30 코인과 🎀 30 리본 코인을 획득했습니다!`
                : `[${defender.name ?? '상대'}]와의 명승부 끝에 🪙 15 코인과 🎀 10 리본 코인을 획득했습니다!`}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#BE185D',
                fontWeight: 800,
                background: '#FDF2F8',
                padding: '6px 8px',
                borderRadius: 10,
                border: '1px solid #FBCFE8',
              }}
            >
              🎀 슈가 리본 코인으로 부티크 상점에서 유니크 장신구와 마이룸 가구를 구입하세요!
            </div>

            <button
              onClick={onBack}
              style={{
                padding: '11px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(90deg, #FF7A59 0%, #FF9800 100%)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255,122,89,0.35)',
                marginTop: 2,
                flexShrink: 0,
              }}
            >
              🏆 대전 종료 &amp; 광장으로 복귀
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
