// M3 화면 2: ⚔️🎧 리얼 액션 턴제 식감 ASMR 대전 아레나 (포켓몬고 2·3번 씬 스타일 전면 업그레이드)
// - [거대 보스 3D 원근 로우앵글]: 압도적인 크기의 보스를 올려다보는 깊이감 있는 3D 로우앵글 투시
// - [다이맥스 거대화 연출]: 보스 머리 위의 3단 다이맥스 회전 구름 링(Dynamax Clouds) 및 맥스 번개 아우라
// - [지인 연합 비동기 협력 레이드]: 참전 지인 펫들이 거대 보스 앞 옹기종기 모여 주둔, 공격하는 내 펫만 전면 돌격 타격
// - [DESSERT MAX 게이지 & 필살기]: 공방 및 터치 응원으로 100% 충전 시 [⚡ 거대 디저트 MAX 스트라이크!!] 협력 총공격

import { useEffect, useMemo, useState } from 'react'
import { addRibbonCoins } from '../config/boutique'
import { recordMissionAction } from '../config/missions'
import { SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { simulateAsmrBattle, type BattleSimulationResult } from '../lib/battleEngine'
import { playDessertAsmr } from '../lib/sound'
import { recordBossDamage, getBossRankRewards } from '../lib/bossScheduler'
import WorldBoss3DView from '../monsters/WorldBoss3DView'
import BattleFighter, { type Pose } from '../ui/BattleFighter'
import BattleFx from '../ui/BattleFx'
import MonsterView from '../monsters/MonsterView'
import { BackIcon, ElementIcon } from '../ui/Icons'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'
import { DECO_ITEMS } from '../monsters/Decorations'
import type { MonsterLook } from '../monsters/types'

export interface RaidParticipantItem {
  id: string
  ownerName: string
  petName: string
  damage: number
  statusText: string
  icon: string
  look: MonsterLook
}

interface Props {
  challenger: MonsterRow
  defender: MonsterRow
  defenderOwnerName: string
  battleMode?: 'friendly' | 'boss-raid'
  initialSeed?: number
  // 실제 서비스: 서버가 정한 결과(시드·턴 기록)를 그대로 재생한다
  precomputed?: BattleSimulationResult
  raidParticipantCount?: number
  customParticipants?: RaidParticipantItem[]
  onRematch?: () => void
  onRewardClaimed?: (coinsEarned: number) => void
  onBack: () => void
}

// 👥 (개발 테스트/참조용) 지인 펫 풀
export const RAID_PARTICIPANTS_POOL: RaidParticipantItem[] = [
  {
    id: 'participant-1',
    ownerName: '말랑 님',
    petName: '딸기모찌',
    damage: 420,
    statusText: '타격완료',
    icon: '🍡',
    look: { species: 'mochi', palette: 0, bodyType: 'normal', scale: 0.85, ears: 0, tail: 0, top: 0, expression: 'mochi-sparkle', patternSeed: 12, shiny: false, evoStage: 2, evoBranch: 'sweet-melty', mallang: { dessertBase: 'strawberry-cake' } } as MonsterLook,
  },
  {
    id: 'participant-2',
    ownerName: '젤리 님',
    petName: '별빛구미',
    damage: 580,
    statusText: '극딜완료',
    icon: '✨',
    look: { species: 'jelly', palette: 3, bodyType: 'normal', scale: 0.8, ears: 0, tail: 0, top: 1, expression: 'round', patternSeed: 88, shiny: false, evoStage: 2, evoBranch: 'gourmet-rainbow', mallang: { dessertBase: 'macaron-cushion' } } as MonsterLook,
  },
  {
    id: 'participant-3',
    ownerName: '슈슈 님',
    petName: '유리알탕후루',
    damage: 350,
    statusText: '치명타완료',
    icon: '🍬',
    look: { species: 'tanghulu', palette: 0, bodyType: 'normal', scale: 0.8, ears: 0, tail: 0, top: 0, expression: 'sharp', patternSeed: 55, shiny: false, evoStage: 2, evoBranch: 'crispy-crunch', mallang: { dessertBase: 'parfait-cup' } } as MonsterLook,
  },
  {
    id: 'participant-4',
    ownerName: '마포 님',
    petName: '두바이쿠키',
    damage: 610,
    statusText: 'MVP타격',
    icon: '🍫',
    look: { species: 'dubai-cookie', palette: 2, bodyType: 'normal', scale: 0.85, ears: 1, tail: 0, top: 0, expression: 'round', patternSeed: 33, shiny: false, evoStage: 2, evoBranch: 'sweet-melty', mallang: { dessertBase: 'choco-cookie' } } as MonsterLook,
  },
  {
    id: 'participant-5',
    ownerName: '초코 님',
    petName: '가나슈퐁듀',
    damage: 490,
    statusText: '화염타격',
    icon: '🔥',
    look: { species: 'choco', palette: 1, bodyType: 'normal', scale: 0.8, ears: 1, tail: 1, top: 0, expression: 'sharp', patternSeed: 77, shiny: false, evoStage: 2, evoBranch: 'royal-chef', mallang: { dessertBase: 'strawberry-cake' } } as MonsterLook,
  },
  {
    id: 'participant-6',
    ownerName: '버블 님',
    petName: '과즙왁싱볼',
    damage: 380,
    statusText: '타격완료',
    icon: '🫧',
    look: { species: 'wax-ball', palette: 2, bodyType: 'normal', scale: 0.85, ears: 1, tail: 1, top: 0, expression: 'sharp', patternSeed: 44, shiny: false, evoStage: 2, evoBranch: 'crispy-crunch', mallang: { dessertBase: 'parfait-cup' } } as MonsterLook,
  },
  {
    id: 'participant-7',
    ownerName: '스모어 님',
    petName: '토스트마시멜로',
    damage: 310,
    statusText: '식감공격',
    icon: '🐱',
    look: { species: 'smore', palette: 0, bodyType: 'normal', scale: 0.8, ears: 1, tail: 0, top: 0, expression: 'round', patternSeed: 21, shiny: false, evoStage: 1, mallang: { dessertBase: 'choco-cookie' } } as MonsterLook,
  },
  {
    id: 'participant-8',
    ownerName: '푸딩 님',
    petName: '커스터드푸딩',
    damage: 270,
    statusText: '탱킹완료',
    icon: '🍮',
    look: { species: 'pudding', palette: 1, bodyType: 'normal', scale: 0.8, ears: 0, tail: 1, top: 0, expression: 'round', patternSeed: 62, shiny: false, evoStage: 1, mallang: { dessertBase: 'custard-pudding' } } as MonsterLook,
  },
  {
    id: 'participant-9',
    ownerName: '베리 님',
    petName: '산딸기타르트',
    damage: 440,
    statusText: '극딜완료',
    icon: '🍓',
    look: { species: 'mochi', palette: 2, bodyType: 'chubby', scale: 0.85, ears: 0, tail: 0, top: 1, expression: 'round', patternSeed: 19, shiny: false, evoStage: 2, evoBranch: 'sweet-melty', mallang: { dessertBase: 'strawberry-cake' } } as MonsterLook,
  },
  {
    id: 'participant-10',
    ownerName: '모카 님',
    petName: '에스프레소쿠키',
    damage: 510,
    statusText: '치명타완료',
    icon: '☕',
    look: { species: 'dubai-cookie', palette: 1, bodyType: 'normal', scale: 0.8, ears: 0, tail: 0, top: 0, expression: 'sharp', patternSeed: 91, shiny: false, evoStage: 2, evoBranch: 'crispy-crunch', mallang: { dessertBase: 'choco-cookie' } } as MonsterLook,
  },
  {
    id: 'participant-11',
    ownerName: '밀크 님',
    petName: '우유푸딩',
    damage: 330,
    statusText: '보조완료',
    icon: '🥛',
    look: { species: 'pudding', palette: 0, bodyType: 'chubby', scale: 0.8, ears: 1, tail: 0, top: 0, expression: 'round', patternSeed: 48, shiny: false, evoStage: 1, mallang: { dessertBase: 'custard-pudding' } } as MonsterLook,
  },
  {
    id: 'participant-12',
    ownerName: '크림 님',
    petName: '생크림파르페',
    damage: 460,
    statusText: '타격완료',
    icon: '🍨',
    look: { species: 'tanghulu', palette: 1, bodyType: 'normal', scale: 0.85, ears: 0, tail: 1, top: 0, expression: 'round', patternSeed: 73, shiny: false, evoStage: 2, evoBranch: 'gourmet-rainbow', mallang: { dessertBase: 'parfait-cup' } } as MonsterLook,
  },
]

// 📐 참여 지인 수에 따른 크기(Scale) 및 지능형 다열 진형(Formation) 동적 계산 알고리즘
export function computeRaidFormation(list: RaidParticipantItem[]) {
  const n = list.length
  if (n === 0) return { items: [], petSize: 28, badgeFontSize: 7.5 }

  // 1. 인원수에 따른 펫 크기 및 뱃지 폰트 동적 스케일링
  let petSize = 28
  let badgeFontSize = 7.5
  if (n <= 3) {
    petSize = 46 // 소수 정예: 크고 든든한 존재감!
    badgeFontSize = 9.0
  } else if (n <= 6) {
    petSize = 36 // 중규모 분대: 적당하고 쾌적한 포메이션
    badgeFontSize = 8.0
  } else if (n <= 10) {
    petSize = 28 // 대규모 파티: 오밀조밀 귀여운 부대
    badgeFontSize = 7.5
  } else {
    petSize = 22 // 초대형 연합군: 다열 밀집 포메이션
    badgeFontSize = 6.8
  }

  // 2. 인원수에 따른 진형(Formation) 좌표 계산
  const items = list.map((p, idx) => {
    const delay = `${((idx * 0.35) % 2.0).toFixed(2)}s`

    if (n <= 4) {
      // 🌟 [1열 와이드 아크 진형] (1~4명): 내 펫 뒤편 좌우로 넉넉하고 시원하게 포진
      const isLeft = idx % 2 === 0
      const pairIdx = Math.floor(idx / 2) // 0, 1
      const xPercent = pairIdx === 0 ? 18 : 6
      const bottomPercent = 3 + pairIdx * 5
      return {
        ...p,
        left: isLeft ? `${xPercent}%` : undefined,
        right: !isLeft ? `${xPercent}%` : undefined,
        bottom: `${bottomPercent}%`,
        delay,
        zIndex: 21 + pairIdx,
        petSize,
        badgeFontSize,
      }
    } else if (n <= 8) {
      // 🌟 [2열 입체 진형] (5~8명): 앞열 3~4마리, 뒷열 3~4마리 지그재그 교차 배치
      const isLeft = idx % 2 === 0
      const row = Math.floor(idx / 2) % 2 // 0: 앞열(7~11%), 1: 뒷열(2~5%)
      const col = Math.floor(idx / 4) // 0: 안쪽, 1: 바깥쪽
      const xPercent = 6 + col * 14 + (row === 0 ? 6 : 0)
      const bottomPercent = row === 0 ? 7 + col * 3 : 2 + col * 2
      return {
        ...p,
        left: isLeft ? `${xPercent}%` : undefined,
        right: !isLeft ? `${xPercent}%` : undefined,
        bottom: `${bottomPercent}%`,
        delay,
        zIndex: row === 0 ? 23 : 21,
        petSize,
        badgeFontSize,
      }
    } else {
      // 🌟 [3열 연합군 파상 진형] (9명 이상): 전열/중열/후열 3단 밀집 포메이션
      const isLeft = idx % 2 === 0
      const rank = Math.floor(idx / 2)
      const row = rank % 3 // 0: 전열(10~13%), 1: 중열(6~9%), 2: 후열(2~5%)
      const col = Math.floor(rank / 3) // 0, 1, 2
      const xPercent = 4 + col * 11 + (row * 3)
      const bottomPercent = 2 + row * 4.2 + (col * 1.5)
      return {
        ...p,
        left: isLeft ? `${xPercent}%` : undefined,
        right: !isLeft ? `${xPercent}%` : undefined,
        bottom: `${bottomPercent}%`,
        delay,
        zIndex: 20 + row * 2,
        petSize,
        badgeFontSize,
      }
    }
  })

  return { items, petSize, badgeFontSize }
}


export default function AsmrBattleArena({
  challenger,
  defender,
  defenderOwnerName,
  battleMode,
  initialSeed,
  precomputed,
  raidParticipantCount: _raidParticipantCount,
  customParticipants,
  onRematch,
  onRewardClaimed,
  onBack,
}: Props) {
  const [seed, setSeed] = useState<number>(() => initialSeed ?? Math.floor(100000 + Math.random() * 899999))
  const [stepIdx, setStepIdx] = useState<number>(0)
  const [playing, setPlaying] = useState<boolean>(true)
  const [rewarded, setRewarded] = useState<boolean>(false)

  // 👑 보스 대전 vs 1:1 친선 대전 판정
  // - defender가 월드 보스이거나 battleMode가 'boss-raid'인 경우에만 보스 레이드 모드 적용
  // - 그 외 일반 지인/친구/NPC와의 대전은 무조건 1:1 친선 대전 모드로 분리
  const isBossRaidTarget = Boolean(
    battleMode === 'boss-raid' ||
    defender.id.startsWith('world-boss-') ||
    defender.name?.includes('거대 보스')
  )

  // 뷰 모드: 보스 레이드는 'raid-max', 친선 대전은 무조건 'classic' 1:1 구도로 시작
  const [battleViewMode, setBattleViewMode] = useState<'raid-max' | 'classic'>(() =>
    isBossRaidTarget ? 'raid-max' : 'classic'
  )

  // ⚡ DESSERT MAX 게이지 (0% ~ 100%) & 맥스 스트라이크 보너스 대미지
  const [maxGauge, setMaxGauge] = useState<number>(35)
  const [maxStrikeActive, setMaxStrikeActive] = useState<boolean>(false)
  const [bossBonusDamage, setBossBonusDamage] = useState<number>(0)
  const [maxStrikeFloating, setMaxStrikeFloating] = useState<boolean>(false)

  // 관전 중 실시간 터치 응원 손맛 상태
  const [cheerCount, setCheerCount] = useState<number>(0)
  const [cheerToast, setCheerToast] = useState<string | null>(null)
  const [actionPhase, setActionPhase] = useState<'idle' | 'windup' | 'strike' | 'reaction'>('idle')

  // 🔥 필살기 컷인 배너 상태 (슬로우 모션 & 극적 연출)
  const [cutin, setCutin] = useState<{
    actor: 'challenger' | 'defender'
    title: string
    name: string
    icon: string
    quote: string
  } | null>(null)

  // 🎬 대전 명장면 리플레이 짤 모달 탭 상태
  const [showHighlightModal, setShowHighlightModal] = useState<boolean>(false)
  const [copiedClipToast, setCopiedClipToast] = useState<boolean>(false)

  const sim = useMemo(() => precomputed ?? simulateAsmrBattle(challenger, defender, seed), [precomputed, challenger, defender, seed])
  const currentTurn = stepIdx > 0 ? sim.turns[stepIdx - 1] : null
  const isFinished = stepIdx >= sim.turns.length

  // ⏩ 배틀 스킵 (결과 바로보기): 전투를 즉시 완료하고 결과창으로 이동
  const handleSkipToResult = () => {
    setStepIdx(sim.turns.length)
    setPlaying(false)
    playDessertAsmr('sugar-crack', 2)
  }

  // 대전 중 가장 극적이었던 하이라이트 턴 산출
  const bestHighlight = useMemo(() => {
    if (!sim.turns || sim.turns.length === 0) return null
    let maxDmgTurn = sim.turns[0]
    for (const t of sim.turns) {
      if (t.damage > maxDmgTurn.damage || (t.isCrit && !maxDmgTurn.isCrit)) {
        maxDmgTurn = t
      }
    }
    return maxDmgTurn
  }, [sim.turns])

  const cLook = monsterLook(challenger)
  const dLook = monsterLook(defender)
  const cInfo = SPECIES_INFO[cLook.mallang?.morphForm ?? challenger.species] ?? SPECIES_INFO[challenger.species]
  const dInfo = SPECIES_INFO[dLook.mallang?.morphForm ?? defender.species] ?? SPECIES_INFO[defender.species]

    // ⚔️ 거대 보스 레이드에 참여한 지인 펫들 (테스터 봇 전면 제거: 실제 참여한 지인만 노출, 없으면 1인 솔로 참전)
  const rawParticipants = useMemo(() => {
    if (customParticipants && customParticipants.length > 0) return customParticipants
    return [] // 가짜 테스터 봇 제거: 실제 지인만 함께 전투!
  }, [customParticipants])

  const { items: raidParticipants } = useMemo(
    () => computeRaidFormation(rawParticipants),
    [rawParticipants],
  )

  const totalAllyDmg = useMemo(
    () => raidParticipants.reduce((sum, p) => sum + p.damage, 0),
    [raidParticipants],
  )

  // 📊 참전 펫 피해량 박스 펼침/접기 상태 (기본은 접힘 상태로 보스를 전혀 가리지 않음)
  const [showDamageBoard, setShowDamageBoard] = useState<boolean>(false)

  // 👑 내 펫이 현재까지 보스에게 입힌 실시간 누적 대미지
  const myTotalDamage = useMemo(() => {
    const fromTurns = sim.turns
      .slice(0, stepIdx)
      .reduce((sum, t) => (t.actor === 'challenger' ? sum + t.damage : sum), 0)
    return fromTurns + bossBonusDamage
  }, [sim.turns, stepIdx, bossBonusDamage])

  // 🏆 전체 참전 펫(지인 8마리 + 내 펫) 통합 피해량 랭킹 (내림차순 정렬)
  const damageRankings = useMemo(() => {
    const list = [
      ...raidParticipants.map((p) => ({
        id: p.id,
        isMe: false,
        name: p.ownerName,
        petName: p.petName,
        icon: p.icon,
        damage: p.damage,
      })),
      {
        id: 'my-pet',
        isMe: true,
        name: '나(내 펫)',
        petName: challenger.name || cInfo?.name || '내 디저트펫',
        icon: '👑',
        damage: myTotalDamage,
      },
    ]
    return list.sort((a, b) => b.damage - a.damage)
  }, [raidParticipants, myTotalDamage, challenger.name, cInfo?.name])

  const maxDamageInBoard = useMemo(() => {
    return Math.max(1, ...damageRankings.map((r) => r.damage))
  }, [damageRankings])

  const cHp = currentTurn ? currentTurn.challengerHp : sim.challengerMaxHp
  const rawDHp = currentTurn ? currentTurn.defenderHp : sim.defenderMaxHp
  const dHp = Math.max(0, rawDHp - bossBonusDamage)
  const cPct = Math.max(0, Math.min(100, Math.round((cHp / sim.challengerMaxHp) * 100)))
  const dPct = Math.max(0, Math.min(100, Math.round((dHp / sim.defenderMaxHp) * 100)))

  // 자동 턴제 공방 루프
  useEffect(() => {
    if (!playing || isFinished) return

    const nextTurn = sim.turns[stepIdx]
    const isSpecialTurn = nextTurn && (nextTurn.isCrit || nextTurn.damage >= 24)
    const turnInterval = isSpecialTurn ? 1650 : 1200

    // 0단계: 필살기/치명타 컷인 배너 트리거
    let tCutin: any = null
    if (isSpecialTurn) {
      const isChallenger = nextTurn.actor === 'challenger'
      const actorName = isChallenger ? challenger.name || cInfo?.name || '두바이쫀득이' : defender.name || dInfo?.name || '카다이프킹'
      setCutin({
        actor: nextTurn.actor,
        title: nextTurn.isCrit ? `🔥 [${actorName} 필살기 발동]` : `⚡ [${actorName} 극의 식감 스킬]`,
        name: nextTurn.skillName || '골든 카다이프 버스트!!',
        icon: nextTurn.skillIcon || '💥',
        quote: isChallenger
          ? `바사삭 부서지는 황금빛 크런치로 결정타를 날려요!`
          : `상대 파티시에의 달콤한 식감 반격이 시작돼요!`,
      })
      tCutin = setTimeout(() => {
        setCutin(null)
      }, 750)
    }

    // 1단계: 턴 개시 및 도약/기 모으기 모션
    const t1 = setTimeout(() => {
      setActionPhase('windup')
    }, isSpecialTurn ? 350 : 50)

    // 2단계: 타격 & ASMR 사운드 폭발 및 MAX 게이지 충전
    const t2 = setTimeout(() => {
      setActionPhase('strike')
      const nextStep = stepIdx + 1
      const turn = sim.turns[nextStep - 1]
      if (turn) {
        playDessertAsmr(turn.asmr, turn.hitCount ?? (turn.isCrit ? 4 : 1))
        // 매 턴 MAX 게이지 자동 충전 (치명타 시 보너스)
        setMaxGauge((g) => Math.min(100, g + (turn.isCrit ? 22 : 14)))
      }
    }, turnInterval * 0.42)

    // 3단계: 피격 찌그러짐 반응 & 체력 갱신
    const t3 = setTimeout(() => {
      setActionPhase('reaction')
      const nextStep = stepIdx + 1
      setStepIdx(nextStep)
      if (nextStep >= sim.turns.length && !rewarded) {
        setRewarded(true)
        const isWin = sim.winner === 'challenger' || dHp <= 0
        if (!precomputed) onRewardClaimed?.(isWin ? 35 : 15)
        addRibbonCoins(isWin ? 35 : 12, '거대 맥스 보스 대전 보상')
        recordMissionAction('d-battle', 1)
        if (isWin) recordMissionAction('w-battle-win', 1)
      }
    }, turnInterval * 0.75)

    // 4단계: 턴 복귀
    const t4 = setTimeout(() => {
      setActionPhase('idle')
    }, turnInterval)

    return () => {
      if (tCutin) clearTimeout(tCutin)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [playing, isFinished, stepIdx])

  // 플레이어 실시간 터치 응원 (유대감 및 MAX 게이지 충전)
  function handleCheer() {
    setCheerCount((c) => c + 1)
    playDessertAsmr('sugar-crack', 2)
    setMaxGauge((g) => Math.min(100, g + 12))
    const cheers = [
      '💖 파티원 전체 응원! MAX 게이지 +12% 충전!',
      '⚡ 식감 버스트 파워 업! MAX 게이지 충전!',
      '🍓 달콤한 협력 응원이 닿았어요!',
      '✨ 완벽한 타이밍 응원! 기세 폭발!',
    ]
    setCheerToast(cheers[cheerCount % cheers.length])
    setTimeout(() => setCheerToast(null), 1200)
  }

  // ⚡ 거대 디저트 MAX 스트라이크 발동 (100% 게이지 전원 협력 필살기)
  function handleTriggerMaxStrike() {
    if (maxGauge < 100 || isFinished) return

    setMaxStrikeActive(true)
    setMaxGauge(0)
    playDessertAsmr('sugar-crack', 4)

    // 보스에게 협력 보너스 대미지 폭격 (-120 HP)
    setBossBonusDamage((prev) => prev + 120)
    setMaxStrikeFloating(true)

    setTimeout(() => {
      playDessertAsmr('mochi-squish', 3)
    }, 450)

    setTimeout(() => {
      setMaxStrikeActive(false)
      setMaxStrikeFloating(false)
    }, 1400)
  }

  function handleReplaySameSeed() {
    setStepIdx(0)
    setPlaying(true)
    setBossBonusDamage(0)
    setMaxGauge(35)
  }

  function handleRematchNewSeed() {
    if (precomputed && onRematch) {
      onRematch()
      return
    }
    setSeed(Math.floor(100000 + Math.random() * 899999))
    setStepIdx(0)
    setPlaying(true)
    setBossBonusDamage(0)
    setMaxGauge(35)
  }

  // 애니메이션 계산
  const actTurn = actionPhase === 'reaction' ? currentTurn : (sim.turns[stepIdx] ?? null)
  const isChallengerActor = actTurn?.actor === 'challenger'
  const isDefenderActor = actTurn?.actor === 'defender'
  const isCrit = actTurn?.isCrit
  const isMultiHit = (actTurn?.hitCount ?? 0) >= 2
  const dir = isChallengerActor ? 1 : -1

  const REST: Pose = { transform: 'translateX(0) translateY(0) scale(1)', ms: 420, ease: 'cubic-bezier(0.2, 1.6, 0.4, 1)' }
  let cPose: Pose = REST
  let dPose: Pose = REST
  const DASH = 'cubic-bezier(0.1, 0.9, 0.2, 1)'

  const attackerPose = (): Pose => {
    if (actionPhase === 'windup') {
      return { transform: `translateX(${-18 * dir}px) translateY(8px) scale(0.9, 0.95) rotate(${-6 * dir}deg)`, ms: 240, ease: 'ease-out' }
    }
    if (isCrit) {
      return { transform: `translateY(-36px) translateX(${64 * dir}px) scale(1.35) rotate(${14 * dir}deg)`, ms: 150, ease: DASH }
    }
    if (isMultiHit) {
      return { transform: `translateX(${58 * dir}px) scale(1.22) rotate(${360 * dir}deg)`, ms: 190, ease: DASH }
    }
    return { transform: `translateX(${52 * dir}px) scale(1.18, 1.08)`, ms: 130, ease: DASH }
  }

  const victimPose = (): Pose => {
    if (actTurn?.isDodge) return { transform: `translateY(-38px) translateX(${-14 * dir}px) scale(1.1) rotate(${10 * dir}deg)`, ms: 200, ease: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)' }
    if (actTurn?.isBlock) return { transform: `translateX(${10 * dir}px) scale(0.88, 1.14)`, ms: 110, ease: 'ease-out' }
    if (isCrit) return { transform: `translateX(${44 * dir}px) translateY(-10px) scale(1.28, 0.75) rotate(${22 * dir}deg)`, ms: 100, ease: DASH }
    return { transform: `translateX(${28 * dir}px) scale(1.1, 0.88) rotate(${8 * dir}deg)`, ms: 100, ease: DASH }
  }

  if (actionPhase === 'windup' || actionPhase === 'strike') {
    if (isChallengerActor) cPose = attackerPose()
    if (isDefenderActor) dPose = attackerPose()
  } else if (actionPhase === 'reaction') {
    const holdPose: Pose = { transform: `translateX(${24 * dir}px) scale(1.08)`, ms: 160, ease: 'ease-out' }
    if (isChallengerActor) {
      cPose = holdPose
      dPose = victimPose()
    }
    if (isDefenderActor) {
      dPose = holdPose
      cPose = victimPose()
    }
  }

  const isHitMoment =
    actionPhase === 'reaction' && !!actTurn && !actTurn.isDodge && !actTurn.isBlock && (actTurn.damage ?? 0) > 0
  const fxTint = (() => {
    const cat = actTurn ? getSensoryReactionClass(actTurn.asmr ?? 'sugar-crack') : ''
    if (cat === 'mon-react-crispy') return '#FFB300'
    if (cat === 'mon-react-jiggly') return '#FFD54F'
    if (cat === 'mon-react-melty') return '#A1887F'
    return '#F48FB1'
  })()

  const cHitReaction =
    isHitMoment && isDefenderActor
      ? getSensoryReactionClass(currentTurn?.asmr ?? 'sugar-crack')
      : ''
  const dHitReaction =
    isHitMoment && isChallengerActor
      ? getSensoryReactionClass(currentTurn?.asmr ?? 'sugar-crack')
      : ''

  // 플로팅 전투 텍스트
  const challengerFloating = useMemo(() => {
    if (!currentTurn) return null
    if (currentTurn.actor === 'defender') {
      if (currentTurn.isDodge) return { type: 'dodge', text: '💨 MISS!', sub: '회피 성공' }
      if (currentTurn.isBlock) return { type: 'block', text: `🛡️ GUARD! -${currentTurn.damage}`, sub: '가드 방어' }
      if (currentTurn.isCrit) return { type: 'crit', text: `💥 -${currentTurn.damage}`, sub: '치명타 (CRITICAL)!' }
      if (currentTurn.damage > 0) return { type: 'dmg', text: `-${currentTurn.damage}` }
    }
    if (currentTurn.actor === 'challenger') {
      if (currentTurn.heal > 0) return { type: 'heal', text: `+${currentTurn.heal} 💖`, sub: '체력 회복' }
      if (currentTurn.shield > 0) return { type: 'shield', text: `+${currentTurn.shield} 🛡️`, sub: '보호막 생성' }
      return { type: 'skill', text: `${currentTurn.skillIcon} ${currentTurn.skillName}` }
    }
    return null
  }, [currentTurn, stepIdx])

  const defenderFloating = useMemo(() => {
    if (maxStrikeFloating) {
      return { type: 'crit', text: '💥 MAX STRIKE! -120', sub: '⚡ 거대 디저트 맥스 결정타!' }
    }
    if (!currentTurn) return null
    if (currentTurn.actor === 'challenger') {
      if (currentTurn.isDodge) return { type: 'dodge', text: '💨 MISS!', sub: '회피 성공' }
      if (currentTurn.isBlock) return { type: 'block', text: `🛡️ GUARD! -${currentTurn.damage}`, sub: '가드 방어' }
      if (currentTurn.isCrit) return { type: 'crit', text: `💥 -${currentTurn.damage}`, sub: '치명타 (CRITICAL)!' }
      if (currentTurn.damage > 0) return { type: 'dmg', text: `-${currentTurn.damage}` }
    }
    if (currentTurn.actor === 'defender') {
      if (currentTurn.heal > 0) return { type: 'heal', text: `+${currentTurn.heal} 💖`, sub: '체력 회복' }
      if (currentTurn.shield > 0) return { type: 'shield', text: `+${currentTurn.shield} 🛡️`, sub: '보호막 생성' }
      return { type: 'skill', text: `${currentTurn.skillIcon} ${currentTurn.skillName}` }
    }
    return null
  }, [currentTurn, stepIdx, maxStrikeFloating])

  const isRaid = isBossRaidTarget && battleViewMode === 'raid-max'
  const phaseCopy = actionPhase === 'windup'
    ? '기 모으는 중'
    : actionPhase === 'strike'
      ? '식감 스킬 발사!'
      : actionPhase === 'reaction'
        ? '명중! 여운이 퍼져요'
        : isFinished
          ? '리플레이 완주'
          : '다음 식감을 기다려요'
  const equippedLabel = (look: MonsterLook) => {
    const id = look.decorations?.effect ?? look.decorations?.head ?? look.decorations?.back
    const item = id ? DECO_ITEMS.find((candidate) => candidate.id === id) : undefined
    return item ? `${item.icon} ${item.name}` : '🍰 시그니처 플레이팅'
  }
  const challengerStyle = equippedLabel(cLook)
  const defenderStyle = equippedLabel(dLook)

  return (
    <main
      className="screen"
      style={{
        padding: '6px 10px calc(6px + env(safe-area-inset-bottom, 0px))',
        gap: 5,
        background: isRaid ? 'linear-gradient(180deg, #160826 0%, #25103A 40%, #150921 100%)' : '#FAF6EE',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: isRaid ? '#FFF8F0' : '#3E2723',
      }}
    >
      <style>{`
        @keyframes floatCombatNum {
          0% { opacity: 0; transform: translateY(14px) scale(0.75); }
          18% { opacity: 1; transform: translateY(-8px) scale(1.15); }
          75% { opacity: 0.95; transform: translateY(-26px) scale(1); }
          100% { opacity: 0; transform: translateY(-48px) scale(0.9); }
        }
        @keyframes dynamaxCloudSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.06); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes dynamaxAuraPulse {
          0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 15px rgba(233, 30, 99, 0.7)); }
          50% { opacity: 1; filter: drop-shadow(0 0 32px rgba(255, 64, 129, 1)); }
        }
        @keyframes partyCheerBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-7px) scale(1.05); }
        }
        @keyframes raidParticipantStance {
          0%, 100% { transform: translateY(0) scale(1); filter: brightness(1); }
          50% { transform: translateY(-3px) scale(1.02); filter: brightness(1.08) drop-shadow(0 0 6px rgba(255, 64, 129, 0.4)); }
        }
        @keyframes maxGaugeGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(255, 64, 129, 0.6), inset 0 0 6px #FF80AB; }
          50% { box-shadow: 0 0 22px rgba(255, 215, 0, 0.9), inset 0 0 10px #FFD700; }
        }
        @keyframes maxStrikeVignette {
          0% { opacity: 0; transform: scale(1.2); }
          30% { opacity: 0.85; transform: scale(1); }
          70% { opacity: 0.85; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
        @keyframes cutinBanner {
          0% { opacity: 0; transform: scale(0.85) skewX(-8deg) translateY(-20px); }
          20% { opacity: 1; transform: scale(1.04) skewX(-8deg) translateY(0); }
          80% { opacity: 1; transform: scale(1) skewX(-8deg) translateY(0); }
          100% { opacity: 0; transform: scale(1.08) skewX(-8deg) translateY(15px); }
        }
        @keyframes stageShake { 0%,100% { transform: translate(0,0); } 15% { transform: translate(-7px, 4px); } 30% { transform: translate(6px, -5px); } 45% { transform: translate(-5px, -3px); } 60% { transform: translate(4px, 3px); } 80% { transform: translate(-2px, 1px); } }
        @keyframes stageShakeSoft { 0%,100% { transform: translate(0,0); } 25% { transform: translate(-3px, 2px); } 50% { transform: translate(3px, -2px); } 75% { transform: translate(-1px, 1px); } }
      `}</style>

      {/* 1. 상단 네비게이션 & 모드 토글 헤더 */}
      <div className="row between" style={{ flexShrink: 0, alignItems: 'center' }}>
        <button
          className="btn-round"
          onClick={onBack}
          aria-label="뒤로"
          style={{
            width: 32,
            height: 32,
            background: isRaid ? 'rgba(255,255,255,0.15)' : '#FFF',
            color: isRaid ? '#FFF' : '#3E2723',
            border: isRaid ? '1px solid rgba(255,255,255,0.2)' : '1px solid #E0E0E0',
          }}
        >
          <BackIcon size={16} />
        </button>

        {/* 보스 대전 vs 1:1 친선 대전 상단 헤더 구분 */}
        {isBossRaidTarget ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: 999,
              padding: '2px',
              border: '1.5px solid #FF4081',
            }}
          >
            <button
              onClick={() => setBattleViewMode('raid-max')}
              style={{
                padding: '3px 8px',
                borderRadius: 999,
                border: 'none',
                background: isRaid ? 'linear-gradient(90deg, #E91E63, #FF4081)' : 'transparent',
                color: isRaid ? '#FFFFFF' : '#8D6E63',
                fontSize: 10,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              👑 거대 맥스 로우앵글
            </button>
            <button
              onClick={() => setBattleViewMode('classic')}
              style={{
                padding: '3px 8px',
                borderRadius: 999,
                border: 'none',
                background: !isRaid ? '#5D4037' : 'transparent',
                color: !isRaid ? '#FFFFFF' : '#B39DDB',
                fontSize: 10,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              ⚔️ 1:1 클래식
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#FFFDF9',
              borderRadius: 999,
              padding: '3px 12px',
              border: '1.5px solid #FFB74D',
              boxShadow: '0 2px 6px rgba(255, 183, 77, 0.25)',
            }}
          >
            <span style={{ fontSize: 13 }}>🤝</span>
            <span style={{ fontSize: 11.5, fontWeight: 900, color: '#D84315' }}>
              1:1 친선 대전 ({defenderOwnerName})
            </span>
          </div>
        )}

        {/* 우측: ⏩ 배틀 스킵 (결과 바로보기) 또는 모드 뱃지 */}
        {!isFinished ? (
          <button
            onClick={handleSkipToResult}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, #FF7043 0%, #D84315 100%)',
              color: '#FFFFFF',
              fontSize: 10.5,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              boxShadow: '0 2px 6px rgba(216,67,21,0.35)',
              touchAction: 'manipulation',
            }}
          >
            <span>⏩</span>
            <span>스킵</span>
          </button>
        ) : (
          <span
            className="chip"
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              padding: '2px 6px',
              background: isRaid ? 'rgba(255,255,255,0.1)' : '#FFF8E1',
              color: isRaid ? '#FFE082' : '#795548',
            }}
          >
            {isBossRaidTarget ? '🐉 보스 레이드' : `#${seed}`}
          </span>
        )}
      </div>

      {/* 2. 상단 HUD: 참전 연합 vs 거대 보스 체력 상태바 (비율 확대 & 선명한 터치감) */}
      <div
        style={{
          width: '100%',
          background: isRaid ? 'rgba(25, 12, 38, 0.88)' : '#FFFDF9',
          borderRadius: 16,
          border: isRaid ? '1.5px solid #AB47BC' : '1.5px solid #F0DFB8',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 3px 10px rgba(0,0,0,0.22)',
          backdropFilter: 'blur(6px)',
          flexShrink: 0,
        }}
      >
        {/* 왼쪽: 내 레이드 파티 대표 체력 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div className="row between" style={{ fontSize: 11.5, fontWeight: 900 }}>
            <span style={{ color: isRaid ? '#FFF8E1' : '#3B2F2F', display: 'flex', alignItems: 'center', gap: 4, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <ElementIcon element={challenger.element} size={13} />
              {challenger.name || cInfo?.name}
            </span>
            <span style={{ color: isRaid ? '#FFD54F' : '#D84315', fontSize: 10 }}>
              {isRaid
                ? raidParticipants.length > 0
                  ? `참전 지인 연합 (${raidParticipants.length}인 · 누적 -${totalAllyDmg})`
                  : `지인 솔로 레이드 (나 홀로 참전)`
                : `나 · Lv.${challenger.level}`}
            </span>
          </div>
          <div style={{ height: 9, borderRadius: 999, background: isRaid ? 'rgba(255,255,255,0.15)' : '#F5E8C9', overflow: 'hidden' }}>
            <div
              style={{
                width: `${cPct}%`,
                height: '100%',
                borderRadius: 999,
                background: cPct > 30 ? 'linear-gradient(90deg, #66BB6A, #43A047)' : '#E53935',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: isRaid ? '#CE93D8' : '#7A6A60', textAlign: 'right' }}>
            {cHp}/{sim.challengerMaxHp}
          </div>
        </div>

        {/* 중앙: VS / 맥스 레이드 엠블럼 */}
        <div
          style={{
            padding: '3px 8px',
            borderRadius: 999,
            background: isRaid ? 'linear-gradient(135deg, #FF1744, #D50000)' : 'linear-gradient(135deg, #FF7043, #D84315)',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: '0.5px',
            boxShadow: '0 2px 6px rgba(213,0,0,0.4)',
            flexShrink: 0,
          }}
        >
          {isRaid ? 'MAX RAID' : 'VS'}
        </div>

        {/* 오른쪽: 거대 맥스 보스 체력 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div className="row between" style={{ fontSize: 11.5, fontWeight: 900 }}>
            <span style={{ color: isRaid ? '#FF80AB' : '#E65100', fontSize: 10 }}>
              {isRaid ? `👑 거대 보스 · x7` : `Lv.${defender.level} · ${defenderOwnerName}`}
            </span>
            <span style={{ color: isRaid ? '#FFF8E1' : '#3B2F2F', display: 'flex', alignItems: 'center', gap: 4, maxWidth: 95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {defender.name || dInfo?.name}
              <ElementIcon element={defender.element} size={13} />
            </span>
          </div>
          <div style={{ height: 9, borderRadius: 999, background: isRaid ? 'rgba(255,255,255,0.15)' : '#F5E8C9', overflow: 'hidden' }}>
            <div
              style={{
                width: `${dPct}%`,
                height: '100%',
                borderRadius: 999,
                background: dPct > 30 ? 'linear-gradient(90deg, #E91E63, #C2185B)' : '#E53935',
                transition: 'width 0.3s ease',
                marginLeft: 'auto',
              }}
            />
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: isRaid ? '#FF80AB' : '#7A6A60', textAlign: 'left' }}>
            {dHp}/{sim.defenderMaxHp}
          </div>
        </div>
      </div>

      {/* 3. 🎮 3D 원근 로우앵글 배틀 스테이지 (포켓몬고 2·3번 씬) */}
      <div
        className={`card battle-stage ${isRaid ? 'raid-stage' : 'classic-stage'}`}
        style={{
          animation: isHitMoment ? (isCrit ? 'stageShake 0.42s ease-out' : 'stageShakeSoft 0.26s ease-out') : undefined,
          background: isRaid
            ? 'radial-gradient(ellipse at 50% 25%, #2B0E44 0%, #170726 50%, #0D0317 100%)'
            : 'radial-gradient(ellipse at 50% 60%, #FFF9EC 0%, #FFF3E0 60%, #FFE0B2 100%)',
          padding: '6px 8px',
          position: 'relative',
          overflow: 'hidden',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          border: isRaid ? '1.5px solid #BA68C8' : '1.5px solid #FFE082',
          borderRadius: 16,
          boxShadow: isRaid ? '0 8px 30px rgba(0,0,0,0.6), inset 0 0 35px rgba(171,71,188,0.2)' : 'none',
        }}
      >
        {/* 파티세리 무대의 깊이: 관중석·스프링클·쿠키 타일. 게임 판정에는 전혀 관여하지 않는다. */}
        <div className="arena-skyline" aria-hidden="true" />
        <div className="arena-sprinkles" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div>
        <div className="arena-spotlight" aria-hidden="true" />
        <div className="arena-floor" aria-hidden="true" />
        <div className="arena-rim" aria-hidden="true" />
        <div className="battle-phase-chip" aria-live="polite">
          <span>{actionPhase === 'strike' ? '⚡' : actionPhase === 'reaction' ? '💥' : '🍬'}</span>
          <strong>{phaseCopy}</strong>
          {actTurn?.skillName && <span>· {actTurn.skillName}</span>}
        </div>
        <BattleFx
          stepKey={stepIdx}
          phase={actionPhase}
          actor={actTurn?.actor}
          isCrit={!!isCrit}
          isDodge={!!actTurn?.isDodge}
          isBlock={!!actTurn?.isBlock}
          damage={actTurn?.damage ?? 0}
          multiHit={isMultiHit}
          tint={fxTint}
        />

        {/* ⚡ MAX 스트라이크 발동 시 다이맥스 번개 뇌우 비네트 연출 */}
        {maxStrikeActive && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 45,
              background: 'radial-gradient(ellipse at center, rgba(233,30,99,0.3) 0%, rgba(136,14,79,0.95) 100%)',
              animation: 'maxStrikeVignette 1.4s ease forwards',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(90deg, #FF1744 0%, #FFD700 50%, #FF1744 100%)',
                padding: '10px 20px',
                borderRadius: 18,
                border: '3px solid #FFFFFF',
                boxShadow: '0 0 40px #FFD700, 0 8px 32px #000',
                textAlign: 'center',
                animation: 'cutinBanner 1.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, color: '#21081A', letterSpacing: '0.5px' }}>
                ⚡ DESSERT MAX STRIKE ⚡
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', textShadow: '0 2px 10px #000' }}>
                💥 거대 디저트 맥스 스트라이크!! 💥
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#FFF8E1', textShadow: '0 1px 4px #000' }}>
                참전 전원 협력 ASMR 식감 총공격! -120 HP 초토화!
              </div>
            </div>
          </div>
        )}

        {/* 컷인 배너 연출 (보스전에서는 보스 스킬은 상단, 내 펫 스킬은 하단으로 명확히 분리하여 겹침 원천 차단) */}
        {cutin && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 35,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: isRaid
                ? cutin.actor === 'defender'
                  ? 'flex-start'
                  : 'flex-end'
                : 'center',
              paddingTop: isRaid && cutin.actor === 'defender' ? '12%' : undefined,
              paddingBottom: isRaid && cutin.actor === 'challenger' ? '24%' : undefined,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'relative',
                zIndex: 40,
                width: '92%',
                maxWidth: 400,
                boxSizing: 'border-box',
                background:
                  cutin.actor === 'challenger'
                    ? 'linear-gradient(90deg, #D84315 0%, #FF6F00 50%, #FFB300 100%)'
                    : 'linear-gradient(90deg, #6A1B9A 0%, #AD1457 50%, #E91E63 100%)',
                padding: '8px 12px',
                borderRadius: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                textAlign: 'center',
                animation: 'cutinBanner 0.75s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
                border: '2px solid #FFF',
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 900, color: '#FFEB3B' }}>{cutin.title}</div>
              <div style={{ fontSize: 15.5, fontWeight: 900, color: '#FFFFFF', margin: '2px 0' }}>
                {cutin.icon} {cutin.name}
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#FFF8E1', wordBreak: 'keep-all', lineHeight: 1.3 }}>
                "{cutin.quote}"
              </div>
            </div>
          </div>
        )}

        {/* ASMR 파편 & 의성어 버스트 이펙트 */}
        {currentTurn && (
          <SensoryBurst
            kind={currentTurn.asmr}
            triggerKey={stepIdx}
            bubble={`${currentTurn.skillIcon} ${currentTurn.onomatopoeia}`}
            combo={currentTurn.hitCount ?? (currentTurn.isCrit ? 3 : 1)}
          />
        )}

        {/* 🌟 3D 원근 로우앵글 배틀 필드 */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* 📊 [좌측 상단 모서리 플로팅] 참전 펫 누적 피해량 박스 (Damage Board - 보스를 절대 가리지 않는 안전 배치) */}
          {isRaid && (
            <div
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                zIndex: 32,
                pointerEvents: 'auto',
                maxWidth: showDamageBoard ? 165 : 'auto',
              }}
            >
              {showDamageBoard ? (
                <div
                  style={{
                    background: 'rgba(15, 8, 28, 0.92)',
                    border: '1.5px solid #FF80AB',
                    borderRadius: 14,
                    padding: '6px 8px',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.6), inset 0 0 10px rgba(255, 64, 129, 0.25)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFF8E1',
                    fontSize: 10,
                  }}
                >
                  {/* 박스 헤더 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid rgba(255, 128, 171, 0.3)',
                      paddingBottom: 4,
                      marginBottom: 4,
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 900, color: '#FF80AB', fontSize: 10 }}>
                      <span>⚔️ 참전 펫 피해량</span>
                      <span style={{ fontSize: 8.5, color: '#FFD54F' }}>({damageRankings.length}마리)</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDamageBoard(false)
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.12)',
                        border: 'none',
                        color: '#FFF',
                        borderRadius: 6,
                        padding: '1px 4px',
                        fontSize: 9,
                        cursor: 'pointer',
                        fontWeight: 900,
                      }}
                      title="접기"
                    >
                      ▲
                    </button>
                  </div>

                  {/* 총합 대미지 요약 */}
                  <div style={{ fontSize: 8.5, color: '#FFE082', fontWeight: 800, marginBottom: 5 }}>
                    총 누적 합산: <span style={{ color: '#FF5252', fontWeight: 900 }}>{(totalAllyDmg + myTotalDamage).toLocaleString()}</span> DMG
                  </div>

                  {/* 참전 펫 랭킹 스크롤 리스트 */}
                  <div
                    style={{
                      maxHeight: 130,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3.5,
                      paddingRight: 2,
                    }}
                  >
                    {damageRankings.map((item, idx) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`
                      const dmgPercent = Math.min(100, Math.round((item.damage / maxDamageInBoard) * 100))
                      return (
                        <div
                          key={item.id}
                          style={{
                            background: item.isMe ? 'rgba(255, 215, 0, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                            border: item.isMe ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 6,
                            padding: '2.5px 5px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 8.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: item.isMe ? 900 : 700 }}>
                              <span style={{ fontSize: 9 }}>{medal}</span>
                              <span style={{ color: item.isMe ? '#FFD700' : '#FFF' }}>
                                {item.icon} {item.name}
                              </span>
                            </div>
                            <span style={{ fontWeight: 900, color: item.isMe ? '#FFD54F' : '#FF80AB', fontSize: 8.5 }}>
                              -{item.damage}
                            </span>
                          </div>
                          {/* 미니 게이지 바 */}
                          <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${dmgPercent}%`,
                                height: '100%',
                                background: item.isMe
                                  ? 'linear-gradient(90deg, #FFD54F, #FF6F00)'
                                  : 'linear-gradient(90deg, #FF4081, #E91E63)',
                                borderRadius: 2,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                /* 접힌 상태 미니 배너 */
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDamageBoard(true)
                  }}
                  style={{
                    background: 'rgba(15, 8, 28, 0.92)',
                    border: '1.2px solid #FF80AB',
                    color: '#FFF8E1',
                    borderRadius: 999,
                    padding: '4px 8px',
                    fontSize: 8.5,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  <span>⚔️ 피해량 보드</span>
                  <span style={{ color: '#FFD54F' }}>({damageRankings.length})</span>
                  <span>▼</span>
                </button>
              )}
            </div>
          )}
          {/* 바닥 원근감 그리드 라인 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '80%',
              perspective: '650px',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                transform: 'rotateX(58deg)',
                background: isRaid
                  ? 'radial-gradient(ellipse at 50% 50%, rgba(233, 30, 99, 0.22) 0%, rgba(156, 39, 176, 0.08) 60%, transparent 100%)'
                  : 'radial-gradient(ellipse at 50% 50%, rgba(255, 183, 77, 0.25) 0%, transparent 80%)',
                border: isRaid ? '1.5px solid rgba(233, 30, 99, 0.35)' : '1px solid rgba(255, 167, 38, 0.3)',
                borderRadius: '50%',
              }}
            />
          </div>

          {/* 👑 [상단 중앙] 거대 맥스 보스 디저트 (로우앵글로 올려다보는 압도적 위용) */}
          <div
            style={{
              position: 'absolute',
              top: isRaid ? '6%' : '12%',
              left: isRaid ? '50%' : 'auto',
              right: isRaid ? 'auto' : '18%',
              transform: isRaid ? 'translateX(-50%)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            {/* 붉은/보라색 3단 다이맥스 구름 링(Dynamax Clouds) */}
            {isRaid && (
              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  width: 175,
                  height: 48,
                  zIndex: 2,
                  pointerEvents: 'none',
                }}
              >
                {/* 3단 회전 구름 오버레이 */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '3px dashed #FF4081',
                    animation: 'dynamaxCloudSpin 10s linear infinite',
                    boxShadow: '0 0 20px #FF1744, inset 0 0 14px #E91E63',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 4,
                    borderRadius: '50%',
                    border: '2px dotted #FFD54F',
                    animation: 'dynamaxCloudSpin 6s linear infinite reverse',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #D50000, #C2185B)',
                    color: '#FFE082',
                    fontSize: 8.5,
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                  }}
                >
                  ⚡ 거대 맥스 보스 ⚡
                </div>
              </div>
            )}

            {/* 보스 발판 */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                width: isRaid ? 170 : 120,
                height: isRaid ? 48 : 40,
                borderRadius: '50%',
                background: isRaid
                  ? 'radial-gradient(ellipse, rgba(233, 30, 99, 0.6) 0%, rgba(136, 14, 79, 0.2) 65%, transparent 100%)'
                  : 'radial-gradient(ellipse, rgba(144, 202, 249, 0.45) 0%, transparent 100%)',
                border: isRaid ? '2px solid #FF4081' : '1.5px solid rgba(66, 165, 245, 0.45)',
                transform: 'rotateX(55deg)',
                pointerEvents: 'none',
                zIndex: 3,
                animation: isRaid ? 'dynamaxAuraPulse 2.4s ease-in-out infinite' : undefined,
              }}
            />

            {/* 상대 보스 플로팅 전투 텍스트 */}
            {defenderFloating && (
              <div
                key={`d-float-${stepIdx}-${bossBonusDamage}`}
                style={{
                  position: 'absolute',
                  top: '-32%',
                  zIndex: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: 'floatCombatNum 1.25s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
                  pointerEvents: 'none',
                }}
              >
                {defenderFloating.sub && (
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: 900,
                      color: '#FFFFFF',
                      background:
                        defenderFloating.type === 'crit'
                          ? '#D81B60'
                          : defenderFloating.type === 'dodge'
                            ? '#1E88E5'
                            : defenderFloating.type === 'block'
                              ? '#FB8C00'
                              : '#43A047',
                      padding: '2px 8px',
                      borderRadius: 999,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      marginBottom: 2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {defenderFloating.sub}
                  </div>
                )}
                <div
                  style={{
                    fontSize:
                      defenderFloating.type === 'crit'
                        ? 26
                        : defenderFloating.type === 'skill'
                          ? 13
                          : 22,
                    fontWeight: 900,
                    color:
                      defenderFloating.type === 'crit'
                        ? '#FF1744'
                        : defenderFloating.type === 'heal'
                          ? '#00E676'
                          : defenderFloating.type === 'dodge'
                            ? '#29B6F6'
                            : '#FF5252',
                    textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 6px #FFFFFF',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {defenderFloating.text}
                </div>
              </div>
            )}

            {/* 거대 맥스 보스 3D 뷰 (보스 레이드 전용 전용 마그마 초코 퐁듀 슈가 드래곤 3D 모델) */}
            <div style={{ transform: isRaid ? 'scale(1.15)' : 'none', filter: isRaid ? 'drop-shadow(0 10px 24px rgba(233,30,99,0.5))' : undefined }}>
              {isRaid ? (
                <WorldBoss3DView
                  size={155}
                  pose={dPose}
                  hitKey={stepIdx}
                  flash={isHitMoment && isChallengerActor}
                />
              ) : (
                <BattleFighter
                  look={dLook}
                  size={105}
                  title={defender.name ?? dInfo?.name}
                  pose={dPose}
                  hitClass={dHitReaction || undefined}
                  hitKey={stepIdx}
                  flash={isHitMoment && isChallengerActor}
                  trail={actionPhase === 'strike' && isDefenderActor}
                  active={isDefenderActor && (actionPhase === 'windup' || actionPhase === 'strike')}
                  glow={isDefenderActor ? fxTint : 'rgba(186, 104, 200, 0.44)'}
                />
              )}
            </div>
          </div>

          {/* 🛡️ [하단 전면] 거대 보스 앞 옹기종기 모인 지인 참여자 펫들 + 전면 단독 돌격 공격하는 내 펫 */}
          {isRaid ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 20,
              }}
            >
              {/* 1. 먼저 참전하여 공격을 마친 지인 펫들: 참여 인원 수에 따라 크기와 배치(1열~3열)가 동적으로 최적화됨 */}
              {raidParticipants.map((participant) => (
                <div
                  key={participant.id}
                  style={{
                    position: 'absolute',
                    left: participant.left,
                    right: participant.right,
                    bottom: participant.bottom,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: 'raidParticipantStance 3.2s ease-in-out infinite',
                    animationDelay: participant.delay,
                    zIndex: participant.zIndex,
                    transition: 'all 0.4s ease',
                  }}
                >
                  {/* 지인 펫 머리 위 이름 뱃지 (대표님 6번 요청: 이모티콘 제외, 오직 깔끔한 이름만) */}
                  <div
                    style={{
                      background: 'rgba(15, 8, 26, 0.90)',
                      border: '1px solid #FF80AB',
                      color: '#FFF8E1',
                      fontSize: participant.badgeFontSize,
                      fontWeight: 900,
                      padding: participant.badgeFontSize >= 8.5 ? '2px 6px' : '1px 4px',
                      borderRadius: 999,
                      marginBottom: 1,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span>{participant.ownerName}</span>
                  </div>
                  {/* 동적 크기(Scale) 적용: 소수 정예는 큼직하게(46px), 중규모는 36px, 대규모 군단은 앙증맞게(22~28px) */}
                  <MonsterView look={participant.look} size={participant.petSize} prefer2D={true} />
                </div>
              ))}

              {/* 2. [전면 중앙 돌격 리더] 👑 공격하는 나(내 펫) - 전방으로 돌격하여 거대보스를 홀로 정면 타격! (참여자들 앞선 위치) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '22%',
                  left: '50%',
                  transform: cHp <= 0
                    ? 'translateX(-50%) rotate(-85deg) translateY(14px)'
                    : 'translateX(-50%) translateY(-6px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 26,
                  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  filter: cHp <= 0 ? 'grayscale(0.7) opacity(0.85)' : undefined,
                }}
              >
                {/* 내 캐릭터 플로팅 전투 텍스트 */}
                {challengerFloating && (
                  <div
                    key={`c-float-${stepIdx}`}
                    style={{
                      position: 'absolute',
                      top: '-42%',
                      zIndex: 35,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      animation: 'floatCombatNum 1.25s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
                    }}
                  >
                    {challengerFloating.sub && (
                      <div
                        style={{
                          fontSize: 9.5,
                          fontWeight: 900,
                          color: '#FFFFFF',
                          background:
                            challengerFloating.type === 'crit'
                              ? '#D81B60'
                              : challengerFloating.type === 'dodge'
                                ? '#1E88E5'
                                : '#43A047',
                          padding: '2px 8px',
                          borderRadius: 999,
                          marginBottom: 2,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {challengerFloating.sub}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: challengerFloating.type === 'crit' ? 24 : 20,
                        fontWeight: 900,
                        color: challengerFloating.type === 'heal' ? '#00E676' : '#FF5252',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 6px #FFFFFF',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {challengerFloating.text}
                    </div>
                  </div>
                )}

                {/* 내 펫 상태 머리말: 공격 중 vs 탈진 */}
                <div
                  style={{
                    background: cHp <= 0
                      ? 'linear-gradient(90deg, #546E7A, #37474F)'
                      : 'linear-gradient(90deg, #FF1744, #FF9100)',
                    color: '#FFFFFF',
                    fontSize: 8.5,
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: 999,
                    marginBottom: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    whiteSpace: 'nowrap',
                    border: '1px solid #FFFFFF',
                  }}
                >
                  {cHp <= 0 ? '탈진 (기여 완료)' : (challenger.name || cInfo?.name)}
                </div>

                {/* 전면 돌격 파이터 (크기 72px) */}
                <BattleFighter
                  look={cLook}
                  size={72}
                  title={challenger.name ?? cInfo?.name}
                  pose={cHp <= 0 ? { transform: 'scale(0.85)', ms: 300, ease: 'ease' } : cPose}
                  hitClass={cHitReaction || undefined}
                  hitKey={stepIdx}
                  flash={isHitMoment && isDefenderActor}
                  trail={actionPhase === 'strike' && isChallengerActor}
                  active={isChallengerActor && (actionPhase === 'windup' || actionPhase === 'strike')}
                  glow={isChallengerActor ? fxTint : 'rgba(255, 183, 77, 0.42)'}
                />
              </div>
            </div>
          ) : (
            /* 클래식 1:1 전면 좌하단 배치 */
            <div
              style={{
                position: 'absolute',
                bottom: '15%',
                left: '16%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 15,
              }}
            >
              <BattleFighter
                look={cLook}
                size={130}
                title={challenger.name ?? cInfo?.name}
                pose={cPose}
                hitClass={cHitReaction || undefined}
                hitKey={stepIdx}
                flash={isHitMoment && isDefenderActor}
                trail={actionPhase === 'strike' && isChallengerActor}
                active={isChallengerActor && (actionPhase === 'windup' || actionPhase === 'strike')}
                glow={isChallengerActor ? fxTint : 'rgba(255, 183, 77, 0.42)'}
              />
            </div>
          )}
          <div className="battle-style-tags" aria-label="전투 꾸밈 정보">
            <span className="battle-style-tag">{challengerStyle}</span>
            <span className="battle-style-tag">{defenderStyle}</span>
          </div>
        </div>

        {/* 1줄 미니멀 실시간 ASMR 사운드 뱃지 (보스전에서는 옹기종기 파티 위쪽에 배치) */}
        <div
          style={{
            position: 'absolute',
            bottom: isRaid ? 148 : 4,
            left: '50%',
            transform: 'translateX(-50%)',
            background: isRaid ? 'rgba(25, 12, 38, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            border: isRaid ? '1px solid #BA68C8' : '1px solid #FFE082',
            borderRadius: 999,
            padding: '2px 9px',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 9.5,
            fontWeight: 800,
            color: isRaid ? '#FFE082' : '#795548',
            maxWidth: '92%',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap',
            zIndex: 25,
          }}
        >
          {isFinished ? (
            <span style={{ color: sim.winner === 'challenger' || dHp <= 0 ? '#4CAF50' : '#FF4081' }}>
              {sim.winner === 'challenger' || dHp <= 0
                ? isBossRaidTarget ? '🏆 거대 맥스 레이드 격파 승리!' : '🎉 1:1 친선 대전 승리!'
                : isBossRaidTarget ? '👏 멋진 맥스 레이드 승부!' : '👏 지인과의 달콤한 친선 승부!'}
            </span>
          ) : currentTurn ? (
            <span>
              턴 {currentTurn.turn}/{sim.turns.length} · 🔊 {currentTurn.onomatopoeia}
            </span>
          ) : (
            <span>{isBossRaidTarget ? '🍮 거대 맥스 보스 식감 대치 중!' : '🍮 1:1 친선 대전 식감 대치 중!'}</span>
          )}
        </div>
      </div>

      {/* 4. ⚡ DESSERT MAX 게이지 바 (보스전) / 식감 피버 게이지 바 (친선전) - 비율 확대 */}
      <div
        style={{
          width: '100%',
          background: isRaid ? 'rgba(30, 15, 45, 0.92)' : '#FFFDF9',
          border: isRaid ? '1.5px solid #FF4081' : '1.5px solid #F0DFB8',
          borderRadius: 14,
          padding: '8px 12px',
          boxShadow: maxGauge >= 100 ? '0 0 16px rgba(255,64,129,0.8)' : 'none',
          animation: maxGauge >= 100 ? 'maxGaugeGlow 1.2s infinite alternate' : undefined,
          flexShrink: 0,
        }}
      >
        <div className="row between" style={{ fontSize: 11, fontWeight: 900, marginBottom: 4 }}>
          <span style={{ color: maxGauge >= 100 ? '#FFEB3B' : isRaid ? '#FF80AB' : '#D84315', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>{isBossRaidTarget ? '⚡ DESSERT MAX GAUGE' : '✨ 식감 피버 게이지 (FEVER)'}</span>
            {maxGauge >= 100 && <span style={{ color: '#FF1744' }}>{isBossRaidTarget ? '(MAX READY!)' : '(FEVER READY!)'}</span>}
          </span>
          <span style={{ color: isRaid ? '#FFE082' : '#795548', fontSize: 11 }}>{Math.round(maxGauge)}% / 100%</span>
        </div>

        {/* 게이지 바 (높이 11px) */}
        <div style={{ height: 11, borderRadius: 999, background: isRaid ? 'rgba(0,0,0,0.45)' : '#F5E8C9', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, maxGauge)}%`,
              height: '100%',
              borderRadius: 999,
              background:
                maxGauge >= 100
                  ? 'linear-gradient(90deg, #FF1744, #FFD700, #FF4081)'
                  : 'linear-gradient(90deg, #FF7043, #E91E63)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* 5. 🎮 하단 직관적 게임 컨트롤 바 (터치감 향상 & 넉넉한 버튼 비율) */}
      <div
        className="card"
        style={{
          background: isRaid ? 'rgba(255, 255, 255, 0.96)' : '#FFFDF9',
          border: isRaid ? '1.5px solid #AB47BC' : '1.5px solid #F0DFB8',
          padding: '8px 10px',
          gap: 6,
          flexShrink: 0,
        }}
      >
        {/* 필살기 버튼 (100% 충전 시) or 터치 응원 버튼 */}
        {!isFinished && (
          <div className="row between" style={{ gap: 8 }}>
            {maxGauge >= 100 ? (
              <button
                onClick={handleTriggerMaxStrike}
                style={{
                  flex: 1,
                  cursor: 'pointer',
                  border: '2px solid #FFFFFF',
                  borderRadius: 12,
                  fontWeight: 900,
                  fontSize: 13.5,
                  padding: '11px 14px',
                  background: 'linear-gradient(90deg, #FF1744, #FF4081, #FFD700)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(255,23,68,0.6)',
                  animation: 'pulseGlow 0.6s infinite alternate',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {isBossRaidTarget
                  ? '⚡ 거대 디저트 MAX 스트라이크!! 💥 (협력 총공격)'
                  : '✨ 식감 피버 MAX 버스트!! 💥 (필살 일격)'}
              </button>
            ) : (
              <button
                onClick={handleCheer}
                style={{
                  flex: 1,
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 900,
                  fontSize: 12.5,
                  padding: '10px 14px',
                  background: isRaid
                    ? 'linear-gradient(90deg, #9C27B0, #E91E63)'
                    : 'linear-gradient(90deg, #FF7043, #FF5722)',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(233,30,99,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                {isBossRaidTarget
                  ? `💖 파티 응원 터치! (+12% MAX) ${cheerCount > 0 ? `(${cheerCount})` : ''}`
                  : `💖 펫 응원 터치! (+12% 피버) ${cheerCount > 0 ? `(${cheerCount})` : ''}`}
              </button>
            )}

            {cheerToast && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: isRaid ? '#FF80AB' : '#D84315',
                  animation: 'pulseGlow 0.8s ease infinite',
                  whiteSpace: 'nowrap',
                }}
              >
                {cheerToast}
              </span>
            )}
          </div>
        )}

        {/* 조작 버튼 그룹: 대전 종료 시 결과 액션 */}
        {isFinished && (
          <div className="row between" style={{ gap: 6 }}>
            <button
              className="chip coral"
              onClick={handleReplaySameSeed}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, flex: 1, padding: '8px 0' }}
            >
              🔄 다시 보기
            </button>
            <button
              className="chip honey"
              onClick={handleRematchNewSeed}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, flex: 1, padding: '8px 0' }}
            >
              🎲 새 대결
            </button>
            <button
              className="chip"
              onClick={onBack}
              style={{
                cursor: 'pointer',
                border: 'none',
                fontWeight: 800,
                fontSize: 12,
                flex: 1,
                padding: '8px 0',
                background: isRaid ? '#7B1FA2' : '#5D4037',
                color: '#FFFFFF',
              }}
            >
              🚪 대전 종료
            </button>
          </div>
        )}
      </div>

      {/* 🏆 대형 임팩트 승리 결과창 (대표님 5번 순위 보상 & 9번 승리창 임팩트 리디자인 반영) */}
      {isFinished && (() => {
        const isWin = sim.winner === 'challenger' || dHp <= 0
        const dealtDamage = Math.max(1, sim.defenderMaxHp - dHp)
        const damagePercent = Math.min(100, Math.round((dealtDamage / sim.defenderMaxHp) * 100))

        // 레이드인 경우 실시간 보스 데미지 기록 및 내 순위 산출
        let myRank = 1
        let rankReward = getBossRankRewards(1)
        if (isBossRaidTarget) {
          const myIdx = damageRankings.findIndex((r) => r.isMe)
          myRank = myIdx >= 0 ? myIdx + 1 : 1
          rankReward = getBossRankRewards(myRank)
          // 보스 체력 차감 누적
          recordBossDamage(defender.id, dealtDamage, sim.defenderMaxHp)
        }

        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'rgba(10, 4, 18, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              animation: 'fadeIn 0.25s ease',
            }}
          >
            {/* 결과 카드 모달 본체 (폭을 356px로 넓히고 여백과 임팩트 강화) */}
            <div
              style={{
                width: '100%',
                maxWidth: 356,
                background: isWin
                  ? 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EE 100%)'
                  : 'linear-gradient(180deg, #FFFDF9 0%, #F5F0FF 100%)',
                borderRadius: 28,
                border: isWin ? '3px solid #F59E0B' : '2.5px solid #CE93D8',
                boxShadow: isWin
                  ? '0 20px 48px rgba(245, 158, 11, 0.45), 0 0 24px rgba(251, 191, 36, 0.35)'
                  : '0 20px 48px rgba(106, 27, 154, 0.3)',
                padding: '0 18px 18px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative',
              }}
            >
              {/* 1. 상단 튀어나온 3D 대형 골드 엠블럼 타이틀 */}
              <div
                style={{
                  margin: '-22px auto 0',
                  padding: '9px 28px',
                  borderRadius: 999,
                  background: isWin
                    ? 'linear-gradient(180deg, #FDE047 0%, #F59E0B 50%, #D97706 100%)'
                    : isBossRaidTarget
                    ? 'linear-gradient(180deg, #C084FC 0%, #9333EA 100%)'
                    : 'linear-gradient(180deg, #FDA4AF 0%, #E11D48 100%)',
                  boxShadow: isWin
                    ? '0 5px 0 #92400E, 0 8px 18px rgba(217, 119, 6, 0.5)'
                    : '0 5px 0 #581C87, 0 8px 18px rgba(147, 51, 234, 0.4)',
                  border: '2.5px solid #FFFFFF',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: '1.5px',
                  textShadow: '0 2px 2px rgba(0,0,0,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{isWin ? '🏆' : isBossRaidTarget ? '⚔️' : '🧁'}</span>
                <span>{isWin ? 'V I C T O R Y' : isBossRaidTarget ? 'RAID COMPLETE' : 'BATTLE FINISH'}</span>
                <span>{isWin ? '✨' : '💖'}</span>
              </div>

              {/* 2. 대형 승리 타이틀 & 트로피 연출 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', marginTop: 4 }}>
                <div style={{ fontSize: 32, filter: 'drop-shadow(0 4px 10px rgba(245, 158, 11, 0.4))' }}>
                  {isWin ? '👑' : isBossRaidTarget ? '🛡️' : '🍪'}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1F2937', letterSpacing: '-0.3px' }}>
                  {isBossRaidTarget
                    ? `🎉 거대 [${defender.name || dInfo?.name}] 공략 완료!`
                    : isWin
                    ? `🎉 [${challenger.name || cInfo?.name}] 대승리!`
                    : `지인 [${defenderOwnerName}]님과의 멋진 대결!`}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>
                  {isBossRaidTarget
                    ? `총 ${dealtDamage.toLocaleString()} 데미지 타격 성공 (${damagePercent}%)`
                    : isWin
                    ? '완벽한 식감 전술로 상대를 압도했습니다!'
                    : '소중한 전투 경험치를 획득했습니다!'}
                </div>
              </div>

              {/* 3. 레이드 순위 및 차등 보상 뱃지 (레이드 시 표시) */}
              {isBossRaidTarget && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                    borderRadius: 16,
                    border: '2px solid #F59E0B',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#B45309' }}>기여도 순위 보상</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#78350F' }}>{rankReward.rankBadge}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#92400E' }}>
                      +🪙 {rankReward.coins} 코인 | +⭐ {rankReward.starShards}
                    </div>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: '#D97706' }}>
                      훈장: {rankReward.medalTitle}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. 🎁 핵심 전투 획득 보상 박스 (크고 선명하게 강조) */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)',
                  borderRadius: 18,
                  border: '2px solid #FDE68A',
                  padding: '12px 14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                }}
              >
                {/* 코인 보상 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 22 }}>🪙</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#6B7280' }}>코인 보상</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#D97706' }}>
                    {isBossRaidTarget ? `+${rankReward.coins}` : isWin ? '+35' : '+15'}
                  </span>
                </div>

                {/* 리본 코인 보상 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderLeft: '1px solid #FDE68A', borderRight: '1px solid #FDE68A' }}>
                  <span style={{ fontSize: 22 }}>🎀</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#6B7280' }}>리본 코인</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#E11D48' }}>
                    {isBossRaidTarget ? '+50' : isWin ? '+20' : '+10'}
                  </span>
                </div>

                {/* 친밀도 & 레이팅 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 22 }}>⭐</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#6B7280' }}>레이팅 변동</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#2563EB' }}>
                    {isWin ? '+25 RP' : '+8 RP'}
                  </span>
                </div>
              </div>

              {/* 5. 🎬 배틀 명장면 리플레이 짤 버튼 */}
              <button
                onClick={() => {
                  setShowHighlightModal(true)
                  playDessertAsmr('sugar-crack', 2)
                }}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  borderRadius: 14,
                  border: '1.5px solid #FFB74D',
                  background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                  color: '#C2410C',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(255,152,0,0.15)',
                }}
              >
                <span>🎬</span>
                <span>배틀 명장면 리플레이 짤 보기</span>
              </button>

              {/* 6. 하단 주요 액션 버튼 (크고 누르기 편하게) */}
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <button
                  onClick={handleReplaySameSeed}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 14,
                    border: '1.5px solid #D1D5DB',
                    background: '#FFFFFF',
                    color: '#4B5563',
                    fontWeight: 900,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  🔄 다시 보기
                </button>
                <button
                  onClick={() => {
                    playDessertAsmr('sugar-crack')
                    if (onRewardClaimed) onRewardClaimed(isBossRaidTarget ? rankReward.coins : 35)
                    onBack()
                  }}
                  style={{
                    flex: 2,
                    padding: '10px 16px',
                    borderRadius: 14,
                    border: 'none',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
                  }}
                >
                  🎉 보상 수령 & 광장 복귀
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* 명장면 리플레이 짤 모달 */}
      {showHighlightModal && bestHighlight && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setShowHighlightModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#FFFDF9',
              borderRadius: 22,
              border: '2px solid #FFB74D',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              padding: '14px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row between" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 900, color: '#E65100' }}>
                🎬 배틀 명장면 리플레이 짤
              </span>
              <button
                onClick={() => setShowHighlightModal(false)}
                style={{ border: 'none', background: 'none', fontSize: 13, cursor: 'pointer', color: '#8D6E63', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                position: 'relative',
                borderRadius: 14,
                background: 'radial-gradient(ellipse at center, #FFF8E1 0%, #FFE082 100%)',
                border: '1.5px solid #FFD54F',
                padding: '12px 10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <MonsterView look={cLook} size={80} title={challenger.name || cInfo?.name} />
                <div style={{ fontSize: 20 }}>💥</div>
                <MonsterView look={dLook} size={70} title={defender.name || dInfo?.name} />
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  borderRadius: 10,
                  padding: '5px 8px',
                  border: '1px solid #FFE082',
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 900, color: '#D84315' }}>
                  {bestHighlight.isCrit ? '🔥 [필살기 결정타] ' : '⚡ [최대 식감 타격] '}
                  {bestHighlight.skillIcon} {bestHighlight.skillName}
                </div>
                <div style={{ fontSize: 9.5, color: '#5D4037', fontWeight: 800, marginTop: 1 }}>
                  대미지 -{bestHighlight.damage} HP · ASMR {bestHighlight.onomatopoeia}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                try {
                  navigator.clipboard.writeText(
                    `[파티세리 디저트 대전] #${seed} 시드에서 ${challenger.name || cInfo?.name}의 ${bestHighlight.skillName} 필살기 명장면!`
                  )
                  setCopiedClipToast(true)
                  setTimeout(() => setCopiedClipToast(false), 2500)
                } catch {}
                playDessertAsmr('cookie-crisp')
              }}
              style={{
                padding: '8px 0',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(90deg, #FF7043, #FF5722)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 11.5,
                cursor: 'pointer',
              }}
            >
              {copiedClipToast ? '✅ 명장면 링크 복사 완료!' : '📸 명장면 짤 링크 복사 & 공유'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
