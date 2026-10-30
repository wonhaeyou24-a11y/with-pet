// M3 화면 3: 🍂 사계절 감성 파티세리 광장 (가을 낙엽 바닥 & 펫 발자국 페이드아웃 애니메이션)
// - 분수나 주변 건물을 모두 비우고 깨끗하게 낙엽이 깔린 가을 바닥으로 조성했습니다.
// - 펫이 산책하고 이동할 때마다 낙엽 위에 귀여운 젤리 발자국이 찍히고 스르륵 사라지는 감성 모션을 지원합니다.
// - 4계절(봄·여름·가을·겨울)과 특별 이벤트(할로윈·크리스마스)로 손쉽게 전환할 수 있는 테마 시스템을 탑재했습니다.

import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import { addRibbonCoins } from '../config/boutique'
import { recordMissionAction } from '../config/missions'
import { ELEMENT_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { PLAZA_SHOWCASE_FRIENDS, type PlazaFriendEntry } from '../lib/battleEngine'
import { playDessertAsmr } from '../lib/sound'
import { supabase } from '../lib/supabase'
import MonsterView from '../monsters/MonsterView'
import { BackIcon, ElementIcon } from '../ui/Icons'

interface Props {
  myMonster: MonsterRow
  myNickname: string
  coins: number
  onEarnCoins: (delta: number) => void
  onChallenge: (friend: PlazaFriendEntry) => void
  onOpenSkillTree: () => void
  onBack: () => void
}

const CANVAS_W = 860
const CANVAS_H = 720
const CENTER_X = CANVAS_W / 2
const CENTER_Y = CANVAS_H / 2

// 4계절 및 이벤트 테마 설정
export type PlazaThemeId = 'autumn' | 'spring' | 'summer' | 'winter' | 'halloween' | 'christmas'

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

// 광장 내 캐릭터 초기 스폰 좌표 (넓고 자연스러운 분산 배치)
const PLAZA_COORDS = [
  { x: CENTER_X - 160, y: CENTER_Y - 90, rank: 1, winRate: 88 },
  { x: CENTER_X + 160, y: CENTER_Y - 90, rank: 2, winRate: 81 },
  { x: CENTER_X - 180, y: CENTER_Y + 120, rank: 3, winRate: 74 },
  { x: CENTER_X + 180, y: CENTER_Y + 120, rank: 4, winRate: 69 },
  { x: CENTER_X, y: CENTER_Y + 150, rank: 5, winRate: 62 },
]

// 🐾 광장 내 자연스러운 산책 구역 핫스팟 목록
const PLAZA_WAYPOINTS = [
  { x: CENTER_X - 180, y: CENTER_Y - 110 },
  { x: CENTER_X + 180, y: CENTER_Y - 110 },
  { x: CENTER_X - 90, y: CENTER_Y - 160 },
  { x: CENTER_X + 90, y: CENTER_Y - 160 },
  { x: CENTER_X, y: CENTER_Y },
  { x: CENTER_X - 220, y: CENTER_Y + 50 },
  { x: CENTER_X + 220, y: CENTER_Y + 50 },
  { x: CENTER_X - 140, y: CENTER_Y + 180 },
  { x: CENTER_X + 140, y: CENTER_Y + 180 },
  { x: CENTER_X, y: CENTER_Y + 210 },
]

const PET_CHATTERS = [
  '낙엽 밟는 소리 바사삭-! 🍁',
  '가을 공기 정말 시원해~ 🍂',
  '누구 친선전 할 친구? ⚔️',
  '바람에 낙엽이 흩날려요 🍃',
  '밤 주웠다 또각또각 🌰',
  '한입 투표 고마워요 🥄',
]

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
  onChallenge,
  onBack,
}: Props) {
  const [entries, setEntries] = useState<PlazaFriendEntry[]>(PLAZA_SHOWCASE_FRIENDS)
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [currentTheme, setCurrentTheme] = useState<PlazaThemeId>('autumn')
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false)

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
      setActors((prev) => {
        const next = [...prev]
        const walkerIdx = Math.floor(Math.random() * next.length)
        if (walkerIdx === selectedIdx) return prev

        const curr = next[walkerIdx]
        const targetWp = PLAZA_WAYPOINTS[Math.floor(Math.random() * PLAZA_WAYPOINTS.length)]
        const facingLeft = targetWp.x < curr.x
        const speech = Math.random() < 0.35 ? PET_CHATTERS[Math.floor(Math.random() * PET_CHATTERS.length)] : null

        const startX = curr.x
        const startY = curr.y
        const targetX = targetWp.x + (Math.random() * 24 - 12)
        const targetY = targetWp.y + (Math.random() * 24 - 12)

        const dx = targetX - startX
        const dy = targetY - startY
        const dist = Math.hypot(dx, dy)
        if (dist > 20) {
          const ux = dx / dist
          const uy = dy / dist
          const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90

          // 이동 경로에 맞춰 펫이 지나온 뒤쪽에만 순차적으로 발자국 찍기
          const steps = 3
          for (let s = 1; s <= steps; s++) {
            setTimeout(() => {
              // 해당 경과 시점의 펫 위치
              const elapsedRatio = s / (steps + 1)
              const curX = startX + dx * elapsedRatio
              const curY = startY + dy * elapsedRatio
              // 펫의 진행 반대 방향(뒤쪽 16px) 및 발밑에 발자국 배치
              const fx = curX - ux * 16
              const fy = curY - uy * 16 + 26
              stepCountRef.current += 1
              const isLeft = stepCountRef.current % 2 === 0
              addFootprint(fx, fy, isLeft, angle)
            }, s * 650)
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

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchDistRef = useRef<number | null>(null)

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
  const selLook = monsterLook(selectedFriend.monster)
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

  function handleVote(friend: PlazaFriendEntry) {
    const fid = friend.monster.id
    if (likedIds[fid]) {
      showToast('이미 오늘 한입 투표를 보냈어요!')
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
    setPan({
      x: Math.max(-280, Math.min(280, dragRef.current.originX + dx)),
      y: Math.max(-240, Math.min(240, dragRef.current.originY + dy)),
    })
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) {
      pinchDistRef.current = null
    }
    dragRef.current.active = false
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
      }}
    >
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
            <div style={{ fontSize: 10, color: '#8D6E63' }}>
              👆 드래그 탐색 · 🤏 줌인 확대 · 캐릭터 터치
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 6 }}>
          {/* 계절/이벤트 테마 변경 버튼 */}
          <button
            onClick={() => setShowThemeModal(true)}
            style={{
              padding: '4px 8px',
              borderRadius: 10,
              border: '1.5px solid #FFB74D',
              background: '#FFF8E1',
              color: '#E65100',
              fontSize: 11,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {themeObj.seasonLabel} ▾
          </button>

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
        {/* 우측 상단 줌/초기화 플로팅 컨트롤 */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
            zIndex: 25,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <button
            onClick={() => setZoom((z) => Math.min(1.85, Number((z + 0.2).toFixed(2))))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1.5px solid rgba(0,0,0,0.15)',
              background: 'rgba(255,255,255,0.92)',
              color: '#3E2723',
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
            }}
          >
            ＋
          </button>
          <button
            onClick={() => {
              setZoom(0.85)
              setPan({ x: 0, y: 0 })
            }}
            style={{
              width: 36,
              height: 28,
              padding: 0,
              whiteSpace: 'nowrap',
              borderRadius: 8,
              border: '1.5px solid rgba(0,0,0,0.15)',
              background: 'rgba(255,255,255,0.92)',
              color: '#E65100',
              fontSize: 10,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.2).toFixed(2))))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1.5px solid rgba(0,0,0,0.15)',
              background: 'rgba(255,255,255,0.92)',
              color: '#3E2723',
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
            }}
          >
            －
          </button>
        </div>

        {/* 860x720 대형 2.5D 광장 캔버스 (가을 낙엽 바닥 & 발자국 모션 월드) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
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

          {/* 내 대표 펫 산책 노드 (실제 3D Three.js 디저트 펫 디자인) */}
          {(() => {
            const myLook = monsterLook(myMonster)
            return (
              <div
                style={{
                  position: 'absolute',
                  left: CENTER_X - 55,
                  top: CENTER_Y - 70,
                  width: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {/* 내 펫 뱃지 */}
                <div
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #FF7043, #D84315)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 6px rgba(216,67,21,0.3)',
                    whiteSpace: 'nowrap',
                    marginBottom: 2,
                  }}
                >
                  ⭐ 내 파트너 (Lv.{myMonster.level})
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
                    <MonsterView
                      look={myLook}
                      size={92}
                      prefer2D={false}
                      title={myMonster.name ?? undefined}
                    />
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
            const fLook = monsterLook(friend.monster)

            return (
              <div
                key={friend.monster.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectFriend(idx)
                }}
                style={{
                  position: 'absolute',
                  left: actor.x - 55,
                  top: actor.y - 65,
                  width: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: isSelected ? 15 : 4,
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  transition: 'left 2.6s ease-in-out, top 2.6s ease-in-out, transform 0.2s ease-out',
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

                {/* 머리 위 순위 & 승률 배지 */}
                <div
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    background:
                      coord.rank === 1
                        ? 'linear-gradient(90deg, #FFD700, #FFA000)'
                        : coord.rank === 2
                          ? 'linear-gradient(90deg, #E0E0E0, #BDBDBD)'
                          : coord.rank === 3
                            ? 'linear-gradient(90deg, #FFAB91, #D84315)'
                            : '#5D4037',
                    color: coord.rank <= 2 ? '#3E2723' : '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap',
                    marginBottom: 3,
                  }}
                >
                  {coord.rank === 1 ? '👑 1위' : `${coord.rank}위`} · 승률 {coord.winRate}%
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
                    <MonsterView
                      look={fLook}
                      size={90}
                      prefer2D={false}
                      title={friend.monster.name ?? undefined}
                    />
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
        className="card tight"
        style={{
          flexShrink: 0,
          background: '#FFFDF9',
          borderTop: '2px solid #FFB74D',
          padding: '8px 12px calc(10px + env(safe-area-inset-bottom, 0px))',
          gap: 5,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
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
              <div style={{ fontSize: 10, color: '#8D6E63', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                파티시에: <strong>{selectedFriend.ownerNickname}</strong> · {selectedFriend.bio}
              </div>
            </div>
          </div>

          {/* 한입 투표 버튼 */}
          <button
            onClick={() => handleVote(selectedFriend)}
            style={{
              padding: '5px 8px',
              borderRadius: 10,
              border: '1.5px solid #FF80AB',
              background: likedIds[selectedFriend.monster.id] ? '#FF80AB' : '#FFF0F5',
              color: likedIds[selectedFriend.monster.id] ? '#FFFFFF' : '#C2185B',
              fontSize: 10,
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
            onClick={() => onChallenge(selectedFriend)}
            style={{
              padding: '8px 6px',
              fontSize: 12,
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
              addRibbonCoins(10, '친구 미니룸 방문 응원')
              recordMissionAction('w-social', 1)
              setToast(`🏰 ${selectedFriend.ownerNickname}님의 미니룸에 방명록 응원을 남겼습니다! (🎀 +10 리본)`)
              setTimeout(() => setToast(null), 3000)
            }}
            style={{
              padding: '8px 6px',
              fontSize: 12,
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
              계절의 변화와 다채로운 축제 공간으로 광장을 언제든 꾸며보세요!
            </div>

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

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
