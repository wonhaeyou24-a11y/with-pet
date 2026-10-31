// M3 화면 3: 🍂 사계절 감성 파티세리 광장 (가을 낙엽 바닥 & 펫 발자국 페이드아웃 애니메이션)
// - 분수나 주변 건물을 모두 비우고 깨끗하게 낙엽이 깔린 가을 바닥으로 조성했습니다.
// - 펫이 산책하고 이동할 때마다 낙엽 위에 귀여운 젤리 발자국이 찍히고 스르륵 사라지는 감성 모션을 지원합니다.
// - 4계절(봄·여름·가을·겨울)과 특별 이벤트(할로윈·크리스마스)로 손쉽게 전환할 수 있는 테마 시스템을 탑재했습니다.

import { useEffect, useRef, useState, type PointerEvent, type WheelEvent, useMemo } from 'react'
import { addRibbonCoins } from '../config/boutique'
import { recordMissionAction } from '../config/missions'
import { ELEMENT_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { PLAZA_SHOWCASE_FRIENDS, type PlazaFriendEntry } from '../lib/battleEngine'
import { playDessertAsmr } from '../lib/sound'
import { supabase } from '../lib/supabase'
import MonsterView from '../monsters/MonsterView'
import { callBattle, isRealMonsterId } from '../lib/battleApi'
import { IS_DEV_MOCK } from '../lib/devMode'
import { getPvpMatchRecords, formatTimeAgo, type PvpMatchRecord } from '../lib/pvpHistory'
import MonsterSnapshot from '../monsters/MonsterSnapshot'
import WorldBoss3DView from '../monsters/WorldBoss3DView'
import { BackIcon, ElementIcon } from '../ui/Icons'
import {
  createWorldBossMonster,
  getWorldBossStatus,
  WORLD_BOSS_CATALOG,
  getRaidAttemptsInfo,
  useRaidAttempt,
  type RaidStatus,
} from '../lib/bossScheduler'

interface Props {
  myMonster: MonsterRow
  myNickname: string
  coins: number
  onEarnCoins: (delta: number) => void
  // 서버가 알려 준 코인 총액 (한입 투표 보상)
  onCoins?: (coins: number) => void
  onChallenge: (friend: PlazaFriendEntry, mode?: 'friendly' | 'boss-raid') => void
  onOpenSkillTree: () => void
  // 실제 지인의 미니룸 방문 (서버 방명록)
  onVisit?: (friend: PlazaFriendEntry) => void
  onBack: () => void
}

const CANVAS_W = 860
const CANVAS_H = 720
const CENTER_X = CANVAS_W / 2
const CENTER_Y = CANVAS_H / 2

// 4계절 및 이벤트 테마 설정
export type PlazaThemeId = 'autumn' | 'spring' | 'summer' | 'winter' | 'halloween' | 'christmas'

// 🌍 현실 계절(봄·여름·가을·겨울) 및 실제 이벤트 날짜(할로윈·크리스마스) 기반 실시간 자동 테마 결정
export function getAutoPlazaTheme(): PlazaThemeId {
  const now = new Date()
  const month = now.getMonth() + 1 // 1 ~ 12
  const day = now.getDate()

  // 🎃 이벤트 1: 할로윈 축제 시즌 (10월 20일 ~ 11월 2일)
  if ((month === 10 && day >= 20) || (month === 11 && day <= 2)) {
    return 'halloween'
  }
  // 🎄 이벤트 2: 크리스마스 & 연말 축제 시즌 (12월 15일 ~ 12월 31일)
  if (month === 12 && day >= 15) {
    return 'christmas'
  }

  // 🌸 사계절: 한국 표준 기상 시즌
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

export interface PlazaThemeConfig {
  id: PlazaThemeId
  name: string
  seasonLabel: string
  icon: string
  bgGradient: string
  floorDotColor: string
  leafIcons: string[]
  footprintColor: string
  desc: string
}

export const PLAZA_THEMES: Record<PlazaThemeId, PlazaThemeConfig> = {
  autumn: {
    id: 'autumn',
    name: '가을 낙엽 광장',
    seasonLabel: '🍁 깊어가는 가을',
    icon: '🍁',
    bgGradient: 'radial-gradient(circle at 50% 50%, #FFF3E0 0%, #FFE0B2 45%, #FFCC80 100%)',
    floorDotColor: 'rgba(230, 81, 0, 0.08)',
    leafIcons: ['🍁', '🍂', '🌰', '🌾', '🍂', '🍁', '🍃'],
    footprintColor: '#D84315',
    desc: '붉고 노란 단풍과 바사삭 은행잎이 소복하게 쌓인 깨끗한 가을 바닥',
  },
  spring: {
    id: 'spring',
    name: '봄 벚꽃 광장',
    seasonLabel: '🌸 따스한 봄날',
    icon: '🌸',
    bgGradient: 'radial-gradient(circle at 50% 50%, #FFF0F5 0%, #FCE4EC 45%, #F8BBD0 100%)',
    floorDotColor: 'rgba(194, 24, 91, 0.08)',
    leafIcons: ['🌸', '🌷', '🌿', '🌸', '🍃', '🌸', '✨'],
    footprintColor: '#C2185B',
    desc: '살랑이는 봄바람에 분홍 벚꽃잎이 흩날리는 로맨틱한 봄 바닥',
  },
  summer: {
    id: 'summer',
    name: '여름 해변 광장',
    seasonLabel: '🌊 시원한 여름',
    icon: '🌊',
    bgGradient: 'radial-gradient(circle at 50% 50%, #FFF9C4 0%, #FFF59D 45%, #E0F7FA 100%)',
    floorDotColor: 'rgba(0, 151, 167, 0.08)',
    leafIcons: ['🐚', '🫧', '⭐', '🌊', '🌴', '🫧', '🏖️'],
    footprintColor: '#00838F',
    desc: '반짝이는 고운 모래사장과 시원한 바닷바람이 부는 여름 바닥',
  },
  winter: {
    id: 'winter',
    name: '겨울 눈꽃 광장',
    seasonLabel: '❄️ 포근한 겨울',
    icon: '❄️',
    bgGradient: 'radial-gradient(circle at 50% 50%, #FFFFFF 0%, #ECEFF1 50%, #CFD8DC 100%)',
    floorDotColor: 'rgba(84, 110, 122, 0.08)',
    leafIcons: ['❄️', '⛄', '🌨️', '❄️', '✨', '❄️', '⭐'],
    footprintColor: '#546E7A',
    desc: '뽀드득 소리가 날 듯 새하얀 첫눈이 소복하게 쌓인 겨울 바닥',
  },
  halloween: {
    id: 'halloween',
    name: '할로윈 호박 축제',
    seasonLabel: '🎃 할로윈 페스티벌',
    icon: '🎃',
    bgGradient: 'radial-gradient(circle at 50% 50%, #311B92 0%, #1A237E 60%, #0D0716 100%)',
    floorDotColor: 'rgba(255, 111, 0, 0.15)',
    leafIcons: ['🎃', '🍬', '🦇', '👻', '🍭', '🎃', '✨'],
    footprintColor: '#FF6D00',
    desc: '신비로운 보랏빛 밤하늘과 호박 사탕이 가득한 축제 공간',
  },
  christmas: {
    id: 'christmas',
    name: '크리스마스 빌리지',
    seasonLabel: '🎄 메리 크리스마스',
    icon: '🎄',
    bgGradient: 'radial-gradient(circle at 50% 50%, #1B5E20 0%, #0D5302 50%, #B71C1C 100%)',
    floorDotColor: 'rgba(255, 215, 0, 0.15)',
    leafIcons: ['🎄', '🎁', '🔔', '❄️', '⭐', '🎀', '✨'],
    footprintColor: '#FFD600',
    desc: '따뜻한 트리 전구와 크리스마스 선물이 놓인 연말 축제 공간',
  },
}

// 펫이 산책하며 남기는 발자국 객체
interface Footprint {
  id: string
  x: number
  y: number
  isLeft: boolean
  rotation: number
  opacity: number
  createdAt: number
}

// 광장 내 캐릭터 초기 스폰 좌표 (겹침 없는 시원한 360도 분산 배치)
const PLAZA_COORDS = [
  { x: CENTER_X - 220, y: CENTER_Y - 170, rank: 1, winRate: 88 }, // 좌상단
  { x: CENTER_X + 220, y: CENTER_Y - 170, rank: 2, winRate: 81 }, // 우상단
  { x: CENTER_X - 240, y: CENTER_Y + 160, rank: 3, winRate: 74 }, // 좌하단
  { x: CENTER_X + 240, y: CENTER_Y + 160, rank: 4, winRate: 69 }, // 우하단
  { x: CENTER_X, y: CENTER_Y + 240, rank: 5, winRate: 62 },       // 중앙 하단
]

// 🐾 광장 내 자연스러운 산책 구역 핫스팟 목록 (내 펫 중앙 반경 130px 침범 방지)
const PLAZA_WAYPOINTS = [
  { x: CENTER_X - 260, y: CENTER_Y - 130 },
  { x: CENTER_X + 260, y: CENTER_Y - 130 },
  { x: CENTER_X - 160, y: CENTER_Y - 240 },
  { x: CENTER_X + 160, y: CENTER_Y - 240 },
  { x: CENTER_X - 260, y: CENTER_Y + 80 },
  { x: CENTER_X + 260, y: CENTER_Y + 80 },
  { x: CENTER_X - 180, y: CENTER_Y + 220 },
  { x: CENTER_X + 180, y: CENTER_Y + 220 },
  { x: CENTER_X, y: CENTER_Y + 280 },
  { x: CENTER_X, y: CENTER_Y - 260 },
]

const PET_CHATTERS = [
  '낙엽 밟는 소리 바사삭-! 🍁',
  '가을 공기 정말 시원해~ 🍂',
  '누구 친선전 할 친구? ⚔️',
  '바람에 낙엽이 흩날려요 🍃',
  '밤 주웠다 또각또각 🌰',
  '한입 투표 고마워요 🥄',
]

// 🍂 계절별 실시간 공중 흩날림 앰비언트 파티클 아이콘 (가을=낙엽, 겨울=눈송이, 봄=벚꽃잎)
const SEASON_DRIFT_ICONS: Record<PlazaThemeId, string[]> = {
  autumn: ['🍁', '🍂', '🌰', '🍃', '🍁', '🍂', '🍁', '🍃'],
  winter: ['❄️', '🌨️', '✨', '❄️', '☃️', '❄️', '✨', '🌨️'],
  spring: ['🌸', '🌺', '🌷', '🍃', '🌸', '🌺', '🌸', '🍃'],
  summer: ['🫧', '💧', '✨', '🫧', '💧', '🫧', '✨', '💧'],
  halloween: ['🎃', '🍬', '🦇', '✨', '🎃', '🍬', '✨', '🦇'],
  christmas: ['❄️', '🔔', '🎄', '✨', '❄️', '⭐', '🎄', '🔔'],
}

// 소복이 깔린 고정 바닥 낙엽 조경 좌표들 (건물 없이 바닥에 아름답게 흩뿌려진 단풍잎)
const STATIC_LEAVES = [
  { x: 120, y: 110, icon: '🍁', rot: 25, size: 26, op: 0.8 },
  { x: 260, y: 90, icon: '🍂', rot: -40, size: 22, op: 0.75 },
  { x: 420, y: 130, icon: '🌰', rot: 15, size: 20, op: 0.9 },
  { x: 590, y: 80, icon: '🍁', rot: 60, size: 28, op: 0.85 },
  { x: 740, y: 120, icon: '🍂', rot: -20, size: 24, op: 0.8 },
  { x: 180, y: 240, icon: '🌾', rot: 30, size: 22, op: 0.7 },
  { x: 330, y: 220, icon: '🍁', rot: -15, size: 26, op: 0.85 },
  { x: 520, y: 250, icon: '🍂', rot: 45, size: 24, op: 0.8 },
  { x: 680, y: 230, icon: '🍁', rot: -50, size: 28, op: 0.85 },
  { x: 140, y: 380, icon: '🍂', rot: 10, size: 25, op: 0.75 },
  { x: 290, y: 390, icon: '🌰', rot: -30, size: 21, op: 0.9 },
  { x: 440, y: 360, icon: '🍁', rot: 75, size: 27, op: 0.85 },
  { x: 610, y: 400, icon: '🍂', rot: -10, size: 24, op: 0.8 },
  { x: 760, y: 370, icon: '🌾', rot: 20, size: 22, op: 0.7 },
  { x: 200, y: 520, icon: '🍁', rot: -45, size: 29, op: 0.9 },
  { x: 360, y: 540, icon: '🍂', rot: 35, size: 23, op: 0.8 },
  { x: 500, y: 510, icon: '🍁', rot: -65, size: 26, op: 0.85 },
  { x: 670, y: 530, icon: '🌰', rot: 15, size: 20, op: 0.9 },
  { x: 160, y: 640, icon: '🍂', rot: 50, size: 24, op: 0.75 },
  { x: 320, y: 630, icon: '🍁', rot: -25, size: 27, op: 0.85 },
  { x: 480, y: 640, icon: '🌾', rot: 40, size: 22, op: 0.7 },
  { x: 640, y: 620, icon: '🍁', rot: -10, size: 28, op: 0.85 },
  { x: 750, y: 640, icon: '🍂', rot: 60, size: 25, op: 0.8 },
]

export default function DessertPlaza({
  myMonster,
  coins,
  onEarnCoins,
  onCoins,
  onChallenge,
  onVisit,
  onBack,
}: Props) {
  const [entries, setEntries] = useState<PlazaFriendEntry[]>(PLAZA_SHOWCASE_FRIENDS)
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [currentTheme, setCurrentTheme] = useState<PlazaThemeId>(() => getAutoPlazaTheme())
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false)

  // 🐉 디저트 월드 보스 레이드 스케줄러 상태 (1초 주기 동기화)
  const [raidStatus, setRaidStatus] = useState<RaidStatus>(() => getWorldBossStatus())
  const [showRaidModal, setShowRaidModal] = useState<boolean>(false)

  // ⚔️ 부재 중 방어전 기록 카드 모달 상태
  const [showDefenseHistoryModal, setShowDefenseHistoryModal] = useState<boolean>(false)
  const [pvpRecords] = useState<PvpMatchRecord[]>(() => getPvpMatchRecords())

  useEffect(() => {
    const timer = setInterval(() => {
      setRaidStatus(getWorldBossStatus())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 🐾 펫 산책 발자국 상태 (CSS fade-out으로 React 리렌더 루프를 제거하여 60FPS 극상의 부드러움 달성)
  const [footprints, setFootprints] = useState<Footprint[]>([])
  const stepCountRef = useRef<number>(0)

  // 각 지인 캐릭터들의 실시간 자율 산책 좌표
  const [actors, setActors] = useState<
    { x: number; y: number; isWalking: boolean; facingLeft: boolean; speech: string | null }[]
  >(() =>
    PLAZA_COORDS.map((c) => ({
      x: c.x,
      y: c.y,
      isWalking: false,
      facingLeft: false,
      speech: null,
    })),
  )

  // 발자국 추가 헬퍼 (새 발자국 생성 - 최대 18개 유지, CSS로 자연스럽게 2.6초 페이드아웃)
  const addFootprint = (x: number, y: number, isLeft: boolean, angle: number) => {
    if (dragRef.current.active && dragRef.current.moved) return
    const id = `fp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newFp: Footprint = {
      id,
      x,
      y,
      isLeft,
      rotation: angle,
      opacity: 0.85,
      createdAt: Date.now(),
    }
    setFootprints((prev) => [...prev.slice(-18), newFp])
  }

  // 지인 캐릭터들의 자연스러운 광장 자율 산책 루프 (뒤쪽에 정확한 타이밍으로 발자국 남기기)
  useEffect(() => {
    const wanderTimer = setInterval(() => {
      if (dragRef.current.active && dragRef.current.moved) return
      setActors((prev) => {
        const next = [...prev]
        const walkerIdx = Math.floor(Math.random() * next.length)
        if (walkerIdx === selectedIdx) return prev

        const curr = next[walkerIdx]
        // 🛡️ 충돌 회피: 다른 펫들 및 내 펫(중앙)과 140px 이상 안전 거리를 유지하는 웨이포인트 선택
        const candidateWps = PLAZA_WAYPOINTS.filter((wp) => {
          const distToCenter = Math.hypot(wp.x - CENTER_X, wp.y - CENTER_Y)
          if (distToCenter < 140) return false
          return next.every((other, oIdx) => {
            if (oIdx === walkerIdx) return true
            return Math.hypot(wp.x - other.x, wp.y - other.y) >= 130
          })
        })
        const chosenWpList = candidateWps.length > 0 ? candidateWps : PLAZA_WAYPOINTS
        const targetWp = chosenWpList[Math.floor(Math.random() * chosenWpList.length)]
        const facingLeft = targetWp.x < curr.x
        const speech = Math.random() < 0.35 ? PET_CHATTERS[Math.floor(Math.random() * PET_CHATTERS.length)] : null

        const startX = curr.x
        const startY = curr.y
        const targetX = targetWp.x + (Math.random() * 20 - 10)
        const targetY = targetWp.y + (Math.random() * 20 - 10)

        const dx = targetX - startX
        const dy = targetY - startY
        const dist = Math.hypot(dx, dy)
        if (dist > 20) {
          const ux = dx / dist
          const uy = dy / dist
          const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90

          // 🐾 뒤쪽에 정확히 남는 발자국: 펫이 출발한 뒤 지나간 궤적의 뒤쪽(-26px)에만 순차적으로 찍기
          const steps = 3
          for (let s = 1; s <= steps; s++) {
            setTimeout(() => {
              const elapsedRatio = (s - 0.3) / steps
              const curX = startX + dx * elapsedRatio
              const curY = startY + dy * elapsedRatio
              // 펫의 진행 반대 방향(뒤쪽 26px) 및 발밑(y+30px)에 발자국 배치
              const fx = curX - ux * 26
              const fy = curY - uy * 26 + 30
              stepCountRef.current += 1
              const isLeft = stepCountRef.current % 2 === 0
              addFootprint(fx, fy, isLeft, angle)
            }, s * 700)
          }
        }

        next[walkerIdx] = {
          ...curr,
          x: targetX,
          y: targetY,
          isWalking: true,
          facingLeft,
          speech,
        }

        setTimeout(() => {
          setActors((latest) => {
            if (!latest[walkerIdx]) return latest
            const lNext = [...latest]
            lNext[walkerIdx] = { ...lNext[walkerIdx], isWalking: false }
            return lNext
          })
        }, 2600)

        if (speech) {
          setTimeout(() => {
            setActors((latest) => {
              if (!latest[walkerIdx]) return latest
              const lNext = [...latest]
              lNext[walkerIdx] = { ...lNext[walkerIdx], speech: null }
              return lNext
            })
          }, 3200)
        }

        return next
      })
    }, 3200)

    return () => clearInterval(wanderTimer)
  }, [selectedIdx])

  // 2.5D 광장 줌 & 패닝 상태
  const [zoom, setZoom] = useState<number>(0.85)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragRef = useRef<{
    active: boolean
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false })

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const livePanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchDistRef = useRef<number | null>(null)

  // 실제 서비스: 오늘 이미 투표한 지인은 서버 기준으로 표시한다
  useEffect(() => {
    if (IS_DEV_MOCK) return
    let cancelled = false
    callBattle('status').then((res) => {
      if (cancelled || !res.ok || !res.votedIds) return
      setLikedIds(Object.fromEntries(res.votedIds.map((id) => [id, true])))
    })
    return () => {
      cancelled = true
    }
  }, [])

  // DB에 등록된 지인들의 몬스터 불러오기
  useEffect(() => {
    let cancelled = false
    async function fetchRealFriends() {
      try {
        const { data: realMonsters } = await supabase
          .from('monsters')
          .select('*')
          .neq('id', myMonster.id)
          .not('name', 'is', null)
          .limit(10)
        if (cancelled || !realMonsters || realMonsters.length === 0) return

        const { data: players } = await supabase.from('players').select('id, nickname')
        const nickMap = new Map<string, string>()
        players?.forEach((p: { id: string; nickname: string }) => nickMap.set(p.id, p.nickname))

        const mapped: PlazaFriendEntry[] = (realMonsters as MonsterRow[]).map((m) => ({
          ownerNickname: nickMap.get(m.owner) ?? '지인파티시에',
          badge: '✨ 지인 파티시에',
          bio: m.bio ?? '정성껏 키운 나만의 디저트 몬스터예요! 🍰',
          likes: m.likes_count ?? 24,
          monster: m,
          comments: [],
        }))

        setEntries([...mapped, ...PLAZA_SHOWCASE_FRIENDS])
      } catch {
        // 오프라인 폴백
      }
    }
    void fetchRealFriends()
    return () => {
      cancelled = true
    }
  }, [myMonster.id])

  const selectedFriend = entries[selectedIdx] ?? entries[0]
  // 펫마다 저장소를 읽는 계산은 지인 목록이 바뀔 때만 한다 (드래그·산책 중 매번 다시 하지 않는다)
  const entryLooks = useMemo(() => entries.map((e) => monsterLook(e.monster)), [entries])
  const selLook = useMemo(() => monsterLook(selectedFriend.monster), [selectedFriend.monster])
  const myLookMemo = useMemo(() => monsterLook(myMonster), [myMonster])
  const themeObj = PLAZA_THEMES[currentTheme]

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  function handleSelectFriend(idx: number) {
    setSelectedIdx(idx)
    const coord = PLAZA_COORDS[idx % PLAZA_COORDS.length]
    playDessertAsmr('acorn-snap')
    const targetZoom = Math.max(zoom, 1.1)
    setZoom(targetZoom)
    setPan({
      x: (CENTER_X - coord.x) * targetZoom * 0.7,
      y: (CENTER_Y - coord.y) * targetZoom * 0.7,
    })
  }

  async function handleVote(friend: PlazaFriendEntry) {
    const fid = friend.monster.id
    if (likedIds[fid]) {
      showToast('이미 오늘 한입 투표를 보냈어요!')
      return
    }
    if (!IS_DEV_MOCK) {
      playDessertAsmr('mochi-squish', 2)
      // 연습 상대(NPC)는 서버에 없는 캐릭터라 보상·기록 없이 응원만 한다
      if (!isRealMonsterId(fid)) {
        setLikedIds((prev) => ({ ...prev, [fid]: true }))
        setEntries((list) => list.map((it) => (it.monster.id === fid ? { ...it, likes: it.likes + 1 } : it)))
        showToast('🥄 연습 상대에게 응원을 보냈어요! (코인 보상은 실제 지인에게만 있어요)')
        return
      }
      setLikedIds((prev) => ({ ...prev, [fid]: true }))
      const res = await callBattle('vote', { monsterId: fid })
      if (!res.ok) {
        if (res.code !== 'voted') setLikedIds((prev) => ({ ...prev, [fid]: false }))
        showToast(res.message ?? '잠시 후 다시 시도해 주세요.')
        return
      }
      setEntries((list) => list.map((it) => (it.monster.id === fid ? { ...it, likes: res.likes ?? it.likes + 1 } : it)))
      if (res.coins !== undefined) onCoins?.(res.coins)
      showToast(`🥄 [${friend.ownerNickname}]님에게 달콤한 한입 응원 전달!${res.reward ? ` (+${res.reward} 코인)` : ''}`)
      return
    }
    playDessertAsmr('mochi-squish', 2)
    setLikedIds((prev) => ({ ...prev, [fid]: true }))
    setEntries((list) =>
      list.map((it) => (it.monster.id === fid ? { ...it, likes: it.likes + 1 } : it)),
    )
    onEarnCoins(5)
    showToast(`🥄 [${friend.ownerNickname}]님에게 달콤한 한입 응원 전달! (+5 코인)`)
  }

  // 포인터 드래그 & 핀치 줌 핸들러
  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      pinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      dragRef.current.active = false
      return
    }

    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
      moved: false,
    }
    livePanRef.current = { x: pan.x, y: pan.y }
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      if (pinchDistRef.current && pinchDistRef.current > 10) {
        const ratio = dist / pinchDistRef.current
        setZoom((z) => Math.max(0.65, Math.min(1.85, Number((z * ratio).toFixed(2)))))
      }
      pinchDistRef.current = dist
      return
    }

    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true
    }
    // 드래그 중에는 React를 다시 그리지 않고 화면 변환값만 바로 바꾼다 (끊김 방지)
    const next = {
      x: Math.max(-280, Math.min(280, dragRef.current.originX + dx)),
      y: Math.max(-240, Math.min(240, dragRef.current.originY + dy)),
    }
    livePanRef.current = next
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const el = canvasRef.current
        if (el) {
          el.style.transition = 'none'
          const p = livePanRef.current
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${zoom})`
        }
      })
    }
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) {
      pinchDistRef.current = null
    }
    const wasDragging = dragRef.current.active && dragRef.current.moved
    dragRef.current.active = false
    if (wasDragging) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (canvasRef.current) canvasRef.current.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      setPan(livePanRef.current)
    }
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    const delta = e.deltaY < 0 ? 0.12 : -0.12
    setZoom((z) => Math.max(0.65, Math.min(1.85, Number((z + delta).toFixed(2)))))
  }

  return (
    <main
      className="screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        background: '#FFF8E7',
        userSelect: 'none',
        position: 'relative',
        padding: 0,
        gap: 0,
        maxWidth: 'none',
      }}
    >
      <style>{`
        @keyframes driftFall {
          0% {
            transform: translate3d(0, -50px, 0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translate3d(140px, 860px, 0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      {/* 1. 상단 미니멀 바 (계절/이벤트 테마 뱃지 & 코인) */}
      <div
        className="row between"
        style={{
          padding: '8px 12px',
          background: '#FFFDF9',
          borderBottom: '1.5px solid #FFD54F',
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        <div className="row" style={{ gap: 6, alignItems: 'center' }}>
          <button className="btn-round" onClick={onBack} aria-label="뒤로">
            <BackIcon />
          </button>
          <div>
            <h1 className="title" style={{ fontSize: 15, margin: 0 }}>
              {themeObj.icon} {themeObj.name}
            </h1>
          </div>
        </div>

        <div className="row" style={{ gap: 6, alignItems: 'center' }}>
          {/* 🍁 현실 사계절 및 이벤트 자동 동기화 뱃지 (지인/방문자는 선택창이 보이지 않고 계절 뱃지만 표시) */}
          <div
            style={{
              padding: '4px 9px',
              borderRadius: 10,
              border: '1.5px solid #FFB74D',
              background: '#FFF8E1',
              color: '#E65100',
              fontSize: 11,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              userSelect: 'none',
            }}
            title="실제 현실 계절 및 기념일 일정에 맞춰 자동으로 광장 테마가 변화합니다"
          >
            <span>{themeObj.seasonLabel}</span>
          </div>

          <span className="chip honey" style={{ fontWeight: 800, fontSize: 11, padding: '4px 8px' }}>
            🪙 {coins}
          </span>
        </div>
      </div>

      {/* 2. 깨끗한 가을 낙엽 바닥 2.5D 인터랙티브 맵 (분수·주변 건물 완전 제거!) */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          background: themeObj.bgGradient,
          touchAction: 'none',
          cursor: dragRef.current.active ? 'grabbing' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* 860x720 대형 2.5D 광장 캔버스 (가을 낙엽 바닥 & 발자국 모션 월드) */}
        <div
          ref={canvasRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            willChange: 'transform',
            width: CANVAS_W,
            height: CANVAS_H,
            marginLeft: -CENTER_X,
            marginTop: -CENTER_Y,
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: '50% 50%',
            transition: dragRef.current.active ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* 바닥 격자 도트 텍스처 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(${themeObj.floorDotColor} 2px, transparent 2px)`,
              backgroundSize: '28px 28px',
              pointerEvents: 'none',
            }}
          />

          {/* 소복하게 흩뿌려진 고정 낙엽들 (건물 없이 깨끗한 가을 바닥 표현) */}
          {STATIC_LEAVES.map((leaf, li) => (
            <div
              key={li}
              style={{
                position: 'absolute',
                left: leaf.x,
                top: leaf.y,
                fontSize: leaf.size,
                opacity: leaf.op,
                transform: `rotate(${leaf.rot}deg)`,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {currentTheme === 'autumn'
                ? leaf.icon
                : themeObj.leafIcons[li % themeObj.leafIcons.length]}
            </div>
          ))}

          {/* 🍃 계절별 실시간 공중 흩날림 파티클 레이어 (가을=낙엽, 겨울=눈, 봄=꽃잎) */}
          {Array.from({ length: 12 }).map((_, di) => {
            const icons = SEASON_DRIFT_ICONS[currentTheme] ?? SEASON_DRIFT_ICONS.autumn
            const icon = icons[di % icons.length]
            const startX = 40 + di * 60 + ((di * 37) % 50)
            const duration = 6.5 + (di % 5) * 1.4
            const delay = (di * 0.85) % 6
            const size = 18 + (di % 4) * 3
            return (
              <div
                key={`drift-${di}`}
                style={{
                  position: 'absolute',
                  left: startX,
                  top: 0,
                  fontSize: size,
                  pointerEvents: 'none',
                  zIndex: 25,
                  animation: `driftFall ${duration}s infinite linear ${delay}s`,
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))',
                  willChange: 'transform, opacity',
                }}
              >
                {icon}
              </div>
            )
          })}

          {/* 🐾 펫 이동 시 실시간으로 찍히고 스르륵 사라지는 발자국 레이어 (Fade-out 애니메이션) */}
          {footprints.map((fp) => (
            <div
              key={fp.id}
              style={{
                position: 'absolute',
                left: fp.x + (fp.isLeft ? -10 : 10),
                top: fp.y,
                fontSize: 16,
                opacity: fp.opacity,
                transform: `rotate(${fp.rotation}deg) scale(${fp.isLeft ? 0.95 : 1})`,
                transition: 'opacity 0.25s linear',
                pointerEvents: 'none',
                userSelect: 'none',
                color: themeObj.footprintColor,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
                zIndex: 3,
              }}
            >
              🐾
            </div>
          ))}

          {/* 👑 광장 상단에 직접 출현한 3D 거대 월드 보스 (일반 펫 대비 압도적인 거대 스케일) */}
          <div
            onClick={(e) => {
              e.stopPropagation()
              playDessertAsmr('smore-sizzle')
              setShowRaidModal(true)
            }}
            style={{
              position: 'absolute',
              left: CENTER_X - 110,
              top: 36,
              width: 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 140,
              cursor: 'pointer',
              animation: 'pulseGlow 2.4s ease-in-out infinite',
            }}
            title="거대 보스를 터치하여 레이드 토벌에 출격하세요!"
          >
            {/* 거대 보스 머리 위 네온 레이드 배너 */}
            <div
              style={{
                background: raidStatus.isActive
                  ? 'linear-gradient(90deg, #D50000, #C2185B, #FF1744)'
                  : 'linear-gradient(90deg, #E65100, #F57C00)',
                color: '#FFE082',
                fontSize: 9.5,
                fontWeight: 900,
                padding: '3px 12px',
                borderRadius: 999,
                boxShadow: '0 0 18px rgba(255, 23, 68, 0.85), 0 2px 8px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap',
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                border: '1.5px solid #FFFFFF',
              }}
            >
              <span>🔥</span>
              <span>{raidStatus.isActive ? '👑 거대 보스 침공 중!!' : '👑 거대 보스 출현'}</span>
              <span style={{ background: '#FFFFFF', color: '#C2185B', padding: '0 5px', borderRadius: 999, fontSize: 8.5 }}>
                ⚔️ 출격 ({getRaidAttemptsInfo().left}/3)
              </span>
            </div>

            {/* 거대 보스 이름 및 레벨 */}
            <div
              style={{
                background: 'rgba(20, 10, 30, 0.88)',
                color: '#FFF8E1',
                fontSize: 9,
                fontWeight: 800,
                padding: '1.5px 8px',
                borderRadius: 8,
                border: '1px solid #FF80AB',
                whiteSpace: 'nowrap',
                marginBottom: 2,
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              마그마 초코 퐁듀 슈가 드래곤 (Lv.50)
            </div>

            {/* 3D 거대 보스 모델 (일반 펫 90px 대비 압도적인 210px 초대형 스케일) */}
            <div style={{ position: 'relative' }}>
              {/* 발밑 끓어오르는 용암 퐁듀 분화구 풀 */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 195,
                  height: 48,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(255, 23, 68, 0.65) 0%, rgba(136, 14, 79, 0.25) 65%, transparent 80%)',
                  border: '1.5px solid #FF1744',
                  boxShadow: '0 0 24px #FF1744',
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
              <div style={{ position: 'relative', zIndex: 3 }}>
                <WorldBoss3DView size={210} pose="idle" />
              </div>
            </div>
          </div>

          {/* 내 대표 펫 산책 노드 (실제 3D Three.js 디저트 펫 디자인) */}
          {(() => {
            const myLook = myLookMemo
            return (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  playDessertAsmr('acorn-snap')
                  setShowDefenseHistoryModal(true)
                }}
                style={{
                  position: 'absolute',
                  left: CENTER_X - 55,
                  top: CENTER_Y - 70,
                  width: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: Math.floor(CENTER_Y),
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  transition: 'transform 0.2s ease',
                }}
              >
                {/* 내 펫 뱃지 (방어전 전적 확인 유도) */}
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #FF7043, #D84315)',
                    color: '#FFFFFF',
                    fontSize: 9.5,
                    fontWeight: 900,
                    boxShadow: '0 2px 6px rgba(216,67,21,0.3)',
                    whiteSpace: 'nowrap',
                    marginBottom: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span>⭐ 내 파트너</span>
                  <span style={{ background: '#FFF', color: '#D84315', padding: '0 4px', borderRadius: 999, fontSize: 8.5 }}>
                    📜 전적
                  </span>
                </div>

                {/* 실제 3D Three.js 몬스터 및 발밑 그림자 */}
                <div
                  style={{
                    position: 'relative',
                    width: 96,
                    height: 96,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      width: 72,
                      height: 18,
                      borderRadius: '50%',
                      background: 'radial-gradient(ellipse, rgba(62,39,35,0.4) 0%, rgba(62,39,35,0.12) 60%, transparent 80%)',
                      zIndex: 1,
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 3 }}>
                    <MonsterSnapshot look={myLook} size={92} title={myMonster.name ?? undefined} />
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#3E2723',
                    background: 'rgba(255,255,255,0.95)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    marginTop: 2,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  }}
                >
                  {myMonster.name}
                </div>
              </div>
            )
          })()}

          {/* 지인들의 캐릭터 노드 배치 (실제 3D Three.js 디저트 펫 디자인 & 가을 바닥 자율 산책) */}
          {entries.slice(0, PLAZA_COORDS.length).map((friend, idx) => {
            const coord = PLAZA_COORDS[idx]
            const actor = actors[idx] ?? { x: coord.x, y: coord.y, isWalking: false, facingLeft: false, speech: null }
            const isSelected = idx === selectedIdx
            const fLook = entryLooks[idx] ?? monsterLook(friend.monster)

            return (
              <div
                key={friend.monster.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectFriend(idx)
                }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 110,
                  willChange: 'transform',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: isSelected ? 90 : Math.floor(actor.y),
                  transform: `translate3d(${actor.x - 55}px, ${actor.y - 65}px, 0)`,
                  scale: isSelected ? '1.15' : '1',
                  transition: 'transform 2.6s ease-in-out, scale 0.2s ease-out',
                }}
              >
                {/* 💬 자율 산책 귀여운 말풍선 */}
                {actor.speech && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -26,
                      background: '#FFFFFF',
                      border: '1.5px solid #FF8A65',
                      borderRadius: 10,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#E65100',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      animation: 'bounce 0.6s ease',
                      zIndex: 20,
                    }}
                  >
                    {actor.speech}
                  </div>
                )}

                {/* 머리 위 따뜻한 좋아요(👍) 배지 (순위·승률 경쟁 대신 호감도 표현) */}
                <div
                  style={{
                    padding: '2px 9px',
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #FF7043, #FF5722)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 6px rgba(255,87,34,0.3)',
                    whiteSpace: 'nowrap',
                    marginBottom: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <span>👍</span>
                  <span>{friend.likes.toLocaleString()}</span>
                </div>

                {/* 🌟 실제 3D Three.js 디저트 몬스터 & 부드러운 발밑 타원 그림자 */}
                <div
                  style={{
                    position: 'relative',
                    width: 96,
                    height: 96,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `${actor.facingLeft ? 'scaleX(-1)' : 'scaleX(1)'} ${actor.isWalking ? 'translateY(-4px)' : 'translateY(0)'}`,
                    transition: 'transform 0.25s ease',
                  }}
                >
                  {/* 발밑 타원형 섀도우 */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      width: 68,
                      height: 18,
                      borderRadius: '50%',
                      background: 'radial-gradient(ellipse, rgba(62,39,35,0.4) 0%, rgba(62,39,35,0.12) 60%, transparent 80%)',
                      zIndex: 1,
                      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  {/* 선택 시 강조 황금 링 이펙트 */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        width: 76,
                        height: 24,
                        borderRadius: '50%',
                        border: '2px solid #FFD600',
                        boxShadow: '0 0 12px #FFD600',
                        animation: 'pulse 1.4s infinite ease-in-out',
                        zIndex: 2,
                      }}
                    />
                  )}
                  {/* 실제 Three.js 3D 몬스터 (prefer2D: false) */}
                  <div style={{ position: 'relative', zIndex: 3 }}>
                    <MonsterSnapshot look={fLook} size={90} title={friend.monster.name ?? undefined} />
                  </div>
                </div>

                {/* 캐릭터 이름 & 주인 닉네임 */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#3E2723',
                    background: 'rgba(255,255,255,0.95)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    marginTop: 3,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    maxWidth: 105,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {friend.monster.name}
                </div>
                <div style={{ fontSize: 9, color: '#795548', fontWeight: 700 }}>
                  @{friend.ownerNickname}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. 하단 선택된 지인 디저트 프로필 카드 (친선전 & 한입 투표 & 100dvh 무스크롤 안전 여백) */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFDF9',
          border: 'none',
          borderTop: '2px solid #FFB74D',
          borderRadius: '22px 22px 0 0',
          marginTop: -14,
          padding: '12px 14px calc(12px + env(safe-area-inset-bottom, 0px))',
          gap: 8,
          boxShadow: '0 -6px 18px rgba(0,0,0,0.10)',
          zIndex: 20,
        }}
      >
        <div className="row between" style={{ gap: 8 }}>
          <div className="row" style={{ gap: 8, minWidth: 0, flex: 1 }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: '#FFF3E0',
                border: '1.5px solid #FFB74D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <MonsterView look={selLook} size={42} prefer2D={false} title={selectedFriend.monster.name ?? undefined} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="row" style={{ gap: 4 }}>
                <strong style={{ fontSize: 13, color: '#3E2723' }}>
                  {selectedFriend.monster.name}
                </strong>
                <span className="chip honey" style={{ fontSize: 9, padding: '1px 4px' }}>
                  Lv.{selectedFriend.monster.level}
                </span>
                <span className="chip" style={{ fontSize: 9, padding: '1px 4px' }}>
                  <ElementIcon element={selectedFriend.monster.element} size={10} />
                  {ELEMENT_INFO[selectedFriend.monster.element].label}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#8D6E63', marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span>파티시에: <strong style={{ color: '#5D4037' }}>{selectedFriend.ownerNickname}</strong></span>
                <span style={{ color: '#6D4C41', fontSize: 10, lineHeight: 1.25, wordBreak: 'keep-all' }}>
                  {selectedFriend.bio}
                </span>
                {/* ⚔️ 상대와의 최근 전적 카드 미니 뱃지 */}
                {(() => {
                  const match = pvpRecords.find((r) => r.opponentName === selectedFriend.ownerNickname)
                  if (!match) return null
                  const isWin = match.result === 'win'
                  return (
                    <span
                      style={{
                        marginTop: 2,
                        padding: '1px 6px',
                        borderRadius: 6,
                        fontSize: 9.5,
                        fontWeight: 800,
                        background: isWin ? '#E8F5E9' : '#FBE9E7',
                        color: isWin ? '#2E7D32' : '#C62828',
                        border: isWin ? '1px solid #A5D6A7' : '1px solid #FFAB91',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        width: 'fit-content',
                      }}
                    >
                      {isWin ? '🛡️ 최근 방어전: 승리 (+18 RP)' : '💔 최근 방어전: 패배 (설욕전 추천!)'}
                    </span>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* 한입 투표 버튼 */}
          <button
            onClick={() => handleVote(selectedFriend)}
            style={{
              padding: '9px 12px',
              borderRadius: 12,
              border: '1.5px solid #FF80AB',
              background: likedIds[selectedFriend.monster.id] ? '#FF80AB' : '#FFF0F5',
              color: likedIds[selectedFriend.monster.id] ? '#FFFFFF' : '#C2185B',
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            🥄 한입 ({selectedFriend.likes})
          </button>
        </div>

        {/* 액션 버튼 바: 친선 대전 신청 & 미니룸 방문 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 2 }}>
          <button
            className="btn"
            onClick={() => onChallenge(selectedFriend, 'friendly')}
            style={{
              padding: '12px 6px',
              fontSize: 14,
              fontWeight: 900,
              background: 'linear-gradient(90deg, #FF7A59 0%, #FF9800 100%)',
              color: '#FFFFFF',
              boxShadow: '0 3px 8px rgba(255,122,89,0.3)',
            }}
          >
            ⚔️ 친선 대전 신청
          </button>
          <button
            className="btn"
            onClick={() => {
              playDessertAsmr('mochi-squish')
              if (!IS_DEV_MOCK) {
                // 실제 지인이면 그 방으로 간다. 연습 상대(NPC)는 방이 없다.
                if (onVisit && isRealMonsterId(selectedFriend.monster.id)) {
                  onVisit(selectedFriend)
                } else {
                  setToast('🏰 연습 상대에게는 미니룸이 없어요. 실제 지인의 방을 방문해 보세요!')
                  setTimeout(() => setToast(null), 3000)
                }
                return
              }
              addRibbonCoins(10, '친구 미니룸 방문 응원')
              recordMissionAction('w-social', 1)
              setToast(`🏰 ${selectedFriend.ownerNickname}님의 미니룸에 방명록 응원을 남겼습니다! (🎀 +10 리본)`)
              setTimeout(() => setToast(null), 3000)
            }}
            style={{
              padding: '12px 6px',
              fontSize: 14,
              fontWeight: 900,
              background: 'linear-gradient(90deg, #EC4899 0%, #DB2777 100%)',
              color: '#FFFFFF',
              boxShadow: '0 3px 8px rgba(236,72,153,0.3)',
            }}
          >
            🏰 미니룸 방문·응원
          </button>
        </div>
      </div>

      {/* 4. 4계절 & 이벤트 테마 선택 모달 */}
      {showThemeModal && (
        <div
          onClick={() => setShowThemeModal(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 60,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#FFFDF9',
              borderRadius: 20,
              border: '2px solid #FFB74D',
              padding: '16px 14px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#3E2723', margin: 0 }}>
              🍂 사계절 & 이벤트 광장 테마
            </h3>
            <div style={{ fontSize: 11, color: '#8D6E63' }}>
              현실 날짜와 계절에 맞춰 광장이 자동으로 변합니다!
            </div>

            {/* 🌿 현실 계절 & 이벤트 실시간 자동 맞춤 버튼 */}
            <button
              onClick={() => {
                const autoTheme = getAutoPlazaTheme()
                playDessertAsmr('acorn-snap')
                setCurrentTheme(autoTheme)
                setShowThemeModal(false)
                showToast(`🌿 현재 실제 날짜에 맞춰 [${PLAZA_THEMES[autoTheme].name}]으로 자동 동기화되었습니다!`)
              }}
              style={{
                padding: '8px 10px',
                borderRadius: 12,
                border: '1.5px solid #4CAF50',
                background: 'linear-gradient(90deg, #E8F5E9 0%, #C8E6C9 100%)',
                color: '#1B5E20',
                fontWeight: 900,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(76,175,80,0.2)',
              }}
            >
              <span>🌿 현실 계절·이벤트 자동 맞춤</span>
              <span className="chip" style={{ fontSize: 10, padding: '1px 6px', background: '#FFF' }}>
                {PLAZA_THEMES[getAutoPlazaTheme()].icon} 추천
              </span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
              {(Object.keys(PLAZA_THEMES) as PlazaThemeId[]).map((tid) => {
                const t = PLAZA_THEMES[tid]
                const isCur = currentTheme === tid
                return (
                  <button
                    key={tid}
                    onClick={() => {
                      playDessertAsmr('acorn-snap')
                      setCurrentTheme(tid)
                      setShowThemeModal(false)
                      showToast(`✨ 광장 테마가 [${t.name}]으로 변경되었습니다!`)
                    }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 12,
                      border: isCur ? '2px solid #FF7A59' : '1px solid #E0D3C5',
                      background: isCur ? '#FFF3E0' : '#FFFDF9',
                      color: isCur ? '#D84315' : '#4E342E',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{t.icon}</span>
                    <strong style={{ fontSize: 12 }}>{t.name}</strong>
                    <span style={{ fontSize: 9, color: '#795548' }}>{t.seasonLabel}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setShowThemeModal(false)}
              style={{
                padding: '8px',
                borderRadius: 10,
                border: '1px solid #D7CCC8',
                background: '#FFF',
                color: '#5D4037',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 🐉 디저트 월드 거대 보스 레이드 스케줄러 & 토벌 출격 모달 */}
      {showRaidModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowRaidModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              background: '#FFFDF9',
              borderRadius: 20,
              border: '2px solid #F59E0B',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#92400E' }}>
                  🐉 디저트 월드 보스 레이드
                </h3>
                <span style={{ fontSize: 10, color: '#B45309', fontWeight: 700 }}>
                  DESSERT MAX 지인 연합 비동기 협력 토벌전
                </span>
              </div>
              <button
                onClick={() => setShowRaidModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#78350F',
                }}
              >
                ✕
              </button>
            </div>

            {/* 실시간 상태 티커 바 & 참여 횟수 */}
            <div
              style={{
                padding: '6px 10px',
                borderRadius: 12,
                background: raidStatus.isActive ? '#FEF2F2' : '#FFFBEB',
                border: raidStatus.isActive ? '1.5px solid #F87171' : '1.5px solid #FCD34D',
                fontSize: 11,
                fontWeight: 800,
                color: raidStatus.isActive ? '#DC2626' : '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>{raidStatus.isActive ? '🚨' : '⏰'}</span>
                <span>{raidStatus.statusText}</span>
              </div>
              <span
                style={{
                  background: '#FFFFFF',
                  padding: '2px 7px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 900,
                  color: getRaidAttemptsInfo().left > 0 ? '#D97706' : '#9CA3AF',
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              >
                도전 기회: {getRaidAttemptsInfo().left}/3회
              </span>
            </div>

            {/* 보스 목록 카드 2종 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WORLD_BOSS_CATALOG.map((boss) => {
                const isThisBossActive = raidStatus.isActive && raidStatus.currentBoss?.id === boss.id
                const attempts = getRaidAttemptsInfo(boss.id)

                return (
                  <div
                    key={boss.id}
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      border: isThisBossActive ? '2px solid #EF4444' : '1.5px solid #E5E7EB',
                      background: isThisBossActive
                        ? 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)'
                        : '#FAFAFA',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 22 }}>{boss.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#1F2937' }}>
                            {boss.name}
                          </div>
                          <div style={{ fontSize: 9, color: '#6B7280', fontWeight: 600 }}>
                            {boss.scheduleLabel} · {boss.locationDesc}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: attempts.canEnter ? '#FEF3C7' : '#F3F4F6',
                            color: attempts.canEnter ? '#B45309' : '#9CA3AF',
                            border: '1px solid rgba(0,0,0,0.06)',
                          }}
                        >
                          남은 도전: {attempts.left}회
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: isThisBossActive ? '#EF4444' : '#E5E7EB',
                            color: isThisBossActive ? '#FFFFFF' : '#4B5563',
                          }}
                        >
                          {isThisBossActive ? '출현 중!' : 'Lv.' + boss.level}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: 10, color: '#4B5563', marginTop: 2 }}>
                      {boss.flavorDesc}
                    </div>

                    {/* 출격 버튼 (3회 제한 적용) */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button
                        disabled={!attempts.canEnter}
                        onClick={() => {
                          if (!attempts.canEnter) {
                            showToast('⚠️ 이번 출현 동안의 레이드 참여 횟수(3회)를 모두 완료했습니다!')
                            return
                          }
                          useRaidAttempt(boss.id)
                          const bossMonster = createWorldBossMonster(boss)
                          const bossEntry: PlazaFriendEntry = {
                            ownerNickname: '디저트 월드 서버',
                            badge: '👑 DESSERT MAX 월드 보스',
                            bio: boss.flavorDesc,
                            likes: 9999,
                            monster: bossMonster,
                            comments: [],
                          }
                          setShowRaidModal(false)
                          onChallenge(bossEntry, 'boss-raid')
                        }}
                        style={{
                          flex: 1,
                          padding: '7px 0',
                          borderRadius: 10,
                          border: 'none',
                          background: !attempts.canEnter
                            ? '#9CA3AF'
                            : isThisBossActive
                              ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                              : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: attempts.canEnter ? 'pointer' : 'not-allowed',
                          boxShadow: attempts.canEnter ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                          opacity: attempts.canEnter ? 1 : 0.75,
                        }}
                      >
                        {!attempts.canEnter
                          ? '🔒 금일 레이드 참여 횟수 소진 (3/3회 완료)'
                          : isThisBossActive
                            ? `🔥 즉시 협동 토벌 출격!! (${attempts.left}/3회 남음)`
                            : `⚔️ 모의 레이드 훈련 (${attempts.left}/3회 남음)`}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setShowRaidModal(false)}
              style={{
                padding: '8px',
                borderRadius: 10,
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                color: '#4B5563',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 📜 부재 중 나에게 온 대전 기록 (방어전 카드) & 복수전/재도전 모달 */}
      {showDefenseHistoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setShowDefenseHistoryModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              maxHeight: '84vh',
              background: '#FFFDF9',
              borderRadius: 22,
              border: '2px solid #FF8A65',
              boxShadow: '0 14px 36px rgba(0, 0, 0, 0.35)',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="row between" style={{ borderBottom: '1.5px solid #FBE9E7', paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 20 }}>📜</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#3E2723' }}>
                    나에게 온 대전 기록 (방어전)
                  </h3>
                  <div style={{ fontSize: 10, color: '#8D6E63' }}>
                    부재 중 지인들이 신청한 대전과 승패 카드입니다.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDefenseHistoryModal(false)}
                style={{
                  border: 'none',
                  background: '#EFEBE9',
                  borderRadius: '50%',
                  width: 26,
                  height: 26,
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#5D4037',
                }}
              >
                ✕
              </button>
            </div>

            {/* 내 방어전 통계 요약 바 */}
            <div
              style={{
                background: 'linear-gradient(90deg, #FFF3E0 0%, #FFE0B2 100%)',
                borderRadius: 14,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #FFCC80',
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#D84315' }}>총 방어 전적</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#BF360C' }}>
                  {pvpRecords.filter((r) => r.result === 'win').length}승 {pvpRecords.filter((r) => r.result === 'loss').length}패
                  <span style={{ fontSize: 10, color: '#E65100', marginLeft: 4 }}>
                    (승률 {Math.round((pvpRecords.filter((r) => r.result === 'win').length / Math.max(1, pvpRecords.length)) * 100)}%)
                  </span>
                </div>
              </div>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 10,
                  padding: '4px 8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: 9, color: '#795548', fontWeight: 800 }}>방어 누적 획득</div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#BE185D' }}>
                  🎀 +{pvpRecords.reduce((sum, r) => sum + r.ribbonReward, 0)} 리본
                </div>
              </div>
            </div>

            {/* 전적 카드 스크롤 목록 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                overflowY: 'auto',
                paddingRight: 2,
                flex: 1,
              }}
            >
              {pvpRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#8D6E63', fontSize: 12 }}>
                  아직 나에게 도착한 대전 신청이 없어요!
                </div>
              ) : (
                pvpRecords.map((rec) => {
                  const isWin = rec.result === 'win'
                  return (
                    <div
                      key={rec.id}
                      style={{
                        background: isWin ? '#F1F8E9' : '#FFF3E0',
                        border: isWin ? '1.5px solid #AED581' : '1.5px solid #FFAB91',
                        borderRadius: 14,
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div className="row between">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 900,
                              background: isWin ? '#43A047' : '#E64A19',
                              color: '#FFFFFF',
                            }}
                          >
                            {isWin ? '🛡️ 방어 성공' : '💔 방어 실패'}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 900, color: '#3E2723' }}>
                            {rec.opponentName}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#8D6E63' }}>
                          {formatTimeAgo(rec.timestamp)}
                        </span>
                      </div>

                      <div style={{ fontSize: 11, color: '#5D4037', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>
                          상대 펫: <strong>{rec.opponentPetName}</strong> (Lv.{rec.opponentLevel})
                        </span>
                        <span style={{ fontWeight: 900, color: isWin ? '#2E7D32' : '#C62828' }}>
                          {rec.scoreDiff > 0 ? `+${rec.scoreDiff} RP` : `${rec.scoreDiff} RP`}
                        </span>
                      </div>

                      <div style={{ fontSize: 10, color: '#795548', lineHeight: 1.3 }}>
                        {rec.message}
                      </div>

                      {/* 복수전 / 재도전 신청 버튼 */}
                      <button
                        onClick={() => {
                          setShowDefenseHistoryModal(false)
                          playDessertAsmr('mochi-squish')
                          // entries에서 해당 상대를 찾거나 생성
                          const found = entries.find((e) => e.ownerNickname === rec.opponentName)
                          if (found) {
                            onChallenge(found, 'friendly')
                          } else {
                            // 모의 지인 엔트리로 대전 시작
                            const fallbackFriend = entries[0] ?? PLAZA_SHOWCASE_FRIENDS[0]
                            onChallenge(
                              {
                                ...fallbackFriend,
                                ownerNickname: rec.opponentName,
                                bio: '나에게 친선 대전을 먼저 신청했던 파티시에',
                                monster: {
                                  ...fallbackFriend.monster,
                                  name: rec.opponentPetName,
                                  level: rec.opponentLevel,
                                },
                              },
                              'friendly',
                            )
                          }
                        }}
                        style={{
                          marginTop: 2,
                          padding: '7px 0',
                          borderRadius: 10,
                          border: 'none',
                          background: isWin
                            ? 'linear-gradient(90deg, #66BB6A 0%, #43A047 100%)'
                            : 'linear-gradient(90deg, #FF7043 0%, #E64A19 100%)',
                          color: '#FFFFFF',
                          fontSize: 11.5,
                          fontWeight: 900,
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                        }}
                      >
                        {isWin ? '⚔️ 타이틀 방어전 신청' : '⚔️ 설욕의 복수전 신청!!'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <button
              onClick={() => setShowDefenseHistoryModal(false)}
              style={{
                padding: '9px',
                borderRadius: 12,
                border: '1px solid #D7CCC8',
                background: '#FFFFFF',
                color: '#5D4037',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
