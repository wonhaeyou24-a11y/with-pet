import { useEffect, useMemo, useRef, useState } from 'react'
import { getRibbonCoins, loadGuestBook } from '../config/boutique'
import { getClaimableMissionsCount } from '../config/missions'
import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { monsterLook, serverNow, type MonsterRow } from '../lib/api'
import { exploreState, type Trip } from '../lib/exploreApi'
import { checkEvolutionEligibility } from '../lib/evolutionEngine'
import {
  checkPetAutonomousSuggestion,
  dismissPetSuggestion,
  getActiveTowerSession,
  getActiveTrainingSession,
  requestNotificationPermission,
  scheduleAutoIdleNotifications,
  sendIdleNotification,
  scheduleTestIdleNotification,
  type PetAutonomousSuggestion,
  type TowerExpeditionSession,
  type TrainingSession,
} from '../lib/idleActivity'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import CakeBoxShareModal from './CakeBoxShareModal'
import MissionModal from './MissionModal'
import { useAccount } from '../lib/shopApi'
import DessertShowroomModal from './DessertShowroomModal'
import DessertSoundStudioModal from './DessertSoundStudioModal'
import { ChevronIcon, ElementIcon, SparkleIcon } from '../ui/Icons'
import { totalStats } from '../ui/parts'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'
import { getWorldBossStatus, type RaidStatus } from '../lib/bossScheduler'

type Props = {
  nickname: string
  monster: MonsterRow
  coins?: number
  onDetail: () => void
  onOpenCare?: () => void
  onOpenTrain?: () => void
  onOpenSkills?: () => void
  onOpenPlaza?: () => void
  onOpenEvolution?: () => void
  onOpenDex?: () => void
  onOpenMyRoom?: () => void
  onOpenBoutique?: () => void
  onOpenGear?: () => void
  onOpenExplore?: () => void
  onRewardCoins?: (amount: number) => void
  // 실제 서비스: 서버가 알려 준 코인 총액 (미션 보상)
  onCoins?: (coins: number) => void
  onResetTestEgg?: () => void
  onLogout?: () => void
}

