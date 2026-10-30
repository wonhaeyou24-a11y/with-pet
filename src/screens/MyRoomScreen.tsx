// 🏰 싸이월드 감성 파티세리 마이룸(쇼룸): 나만의 공간 꾸미기 & 가구 상호작용 & 방명록
// 100dvh 모바일 무스크롤 덱, Zero-Crash 무결성, 100% 한글 주석

import { useEffect, useState } from 'react'
import {
  addGuestBookEntry,
  addGuestBookReply,
  addRibbonCoins,
  getOwnedBoutiqueItems,
  getRibbonCoins,
  loadGuestBook,
  loadRoomCustom,
  ROOM_FURNITURE_CATALOG,
  ROOM_THEMES,
  saveRoomCustom,
  type GuestBookEntry,
  type RoomCustom,
  type RoomFurnitureDef,
  type RoomThemeDef,
} from '../config/boutique'
import { recordMissionAction } from '../config/missions'
import { monsterLook, type MonsterRow } from '../lib/api'
import { miniRoomBgm } from '../lib/bgmPlayer'
import { playDessertAsmr } from '../lib/sound'
import Monster3DView from '../monsters/Monster3DView'
import { BackIcon } from '../ui/Icons'

interface Props {
  monster: MonsterRow
  onBack: () => void
  onOpenBoutique: () => void
}

