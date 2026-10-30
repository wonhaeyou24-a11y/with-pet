// M2 화면 2: 🧁 파티세리 훈련장 & 🏰 디저트 타워 무한 탐험 (원스크린 100dvh 무스크롤 덱 레이아웃)
// - 상단 펫 화면을 대폭 확장(240px)하여 실시간 훈련 도구 액션 & 횡스크롤 타워 탐험을 생생하게 연출합니다.
// - 훈련 선택 즉시 펫 화면에서 반죽 치대기, 덤벨, 설탕 방패, 시럽 질주 등 리얼 애니메이션이 동작합니다.
// - 타워 탐험 시 펫이 우측으로 총총 이동하며 젤리·보물상자·몬스터 격퇴 액션이 실시간으로 펼쳐집니다.
// - 하단의 쓸데없이 넓던 빈 공간을 완전히 제거하고 컴팩트하고 알찬 기능 카드로 최적화했습니다.

import { useEffect, useRef, useState } from 'react'
import { addRibbonCoins } from '../config/boutique'
import { expForNextLevel, TRAINING_COURSES, type TrainingCourse } from '../config/care'
import { recordMissionAction } from '../config/missions'
import { personalityLabel, SPECIES_INFO, STAT_INFO } from '../config/species'
import { monsterLook, serverNow, type MonsterRow } from '../lib/api'
import { callActivity, callCare, type ServerSession } from '../lib/careApi'
import { IS_DEV_MOCK } from '../lib/devMode'
import {
  clearTowerSession,
  clearTrainingSession,
  COURSE_DURATIONS,
  getActiveTowerSession,
  getActiveTrainingSession,
  saveServerTowerSession,
  saveServerTrainingSession,
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

const durationLabel = (sec: number) =>
  sec % 60 === 0 ? `${sec / 60}분` : sec >= 60 ? `${Math.floor(sec / 60)}분 ${sec % 60}초` : `${sec}초`

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

function towerFromServer(monsterId: string, s: ServerSession) {
  return saveServerTowerSession(monsterId, {
    startFloor: s.startFloor ?? 1,
    maxFloors: s.maxFloors ?? 3,
    secPerFloor: s.secPerFloor ?? 140,
    startedAt: s.startedAt,
  })
}

export default function PatisserieTraining({ monster, coins, onUpdate, onGoRest, onBack }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse>(TRAINING_COURSES[0])
  const [activeTab, setActiveTab] = useState<TrainingTab>('courses')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [asmrBubble, setAsmrBubble] = useState<string | null>(null)
  const [levelUpBanner, setLevelUpBanner] = useState(false)
  const [fastMode, setFastMode] = useState(false)

  // 1. 파티세리 훈련 실시간 백그라운드 진행 상태
  const [trainSession, setTrainSession] = useState<TrainingSession | null>(() => getActiveTrainingSession(monster.id))
  const [trainTimeLeft, setTrainTimeLeft] = useState<number>(() => {
    const sess = getActiveTrainingSession(monster.id)
    if (!sess) return 0
    return Math.max(0, Math.ceil((sess.finishAt - serverNow()) / 1000))
  })
  const trainTimerRef = useRef<number | null>(null)
  const [liveActionPhase, setLiveActionPhase] = useState<number>(0)

  // 2. 디저트 타워 무한 탐험 상태
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
  const [towerEntriesLeft, setTowerEntriesLeft] = useState<number | null>(null)
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

  // 실제 서비스: 진행 중인 훈련·타워와 타워 층은 서버가 기억한다. 화면을 열 때 서버 기준으로 맞춘다.
  useEffect(() => {
    if (IS_DEV_MOCK) return
    let cancelled = false
    callActivity(monster.id, 'activity').then((res) => {
      if (cancelled || !res.ok) return
      if (res.train) {
        const course = TRAINING_COURSES.find((c) => c.id === res.train!.courseId)
        if (course) {
          const sess = saveServerTrainingSession(monster.id, course, res.train.startedAt, res.train.finishAt)
          setTrainSession(sess)
          setTrainTimeLeft(Math.max(0, Math.ceil((sess.finishAt - serverNow()) / 1000)))
        }
      } else {
        clearTrainingSession(monster.id)
        setTrainSession(null)
        setTrainTimeLeft(0)
      }
      if (res.tower) {
        setTowerSession(towerFromServer(monster.id, res.tower))
      } else {
        clearTowerSession(monster.id)
        setTowerSession(null)
      }
      if (typeof res.towerFloor === 'number') setTowerFloor(res.towerFloor)
      if (typeof res.towerEntriesLeft === 'number') setTowerEntriesLeft(res.towerEntriesLeft)
    })
    return () => {
      cancelled = true
    }
  }, [monster.id])

  // 훈련 타이머 관리
  useEffect(() => {
    if (!trainSession) return

    const updateTimer = () => {
      const left = Math.max(0, Math.ceil((trainSession.finishAt - serverNow()) / 1000))
      setTrainTimeLeft(left)
      setLiveActionPhase((p) => (p + 1) % 8)
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

  // 타워 탐험 타이머 관리
  useEffect(() => {
    if (!towerSession) return

    const updateTower = () => {
      const syn = syncTowerProgress(towerSession)
      setTowerSession({ ...syn.session })
      setLiveActionPhase((p) => (p + 1) % 8)
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

  // 훈련 시작
  async function handleStartTraining() {
    if (tooTired || busy || (trainSession && trainTimeLeft > 0)) return
    if (!IS_DEV_MOCK) {
      setBusy(true)
      const res = await callActivity(monster.id, 'train_start', { courseId: selectedCourse.id })
      setBusy(false)
      if (!res.ok || !res.session) {
        setToast(res.message ?? '잠시 후 다시 시도해 주세요.')
        setTimeout(() => setToast(null), 3000)
        return
      }
      const sess = saveServerTrainingSession(monster.id, selectedCourse, res.session.startedAt, res.session.finishAt)
      setTrainSession(sess)
      setTrainTimeLeft(Math.max(0, Math.ceil((sess.finishAt - serverNow()) / 1000)))
      triggerAsmr(selectedCourse.asmr)
      setToast(`💪 "${selectedCourse.name}" 훈련 시작! 앱을 나가도 현실 시간으로 계속 훈련해요.`)
      setTimeout(() => setToast(null), 3000)
      return
    }
    const duration = fastMode ? 10 : undefined
    const sess = startTrainingSession(monster.id, selectedCourse, duration)
    setTrainSession(sess)
    setTrainTimeLeft(sess.durationSec)
    triggerAsmr(selectedCourse.asmr)
    setToast(`💪 "${selectedCourse.name}" 훈련 시작! 앱을 나가도 현실 시간으로 계속 훈련해요.`)
    setTimeout(() => setToast(null), 3000)
  }

  // 훈련 완료 및 보상 수령
  async function finishTraining() {
    if (!trainSession) return
    setBusy(true)
    const courseId = trainSession.courseId
    // 실제 서비스: 등급·보상은 서버가 정한다 (아직 안 끝났으면 서버가 남은 시간을 알려 준다)
    const res = IS_DEV_MOCK
      ? await callCare(monster, coins, 'train', { courseId, grade: 'perfect' })
      : await callActivity(monster.id, 'train_finish')
    setBusy(false)
    if (!res.ok && ['not_yet', 'too_tired', 'busy', 'network', 'server'].includes(res.code ?? '')) {
      setToast(res.message ?? '잠시 후 다시 시도해 주세요.')
      setTimeout(() => setToast(null), 3500)
      return
    }
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

  // 타워 탐사 시작
  function handleStartExplore() {
    if (tooTired || busy || towerSession) return
    if (!IS_DEV_MOCK) {
      setBusy(true)
      callActivity(monster.id, 'tower_start').then((res) => {
        setBusy(false)
        if (!res.ok || !res.session) {
          setToast(res.message ?? '잠시 후 다시 시도해 주세요.')
          setTimeout(() => setToast(null), 3500)
          return
        }
        const sess = towerFromServer(monster.id, res.session)
        setTowerSession(sess)
        if (typeof res.towerEntriesLeft === 'number') setTowerEntriesLeft(res.towerEntriesLeft)
        triggerAsmr('kataifi-crunch')
        setToast(`🏰 ${sess.startFloor}층~${sess.targetFloor}층 탐험 출발! 앱을 꺼도 펫이 스스로 층을 돌파해요.`)
        setTimeout(() => setToast(null), 3500)
      })
      return
    }
    const sess = startTowerExpedition(monster.id, towerFloor, battlePower, 3)
    setTowerSession(sess)
    triggerAsmr('kataifi-crunch')
    setToast(`🏰 ${towerFloor}층~${sess.targetFloor}층 탐험 출발! 앱을 꺼도 펫이 스스로 층을 돌파해요.`)
    setTimeout(() => setToast(null), 3500)
  }

  // 타워 탐사 완료 및 전리품 일괄 수령
  async function finishExplore() {
    if (!towerSession) return
    if (!IS_DEV_MOCK) {
      setBusy(true)
      const res = await callActivity(monster.id, 'tower_finish')
      setBusy(false)
      if (!res.ok) {
        if (res.code === 'no_session') {
          clearTowerSession(monster.id)
          setTowerSession(null)
        }
        setToast(res.message ?? '잠시 후 다시 시도해 주세요.')
        setTimeout(() => setToast(null), 3500)
        return
      }
      clearTowerSession(monster.id)
      setTowerSession(null)
      if (typeof res.towerFloor === 'number') setTowerFloor(res.towerFloor)
      if (res.monster && res.coins !== undefined) onUpdate(res.monster, res.coins, res.foodBag ?? {})
      const floors = res.floorsCleared ?? 0
      addRibbonCoins(floors * 20, '타워 탐험 돌파 보상')
      recordMissionAction('w-tower', floors)
      playDessertAsmr('wax-pop', 3)
      setToast(`${res.message ?? '탐험 완료!'} · 🎀 +${floors * 20} 리본`)
      setTimeout(() => setToast(null), 4500)
      if (res.leveledUp) {
        setLevelUpBanner(true)
        setTimeout(() => setLevelUpBanner(false), 4000)
      }
      return
    }
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
        padding: '8px 12px calc(8px + env(safe-area-inset-bottom, 0px))',
        gap: 6,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#FAF6EE',
      }}
    >
      <style>{`
        @keyframes crunchPound {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          40% { transform: translateY(-16px) scale(0.92, 1.08); }
          50% { transform: translateY(8px) scale(1.15, 0.88); }
          65% { transform: translateY(-4px) scale(0.98, 1.02); }
        }
        @keyframes sugarShieldRotate {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.06); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes speedGlide {
          0%, 100% { transform: translateX(-18px) rotate(-4deg); }
          50% { transform: translateX(18px) rotate(4deg); }
        }
        @keyframes doughBounce {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          50% { transform: translateY(-22px) scale(0.9, 1.12); }
        }
        @keyframes towerScrollBg {
          0% { background-position: 0 0; }
          100% { background-position: -240px 0; }
        }
        @keyframes towerFloorScroll {
          0% { background-position: 0 0; }
          100% { background-position: -72px 0; }
        }
        @keyframes petRunJump {
          0%, 100% { transform: translateY(0) rotate(1deg); }
          50% { transform: translateY(-12px) rotate(-3deg); }
        }
        @keyframes enemyReactHit {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(0.85) translateX(6px); filter: brightness(1.6); }
        }
        @keyframes floatReward {
          0% { opacity: 0; transform: translateY(6px); }
          20% { opacity: 1; transform: translateY(-6px); }
          80% { opacity: 0.9; transform: translateY(-20px); }
          100% { opacity: 0; transform: translateY(-32px); }
        }
      `}</style>

      {/* 상단 헤더 */}
      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로" style={{ width: 34, height: 34 }}>
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 16, margin: 0 }}>🧁 파티세리 훈련 & 🏰 타워</h1>
        <span className="chip honey" style={{ fontWeight: 800, fontSize: 11, padding: '2px 8px' }}>
          🪙 {coins}
        </span>
      </div>

      {/* 🌟 상단 3D 액션 스테이지 카드 (확장된 240px 높이 & 리얼 애니메이션) */}
      <div
        className="card"
        style={{
          padding: '8px 10px',
          gap: 6,
          flexShrink: 0,
          background: '#FFFDF9',
          border: '1.5px solid #F0DFB8',
          borderRadius: 16,
        }}
      >
        {/* 상단 펫 정보 요약 */}
        <div className="row wrap between" style={{ gap: 4 }}>
          <div className="row" style={{ gap: 4, alignItems: 'center' }}>
            <span className="chip coral" style={{ fontSize: 11, padding: '2px 7px', fontWeight: 900 }}>
              Lv.{monster.level} {monster.name}
            </span>
            <span className="chip" style={{ fontSize: 11, padding: '2px 6px', fontWeight: 800 }}>
              전투력 ⚔️ {battlePower}
            </span>
          </div>
          <span className="chip" style={{ fontSize: 10, padding: '2px 6px', color: '#795548' }}>
            {personalityLabel(monster.personality_active, monster.personality_bond)}
          </span>
        </div>

        {/* 🎬 3D 펫 실시간 훈련 액션 & 횡스크롤 탐험 대형 스테이지 (265px 확장) */}
        <div
          className="stage"
          style={{
            alignItems: 'center',
            position: 'relative',
            height: 265,
            minHeight: 265,
            padding: 0,
            cursor: 'pointer',
            borderRadius: 14,
            overflow: 'hidden',
            background:
              activeTab === 'tower'
                ? 'linear-gradient(180deg, #1A102F 0%, #2E1B4E 60%, #4527A0 100%)'
                : selectedCourse.id === 'str'
                  ? 'radial-gradient(ellipse at 50% 60%, #FFF3E0 0%, #FFE0B2 70%, #FFCC80 100%)'
                  : selectedCourse.id === 'def'
                    ? 'radial-gradient(ellipse at 50% 60%, #E1F5FE 0%, #B3E5FC 70%, #81D4FA 100%)'
                    : selectedCourse.id === 'spd'
                      ? 'radial-gradient(ellipse at 50% 60%, #FFFDE7 0%, #FFF9C4 70%, #FFF176 100%)'
                      : selectedCourse.id === 'int'
                        ? 'radial-gradient(ellipse at 50% 60%, #F3E5F5 0%, #E1BEE7 70%, #CE93D8 100%)'
                        : 'radial-gradient(ellipse at 50% 60%, #FFEBEE 0%, #FFCDD2 70%, #EF9A9A 100%)',
            border: activeTab === 'tower' ? '1.5px solid #7E57C2' : '1.5px solid #FFE082',
          }}
          onClick={() => triggerAsmr(selectedCourse.asmr)}
        >
          {asmrBubble && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                zIndex: 30,
                padding: '3px 10px',
                borderRadius: 999,
                background: '#3B2F2F',
                color: '#FFFDF9',
                fontSize: 11,
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
              }}
            >
              🔊 {asmrBubble}
            </div>
          )}

          {/* ======================================================== */}
          {/* [모드 A] 🏰 디저트 타워 횡스크롤 런 & 슬래시 탐험 액션 */}
          {/* ======================================================== */}
          {activeTab === 'tower' ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              {/* 상단 층수 뱃지 */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 10,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #7C4DFF, #536DFE)',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(124,77,255,0.4)',
                  }}
                >
                  🏰 {towerFloor}층 {currentFloorInfo.isBoss ? '🔥 [BOSS]' : ''} {currentFloorInfo.name}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(255, 255, 255, 0.25)',
                    color: '#FFE082',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {towerSession ? '🏃 자율 진격 중' : '⚔️ 탐험 대기'}
                </span>
              </div>

              {/* 뒷배경: 무한 스크롤되는 성벽 & 별빛 텍스처 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 1.5px, transparent 1.5px), radial-gradient(circle at 75% 25%, rgba(255,215,0,0.3) 2px, transparent 2px)',
                  backgroundSize: '160px 100px',
                  animation: 'towerScrollBg 12s linear infinite',
                }}
              />

              {/* 중앙 액션 횡스크롤 스테이지: 펫 우측 러닝 + 보물상자 + 몬스터 격퇴 */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 20px',
                  zIndex: 10,
                }}
              >
                {/* 1. 내 캐릭터 (우측으로 총총 달리는 러닝 & 점핑 액션) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '18%',
                    bottom: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'petRunJump 0.45s ease-in-out infinite',
                  }}
                >
                  {/* 머리 위 실시간 EXP/코인 플로팅 보상 */}
                  <div
                    key={`reward-${liveActionPhase}`}
                    style={{
                      position: 'absolute',
                      top: -18,
                      fontSize: 12,
                      fontWeight: 900,
                      color: liveActionPhase % 2 === 0 ? '#FFE082' : '#69F0AE',
                      textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                      animation: 'floatReward 1.4s ease-out forwards',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {liveActionPhase % 2 === 0 ? '🪙 +12 코인!' : '✨ EXP +35!'}
                  </div>
                  <MonsterView look={look} size={125} title={info?.name} />
                  <div
                    style={{
                      width: 80,
                      height: 16,
                      borderRadius: '50%',
                      background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
                      marginTop: -8,
                    }}
                  />
                </div>

                {/* 2. 중앙 획득 오브젝트: Stitch 황금 페이스트리 보물상자 & 마법 젤리 */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'pulseGlow 1.2s ease infinite',
                    zIndex: 12,
                  }}
                >
                  {liveActionPhase % 2 === 0 ? (
                    /* 🎁 Stitch 황금 페이스트리 보물상자 (Golden Pastry Chest) */
                    <div
                      style={{
                        position: 'relative',
                        width: 52,
                        height: 44,
                        background: 'linear-gradient(180deg, #FFE082 0%, #FFB300 40%, #FF8F00 100%)',
                        borderRadius: '12px 12px 10px 10px',
                        border: '2px solid #FFF8E1',
                        boxShadow: '0 4px 14px rgba(255, 143, 0, 0.5), inset 0 2px 0 rgba(255,255,255,0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* 생크림 웨이브 덮개 띠 */}
                      <div
                        style={{
                          position: 'absolute',
                          top: -4,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 48,
                          height: 10,
                          borderRadius: 999,
                          background: '#FFFFFF',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          border: '1px solid #FFE082',
                        }}
                      />
                      {/* 루비 딸기 보석 자물쇠 */}
                      <div
                        style={{
                          fontSize: 16,
                          filter: 'drop-shadow(0 2px 4px rgba(216,27,96,0.5))',
                          marginTop: 2,
                        }}
                      >
                        🍓
                      </div>
                      {/* 황금빛 별빛 스파클 */}
                      <div
                        style={{
                          position: 'absolute',
                          top: -10,
                          right: -6,
                          fontSize: 12,
                          animation: 'pulse 0.8s infinite alternate',
                        }}
                      >
                        ✨
                      </div>
                    </div>
                  ) : (
                    /* 🍬 별빛 크리스탈 마법 젤리 */
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 35%, #FF80AB 0%, #F50057 60%, #880E4F 100%)',
                        border: '2px solid #FFFFFF',
                        boxShadow: '0 0 16px rgba(245, 0, 87, 0.6), inset 0 3px 0 rgba(255,255,255,0.6)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 20,
                      }}
                    >
                      🍬
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 900,
                      color: '#FFF8E1',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '1px 5px',
                      borderRadius: 6,
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {liveActionPhase % 2 === 0 ? '황금 페이스트리 상자' : '별빛 젤리젬'}
                  </span>
                </div>

                {/* 3. 오른쪽 층 수호자 몬스터 (피격 리액션) */}
                <div
                  style={{
                    position: 'absolute',
                    right: '10%',
                    bottom: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'enemyReactHit 1.2s ease-in-out infinite',
                  }}
                >
                  {/* 타격 시 대미지 숫자 플로팅 */}
                  <div
                    key={`dmg-${liveActionPhase}`}
                    style={{
                      position: 'absolute',
                      top: -20,
                      fontSize: 14,
                      fontWeight: 900,
                      color: '#FF5252',
                      textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                      animation: 'floatReward 1.2s ease-out forwards',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    💥 CRITICAL -124!
                  </div>
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: '50%',
                      background: currentFloorInfo.isBoss
                        ? 'radial-gradient(circle, #FF5252 0%, #B71C1C 100%)'
                        : 'radial-gradient(circle, #AB47BC 0%, #4A148C 100%)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 34,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      border: '2px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    {currentFloorInfo.isBoss ? '👹' : towerFloor % 3 === 0 ? '🐲' : towerFloor % 2 === 0 ? '🍫' : '🍬'}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#E1BEE7',
                      background: 'rgba(0,0,0,0.5)',
                      padding: '1px 6px',
                      borderRadius: 8,
                      marginTop: 3,
                    }}
                  >
                    {currentFloorInfo.enemy}
                  </span>
                </div>
              </div>

              {/* 하단 무한 이동 코블스톤 타일 바닥 */}
              <div
                style={{
                  height: 22,
                  width: '100%',
                  background:
                    'repeating-linear-gradient(90deg, #311B92 0px, #311B92 18px, #4527A0 18px, #4527A0 36px)',
                  borderTop: '2px solid #7E57C2',
                  boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.5)',
                  animation: 'towerFloorScroll 1.6s linear infinite',
                  zIndex: 15,
                }}
              />
            </div>
          ) : (
            /* ======================================================== */
            /* [모드 B] 🧁 5대 파티세리 훈련 실시간 애니메이션 액션 뷰 */
            /* ======================================================== */
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
              {/* 상단 훈련 모드 뱃지 */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 10,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: trainSession ? (trainTimeLeft > 0 ? '#FF7043' : '#43A047') : '#FFB74D',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 900,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                >
                  {trainSession
                    ? trainTimeLeft > 0
                      ? `🏋️ [특훈 중] ${Math.floor(trainTimeLeft / 60)}분 ${trainTimeLeft % 60}초`
                      : '🎉 훈련 완료!'
                    : `🏋️ ${selectedCourse.name} 준비`}
                </span>
              </div>

              {/* 실시간 훈련 기합 & 이펙트 말풍선 */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 10,
                  zIndex: 20,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1.5px solid #FF9800',
                  color: '#E65100',
                  fontSize: 10,
                  fontWeight: 900,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                }}
              >
                {selectedCourse.id === 'str' && '🔨 바사삭 반죽 치대기!'}
                {selectedCourse.id === 'def' && '🛡️ 슈가 코팅 강화 중!'}
                {selectedCourse.id === 'spd' && '⚡ 시럽 질주 스케이팅!'}
                {selectedCourse.id === 'int' && '💡 황금 레시피 탐구!'}
                {selectedCourse.id === 'hp' && '🤸 마시멜로 통통 점프!'}
              </div>

              {/* 🌟 훈련 코스별 3D 펫 역동적 애니메이션 액션 */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation:
                    selectedCourse.id === 'str'
                      ? 'crunchPound 0.9s cubic-bezier(0.2, 0.9, 0.3, 1) infinite'
                      : selectedCourse.id === 'def'
                        ? 'pulseGlow 1.2s ease-in-out infinite'
                        : selectedCourse.id === 'spd'
                          ? 'speedGlide 1s ease-in-out infinite'
                          : selectedCourse.id === 'int'
                            ? 'pulseGlow 1.4s ease infinite'
                            : 'doughBounce 0.8s ease-in-out infinite',
                }}
              >
                {/* 훈련 도구 오버레이 오브젝트들 */}
                {selectedCourse.id === 'str' && (
                  <div style={{ position: 'absolute', top: -14, right: -12, fontSize: 32, zIndex: 10 }}>
                    🏋️
                  </div>
                )}
                {selectedCourse.id === 'def' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: -8,
                      borderRadius: '50%',
                      border: '3px dashed #29B6F6',
                      animation: 'sugarShieldRotate 6s linear infinite',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {selectedCourse.id === 'spd' && (
                  <div style={{ position: 'absolute', bottom: -6, fontSize: 24, zIndex: 10 }}>
                    💨 ⚡
                  </div>
                )}
                {selectedCourse.id === 'int' && (
                  <div style={{ position: 'absolute', top: -16, fontSize: 28, zIndex: 10 }}>
                    💡
                  </div>
                )}

                <MonsterView look={look} size={155} title={info?.name} />

                {/* 발밑 도마/반죽 섀도우 */}
                <div
                  style={{
                    width: 110,
                    height: 22,
                    borderRadius: '50%',
                    background:
                      selectedCourse.id === 'str'
                        ? 'radial-gradient(ellipse, #D87A50 0%, #B9532A 60%, transparent 80%)'
                        : 'radial-gradient(ellipse, rgba(62,39,35,0.35) 0%, transparent 75%)',
                    marginTop: -10,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 📊 슬림 경험치 & 노곤함 바 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div style={{ padding: '4px 8px', borderRadius: 10, background: '#FFFBF2', border: '1px solid #F0DFB8' }}>
            <div className="row between" style={{ fontSize: 10, fontWeight: 800, color: '#3B2F2F', marginBottom: 2 }}>
              <span>⭐ 성장 EXP</span>
              <span style={{ color: '#FF7A59' }}>{curExp}/{nextExp}</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
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
              padding: '4px 8px',
              borderRadius: 10,
              background: tooTired ? '#FFF0EE' : '#FFFBF2',
              border: tooTired ? '1.5px solid #D9534F' : '1px solid #F0DFB8',
            }}
          >
            <div className="row between" style={{ fontSize: 10, fontWeight: 800, color: '#3B2F2F', marginBottom: 2 }}>
              <span>💤 노곤함</span>
              <span style={{ color: tooTired ? '#D9534F' : '#3B2F2F' }}>{fatigue}/100</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
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
              padding: '4px 8px',
              borderRadius: 8,
              background: levelUpBanner ? '#E8F5E9' : '#FFF3E0',
              border: levelUpBanner ? '1px solid #4CAF50' : '1px solid #FFA726',
              fontSize: 10,
              fontWeight: 800,
              color: levelUpBanner ? '#2E7D32' : '#E65100',
              textAlign: 'center',
            }}
          >
            {levelUpBanner ? '🎉 레벨 업! 스킬 포인트(SP)를 획득했습니다!' : toast}
          </div>
        )}
      </div>

      {/* 📦 하단 기능 카드 (빈 공간을 완전히 없앤 컴팩트 & 알찬 레이아웃) */}
      <div
        className="card"
        style={{
          padding: '8px 10px',
          gap: 6,
          background: '#FFFDF9',
          border: '1.5px solid #F0DFB8',
          borderRadius: 16,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* 상단 탭 3버튼 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, flexShrink: 0 }}>
          <button
            onClick={() => setActiveTab('courses')}
            style={{
              padding: '6px 4px',
              borderRadius: 10,
              border: activeTab === 'courses' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: activeTab === 'courses' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 11,
              fontWeight: 900,
              color: activeTab === 'courses' ? '#D84315' : '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🧁 5대 훈련 코스
          </button>
          <button
            onClick={() => setActiveTab('tower')}
            style={{
              padding: '6px 4px',
              borderRadius: 10,
              border: activeTab === 'tower' ? '2px solid #7C4DFF' : '1.5px solid #F0DFB8',
              background: activeTab === 'tower' ? '#F3E8FF' : '#FFFFFF',
              fontSize: 11,
              fontWeight: 900,
              color: activeTab === 'tower' ? '#5E35B1' : '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🏰 디저트 타워
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '6px 4px',
              borderRadius: 10,
              border: activeTab === 'stats' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: activeTab === 'stats' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 11,
              fontWeight: 900,
              color: activeTab === 'stats' ? '#D84315' : '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            📊 능력치 ({totalStats(monster.stats)})
          </button>
        </div>

        {/* ======================================================== */}
        {/* 탭 1: 5대 훈련 코스 (빈 공간 없는 알찬 구성) */}
        {/* ======================================================== */}
        {activeTab === 'courses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'space-between' }}>
            {/* 5대 코스 선택 바: 조금 더 크고 두 줄 중앙 배치로 시인성 극대화 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
              {TRAINING_COURSES.map((course) => {
                const isSelected = selectedCourse.id === course.id
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
                      padding: '8px 2px',
                      minHeight: 58,
                      borderRadius: 12,
                      border: isSelected ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                      background: isSelected
                        ? 'linear-gradient(180deg, #FFF0E6 0%, #FFE0CC 100%)'
                        : '#FFFFFF',
                      boxShadow: isSelected ? '0 2px 8px rgba(255,122,89,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      cursor: trainSession ? 'default' : 'pointer',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{course.icon}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: isSelected ? '#BF360C' : '#3E2723',
                        lineHeight: 1.1,
                        textAlign: 'center',
                      }}
                    >
                      {statNameMap[course.mainStat]}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        color: isSelected ? '#D84315' : '#8D6E63',
                        lineHeight: 1,
                        textAlign: 'center',
                      }}
                    >
                      +{course.mainGain} 단련
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 선택된 훈련 코스 알찬 상세 정보 & 쾌속 토글 & 공간 활용 능력치 프리뷰 */}
            <div
              style={{
                padding: '9px 12px',
                borderRadius: 14,
                border: '1.5px solid #FFCC80',
                background: 'linear-gradient(180deg, #FFF9F5 0%, #FFF3EC 100%)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              <div className="row between" style={{ alignItems: 'center' }}>
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: '#FFFFFF',
                      border: '1px solid #FFE0B2',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 20,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    {selectedCourse.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#3E2723' }}>
                      {selectedCourse.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#D84315', fontWeight: 800, marginTop: 1 }}>
                      {statNameMap[selectedCourse.mainStat]} +{selectedCourse.mainGain} · {selectedCourse.personalityLabel}
                    </div>
                  </div>
                </div>
                {IS_DEV_MOCK && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontWeight: 800, fontSize: 11, background: '#FFFFFF', padding: '3px 8px', borderRadius: 8, border: '1px solid #FFE0B2', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <input type="checkbox" checked={fastMode} onChange={(e) => setFastMode(e.target.checked)} />
                    ⚡ 쾌속 10초
                  </label>
                )}
              </div>

              {/* 훈련 효과 및 현재 vs 달성 예측 능력치 프리뷰 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                  padding: '5px 10px',
                  borderRadius: 10,
                  border: '1px solid #FFE0B2',
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                <span style={{ color: '#5D4037' }}>
                  현재 {statNameMap[selectedCourse.mainStat]} <b>{monster.stats[selectedCourse.mainStat]}</b>
                </span>
                <span style={{ color: '#FF7043', fontWeight: 900 }}>➔ 훈련 후</span>
                <span style={{ color: '#2E7D32', fontWeight: 900 }}>
                  <b>{monster.stats[selectedCourse.mainStat] + selectedCourse.mainGain}</b> (+{selectedCourse.mainGain}) ✨
                </span>
              </div>

              {/* 훈련 효과 뱃지 4종 그리드 (빈 공간 없이 꽉 찬 정보 제공) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                <div style={{ background: '#FFFFFF', padding: '4px 2px', borderRadius: 8, textAlign: 'center', border: '1px solid #FFE0B2' }}>
                  <div style={{ fontSize: 8, color: '#795548', fontWeight: 700 }}>상승 능력치</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#D84315' }}>+{selectedCourse.mainGain}</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '4px 2px', borderRadius: 8, textAlign: 'center', border: '1px solid #FFE0B2' }}>
                  <div style={{ fontSize: 8, color: '#795548', fontWeight: 700 }}>성장 경험치</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#FF7043' }}>+40 EXP</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '4px 2px', borderRadius: 8, textAlign: 'center', border: '1px solid #FFE0B2' }}>
                  <div style={{ fontSize: 8, color: '#795548', fontWeight: 700 }}>소모 노곤함</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#7E57C2' }}>+15 피로</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '4px 2px', borderRadius: 8, textAlign: 'center', border: '1px solid #FFE0B2' }}>
                  <div style={{ fontSize: 8, color: '#795548', fontWeight: 700 }}>소요 시간</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#2E7D32' }}>{fastMode ? '10초' : durationLabel(COURSE_DURATIONS[selectedCourse.id] ?? 150)}</div>
                </div>
              </div>
            </div>

            {/* 출발 / 완료 버튼 */}
            {trainSession ? (
              trainTimeLeft > 0 ? (
                <div className="row between" style={{ gap: 6 }}>
                  {IS_DEV_MOCK && (
                    <button
                      className="chip honey"
                      onClick={() => setTrainTimeLeft(0)}
                      style={{ flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 11 }}
                    >
                      ⚡ 즉시 완료하기
                    </button>
                  )}
                  <button
                    disabled
                    style={{ flex: 2, padding: '7px 0', borderRadius: 10, border: 'none', background: '#FFA726', color: '#FFFFFF', fontWeight: 900, fontSize: 11 }}
                  >
                    🏋️ 훈련 중 ({trainTimeLeft}초)
                  </button>
                </div>
              ) : (
                <button
                  disabled={busy}
                  onClick={finishTraining}
                  style={{
                    minHeight: 54,
                    padding: '14px 0',
                    width: '100%',
                    borderRadius: 16,
                    border: 'none',
                    background: 'linear-gradient(90deg, #43A047, #2E7D32)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: 'pointer',
                    boxShadow: '0 4px 0 #1B5E20, 0 6px 12px rgba(46,125,50,0.3)',
                    position: 'relative',
                    zIndex: 5,
                    touchAction: 'manipulation',
                  }}
                >
                  🎁 훈련 성장 보상 수령하기!
                </button>
              )
            ) : tooTired ? (
              <div className="row between" style={{ background: '#FFF0EE', padding: '5px 8px', borderRadius: 10, border: '1px dashed #D9534F' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#D9534F' }}>💤 노곤함이 높아 훈련할 수 없어요!</span>
                <button onClick={onGoRest} style={{ padding: '3px 7px', fontSize: 10, borderRadius: 6, border: 'none', background: '#00897B', color: '#FFFFFF', fontWeight: 900, cursor: 'pointer' }}>
                  🌙 휴식하기
                </button>
              </div>
            ) : (
              <button
                disabled={busy}
                onClick={handleStartTraining}
                style={{
                  padding: '9px 0',
                  width: '100%',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(90deg, #FF7043, #FF5722)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(255,87,34,0.3)',
                }}
              >
                ⚡ {selectedCourse.name} 훈련 출발 ({fastMode ? '10초' : durationLabel(COURSE_DURATIONS[selectedCourse.id] ?? 150)})
              </button>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 탭 2: 🏰 디저트 타워 (가로 층 이동 지도 & 자율 탐사) */}
        {/* ======================================================== */}
        {activeTab === 'tower' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'space-between' }}>
            {/* 가로 진행 지도 (Horizontal Progress Rail Map) */}
            <div
              style={{
                position: 'relative',
                height: 52,
                background: 'linear-gradient(180deg, #F3E8FF 0%, #EDE7F6 100%)',
                borderRadius: 12,
                border: '1.5px solid #C084FC',
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {/* 레일 바 */}
              <div style={{ position: 'absolute', left: 16, right: 16, height: 5, background: '#D1C4E9', borderRadius: 999 }} />
              {/* 진행률 궤적 */}
              <div
                style={{
                  position: 'absolute',
                  left: 16,
                  width: towerSession
                    ? `${Math.min(92, Math.max(8, Math.round(((towerSession.currentFloor - towerSession.startFloor) / (towerSession.targetFloor - towerSession.startFloor || 1)) * 100)))}%`
                    : '10%',
                  height: 5,
                  background: 'linear-gradient(90deg, #FFB300, #7E57C2)',
                  borderRadius: 999,
                  transition: 'width 0.4s ease',
                }}
              />

              {/* 체크포인트 마커 */}
              <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11 }}>🚩</div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: '#5E35B1' }}>{towerFloor}F</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11 }}>🍬</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: '#7E57C2' }}>젤리존</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11 }}>🎁</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: '#7E57C2' }}>보물방</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11 }}>👹</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: '#7E57C2' }}>수호자</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11 }}>🏁</div>
                  <div style={{ fontSize: 8, fontWeight: 900, color: '#4527A0' }}>{towerFloor + 3}F</div>
                </div>
              </div>
            </div>

            {/* 타워 층 정보 요약 카드 */}
            <div
              style={{
                padding: '6px 8px',
                borderRadius: 10,
                background: currentFloorInfo.isBoss ? '#FFF0EE' : '#F9F5FF',
                border: currentFloorInfo.isBoss ? '1.5px solid #FF8A80' : '1px solid #D1C4E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#3E2723' }}>
                  수호자: {currentFloorInfo.enemy} {towerSession ? `· ${exploreLog}` : ''}
                </span>
                <div style={{ fontSize: 9, color: '#7E57C2', fontWeight: 800 }}>
                  권장 전투력 ⚔️ {currentFloorInfo.reqCp} · 보상 +{currentFloorInfo.rewardExp} EXP
                </div>
              </div>
              <span className="chip honey" style={{ fontSize: 10, fontWeight: 900, padding: '2px 6px' }}>
                🪙 +{currentFloorInfo.rewardCoins} 코인
              </span>
            </div>

            {/* 타워 출발 / 복귀 버튼 */}
            {towerSession ? (
              <button
                disabled={busy}
                onClick={finishExplore}
                style={{
                  padding: '9px 0',
                  width: '100%',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(90deg, #7C4DFF, #536DFE)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(124,77,255,0.3)',
                }}
              >
                🏁 탐험 완료 & 전리품 수령하기!
              </button>
            ) : tooTired ? (
              <div className="row between" style={{ background: '#FFF0EE', padding: '5px 8px', borderRadius: 10, border: '1px dashed #D9534F' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#D9534F' }}>💤 노곤함이 높아 탐험할 수 없어요!</span>
                <button onClick={onGoRest} style={{ padding: '3px 7px', fontSize: 10, borderRadius: 6, border: 'none', background: '#00897B', color: '#FFFFFF', fontWeight: 900, cursor: 'pointer' }}>
                  🌙 휴식하기
                </button>
              </div>
            ) : (
              <button
                disabled={busy}
                onClick={handleStartExplore}
                style={{
                  padding: '9px 0',
                  width: '100%',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(90deg, #7C4DFF, #651FFF)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(124,77,255,0.3)',
                }}
              >
                🏰 디저트 타워 {towerFloor}층~{towerFloor + 3}층 자율 탐험 출발!{towerEntriesLeft !== null ? ` (오늘 ${towerEntriesLeft}회 남음)` : ''}
              </button>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 탭 3: 📊 능력치 레이아웃 */}
        {/* ======================================================== */}
        {activeTab === 'stats' && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <StatBars stats={monster.stats} />
          </div>
        )}
      </div>
    </main>
  )
}
