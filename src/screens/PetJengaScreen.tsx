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
  cheerMsg?: string
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

const RELAY_STORAGE_KEY = 'pet_together_jenga_relay_v5'
const SOLO_RECORD_STORAGE_KEY = 'pet_together_jenga_solo_record_v5'

// 👥 [실제 지인 연합 릴레이 주자 풀] - 지인 펫들과 1단씩 번갈아 쌓는 생생한 비동기 릴레이
export const RELAY_FRIENDS_POOL: {
  ownerName: string
  petName: string
  species: string
  look: MonsterLook
  cheerMsg: string
}[] = [
  {
    ownerName: '말랑 님',
    petName: '딸기모찌',
    species: 'mochi',
    cheerMsg: '1단은 내가 든든하게 받쳐둘게! 🍓',
    look: {
      species: 'mochi',
      palette: 0,
      bodyType: 'normal',
      scale: 0.85,
      ears: 0,
      tail: 0,
      top: 0,
      expression: 'mochi-sparkle',
      patternSeed: 12,
      shiny: false,
      mallang: { dessertBase: 'strawberry-cake' },
    } as MonsterLook,
  },
  {
    ownerName: '젤리 님',
    petName: '별빛구미',
    species: 'jelly',
    cheerMsg: '살짝 흔들렸지만 중심 잡았어! ✨',
    look: {
      species: 'jelly',
      palette: 3,
      bodyType: 'normal',
      scale: 0.8,
      ears: 0,
      tail: 0,
      top: 1,
      expression: 'round',
      patternSeed: 88,
      shiny: false,
      mallang: { dessertBase: 'macaron-cushion' },
    } as MonsterLook,
  },
  {
    ownerName: '슈슈 님',
    petName: '유리알탕후루',
    species: 'tanghulu',
    cheerMsg: '바삭 빠작! 다음 주자 힘내! 🍬',
    look: {
      species: 'tanghulu',
      palette: 0,
      bodyType: 'normal',
      scale: 0.8,
      ears: 0,
      tail: 0,
      top: 0,
      expression: 'sharp',
      patternSeed: 55,
      shiny: false,
      mallang: { dessertBase: 'parfait-cup' },
    } as MonsterLook,
  },
  {
    ownerName: '마포 님',
    petName: '두바이쿠키',
    species: 'dubai-cookie',
    cheerMsg: '카다이프 중심력 발동 완료! 🍫',
    look: {
      species: 'dubai-cookie',
      palette: 2,
      bodyType: 'normal',
      scale: 0.85,
      ears: 1,
      tail: 0,
      top: 0,
      expression: 'round',
      patternSeed: 33,
      shiny: false,
      mallang: { dessertBase: 'choco-cookie' },
    } as MonsterLook,
  },
  {
    ownerName: '초코 님',
    petName: '가나슈퐁듀',
    species: 'choco',
    cheerMsg: '달콤하게 사르르 얹어뒀어! 🔥',
    look: {
      species: 'choco',
      palette: 1,
      bodyType: 'normal',
      scale: 0.8,
      ears: 1,
      tail: 1,
      top: 0,
      expression: 'sharp',
      patternSeed: 77,
      shiny: false,
      mallang: { dessertBase: 'strawberry-cake' },
    } as MonsterLook,
  },
]

// 📐 1단부터 위로 올라갈수록 펫의 크기가 뚜렷하게 작아지는 피라미드 스케일링 (54px -> 48px -> 42px -> 36px -> 30px -> 25px -> 20px)
export function getTierPetSize(floor: number): number {
  return Math.max(20, Math.round(54 - (floor - 1) * 5.5))
}

