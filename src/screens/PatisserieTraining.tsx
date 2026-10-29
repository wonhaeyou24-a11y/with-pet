// M2 화면 2: 🧁 파티세리 훈련장 & 🏰 디저트 타워 무한 탐험 (원스크린 100dvh 무스크롤 덱 레이아웃)
// 1. 5대 훈련 코스: 실시간 훈련 장면 연출 + 카운트다운 타이머 후 능력치·경험치 성장
// 2. 디저트 타워 무한 탐험: 층별 권장 전투력 기반 실시간 탐사 진행 + 이벤트 로그 + 층별 돌파 보상 획득
// 3. 실시간 능력치 분포 확인

import { useEffect, useRef, useState } from 'react'
import { expForNextLevel, TRAINING_COURSES, type TrainingCourse } from '../config/care'
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

type TrainingTab = 'courses' | 'tower' | 'stats'

// 디저트 타워 층 정보 생성 헬퍼
function getTowerFloorInfo(floor: number) {
  const themes = [
    { name: '달콤 생크림 로비', enemy: '생크림 슬라임', icon: '🧁', bonusStat: '체력' },
    { name: '바사삭 카다이프 회랑', enemy: '크런치 골렘', icon: '🌾', bonusStat: '공격' },
    { name: '유리알 설탕 빙벽', enemy: '탕후루 가디언', icon: '🍓', bonusStat: '방어' },
    { name: '말랑 젤리 계곡', enemy: '소다 구미베어', icon: '🐻', bonusStat: '속도' },
    { name: '초코 퐁듀 용암 동굴', enemy: '가나슈 드래곤 (보스)', icon: '🍫', bonusStat: '지능' },
    { name: '구운 스모어 캠프', enemy: '노릇 마시멜로 킹', icon: '🔥', bonusStat: '체력' },
  ]
  const theme = themes[(floor - 1) % themes.length]
  const isBoss = floor % 5 === 0
  const reqCp = 45 + floor * 22
  const rewardExp = 25 + floor * 15
  const rewardCoins = 20 + floor * 8
  return { ...theme, floor, isBoss, reqCp, rewardExp, rewardCoins }
}

