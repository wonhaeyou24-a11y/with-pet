// M3 화면 3: 🏆 지인 디저트 인터랙티브 2.5D 파티세리 광장 맵
// 넓은 디저트 광장에 지인들의 캐릭터들이 모여 있으며,
// 줌인/줌아웃(0.75x~1.85x)과 드래그 패닝으로 광장을 둘러보고 캐릭터의 장식·꾸밈을 확대 감상하며,
// 머리 위 순위·승률 배지를 확인하고 터치 시 친선 대전 및 한입 투표를 진행합니다.

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

// 광장 내 캐릭터 초기 스폰 좌표
const PLAZA_COORDS = [
  { x: CENTER_X - 120, y: CENTER_Y - 70, rank: 1, winRate: 88, zone: '초코 분수대 앞' },
  { x: CENTER_X + 130, y: CENTER_Y - 60, rank: 2, winRate: 81, zone: '바닐라 테라스' },
  { x: CENTER_X - 160, y: CENTER_Y + 110, rank: 3, winRate: 74, zone: '마카롱 정원' },
  { x: CENTER_X + 150, y: CENTER_Y + 120, rank: 4, winRate: 69, zone: '크런치 가든' },
  { x: CENTER_X, y: CENTER_Y + 170, rank: 5, winRate: 62, zone: '광장 벤치' },
]

// 🐾 광장 내 자연스러운 산책 구역 핫스팟 목록 (돌바닥 길, 분수대 주변, 테라스, 쉼터 등)
const PLAZA_WAYPOINTS = [
  { x: CENTER_X - 120, y: CENTER_Y - 70 },
  { x: CENTER_X + 130, y: CENTER_Y - 70 },
  { x: CENTER_X - 60, y: CENTER_Y - 130 },
  { x: CENTER_X + 60, y: CENTER_Y - 130 },
  { x: CENTER_X, y: CENTER_Y + 130 },
  { x: 230, y: 190 }, // 버터 빵집 골목
  { x: 630, y: 190 }, // 롤리팝 카페 앞
  { x: 230, y: 490 }, // 부티크 샵 보도
  { x: 630, y: 490 }, // 아레나 콜로세움 앞
  { x: CENTER_X - 170, y: CENTER_Y + 30 }, // 서쪽 가로수길
  { x: CENTER_X + 170, y: CENTER_Y + 30 }, // 동쪽 가로수길
  { x: CENTER_X, y: CENTER_Y + 190 }, // 남쪽 휴식 벤치
]

const PET_CHATTERS = [
  '초코 분수 달콤해~ ⛲',
  '오늘 날씨 최고! 🌸',
  '누구 친선전 할래? ⚔️',
  '방금 구운 빵 냄새 🥐',
  '산책하니까 신나! 🐾',
  '내 방에 놀러와 💕',
]

