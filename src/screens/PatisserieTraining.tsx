// M2 화면 2: 🧁 파티세리 훈련장 & 🏰 디저트 타워 무한 탐험 (원스크린 100dvh 무스크롤 덱 레이아웃)
// 1. 5대 훈련 코스: 실시간 훈련 장면 연출 + 카운트다운 타이머 후 능력치·경험치 성장
// 2. 디저트 타워 무한 탐험: 층별 권장 전투력 기반 실시간 탐사 진행 + 이벤트 로그 + 층별 돌파 보상 획득
// 3. 실시간 능력치 분포 확인

import { useEffect, useRef, useState } from 'react'
import { addRibbonCoins } from '../config/boutique'
import { expForNextLevel, TRAINING_COURSES, type TrainingCourse } from '../config/care'
import { recordMissionAction } from '../config/missions'
import { personalityLabel, SPECIES_INFO, STAT_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { callCare } from '../lib/careApi'
import {
  clearTowerSession,
  clearTrainingSession,
  getActiveTowerSession,
  getActiveTrainingSession,
  startTowerExpedition,
  startTrainingSession,
  syncTowerProgress,
  type TowerExpeditionSession,
  type TrainingSession,
} from '../lib/idleActivity'
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
  const [fastMode, setFastMode] = useState(false) // 테스트 편의용 쾌속 모드(10초) 토글

  // 1. 파티세리 훈련 실시간 백그라운드 진행 상태
  const [trainSession, setTrainSession] = useState<TrainingSession | null>(() => getActiveTrainingSession(monster.id))
  const [trainTimeLeft, setTrainTimeLeft] = useState<number>(() => {
    const sess = getActiveTrainingSession(monster.id)
    if (!sess) return 0
    return Math.max(0, Math.ceil((sess.finishAt - Date.now()) / 1000))
  })
  const trainTimerRef = useRef<number | null>(null)
  const [liveActionPhase, setLiveActionPhase] = useState<number>(0) // 훈련/타워 실시간 액션 틱 (0, 1, 2, 3)

  // 2. 디저트 타워 무한 탐험 상태 (로컬 스토리지에 최고 층 영구 보관)
  const [towerFloor, setTowerFloor] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(`tower_floor_${monster.id}`) ?? 1)
    } catch {
      return 1
    }
  })
  const [towerSession, setTowerSession] = useState<TowerExpeditionSession | null>(() => {
    const sess = getActiveTowerSession(monster.id)
    if (sess) {
      const syn = syncTowerProgress(sess)
      return syn.session
    }
    return null
  })
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

  // 1. 훈련 타이머 관리 (현실 시간 백그라운드 동기화)
  useEffect(() => {
    if (!trainSession) return

    const updateTimer = () => {
      const left = Math.max(0, Math.ceil((trainSession.finishAt - Date.now()) / 1000))
      setTrainTimeLeft(left)
      setLiveActionPhase((p) => (p + 1) % 4)
      if (left <= 0) {
        if (trainTimerRef.current) clearInterval(trainTimerRef.current)
      } else if (left % 3 === 0) {
        playDessertAsmr(trainSession.asmr)
      }
    }

    updateTimer()
    trainTimerRef.current = window.setInterval(updateTimer, 1000)

    return () => {
      if (trainTimerRef.current) clearInterval(trainTimerRef.current)
    }
  }, [trainSession])

  // 2. 디저트 타워 무한 탐험 타이머 관리 (전투력 비례 실시간 등반 & 오프라인 동기화)
  useEffect(() => {
    if (!towerSession) return

    const updateTower = () => {
      const syn = syncTowerProgress(towerSession)
      setTowerSession({ ...syn.session })
      if (syn.floorsCleared > 0) {
        setExploreLog(syn.session.logs[syn.session.logs.length - 1] ?? '탐사 진행 중')
      }
      if (syn.isDone) {
        if (exploreTimerRef.current) clearInterval(exploreTimerRef.current)
      }
    }

    updateTower()
    exploreTimerRef.current = window.setInterval(updateTower, 1000)

    return () => {
      if (exploreTimerRef.current) clearInterval(exploreTimerRef.current)
    }
  }, [towerSession])

  // 1. 훈련 시작 (현실 시간 세션 등록)
  function handleStartTraining() {
    if (tooTired || busy || (trainSession && trainTimeLeft > 0)) return
    const duration = fastMode ? 10 : undefined
    const sess = startTrainingSession(monster.id, selectedCourse, duration)
    setTrainSession(sess)
    setTrainTimeLeft(sess.durationSec)
    triggerAsmr(selectedCourse.asmr)
    setToast(`💪 "${selectedCourse.name}" 훈련 시작! 화면을 닫거나 나가도 현실 시간으로 계속 훈련해요.`)
    setTimeout(() => setToast(null), 3000)
  }

  // 1. 훈련 완료 및 보상 수령
  async function finishTraining() {
    if (!trainSession) return
    setBusy(true)
    const courseId = trainSession.courseId
    const res = await callCare(monster, coins, 'train', { courseId, grade: 'perfect' })
    setBusy(false)
    clearTrainingSession(monster.id)
    setTrainSession(null)
    setTrainTimeLeft(0)

    if (res.ok && res.monster && res.foodBag !== undefined && res.coins !== undefined) {
      onUpdate(res.monster, res.coins, res.foodBag)
      addRibbonCoins(15, '파티세리 훈련 완료')
      recordMissionAction('d-train', 1)
    }
    if (res.leveledUp) {
      setLevelUpBanner(true)
      setTimeout(() => setLevelUpBanner(false), 4000)
    }
    if (res.message) {
      setToast(`🎉 훈련 완료! ${res.message} (🎀 +15 리본 코인)`)
      setTimeout(() => setToast(null), 3500)
    }
    playDessertAsmr('sugar-crack', 3)
  }

  // 2. 타워 탐사 시작 (전투력 비례 자율 탐험 출발)
  function handleStartExplore() {
    if (tooTired || busy || towerSession) return
    const sess = startTowerExpedition(monster.id, towerFloor, battlePower, 3)
    setTowerSession(sess)
    triggerAsmr('kataifi-crunch')
    setToast(`🏰 ${towerFloor}층~${sess.targetFloor}층 탐험 출발! 앱을 꺼도 펫이 스스로 층을 돌파해요.`)
    setTimeout(() => setToast(null), 3500)
  }

  // 2. 타워 탐사 완료 및 전리품 일괄 수령
  async function finishExplore() {
    if (!towerSession) return
    const syn = syncTowerProgress(towerSession)
    const floorsCleared = Math.max(1, syn.floorsCleared)
    const newFloor = towerSession.startFloor + floorsCleared

    setTowerFloor(newFloor)
    try {
      localStorage.setItem(`tower_floor_${monster.id}`, String(newFloor))
    } catch {
      // 무시
    }

    clearTowerSession(monster.id)
    setTowerSession(null)

    // 누적 보상 계산 (돌파한 층수만큼 합산)
    let totalExpGain = 0
    let totalCoinsGain = 0
    for (let f = towerSession.startFloor; f < newFloor; f++) {
      const finf = getTowerFloorInfo(f)
      totalExpGain += finf.rewardExp
      totalCoinsGain += finf.rewardCoins
    }

    const updatedExp = curExp + totalExpGain
    const updatedCoins = coins + totalCoinsGain
    const updatedFatigue = Math.min(100, fatigue + floorsCleared * 12)
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
        tower: (monster.care_counts?.tower ?? 0) + floorsCleared,
      },
    }

    const ribbonEarned = floorsCleared * 20
    addRibbonCoins(ribbonEarned, '타워 탐험 돌파 보상')
    recordMissionAction('w-tower', floorsCleared)
    onUpdate(nextMonster, updatedCoins, {})
    playDessertAsmr('wax-pop', 3)
    setToast(`🏰 ${floorsCleared}개 층 돌파 복귀 완료! EXP +${totalExpGain} · 🪙 +${totalCoinsGain} 코인 · 🎀 +${ribbonEarned} 리본 획득!`)
    setTimeout(() => setToast(null), 4000)
    if (leveledUp) {
      setLevelUpBanner(true)
      setTimeout(() => setLevelUpBanner(false), 4000)
    }
  }

  const statNameMap = Object.fromEntries(STAT_INFO.map((s) => [s.key, s.label]))

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
      }}
    >
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

        {/* 3D 캐릭터 스테이지 & 실시간 훈련/타워 탐험 액션 연출 뷰 (공간 확장) */}
        <div
          className="stage"
          style={{
            alignItems: 'center',
            position: 'relative',
            height: 182,
            minHeight: 182,
            padding: 2,
            cursor: 'pointer',
            background: trainSession
              ? 'linear-gradient(180deg, #FFF3E0 0%, #FFE0B2 100%)'
              : towerSession
                ? 'linear-gradient(180deg, #EDE7F6 0%, #D1C4E9 100%)'
                : undefined,
            overflow: 'hidden',
          }}
          onClick={() => triggerAsmr(selectedCourse.asmr)}
        >
          {asmrBubble && (
            <div
              style={{
                position: 'absolute',
                top: 4,
                zIndex: 10,
                padding: '4px 10px',
                borderRadius: 999,
                background: '#3B2F2F',
                color: '#FFFDF9',
                fontSize: 11,
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(59,47,47,0.22)',
                pointerEvents: 'none',
              }}
            >
              🔊 {asmrBubble}
            </div>
          )}

          {/* 1. 훈련 진행 중일 때: 실시간 훈련 액션(땀방울 & 덤벨 치대기 모션) */}
          {trainSession ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 10,
                  zIndex: 10,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: trainTimeLeft > 0 ? '#FF7A59' : '#4CAF50',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 900,
                  boxShadow: '0 3px 8px rgba(255,122,89,0.3)',
                }}
              >
                {trainTimeLeft > 0
                  ? `🏋️ [실시간 특훈] ${Math.floor(trainTimeLeft / 60)}분 ${trainTimeLeft % 60}초`
                  : '🎉 훈련 완료!'}
              </div>

              {/* 땀방울/기합 말풍선 */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 12,
                  zIndex: 10,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1.5px solid #FF9800',
                  color: '#E65100',
                  fontSize: 11,
                  fontWeight: 900,
                  animation: 'pulse 0.8s infinite alternate',
                }}
              >
                {liveActionPhase % 2 === 0 ? '💦 읏샤읏샤! 덤벨 치대기' : '🔥 바사삭 근력 단련 중!'}
              </div>

              {/* 캐릭터 바운스 훈련 액션 */}
              <div
                style={{
                  transform:
                    liveActionPhase % 2 === 0
                      ? 'scale(1.08, 0.92) translateY(6px)'
                      : 'scale(0.94, 1.08) translateY(-6px)',
                  transition: 'transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                }}
              >
                <MonsterView look={look} size={138} title={info?.name} />
              </div>
            </div>
          ) : towerSession || activeTab === 'tower' ? (
            /* 2. 타워 탐험 진행 중 (또는 타워 탭): 우측 전진 횡스크롤 러닝 & 몬스터 격퇴 액션 */
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, #2D1B4E 0%, #4A2882 60%, #311B92 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              {/* 상단 층수 & 진행 상태 뱃지 */}
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 8,
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #7C4DFF, #651FFF)',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(124,77,255,0.4)',
                  }}
                >
                  🏰 {towerSession ? `${towerSession.currentFloor}층 탐험 러닝 중` : `${towerFloor}층 탐사 대기`}
                </span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFD54F',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  🏃 우측 진격 중
                </span>
              </div>

              {/* 뒷배경: 움직이는 별빛 & 디저트 성벽 실루엣 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 1px, transparent 1px), radial-gradient(circle at 75% 20%, rgba(255,255,255,0.15) 1.5px, transparent 1.5px), radial-gradient(circle at 50% 60%, rgba(255,215,0,0.15) 1.5px, transparent 1.5px)',
                  backgroundSize: '120px 80px',
                }}
              />

              {/* 중앙 액션 필드: 횡스크롤 캐릭터 전진 & 몬스터 격퇴 */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 105,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 18px',
                  zIndex: 2,
                }}
              >
                {/* 1. 내 캐릭터: 우측으로 달리며 도약 공격하는 모션 */}
                <div
                  style={{
                    position: 'absolute',
                    left: liveActionPhase % 4 === 2 ? '42%' : liveActionPhase % 4 === 1 ? '24%' : '14%',
                    bottom: liveActionPhase % 2 === 1 ? 16 : 8,
                    transform: liveActionPhase % 4 === 2
                      ? 'scale(1.1) rotate(6deg)'
                      : liveActionPhase % 2 === 1
                        ? 'translateY(-6px) rotate(-2deg)'
                        : 'translateY(0) rotate(1deg)',
                    transition: 'left 0.25s ease-out, transform 0.2s ease, bottom 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <MonsterView look={look} size={92} title={info?.name} />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color: '#FFF9C4',
                      background: 'rgba(0,0,0,0.4)',
                      padding: '1px 6px',
                      borderRadius: 8,
                      marginTop: -4,
                    }}
                  >
                    {liveActionPhase % 4 === 2 ? '⚡ 돌진 공격!' : '🏃 전진 러닝'}
                  </span>
                </div>

                {/* 2. 타격 이펙트 & 데미지 팝업 */}
                {liveActionPhase % 4 === 2 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '52%',
                      top: 15,
                      zIndex: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      animation: 'pulse 0.25s infinite alternate',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>💥</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: '#FF1744',
                        textShadow: '0 1px 4px #FFFFFF, 0 0 8px #FF80AB',
                      }}
                    >
                      CRUNCH! -{(battlePower * 1.5).toFixed(0)}
                    </span>
                  </div>
                )}

                {/* 3. 등장 및 격퇴되는 적 몬스터 */}
                <div
                  style={{
                    position: 'absolute',
                    right: liveActionPhase % 4 === 3 ? '-40px' : liveActionPhase % 4 === 2 ? '18%' : '12%',
                    bottom: liveActionPhase % 4 === 3 ? 35 : 10,
                    opacity: liveActionPhase % 4 === 3 ? 0 : 1,
                    transform: liveActionPhase % 4 === 3
                      ? 'rotate(180deg) scale(0.6)'
                      : liveActionPhase % 4 === 2
                        ? 'translateX(14px) scale(0.9)'
                        : 'translateX(0)',
                    transition: 'all 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      background: currentFloorInfo.isBoss
                        ? 'radial-gradient(circle, #FF5252 0%, #B71C1C 100%)'
                        : 'radial-gradient(circle, #AB47BC 0%, #4A148C 100%)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 28,
                      boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                      border: '2px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    {currentFloorInfo.isBoss ? '👹' : towerFloor % 3 === 0 ? '🐲' : towerFloor % 2 === 0 ? '🍫' : '🍬'}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#E1BEE7',
                      background: 'rgba(0,0,0,0.4)',
                      padding: '1px 5px',
                      borderRadius: 8,
                      marginTop: 2,
                    }}
                  >
                    {currentFloorInfo.enemy}
                  </span>
                </div>
              </div>

              {/* 하단 패럴랙스 타일 바닥 (오른쪽에서 왼쪽으로 이동하는 느낌의 줄무늬 코블스톤) */}
              <div
                style={{
                  height: 18,
                  width: '100%',
                  background: 'repeating-linear-gradient(90deg, #3E2723 0px, #3E2723 18px, #4E342E 18px, #4E342E 36px)',
                  borderTop: '2px solid #8D6E63',
                  boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.4)',
                  zIndex: 3,
                }}
              />
            </div>
          ) : (
            /* 3. 대기 상태 기본 뷰 */
            <div style={{ position: 'relative', zIndex: 1 }}>
              <MonsterView look={look} size={148} title={info?.name} />
            </div>
          )}
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
                const isOngoingThis = trainSession?.courseId === course.id
                return (
                  <button
                    key={course.id}
                    onClick={() => {
                      if (!trainSession) {
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
                      cursor: trainSession ? 'default' : 'pointer',
                      opacity: trainSession && !isOngoingThis ? 0.45 : 1,
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

            {trainSession ? (
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
                {trainTimeLeft > 0 ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#D85A3A' }}>
                      🏋️ [{trainSession.courseName}] 백그라운드 훈련 진행 중!
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#FF5722' }}>
                      남은 시간: {Math.floor(trainTimeLeft / 60)}분 {trainTimeLeft % 60}초
                    </div>
                    <div style={{ fontSize: 11, color: '#795548', lineHeight: 1.3 }}>
                      📱 화면을 닫거나 앱을 나가도 현실 시간으로 계속 훈련합니다.
                    </div>
                    <div style={{ height: 10, borderRadius: 999, background: '#E8D8B8', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.round(((trainSession.durationSec - trainTimeLeft) / trainSession.durationSec) * 100))}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #FF7A59, #FFB74D)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    <button
                      className="chip honey"
                      onClick={() => setTrainTimeLeft(0)}
                      style={{ cursor: 'pointer', border: 'none', alignSelf: 'center', fontWeight: 800, fontSize: 12 }}
                    >
                      ⚡ 테스트 쾌속 완료하기
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#2E7D32' }}>
                      🎉 [{trainSession.courseName}] 훈련 완료!
                    </div>
                    <div style={{ fontSize: 12, color: '#388E3C' }}>
                      땀방울과 식감 파편이 터져 능력이 쑥쑥 성장했습니다!
                    </div>
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={finishTraining}
                      style={{
                        padding: '10px',
                        fontSize: 14,
                        width: '100%',
                        background: 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)',
                        boxShadow: '0 4px 0 #1B5E20',
                      }}
                    >
                      🎁 훈련 성장 보상 수령하기!
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 16,
                  border: '2px solid #FF7A59',
                  background: '#FFF8F4',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 6,
                  flex: 1,
                }}
              >
                <div className="row between" style={{ alignItems: 'center' }}>
                  <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 24 }}>{selectedCourse.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#3B2F2F' }}>{selectedCourse.name}</div>
                      <div style={{ fontSize: 11, color: '#D85A3A', fontWeight: 800 }}>
                        {statNameMap[selectedCourse.mainStat]} +{selectedCourse.mainGain} · {selectedCourse.personalityLabel}
                      </div>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontWeight: 800, fontSize: 11, background: '#FFFDF9', padding: '3px 7px', borderRadius: 8, border: '1px solid #FFE0B2' }}>
                    <input type="checkbox" checked={fastMode} onChange={(e) => setFastMode(e.target.checked)} />
                    ⚡ 쾌속 10초
                  </label>
                </div>

                <div style={{ fontSize: 11, color: '#6E5D53', lineHeight: 1.3 }}>
                  {selectedCourse.desc} (앱 닫아도 백그라운드 진행)
                </div>

                {tooTired ? (
                  <div className="row between" style={{ background: '#FFF0EE', padding: '6px 10px', borderRadius: 12, border: '1px dashed #D9534F' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#D9534F' }}>💤 노곤함 80 이상! 휴식 필요</span>
                    <button className="btn mint" onClick={onGoRest} style={{ padding: '5px 8px', fontSize: 11 }}>
                      🌙 휴식하기
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn"
                    disabled={busy || Boolean(trainSession)}
                    onClick={handleStartTraining}
                    style={{
                      padding: '11px',
                      fontSize: 14,
                      fontWeight: 900,
                      width: '100%',
                      background: 'linear-gradient(90deg, #FF7A59 0%, #FF9800 100%)',
                      boxShadow: '0 3px 8px rgba(255,122,89,0.3)',
                    }}
                  >
                    ⚡ {selectedCourse.name} 훈련 출발 ({fastMode ? '10초' : '2분 30초'})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 탭 2: 🏰 디저트 타워 무한 탐험 (기획서 기반 백그라운드 자율 등반) */}
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

              {towerSession ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                  {/* 상단 진행 상태 헤더 */}
                  <div className="row between">
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#7C4DFF' }}>
                      🗺️ 가로 탐험 지도 ({towerSession.currentFloor}F / {towerSession.targetFloor}F)
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#00897B', background: '#E0F2F1', padding: '2px 8px', borderRadius: 10 }}>
                      ⚡ 펫 자율 전진 중
                    </span>
                  </div>

                  {/* 🗺️ 사용자가 요청한 가로 층 진행 지도 (Horizontal Exploration Map) */}
                  {(() => {
                    const rawPct = ((towerSession.currentFloor - towerSession.startFloor) / (towerSession.targetFloor - towerSession.startFloor || 1)) * 100
                    const progressPct = Math.min(94, Math.max(6, Math.round(rawPct)))
                    return (
                      <div
                        style={{
                          position: 'relative',
                          height: 64,
                          background: 'linear-gradient(180deg, #F3E8FF 0%, #E9D5FF 100%)',
                          borderRadius: 14,
                          border: '1.5px solid #C084FC',
                          padding: '0 12px',
                          display: 'flex',
                          alignItems: 'center',
                          boxShadow: 'inset 0 2px 6px rgba(124,77,255,0.1)',
                          margin: '6px 0',
                        }}
                      >
                        {/* 1. 기본 연결 레일 선 */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 16,
                            right: 16,
                            height: 6,
                            background: '#D8B4FE',
                            borderRadius: 999,
                            zIndex: 1,
                          }}
                        />

                        {/* 2. 전진 완료된 황금빛 이동 궤적 */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 16,
                            width: `${progressPct}%`,
                            height: 6,
                            background: 'linear-gradient(90deg, #F59E0B 0%, #8B5CF6 100%)',
                            borderRadius: 999,
                            zIndex: 2,
                            boxShadow: '0 0 8px rgba(139,92,246,0.6)',
                            transition: 'width 0.4s ease',
                          }}
                        />

                        {/* 3. 지도 상의 주요 체크포인트 마커들 */}
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            zIndex: 3,
                          }}
                        >
                          {/* 출발지 */}
                          <div style={{ textAlign: 'center', transform: 'translateY(-2px)' }}>
                            <div style={{ fontSize: 13 }}>🚩</div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: '#6B21A8' }}>{towerSession.startFloor}F</div>
                          </div>
                          {/* 1차 젤리존 */}
                          <div style={{ textAlign: 'center', transform: 'translateY(-2px)' }}>
                            <div style={{ fontSize: 12 }}>🍬</div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: '#7E22CE' }}>젤리존</div>
                          </div>
                          {/* 2차 보물상자 */}
                          <div style={{ textAlign: 'center', transform: 'translateY(-2px)' }}>
                            <div style={{ fontSize: 12 }}>🎁</div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: '#7E22CE' }}>보물방</div>
                          </div>
                          {/* 3차 수호자 보스 */}
                          <div style={{ textAlign: 'center', transform: 'translateY(-2px)' }}>
                            <div style={{ fontSize: 12 }}>👹</div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: '#7E22CE' }}>수호자</div>
                          </div>
                          {/* 도착지 */}
                          <div style={{ textAlign: 'center', transform: 'translateY(-2px)' }}>
                            <div style={{ fontSize: 13 }}>🏁</div>
                            <div style={{ fontSize: 9, fontWeight: 900, color: '#581C87' }}>{towerSession.targetFloor}F</div>
                          </div>
                        </div>

                        {/* 4. 레일 위를 달리는 내 캐릭터 미니 아바타 핀 */}
                        <div
                          style={{
                            position: 'absolute',
                            left: `${progressPct}%`,
                            top: 4,
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'left 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                          }}
                        >
                          {/* 말풍선 */}
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 900,
                              color: '#FFFFFF',
                              background: '#7C4DFF',
                              padding: '1px 5px',
                              borderRadius: 6,
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                          >
                            🏃 {progressPct}% 전진
                          </span>
                          {/* 캐릭터 핀 헤드 */}
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: '#FFFDF9',
                              border: '2px solid #7C4DFF',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 11,
                              boxShadow: '0 2px 6px rgba(124,77,255,0.4)',
                              marginTop: 1,
                            }}
                          >
                            🧁
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* 최근 탐사 로그 */}
                  <div
                    style={{
                      fontSize: 11,
                      color: '#5E35B1',
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.7)',
                      padding: '4px 8px',
                      borderRadius: 10,
                      border: '1px solid #E9D5FF',
                      textAlign: 'center',
                    }}
                  >
                    📜 {exploreLog}
                  </div>

                  <div style={{ fontSize: 10, color: '#795548', textAlign: 'center' }}>
                    📱 앱을 닫고 다른 일을 해도 펫이 스스로 몬스터를 격퇴하며 지도를 전진합니다.
                  </div>

                  <button
                    className="btn"
                    onClick={finishExplore}
                    style={{
                      marginTop: 2,
                      padding: '8px',
                      fontSize: 13,
                      background: 'linear-gradient(180deg, #7C4DFF 0%, #651FFF 100%)',
                      boxShadow: '0 3px 0 #4527A0',
                    }}
                  >
                    🎁 복귀 & 돌파 전리품 일괄 수령
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#5D4037', lineHeight: 1.35 }}>
                  내 전투력(<strong>{battlePower}</strong>) vs 권장(<strong>{currentFloorInfo.reqCp}</strong>) · <strong>앱 닫아도 3개 층 자율 돌파</strong>
                </div>
              )}

              {tooTired ? (
                <div className="row between" style={{ background: '#FFF0EE', padding: '6px 10px', borderRadius: 12, border: '1px dashed #D9534F' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#D9534F' }}>💤 노곤함 80 이상! 휴식 필요</span>
                  <button className="btn mint" onClick={onGoRest} style={{ padding: '5px 8px', fontSize: 11 }}>
                    🌙 휴식하기
                  </button>
                </div>
              ) : !towerSession ? (
                <button
                  className="btn"
                  disabled={busy}
                  onClick={handleStartExplore}
                  style={{
                    padding: '11px',
                    fontSize: 14,
                    fontWeight: 900,
                    width: '100%',
                    background: 'linear-gradient(90deg, #7C4DFF 0%, #651FFF 100%)',
                    boxShadow: '0 3px 8px rgba(124,77,255,0.35)',
                  }}
                >
                  ⚔️ {towerFloor}층 타워 탐험 출발 (자율 돌파)
                </button>
              ) : null}
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
