// M2 화면 2: 🧁 파티세리 훈련장 & 오븐 타이밍 미니게임 (원스크린 100dvh 무스크롤 덱 레이아웃)
// 크런치 토핑 다지기(공격), 슈가코팅 경화(방어), 휩핑 질주(속도), 레시피 연구(지능/매력), 황금 오븐 버티기(체력)
// 5종 훈련 코스와 오븐 타이밍 미니게임을 스크롤 없이 한 화면에서 진행합니다.

import { useEffect, useRef, useState } from 'react'
import { evoStageLabel, expForNextLevel, TRAINING_COURSES, type TrainingCourse, type TrainingId } from '../config/care'
import { personalityLabel, SPECIES_INFO, STAT_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { callCare } from '../lib/careApi'
import { playDessertAsmr, type DessertSoundKind } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { BackIcon } from '../ui/Icons'
import { StatBars, totalStats } from '../ui/parts'

interface Props {
  monster: MonsterRow
  coins: number
  onUpdate: (nextMonster: MonsterRow, nextCoins: number, nextBag: Record<string, number>) => void
  onGoRest: () => void
  onBack: () => void
}

export default function PatisserieTraining({ monster, coins, onUpdate, onGoRest, onBack }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse>(TRAINING_COURSES[0])
  const [subTab, setSubTab] = useState<'courses' | 'stats'>('courses')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [asmrBubble, setAsmrBubble] = useState<string | null>(null)
  const [levelUpBanner, setLevelUpBanner] = useState(false)

  // 오븐 스위트 스팟 타이밍 미니게임 상태 (무한 루프 방지를 위해 최대 12초 후 자동 정지)
  const [miniGameActive, setMiniGameActive] = useState(false)
  const [cursorPos, setCursorPos] = useState(50) // 0 ~ 100
  const dirRef = useRef<1 | -1>(1)
  const posRef = useRef(10)

  const look = monsterLook(monster)
  const activeSpecies = look.mallang?.morphForm ?? monster.species
  const info = SPECIES_INFO[activeSpecies] ?? SPECIES_INFO[monster.species]

  const fatigue = monster.fatigue ?? 0
  const tooTired = fatigue >= 80
  const nextExp = expForNextLevel(monster.level)
  const curExp = monster.exp ?? 0
  const expPct = Math.min(100, Math.round((curExp / nextExp) * 100))

  useEffect(() => {
    if (!miniGameActive) return
    let ticks = 0
    const maxTicks = 400 // 최대 약 12초 가드 (Rule 6: Infinite Loop Guard)
    const timer = window.setInterval(() => {
      ticks += 1
      if (ticks >= maxTicks) {
        setMiniGameActive(false)
        return
      }
      let next = posRef.current + dirRef.current * 4.2
      if (next >= 96) {
        next = 96
        dirRef.current = -1
      } else if (next <= 4) {
        next = 4
        dirRef.current = 1
      }
      posRef.current = next
      setCursorPos(Math.round(next))
    }, 30)

    return () => window.clearInterval(timer)
  }, [miniGameActive])

  function triggerAsmr(kind: DessertSoundKind) {
    const meta = playDessertAsmr(kind)
    setAsmrBubble(meta.onomatopoeia)
    setTimeout(() => setAsmrBubble(null), 1850)
  }

  async function executeTraining(courseId: TrainingId, grade: 'normal' | 'great' | 'perfect', asmr: DessertSoundKind) {
    if (busy) return
    setBusy(true)
    setMiniGameActive(false)
    triggerAsmr(asmr)
    const res = await callCare(monster, coins, 'train', { courseId, grade })
    setBusy(false)
    if (res.ok && res.monster && res.foodBag !== undefined && res.coins !== undefined) {
      onUpdate(res.monster, res.coins, res.foodBag)
    }
    if (res.leveledUp) {
      setLevelUpBanner(true)
      setTimeout(() => setLevelUpBanner(false), 4000)
    }
    if (res.message) {
      setToast(res.message)
      setTimeout(() => setToast(null), 3500)
    }
  }

  function handleStartMiniGame() {
    if (tooTired || busy) return
    posRef.current = 8
    dirRef.current = 1
    setCursorPos(8)
    setMiniGameActive(true)
  }

  function handleStopMiniGame() {
    if (!miniGameActive) return
    const pos = posRef.current
    // 황금 오븐 스위트 스팟: 38 ~ 62 구간은 PERFECT, 22 ~ 78 구간은 GREAT
    const grade: 'normal' | 'great' | 'perfect' = pos >= 38 && pos <= 62 ? 'perfect' : pos >= 22 && pos <= 78 ? 'great' : 'normal'
    executeTraining(selectedCourse.id, grade, selectedCourse.asmr)
  }

  const statNameMap = Object.fromEntries(STAT_INFO.map((s) => [s.key, s.label]))
  const doneCount = monster.care_counts?.[selectedCourse.id] ?? 0

  return (
    <main className="screen">
      {/* 상단 바 */}
      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 17 }}>🧁 파티세리 훈련장</h1>
        <span className="chip honey" style={{ fontWeight: 800, fontSize: 12 }}>
          🪙 {coins} 코인
        </span>
      </div>

      {/* 상단 3D 스테이지 & 경험치·노곤함 요약 카드 */}
      <div className="card" style={{ padding: '10px 12px', gap: 6, flexShrink: 0 }}>
        <div className="row wrap between" style={{ gap: 4 }}>
          <div className="row wrap" style={{ gap: 4 }}>
            <span className="chip coral" style={{ fontSize: 12, padding: '3px 8px' }}>
              Lv.{monster.level} {monster.name}
            </span>
            <span className="chip" style={{ fontSize: 12, padding: '3px 8px' }}>
              {evoStageLabel(monster.level)}
            </span>
          </div>
          <span className="chip" style={{ fontSize: 12, padding: '3px 8px' }}>
            {personalityLabel(monster.personality_active, monster.personality_bond)}
          </span>
        </div>

        <div
          className="stage"
          style={{ alignItems: 'center', position: 'relative', height: 154, minHeight: 154, padding: 2, cursor: 'pointer' }}
          onClick={() => triggerAsmr(selectedCourse.asmr)}
        >
          {asmrBubble && (
            <div
              style={{
                position: 'absolute',
                top: 4,
                zIndex: 10,
                padding: '5px 12px',
                borderRadius: 999,
                background: '#3B2F2F',
                color: '#FFFDF9',
                fontSize: 12,
                fontWeight: 800,
                boxShadow: '0 6px 16px rgba(59,47,47,0.22)',
                pointerEvents: 'none',
              }}
            >
              🔊 {asmrBubble}
            </div>
          )}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <MonsterView look={look} size={148} title={info?.name} />
          </div>
        </div>

        {/* 레벨 경험치 바 & 노곤함(피로도) 게이지 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
          <div style={{ padding: '6px 8px', borderRadius: 12, background: '#FFFBF2', border: '1px solid #F0DFB8' }}>
            <div className="row between" style={{ marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>⭐ 성장 EXP</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#FF7A59' }}>
                {curExp}/{nextExp}
              </span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${expPct}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #FF8A65, #FAD36E)',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '6px 8px',
              borderRadius: 12,
              background: tooTired ? '#FFF0EE' : '#FFFBF2',
              border: tooTired ? '1.5px solid #D9534F' : '1px solid #F0DFB8',
            }}
          >
            <div className="row between" style={{ marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>💤 노곤함</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: tooTired ? '#D9534F' : '#3B2F2F' }}>
                {fatigue}/100
              </span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, fatigue)}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: tooTired ? '#D9534F' : '#9575CD',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>
        </div>

        {(levelUpBanner || toast) && (
          <div
            style={{
              padding: '5px 10px',
              borderRadius: 10,
              background: levelUpBanner ? 'linear-gradient(90deg, #FF7A59 0%, #FFB74D 100%)' : '#E8F8F0',
              border: levelUpBanner ? 'none' : '1.5px solid #4CAF6A',
              color: levelUpBanner ? '#FFFFFF' : '#177051',
              fontSize: 12,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {levelUpBanner
              ? `🎉 축하해요! Lv.${monster.level} 레벨업! (전 능력치 +1 & SP +1)`
              : toast}
          </div>
        )}
      </div>

      {/* 하단 원스크린 훈련 코스 & 실시간 능력치 덱 */}
      <div className="card deck-card" style={{ padding: '10px 12px', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setSubTab('courses')}
            style={{
              padding: '8px 6px',
              borderRadius: 12,
              border: subTab === 'courses' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: subTab === 'courses' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🧁 5대 훈련 코스
          </button>
          <button
            onClick={() => setSubTab('stats')}
            style={{
              padding: '8px 6px',
              borderRadius: 12,
              border: subTab === 'stats' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: subTab === 'stats' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            📊 능력치 (총점 {totalStats(monster.stats)})
          </button>
        </div>

        {subTab === 'courses' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
            {/* 5종 훈련 코스 가로 알약 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 5 }}>
              {TRAINING_COURSES.map((course) => {
                const isSelected = selectedCourse.id === course.id
                return (
                  <button
                    key={course.id}
                    onClick={() => {
                      setSelectedCourse(course)
                      setMiniGameActive(false)
                      triggerAsmr(course.asmr)
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 14,
                      border: isSelected ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                      background: isSelected ? '#FFF2EC' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{course.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>
                      {statNameMap[course.mainStat]}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 오븐 타이밍 미니게임 작동 중이거나 선택된 코스 상세 카드 */}
            {miniGameActive ? (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 18,
                  background: 'linear-gradient(180deg, #FFF9F0 0%, #FFEED6 100%)',
                  border: '2px solid #FF8A65',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 8,
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 900, color: '#3B2F2F' }}>
                  🔥 황금 오븐 스위트 스팟(가운데 주황 구간)에서 [지금 스톱!]을 누르세요!
                </div>
                <div
                  style={{
                    position: 'relative',
                    height: 22,
                    borderRadius: 999,
                    background: '#E8D8B8',
                    overflow: 'hidden',
                    border: '2px solid #3B2F2F',
                  }}
                >
                  <div style={{ position: 'absolute', left: '22%', width: '56%', top: 0, bottom: 0, background: '#FFE082' }} />
                  <div style={{ position: 'absolute', left: '38%', width: '24%', top: 0, bottom: 0, background: '#FF7A59' }} />
                  <div
                    style={{
                      position: 'absolute',
                      left: `calc(${cursorPos}% - 6px)`,
                      top: -2,
                      bottom: -2,
                      width: 12,
                      borderRadius: 6,
                      background: '#FFFFFF',
                      border: '3px solid #3B2F2F',
                    }}
                  />
                </div>
                <button className="btn block" onClick={handleStopMiniGame} style={{ fontSize: 13, padding: '10px' }}>
                  🎯 지금 스톱! (PERFECT 판정 도전)
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 18,
                  border: '2px solid #FF7A59',
                  background: '#FFF8F4',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 6,
                  flex: 1,
                }}
              >
                <div className="row between">
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ fontSize: 28 }}>{selectedCourse.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#3B2F2F' }}>{selectedCourse.name}</div>
                      <div style={{ fontSize: 12, color: '#D85A3A', fontWeight: 800 }}>
                        {statNameMap[selectedCourse.mainStat]} +{selectedCourse.mainGain}
                        {selectedCourse.subStat ? ` · ${statNameMap[selectedCourse.subStat]} +${selectedCourse.subGain}` : ''} · {selectedCourse.personalityLabel}
                      </div>
                    </div>
                  </div>
                  <span className="chip" style={{ fontSize: 12 }}>
                    누적 {doneCount}회
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#6E5D53', lineHeight: 1.35 }}>{selectedCourse.desc}</div>

                {tooTired ? (
                  <div className="row between" style={{ background: '#FFF0EE', padding: '8px 10px', borderRadius: 12, border: '1px dashed #D9534F' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#D9534F' }}>💤 노곤함 80 이상! 휴식이 필요해요</span>
                    <button className="btn mint" onClick={onGoRest} style={{ padding: '6px 10px', fontSize: 12 }}>
                      🌙 휴식하기
                    </button>
                  </div>
                ) : (
                  <div className="grid-2" style={{ gap: 6 }}>
                    <button
                      className="btn mint"
                      disabled={busy}
                      onClick={() => executeTraining(selectedCourse.id, 'great', selectedCourse.asmr)}
                      style={{ padding: '10px 8px', fontSize: 12 }}
                    >
                      ⚡ 바로 훈련 (+{selectedCourse.coinGain + 5}코인)
                    </button>
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={handleStartMiniGame}
                      style={{ padding: '10px 8px', fontSize: 12 }}
                    >
                      🎯 오븐 타이밍 도전!
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, gap: 6 }}>
            <div className="row between">
              <span style={{ fontSize: 13, fontWeight: 800, color: '#3B2F2F' }}>
                📊 6대 능력치 성장 분포
              </span>
              <span className="chip honey" style={{ fontSize: 12 }}>
                보유 SP: {monster.sp ?? 0}
              </span>
            </div>
            <StatBars stats={monster.stats} compact />
          </div>
        )}
      </div>
    </main>
  )
}