interface PetActorState {
  x: number
  y: number
  isWalking: boolean
  facingLeft: boolean
  speech: string | null
}

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

  // 🐾 지인 캐릭터들의 자연스러운 광장 자율 산책 상태
  const [actors, setActors] = useState<PetActorState[]>(() =>
    PLAZA_COORDS.map((c) => ({
      x: c.x,
      y: c.y,
      isWalking: false,
      facingLeft: false,
      speech: null,
    })),
  )

  // 3.8초마다 캐릭터들이 자연스럽게 광장 핫스팟으로 산책
  useEffect(() => {
    const wanderTimer = window.setInterval(() => {
      setActors((prev) => {
        const next = [...prev]
        const walkerIdx = Math.floor(Math.random() * next.length)
        if (walkerIdx === selectedIdx) return prev

        const targetWp = PLAZA_WAYPOINTS[Math.floor(Math.random() * PLAZA_WAYPOINTS.length)]
        const curr = next[walkerIdx]
        const facingLeft = targetWp.x < curr.x
        const speech = Math.random() < 0.4 ? PET_CHATTERS[Math.floor(Math.random() * PET_CHATTERS.length)] : null

        next[walkerIdx] = {
          ...curr,
          x: targetWp.x + (Math.random() * 30 - 15),
          y: targetWp.y + (Math.random() * 30 - 15),
          isWalking: true,
          facingLeft,
          speech,
        }

        setTimeout(() => {
          setActors((latest) => {
            if (!latest[walkerIdx]) return latest
            const lNext = [...latest]
            lNext[walkerIdx] = {
              ...lNext[walkerIdx],
              isWalking: false,
            }
            return lNext
          })
        }, 2800)

        if (speech) {
          setTimeout(() => {
            setActors((latest) => {
              if (!latest[walkerIdx]) return latest
              const lNext = [...latest]
              lNext[walkerIdx] = {
                ...lNext[walkerIdx],
                speech: null,
              }
              return lNext
            })
          }, 3200)
        }

        return next
      })
    }, 3800)

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
        // 오프라인 폴백 세이프가드
      }
    }
    void fetchRealFriends()
    return () => {
      cancelled = true
    }
  }, [myMonster.id])

  const selectedFriend = entries[selectedIdx] ?? entries[0]
  const selLook = monsterLook(selectedFriend.monster)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  function handleSelectFriend(idx: number) {
    setSelectedIdx(idx)
    const coord = PLAZA_COORDS[idx % PLAZA_COORDS.length]
    playDessertAsmr('syrup-drizzle')
    // 부드럽게 해당 캐릭터 위치로 포커스 이동
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

    if (pointersRef.current.size === 2 && pinchDistRef.current !== null) {
      const pts = Array.from(pointersRef.current.values())
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const ratio = dist / pinchDistRef.current
      setZoom((z) => Math.max(0.7, Math.min(1.85, Number((z * ratio).toFixed(3)))))
      pinchDistRef.current = dist
      return
    }

    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.hypot(dx, dy) > 5) dragRef.current.moved = true

    setPan({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    })
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) pinchDistRef.current = null
    dragRef.current.active = false
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.12 : -0.12
    setZoom((z) => Math.max(0.7, Math.min(1.85, Number((z + delta).toFixed(2)))))
  }

  return (
    <main
      className="mobile-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: '#FAF5EE',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 1. 상단 헤더 */}
      <div
        className="row between"
        style={{
          padding: '10px 14px',
          background: '#FFFDF9',
          borderBottom: '1.5px solid #F0DFB8',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <div>
          <h1 className="title" style={{ fontSize: 16, margin: 0, textAlign: 'center' }}>
            🏰 파티세리 광장 빌리지
          </h1>
          <div style={{ fontSize: 11, color: '#8D6E63', textAlign: 'center' }}>
            👆 드래그 탐색 · 🤏 줌인 확대 · 캐릭터 터치
          </div>
        </div>
        <span className="chip honey" style={{ fontWeight: 800, fontSize: 12 }}>
          🪙 {coins}
        </span>
      </div>

      {/* 2. 2.5D 인터랙티브 광장 맵 (무스크롤 뷰포트) */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 50%, #FFF8E7 0%, #F5E6CC 100%)',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* 줌 컨트롤러 */}
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setZoom((z) => Math.min(1.85, Number((z + 0.25).toFixed(2))))}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: '#FFFDF9',
              border: '1.5px solid #D7CCC8',
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
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
              width: 38,
              height: 28,
              borderRadius: 8,
              background: '#FFFDF9',
              border: '1.5px solid #D7CCC8',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            초기화
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.25).toFixed(2))))}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: '#FFFDF9',
              border: '1.5px solid #D7CCC8',
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            －
          </button>
        </div>

        {/* 광장 캔버스 월드: 픽셀 파티세리 빌리지 (돌바닥, 빵집 건물, 롤리팝 나무, 퐁듀 분수대) */}
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
            transition: dragRef.current.active ? 'none' : 'transform 0.22s ease-out',
          }}
        >
          {/* 1. 광장 바닥 아트: 코블스톤 픽셀 돌바닥 & 베이지 보도블록 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 36,
              border: '6px solid #D7CCC8',
              backgroundColor: '#F5EBE1',
              backgroundImage: `
                radial-gradient(#D7CCC8 12%, transparent 12%),
                repeating-linear-gradient(0deg, transparent, transparent 38px, rgba(141,110,99,0.12) 38px, rgba(141,110,99,0.12) 40px),
                repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(141,110,99,0.12) 38px, rgba(141,110,99,0.12) 40px)
              `,
              backgroundSize: '40px 40px',
              boxShadow: 'inset 0 0 50px rgba(109,76,65,0.2), 0 8px 30px rgba(0,0,0,0.1)',
            }}
          />

          {/* 중앙 광장 원형 대리석 테두리 바닥 */}
          <div
            style={{
              position: 'absolute',
              left: CENTER_X - 140,
              top: CENTER_Y - 140,
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #FFFDF9 0%, #F5EBE1 70%, #E6D7C8 100%)',
              border: '4px dashed #BCAAA4',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.06)',
            }}
          />

          {/* 2. 픽셀 마을 건물들 (북서: 빵집, 북동: 카페, 남서: 부티크, 남동: 아레나, 북: 성탑) */}
          {/* 북쪽 (12시): 🏰 그랜드 파티세리 성탑 */}
          <div
            style={{
              position: 'absolute',
              left: CENTER_X - 70,
              top: 24,
              width: 140,
              height: 80,
              borderRadius: 14,
              background: 'linear-gradient(180deg, #CE93D8 0%, #BA68C8 100%)',
              border: '3px solid #7B1FA2',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
              color: '#FFFFFF',
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: 26 }}>🏰</span>
            <span style={{ fontSize: 10, fontWeight: 900, background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 8, marginTop: 2 }}>
              디저트 궁전
            </span>
          </div>

          {/* 10시 방향: 🥐 크루아상 베이커리 하우스 */}
          <div
            style={{
              position: 'absolute',
              left: 48,
              top: 50,
              width: 130,
              height: 90,
              borderRadius: 12,
              background: 'linear-gradient(180deg, #FFE082 0%, #FFB74D 100%)',
              border: '3px solid #E65100',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 12px rgba(0,0,0,0.12)',
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: 28 }}>🥐</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#3E2723', background: '#FFF8E1', padding: '1px 6px', borderRadius: 6 }}>
              버터 빵집
            </span>
          </div>

          {/* 2시 방향: ☕ 롤리팝 카페 & 야외 테라스 */}
          <div
            style={{
              position: 'absolute',
              right: 48,
              top: 50,
              width: 130,
              height: 90,
              borderRadius: 12,
              background: 'linear-gradient(180deg, #FFAB91 0%, #FF8A65 100%)',
              border: '3px solid #D84315',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 12px rgba(0,0,0,0.12)',
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: 28 }}>☕</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#3E2723', background: '#FBE9E7', padding: '1px 6px', borderRadius: 6 }}>
              롤리팝 카페
            </span>
          </div>

          {/* 8시 방향: 🎪 마카롱 부티크 공방 */}
          <div
            style={{
              position: 'absolute',
              left: 48,
              bottom: 60,
              width: 125,
              height: 85,
              borderRadius: 12,
              background: 'linear-gradient(180deg, #F8BBD0 0%, #F48FB1 100%)',
              border: '3px solid #C2185B',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 12px rgba(0,0,0,0.12)',
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: 28 }}>🎪</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#880E4F', background: '#FCE4EC', padding: '1px 6px', borderRadius: 6 }}>
              부티크 샵
            </span>
          </div>

          {/* 4시 방향: ⚔️ 배틀 아레나 콜로세움 */}
          <div
            style={{
              position: 'absolute',
              right: 48,
              bottom: 60,
              width: 125,
              height: 85,
              borderRadius: 12,
              background: 'linear-gradient(180deg, #B0BEC5 0%, #90A4AE 100%)',
              border: '3px solid #37474F',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 12px rgba(0,0,0,0.12)',
              zIndex: 2,
            }}
          >
            <span style={{ fontSize: 28 }}>⚔️</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#263238', background: '#ECEFF1', padding: '1px 6px', borderRadius: 6 }}>
              배틀 아레나
            </span>
          </div>

          {/* 3. 롤리팝 가로수 & 마카롱 꽃밭 조경 */}
          {[
            { x: 195, y: 160, icon: '🍭' },
            { x: CANVAS_W - 200, y: 160, icon: '🍭' },
            { x: 190, y: CANVAS_H - 180, icon: '🌸' },
            { x: CANVAS_W - 200, y: CANVAS_H - 180, icon: '🌸' },
            { x: CENTER_X - 170, y: CENTER_Y + 10, icon: '🌳' },
            { x: CENTER_X + 170, y: CENTER_Y + 10, icon: '🌳' },
          ].map((deco, di) => (
            <div
              key={di}
              style={{
                position: 'absolute',
                left: deco.x,
                top: deco.y,
                fontSize: 26,
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            >
              {deco.icon}
            </div>
          ))}

          {/* 4. 중앙 대리석 퐁듀 분수대 (3단 디테일 & 초콜릿 파동) */}
          <div
            style={{
              position: 'absolute',
              left: CENTER_X - 65,
              top: CENTER_Y - 65,
              width: 130,
              height: 130,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #FF4081 0%, #E91E63 60%, #880E4F 100%)',
              border: '5px solid #FFFFFF',
              boxShadow: '0 8px 26px rgba(233,30,99,0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              zIndex: 3,
            }}
          >
            <span style={{ fontSize: 36, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>⛲</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                background: 'rgba(0,0,0,0.4)',
                padding: '2px 8px',
                borderRadius: 999,
                marginTop: 2,
              }}
            >
              초코 퐁듀 분수
            </span>
          </div>

          {/* 5. 지인들의 캐릭터 노드 배치 (자연스러운 광장 산책 & 초경량 60fps 렌더링) */}
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
                  transition: 'left 2.8s ease-in-out, top 2.8s ease-in-out, transform 0.2s ease-out',
                }}
              >
                {/* 💬 자율 산책 귀여운 말풍선 */}
                {actor.speech && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -26,
                      background: '#FFFFFF',
                      border: '1.5px solid #FF80AB',
                      borderRadius: 10,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#C2185B',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
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
                    padding: '3px 8px',
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

                {/* 초경량 2.5D 캐릭터 아바타 (산책 시 뜀박질 바운스 & 좌우 반전) */}
                <div
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: '50%',
                    background: isSelected ? 'rgba(255, 235, 59, 0.35)' : 'rgba(255,255,255,0.4)',
                    border: isSelected ? '3px solid #FFD600' : '2px solid rgba(255,255,255,0.8)',
                    boxShadow: isSelected ? '0 0 16px rgba(255,214,0,0.6)' : '0 3px 10px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transform: `${actor.facingLeft ? 'scaleX(-1)' : 'scaleX(1)'} ${actor.isWalking ? 'translateY(-4px)' : 'translateY(0)'}`,
                    transition: 'transform 0.25s ease',
                  }}
                >
                  <MonsterView
                    look={fLook}
                    size={78}
                    prefer2D={true}
                    title={friend.monster.name ?? undefined}
                  />
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

      {/* 3. 하단 선택된 지인 디저트 프로필 카드 (친선전 & 한입 투표 & 3D 장식 보기) */}
      <div
        className="card tight"
        style={{
          flexShrink: 0,
          background: '#FFFDF9',
          borderTop: '2px solid #FFB74D',
          padding: '10px 14px',
          gap: 6,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
          zIndex: 20,
        }}
      >
        <div className="row between" style={{ gap: 8 }}>
          <div className="row" style={{ gap: 8, minWidth: 0, flex: 1 }}>
            <span
              style={{
                width: 48,
                height: 48,
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
              <MonsterView look={selLook} size={44} prefer2D={true} title={selectedFriend.monster.name ?? undefined} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="row" style={{ gap: 4 }}>
                <strong style={{ fontSize: 14, color: '#3E2723' }}>
                  {selectedFriend.monster.name}
                </strong>
                <span className="chip honey" style={{ fontSize: 10, padding: '1px 5px' }}>
                  Lv.{selectedFriend.monster.level}
                </span>
                <span className="chip" style={{ fontSize: 10, padding: '1px 5px' }}>
                  <ElementIcon element={selectedFriend.monster.element} size={11} />
                  {ELEMENT_INFO[selectedFriend.monster.element].label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#8D6E63', marginTop: 1 }}>
                파티시에: <strong>{selectedFriend.ownerNickname}</strong> · {selectedFriend.bio}
              </div>
            </div>
          </div>

          {/* 한입 투표 버튼 */}
          <button
            onClick={() => handleVote(selectedFriend)}
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              border: '1.5px solid #FF80AB',
              background: likedIds[selectedFriend.monster.id] ? '#FF80AB' : '#FFF0F5',
              color: likedIds[selectedFriend.monster.id] ? '#FFFFFF' : '#C2185B',
              fontSize: 11,
              fontWeight: 900,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            🥄 한입 ({selectedFriend.likes})
          </button>
        </div>

        {/* 액션 버튼 바: 친선 대전 신청 & 미니룸 방문 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
          <button
            className="btn"
            onClick={() => onChallenge(selectedFriend)}
            style={{
              padding: '9px 6px',
              fontSize: 12,
              fontWeight: 900,
              background: 'linear-gradient(90deg, #FF7A59 0%, #FF9800 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(255,122,89,0.3)',
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
              padding: '9px 6px',
              fontSize: 12,
              fontWeight: 900,
              background: 'linear-gradient(90deg, #EC4899 0%, #DB2777 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(236,72,153,0.3)',
            }}
          >
            🏰 미니룸 방문·응원
          </button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
