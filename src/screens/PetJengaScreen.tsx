// 🪨🧁 [위태위태 펫 젠가] 지인 릴레이 펫 돌탑 쌓기 & 솔로 무한 균형 챌린지
// - 상단에서 펫이 좌우로 스윙하며 타이밍에 맞춰 탭하여 아래 펫 위에 떨어뜨려 중심을 잡는 물리 퍼즐 게임.
// - 층이 높아질수록 누적 상금 팟(Pot)이 불어나며, 오차가 커질수록 탑이 좌우로 흔들리다가 쓰러집니다.
// - 지인 릴레이 모드와 솔로 챌린지 모드를 완벽 지원합니다.

import React, { useState, useEffect, useRef, useMemo } from 'react'
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
  offsetRatio: number // -1.0 ~ 1.0 (중심에서 벗어난 비율)
  offsetX: number // 픽셀 오차
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
  cumulativeTilt: number // 누적 틸트 (좌우 기울기)
  isFallen: boolean
}

const RELAY_STORAGE_KEY = 'pet_together_jenga_relay_v1'
const SOLO_RECORD_STORAGE_KEY = 'pet_together_jenga_solo_record_v1'

// 기본 지인 릴레이 돌탑 초기 데이터 생성
function getInitialRelayState(myLook: MonsterLook, _petName: string): RelayTowerState {
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
        offsetRatio: 0,
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
        offsetRatio: 0.12,
        offsetX: 6,
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
        offsetRatio: -0.25,
        offsetX: -12,
        accuracy: 'GREAT',
        placedAt: new Date(Date.now() - 600000).toISOString(),
      },
    ],
    potCoins: 250,
    potRibbons: 40,
    highestRecord: 12,
    lastPlayerName: '말랑 파티시에',
    cumulativeTilt: -6,
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
    return getInitialRelayState(myLook, petName)
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

  // 게임 진행 상태
  const [gameState, setGameState] = useState<'ready' | 'swinging' | 'dropping' | 'landed' | 'fallen'>('ready')
  const [swingPos, setSwingPos] = useState<number>(0) // -100 ~ 100 (좌우 스윙 %)
  const [swingDir, setSwingDir] = useState<number>(1) // 1: 오른쪽, -1: 왼쪽
  const [dropY, setDropY] = useState<number>(0) // 낙하 거리 px
  const [accuracyNotice, setAccuracyNotice] = useState<{ text: string; color: string; sub: string } | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState<number>(0)
  const [burstKind, setBurstKind] = useState<DessertSoundKind>('mochi-squish')

  const animationRef = useRef<number | null>(null)
  const currentFloor = mode === 'relay' ? relayState.tiers.length + 1 : soloTiers.length + 1
  const activeTiers = mode === 'relay' ? relayState.tiers : soloTiers
  const activeTilt = mode === 'relay' ? relayState.cumulativeTilt : soloTilt

  // 스윙 속도 (층수가 높을수록 팽팽한 긴장감)
  const swingSpeed = Math.min(2.8, 1.25 + currentFloor * 0.08)

  // 1. 좌우 진자 스윙 애니메이션 루프
  useEffect(() => {
    if (gameState !== 'swinging') return

    let currentPos = swingPos
    let direction = swingDir

    const step = () => {
      currentPos += direction * swingSpeed
      if (currentPos >= 82) {
        currentPos = 82
        direction = -1
      } else if (currentPos <= -82) {
        currentPos = -82
        direction = 1
      }

      setSwingPos(currentPos)
      setSwingDir(direction)
      animationRef.current = requestAnimationFrame(step)
    }

    animationRef.current = requestAnimationFrame(step)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [gameState, swingSpeed])

  // 솔로 모드 시작 시 1층 베이스 세팅
  const startSoloGame = () => {
    const baseTier: TowerTier = {
      id: `solo-base-${Date.now()}`,
      floor: 1,
      ownerName: '도전의 시작',
      petName: '황금 버터 플레이트',
      species: 'cookie-crisp' as any,
      look: myLook,
      offsetRatio: 0,
      offsetX: 0,
      accuracy: 'PERFECT',
      placedAt: new Date().toISOString(),
    }
    setSoloTiers([baseTier])
    setSoloTilt(0)
    setSwingPos(0)
    setDropY(0)
    setAccuracyNotice(null)
    setGameState('swinging')
  }

  // 릴레이 모드 시작
  const startRelayGame = () => {
    if (relayState.isFallen) {
      // 이미 쓰러진 상태라면 새 탑 세우기
      const fresh = getInitialRelayState(myLook, petName)
      setRelayState(fresh)
      localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(fresh))
    }
    setSwingPos(0)
    setDropY(0)
    setAccuracyNotice(null)
    setGameState('swinging')
  }

  // 2. [퐁당! 펫 떨어뜨리기 (DROP)]
  const handleDropPet = () => {
    if (gameState !== 'swinging') return
    if (animationRef.current) cancelAnimationFrame(animationRef.current)

    setGameState('dropping')
    setDropY(160) // 애니메이션으로 슝 낙하

    // 낙하 판정 딜레이 (380ms)
    window.setTimeout(() => {
      judgeLanding()
    }, 380)
  }

  // 3. 착지 및 중심축 무게 판정 로직
  const judgeLanding = () => {
    // 탑 꼭대기의 마지막 층 오차
    const lastTier = activeTiers[activeTiers.length - 1]
    const lastOffsetX = lastTier ? lastTier.offsetX : 0

    // 현재 떨어진 펫의 오차 (swingPos: -82 ~ 82 -> px 환산)
    const currentOffsetX = Math.round((swingPos / 100) * 65)
    const diff = Math.abs(currentOffsetX - lastOffsetX)

    // 판정 구분
    let accuracy: 'PERFECT' | 'GREAT' | 'WOBBLE' = 'WOBBLE'
    let sound: DessertSoundKind = 'mochi-squish'
    let notice = { text: '⚠️ WOBBLE! 기우뚱!', color: '#F59E0B', sub: '무게중심이 흔들려요!' }

    if (diff <= 14) {
      accuracy = 'PERFECT'
      sound = 'sugar-crack'
      notice = { text: '✨ PERFECT! 완벽한 중심!', color: '#10B981', sub: '탑이 단단하고 평온해요!' }
    } else if (diff <= 34) {
      accuracy = 'GREAT'
      sound = 'mochi-squish'
      notice = { text: '👍 GREAT! 말랑 안착!', color: '#3B82F6', sub: '쫀득하게 균형을 잡았어요!' }
    } else {
      accuracy = 'WOBBLE'
      sound = 'wax-pop'
      notice = { text: '⚠️ WOBBLE! 아슬아슬!', color: '#EF4444', sub: '탑이 크게 흔들립니다!' }
    }

    // 누적 기울기 계산 (오차 누적)
    const nextTilt = activeTilt + Math.round((currentOffsetX - lastOffsetX) * 0.45)
    setBurstKind(sound)
    setBurstKey((k) => k + 1)
    playDessertAsmr(sound, accuracy === 'PERFECT' ? 3 : 1)

    // 💥 [붕괴 조건] 누적 틸트가 ±36px 초과하거나 단일 오차가 52px 초과 시 탑 와르르!
    if (Math.abs(nextTilt) >= 36 || diff >= 52) {
      handleTowerCollapse(nextTilt)
      return
    }

    // 성공적인 착지 처리!
    const newTier: TowerTier = {
      id: `tier-${Date.now()}`,
      floor: currentFloor,
      ownerName: '나 (' + petName + ')',
      petName: petName,
      species: myMonster.species,
      look: myLook,
      offsetRatio: currentOffsetX / 100,
      offsetX: currentOffsetX,
      accuracy,
      placedAt: new Date().toISOString(),
    }

    setAccuracyNotice(notice)
    setGameState('landed')

    // 아기 목소리로 기뻐함
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
        cumulativeTilt: nextTilt,
        isFallen: false,
      }

      setRelayState(updatedRelay)
      localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(updatedRelay))

      // 보상 즉시 지급
      onRewardCoins?.(addedCoins, accuracy === 'PERFECT' ? 2 : 1)
      setToastMsg(`🎉 ${currentFloor}단 안착 성공! (+${addedCoins}🪙 획득, 누적 팟에 적립!)`)

      // 5단 단위 잭팟 보너스
      if (updatedTiers.length % 5 === 0) {
        setTimeout(() => {
          playDessertAsmr('starlight-ting', 3)
          setToastMsg(`🌟 [${updatedTiers.length}단 돌파 잭팟!] 마을 전체에 축하 선물이 배달됩니다!`)
        }, 1200)
      }
    } else {
      // 솔로 모드
      const updatedTiers = [...soloTiers, newTier]
      setSoloTiers(updatedTiers)
      setSoloTilt(nextTilt)
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
      sub: '균형이 무너져 펫들이 퐁퐁 튕겨 나갔어요!',
    })

    // 슬픈 척 귀여운 아기 울음/비명 효과음
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
      // 격려 위로금 지급
      onRewardCoins?.(10, 0)
      setToastMsg('💔 아쉽지만 펫은 푹신해서 다치지 않았어요! 위로 사탕(+10🪙) 지급!')
    } else {
      setSoloTilt(finalTilt)
      onRewardCoins?.(5, 0)
      setToastMsg('💔 솔로 타워가 쓰러졌어요! 다음엔 더 높이 도전해 보세요!')
    }
  }

  // 지인에게 공유 링크 복사
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
        background: 'radial-gradient(circle at center, #2E1065 0%, #0F0728 100%)',
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
          padding: '12px 16px',
          background: 'rgba(20, 10, 36, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🪨🧁</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#FDE047' }}>위태위태 펫 젠가</div>
            <div style={{ fontSize: 10.5, color: '#DDD6FE' }}>
              {mode === 'relay' ? '👥 지인 릴레이 마을 돌탑' : '👑 솔로 무한 균형 챌린지'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 모드 전환 탭 */}
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
                fontSize: 10.5,
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
                fontSize: 10.5,
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
              width: 32,
              height: 32,
              color: '#FFFFFF',
              fontSize: 16,
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

      {/* 정보 배너 (상금 팟 & 최고 기록) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 12px',
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

      {/* 🌟 메인 돌탑 3D/물리 캔버스 스테이지 */}
      <main
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          overflow: 'hidden',
          paddingBottom: 24,
        }}
      >
        {/* 상단 스윙 중인 내 펫 (낙하 대기 영역) */}
        {(gameState === 'swinging' || gameState === 'dropping') && (
          <div
            style={{
              position: 'absolute',
              top: 18 + (gameState === 'dropping' ? dropY : 0),
              left: `calc(50% + ${swingPos}px)`,
              transform: 'translateX(-50%)',
              transition: gameState === 'dropping' ? 'top 0.38s cubic-bezier(0.55, 0.085, 0.68, 0.53)' : 'none',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* 천장에 매달린 투명 당근 밧줄 가이드 */}
            <div
              style={{
                width: 2,
                height: 38,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(245,158,11,0.6))',
                marginBottom: -4,
              }}
            />
            <div
              style={{
                filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
                animation: 'breathing-wiggle 1.8s ease-in-out infinite',
              }}
            >
              <MonsterView look={myLook} size={54} prefer2D={false} />
            </div>
            <div
              style={{
                marginTop: 2,
                background: 'rgba(236,72,153,0.92)',
                color: '#FFF',
                fontSize: 9.5,
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: 999,
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              {petName} (내 펫)
            </div>
          </div>
        )}

        {/* 🪨 탑 전체 컨테이너 (누적 틸트 각도에 따라 좌우로 삐걱거리며 회전) */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column-reverse', // 아래서부터 1층, 2층, 3층 순차 스택
            alignItems: 'center',
            transformOrigin: 'bottom center',
            transform: `rotate(${activeTilt * 0.4}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 10,
            marginBottom: 10,
          }}
        >
          {/* 황금 파티세리 받침대 (돌탑 바닥 플래터) */}
          <div
            style={{
              width: 175,
              height: 28,
              borderRadius: 14,
              background: 'linear-gradient(180deg, #F59E0B 0%, #B45309 60%, #78350F 100%)',
              border: '2px solid #FDE047',
              boxShadow: '0 8px 24px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFBEB',
              fontSize: 10.5,
              fontWeight: 900,
              letterSpacing: 1,
              marginTop: 4,
            }}
          >
            🧁 황금 디저트 받침대
          </div>

          {/* 쌓여있는 펫 층들 (아래에서 위로) */}
          {activeTiers.map((tier, idx) => {
            const isTop = idx === activeTiers.length - 1
            return (
              <div
                key={tier.id}
                style={{
                  position: 'relative',
                  left: tier.offsetX,
                  marginTop: idx === 0 ? 0 : -14, // 펫들끼리 겹치며 포근하게 안착
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: isTop && gameState === 'landed' ? 'bounceIn 0.45s ease-out' : 'none',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
                  transition: 'all 0.3s ease',
                  zIndex: idx + 2,
                }}
              >
                {/* 층수 및 안착 정보 말풍선 태그 */}
                <div
                  style={{
                    background:
                      tier.accuracy === 'PERFECT'
                        ? 'rgba(16, 185, 129, 0.92)'
                        : tier.accuracy === 'GREAT'
                        ? 'rgba(59, 130, 246, 0.92)'
                        : 'rgba(245, 158, 11, 0.92)',
                    color: '#FFFFFF',
                    fontSize: 8.5,
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: 8,
                    marginBottom: -2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  {tier.floor}단 · {tier.ownerName}
                </div>

                {/* 3D / 2D 디저트 펫 뷰 */}
                <div style={{ pointerEvents: 'none' }}>
                  <MonsterView look={tier.look} size={50} prefer2D={false} />
                </div>
              </div>
            )
          })}
        </div>

        {/* 쓰러졌을 때 파편 및 알림 */}
        {gameState === 'fallen' && (
          <div
            style={{
              position: 'absolute',
              top: '32%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(15, 8, 28, 0.95)',
              border: '2px solid #EF4444',
              borderRadius: 20,
              padding: '18px 22px',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
              zIndex: 50,
              animation: 'bounceIn 0.4s ease-out',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 4 }}>💥 와르르!</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#F87171' }}>돌탑이 쓰러졌습니다!</div>
            <div style={{ fontSize: 11.5, color: '#E2E8F0', margin: '8px 0 14px' }}>
              균형이 무너졌지만 펫들은 퐁퐁 튕겨나가 무사해요!
            </div>
            <button
              type="button"
              onClick={mode === 'relay' ? startRelayGame : startSoloGame}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #EC4899, #BE185D)',
                color: '#FFF',
                fontWeight: 900,
                fontSize: 13,
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
              top: '22%',
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
            <div style={{ fontSize: 13.5, fontWeight: 900, color: accuracyNotice.color }}>
              {accuracyNotice.text}
            </div>
            <div style={{ fontSize: 10, color: '#DDD6FE' }}>{accuracyNotice.sub}</div>
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
            fontSize: 11.5,
            fontWeight: 800,
            padding: '6px 16px',
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
          background: 'rgba(20, 10, 36, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {gameState === 'ready' && (
          <button
            type="button"
            onClick={mode === 'relay' ? startRelayGame : startSoloGame}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: 16,
              border: 'none',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>✨</span>
            <span>{mode === 'relay' ? `${currentFloor}단 릴레이 쌓기 도전!` : '솔로 돌탑 쌓기 시작!'}</span>
          </button>
        )}

        {gameState === 'swinging' && (
          <button
            type="button"
            onClick={handleDropPet}
            style={{
              width: '100%',
              padding: '15px 0',
              borderRadius: 18,
              border: 'none',
              background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(236,72,153,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              animation: 'pulse 1.2s infinite',
            }}
          >
            <span>👇</span>
            <span>퐁당! 타이밍 맞춰 펫 올리기 (DROP!)</span>
          </button>
        )}

        {gameState === 'landed' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setGameState('swinging')
                setDropY(0)
                setAccuracyNotice(null)
              }}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFF',
                fontWeight: 900,
                fontSize: 13,
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
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid #FCD34D',
                  background: 'rgba(245,158,11,0.2)',
                  color: '#FDE047',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                📢 지인에게 전달
              </button>
            )}
          </div>
        )}

        {/* 지인 릴레이 안내 캡션 */}
        <div style={{ textAlign: 'center', fontSize: 10, color: '#A78BFA' }}>
          💡 좌우로 흔들리는 펫이 이전 펫의 정중앙에 올 때 탭하세요! 오차가 작을수록 탑이 단단해집니다.
        </div>
      </footer>
    </div>
  )
}
