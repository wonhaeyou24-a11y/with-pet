import { useEffect, useRef, useState } from 'react'
import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import {
  checkPetAutonomousSuggestion,
  dismissPetSuggestion,
  getActiveTowerSession,
  getActiveTrainingSession,
  type PetAutonomousSuggestion,
  type TowerExpeditionSession,
  type TrainingSession,
} from '../lib/idleActivity'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
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
  onResetTestEgg,
  onLogout,
}: Props) {
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
    <main className="screen" style={{ justifyContent: 'space-between' }}>
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
          </div>
          <div className="row" style={{ gap: 4 }}>
            <button
              className="chip"
              onClick={handleTouchMonster}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, background: '#FFF2EC', color: '#D85A3A', padding: '2px 8px' }}
            >
              🎧 식감 ASMR
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
          {/* 백그라운드 훈련 / 타워 탐험 진행 뱃지 */}
          {trainSess && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onOpenTrain?.()
              }}
              style={{
                position: 'absolute',
                top: 4,
                left: 6,
                zIndex: 10,
                padding: '4px 9px',
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
                top: 4,
                right: 6,
                zIndex: 10,
                padding: '4px 9px',
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
                top: 6,
                zIndex: 9,
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(255, 253, 245, 0.95)',
                border: '1.5px solid #FFB74D',
                color: '#4E342E',
                fontSize: 12,
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(78,52,46,0.15)',
                animation: 'bounce 2s infinite ease-in-out',
              }}
            >
              💭 {suggestion.balloon}
            </div>
          )}

          <SensoryBurst kind={soundKind} triggerKey={burstKey} bubble={asmrBubble} combo={combo} />
          <div
            key={`home-react-${burstKey}`}
            className={burstKey > 0 ? getSensoryReactionClass(soundKind) : ''}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <MonsterView look={look} size={170} title={info?.name} />
          </div>
        </div>

        {/* 캐릭터 이름 및 종족·속성·레벨 뱃지 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
          <h1 className="title-xl" style={{ fontSize: 20, margin: 0, lineHeight: 1.1 }}>{monster.name}</h1>
          <div className="row wrap center" style={{ gap: 4 }}>
            <span className="chip" style={{ fontSize: 12, padding: '2px 7px' }}>{info?.name ?? monster.species}</span>
            {info?.textureLabel && <span className="chip honey" style={{ fontSize: 12, padding: '2px 7px' }}>{info.textureLabel}</span>}
            <span className="chip" style={{ fontSize: 12, padding: '2px 7px' }}>
              <ElementIcon element={monster.element} size={14} />
              {ELEMENT_INFO[monster.element].label}
            </span>
            <span className="chip coral" style={{ fontSize: 12, padding: '2px 7px' }}>Lv.{monster.level}</span>
          </div>
        </div>
      </div>

      {/* 3-1. 펫의 능동적 자율 제안 소통 카드 */}
      {suggestion && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 14,
            background: 'linear-gradient(90deg, #FFF8E1 0%, #FFECB3 100%)',
            border: '1.5px solid #FFC107',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexShrink: 0,
            boxShadow: '0 3px 8px rgba(255,193,7,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#4E342E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {suggestion.message}
            </span>
          </div>
          <div className="row" style={{ gap: 4, flexShrink: 0 }}>
            <button
              className="chip honey"
              onClick={handleAcceptSuggestion}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 900, fontSize: 11, padding: '3px 8px' }}
            >
              {suggestion.actionLabel}
            </button>
            <button
              className="chip"
              onClick={() => {
                dismissPetSuggestion(monster.id)
                setSuggestion(null)
              }}
              style={{ cursor: 'pointer', border: 'none', fontSize: 11, padding: '3px 6px' }}
              title="나중에 하기"
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
    </main>
  )
}
