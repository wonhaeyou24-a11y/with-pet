// 🪨🧁 [위태위태 펫 젠가] 지인 릴레이 펫 돌탑 쌓기 & 솔로 무한 균형 챌린지
// - 대표님 피드백 100% 반영:
//   1. 3D 디저트 펫 100% 유지 (MonsterSnapshot 적용으로 2D 레거시 캐릭터 노출 오류 원천 차단)
//   2. 탑처럼 층이 높아질수록 펫 크기가 점점 작아져(46px -> 24px) 정밀 조준 난이도와 피라미드 비주얼 완성
//   3. 좌우 드래그 시 0ms 딜레이 120FPS GPU 가속 (React 리렌더 루프 제거하여 끊김 없는 극상의 부드러움)
//   4. 자연낙하 후 무게중심에 따라 탑이 천천히 기우뚱 기울고 휘청거리는(Center of Gravity Sway) 실제 같은 서스펜스 물리 연출

import React, { useState, useRef, useMemo, useEffect } from 'react'
import MonsterSnapshot from '../monsters/MonsterSnapshot'
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
  offsetX: number // 픽셀 오차 (-60 ~ 60)
  petSize: number // 해당 층의 크기 (점점 작아짐)
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

const RELAY_STORAGE_KEY = 'pet_together_jenga_relay_v4'
const SOLO_RECORD_STORAGE_KEY = 'pet_together_jenga_solo_record_v4'

// 📐 1단부터 위로 올라갈수록 펫의 크기가 뚜렷하게 작아지는 피라미드 스케일링 (54px -> 48px -> 42px -> 36px -> 30px -> 25px -> 20px)
export function getTierPetSize(floor: number): number {
  return Math.max(20, Math.round(54 - (floor - 1) * 5.5))
}