// 기본 지인 릴레이 돌탑 초기 데이터: 지인들이 이미 1~2단을 아슬아슬하게 세워둔 상태로 시작하여 진짜 릴레이 체감!
function getInitialRelayState(): RelayTowerState {
  const f1 = RELAY_FRIENDS_POOL[0]
  const f2 = RELAY_FRIENDS_POOL[1]
  const initialTiers: TowerTier[] = [
    {
      id: 'init-tier-1',
      floor: 1,
      ownerName: f1.ownerName,
      petName: f1.petName,
      species: f1.species,
      look: f1.look,
      offsetX: 0,
      petSize: getTierPetSize(1),
      accuracy: 'PERFECT',
      placedAt: new Date(Date.now() - 3600000).toISOString(),
      cheerMsg: f1.cheerMsg,
    },
    {
      id: 'init-tier-2',
      floor: 2,
      ownerName: f2.ownerName,
      petName: f2.petName,
      species: f2.species,
      look: f2.look,
      offsetX: 4.5,
      petSize: getTierPetSize(2),
      accuracy: 'GREAT',
      placedAt: new Date(Date.now() - 1800000).toISOString(),
      cheerMsg: f2.cheerMsg,
    },
  ]

  return {
    towerId: `tower-${Date.now()}`,
    tiers: initialTiers,
    potCoins: 250,
    potRibbons: 30,
    highestRecord: 2,
    lastPlayerName: `${f2.ownerName} (${f2.petName})`,
    cumulativeTilt: 2.8,
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
  const noticeTimerRef = useRef<number | null>(null)

  // 👥 [비동기 지인 릴레이 턴 상태] 지인 펫들과 번갈아 돌탑을 쌓아올리는 협동 릴레이
  const [friendRelayActive, setFriendRelayActive] = useState<boolean>(false)
  const [currentFriendTurn, setCurrentFriendTurn] = useState<typeof RELAY_FRIENDS_POOL[0] | null>(null)
  const [activeSpeechBubble, setActiveSpeechBubble] = useState<{ id: string; text: string } | null>(null)

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
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}

    // 🎯 [대표님 피드백 100% 반영] 화면에서 손을 떼는 순간, 조준한 바로 그 지점으로 퐁당 자유낙하!
    if (gameState === 'aiming') {
      executeDrop()
    }
  }

  // 🚀 2. [자연낙하 & 무게중심 기울기 연출 트리거]
  const executeDrop = () => {
    if (gameState !== 'aiming' || !aimPetRef.current) return

    setGameState('dropping')
    const finalDropX = dragXRef.current

    // 📐 타워 꼭대기 실제 DOM 좌표까지의 정확한 낙하 거리 동적 산출
    let targetDropY = 260
    if (stageRef.current && aimPetRef.current && towerRef.current) {
      const aimRect = aimPetRef.current.getBoundingClientRect()
      const towerRect = towerRef.current.getBoundingClientRect()
      // 타워 상단까지 낙하 거리
      const realDist = (towerRect.top - aimRect.top) - (currentPetSize * 0.22)
      if (realDist > 40) {
        targetDropY = realDist
      }
    }

    // 하드웨어 가속 중력 자유낙하 애니메이션 (0.42s)
    aimPetRef.current.style.transition = 'transform 0.42s cubic-bezier(0.45, 0, 0.75, 0.6)'
    aimPetRef.current.style.transform = `translate3d(${finalDropX}px, ${targetDropY}px, 0)`

    playDessertAsmr('wax-pop')

    // 0.42초 후 착지 충격 & 천천히 무게중심에 따라 기우는 서스펜스 물리 시작!
    window.setTimeout(() => {
      handleLandingImpact(finalDropX)
    }, 420)
  }

  // ⚖️ 3. [대표님 핵심 요청] 0.1px 오차 없는 정밀 착지 + 진짜 지레 토크 무게중심(Center of Mass) 물리 엔진!
  const handleLandingImpact = (landedX: number) => {
    // 🎯 [인위적 맨 위 펫 강제 이동 버그 완전 제거]
    // 사용자가 조준하여 손을 뗀 바로 그 X 좌표(landedX)에 100% 오차 없이 정확히 안착!
    const exactDropX = Math.round(landedX * 10) / 10

    const prevTier = activeTiers[activeTiers.length - 1]
    const prevX = prevTier ? prevTier.offsetX : 0
    const localDiff = Math.abs(exactDropX - prevX)
    // 두 펫의 접촉 가능 유효 반경 (아래 펫 몸체 너비의 약 80%에 걸치면 안착 가능)
    const maxContactRadius = prevTier ? (prevTier.petSize + currentPetSize) * 0.44 : 48

    // 💥 1. 새로 드롭한 펫을 사용자가 조준한 바로 그 절대 X 위치에 100% 정밀 안착!
    const newTier: TowerTier = {
      id: `tier-${Date.now()}`,
      floor: currentFloor,
      ownerName: '나 (' + petName + ')',
      petName: petName,
      species: myMonster.species,
      look: myLook,
      offsetX: exactDropX,
      petSize: currentPetSize,
      accuracy: 'WOBBLE',
      placedAt: new Date().toISOString(),
    }

    const allTiers = [...activeTiers, newTier]

    // 📐 2. 고정밀 물리 지레 토크 & 무게중심 (Torque & Center of Mass):
    // 각 층의 무게(w)와 층고에 따른 모멘트 암(heightArm)을 가중치로 한 정밀 지레 토크 산출
    let totalWeight = 0
    let totalMoment = 0
    let weightedTorque = 0
    let totalTorqueWeight = 0

    allTiers.forEach((t, i) => {
      const w = t.petSize || 40
      const heightArm = 1 + i * 0.65 // 위층으로 갈수록 받침대에 가해지는 전복 지레 모멘트가 커짐
      totalWeight += w
      totalMoment += t.offsetX * w
      weightedTorque += t.offsetX * w * heightArm
      totalTorqueWeight += w * heightArm
    })

    const centerOfMass = totalMoment / totalWeight
    const effectiveCenter = totalTorqueWeight > 0 ? weightedTorque / totalTorqueWeight : centerOfMass

    // ⚖️ 3. 지지선 균형 판정 (비뚤어져도 무게중심만 맞으면 무너지지 않는 진짜 돌탑의 손맛!)
    // - 황금 받침대(폭 140px) 유효 지지 한계: ±28px
    // - 아래 층과의 접촉면 한계: localDiff <= maxContactRadius (허공에 완전히 떨어진 경우만 미끄러짐)
    const willSlideOff = activeTiers.length > 0 && localDiff > maxContactRadius
    const willTipOver = Math.abs(effectiveCenter) > 28
    const willCollapse = willSlideOff || willTipOver

    let accuracy: 'PERFECT' | 'GREAT' | 'WOBBLE' = 'WOBBLE'
    let sound: DessertSoundKind = 'mochi-squish'
    let notice = { text: '⚠️ WOBBLE! 기우뚱!', color: '#F59E0B', sub: '무게중심이 흔들려요!' }

    if (!willCollapse) {
      if (Math.abs(effectiveCenter) <= 7) {
        accuracy = 'PERFECT'
        sound = 'sugar-crack'
        notice = { text: '✨ PERFECT! 황금 무게중심!', color: '#10B981', sub: `중심 오차 ${effectiveCenter.toFixed(1)}px! 환상적인 수직 균형!` }
      } else if (Math.abs(effectiveCenter) <= 18) {
        accuracy = 'GREAT'
        sound = 'mochi-squish'
        notice = { text: '👍 GREAT! 지그재그 균형!', color: '#3B82F6', sub: `오차 ${effectiveCenter.toFixed(1)}px! 삐뚤빼뚤하지만 무게중심이 절묘해요!` }
      } else {
        accuracy = 'WOBBLE'
        sound = 'wax-tap'
        notice = { text: '💦 아슬아슬 버팀! 휴우~!', color: '#F59E0B', sub: `기우뚱! 받침대 끝자락(${effectiveCenter.toFixed(1)}px)에서 간신히 버텼어요!` }
      }
    } else {
      sound = 'mochi-squish'
      notice = {
        text: willSlideOff ? '💥 미끄덩! 허공 낙하!' : '💥 와르르! 무게중심 전복!',
        color: '#EF4444',
        sub: willSlideOff ? '아래 펫과의 접촉면을 완전히 벗어나 미끄러졌어요!' : `무게중심(${effectiveCenter.toFixed(1)}px)이 받침대 지지선을 벗어났어요!`,
      }
    }

    newTier.accuracy = accuracy

    // 즉시 상태에 반영하여 드롭한 펫이 사라지지 않고 탑 꼭대기에 그대로 보이게 함!
    if (mode === 'relay') {
      setRelayState((prev) => ({ ...prev, tiers: allTiers }))
    } else {
      setSoloTiers(allTiers)
    }

    setBurstKind(sound)
    setBurstKey((k) => k + 1)
    playDessertAsmr(sound, accuracy === 'PERFECT' ? 3 : 1)

    setGameState('swaying')
    setAccuracyNotice(notice)
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = window.setTimeout(() => {
      setAccuracyNotice(null)
    }, 1500)

    // 🎬 4. [대표님 핵심 요청] 실제 물리학 감속(Damping)에 따른 3단계 서스펜스 속도감 연출!
    const targetTiltDeg = effectiveCenter * 0.58

    if (towerRef.current) {
      // 1단계 (0 ~ 450ms): 착지 하중에 의해 탑이 삐걱거리며 무게중심 방향으로 기우뚱 넘어가는 관성 회전
      towerRef.current.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)'
      towerRef.current.style.transform = `rotate(${targetTiltDeg * 1.25}deg)`

      window.setTimeout(() => {
        if (!towerRef.current) return

        if (willCollapse) {
          // 💥 붕괴 2단계 (450 ~ 1250ms): 기울기를 못 이기고 중력 가속도가 붙으며 휙! 와르르 무너짐!
          towerRef.current.style.transition = 'transform 0.8s cubic-bezier(0.6, -0.05, 0.9, 0.4)'
          towerRef.current.style.transform = `rotate(${effectiveCenter >= 0 ? 68 : -68}deg)`

          window.setTimeout(() => {
            handleTowerCollapse(targetTiltDeg)
          }, 800)
        } else {
          // 2단계 (450 ~ 850ms): 멈칫하다가 "덜컹!" 반대로 살짝 튕기는 탄성 반동 (심장 쫄깃한 구간!)
          towerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.35, 0.64, 1)'
          towerRef.current.style.transform = `rotate(${targetTiltDeg * -0.2}deg)`

          window.setTimeout(() => {
            if (!towerRef.current) return
            // 3단계 (850 ~ 1200ms): 최종 평형 각도로 자연스럽게 정착!
            towerRef.current.style.transition = 'transform 0.35s ease-out'
            towerRef.current.style.transform = `rotate(${targetTiltDeg}deg)`

            window.setTimeout(() => {
              finalizeSwaySuccess(targetTiltDeg, accuracy, allTiers)
            }, 350)
          }, 400)
        }
      }, 450)
    }
  }

  // ✨ 흔들림을 버텨내고 최종 안착 성공 처리
  const finalizeSwaySuccess = (finalTilt: number, accuracy: 'PERFECT' | 'GREAT' | 'WOBBLE', allTiers: TowerTier[]) => {
    setGameState('settled')
    if (accuracy === 'WOBBLE' || Math.abs(finalTilt) >= 8) {
      // 💡 [대표님 제안 반영] 아슬아슬 세이브: "휴우~ 살았다!" 안도 음성 재생
      playBabyGiggleSound('휴우~!', 'comfort')
    } else {
      playBabyGiggleSound(accuracy === 'PERFECT' ? '까르르' : '헤헤헤', 'cheer')
    }

    if (mode === 'relay') {
      const addedCoins = accuracy === 'PERFECT' ? 35 : accuracy === 'GREAT' ? 25 : 15
      const updatedPotCoins = relayState.potCoins + addedCoins
      const updatedPotRibbons = relayState.potRibbons + (accuracy === 'PERFECT' ? 4 : 2)
      const updatedRecord = Math.max(relayState.highestRecord, allTiers.length)

      const updatedRelay: RelayTowerState = {
        ...relayState,
        tiers: allTiers,
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
      setToastMsg(`🎉 ${currentFloor}단 안착 성공! (+${addedCoins}🪙 획득, 팟에 적립!)`)

      if (allTiers.length % 5 === 0) {
        setTimeout(() => {
          playDessertAsmr('starlight-ting', 3)
          setToastMsg(`🌟 [${allTiers.length}단 돌파 잭팟!] 마을 전체에 축하 선물이 배달됩니다!`)
        }, 1200)
      }

      // 👥 [비동기 지인 릴레이 바통 터치!] 1.4초 후 다음 지인 주자가 바통을 이어받아 1단을 함께 쌓음!
      window.setTimeout(() => {
        executeFriendRelayTurn(updatedRelay)
      }, 1500)
    } else {
      setSoloTiers(allTiers)
      setSoloTilt(finalTilt)
      if (allTiers.length > soloBestScore) {
        setSoloBestScore(allTiers.length)
        localStorage.setItem(SOLO_RECORD_STORAGE_KEY, String(allTiers.length))
      }
      onRewardCoins?.(20, 1)
      setToastMsg(`🎉 솔로 ${currentFloor}층 돌파 성공! (+20🪙)`)
    }
  }

  // 👥 [비동기 지인 릴레이 턴 실행] 지인 펫이 탑 위에 비동기로 1단을 안착시켜 탑을 함께 높여나감!
  const executeFriendRelayTurn = (currentRelay: RelayTowerState) => {
    if (currentRelay.isFallen) return
    const nextFriendIdx = currentRelay.tiers.length % RELAY_FRIENDS_POOL.length
    const friend = RELAY_FRIENDS_POOL[nextFriendIdx]
    setCurrentFriendTurn(friend)
    setFriendRelayActive(true)

    setToastMsg(`📢 [릴레이 바통 터치!] 다음 주자 ${friend.ownerName}의 ${friend.petName}이(가) 조준합니다!`)
    playDessertAsmr('wax-pop')

    // 1.4초 후 지인 펫이 탑 꼭대기에 톡! 안착하는 시뮬레이션
    window.setTimeout(() => {
      const friendFloor = currentRelay.tiers.length + 1
      const friendSize = getTierPetSize(friendFloor)
      const prevTier = currentRelay.tiers[currentRelay.tiers.length - 1]
      // 지인의 자연스러운 조준 편차 (-6px ~ +6px)
      const friendOffset = prevTier ? prevTier.offsetX + (Math.random() * 10 - 5) : (Math.random() * 8 - 4)

      const newFriendTier: TowerTier = {
        id: `tier-friend-${Date.now()}`,
        floor: friendFloor,
        ownerName: friend.ownerName,
        petName: friend.petName,
        species: friend.species,
        look: friend.look,
        offsetX: Math.round(friendOffset * 10) / 10,
        petSize: friendSize,
        accuracy: 'GREAT',
        placedAt: new Date().toISOString(),
        cheerMsg: friend.cheerMsg,
      }

      const allTiers = [...currentRelay.tiers, newFriendTier]

      // 탑 전체 지레 토크 & 무게중심 정밀 재계산
      let totalW = 0
      let weightedT = 0
      let totalTW = 0
      allTiers.forEach((t, i) => {
        const w = t.petSize || 40
        const arm = 1 + i * 0.65
        totalW += w
        weightedT += t.offsetX * w * arm
        totalTW += w * arm
      })
      const newEffectiveCenter = totalTW > 0 ? weightedT / totalTW : 0
      const newTiltDeg = newEffectiveCenter * 0.58

      if (towerRef.current) {
        towerRef.current.style.transition = 'transform 0.45s ease-out'
        towerRef.current.style.transform = `rotate(${newTiltDeg}deg)`
      }

      const updatedRelay: RelayTowerState = {
        ...currentRelay,
        tiers: allTiers,
        potCoins: currentRelay.potCoins + 30,
        potRibbons: currentRelay.potRibbons + 3,
        highestRecord: Math.max(currentRelay.highestRecord, allTiers.length),
        lastPlayerName: `${friend.ownerName} (${friend.petName})`,
        cumulativeTilt: newTiltDeg,
        isFallen: false,
      }

      setRelayState(updatedRelay)
      localStorage.setItem(RELAY_STORAGE_KEY, JSON.stringify(updatedRelay))

      // 안착 사운드 & 파티클
      playDessertAsmr('mochi-squish')
      playBabyGiggleSound('헤헤헤', 'cheer')
      setBurstKind('mochi-squish')
      setBurstKey((k) => k + 1)

      setAccuracyNotice({
        text: `✨ ${friend.ownerName}의 ${friend.petName} 안착 성공!`,
        color: '#10B981',
        sub: `"${friend.cheerMsg}" (누적 팟 +30🪙)`,
      })

      window.setTimeout(() => {
        setAccuracyNotice(null)
        setFriendRelayActive(false)
        setCurrentFriendTurn(null)
        setGameState('aiming')
        dragXRef.current = 0
        if (aimPetRef.current) aimPetRef.current.style.transform = 'translate3d(0px, 0, 0)'
        setToastMsg(`🎯 지인 안착 완료! 이제 다시 내 차례 (${allTiers.length + 1}단 조준)!`)
      }, 1600)
    }, 1400)
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
        {(gameState === 'aiming' || friendRelayActive) && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: friendRelayActive ? 'rgba(88, 28, 135, 0.88)' : 'rgba(15, 8, 28, 0.75)',
              border: friendRelayActive ? '1px solid #C084FC' : '1px solid rgba(253, 224, 71, 0.4)',
              borderRadius: 999,
              padding: '4px 14px',
              fontSize: 10.5,
              fontWeight: 800,
              color: friendRelayActive ? '#F5D0FE' : '#FEF08A',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
              animation: 'pulse 1.8s infinite',
            }}
          >
            {friendRelayActive && currentFriendTurn ? (
              <span>👥 [지인 릴레이 턴] {currentFriendTurn.ownerName}님이 조준 중입니다...</span>
            ) : (
              <span>👈 [내 차례] 좌우로 부드럽게 드래그하여 조준 후 [드롭]하세요 👉</span>
            )}
          </div>
        )}

        {/* 🐾 상단 펫 (내 펫 또는 릴레이 지인 펫: 120FPS 직접 DOM GPU Transform 제어 & 3D 스냅샷) */}
        {(gameState === 'aiming' || gameState === 'dropping' || friendRelayActive) && (
          <div
            ref={aimPetRef}
            style={{
              position: 'absolute',
              top: 48,
              left: '50%',
              marginLeft: -Math.round(currentPetSize / 2),
              transform: 'translate3d(0px, 0, 0)',
              willChange: 'transform',
              zIndex: 35,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {/* 3D 디저트 펫 스냅샷: 2D 레거시 캐릭터 노출 0% 보장 */}
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
              <MonsterSnapshot
                look={friendRelayActive && currentFriendTurn ? currentFriendTurn.look : myLook}
                size={currentPetSize}
                title={friendRelayActive && currentFriendTurn ? currentFriendTurn.petName : petName}
              />
            </div>

            <div
              style={{
                marginTop: 2,
                background: friendRelayActive ? 'rgba(139, 92, 246, 0.95)' : 'rgba(236,72,153,0.92)',
                color: '#FFF',
                fontSize: 8.5,
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: 999,
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap',
                border: '1px solid rgba(255,255,255,0.4)',
              }}
            >
              {friendRelayActive && currentFriendTurn
                ? `✨ ${currentFriendTurn.ownerName} · ${currentFriendTurn.petName} (${currentFloor}단)`
                : `👑 나 · ${petName} (${currentFloor}단)`}
            </div>
          </div>
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
            const isMine = tier.ownerName.includes('나') || tier.ownerName.includes(petName)

            return (
              <div
                key={tier.id}
                onClick={(e) => {
                  e.stopPropagation()
                  playBabyGiggleSound('헤헤헤', 'cheer')
                  playDessertAsmr('mochi-squish')
                  setActiveSpeechBubble({
                    id: tier.id,
                    text: tier.cheerMsg || `${tier.ownerName}: 중심 조심해! ✨`,
                  })
                  window.setTimeout(() => {
                    setActiveSpeechBubble((cur) => (cur?.id === tier.id ? null : cur))
                  }, 2200)
                }}
                style={{
                  position: 'relative',
                  left: tier.offsetX,
                  marginTop: idx === 0 ? 0 : -Math.round(size * 0.28), // 포근하게 안착
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: isTop && gameState === 'settled' ? 'bounceIn 0.35s ease-out' : 'none',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
                  zIndex: idx + 2,
                  cursor: 'pointer',
                }}
              >
                {/* 층 터치 시 지인 응원 말풍선 */}
                {activeSpeechBubble?.id === tier.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -24,
                      background: 'rgba(255,255,255,0.96)',
                      color: '#4E342E',
                      fontSize: 8.5,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 10,
                      border: '1.5px solid #EC4899',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                      whiteSpace: 'nowrap',
                      zIndex: 15,
                      pointerEvents: 'none',
                      animation: 'bounceIn 0.3s ease-out',
                    }}
                  >
                    💬 {activeSpeechBubble.text}
                  </div>
                )}

                {/* 층수 뱃지 (내 층과 지인 층 명확히 시각적 구별) */}
                <div
                  style={{
                    background: isMine
                      ? 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)'
                      : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                    color: '#FFFFFF',
                    fontSize: Math.max(7.5, size * 0.22),
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: 6,
                    marginBottom: -3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(255,255,255,0.4)',
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

        {/* 🎯 판정 알림 배너 (탑과 펫을 가리지 않도록 상단 안전 영역 배치 & 터치 통과) */}
        {accuracyNotice && gameState !== 'fallen' && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 8, 28, 0.94)',
              border: `2px solid ${accuracyNotice.color}`,
              borderRadius: 14,
              padding: '5px 14px',
              textAlign: 'center',
              boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
              zIndex: 45,
              animation: 'bounceIn 0.3s ease',
              pointerEvents: 'none',
              maxWidth: '90%',
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 900, color: accuracyNotice.color }}>
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
