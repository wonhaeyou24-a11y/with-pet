import { useEffect, useMemo, useRef, useState } from 'react'
import { getRibbonCoins } from '../config/boutique'
import { getClaimableMissionsCount } from '../config/missions'
import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { checkEvolutionEligibility } from '../lib/evolutionEngine'
import {
  checkPetAutonomousSuggestion,
  dismissPetSuggestion,
  getActiveTowerSession,
  getActiveTrainingSession,
  requestNotificationPermission,
  scheduleTestIdleNotification,
  type PetAutonomousSuggestion,
  type TowerExpeditionSession,
  type TrainingSession,
} from '../lib/idleActivity'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import CakeBoxShareModal from './CakeBoxShareModal'
import MissionModal from './MissionModal'
import DessertShowroomModal from './DessertShowroomModal'
import { ChevronIcon, ElementIcon, SparkleIcon } from '../ui/Icons'
import { StatBars, TopBar, totalStats } from '../ui/parts'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'

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
  onRewardCoins?: (amount: number) => void
  onResetTestEgg?: () => void
  onLogout?: () => void
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
  onRewardCoins,
  onResetTestEgg,
  onLogout,
}: Props) {
  const [showMissions, setShowMissions] = useState<boolean>(false)
  const [showCakeBox, setShowCakeBox] = useState<boolean>(false)
  const [showShowroom, setShowShowroom] = useState<boolean>(false)
  const [showNotifModal, setShowNotifModal] = useState<boolean>(false)
  const [notifStatus, setNotifStatus] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  )
  const [notifScheduled, setNotifScheduled] = useState<boolean>(false)
  const [claimableMissions, setClaimableMissions] = useState<number>(() => getClaimableMissionsCount())
  const look = monsterLook(monster)
  const activeSpecies = look.mallang?.morphForm ?? monster.species
  const info = SPECIES_INFO[activeSpecies] ?? SPECIES_INFO[monster.species]
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

  // 진화 가능 여부 및 추천 분기 산출
  const evoEligibility = useMemo(() => checkEvolutionEligibility(monster), [monster])

  const hunger = monster.hunger ?? 80
  const mood = monster.mood ?? 80
  const fatigue = monster.fatigue ?? 0
  const cleanliness = monster.cleanliness ?? 100
  const soundKind = getSpeciesSoundKind(activeSpecies, look.mallang?.dessertBase)

  // 백그라운드 타이머 및 펫 자율 제안 폴링 (3초 간격)
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
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        padding: '12px 14px calc(12px + env(safe-area-inset-bottom, 0px))',
        gap: 6,
      }}
    >
      {/* 1. 상단 바 & 코인·알 리셋 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <TopBar nickname={nickname} onLogout={onLogout} />
        <div className="row wrap between" style={{ gap: 4 }}>
          <div className="row" style={{ gap: 4 }}>
            {monster.is_shiny && (
              <span className="chip honey" style={{ fontSize: 12, padding: '2px 7px' }}>
                <SparkleIcon size={13} /> 빛나는
              </span>
            )}
            <span className="chip honey" style={{ fontSize: 12, fontWeight: 800, padding: '2px 7px' }}>
              🪙 {coins} 코인
            </span>
            <span
              onClick={onOpenBoutique}
              className="chip"
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '2px 7px',
                background: '#FDF2F8',
                border: '1px solid #F472B6',
                color: '#BE185D',
                cursor: 'pointer',
              }}
              title="부티크 상점 가기"
            >
              🎀 {getRibbonCoins()}
            </span>
          </div>
          <div className="row" style={{ gap: 4 }}>
            <button
              className="chip"
              onClick={() => {
                setShowMissions(true)
                playDessertAsmr('mochi-squish')
              }}
              style={{
                cursor: 'pointer',
                border: claimableMissions > 0 ? '1.5px solid #FF9800' : 'none',
                fontWeight: 800,
                fontSize: 12,
                background: claimableMissions > 0 ? '#FFF8E1' : '#FFF9F0',
                color: '#E65100',
                padding: '2px 7px',
                position: 'relative',
              }}
              title="일일 & 주간 파티세리 미션"
            >
              📜 미션
              {claimableMissions > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#E11D48',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    width: 14,
                    height: 14,
                    fontSize: 9,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {claimableMissions}
                </span>
              )}
            </button>
            <button
              className="chip"
              onClick={() => {
                setShowNotifModal(true)
                playDessertAsmr('cookie-crisp')
              }}
              style={{
                cursor: 'pointer',
                border: '1px solid #BBDEFB',
                fontWeight: 900,
                fontSize: 12,
                background: '#E3F2FD',
                color: '#1565C0',
                padding: '2px 7px',
              }}
              title="백그라운드 알림 상태 확인 및 테스트"
            >
              🔔 알림
            </button>
            <button
              className="chip"
              onClick={() => {
                setShowShowroom(true)
                playDessertAsmr('sugar-crack')
              }}
              style={{
                cursor: 'pointer',
                border: '1px solid #FFD54F',
                fontWeight: 900,
                fontSize: 12,
                background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
                color: '#E65100',
                padding: '2px 8px',
                boxShadow: '0 2px 6px rgba(255, 179, 0, 0.25)',
              }}
              title="Stitch 고품질 디저트 비주얼 에셋 키트 쇼룸"
            >
              ✨ 쇼룸
            </button>
            <button
              className="chip"
              onClick={() => {
                setShowCakeBox(true)
                playDessertAsmr('sugar-crack')
              }}
              style={{
                cursor: 'pointer',
                border: '1px solid #FBCFE8',
                fontWeight: 800,
                fontSize: 12,
                background: '#FFF5F7',
                color: '#BE185D',
                padding: '2px 7px',
              }}
              title="파티세리 케이크 상자 포장 카드 자랑"
            >
              🎁 포장 자랑
            </button>
            <button
              className="chip"
              onClick={handleTouchMonster}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, background: '#FFF2EC', color: '#D85A3A', padding: '2px 7px' }}
            >
              🎧 ASMR
            </button>
            {onResetTestEgg && (
              <button
                className="chip"
                onClick={onResetTestEgg}
                style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, background: '#EBF8FF', color: '#1976D2', padding: '2px 8px' }}
                title="테스트용 새 1분 디저트 알을 다시 받습니다"
              >
                🥚 1분 알
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. 4대 디저트 컨디션 게이지 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 5, flexShrink: 0 }}>
        <div style={{ padding: '5px 4px', borderRadius: 12, background: '#FFF8F2', border: '1px solid #F0DFB8', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', whiteSpace: 'nowrap' }}>🍓 당충전 {hunger}</div>
        </div>
        <div style={{ padding: '5px 4px', borderRadius: 12, background: '#FFF8F2', border: '1px solid #F0DFB8', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', whiteSpace: 'nowrap' }}>💖 달콤함 {mood}</div>
        </div>
        <div
          style={{
            padding: '5px 4px',
            borderRadius: 12,
            background: fatigue >= 80 ? '#FFF0EE' : '#FFF8F2',
            border: fatigue >= 80 ? '1.5px solid #D9534F' : '1px solid #F0DFB8',
            textAlign: 'center',
            color: fatigue >= 80 ? '#D9534F' : '#3B2F2F',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>💤 노곤함 {fatigue}</div>
        </div>
        <div style={{ padding: '5px 4px', borderRadius: 12, background: '#FFF8F2', border: '1px solid #F0DFB8', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', whiteSpace: 'nowrap' }}>✨ 윤기 {cleanliness}</div>
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
            minHeight: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={handleTouchMonster}
          title="터치하면 오감 식감 ASMR 소리·진동·파편이 터져요!"
        >
          {/* 진화 가능 강조 뱃지 */}
          {evoEligibility.canEvolve && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onOpenEvolution?.()
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 12,
                padding: '3px 10px',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #FFD700, #FF6F00)',
                color: '#3E2723',
                fontSize: 11,
                fontWeight: 900,
                boxShadow: '0 3px 10px rgba(255,215,0,0.5)',
                cursor: 'pointer',
                animation: 'bounce 1.5s infinite ease-in-out',
                whiteSpace: 'nowrap',
              }}
            >
              ✨ {evoEligibility.targetStage}단계 각성 진화 가능!
            </div>
          )}

          {/* 백그라운드 훈련 / 타워 탐험 진행 뱃지 */}
          {trainSess && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onOpenTrain?.()
              }}
              style={{
                position: 'absolute',
                top: 2,
                left: 4,
                zIndex: 10,
                padding: '3px 8px',
                borderRadius: 999,
                background: trainLeftSec > 0 ? '#FF7A59' : '#4CAF50',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 900,
                boxShadow: '0 3px 8px rgba(255,122,89,0.3)',
              }}
            >
              {trainLeftSec > 0
                ? `🏋️ [훈련] ${Math.floor(trainLeftSec / 60)}:${String(trainLeftSec % 60).padStart(2, '0')}`
                : '🎉 훈련 완료!'}
            </div>
          )}
          {towerSess && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onOpenTrain?.()
              }}
              style={{
                position: 'absolute',
                top: 2,
                right: 4,
                zIndex: 10,
                padding: '3px 8px',
                borderRadius: 999,
                background: '#7C4DFF',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 900,
                boxShadow: '0 3px 8px rgba(124,77,255,0.3)',
              }}
            >
              🏰 타워 {towerSess.currentFloor}층 등반 중
            </div>
          )}

          {/* 펫의 자율 생각 말풍선 */}
          {!asmrBubble && suggestion && (
            <div
              style={{
                position: 'absolute',
                top: 2,
                zIndex: 9,
                padding: '3px 10px',
                borderRadius: 999,
                background: 'rgba(255, 253, 245, 0.96)',
                border: '1.5px solid #FFB74D',
                color: '#4E342E',
                fontSize: 11,
                fontWeight: 800,
                boxShadow: '0 3px 10px rgba(78,52,46,0.15)',
                animation: 'bounce 2s infinite ease-in-out',
                maxWidth: '85%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              💭 {suggestion.balloon}
            </div>
          )}

          <SensoryBurst kind={soundKind} triggerKey={burstKey} bubble={asmrBubble} combo={combo} />
          <div
            key={`home-react-${burstKey}`}
            className={burstKey > 0 ? getSensoryReactionClass(soundKind) : ''}
            style={{ position: 'relative', zIndex: 1, marginTop: 8 }}
          >
            <MonsterView look={look} size={145} title={info?.name} />
          </div>
        </div>

        {/* 캐릭터 이름 및 종족·속성·레벨 뱃지 (캐릭터와 절대 겹치지 않게 분리) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%', flexShrink: 0, marginTop: 4 }}>
          <h1 className="title-xl" style={{ fontSize: 18, margin: 0, lineHeight: 1.1 }}>{monster.name}</h1>
          <div className="row wrap center" style={{ gap: 4 }}>
            <span className="chip" style={{ fontSize: 11, padding: '2px 7px' }}>{info?.name ?? monster.species}</span>
            {info?.textureLabel && <span className="chip honey" style={{ fontSize: 11, padding: '2px 7px' }}>{info.textureLabel}</span>}
            <span className="chip" style={{ fontSize: 11, padding: '2px 7px' }}>
              <ElementIcon element={monster.element} size={13} />
              {ELEMENT_INFO[monster.element].label}
            </span>
            <span className="chip coral" style={{ fontSize: 11, padding: '2px 7px' }}>Lv.{monster.level}</span>
          </div>
        </div>
      </div>

      {/* 3-1. 펫의 능동적 자율 제안 소통 카드 (컴팩트 독립 슬롯) */}
      {suggestion && (
        <div
          style={{
            padding: '6px 10px',
            borderRadius: 12,
            background: 'linear-gradient(90deg, #FFF8E1 0%, #FFECB3 100%)',
            border: '1.5px solid #FFC107',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(255,193,7,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#4E342E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {suggestion.message}
            </span>
          </div>
          <div className="row" style={{ gap: 4, flexShrink: 0 }}>
            <button
              className="chip honey"
              onClick={handleAcceptSuggestion}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 900, fontSize: 11, padding: '2px 7px' }}
            >
              {suggestion.actionLabel}
            </button>
            <button
              className="chip"
              onClick={() => {
                dismissPetSuggestion(monster.id)
                setSuggestion(null)
              }}
              style={{ cursor: 'pointer', border: 'none', fontSize: 11, padding: '2px 5px' }}
              title="닫기"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 4. 능력치 요약 카드 */}
      <div className="card tight" style={{ flexShrink: 0, padding: '8px 12px', gap: 4 }}>
        <div className="row between">
          <h2 className="title" style={{ fontSize: 14 }}>
            능력치 <span className="chip" style={{ fontSize: 12, marginLeft: 4, padding: '1px 6px' }}>총점 {totalStats(monster.stats)}</span>
          </h2>
          <button className="btn-link" onClick={onDetail} style={{ padding: 2, fontWeight: 800, fontSize: 12 }}>
            🍰 플레이팅·변신 공방 <ChevronIcon size={14} />
          </button>
        </div>
        <StatBars stats={monster.stats} compact />
      </div>

      {/* 4-1. 싸이월드 감성 마이룸 & 부티크 상점 서브 네비게이션 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flexShrink: 0 }}>
        <button
          onClick={onOpenMyRoom}
          style={{
            padding: '7px 8px',
            borderRadius: 12,
            border: '1.5px solid #F472B6',
            background: 'linear-gradient(90deg, #FDF2F8 0%, #FCE7F3 100%)',
            color: '#BE185D',
            fontSize: 12,
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            boxShadow: '0 2px 6px rgba(244,114,182,0.15)',
          }}
        >
          <span>🏰 나만의 미니룸</span>
          <span style={{ fontSize: 10, color: '#DB2777' }}>방명록</span>
        </button>

        <button
          onClick={onOpenBoutique}
          style={{
            padding: '7px 8px',
            borderRadius: 12,
            border: '1.5px solid #F472B6',
            background: 'linear-gradient(90deg, #FFF1F2 0%, #FFE4E6 100%)',
            color: '#9D174D',
            fontSize: 12,
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            boxShadow: '0 2px 6px rgba(244,114,182,0.15)',
          }}
        >
          <span>🛍️ 부티크 상점</span>
          <span style={{ fontSize: 10, color: '#E11D48' }}>피팅룸</span>
        </button>
      </div>

      {/* 4-2. M4 진화의 전당 & 디저트 도감 서브 네비게이션 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flexShrink: 0 }}>
        <button
          onClick={onOpenEvolution}
          style={{
            padding: '7px 8px',
            borderRadius: 12,
            border: evoEligibility.canEvolve ? '1.5px solid #FFD700' : '1px solid #E0D3C5',
            background: evoEligibility.canEvolve
              ? 'linear-gradient(90deg, #FFF8E1 0%, #FFE082 100%)'
              : '#FFF8F2',
            color: evoEligibility.canEvolve ? '#E65100' : '#4E342E',
            fontSize: 12,
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <span>✨ {evoEligibility.canEvolve ? '진화 가능!' : '진화의 전당'}</span>
          <span style={{ fontSize: 10, color: evoEligibility.canEvolve ? '#D84315' : '#8D6E63' }}>
            ({monster.evo_stage ?? 1}단계)
          </span>
        </button>

        <button
          onClick={onOpenDex}
          style={{
            padding: '7px 8px',
            borderRadius: 12,
            border: '1px solid #E0D3C5',
            background: '#FFF8F2',
            color: '#4E342E',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <span>📖 디저트 도감</span>
        </button>
      </div>

      {/* 5. 하단 4대 네비게이션 버튼 (2×2 그리드) */}
      <div className="grid-2" style={{ gap: 6, flexShrink: 0 }}>
        <button className="btn" onClick={onOpenCare} style={{ padding: '10px 8px', fontSize: 13, minHeight: 46 }}>
          <span>🍓 토핑·돌보기</span>
        </button>
        <button className="btn mint" onClick={onOpenTrain} style={{ padding: '10px 8px', fontSize: 13, minHeight: 46 }}>
          <span>🧁 파티세리 훈련</span>
        </button>
        <button
          className="btn"
          onClick={onOpenSkills}
          style={{ padding: '10px 8px', fontSize: 13, minHeight: 46, background: 'linear-gradient(180deg, #9C6ADE 0%, #7C4DFF 100%)', boxShadow: '0 4px 0 #5E35B1' }}
        >
          <span>🌈 식감 스킬트리</span>
        </button>
        <button
          className="btn"
          onClick={onOpenPlaza}
          style={{ padding: '10px 8px', fontSize: 13, minHeight: 46, background: 'linear-gradient(180deg, #FFB74D 0%, #F57C00 100%)', boxShadow: '0 4px 0 #E65100' }}
        >
          <span>🏆 광장 · ASMR 대전</span>
        </button>
      </div>

      {/* 미션 모달 */}
      {showMissions && (
        <MissionModal
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
    </main>
  )
}
