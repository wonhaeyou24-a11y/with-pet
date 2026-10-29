// M2 화면 2: 🧁 파티세리 훈련장 & 오븐 타이밍 미니게임 (5종 능력치 육성 및 레벨업)
// 크런치 토핑 다지기(공격), 슈가코팅 경화(방어), 휩핑 질주(속도), 레시피 연구(지능/매력), 황금 오븐 버티기(체력)
// 5종 훈련을 통해 능력치와 경험치를 올리고 레벨업 및 성격 변화를 이끌어냅니다.

import { useEffect, useRef, useState } from 'react'
import { evoStageLabel, expForNextLevel, TRAINING_COURSES, type TrainingCourse, type TrainingId } from '../config/care'
import { personalityLabel, SPECIES_INFO, STAT_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { callCare } from '../lib/careApi'
import { playDessertAsmr, type DessertSoundKind } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { BackIcon } from '../ui/Icons'
import { Nest, StatBars, totalStats } from '../ui/parts'

interface Props {
  monster: MonsterRow
  coins: number
  onUpdate: (nextMonster: MonsterRow, nextCoins: number, nextBag: Record<string, number>) => void
  onGoRest: () => void
  onBack: () => void
}

export default function PatisserieTraining({ monster, coins, onUpdate, onGoRest, onBack }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse>(TRAINING_COURSES[0])
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

  return (
    <main className="screen">
      {/* 상단 바 */}
      <div className="row between">
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title">🧁 파티세리 훈련장</h1>
        <span className="chip honey" style={{ fontWeight: 800 }}>
          🪙 {coins} 코인
        </span>
      </div>

      {/* 레벨업 축하 배너 */}
      {levelUpBanner && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 18,
            background: 'linear-gradient(90deg, #FF7A59 0%, #FFB74D 100%)',
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: 13,
            textAlign: 'center',
            boxShadow: '0 6px 18px rgba(255, 122, 89, 0.35)',
          }}
        >
          🎉 축하해요! [{monster.name}] 친구가 Lv.{monster.level}로 레벨업했어요! (전 능력치 성장 & SP +1)
        </div>
      )}

      {/* 상단 스테이지 & 경험치·노곤함 요약 카드 */}
      <div className="card" style={{ paddingBottom: 14 }}>
        <div className="row wrap between" style={{ gap: 6 }}>
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="chip coral">Lv.{monster.level} {monster.name}</span>
            <span className="chip" style={{ fontSize: 11 }}>{evoStageLabel(monster.level)}</span>
          </div>
          <span className="chip" style={{ fontSize: 11 }}>
            성격: {personalityLabel(monster.personality_active, monster.personality_bond)}
          </span>
        </div>

        <div
          className="stage"
          style={{ alignItems: 'center', position: 'relative', minHeight: 165, cursor: 'pointer' }}
          onClick={() => triggerAsmr(selectedCourse.asmr)}
        >
          {asmrBubble && (
            <div
              style={{
                position: 'absolute',
                top: 2,
                zIndex: 10,
                padding: '6px 14px',
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
            <MonsterView look={look} size={160} title={info?.name} />
          </div>
          <Nest width={190} lift={32} front={false} dessertBase={look.mallang?.dessertBase} />
        </div>

        {/* 레벨 경험치 바 & 노곤함(피로도) 게이지 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <div style={{ padding: '8px 10px', borderRadius: 16, background: '#FFFBF2', border: '1.5px solid #F0DFB8' }}>
            <div className="row between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#3B2F2F' }}>⭐ 성장 경험치</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#FF7A59' }}>
                {curExp}/{nextExp}
              </span>
            </div>
            <div style={{ height: 9, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
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
              padding: '8px 10px',
              borderRadius: 16,
              background: tooTired ? '#FFF0EE' : '#FFFBF2',
              border: tooTired ? '1.5px solid #D9534F' : '1.5px solid #F0DFB8',
            }}
          >
            <div className="row between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#3B2F2F' }}>💤 노곤함 (피로)</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: tooTired ? '#D9534F' : '#3B2F2F' }}>
                {fatigue}/100 {tooTired ? '(휴식 필요!)' : ''}
              </span>
            </div>
            <div style={{ height: 9, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
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

        {/* 오븐 타이밍 미니게임 모달/패널 */}
        {miniGameActive && (
          <div
            style={{
              marginTop: 8,
              padding: '12px 14px',
              borderRadius: 20,
              background: 'linear-gradient(180deg, #FFF9F0 0%, #FFEED6 100%)',
              border: '2px solid #FF8A65',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: '#3B2F2F', marginBottom: 6 }}>
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
                marginBottom: 10,
              }}
            >
              {/* GREAT 구간 (22% ~ 78%) */}
              <div
                style={{
                  position: 'absolute',
                  left: '22%',
                  width: '56%',
                  top: 0,
                  bottom: 0,
                  background: '#FFE082',
                }}
              />
              {/* PERFECT 구간 (38% ~ 62%) */}
              <div
                style={{
                  position: 'absolute',
                  left: '38%',
                  width: '24%',
                  top: 0,
                  bottom: 0,
                  background: '#FF7A59',
                }}
              />
              {/* 움직이는 포인터 */}
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
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}
              />
            </div>
            <button className="btn block" onClick={handleStopMiniGame} style={{ fontSize: 14 }}>
              🎯 지금 스톱! (PERFECT 판정 도전)
            </button>
          </div>
        )}

        {toast && (
          <div
            style={{
              marginTop: 6,
              padding: '9px 12px',
              borderRadius: 14,
              background: '#E8F8F0',
              border: '1.5px solid #4CAF6A',
              color: '#177051',
              fontSize: 12,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {toast}
          </div>
        )}
      </div>

      {/* 파티세리 5종 훈련 코스 선택 카드 */}
      <div className="card">
        <div className="row between">
          <h2 className="title" style={{ fontSize: 18 }}>
            🧁 파티세리 5대 훈련 코스
          </h2>
          <span className="small" style={{ color: '#7A6A60', fontWeight: 700 }}>
            1회 노곤함 +15
          </span>
        </div>

        {tooTired && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 16,
              background: '#FFF0EE',
              border: '1.5px dashed #D9534F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: '#D9534F' }}>
              💤 노곤함이 80 이상이라 휴식이 필요해요!
            </span>
            <button className="btn mint" onClick={onGoRest} style={{ padding: '6px 12px', fontSize: 11 }}>
              🌙 휴식하러 가기
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TRAINING_COURSES.map((course) => {
            const isSelected = selectedCourse.id === course.id
            const doneCount = monster.care_counts?.[course.id] ?? 0
            return (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                style={{
                  padding: '11px 12px',
                  borderRadius: 18,
                  border: isSelected ? '2.5px solid #FF7A59' : '1.5px solid #F0DFB8',
                  background: isSelected ? '#FFF4EE' : '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <div className="row between">
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{course.icon}</span>
                    <div>
                      <div className="row wrap" style={{ gap: 6 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: '#3B2F2F' }}>{course.name}</span>
                        <span className="chip" style={{ fontSize: 10, padding: '2px 7px' }}>
                          {course.subtitle} · 누적 {doneCount}회
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#D85A3A', fontWeight: 800, marginTop: 2 }}>
                        {statNameMap[course.mainStat]} +{course.mainGain}
                        {course.subStat ? ` · ${statNameMap[course.subStat]} +${course.subGain}` : ''} · {course.personalityLabel}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#7A6A60' }}>{course.desc}</div>

                {isSelected && (
                  <div className="grid-2" style={{ marginTop: 4 }}>
                    <button
                      className="btn mint"
                      disabled={busy || tooTired}
                      onClick={(e) => {
                        e.stopPropagation()
                        executeTraining(course.id, 'great', course.asmr)
                      }}
                      style={{ padding: '9px 10px', fontSize: 12 }}
                    >
                      ⚡ 바로 훈련 (+{course.coinGain + 5}코인)
                    </button>
                    <button
                      className="btn"
                      disabled={busy || tooTired}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartMiniGame()
                      }}
                      style={{ padding: '9px 10px', fontSize: 12 }}
                    >
                      🎯 오븐 타이밍 (보너스 도전!)
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 현재 능력치 성장 그래프 */}
      <div className="card">
        <div className="row between">
          <h2 className="title" style={{ fontSize: 18 }}>
            📊 실시간 능력치 <span className="chip" style={{ fontSize: 12, marginLeft: 4 }}>총점 {totalStats(monster.stats)}</span>
          </h2>
          <span className="chip honey" style={{ fontSize: 11 }}>
            보유 SP: {monster.sp ?? 0}
          </span>
        </div>
        <StatBars stats={monster.stats} />
      </div>
    </main>
  )
}

