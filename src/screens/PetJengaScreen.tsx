// 🪨🧁 [위태위태 펫 젠가] 지인 릴레이 펫 돌탑 쌓기 & 솔로 무한 균형 챌린지
// - 대표님 피드백 반영:
//   1. 자동 스윙 제거 -> 손가락/마우스로 직접 좌우 드래그하여 조준 후 놓으면(Drop) 자연낙하
//   2. 펫 크기를 앙증맞게 축소(36px)하여 조준 난이도와 균형 긴장감 대폭 강화
//   3. 드롭 시 끊김 없는 60FPS 순수 GPU 가속 자유낙하 물리 애니메이션 적용
//   4. 안착 시 탑 전체가 좌우로 삐걱거리며 탄성 진동(Spring Sway)하는 심장 쫄깃한 연출 구현

import React, { useState, useRef, useMemo } from 'react'
import MonsterView from '../monsters/MonsterView'
import { playDessertAsmr, playBabyGiggleSound, type DessertSoundKind } from '../lib/sound'
import { SensoryBurst } from '../ui/SensoryFx'
import { monsterLook, type MonsterRow } from '../lib/api'
import type { MonsterLook } from '../monsters/types'

export interface PetJengaProps {
  myMonster: MonsterRow
  onClose: () => void
  onRewardCoins?: (coins: number, ribbons: number) => void
}

export interface TowerTier {
  id: string
  floor: number
  ownerName: string
  petName: string
  species: string
  look: MonsterLook
  offsetX: number // 픽셀 오차 (-70 ~ 70)
  accuracy: 'PERFECT' | 'GREAT' | 'WOBBLE'
  placedAt: string
}

export interface RelayTowerState {
  towerId: string
  tiers: TowerTier[]
  potCoins: number
  potRibbons: number
  highestRecord: number
  lastPlayerName: string
  cumulativeTilt: number // 누적 틸트 (좌우 기울기 각도)
  isFallen: boolean
}

const RELAY_STORAGE_KEY = 'pet_together_jenga_relay_v1'
const SOLO_RECORD_STORAGE_KEY = 'pet_together_jenga_solo_record_v1'

// 기본 지인 릴레이 돌탑 초기 데이터
function getInitialRelayState(myLook: MonsterLook): RelayTowerState {
  return {
    towerId: `tower-${Date.now()}`,
    tiers: [
      {
        id: 'tier-base',
        floor: 1,
        ownerName: '베이커리 마스터',
        petName: '단단한 버터 비스킷',
        species: 'dubai-cookie',
        look: { ...myLook, species: 'dubai-cookie' },
        offsetX: 0,
        accuracy: 'PERFECT',
        placedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'tier-2',
        floor: 2,
        ownerName: '민트초코 지인',
        petName: '퐁신 스모어',
        species: 'smore',
        look: { ...myLook, species: 'smore' },
        offsetX: 5,
        accuracy: 'PERFECT',
        placedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'tier-3',
        floor: 3,
        ownerName: '말랑 파티시에',
        petName: '달콤 모찌',
        species: 'mochi',
        look: { ...myLook, species: 'mochi' },
        offsetX: -9,
        accuracy: 'GREAT',
        placedAt: new Date(Date.now() - 600000).toISOString(),
      },
    ],
    potCoins: 250,
    potRibbons: 40,
    highestRecord: 12,
    lastPlayerName: '말랑 파티시에',
    cumulativeTilt: -5,
    isFallen: false,
  }
}

