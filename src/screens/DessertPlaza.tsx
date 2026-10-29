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

// 광장 내 캐릭터 스폰 좌표 (분수대 주변, 테라스, 잔디밭 등)
const PLAZA_COORDS = [
  { x: CENTER_X - 120, y: CENTER_Y - 70, rank: 1, winRate: 88, zone: '초코 분수대 앞' },
  { x: CENTER_X + 130, y: CENTER_Y - 60, rank: 2, winRate: 81, zone: '바닐라 테라스' },
  { x: CENTER_X - 160, y: CENTER_Y + 110, rank: 3, winRate: 74, zone: '마카롱 정원' },
  { x: CENTER_X + 150, y: CENTER_Y + 120, rank: 4, winRate: 69, zone: '크런치 가든' },
  { x: CENTER_X, y: CENTER_Y + 170, rank: 5, winRate: 62, zone: '광장 벤치' },
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

        {/* 광장 캔버스 월드 */}
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
          {/* 광장 바닥 아트 (디저트 타일 & 분수대) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 40,
              border: '4px dashed #E0CFB5',
              background: 'repeating-linear-gradient(45deg, #FFFDF8, #FFFDF8 20px, #FDF7EC 20px, #FDF7EC 40px)',
              boxShadow: 'inset 0 0 40px rgba(141,110,99,0.15)',
            }}
          />

          {/* 중앙 달콤 퐁듀 분수대 */}
          <div
            style={{
              position: 'absolute',
              left: CENTER_X - 60,
              top: CENTER_Y - 60,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #FF80AB 0%, #FF4081 70%, #F50057 100%)',
              border: '4px solid #FFFFFF',
              boxShadow: '0 8px 24px rgba(255,64,129,0.3)',
              display: 'grid',
              placeItems: 'center',
              color: '#FFFFFF',
              fontSize: 32,
              zIndex: 2,
            }}
          >
            ⛲
            <span
              style={{
                position: 'absolute',
                bottom: 6,
                fontSize: 10,
                fontWeight: 900,
                background: 'rgba(0,0,0,0.4)',
                padding: '1px 6px',
                borderRadius: 999,
              }}
            >
              디저트 분수
            </span>
          </div>

          {/* 지인들의 캐릭터 노드 배치 */}
          {entries.slice(0, PLAZA_COORDS.length).map((friend, idx) => {
            const coord = PLAZA_COORDS[idx]
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
                  left: coord.x - 55,
                  top: coord.y - 65,
                  width: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: isSelected ? 10 : 3,
                  transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                }}
              >
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
                    marginBottom: 2,
                  }}
                >
                  {coord.rank === 1 ? '👑 1위' : `${coord.rank}위`} · 승률 {coord.winRate}%
                </div>

                {/* 3D 캐릭터 아바타 */}
                <div
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    background: isSelected ? 'rgba(255, 235, 59, 0.25)' : 'transparent',
                    border: isSelected ? '2px solid #FFD600' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <MonsterView look={fLook} size={84} title={friend.monster.name ?? undefined} />
                </div>

                {/* 캐릭터 이름 & 주인 닉네임 */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#3E2723',
                    background: 'rgba(255,255,255,0.92)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    marginTop: 2,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    maxWidth: 100,
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
              <MonsterView look={selLook} size={44} title={selectedFriend.monster.name ?? undefined} />
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
