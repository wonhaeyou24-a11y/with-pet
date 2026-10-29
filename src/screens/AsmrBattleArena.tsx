// M3 화면 2: ⚔️🎧 오감 자극 식감 ASMR 친선 대전 & 시드 리플레이 극장
// 두 디저트 몬스터가 각자의 케이크·쿠키 받침대 위에서 식감 스킬을 주고받으며,
// 매 턴 실제 식감 ASMR 사운드, 햅틱 진동, 젤리/크런치 체형 변형, 파편 버스트가 실시간으로 펼쳐집니다.

import { useEffect, useMemo, useState } from 'react'
import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { simulateAsmrBattle } from '../lib/battleEngine'
import { playDessertAsmr } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { BackIcon, ElementIcon } from '../ui/Icons'
import { Nest } from '../ui/parts'
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

  // 턴제 자동 리플레이 진행 + 매 턴 식감 ASMR 사운드 재생
  useEffect(() => {
    if (!playing || isFinished) return
    const delayMs = speed === 2 ? 750 : 1350
    const timer = window.setTimeout(() => {
      const nextStep = stepIdx + 1
      const turn = sim.turns[nextStep - 1]
      if (turn) {
        playDessertAsmr(turn.asmr, turn.hitCount ?? 1)
      }
      setStepIdx(nextStep)
      if (nextStep >= sim.turns.length && !rewarded) {
        setRewarded(true)
        onRewardClaimed?.(sim.winner === 'challenger' ? 30 : 15)
      }
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [playing, isFinished, stepIdx, speed, sim, rewarded, onRewardClaimed])

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
      onRewardClaimed?.(sim.winner === 'challenger' ? 30 : 15)
    }
  }

  const cHitReaction =
    currentTurn && currentTurn.actor === 'defender' && currentTurn.damage > 0
      ? getSensoryReactionClass(currentTurn.asmr)
      : ''
  const dHitReaction =
    currentTurn && currentTurn.actor === 'challenger' && currentTurn.damage > 0
      ? getSensoryReactionClass(currentTurn.asmr)
      : ''

  return (
    <main className="screen">
      {/* 상단 헤더 */}
      <div className="row between">
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title">⚔️ 식감 ASMR 친선 대전</h1>
        <span className="chip" style={{ fontSize: 11, fontWeight: 800 }}>
          시드 #{seed}
        </span>
      </div>

      {/* 대전 아레나 스테이지 카드 */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(180deg, #FFF7EC 0%, #FFFFFF 100%)',
          paddingBottom: 14,
          position: 'relative',
          overflow: 'hidden',
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

        {/* 양측 체력 바 & 캐릭터 대치 화면 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          {/* 내 디저트 몬스터 (왼쪽) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', padding: '6px 8px', borderRadius: 14, background: '#FFFDF9', border: '1.5px solid #F0DFB8' }}>
              <div className="row between">
                <span style={{ fontSize: 12, fontWeight: 900, color: '#3B2F2F' }}>
                  {challenger.name || cInfo?.name}
                </span>
                <span className="chip coral" style={{ fontSize: 10, padding: '1px 6px' }}>
                  나 · Lv.{challenger.level}
                </span>
              </div>
              <div className="row between" style={{ marginTop: 3, marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: '#7A6A60', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ElementIcon element={challenger.element} size={13} />
                  {ELEMENT_INFO[challenger.element].label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#3B2F2F' }}>
                  {cHp}/{sim.challengerMaxHp}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
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

            <div
              key={`c-${stepIdx}`}
              className={cHitReaction}
              style={{
                position: 'relative',
                marginTop: 6,
                transform: currentTurn?.actor === 'challenger' ? 'translateX(10px) scale(1.04)' : 'none',
                transition: 'transform 0.25s ease',
              }}
            >
              <MonsterView look={cLook} size={130} title={challenger.name ?? cInfo?.name} />
            </div>
            <Nest width={140} lift={26} front={false} dessertBase={cLook.mallang?.dessertBase} />
          </div>

          {/* 지인 디저트 몬스터 (오른쪽) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', padding: '6px 8px', borderRadius: 14, background: '#FFFDF9', border: '1.5px solid #F0DFB8' }}>
              <div className="row between">
                <span style={{ fontSize: 12, fontWeight: 900, color: '#3B2F2F' }}>
                  {defender.name || dInfo?.name}
                </span>
                <span className="chip honey" style={{ fontSize: 10, padding: '1px 6px' }}>
                  {defenderOwnerName} · Lv.{defender.level}
                </span>
              </div>
              <div className="row between" style={{ marginTop: 3, marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: '#7A6A60', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ElementIcon element={defender.element} size={13} />
                  {ELEMENT_INFO[defender.element].label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#3B2F2F' }}>
                  {dHp}/{sim.defenderMaxHp}
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
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

            <div
              key={`d-${stepIdx}`}
              className={dHitReaction}
              style={{
                position: 'relative',
                marginTop: 6,
                transform: currentTurn?.actor === 'defender' ? 'translateX(-10px) scale(1.04)' : 'none',
                transition: 'transform 0.25s ease',
              }}
            >
              <MonsterView look={dLook} size={130} title={defender.name ?? dInfo?.name} />
            </div>
            <Nest width={140} lift={26} front={false} dessertBase={dLook.mallang?.dessertBase} />
          </div>
        </div>

        {/* 현재 턴 중계 배너 */}
        <div
          style={{
            marginTop: 6,
            padding: '10px 12px',
            borderRadius: 16,
            background: isFinished ? (sim.winner === 'challenger' ? '#E8F8F0' : '#FFF2EC') : '#FFFBF2',
            border: isFinished ? '2px solid #FF8A65' : '1.5px solid #F0DFB8',
            textAlign: 'center',
          }}
        >
          {isFinished ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#3B2F2F' }}>
                {sim.winner === 'challenger'
                  ? `🏆 승리! [${challenger.name || cInfo?.name}]의 식감 크런치가 빛났어요! (+30 코인)`
                  : `👏 아까운 명승부! [${defender.name || dInfo?.name}] 친구와 즐겁게 겨뤘어요! (+15 코인)`}
              </div>
              <div style={{ fontSize: 11, color: '#7A6A60', marginTop: 3 }}>
                난수 시드 #{seed} · 아래 [같은 시드로 리플레이]를 누르면 똑같은 경기를 다시 감상할 수 있어요!
              </div>
            </div>
          ) : currentTurn ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#D85A3A' }}>
                턴 {currentTurn.turn} · 🔊 {currentTurn.onomatopoeia}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#3B2F2F', marginTop: 2 }}>
                {currentTurn.narrative}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 800, color: '#5D4037' }}>
              🍮 식감 ASMR 친선 대전이 시작됩니다…! (사운드가 함께 재생돼요)
            </div>
          )}
        </div>

        {/* 리플레이 컨트롤 바 */}
        <div className="row wrap center" style={{ gap: 6, marginTop: 6 }}>
          {!isFinished ? (
            <>
              <button
                className="chip coral"
                onClick={() => setPlaying((p) => !p)}
                style={{ cursor: 'pointer', border: 'none', fontWeight: 800 }}
              >
                {playing ? '⏸️ 일시정지' : '▶️ 이어서 재생'}
              </button>
              <button
                className="chip honey"
                onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
                style={{ cursor: 'pointer', border: 'none', fontWeight: 800 }}
              >
                ⏩ 속도 {speed}x
              </button>
              <button
                className="chip"
                onClick={handleSkipToEnd}
                style={{ cursor: 'pointer', border: 'none', fontWeight: 700 }}
              >
                ⚡ 결과 바로보기
              </button>
            </>
          ) : (
            <>
              <button
                className="chip coral"
                onClick={handleReplaySameSeed}
                style={{ cursor: 'pointer', border: 'none', fontWeight: 800 }}
              >
                🔄 같은 시드(#{seed}) 리플레이
              </button>
              <button
                className="chip honey"
                onClick={handleRematchNewSeed}
                style={{ cursor: 'pointer', border: 'none', fontWeight: 800 }}
              >
                🎲 새 시드로 재대결
              </button>
            </>
          )}
        </div>
      </div>

      {/* 턴별 상세 식감 로그 (클릭하면 그 턴의 ASMR 사운드 다시 듣기!) */}
      <div className="card">
        <div className="row between">
          <h2 className="title" style={{ fontSize: 17 }}>
            📜 턴별 식감 ASMR 리플레이 기록
          </h2>
          <span className="small" style={{ color: '#7A6A60' }}>
            로그를 누르면 소리가 나요!
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sim.turns.slice(0, Math.max(1, stepIdx)).map((t, idx) => {
            const isLatest = idx === stepIdx - 1
            return (
              <div
                key={idx}
                onClick={() => playDessertAsmr(t.asmr, t.hitCount ?? 1)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 14,
                  border: isLatest ? '2px solid #FF8A65' : '1px solid #F0DFB8',
                  background: isLatest ? '#FFF4EE' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>
                    [턴 {t.turn}] {t.narrative}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#D85A3A', fontWeight: 700, marginTop: 2 }}>
                    🔊 {t.onomatopoeia}
                  </div>
                </div>
                <span className="chip" style={{ fontSize: 10 }}>
                  🎧 듣기
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