export const PetJengaScreen: React.FC<PetJengaProps> = ({ myMonster, onClose, onRewardCoins }) => {
  const [mode, setMode] = useState<'relay' | 'solo'>('relay')
  const myLook = useMemo(() => monsterLook(myMonster), [myMonster])
  const petName = myMonster.name || '내 펫'

  // 지인 릴레이 탑 상태
  const [relayState, setRelayState] = useState<RelayTowerState>(() => {
    try {
      const saved = localStorage.getItem(RELAY_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return getInitialRelayState(myLook)
  })

  // 솔로 탑 층수 및 기록
  const [soloTiers, setSoloTiers] = useState<TowerTier[]>([])
  const [soloTilt, setSoloTilt] = useState<number>(0)
  const [soloBestScore, setSoloBestScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(SOLO_RECORD_STORAGE_KEY) || '0')
    } catch {
      return 0
    }
  })

  // 🎮 게임 물리 및 조작 상태
  const [gameState, setGameState] = useState<'ready' | 'aiming' | 'dropping' | 'swaying' | 'settled' | 'fallen'>('ready')
  const [dragX, setDragX] = useState<number>(0) // -85 ~ 85px (중심으로부터의 X 오차)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dropTargetY, setDropTargetY] = useState<number>(240) // 낙하 목표 거리
  const [swayImpactTilt, setSwayImpactTilt] = useState<number>(0) // 착지 충격으로 흔들릴 틸트 각도

  const [accuracyNotice, setAccuracyNotice] = useState<{ text: string; color: string; sub: string } | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState<number>(0)
  const [burstKind, setBurstKind] = useState<DessertSoundKind>('mochi-squish')

  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragStartXRef = useRef<number>(0)
  const initialPetXRef = useRef<number>(0)

  const activeTiers = mode === 'relay' ? relayState.tiers : soloTiers
  const activeTilt = mode === 'relay' ? relayState.cumulativeTilt : soloTilt
  const currentFloor = mode === 'relay' ? relayState.tiers.length + 1 : soloTiers.length + 1

  // 솔로 모드 시작
  const startSoloGame = () => {
    const baseTier: TowerTier = {
      id: `solo-base-${Date.now()}`,
      floor: 1,
      ownerName: '도전의 시작',
      petName: '단단한 버터 비스킷',
      species: 'dubai-cookie',
      look: myLook,
      offsetX: 0,
      accuracy: 'PERFECT',
      placedAt: new Date().toISOString(),
    }
    setSoloTiers([baseTier])
    setSoloTilt(0)
    setDragX(0)
    setAccuracyNotice(null)
    setGameState('aiming')
  }

  // 릴레이 모드 시작
  const startRelayGame = () => {
    if (relayState.isFallen) {
      const fresh = getInitialRelayState(myLook)
      setRelayState(fresh)
      localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(fresh))
    }
    setDragX(0)
    setAccuracyNotice(null)
    setGameState('aiming')
  }

  // 🖱️ 1. 드래그 조준 핸들러 (Touch & Mouse 통합)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'aiming') return
    setIsDragging(true)
    dragStartXRef.current = e.clientX
    initialPetXRef.current = dragX
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {}
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || gameState !== 'aiming') return
    const deltaX = e.clientX - dragStartXRef.current
    const newX = Math.max(-80, Math.min(80, initialPetXRef.current + deltaX))
    setDragX(newX)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  // 🚀 2. [손 떼기 / 버튼 클릭으로 퐁당 드롭!]
  const executeDrop = () => {
    if (gameState !== 'aiming') return

    const calculatedTargetY = Math.max(160, 270 - activeTiers.length * 10)
    setDropTargetY(calculatedTargetY)
    setGameState('dropping')

    // 퐁! 떨어지는 가벼운 공기 사운드
    playDessertAsmr('wax-pop')

    // 0.35s 후 충돌 및 착지 판정 진입 (CSS transition 완료 시점)
    window.setTimeout(() => {
      handleLandingImpact()
    }, 350)
  }

  // ⚖️ 3. 착지 순간 무게중심 충격 & 짜릿한 흔들림(Sway) 물리 판정
  const handleLandingImpact = () => {
    const lastTier = activeTiers[activeTiers.length - 1]
    const lastOffsetX = lastTier ? lastTier.offsetX : 0

    // 내가 드롭한 X 위치와 바로 아래 층 중심과의 차이 (diff)
    const diff = Math.abs(dragX - lastOffsetX)

    let accuracy: 'PERFECT' | 'GREAT' | 'WOBBLE' = 'WOBBLE'
    let sound: DessertSoundKind = 'mochi-squish'
    let notice = { text: '⚠️ WOBBLE! 기우뚱!', color: '#F59E0B', sub: '무게중심이 흔들려요!' }

    // 펫 크기(36px)에 맞춘 정밀 판정 기준
    if (diff <= 9) {
      accuracy = 'PERFECT'
      sound = 'sugar-crack'
      notice = { text: '✨ PERFECT! 무결점 균형!', color: '#10B981', sub: '탑이 단단하고 안정적이에요!' }
    } else if (diff <= 22) {
      accuracy = 'GREAT'
      sound = 'mochi-squish'
      notice = { text: '👍 GREAT! 말랑 안착!', color: '#3B82F6', sub: '쫀득하게 자리를 잡았어요!' }
    } else {
      accuracy = 'WOBBLE'
      sound = 'wax-tap'
      notice = { text: '⚠️ WOBBLE! 아슬아슬!', color: '#EF4444', sub: '탑이 크게 휘청거립니다!' }
    }

    // 착지 시 탑을 흔들 최대 틸트 각도 계산 (차이가 클수록 더 크게 흔들림)
    const impactTilt = (dragX - lastOffsetX) * 0.85
    setSwayImpactTilt(impactTilt)

    // 새로운 누적 틸트 각도
    const nextTilt = activeTilt + Math.round((dragX - lastOffsetX) * 0.5)

    setBurstKind(sound)
    setBurstKey((k) => k + 1)
    playDessertAsmr(sound, accuracy === 'PERFECT' ? 3 : 1)

    // 💥 붕괴 판정: 누적 기울기가 ±28도 초과 또는 단일 오차가 36px 초과 시 붕괴!
    const willCollapse = Math.abs(nextTilt) >= 28 || diff >= 36

    // 서스펜스 흔들림 상태 진입 (0.65초 동안 좌우로 삐걱거리며 출렁임)
    setGameState('swaying')
    setAccuracyNotice(notice)

    window.setTimeout(() => {
      if (willCollapse) {
        handleTowerCollapse(nextTilt)
      } else {
        handleSwaySuccess(nextTilt, accuracy)
      }
    }, 650)
  }

  // ✨ 흔들림을 버텨내고 최종 안착 성공 처리
  const handleSwaySuccess = (finalTilt: number, accuracy: 'PERFECT' | 'GREAT' | 'WOBBLE') => {
    const newTier: TowerTier = {
      id: `tier-${Date.now()}`,
      floor: currentFloor,
      ownerName: '나 (' + petName + ')',
      petName: petName,
      species: myMonster.species,
      look: myLook,
      offsetX: dragX,
      accuracy,
      placedAt: new Date().toISOString(),
    }

    setGameState('settled')
    playBabyGiggleSound(accuracy === 'PERFECT' ? '까르르' : '헤헤헤', 'cheer')

    if (mode === 'relay') {
      const updatedTiers = [...relayState.tiers, newTier]
      const addedCoins = accuracy === 'PERFECT' ? 35 : accuracy === 'GREAT' ? 25 : 15
      const updatedPotCoins = relayState.potCoins + addedCoins
      const updatedPotRibbons = relayState.potRibbons + (accuracy === 'PERFECT' ? 4 : 2)
      const updatedRecord = Math.max(relayState.highestRecord, updatedTiers.length)

      const updatedRelay: RelayTowerState = {
        ...relayState,
        tiers: updatedTiers,
        potCoins: updatedPotCoins,
        potRibbons: updatedPotRibbons,
        highestRecord: updatedRecord,
        lastPlayerName: '나 (' + petName + ')',
        cumulativeTilt: finalTilt,
        isFallen: false,
      }

      setRelayState(updatedRelay)
      localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(updatedRelay))
      onRewardCoins?.(addedCoins, accuracy === 'PERFECT' ? 2 : 1)
      setToastMsg(`🎉 ${currentFloor}단 균형 잡기 성공! (+${addedCoins}🪙 획득, 누적 팟에 적립!)`)

      if (updatedTiers.length % 5 === 0) {
        setTimeout(() => {
          playDessertAsmr('starlight-ting', 3)
          setToastMsg(`🌟 [${updatedTiers.length}단 돌파 잭팟!] 마을 전체에 축하 선물이 배달됩니다!`)
        }, 1200)
      }
    } else {
      const updatedTiers = [...soloTiers, newTier]
      setSoloTiers(updatedTiers)
      setSoloTilt(finalTilt)
      if (updatedTiers.length > soloBestScore) {
        setSoloBestScore(updatedTiers.length)
        localStorage.setItem(SOLO_RECORD_STORAGE_KEY, String(updatedTiers.length))
      }
      onRewardCoins?.(20, 1)
      setToastMsg(`🎉 솔로 ${currentFloor}층 돌파 성공! (+20🪙)`)
    }
  }

  // 💥 탑 와르르 쓰러짐 처리
  const handleTowerCollapse = (finalTilt: number) => {
    setGameState('fallen')
    setAccuracyNotice({
      text: '💥 와르르르! 탑이 쓰러졌어요!',
      color: '#DC2626',
      sub: '기울기를 버티지 못하고 펫들이 퐁퐁 튕겨 나갔어요!',
    })

    playDessertAsmr('mochi-squish', 4)
    playBabyGiggleSound('꺄앙', 'chuckle')

    if (mode === 'relay') {
      const updatedRelay: RelayTowerState = {
        ...relayState,
        cumulativeTilt: finalTilt,
        isFallen: true,
      }
      setRelayState(updatedRelay)
      localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(updatedRelay))
      onRewardCoins?.(10, 0)
      setToastMsg('💔 아쉽지만 펫은 푹신해서 다치지 않았어요! 위로 사탕(+10🪙) 지급!')
    } else {
      setSoloTilt(finalTilt)
      onRewardCoins?.(5, 0)
      setToastMsg('💔 솔로 타워가 쓰러졌어요! 다음엔 더 높이 도전해 보세요!')
    }
  }

  // 지인 공유 메시지 복사
  const handleShareToFriends = () => {
    try {
      const text = `🍰 [펫과함께] 우리 마을 펫 돌탑이 지금 ${relayState.tiers.length}층까지 쌓였어요! (누적 상금: ${relayState.potCoins}🪙)\n흔들리는 탑에 당신의 펫을 올려보세요!`
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
        alert('📋 지인에게 보낼 돌탑 릴레이 초대글이 클립보드에 복사되었습니다!\n단톡방에 붙여넣어 보세요!')
      } else {
        alert(text)
      }
    } catch {
      alert('지인들과 펫 돌탑 링크를 공유해 보세요!')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(circle at center, #230E4E 0%, #0D0524 100%)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: 'Pretendard, -apple-system, sans-serif',
      }}
    >
      {/* 이펙트 버스트 */}
      <SensoryBurst kind={burstKind} triggerKey={burstKey} bubble={accuracyNotice?.text ?? null} />

      {/* 헤더 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(18, 8, 34, 0.88)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🪨🧁</span>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 900, color: '#FDE047' }}>위태위태 펫 젠가</div>
            <div style={{ fontSize: 10, color: '#DDD6FE' }}>
              {mode === 'relay' ? '👥 지인 릴레이 마을 돌탑' : '👑 솔로 무한 균형 챌린지'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: 2,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('relay')
                setGameState('ready')
              }}
              style={{
                border: 'none',
                borderRadius: 16,
                padding: '4px 10px',
                fontSize: 10,
                fontWeight: 900,
                cursor: 'pointer',
                background: mode === 'relay' ? '#8B5CF6' : 'transparent',
                color: mode === 'relay' ? '#FFFFFF' : '#A78BFA',
              }}
            >
              지인 릴레이
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('solo')
                setGameState('ready')
              }}
              style={{
                border: 'none',
                borderRadius: 16,
                padding: '4px 10px',
                fontSize: 10,
                fontWeight: 900,
                cursor: 'pointer',
                background: mode === 'solo' ? '#EC4899' : 'transparent',
                color: mode === 'solo' ? '#FFFFFF' : '#F472B6',
              }}
            >
              솔로 타워
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 30,
              height: 30,
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      </header>

      {/* 정보 배너 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '7px 12px',
          background: 'rgba(46, 16, 101, 0.65)',
          borderBottom: '1px solid rgba(234, 179, 8, 0.25)',
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {mode === 'relay' ? (
          <>
            <div>
              🏆 현재 탑: <span style={{ color: '#FDE047', fontWeight: 900 }}>{relayState.tiers.length}층</span>
            </div>
            <div>
              💰 누적 상금 팟: <span style={{ color: '#34D399', fontWeight: 900 }}>{relayState.potCoins}🪙</span>
            </div>
            <div>
              🎀 리본 팟: <span style={{ color: '#F472B6', fontWeight: 900 }}>{relayState.potRibbons}🎀</span>
            </div>
          </>
        ) : (
          <>
            <div>
              현재 쌓은 층: <span style={{ color: '#FDE047', fontWeight: 900 }}>{soloTiers.length}층</span>
            </div>
            <div>
              👑 내 최고 기록: <span style={{ color: '#38BDF8', fontWeight: 900 }}>{soloBestScore}층</span>
            </div>
          </>
        )}
      </div>

      {/* 🌟 메인 물리 조작 & 돌탑 캔버스 */}
      <main
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          overflow: 'hidden',
          paddingBottom: 20,
          touchAction: 'none',
          cursor: gameState === 'aiming' ? 'grab' : 'default',
        }}
      >
        {/* 🎯 조준 안내 힌트 텍스트 */}
        {gameState === 'aiming' && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 8, 28, 0.75)',
              border: '1px solid rgba(253, 224, 71, 0.4)',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 10.5,
              fontWeight: 800,
              color: '#FEF08A',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
              animation: 'pulse 1.8s infinite',
            }}
          >
            <span>👈 좌우로 드래그해서 위치를 맞추고 손을 떼세요 👉</span>
          </div>
        )}

        {/* 🐾 상단 내 펫 (수동 드래그 조준 & 60FPS 하드웨어 가속 자유낙하) */}
        {(gameState === 'aiming' || gameState === 'dropping') && (
          <div
            style={{
              position: 'absolute',
              top: 48,
              left: '50%',
              transform: `translate3d(${dragX}px, ${gameState === 'dropping' ? dropTargetY : 0}px, 0)`,
              transition: gameState === 'dropping' ? 'transform 0.35s cubic-bezier(0.42, 0, 0.78, 0.58)' : 'none',
              willChange: 'transform',
              zIndex: 35,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* 수직 레이저 조준 점선 가이드 (아래 탑 꼭대기와의 정렬 상태 실시간 표시) */}
            {gameState === 'aiming' && (
              <div
                style={{
                  position: 'absolute',
                  top: 36,
                  width: 1.5,
                  height: dropTargetY + 40,
                  background: 'repeating-linear-gradient(180deg, #FDE047 0, #FDE047 6px, transparent 6px, transparent 12px)',
                  opacity: 0.65,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* 36px 앙증맞은 크기로 조준 난이도와 균형 긴장감 극대화 */}
            <div
              style={{
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.65))',
                animation: isDragging ? 'none' : 'breathing-wiggle 1.8s ease-in-out infinite',
              }}
            >
              <MonsterView look={myLook} size={36} prefer2D={false} />
            </div>

            <div
              style={{
                marginTop: 2,
                background: 'rgba(236,72,153,0.92)',
                color: '#FFF',
                fontSize: 8.5,
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: 999,
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              {petName}
            </div>
          </div>
        )}

        {/* 🪨 돌탑 전체 컨테이너 (착지 시 좌우 탄성 진동 스프링 연출) */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            transformOrigin: 'bottom center',
            transform:
              gameState === 'swaying'
                ? `rotate(${swayImpactTilt * 0.9}deg)`
                : `rotate(${activeTilt * 0.45}deg)`,
            transition:
              gameState === 'swaying'
                ? 'transform 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97)'
                : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 10,
            marginBottom: 8,
          }}
        >
          {/* 황금 파티세리 받침대 플래터 */}
          <div
            style={{
              width: 140,
              height: 24,
              borderRadius: 12,
              background: 'linear-gradient(180deg, #F59E0B 0%, #B45309 60%, #78350F 100%)',
              border: '2px solid #FDE047',
              boxShadow: '0 8px 20px rgba(0,0,0,0.8), inset 0 2px 3px rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFBEB',
              fontSize: 9.5,
              fontWeight: 900,
              letterSpacing: 0.5,
              marginTop: 4,
            }}
          >
            🧁 황금 받침대
          </div>

          {/* 쌓여있는 36px 앙증맞은 펫 층들 */}
          {activeTiers.map((tier, idx) => {
            const isTop = idx === activeTiers.length - 1
            return (
              <div
                key={tier.id}
                style={{
                  position: 'relative',
                  left: tier.offsetX,
                  marginTop: idx === 0 ? 0 : -10, // 앙증맞은 크기에 맞게 촘촘히 포개짐
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: isTop && gameState === 'settled' ? 'bounceIn 0.35s ease-out' : 'none',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
                  transition: 'all 0.3s ease',
                  zIndex: idx + 2,
                }}
              >
                {/* 층수 뱃지 */}
                <div
                  style={{
                    background:
                      tier.accuracy === 'PERFECT'
                        ? 'rgba(16, 185, 129, 0.92)'
                        : tier.accuracy === 'GREAT'
                        ? 'rgba(59, 130, 246, 0.92)'
                        : 'rgba(245, 158, 11, 0.92)',
                    color: '#FFFFFF',
                    fontSize: 7.5,
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: 6,
                    marginBottom: -3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(255,255,255,0.3)',
                    zIndex: 3,
                  }}
                >
                  {tier.floor}단 · {tier.ownerName}
                </div>

                <div style={{ pointerEvents: 'none' }}>
                  <MonsterView look={tier.look} size={36} prefer2D={false} />
                </div>
              </div>
            )
          })}
        </div>

        {/* 💥 쓰러졌을 때 결과 모달 */}
        {gameState === 'fallen' && (
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(15, 8, 28, 0.96)',
              border: '2px solid #EF4444',
              borderRadius: 20,
              padding: '18px 22px',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0,0,0,0.85)',
              zIndex: 50,
              animation: 'bounceIn 0.4s ease-out',
            }}
          >
            <div style={{ fontSize: 30, marginBottom: 4 }}>💥 와르르!</div>
            <div style={{ fontSize: 15.5, fontWeight: 900, color: '#F87171' }}>돌탑이 쓰러졌습니다!</div>
            <div style={{ fontSize: 11, color: '#E2E8F0', margin: '6px 0 14px' }}>
              균형이 무너졌지만 펫들은 퐁퐁 튕겨나가 무사해요!
            </div>
            <button
              type="button"
              onClick={mode === 'relay' ? startRelayGame : startSoloGame}
              style={{
                padding: '9px 18px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #EC4899, #BE185D)',
                color: '#FFF',
                fontWeight: 900,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(236,72,153,0.4)',
              }}
            >
              🔄 새 돌탑 다시 세우기
            </button>
          </div>
        )}

        {/* 판정 알림 배너 */}
        {accuracyNotice && gameState !== 'fallen' && (
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 8, 28, 0.92)',
              border: `2px solid ${accuracyNotice.color}`,
              borderRadius: 14,
              padding: '6px 14px',
              textAlign: 'center',
              boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
              zIndex: 40,
              animation: 'bounceIn 0.35s ease',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: accuracyNotice.color }}>
              {accuracyNotice.text}
            </div>
            <div style={{ fontSize: 9.5, color: '#DDD6FE' }}>{accuracyNotice.sub}</div>
          </div>
        )}
      </main>

      {/* 토스트 메시지 */}
      {toastMsg && (
        <div
          style={{
            position: 'absolute',
            bottom: 95,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg, #10B981, #059669)',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 800,
            padding: '5px 14px',
            borderRadius: 999,
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            zIndex: 60,
            whiteSpace: 'nowrap',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* 하단 컨트롤 패널 */}
      <footer
        style={{
          padding: '12px 16px',
          background: 'rgba(18, 8, 34, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
        }}
      >
        {gameState === 'ready' && (
          <button
            type="button"
            onClick={mode === 'relay' ? startRelayGame : startSoloGame}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 16,
              border: 'none',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 13.5,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>✨</span>
            <span>{mode === 'relay' ? `${currentFloor}단 조준 & 쌓기 도전!` : '솔로 돌탑 조준 시작!'}</span>
          </button>
        )}

        {gameState === 'aiming' && (
          <button
            type="button"
            onClick={executeDrop}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 16,
              border: 'none',
              background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(236,72,153,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              animation: 'pulse 1.4s infinite',
            }}
          >
            <span>👇</span>
            <span>여기서 퐁당 드롭! (DROP!)</span>
          </button>
        )}

        {gameState === 'dropping' && (
          <div
            style={{
              padding: '12px 0',
              textAlign: 'center',
              color: '#FDE047',
              fontWeight: 900,
              fontSize: 14,
              animation: 'pulse 0.4s infinite',
            }}
          >
            ⬇️ 펫이 자유낙하하는 중...
          </div>
        )}

        {gameState === 'swaying' && (
          <div
            style={{
              padding: '12px 0',
              textAlign: 'center',
              color: '#F43F5E',
              fontWeight: 900,
              fontSize: 14,
              animation: 'bounce 0.3s infinite',
            }}
          >
            ⚠️ 위태위태! 탑이 흔들리며 중심을 잡는 중...!
          </div>
        )}

        {gameState === 'settled' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setGameState('aiming')
                setDragX(0)
                setAccuracyNotice(null)
              }}
              style={{
                flex: 1,
                padding: '11px 0',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFF',
                fontWeight: 900,
                fontSize: 12.5,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              }}
            >
              다음 층 계속 쌓기! 🚀
            </button>
            {mode === 'relay' && (
              <button
                type="button"
                onClick={handleShareToFriends}
                style={{
                  padding: '11px 14px',
                  borderRadius: 14,
                  border: '1px solid #FCD34D',
                  background: 'rgba(245,158,11,0.2)',
                  color: '#FDE047',
                  fontWeight: 900,
                  fontSize: 11.5,
                  cursor: 'pointer',
                }}
              >
                📢 지인에게 전달
              </button>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 9.5, color: '#A78BFA' }}>
          💡 화면을 좌우로 드래그하여 조준선을 아래 펫의 중심에 맞춘 후 [드롭]하세요!
        </div>
      </footer>
    </div>
  )
}