// 하단 메뉴용 입체 타일: 모든 메뉴가 같은 높이·모서리·그림자를 쓴다
function MenuTile({
  icon,
  title,
  sub,
  from,
  to,
  rim,
  badge,
  onClick,
}: {
  icon: string
  title: string
  sub: string
  from: string
  to: string
  rim: string
  badge?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 50,
        padding: '6px 10px',
        borderRadius: 16,
        border: 'none',
        background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)`,
        boxShadow: `0 4px 0 ${rim}, 0 7px 12px rgba(0,0,0,0.14)`,
        color: '#FFFFFF',
        cursor: 'pointer',
        textAlign: 'left',
        touchAction: 'manipulation',
        minWidth: 0,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.88)',
          boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.08)',
          fontSize: 19,
          lineHeight: 1,
        }}
      >
        {icon}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.15 }}>
        <span style={{ fontSize: 14, fontWeight: 900, whiteSpace: 'nowrap', textShadow: '0 1px 0 rgba(0,0,0,0.18)' }}>{title}</span>
        <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.92, whiteSpace: 'nowrap' }}>{sub}</span>
      </span>
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -4,
            background: '#FF1744',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 900,
            padding: '2px 7px',
            borderRadius: 999,
            boxShadow: '0 2px 0 #B71C1C',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

export default function MonsterHome({
  nickname,
  monster,
  coins = 200,
  onDetail,
  onOpenCare,
  onOpenTrain,
  onOpenSkills,
  onOpenPlaza,
  onOpenEvolution,
  onOpenDex,
  onOpenMyRoom,
  onOpenBoutique,
  onOpenGear,
  onOpenExplore,
  onRewardCoins,
  onCoins,
  onResetTestEgg,
  onLogout,
}: Props) {
  const [showMissions, setShowMissions] = useState<boolean>(false)
  const [showCakeBox, setShowCakeBox] = useState<boolean>(false)
  const [showShowroom, setShowShowroom] = useState<boolean>(false)
  const [showNotifModal, setShowNotifModal] = useState<boolean>(false)
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false)
  const [showSoundStudio, setShowSoundStudio] = useState<boolean>(false)
  const [showGrowthModal, setShowGrowthModal] = useState<boolean>(false)
  const [exploreTrip, setExploreTrip] = useState<Trip | null>(null)
  const [exploreLeftSec, setExploreLeftSec] = useState<number>(0)
  const [notifStatus, setNotifStatus] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  )
  const [notifScheduled, setNotifScheduled] = useState<boolean>(false)
  const [claimableMissions, setClaimableMissions] = useState<number>(() => getClaimableMissionsCount())
  // 서버의 리본 코인·미션 진행이 바뀌면 화면도 다시 그린다
  const account = useAccount()
  useEffect(() => {
    setClaimableMissions(getClaimableMissionsCount())
  }, [account])
  const look = monsterLook(monster)
  const activeSpecies = look.mallang?.morphForm ?? monster.species
  const info = SPECIES_INFO[activeSpecies] ?? SPECIES_INFO[monster.species]

  // 🔔 마운트 시 진행 중인 훈련 및 타워 탐험 자동 백그라운드 알림 예약
  useEffect(() => {
    scheduleAutoIdleNotifications(monster.id, monster.name || info?.name || '디저트')
  }, [monster.id, monster.name, info?.name])
  const [asmrBubble, setAsmrBubble] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState<number>(0)
  const [combo, setCombo] = useState<number>(1)
  const lastTouchRef = useRef<number>(0)

  // 백그라운드 현실 시간 훈련 & 타워 세션 상태
  const [trainSess, setTrainSess] = useState<TrainingSession | null>(() => getActiveTrainingSession(monster.id))
  const [towerSess, setTowerSess] = useState<TowerExpeditionSession | null>(() => getActiveTowerSession(monster.id))
  const [trainLeftSec, setTrainLeftSec] = useState<number>(() => {
    const s = getActiveTrainingSession(monster.id)
    return s ? Math.max(0, Math.ceil((s.finishAt - Date.now()) / 1000)) : 0
  })

  // 펫의 능동적 자율 제안 상태
  const [suggestion, setSuggestion] = useState<PetAutonomousSuggestion | null>(null)

  // 🐉 디저트 월드 보스 레이드 스케줄러 상태
  const [raidStatus, setRaidStatus] = useState<RaidStatus>(() => getWorldBossStatus())

  useEffect(() => {
    const rTimer = window.setInterval(() => {
      setRaidStatus(getWorldBossStatus())
    }, 2000)
    return () => window.clearInterval(rTimer)
  }, [])

  // 진화 가능 여부 및 추천 분기 산출
  const evoEligibility = useMemo(() => checkEvolutionEligibility(monster), [monster])

  const hunger = monster.hunger ?? 80
  const mood = monster.mood ?? 80
  const fatigue = monster.fatigue ?? 0
  const cleanliness = monster.cleanliness ?? 100
  const soundKind = getSpeciesSoundKind(activeSpecies, look.mallang?.dessertBase)

  // 백그라운드 타이머 및 펫 자율 제안 폴링 (3초 간격)
  // 🧭 M5 장기 탐험 상태 동기화 (3초 간격)
  useEffect(() => {
    let mounted = true
    const checkExplore = () => {
      exploreState(monster.id)
        .then((st) => {
          if (!mounted) return
          setExploreTrip(st.trip)
          if (st.trip) {
            const left = Math.max(0, Math.ceil((Date.parse(st.trip.finishAt) - serverNow()) / 1000))
            setExploreLeftSec(left)
          } else {
            setExploreLeftSec(0)
          }
        })
        .catch(() => {})
    }
    checkExplore()
    const expTimer = window.setInterval(checkExplore, 3000)
    return () => {
      mounted = false
      window.clearInterval(expTimer)
    }
  }, [monster.id])

  const isExploring = !!exploreTrip && exploreLeftSec > 0
  const guestBookCount = useMemo(() => {
    try {
      return loadGuestBook().length
    } catch {
      return 0
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const ts = getActiveTrainingSession(monster.id)
      setTrainSess(ts)
      if (ts) {
        setTrainLeftSec(Math.max(0, Math.ceil((ts.finishAt - Date.now()) / 1000)))
      }

      const tw = getActiveTowerSession(monster.id)
      setTowerSess(tw)

      // 훈련이나 탐험이 없을 때 펫이 자율적으로 의견 제안
      const sug = checkPetAutonomousSuggestion(
        monster.id,
        monster.name ?? '디저트',
        monster.stats,
        hunger,
        fatigue,
        Number(localStorage.getItem(`tower_floor_${monster.id}`) ?? 1),
        Boolean(ts),
        Boolean(tw),
      )
      if (sug && !suggestion) {
        setSuggestion(sug)
        // 🔔 펫이 자율 의견을 제시할 때 백그라운드 시스템 알림 연동 (앱이 꺼져있을 때 수신)
        sendIdleNotification(
          `💭 [${monster.name || '디저트'}] 펫의 속삭임`,
          sug.message || sug.balloon || '주인님! 디저트 펫이 새로운 활동을 하고 싶어해요!'
        )
      }
    }, 2000)

    return () => window.clearInterval(timer)
  }, [monster, hunger, fatigue, suggestion])

  function handleTouchMonster() {
    const now = Date.now()
    const nextCombo = now - lastTouchRef.current < 1600 ? Math.min(20, combo + 1) : 1
    lastTouchRef.current = now
    setCombo(nextCombo)
    const meta = playDessertAsmr(soundKind, nextCombo - 1)
    setAsmrBubble(meta.onomatopoeia)
    setBurstKey((k) => k + 1)
    setTimeout(() => setAsmrBubble(null), 1650)
  }

  function handleAcceptSuggestion() {
    if (!suggestion) return
    const type = suggestion.type
    dismissPetSuggestion(monster.id)
    setSuggestion(null)
    if (type === 'train' || type === 'explore') {
      onOpenTrain?.()
    } else if (type === 'feed' || type === 'rest') {
      onOpenCare?.()
    }
  }

  return (
    <main
      className="screen"
      style={{
        justifyContent: 'space-between',
        width: '100%',
        minWidth: '100%',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        padding: '12px 14px calc(12px + env(safe-area-inset-bottom, 0px))',
        gap: 6,
        background: '#FAF6EE',
      }}
    >
      {/* 1. 심플 & 임팩트 상단 스마트 HUD (코인·리본·미션·알림·메뉴) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        {/* 상단 1열: 닉네임, 재화 2종, 퀵 액션 3종 (가로 390px 완벽 안착) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 12px',
            borderRadius: 16,
            background: '#FFFFFF',
            border: '1.5px solid #F0DFB8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* 프로필 & 닉네임 & 칭호 (좁은 폰에서는 이름을 말줄임으로 줄이고, 오른쪽 재화·버튼은 절대 줄바꿈하지 않는다) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFE082, #FFB74D)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 16,
                boxShadow: '0 2px 5px rgba(255,183,77,0.3)',
                flexShrink: 0,
              }}
            >
              🍰
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#3E2723', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {nickname}
                </span>
                {monster.is_shiny && (
                  <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center' }} title="빛나는 디저트">
                    <SparkleIcon size={12} />
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#FF7043', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Lv.{monster.level} 파티시에
              </div>
            </div>
          </div>

          {/* 재화 2종 & 3대 퀵 버튼 (절대 줄바꿈 없이 한 줄 정돈) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 6 }}>
            {/* 코인 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: '4px 6px',
                borderRadius: 12,
                background: '#FFF8E1',
                border: '1px solid #FFE082',
                fontSize: 11,
                fontWeight: 900,
                color: '#E65100',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title="골드 코인"
            >
              <span>🪙</span>
              <span>{coins}</span>
            </div>

            {/* 리본 코인 */}
            <div
              onClick={onOpenBoutique}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: '4px 6px',
                borderRadius: 12,
                background: '#FDF2F8',
                border: '1px solid #F472B6',
                fontSize: 11,
                fontWeight: 900,
                color: '#BE185D',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title="부티크 리본코인 (터치시 상점 이동)"
            >
              <span>🎀</span>
              <span>{getRibbonCoins()}</span>
            </div>

            {/* 미션 버튼 */}
            <button
              onClick={() => {
                setShowMissions(true)
                playDessertAsmr('mochi-squish')
              }}
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: 10,
                border: claimableMissions > 0 ? '1.5px solid #FF9800' : '1px solid #E0D3C5',
                background: claimableMissions > 0 ? '#FFF8E1' : '#FFFDF9',
                display: 'grid',
                placeItems: 'center',
                fontSize: 15,
                cursor: 'pointer',
                position: 'relative',
              }}
              title="일일 & 주간 파티세리 미션"
            >
              📜
              {claimableMissions > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    background: '#E11D48',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: 15,
                    height: 15,
                    fontSize: 9,
                    fontWeight: 900,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {claimableMissions}
                </span>
              )}
            </button>

            {/* 알림 버튼 */}
            <button
              onClick={() => {
                setShowNotifModal(true)
                playDessertAsmr('cookie-crisp')
              }}
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: 10,
                border: '1px solid #BBDEFB',
                background: '#E3F2FD',
                display: 'grid',
                placeItems: 'center',
                fontSize: 14,
                cursor: 'pointer',
              }}
              title="백그라운드 알림 센터"
            >
              🔔
            </button>

            {/* 메뉴(더보기) 버튼 */}
            <button
              onClick={() => {
                setShowMoreMenu(true)
                playDessertAsmr('sugar-crack')
              }}
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: 10,
                border: '1px solid #D7CCC8',
                background: '#EFEBE9',
                display: 'grid',
                placeItems: 'center',
                fontSize: 15,
                cursor: 'pointer',
              }}
              title="게임 메뉴 및 부가기능"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* 상단 2열: 슬림 4대 디저트 컨디션 게이지 바 (세로 24px 초슬림 일체형 카드) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            padding: '5px 8px',
            borderRadius: 12,
            background: '#FFFDF9',
            border: '1px solid #F0DFB8',
          }}
        >
          {/* 당충전 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 800, color: '#795548' }}>
              <span>🍓 당충전</span>
              <span style={{ color: '#D84315', fontWeight: 900 }}>{hunger}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 999, background: '#FFECB3', overflow: 'hidden' }}>
              <div style={{ width: `${hunger}%`, height: '100%', background: '#FF7043', borderRadius: 999 }} />
            </div>
          </div>

          {/* 달콤 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 800, color: '#795548' }}>
              <span>💖 달콤</span>
              <span style={{ color: '#AD1457', fontWeight: 900 }}>{mood}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 999, background: '#F8BBD0', overflow: 'hidden' }}>
              <div style={{ width: `${mood}%`, height: '100%', background: '#EC407A', borderRadius: 999 }} />
            </div>
          </div>

          {/* 노곤 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 800, color: fatigue >= 80 ? '#D32F2F' : '#795548' }}>
              <span>💤 노곤</span>
              <span style={{ color: fatigue >= 80 ? '#D32F2F' : '#5E35B1', fontWeight: 900 }}>{fatigue}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 999, background: '#E1BEE7', overflow: 'hidden' }}>
              <div style={{ width: `${fatigue}%`, height: '100%', background: fatigue >= 80 ? '#E53935' : '#8E24AA', borderRadius: 999 }} />
            </div>
          </div>

          {/* 윤기 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 800, color: '#795548' }}>
              <span>✨ 윤기</span>
              <span style={{ color: '#00897B', fontWeight: 900 }}>{cleanliness}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 999, background: '#B2DFDB', overflow: 'hidden' }}>
              <div style={{ width: `${cleanliness}%`, height: '100%', background: '#26A69A', borderRadius: 999 }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 3D 디저트 캐릭터 전용 스테이지 카드 (글박스 충돌 완전 해소) */}
      <div
        className="card"
        style={{
          flex: 1,
          minHeight: 0,
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            minHeight: 190,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'visible',
          }}
          onClick={handleTouchMonster}
          title="터치하면 오감 식감 ASMR 소리·진동·파편이 터져요!"
        >
          {/* 상단 액티브 상태 뱃지 (진화 가능 / 훈련 / 타워 / 탐험) */}
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: 0,
              right: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 4px',
              zIndex: 14,
              pointerEvents: 'none',
            }}
          >
            {/* 좌측: 탐험 중 뱃지 or 훈련 뱃지 or 월드 보스 침공 뱃지 */}
            <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto', flexWrap: 'wrap' }}>
              {raidStatus.isActive && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenPlaza?.()
                  }}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #EF4444, #DC2626)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 0 10px rgba(239,68,68,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    animation: 'pulse 1.5s infinite',
                  }}
                  title="터치하면 광장 보스 레이드로 이동합니다"
                >
                  <span>🔥 [보스 침공!] {raidStatus.currentBoss?.name}</span>
                </div>
              )}
              {isExploring && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenExplore?.()
                  }}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #10B981, #059669)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title="터치하면 탐험 화면으로 이동합니다"
                >
                  <span>🧭 [{exploreTrip?.region} {exploreTrip?.zone}구역] 탐험 중</span>
                  <span style={{ background: 'rgba(0,0,0,0.22)', padding: '1px 5px', borderRadius: 6 }}>
                    {Math.floor(exploreLeftSec / 60)}:{String(exploreLeftSec % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              {trainSess && !isExploring && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenTrain?.()
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: trainLeftSec > 0 ? '#FF7A59' : '#4CAF50',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(255,122,89,0.3)',
                    cursor: 'pointer',
                  }}
                >
                  {trainLeftSec > 0
                    ? `🏋️ [훈련] ${Math.floor(trainLeftSec / 60)}:${String(trainLeftSec % 60).padStart(2, '0')}`
                    : '🎉 훈련 완료!'}
                </div>
              )}
            </div>

            {/* 우측: 타워 등반 뱃지 or 진화 가능 뱃지 */}
            <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
              {towerSess && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenTrain?.()
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: '#7C4DFF',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(124,77,255,0.3)',
                    cursor: 'pointer',
                  }}
                >
                  🏰 타워 {towerSess.currentFloor}층 등반 중
                </div>
              )}
              {evoEligibility.canEvolve && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenEvolution?.()
                  }}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #FFD700, #FF6F00)',
                    color: '#3E2723',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(255,215,0,0.5)',
                    cursor: 'pointer',
                    animation: 'bounce 1.5s infinite ease-in-out',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✨ 각성 진화 가능!
                </div>
              )}
            </div>
          </div>

          {/* 펫의 자율 생각 말풍선 (상단 보스침공/탐험 배지와 겹치지 않도록 동적 안전 헤드룸 적용) */}
          {!asmrBubble && suggestion && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                handleAcceptSuggestion()
              }}
              style={{
                position: 'absolute',
                top: (raidStatus.isActive || isExploring || trainSess || towerSess || evoEligibility.canEvolve) ? 34 : 6,
                zIndex: 13,
                maxWidth: '88%',
                padding: '5px 12px',
                borderRadius: 16,
                background: '#FFFDF5',
                border: '2px solid #FF9800',
                color: '#3E2723',
                fontSize: 12.5,
                fontWeight: 900,
                lineHeight: 1.35,
                textAlign: 'center',
                boxShadow: '0 4px 14px rgba(78,52,46,0.18)',
                animation: 'bounce 2s infinite ease-in-out',
                cursor: 'pointer',
              }}
              title="터치하면 펫의 생각대로 바로 이동합니다!"
            >
              <span>💭 {suggestion.balloon}</span>
              {/* 말풍선 아래 꼬리표 (포인터 화살표) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -7,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderTop: '7px solid #FF9800',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -5,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid #FFFDF5',
                }}
              />
            </div>
          )}

          <SensoryBurst kind={soundKind} triggerKey={burstKey} bubble={asmrBubble} combo={combo} />
          <div
            key={`home-react-${burstKey}`}
            className={burstKey > 0 ? getSensoryReactionClass(soundKind) : ''}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: (!asmrBubble && suggestion) ? 44 : 26,
              transition: 'padding-top 0.3s ease',
            }}
          >
            {/* 🌟 메인 디저트 펫 강조: 145px ➔ 210px 짤림 없이 시원하게 표시 */}
            <MonsterView look={look} size={210} title={info?.name} />
          </div>
        </div>

        {/* 캐릭터 이름 및 종족·속성·레벨 뱃지 (캐릭터와 절대 겹치지 않게 분리) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%', flexShrink: 0, marginTop: 4 }}>
          <h1 className="title-xl" style={{ fontSize: 18, margin: 0, lineHeight: 1.1 }}>{monster.name}</h1>
          {/* 🌟 1줄 일렬 정렬: 종족 · 식감 · 속성 · 레벨 뱃지 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'nowrap',
              gap: 4,
              width: '100%',
              maxWidth: 380,
              padding: '0 4px',
              boxSizing: 'border-box',
            }}
          >
            <span className="chip" style={{ fontSize: 10.5, padding: '2px 6px', whiteSpace: 'nowrap' }}>
              {info?.name ?? monster.species}
            </span>
            {info?.textureLabel && (
              <span className="chip honey" style={{ fontSize: 10.5, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                {info.textureLabel}
              </span>
            )}
            <span className="chip" style={{ fontSize: 10.5, padding: '2px 6px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <ElementIcon element={monster.element} size={12} />
              <span>{ELEMENT_INFO[monster.element].label}</span>
            </span>
            <span className="chip coral" style={{ fontSize: 10.5, padding: '2px 6px', whiteSpace: 'nowrap', fontWeight: 900 }}>
              Lv.{monster.level}
            </span>
          </div>
        </div>
      </div>



      {/* 🌟 4. 플레이팅 변신공방 와이드 배너 버튼 (능력치 창 대신 메뉴 위에 길게 한 줄로 재배치) */}
      <button
        onClick={onDetail}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 14,
          border: 'none',
          background: 'linear-gradient(90deg, #FF7043 0%, #FF9800 50%, #FFA726 100%)',
          color: '#FFFFFF',
          fontWeight: 900,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 3px 10px rgba(255, 112, 67, 0.32)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🧁</span>
          <span style={{ letterSpacing: '0.2px' }}>펫 상세 프로필 · 육성 기록</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.25)', padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 900 }}>
          <span>전투력 ⚔️ {totalStats(monster.stats)}</span>
          <ChevronIcon size={13} />
        </div>
      </button>

      {/* 4. 하단 메뉴 8개: 정확히 4행 2열 (8개 타일 컴팩트 복원) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, flexShrink: 0 }}>
        {/* (1) 돌보기 */}
        <MenuTile icon="🍓" title="토핑 · 돌보기" sub="밥·놀기·씻기" from="#FF8A65" to="#E64A19" rim="#BF360C" onClick={onOpenCare} />
        {/* (2) 훈련 */}
        <MenuTile icon="🧁" title="파티세리 훈련" sub="능력치 UP·타워" from="#4DB6AC" to="#00897B" rim="#00695C" onClick={onOpenTrain} />
        {/* (3) 성장 · 강화 (스킬트리 + 장비강화 + 진화의전당 통합 허브) */}
        <MenuTile
          icon="✨"
          title="성장 · 강화"
          sub="스킬·장비·진화"
          badge={evoEligibility.canEvolve ? 'UP!' : undefined}
          from="#F59E0B"
          to="#D97706"
          rim="#92400E"
          onClick={() => setShowGrowthModal(true)}
        />
        {/* (4) 탐험 (M5 장기 탐험) */}
        <MenuTile
          icon="🧭"
          title="탐험"
          sub="방치 보상·일지"
          badge={isExploring ? '진행중' : undefined}
          from="#10B981"
          to="#059669"
          rim="#047857"
          onClick={onOpenExplore}
        />
        {/* (5) 광장 · 대전 */}
        <MenuTile icon="🏆" title="광장 · 대전" sub="지인 구경·친선전" from="#FFB74D" to="#F57C00" rim="#E65100" onClick={onOpenPlaza} />
        {/* (6) 나만의 미니룸 */}
        <MenuTile
          icon="🏰"
          title="나만의 미니룸"
          sub="방명록·꾸미기"
          badge={guestBookCount > 0 ? `새 글 ${guestBookCount}` : undefined}
          from="#F472B6"
          to="#DB2777"
          rim="#9D174D"
          onClick={onOpenMyRoom}
        />
        {/* (7) 부티크 상점 */}
        <MenuTile icon="🛍️" title="부티크 상점" sub="3D 피팅룸" from="#FB7185" to="#E11D48" rim="#9F1239" onClick={onOpenBoutique} />
        {/* (8) 디저트 도감 */}
        <MenuTile icon="📖" title="디저트 도감" sub="모아보기" from="#34D399" to="#059669" rim="#047857" onClick={onOpenDex} />
      </div>

      {/* 미션 모달 */}
      {showMissions && (
        <MissionModal
          onSetCoins={onCoins}
          onRewardCoins={(amount) => {
            onRewardCoins?.(amount)
            setClaimableMissions(getClaimableMissionsCount())
          }}
          onClose={() => {
            setShowMissions(false)
            setClaimableMissions(getClaimableMissionsCount())
          }}
        />
      )}

            {/* ✨ 디저트 펫 성장 · 강화 허브 모달 (식감 스킬트리 / 장비 강화 / 진화의 전당) */}
      {showGrowthModal && (
        <div
          onClick={() => setShowGrowthModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(30, 20, 15, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 12,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: '#FFFDF9',
              borderRadius: 24,
              padding: '20px 18px',
              border: '2px solid #FFE082',
              boxShadow: '0 -8px 28px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>✨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#3E2723' }}>디저트 펫 성장 · 강화</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#8D6E63' }}>스킬, 장비, 각성 진화로 펫을 강력하게 키워보세요!</p>
                </div>
              </div>
              <button
                onClick={() => setShowGrowthModal(false)}
                style={{
                  border: 'none',
                  background: '#F5EBE1',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 900,
                  color: '#6D4C41',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {/* 1. 식감 스킬트리 */}
              <button
                onClick={() => {
                  setShowGrowthModal(false)
                  onOpenSkills?.()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  borderRadius: 16,
                  border: '1.5px solid #D1C4E9',
                  background: 'linear-gradient(135deg, #F3E5F5 0%, #EDE7F6 100%)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #9575CD, #673AB7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    boxShadow: '0 3px 8px rgba(103,58,183,0.3)',
                    flexShrink: 0,
                  }}
                >
                  🌈
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#4527A0' }}>식감 스킬트리</span>
                    <span style={{ fontSize: 11, color: '#7E57C2', fontWeight: 800 }}>오감 식감 시너지 →</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#5E35B1' }}>
                    바삭·쫀득·사르르 고유 스킬을 습득하고 스킬 슬롯에 장착합니다.
                  </p>
                </div>
              </button>

              {/* 2. 장비 · 강화 */}
              <button
                onClick={() => {
                  setShowGrowthModal(false)
                  onOpenGear?.()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  borderRadius: 16,
                  border: '1.5px solid #BBDEFB',
                  background: 'linear-gradient(135deg, #E3F2FD 0%, #E1F5FE 100%)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #64B5F6, #1976D2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    boxShadow: '0 3px 8px rgba(25,118,210,0.3)',
                    flexShrink: 0,
                  }}
                >
                  🥄
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#0D47A1' }}>장비 · 강화</span>
                    <span style={{ fontSize: 11, color: '#1976D2', fontWeight: 800 }}>최대 10강 돌파 →</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#1565C0' }}>
                    디저트 포크·스푼·접시를 장착하여 공격력과 방어력을 극대화합니다.
                  </p>
                </div>
              </button>

              {/* 3. 진화의 전당 */}
              <button
                onClick={() => {
                  setShowGrowthModal(false)
                  onOpenEvolution?.()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  borderRadius: 16,
                  border: evoEligibility.canEvolve ? '2px solid #FFB300' : '1.5px solid #FFE082',
                  background: evoEligibility.canEvolve
                    ? 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)'
                    : 'linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: evoEligibility.canEvolve ? '0 4px 12px rgba(255,179,0,0.35)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    boxShadow: '0 3px 8px rgba(245,158,11,0.35)',
                    flexShrink: 0,
                  }}
                >
                  ✨
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#B45309' }}>진화의 전당</span>
                      {evoEligibility.canEvolve && (
                        <span
                          style={{
                            background: '#D97706',
                            color: '#FFFFFF',
                            fontSize: 10,
                            fontWeight: 900,
                            padding: '1px 6px',
                            borderRadius: 999,
                          }}
                        >
                          UP!
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#B45309', fontWeight: 800 }}>{monster.evo_stage ?? 1}단계 각성 →</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#92400E' }}>
                    {evoEligibility.canEvolve
                      ? `🎉 축하합니다! ${evoEligibility.targetStage}단계 각성 진화가 준비되었습니다.`
                      : '레벨과 애정도를 채워 시네마틱 각성 진화와 브랜치 분기를 해금하세요.'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 케이크 상자 포장 카드 자랑 모달 */}
      {showCakeBox && (
        <CakeBoxShareModal
          monster={monster}
          ownerNickname={nickname}
          onClose={() => setShowCakeBox(false)}
        />
      )}

      {/* ✨ Stitch 디저트 비주얼 에셋 쇼룸 모달 */}
      {showShowroom && (
        <DessertShowroomModal
          onClose={() => setShowShowroom(false)}
          onNavigateToBoutique={onOpenBoutique}
        />
      )}

      {/* 🔔 백그라운드 알림 확인 및 테스트 모달 */}
      {showNotifModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowNotifModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#FFFDF9',
              borderRadius: 20,
              border: '2px solid #64B5F6',
              boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>🔔</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0D47A1' }}>
                  백그라운드 알림 센터
                </h3>
                <p style={{ margin: 0, fontSize: 10, color: '#546E7A' }}>
                  앱을 닫고 있어도 훈련·탐험 완료 시 시스템 알림 수신
                </p>
              </div>
            </div>

            {/* 현재 권한 상태 안내 박스 */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: notifStatus === 'granted' ? '#E8F5E9' : '#FFF3E0',
                border: notifStatus === 'granted' ? '1.5px solid #81C784' : '1.5px solid #FFB74D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: '#37474F' }}>
                기기 알림 권한 상태:
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: notifStatus === 'granted' ? '#2E7D32' : '#E65100',
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: '#FFFFFF',
                }}
              >
                {notifStatus === 'granted'
                  ? '✅ 수신 가능 (허용됨)'
                  : notifStatus === 'denied'
                    ? '❌ 차단됨 (설정 필요)'
                    : '⚠️ 미설정'}
              </span>
            </div>

            {notifStatus !== 'granted' && (
              <button
                onClick={async () => {
                  const ok = await requestNotificationPermission()
                  setNotifStatus(ok ? 'granted' : 'denied')
                  if (ok) playDessertAsmr('sugar-crack')
                }}
                style={{
                  padding: '9px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(90deg, #1976D2, #1565C0)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(25,118,210,0.3)',
                }}
              >
                🔔 알림 권한 켜기
              </button>
            )}

            {/* 백그라운드 3초 후 테스트 알림 발송 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 10, color: '#546E7A', lineHeight: 1.35 }}>
                💡 <b>테스트 방법</b>: 아래 버튼을 누른 즉시 <b>홈 버튼을 눌러 앱 밖으로 나가보세요!</b> 3초 뒤 상단에 푸시 알림이 도착합니다.
              </div>
              <button
                disabled={notifScheduled}
                onClick={async () => {
                  if (notifStatus !== 'granted') {
                    const ok = await requestNotificationPermission()
                    setNotifStatus(ok ? 'granted' : 'denied')
                    if (!ok) return
                  }
                  setNotifScheduled(true)
                  scheduleTestIdleNotification(monster.name ?? '디저트', 3)
                  playDessertAsmr('cookie-crisp')
                  setTimeout(() => setNotifScheduled(false), 4000)
                }}
                style={{
                  padding: '10px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: notifScheduled
                    ? '#B0BEC5'
                    : 'linear-gradient(90deg, #FF7043, #E64A19)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: notifScheduled ? 'default' : 'pointer',
                  boxShadow: '0 3px 8px rgba(230,74,25,0.3)',
                }}
              >
                {notifScheduled ? '⏳ 3초 카운트다운 중! (앱 밖으로 나가세요)' : '🚀 3초 후 백그라운드 테스트 알림 받기'}
              </button>
            </div>

            <button
              onClick={() => setShowNotifModal(false)}
              style={{
                padding: '8px 0',
                borderRadius: 10,
                border: '1px solid #CFD8DC',
                background: '#ECEFF1',
                color: '#455A64',
                fontWeight: 800,
                fontSize: 11,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 5. 부가기능 및 시스템 더보기 메뉴 팝오버 모달 */}
      {showMoreMenu && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 300,
              background: '#FFFDF9',
              borderRadius: 20,
              border: '2px solid #E0D3C5',
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row between" style={{ alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#3E2723' }}>⚙️ 게임 메뉴 및 도구</div>
              <button
                onClick={() => setShowMoreMenu(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 14,
                  cursor: 'pointer',
                  color: '#8D6E63',
                  fontWeight: 900,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
              {/* 🎧 펫 ASMR 사운드 스튜디오 (15종 청음실) */}
              <button
                onClick={() => {
                  setShowMoreMenu(false)
                  setShowSoundStudio(true)
                  playDessertAsmr('kataifi-crunch')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '2px solid #FF9800',
                  background: 'linear-gradient(90deg, #FFF3E0, #FFE0B2)',
                  color: '#E65100',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(255,152,0,0.25)',
                }}
              >
                <span style={{ fontSize: 18 }}>🎧</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ lineHeight: 1.1 }}>펫 ASMR 사운드 스튜디오</div>
                  <div style={{ fontSize: 9, color: '#D84315', fontWeight: 800 }}>15종 전 종족 리얼 식감 청음실</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false)
                  setShowShowroom(true)
                  playDessertAsmr('sugar-crack')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 12,
                  border: '1.5px solid #FFD54F',
                  background: 'linear-gradient(90deg, #FFF8E1, #FFECB3)',
                  color: '#E65100',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 16 }}>✨</span>
                <span>Stitch 디저트 비주얼 쇼룸</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false)
                  setShowCakeBox(true)
                  playDessertAsmr('sugar-crack')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 12,
                  border: '1.5px solid #FBCFE8',
                  background: '#FFF5F7',
                  color: '#BE185D',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 16 }}>🎁</span>
                <span>케이크 상자 포장 카드 자랑</span>
              </button>

              {onResetTestEgg && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false)
                    onResetTestEgg()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 12,
                    border: '1.5px solid #BBDEFB',
                    background: '#EBF8FF',
                    color: '#0288D1',
                    fontWeight: 900,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 16 }}>🥚</span>
                  <span>테스트용 1분 디저트 알 리셋</span>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false)
                    onLogout()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 12,
                    border: '1px solid #CFD8DC',
                    background: '#ECEFF1',
                    color: '#455A64',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 16 }}>🚪</span>
                  <span>로그아웃</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setShowMoreMenu(false)}
              style={{
                padding: '8px 0',
                borderRadius: 10,
                border: '1px solid #CFD8DC',
                background: '#ECEFF1',
                color: '#455A64',
                fontWeight: 800,
                fontSize: 11,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 6. 🎧 디저트 펫 ASMR 사운드 스튜디오 (전 종족 청음실) 모달 */}
      {showSoundStudio && <DessertSoundStudioModal onClose={() => setShowSoundStudio(false)} />}
    </main>
  )
}