export default function PatisserieTraining({ monster, coins, onUpdate, onGoRest, onBack }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse>(TRAINING_COURSES[0])
  const [activeTab, setActiveTab] = useState<TrainingTab>('courses')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [asmrBubble, setAsmrBubble] = useState<string | null>(null)
  const [levelUpBanner, setLevelUpBanner] = useState(false)

  // 1. 파티세리 훈련 실시간 진행 상태
  const [trainingActive, setTrainingActive] = useState(false)
  const [trainTimeLeft, setTrainTimeLeft] = useState(10) // 10초 타이머
  const trainTimerRef = useRef<number | null>(null)

  // 2. 디저트 타워 무한 탐험 상태 (로컬 스토리지에 최고 층 영구 보관)
  const [towerFloor, setTowerFloor] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(`tower_floor_${monster.id}`) ?? 1)
    } catch {
      return 1
    }
  })
  const [exploring, setExploring] = useState(false)
  const [exploreTimeLeft, setExploreTimeLeft] = useState(12) // 12초 탐사
  const [exploreLog, setExploreLog] = useState<string>('탐사 대기 중')
  const exploreTimerRef = useRef<number | null>(null)

  const look = monsterLook(monster)
  const activeSpecies = look.mallang?.morphForm ?? monster.species
  const info = SPECIES_INFO[activeSpecies] ?? SPECIES_INFO[monster.species]

  const fatigue = monster.fatigue ?? 0
  const tooTired = fatigue >= 80
  const nextExp = expForNextLevel(monster.level)
  const curExp = monster.exp ?? 0
  const expPct = Math.min(100, Math.round((curExp / nextExp) * 100))

  // 몬스터 전투력 계산: 체력×0.5 + 공격 + 방어 + 속도 + 지능 + 매력×0.8
  const battlePower = Math.round(
    monster.stats.hp * 0.5 +
      monster.stats.atk +
      monster.stats.def +
      monster.stats.spd +
      monster.stats.int +
      monster.stats.cha * 0.8,
  )

  const currentFloorInfo = getTowerFloorInfo(towerFloor)

  function triggerAsmr(kind: DessertSoundKind) {
    const meta = playDessertAsmr(kind)
    setAsmrBubble(meta.onomatopoeia)
    setTimeout(() => setAsmrBubble(null), 1850)
  }

  // 훈련 타이머 관리 (Rule 6: Infinite Loop Guard)
  useEffect(() => {
    if (!trainingActive) return
    trainTimerRef.current = window.setInterval(() => {
      setTrainTimeLeft((prev) => {
        if (prev <= 1) {
          if (trainTimerRef.current) clearInterval(trainTimerRef.current)
          finishTraining()
          return 0
        }
        // 훈련 중 주기적 ASMR 재생
        if (prev % 3 === 0) {
          playDessertAsmr(selectedCourse.asmr)
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (trainTimerRef.current) clearInterval(trainTimerRef.current)
    }
  }, [trainingActive, selectedCourse])

  // 타워 탐험 타이머 관리 (Rule 6: Infinite Loop Guard)
  useEffect(() => {
    if (!exploring) return
    const logs = [
      `🏰 ${towerFloor}층 탐험 시작! 달콤한 시럽 트랩을 가볍게 통과...`,
      `💥 야생 ${currentFloorInfo.enemy} 조우! 식감 스킬로 맹공격!`,
      `✨ 수호자 격퇴 완료! 황금 보물 상자를 열어 보상을 획득하는 중...`,
    ]
    setExploreLog(logs[0])

    exploreTimerRef.current = window.setInterval(() => {
      setExploreTimeLeft((prev) => {
        if (prev <= 1) {
          if (exploreTimerRef.current) clearInterval(exploreTimerRef.current)
          finishExplore()
          return 0
        }
        if (prev === 8) {
          setExploreLog(logs[1])
          playDessertAsmr('sugar-crack', 2)
        } else if (prev === 4) {
          setExploreLog(logs[2])
          playDessertAsmr('syrup-drizzle', 2)
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (exploreTimerRef.current) clearInterval(exploreTimerRef.current)
    }
  }, [exploring, towerFloor])

  // 1. 훈련 시작
  function handleStartTraining() {
    if (tooTired || busy || trainingActive) return
    setTrainTimeLeft(10)
    setTrainingActive(true)
    triggerAsmr(selectedCourse.asmr)
  }

  // 1. 훈련 완료 처리
  async function finishTraining() {
    setTrainingActive(false)
    setBusy(true)
    const res = await callCare(monster, coins, 'train', { courseId: selectedCourse.id, grade: 'perfect' })
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

  // 2. 타워 탐사 시작
  function handleStartExplore() {
    if (tooTired || busy || exploring) return
    setExploreTimeLeft(12)
    setExploring(true)
    triggerAsmr('kataifi-crunch')
  }

  // 2. 타워 탐사 완료 처리
  async function finishExplore() {
    setExploring(false)
    const nextFloor = towerFloor + 1
    setTowerFloor(nextFloor)
    try {
      localStorage.setItem(`tower_floor_${monster.id}`, String(nextFloor))
    } catch {
      // 로컬 스토리지 실패 무시
    }

    // 경험치 및 코인 보상 지급
    const updatedExp = curExp + currentFloorInfo.rewardExp
    const updatedCoins = coins + currentFloorInfo.rewardCoins
    const updatedFatigue = Math.min(100, fatigue + 18)
    const nextExpGoal = expForNextLevel(monster.level)
    const leveledUp = updatedExp >= nextExpGoal
    const nextMonster: MonsterRow = {
      ...monster,
      exp: leveledUp ? updatedExp - nextExpGoal : updatedExp,
      level: leveledUp ? monster.level + 1 : monster.level,
      sp: leveledUp ? (monster.sp ?? 0) + 1 : monster.sp,
      fatigue: updatedFatigue,
      care_counts: {
        ...(monster.care_counts ?? {}),
        tower: (monster.care_counts?.tower ?? 0) + 1,
      },
    }
    onUpdate(nextMonster, updatedCoins, {})
    playDessertAsmr('wax-pop', 3)
    setToast(`🎉 ${towerFloor}층 돌파 성공! EXP +${currentFloorInfo.rewardExp} · 🪙 +${currentFloorInfo.rewardCoins} 코인 획득!`)
    if (leveledUp) {
      setLevelUpBanner(true)
      setTimeout(() => setLevelUpBanner(false), 4000)
    }
    setTimeout(() => setToast(null), 4000)
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
        <h1 className="title" style={{ fontSize: 17 }}>🧁 훈련 & 🏰 타워 탐험</h1>
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
              전투력 ⚔️ {battlePower}
            </span>
          </div>
          <span className="chip" style={{ fontSize: 12, padding: '3px 8px' }}>
            {personalityLabel(monster.personality_active, monster.personality_bond)}
          </span>
        </div>

        {/* 3D 캐릭터 훈련 연출 스테이지 */}
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
          {trainingActive && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 10,
                zIndex: 10,
                padding: '4px 10px',
                borderRadius: 999,
                background: '#FF7A59',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(255,122,89,0.3)',
              }}
            >
              🏋️ 훈련 중… {trainTimeLeft}초 남음!
            </div>
          )}
          {exploring && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 10,
                zIndex: 10,
                padding: '4px 10px',
                borderRadius: 999,
                background: '#7C4DFF',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(124,77,255,0.3)',
              }}
            >
              🏰 {towerFloor}층 탐사 중… {exploreTimeLeft}초!
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

      {/* 하단 원스크린 3대 덱: 훈련 코스 / 디저트 타워 무한 탐험 / 실시간 능력치 */}
      <div className="card deck-card" style={{ padding: '10px 12px', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 5, flexShrink: 0 }}>
          <button
            onClick={() => setActiveTab('courses')}
            style={{
              padding: '8px 4px',
              borderRadius: 12,
              border: activeTab === 'courses' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: activeTab === 'courses' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🧁 5대 훈련 코스
          </button>
          <button
            onClick={() => setActiveTab('tower')}
            style={{
              padding: '8px 4px',
              borderRadius: 12,
              border: activeTab === 'tower' ? '2px solid #7C4DFF' : '1.5px solid #F0DFB8',
              background: activeTab === 'tower' ? '#F3E8FF' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🏰 디저트 타워
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '8px 4px',
              borderRadius: 12,
              border: activeTab === 'stats' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: activeTab === 'stats' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            📊 능력치 ({totalStats(monster.stats)})
          </button>
        </div>

        {/* 탭 1: 파티세리 5대 훈련 코스 (리얼 훈련 진행 장면) */}
        {activeTab === 'courses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 5 }}>
              {TRAINING_COURSES.map((course) => {
                const isSelected = selectedCourse.id === course.id
                return (
                  <button
                    key={course.id}
                    onClick={() => {
                      if (!trainingActive) {
                        setSelectedCourse(course)
                        triggerAsmr(course.asmr)
                      }
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
                      cursor: trainingActive ? 'not-allowed' : 'pointer',
                      opacity: trainingActive && !isSelected ? 0.5 : 1,
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

            {trainingActive ? (
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
                <div style={{ fontSize: 14, fontWeight: 900, color: '#D85A3A' }}>
                  🏋️ [{selectedCourse.name}] 훈련 진행 중! (남은 시간: {trainTimeLeft}초)
                </div>
                <div style={{ fontSize: 12, color: '#5D4037' }}>
                  디저트 친구가 열심히 훈련하고 있어요! 땀방울과 식감 ASMR이 퐁퐁 솟아나요!
                </div>
                <div style={{ height: 10, borderRadius: 999, background: '#E8D8B8', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.round(((10 - trainTimeLeft) / 10) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #FF7A59, #FFB74D)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <button
                  className="chip honey"
                  onClick={() => setTrainTimeLeft(1)}
                  style={{ cursor: 'pointer', border: 'none', alignSelf: 'center', fontWeight: 800, fontSize: 12 }}
                >
                  ⚡ 즉시 완료하기
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
                  <button
                    className="btn"
                    disabled={busy || trainingActive}
                    onClick={handleStartTraining}
                    style={{ padding: '10px', fontSize: 13, width: '100%' }}
                  >
                    ⚡ 훈련 시작하기 (10초 소요 · 코인 및 능력치 성장)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 탭 2: 🏰 디저트 타워 무한 탐험 (기획서 기반 무한 층 도전) */}
        {activeTab === 'tower' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 18,
                background: currentFloorInfo.isBoss ? 'linear-gradient(180deg, #FFF0EE 0%, #FFEBE6 100%)' : '#F9F5FF',
                border: currentFloorInfo.isBoss ? '2px solid #E53935' : '1.5px solid #C4B5FD',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 6,
                flex: 1,
              }}
            >
              <div className="row between">
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontSize: 28 }}>{currentFloorInfo.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#3B2F2F' }}>
                      🏰 디저트 타워 {towerFloor}층 {currentFloorInfo.isBoss ? '🔥 [보스 층]' : ''}
                    </div>
                    <div style={{ fontSize: 12, color: '#7C4DFF', fontWeight: 800 }}>
                      {currentFloorInfo.name} · 수호자: {currentFloorInfo.enemy}
                    </div>
                  </div>
                </div>
                <span className="chip honey" style={{ fontSize: 12, fontWeight: 900 }}>
                  권장 ⚔️ {currentFloorInfo.reqCp}
                </span>
              </div>

              {exploring ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center', padding: '6px 0' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#7C4DFF' }}>
                    {exploreLog} ({exploreTimeLeft}초 남음)
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: '#E0D4FC', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.round(((12 - exploreTimeLeft) / 12) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #7C4DFF, #B388FF)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <button
                    className="chip honey"
                    onClick={() => setExploreTimeLeft(1)}
                    style={{ cursor: 'pointer', border: 'none', alignSelf: 'center', fontWeight: 800, fontSize: 12 }}
                  >
                    ⚡ 탐사 즉시 완료
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#5D4037', lineHeight: 1.35 }}>
                  내 전투력(<strong>{battlePower}</strong>)이 권장 전투력(<strong>{currentFloorInfo.reqCp}</strong>)을 넘을수록 수월하게 돌파합니다.
                  <br />
                  돌파 시 <strong>EXP +{currentFloorInfo.rewardExp}</strong>, <strong>🪙 +{currentFloorInfo.rewardCoins} 코인</strong>, 훈장을 획득합니다!
                </div>
              )}

              {tooTired ? (
                <div className="row between" style={{ background: '#FFF0EE', padding: '8px 10px', borderRadius: 12, border: '1px dashed #D9534F' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#D9534F' }}>💤 노곤함 80 이상! 휴식이 필요해요</span>
                  <button className="btn mint" onClick={onGoRest} style={{ padding: '6px 10px', fontSize: 12 }}>
                    🌙 휴식하기
                  </button>
                </div>
              ) : (
                <button
                  className="btn"
                  disabled={busy || exploring}
                  onClick={handleStartExplore}
                  style={{
                    padding: '10px',
                    fontSize: 13,
                    width: '100%',
                    background: 'linear-gradient(180deg, #7C4DFF 0%, #651FFF 100%)',
                    boxShadow: '0 4px 0 #4527A0',
                  }}
                >
                  {exploring ? '🏰 층 탐사 진행 중…' : `⚔️ ${towerFloor}층 탐험 출발 (12초 소요)`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 탭 3: 실시간 능력치 */}
        {activeTab === 'stats' && (
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