export default function MyRoomScreen({ monster, onBack, onOpenBoutique }: Props) {
  const [room, setRoom] = useState<RoomCustom>(() => loadRoomCustom())
  const [guestBook, setGuestBook] = useState<GuestBookEntry[]>(() => loadGuestBook())
  const [ribbonCoins, setCoinsState] = useState<number>(() => getRibbonCoins())
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [ownedItems] = useState<Set<string>>(() => getOwnedBoutiqueItems())
  const [toast, setToast] = useState<string | null>(null)
  const [newComment, setNewComment] = useState<string>('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<string>('')
  const [petActionState, setPetActionState] = useState<string>('방 안을 총총 거닐며 디저트 향기를 맡고 있어요 🌸')
  const [bouncePet, setBouncePet] = useState<boolean>(false)
  const [bgmPlaying, setBgmPlaying] = useState<boolean>(() => miniRoomBgm.getStatus())

  // 화면 나갈 때 BGM 정리
  useEffect(() => {
    return () => {
      miniRoomBgm.stop()
    }
  }, [])

  const handleToggleBgm = () => {
    const nextState = miniRoomBgm.toggle()
    setBgmPlaying(nextState)
    if (nextState) {
      showToast('🎵 달콤 파티세리의 오후 햇살 왈츠 BGM을 재생합니다!')
    } else {
      showToast('⏸️ BGM을 일시 정지했습니다.')
    }
  }

  const currentTheme: RoomThemeDef = ROOM_THEMES.find((t) => t.id === room.themeId) ?? ROOM_THEMES[0]
  const look = monsterLook(monster)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }

  // 테마 변경
  const handleSelectTheme = (theme: RoomThemeDef) => {
    if (!ownedItems.has(theme.id) && theme.price > 0) {
      showToast('아직 구매하지 않은 테마입니다. 부티크에서 구매해보세요!')
      return
    }
    const nextRoom = { ...room, themeId: theme.id }
    setRoom(nextRoom)
    saveRoomCustom(nextRoom)
    playDessertAsmr('mochi-squish')
    showToast(`✨ ${theme.name}으로 벽지와 바닥을 바꿨습니다!`)
  }

  // 가구 배치 토글
  const handleToggleFurniture = (furn: RoomFurnitureDef) => {
    if (!ownedItems.has(furn.id)) {
      showToast('아직 구매하지 않은 가구입니다. 부티크에서 구매해보세요!')
      return
    }
    const isPlaced = room.placedFurniture.includes(furn.id)
    const nextList = isPlaced
      ? room.placedFurniture.filter((id) => id !== furn.id)
      : [...room.placedFurniture, furn.id]

    const nextRoom = { ...room, placedFurniture: nextList }
    setRoom(nextRoom)
    saveRoomCustom(nextRoom)
    playDessertAsmr(furn.soundKind)
    showToast(isPlaced ? `${furn.name}을(를) 보관함에 넣었습니다.` : `🛋️ ${furn.name}을(를) 방에 배치했습니다!`)
  }

  // 가구 터치 시 상호작용 액션
  const handleInteractFurniture = (furn: RoomFurnitureDef) => {
    playDessertAsmr(furn.soundKind)
    setBouncePet(true)
    window.setTimeout(() => setBouncePet(false), 800)

    if (furn.id === 'trampoline-jelly') {
      setPetActionState(`🎪 젤리 트램펄린에서 뽀용뽀용 신나게 점프하고 있어요! (+기분 최고 ✨)`)
    } else if (furn.id === 'sofa-macaron') {
      setPetActionState(`🛋️ 마카롱 푹신 소파에 기대어 쿨쿨 낮잠을 자고 있어요 💤`)
    } else if (furn.id === 'fountain-choco') {
      setPetActionState(`⛲ 초코 분수대에서 따뜻한 가나슈를 콕 찍어 먹고 있어요 🍫`)
    } else if (furn.id === 'table-pretzel') {
      setPetActionState(`🪑 프레첼 테이블에서 향긋한 딸기 홍차를 마시고 있어요 ☕`)
    } else if (furn.id === 'sofa-parfait') {
      setPetActionState(`🍓🛋️ 생딸기 파르페 소파의 도톰한 벨벳 생크림에 푹 파묻혀 뒹굴고 있어요! (+행복도 MAX ✨)`)
    } else if (furn.id === 'lamp-fondue') {
      setPetActionState(`🫕💡 퐁듀 초콜릿 무드 램프의 따스하고 달콤한 불빛 아래서 온기를 쬐고 있어요 🕯️`)
    } else if (furn.id === 'stool-macaron') {
      setPetActionState(`🍬🪑 파스텔 마카롱 벨벳 스툴에 총총 올라앉아 다리를 흔들거리고 있어요 🎵`)
    } else if (furn.id === 'clock-pretzel') {
      setPetActionState(`🥨⏰ 골든 프레첼 벽시계가 째깍째깍 울릴 때마다 고개를 갸우뚱거려요 ⏳`)
    } else if (furn.id === 'rug-waffle') {
      setPetActionState(`🧇🧶 와플 체크 메이플 러그의 달콤한 시럽 향기에 취해 뒹굴뒹굴 누웠어요 🍯`)
    } else {
      setPetActionState(`💡 ${furn.name}을(를) 호기심 가득한 눈으로 톡톡 건드려봅니다!`)
    }
  }

  // 좋아요(응원 하트) 누르기
  const handleLikeRoom = () => {
    playDessertAsmr('sugar-crack')
    const nextRoom = { ...room, likes: room.likes + 1 }
    setRoom(nextRoom)
    saveRoomCustom(nextRoom)
    const earned = addRibbonCoins(5, '룸 좋아요')
    setCoinsState(earned)
    showToast('❤️ 룸에 사랑의 하트를 보냈습니다! (+5 🎀 리본 코인)')
  }

  // 방명록 등록
  const handleAddComment = () => {
    if (!newComment.trim()) return
    playDessertAsmr('cookie-crisp')
    const updated = addGuestBookEntry('나의 절친 파티시에', newComment)
    setGuestBook(updated)
    setNewComment('')
    const earned = addRibbonCoins(10, '방명록 작성')
    setCoinsState(earned)
    recordMissionAction('w-social', 1)
    showToast('📝 방명록을 남겼습니다! (+10 🎀 리본 코인 획득)')
  }

  // 방명록 답글(대댓글) 등록
  const handleAddReply = (entryId: string) => {
    const text = replyText.trim()
    if (!text) return
    playDessertAsmr('mochi-squish')
    const myName = monster.name ? `${monster.name} 집사` : '방 주인 파티시에'
    const updated = addGuestBookReply(entryId, myName, text)
    setGuestBook(updated)
    setReplyText('')
    setReplyingToId(null)
    const earned = addRibbonCoins(5, '방명록 답글')
    setCoinsState(earned)
    showToast('💌 친구의 방명록에 답글을 남겼습니다! (+5 🎀 리본 코인 획득)')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        maxHeight: '100dvh',
        background: '#FFF5F7',
        color: '#4A2E2B',
        overflow: 'hidden',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* 1. 상단 미니홈피 헤더바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: '#FFFFFF',
          borderBottom: '1px solid #FCE7F3',
          boxShadow: '0 2px 8px rgba(244,114,182,0.08)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onBack}
            style={{
              background: '#FFF0F5',
              border: '1px solid #FBCFE8',
              borderRadius: 10,
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <BackIcon size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#9D174D' }}>
                🏰 {monster.name}의 미니룸
              </span>
              <span style={{ fontSize: 10, color: '#10B981', fontWeight: 800 }}>● ON</span>
            </div>
            <div style={{ fontSize: 10, color: '#BE185D', fontWeight: 600 }}>
              TODAY <b style={{ color: '#E11D48' }}>{room.todayVisitors}</b> | TOTAL {room.totalVisitors}
            </div>
          </div>
        </div>

        {/* BGM 및 부티크 바로가기 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onOpenBoutique}
            style={{
              padding: '5px 9px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 11,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(219,39,119,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span>🛍️ 부티크</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 16,
              background: '#FDF2F8',
              border: '1px solid #F472B6',
            }}
          >
            <span style={{ fontSize: 13 }}>🎀</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#BE185D' }}>{ribbonCoins}</span>
          </div>
        </div>
      </div>

      {/* 2. 감성 BGM 티커 & 편집 토글 바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px',
          background: '#FFF0F5',
          borderBottom: '1px solid #FBCFE8',
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleToggleBgm}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: bgmPlaying ? '#FCE7F3' : '#FFFFFF',
            border: '1px solid #F472B6',
            borderRadius: 8,
            padding: '2px 8px',
            color: '#831843',
            fontWeight: 800,
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          <span>{bgmPlaying ? '🔊 BGM ON' : '🔈 BGM OFF'}</span>
          <span style={{ color: '#BE185D' }}>오후 햇살 왈츠 ♬</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '3px 8px',
              borderRadius: 8,
              border: '1px solid #F472B6',
              background: isEditing ? '#F472B6' : '#FFFFFF',
              color: isEditing ? '#FFFFFF' : '#BE185D',
              fontWeight: 800,
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            {isEditing ? '완료' : '🎨 룸 꾸미기'}
          </button>
          <button
            onClick={handleLikeRoom}
            style={{
              padding: '3px 8px',
              borderRadius: 8,
              border: '1px solid #FDA4AF',
              background: '#FFF1F2',
              color: '#E11D48',
              fontWeight: 800,
              fontSize: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span>❤️</span>
            <span>{room.likes}</span>
          </button>
        </div>
      </div>

      {/* 3. 싸이월드 감성 룸 캔버스 스테이지 */}
      <div
        style={{
          height: 185,
          minHeight: 185,
          maxHeight: 185,
          position: 'relative',
          margin: '4px 12px',
          borderRadius: 16,
          background: currentTheme.wallBg,
          border: '2px solid #FBCFE8',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.06), 0 4px 14px rgba(244,114,182,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* 상단 벽면 (감성 레이스 창문 & 파티세리 벽면 선반 & 네온 레터링) */}
        <div style={{ flex: 1, position: 'relative', padding: 8 }}>
          {/* 1. 감성 레이스 창문 */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 10,
              width: 52,
              height: 46,
              borderRadius: '12px 12px 2px 2px',
              border: '2.5px solid #FFFFFF',
              background: 'linear-gradient(180deg, #BAE6FD 0%, #E0F2FE 70%, #FFFDF9 100%)',
              boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 레이스 커튼 테두리 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 8,
                background: 'repeating-linear-gradient(90deg, #FFFFFF 0px, #FFFFFF 6px, #FCE7F3 6px, #FCE7F3 12px)',
                opacity: 0.9,
              }}
            />
            <span style={{ fontSize: 18, marginTop: 4 }}>🌤️</span>
          </div>

          {/* 2. 네온사인 레터링 */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '2px 10px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1.5px solid #FBCFE8',
              boxShadow: '0 2px 8px rgba(244,114,182,0.25)',
              fontSize: 10,
              fontWeight: 900,
              color: '#BE185D',
              whiteSpace: 'nowrap',
            }}
          >
            💖 Sweet Patisserie Home
          </div>

          {/* 3. 벽면 디저트 선반 & 미니 액자 */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
            }}
          >
            {/* 우정 사진 액자 */}
            <div
              style={{
                padding: '2px 6px',
                background: '#FFFFFF',
                border: '1.5px solid #FBCFE8',
                borderRadius: 6,
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span style={{ fontSize: 11 }}>🖼️</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#9D174D' }}>우정 사진</span>
            </div>
            {/* 미니 디저트 선반 */}
            <div
              style={{
                padding: '1px 5px',
                background: '#EFEBE9',
                borderBottom: '2px solid #8D6E63',
                borderRadius: 3,
                fontSize: 10,
                display: 'flex',
                gap: 2,
              }}
            >
              <span>🍯</span>
              <span>🍪</span>
            </div>
          </div>

          {/* 4. 바닥 보송보송 하트 러그 (3D 펫 발밑) */}
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 140,
              height: 48,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, #FCE7F3 0%, #FBCFE8 65%, transparent 70%)',
              border: '1.5px dashed #F472B6',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EC4899',
              fontSize: 11,
              opacity: 0.85,
            }}
          >
            🌸
          </div>

          {/* 5. 중앙 3D 펫 모델 (자유 포즈 & 콩콩 모션) */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: `translateX(-50%) ${bouncePet ? 'translateY(-14px) scale(1.08)' : 'translateY(0)'}`,
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              width: 130,
              height: 130,
              zIndex: 3,
            }}
          >
            <Monster3DView look={look} size={130} fluid interactive />
          </div>
        </div>

        {/* 하단 바닥 레이어 (배치된 가구들) */}
        <div
          style={{
            height: 65,
            background: currentTheme.floorBg,
            borderTop: '2px solid rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 10px',
            position: 'relative',
            zIndex: 4,
          }}
        >
          {room.placedFurniture.map((furnId) => {
            const furn = ROOM_FURNITURE_CATALOG.find((f) => f.id === furnId)
            if (!furn) return null
            return (
              <button
                key={furn.id}
                onClick={() => handleInteractFurniture(furn)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: 'translateY(-8px)',
                  padding: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.25))',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {furn.icon}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 900,
                    background: '#FFFFFF',
                    padding: '1px 4px',
                    borderRadius: 4,
                    color: '#4E342E',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    marginTop: -2,
                  }}
                >
                  {furn.actionLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. 펫의 실시간 행동 대사 카드 */}
      <div
        style={{
          margin: '0 12px 4px',
          padding: '6px 10px',
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #FCE7F3',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 1px 4px rgba(244,114,182,0.08)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 16 }}>💬</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#831843',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {petActionState}
        </span>
      </div>

      {/* 5. 룸 꾸미기 편집 패널 or 방명록 (탭 형태) */}
      <div
        style={{
          flex: 1,
          margin: '0 12px 8px',
          borderRadius: 14,
          background: '#FFFFFF',
          border: '1.5px solid #FBCFE8',
          boxShadow: '0 2px 8px rgba(244,114,182,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {isEditing ? (
          /* 5-A. 룸 꾸미기 편집 모드 */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#9D174D' }}>
                🎨 벽지 테마 & 가구 배치 변경
              </span>
              <button
                onClick={onOpenBoutique}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#FDF2F8',
                  color: '#BE185D',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                + 새 가구 쇼핑하러 가기
              </button>
            </div>

            {/* 벽지 테마 선택 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {ROOM_THEMES.map((theme) => {
                const isSelected = room.themeId === theme.id
                const isOwned = ownedItems.has(theme.id) || theme.price === 0
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 8,
                      border: isSelected ? '2px solid #EC4899' : '1px solid #E5E7EB',
                      background: isSelected ? '#FDF2F8' : '#F9FAFB',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <span>{theme.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#4E342E' }}>{theme.name}</span>
                    {!isOwned && <span style={{ fontSize: 9, color: '#E11D48' }}>🔒</span>}
                  </button>
                )
              })}
            </div>

            {/* 가구 배치 토글 */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {ROOM_FURNITURE_CATALOG.map((furn) => {
                const isPlaced = room.placedFurniture.includes(furn.id)
                const isOwned = ownedItems.has(furn.id) || furn.price === 0
                return (
                  <div
                    key={furn.id}
                    onClick={() => handleToggleFurniture(furn)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 10,
                      border: isPlaced ? '2px solid #10B981' : '1px solid #E5E7EB',
                      background: isPlaced ? '#ECFDF5' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 20 }}>{furn.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#4E342E' }}>{furn.name}</div>
                        <div style={{ fontSize: 9, color: '#6B7280' }}>매력 +{furn.charm}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        color: isPlaced ? '#059669' : isOwned ? '#6B7280' : '#E11D48',
                      }}
                    >
                      {isPlaced ? '배치됨' : isOwned ? '보관중' : '미보유'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* 5-B. 싸이월드 감성 방명록(일촌평/방문 한마디) */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#9D174D' }}>
                📖 방명록 (지인들의 방문 한마디)
              </span>
              <span style={{ fontSize: 10, color: '#6B7280' }}>총 {guestBook.length}개</span>
            </div>

            {/* 방명록 입력창 (모바일 자동 줌 방지 fontSize: 16px 적용) */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="친구에게 따뜻한 한마디를 남겨보세요! (+10 🎀)"
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: '1.5px solid #FBCFE8',
                  fontSize: 16,
                  outline: 'none',
                  background: '#FFFFFF',
                  color: '#4A2E2B',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddComment()
                }}
              />
              <button
                onClick={handleAddComment}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(219,39,119,0.25)',
                }}
              >
                남기기
              </button>
            </div>

            {/* 방명록 목록 (시원한 폰트 크기 및 스크롤 & 답글(대댓글) 지원) */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {guestBook.map((entry) => {
                const isReplying = replyingToId === entry.id
                const replyCount = entry.replies?.length ?? 0

                return (
                  <div
                    key={entry.id}
                    style={{
                      padding: '9px 11px',
                      borderRadius: 12,
                      background: '#FFFFFF',
                      border: '1px solid #FCE7F3',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      boxShadow: '0 1px 4px rgba(244,114,182,0.06)',
                    }}
                  >
                    {/* 상단: 작성자 및 시간 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 18 }}>{entry.icon}</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#9D174D' }}>{entry.author}</span>
                        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{entry.createdAt}</span>
                      </div>
                    </div>

                    {/* 본문 메시지 */}
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#4E342E',
                        lineHeight: 1.35,
                        paddingLeft: 25,
                        wordBreak: 'break-word',
                      }}
                    >
                      {entry.message}
                    </div>

                    {/* 답글 토글 버튼 바 */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingLeft: 25 }}>
                      <button
                        onClick={() => {
                          if (isReplying) {
                            setReplyingToId(null)
                            setReplyText('')
                          } else {
                            setReplyingToId(entry.id)
                            setReplyText('')
                            playDessertAsmr('mochi-squish')
                          }
                        }}
                        style={{
                          background: isReplying ? '#FDF2F8' : '#FFF0F5',
                          border: isReplying ? '1px solid #EC4899' : '1px solid #FBCFE8',
                          borderRadius: 8,
                          padding: '3px 8px',
                          fontSize: 10,
                          fontWeight: 800,
                          color: '#BE185D',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <span>💬</span>
                        <span>{isReplying ? '답글 닫기' : replyCount > 0 ? `답글 ${replyCount}개` : '답글 달기'}</span>
                      </button>
                    </div>

                    {/* 대댓글(답글) 목록 */}
                    {replyCount > 0 && (
                      <div
                        style={{
                          marginLeft: 18,
                          borderLeft: '2px solid #F472B6',
                          paddingLeft: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        {entry.replies?.map((rep) => (
                          <div
                            key={rep.id}
                            style={{
                              background: '#FFF8F9',
                              padding: '5px 8px',
                              borderRadius: 8,
                              border: '1px solid #FCE7F3',
                              fontSize: 11,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                              <span style={{ fontWeight: 900, color: '#BE185D', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span>↳</span>
                                <span>{rep.icon || '🍰'}</span>
                                <span>{rep.author}</span>
                              </span>
                              <span style={{ fontSize: 9, color: '#9CA3AF' }}>{rep.createdAt}</span>
                            </div>
                            <div style={{ color: '#4E342E', fontWeight: 600, paddingLeft: 14, wordBreak: 'break-word' }}>
                              {rep.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 인라인 답글 입력창 (토글 시 출현) */}
                    {isReplying && (
                      <div
                        style={{
                          marginLeft: 18,
                          marginTop: 4,
                          display: 'flex',
                          gap: 4,
                          animation: 'fadeIn 0.2s ease',
                        }}
                      >
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="친구에게 답글 남기기... (+5 🎀)"
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1.5px solid #EC4899',
                            fontSize: 16, // 모바일 자동 줌인 방지
                            outline: 'none',
                            background: '#FFFFFF',
                            color: '#4A2E2B',
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddReply(entry.id)
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddReply(entry.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                            color: '#FFFFFF',
                            fontSize: 11,
                            fontWeight: 900,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          답글
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 상단 알림창 박스 (Notification Banner) */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: 16,
            border: '1.5px solid #F472B6',
            fontSize: 12,
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            zIndex: 9999,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <span>🔔</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