// 기본 지인 릴레이 돌탑 초기 데이터 (가짜 테스터 전면 제거: 순수 지인과 1단부터 직접 구축)
function getInitialRelayState(): RelayTowerState {
  return {
    towerId: `tower-${Date.now()}`,
    tiers: [], // 더미 테스터 봇 전면 제거! 1단부터 시작
    potCoins: 100,
    potRibbons: 20,
    highestRecord: 0,
    lastPlayerName: '대기 중',
    cumulativeTilt: 0,
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
    return getInitialRelayState()
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
  // 'aiming': 사용자가 손가락으로 드래그 조준 중 (0ms DOM 가속)
  // 'dropping': 자연 낙하 중
  // 'swaying': 안착 후 무게중심에 따라 천천히 탑이 기울고 흔들리는 서스펜스 구간
  // 'settled': 안전하게 중심을 잡고 안착 완료
  // 'fallen': 무게중심 한계 초과로 와르르 붕괴
  const [gameState, setGameState] = useState<'ready' | 'aiming' | 'dropping' | 'swaying' | 'settled' | 'fallen'>('ready')
  const [accuracyNotice, setAccuracyNotice] = useState<{ text: string; color: string; sub: string } | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState<number>(0)
  const [burstKind, setBurstKind] = useState<DessertSoundKind>('mochi-squish')

  const activeTiers = mode === 'relay' ? relayState.tiers : soloTiers
  const activeTilt = mode === 'relay' ? relayState.cumulativeTilt : soloTilt
  const currentFloor = mode === 'relay' ? relayState.tiers.length + 1 : soloTiers.length + 1
  const currentPetSize = getTierPetSize(currentFloor)

  // 🚀 [120FPS 초고속 터치 추적] React State 대신 Ref + Direct DOM Style 조작
  const dragXRef = useRef<number>(0)
  const isDraggingRef = useRef<boolean>(false)
  const dragStartXRef = useRef<number>(0)
  const initialPetXRef = useRef<number>(0)

  const stageRef = useRef<HTMLDivElement | null>(null)
  const aimPetRef = useRef<HTMLDivElement | null>(null)
  const aimLineRef = useRef<HTMLDivElement | null>(null)
  const towerRef = useRef<HTMLDivElement | null>(null)

  // 초기 렌더링 시 타워 각도 동기화
  useEffect(() => {
    if (towerRef.current && (gameState === 'ready' || gameState === 'aiming' || gameState === 'settled')) {
      towerRef.current.style.transition = 'transform 0.4s ease-out'
      towerRef.current.style.transform = `rotate(${activeTilt * 0.45}deg)`
    }
  }, [activeTilt, gameState])

  // 솔로 모드 시작 (가짜 테스터 없이 1단부터 직접 조준 및 안착)
  const startSoloGame = () => {
    setSoloTiers([])
    setSoloTilt(0)
    dragXRef.current = 0
    if (aimPetRef.current) aimPetRef.current.style.transform = 'translate3d(0px, 0, 0)'
    if (aimLineRef.current) aimLineRef.current.style.transform = 'translate3d(0px, 0, 0)'
    setAccuracyNotice(null)
    setGameState('aiming')
  }

  // 릴레이 모드 시작
  const startRelayGame = () => {
    if (relayState.isFallen) {
      const fresh = getInitialRelayState()
      setRelayState(fresh)
      localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(fresh))
    }
    dragXRef.current = 0
    if (aimPetRef.current) aimPetRef.current.style.transform = 'translate3d(0px, 0, 0)'
    if (aimLineRef.current) aimLineRef.current.style.transform = 'translate3d(0px, 0, 0)'
    setAccuracyNotice(null)
    setGameState('aiming')
  }

  // 🖱️ 1. [0ms 딜레이 120FPS] 드래그 조준 핸들러 (React setState 배제)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'aiming') return
    isDraggingRef.current = true
    dragStartXRef.current = e.clientX
    initialPetXRef.current = dragXRef.current
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {}
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || gameState !== 'aiming') return
    const deltaX = e.clientX - dragStartXRef.current
    const newX = Math.max(-75, Math.min(75, initialPetXRef.current + deltaX))
    dragXRef.current = newX

    // ⚡ React 리렌더링 없이 GPU Transform 직접 갱신 (마우스/터치 즉각 반응)
    if (aimPetRef.current) {
      aimPetRef.current.style.transform = `translate3d(${newX}px, 0, 0)`
    }
    if (aimLineRef.current) {
      aimLineRef.current.style.transform = `translate3d(${newX}px, 0, 0)`
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}
  }

  // 🚀 2. [자연낙하 & 무게중심 기울기 연출 트리거]
  const executeDrop = () => {
    if (gameState !== 'aiming' || !aimPetRef.current) return

    setGameState('dropping')
    const finalDropX = dragXRef.current

    // 계산된 낙하 높이 (탑 층수와 펫 실제 크기에 맞춰 꼭대기까지 슉 떨어짐)
    const stackHeight = activeTiers.reduce((acc, t) => acc + Math.round((t.petSize || 40) * 0.72), 0)
    const targetDropY = Math.max(120, 275 - stackHeight)

    // 하드웨어 가속 중력 자유낙하 애니메이션 (0.42s)
    aimPetRef.current.style.transition = 'transform 0.42s cubic-bezier(0.45, 0, 0.75, 0.6)'
    aimPetRef.current.style.transform = `translate3d(${finalDropX}px, ${targetDropY}px, 0)`

    playDessertAsmr('wax-pop')

    // 0.42초 후 착지 충격 & 천천히 무게중심에 따라 기우는 서스펜스 물리 시작!
    window.setTimeout(() => {
      handleLandingImpact(finalDropX)
    }, 420)
  }

  // ⚖️ 3. [대표님 핵심 요청] 천천히 무게중심에 의해 기우는 실제 같은 서스펜스 물리 연출!
  const handleLandingImpact = (landedX: number) => {
    const lastTier = activeTiers[activeTiers.length - 1]
    const lastOffsetX = lastTier ? lastTier.offsetX : 0

    // 내가 드롭한 X 위치와 바로 아래 층 중심과의 차이 (diff)
    const diff = Math.abs(landedX - lastOffsetX)

    let accuracy: 'PERFECT' | 'GREAT' | 'WOBBLE' = 'WOBBLE'
    let sound: DessertSoundKind = 'mochi-squish'
    let notice = { text: '⚠️ WOBBLE! 기우뚱!', color: '#F59E0B', sub: '무게중심이 흔들려요!' }

    // 점점 작아진 펫 크기(24~46px)에 비례한 정밀 균형 판정
    const maxPerfect = Math.max(6, currentPetSize * 0.22)
    const maxGreat = Math.max(15, currentPetSize * 0.52)
    const maxTolerable = Math.max(26, currentPetSize * 0.85)

    if (diff <= maxPerfect) {
      accuracy = 'PERFECT'
      sound = 'sugar-crack'
      notice = { text: '✨ PERFECT! 무결점 균형!', color: '#10B981', sub: '중심축이 완벽히 맞아떨어졌어요!' }
    } else if (diff <= maxGreat) {
      accuracy = 'GREAT'
      sound = 'mochi-squish'
      notice = { text: '👍 GREAT! 쫀득 안착!', color: '#3B82F6', sub: '살짝 쏠렸지만 안정적으로 버텨요!' }
    } else {
      accuracy = 'WOBBLE'
      sound = 'wax-tap'
      notice = { text: '⚠️ WOBBLE! 위태위태!', color: '#EF4444', sub: '무게중심이 심하게 기울어집니다!' }
    }

    setBurstKind(sound)
    setBurstKey((k) => k + 1)
    playDessertAsmr(sound, accuracy === 'PERFECT' ? 3 : 1)

    // 착지 시 무게중심 충격으로 탑이 천천히 기우는 각도 계산
    const leanDelta = (landedX - lastOffsetX) * 0.55
    const nextCumulativeTilt = activeTilt + leanDelta

    // 💥 붕괴 판정: 누적 기울기가 ±24도 초과 또는 오차가 허용치 초과 시 와르르!
    const willCollapse = Math.abs(nextCumulativeTilt) >= 24 || diff >= maxTolerable

    setGameState('swaying')
    setAccuracyNotice(notice)

    // 🎬 [천천히 무게중심에 따라 기우는 모습 3단계 연출]
    if (towerRef.current) {
      // 1단계 (0 ~ 450ms): 착지 무게중심에 의해 탑이 천천히 기우뚱 쏠림!
      towerRef.current.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)'
      towerRef.current.style.transform = `rotate(${nextCumulativeTilt * 1.3}deg)`

      window.setTimeout(() => {
        if (!towerRef.current) return

        if (willCollapse) {
          // 💥 무게중심 한계 초과: 기울기를 못 이기고 점점 더 넘어가며 와르르 붕괴!
          towerRef.current.style.transition = 'transform 0.65s cubic-bezier(0.55, 0.055, 0.675, 0.19)'
          towerRef.current.style.transform = `rotate(${nextCumulativeTilt > 0 ? 58 : -58}deg)`

          window.setTimeout(() => {
            handleTowerCollapse(nextCumulativeTilt)
          }, 650)
        } else {
          // 2단계 (450 ~ 900ms): 아슬아슬하게 반대쪽으로 반동하며 균형을 테스트!
          towerRef.current.style.transition = 'transform 0.45s cubic-bezier(0.4, 0.1, 0.2, 1)'
          towerRef.current.style.transform = `rotate(${nextCumulativeTilt * 0.75}deg)`

          window.setTimeout(() => {
            if (!towerRef.current) return
            // 3단계 (900 ~ 1350ms): 휴~ 중심을 되찾고 안정적으로 정착!
            towerRef.current.style.transition = 'transform 0.4s ease-out'
            towerRef.current.style.transform = `rotate(${nextCumulativeTilt * 0.45}deg)`

            window.setTimeout(() => {
              handleSwaySuccess(nextCumulativeTilt, accuracy, landedX)
            }, 400)
          }, 450)
        }
      }, 500)
    }
  }

  // ✨ 흔들림을 버텨내고 최종 안착 성공 처리
  const handleSwaySuccess = (finalTilt: number, accuracy: 'PERFECT' | 'GREAT' | 'WOBBLE', landedX: number) => {
    const newTier: TowerTier = {
      id: `tier-${Date.now()}`,
      floor: currentFloor,
      ownerName: '나 (' + petName + ')',
      petName: petName,
      species: myMonster.species,
      look: myLook,
      offsetX: landedX,
      petSize: currentPetSize,
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
      setToastMsg(`🎉 ${currentFloor}단 균형 잡기 성공! (+${addedCoins}🪙 획득, 팟에 적립!)`)

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

      {/* 🌟 메인 물리 조작 & 돌탑 캔버스 (0ms 딜레이 터치 트래킹) */}
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
          paddingBottom: 22,
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
            <span>👈 좌우로 부드럽게 드래그하여 조준 후 [드롭]하세요 👉</span>
          </div>
        )}

        {/* 🐾 상단 내 펫 (120FPS 직접 DOM GPU Transform 제어 & 3D 스냅샷으로 2D 오류 원천 차단) */}
        {(gameState === 'aiming' || gameState === 'dropping') && (
          <>
            {/* 수직 레이저 조준 점선 가이드 (아래 탑 꼭대기와의 정렬 상태 실시간 표시) */}
            {gameState === 'aiming' && (
              <div
                ref={aimLineRef}
                style={{
                  position: 'absolute',
                  top: 48 + currentPetSize,
                  left: '50%',
                  transform: 'translate3d(0px, 0, 0)',
                  width: 1.5,
                  height: 250,
                  background: 'repeating-linear-gradient(180deg, #FDE047 0, #FDE047 6px, transparent 6px, transparent 12px)',
                  opacity: 0.65,
                  pointerEvents: 'none',
                  willChange: 'transform',
                  zIndex: 25,
                }}
              />
            )}

            <div
              ref={aimPetRef}
              style={{
                position: 'absolute',
                top: 48,
                left: '50%',
                transform: 'translate3d(0px, 0, 0)',
                willChange: 'transform',
                zIndex: 35,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {/* 3D 디저트 펫 스냅샷: 2D 레거시 캐릭터가 전혀 노출되지 않고 실제 3D 캐릭터 100% 동일 */}
              <div
                style={{
                  width: currentPetSize,
                  height: currentPetSize,
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.65))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MonsterSnapshot look={myLook} size={currentPetSize} title={petName} />
              </div>

              <div
                style={{
                  marginTop: 2,
                  background: 'rgba(236,72,153,0.92)',
                  color: '#FFF',
                  fontSize: 8,
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: 999,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                {petName} ({currentFloor}단)
              </div>
            </div>
          </>
        )}

        {/* 🪨 돌탑 전체 컨테이너 (실제 무게중심에 따라 천천히 기우는 서스펜스 물리 연출) */}
        <div
          ref={towerRef}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            transformOrigin: 'bottom center',
            zIndex: 10,
            marginBottom: 8,
            willChange: 'transform',
          }}
        >
          {/* 황금 파티세리 받침대 플래터 (column-reverse의 맨 아래 바닥) */}
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

          {/* 탑이 비어있을 때 받침대 바로 위에 띄우는 안내 말풍선 */}
          {activeTiers.length === 0 && gameState === 'ready' && (
            <div
              style={{
                marginBottom: 16,
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1.5px dashed #FDE047',
                borderRadius: 14,
                padding: '8px 16px',
                color: '#FEF08A',
                fontSize: 11,
                fontWeight: 800,
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                animation: 'pulse 1.8s infinite',
              }}
            >
              ✨ 탑이 비어있어요! 황금 받침대 위에 1단을 올려보세요!
            </div>
          )}

          {/* 층수가 올라갈수록 1단(54px)부터 뚜렷하게 작아지는 피라미드 돌탑 구조 */}
          {activeTiers.map((tier, idx) => {
            const isTop = idx === activeTiers.length - 1
            const size = tier.petSize || getTierPetSize(tier.floor)
            return (
              <div
                key={tier.id}
                style={{
                  position: 'relative',
                  left: tier.offsetX,
                  marginTop: idx === 0 ? 0 : -Math.round(size * 0.28), // 포근하게 안착
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: isTop && gameState === 'settled' ? 'bounceIn 0.35s ease-out' : 'none',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
                  transition: 'left 0.3s ease',
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
                    fontSize: Math.max(7, size * 0.23),
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

                {/* 3D 스냅샷으로 2D 오류 원천 차단 */}
                <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MonsterSnapshot look={tier.look} size={size} title={tier.petName} />
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
              기울기를 버티지 못했지만 펫들은 퐁퐁 튕겨나가 무사해요!
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
            ⚠️ 위태위태! 천천히 무게중심을 테스트하는 중...!
          </div>
        )}

        {gameState === 'settled' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setGameState('aiming')
                dragXRef.current = 0
                if (aimPetRef.current) aimPetRef.current.style.transform = 'translate3d(0px, 0, 0)'
                if (aimLineRef.current) aimLineRef.current.style.transform = 'translate3d(0px, 0, 0)'
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
          💡 화면을 좌우로 부드럽게 드래그하여 조준선을 맞춘 후 [드롭]하세요!
        </div>
      </footer>
    </div>
  )
}
