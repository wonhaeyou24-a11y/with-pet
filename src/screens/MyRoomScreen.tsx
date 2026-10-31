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
import { IS_DEV_MOCK } from '../lib/devMode'
import { refreshAccount } from '../lib/shopApi'
import { guestbookAdd, guestbookDelete, roomGet, roomLike, roomSave, type RoomEntryRaw } from '../lib/roomApi'
import { miniRoomBgm, BGM_TRACKS, type BgmTrack } from '../lib/bgmPlayer'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import Monster3DView from '../monsters/Monster3DView'
import { BackIcon } from '../ui/Icons'

interface Props {
  monster: MonsterRow
  onBack: () => void
  onOpenBoutique: () => void
  // 지인의 방을 방문할 때: 방 주인 정보 (비우면 내 방)
  visit?: { ownerId: string; nickname: string; monster: MonsterRow }
}

// "방금 전 / N분 전 / N시간 전 / N일 전"
function relTime(iso: string): string {
  const sec = Math.max(0, (Date.now() - Date.parse(iso)) / 1000)
  if (!Number.isFinite(sec) || sec < 60) return '방금 전'
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`
  return `${Math.floor(sec / 86400)}일 전`
}

// 서버의 평평한 글 목록을 "글 + 답글" 모양으로 묶는다
function groupEntries(list: RoomEntryRaw[]): GuestBookEntry[] {
  const tops = list.filter((e) => !e.parentId)
  return tops.map((e) => ({
    id: e.id,
    authorId: e.authorId,
    author: e.author,
    message: e.message,
    createdAt: relTime(e.createdAt),
    icon: '✨',
    replies: list
      .filter((r) => r.parentId === e.id)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .map((r) => ({ id: r.id, authorId: r.authorId, author: r.author, message: r.message, createdAt: relTime(r.createdAt), icon: '🍰' })),
  }))
}

export default function MyRoomScreen({ monster: myMonster, onBack, onOpenBoutique, visit }: Props) {
  // 방 주인의 몬스터 (내 방이면 내 몬스터, 방문이면 지인의 몬스터)
  const monster = visit?.monster ?? myMonster
  const isVisitor = !!visit
  const ownerId = visit?.ownerId
  const [myId, setMyId] = useState<string | null>(null)
  const [likedToday, setLikedToday] = useState(false)
  const [busy, setBusy] = useState(false)
  // 실제 서비스에서는 서버에서 받아 오기 전까지 빈 방으로 시작한다 (폰 안의 가짜 숫자를 보여 주지 않는다)
  const [room, setRoom] = useState<RoomCustom>(() =>
    IS_DEV_MOCK ? loadRoomCustom() : { themeId: 'room-patisserie', placedFurniture: [], bgmId: 'patisserie-sweet', todayVisitors: 0, totalVisitors: 0, likes: 0 },
  )
  const [guestBook, setGuestBook] = useState<GuestBookEntry[]>(() => (IS_DEV_MOCK ? loadGuestBook() : []))
  const [ribbonCoins, setCoinsState] = useState<number>(() => getRibbonCoins())
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [ownedItems, setOwnedItems] = useState<Set<string>>(() => getOwnedBoutiqueItems())
  const [toast, setToast] = useState<string | null>(null)
  // 실제 서비스: 열 때 서버의 최신 리본 코인·보유 아이템을 받아 온다
  useEffect(() => {
    if (IS_DEV_MOCK) return
    void refreshAccount().then(() => {
      setCoinsState(getRibbonCoins())
      setOwnedItems(new Set(getOwnedBoutiqueItems()))
    })
  }, [])
  const [newComment, setNewComment] = useState<string>('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<string>('')
  const [petActionState, setPetActionState] = useState<string>('방 안을 총총 거닐며 디저트 향기를 맡고 있어요 🌸')
  const [bouncePet, setBouncePet] = useState<boolean>(false)
  const [petActivity, setPetActivity] = useState<'idle' | 'sleep' | 'jump' | 'eat' | 'walk'>('idle')
  const [petPosX, setPetPosX] = useState<number>(0) // -65 ~ +65px
  const [footprints, setFootprints] = useState<{ id: number; x: number; y: number }[]>([])
  const [roomTier, setRoomTier] = useState<1 | 2 | 3>(() => {
    if (monster.level >= 15 || (monster.evo_stage ?? 1) >= 3) return 2
    return 1
  })
  const [bgmPlaying, setBgmPlaying] = useState<boolean>(() => miniRoomBgm.getStatus())
  const [currentTrack, setCurrentTrack] = useState<BgmTrack>(() => miniRoomBgm.getTrack())
  const [showBgmPicker, setShowBgmPicker] = useState<boolean>(false)

  // 🐾 발자국 도트 생성 헬퍼 (산책/이동 시 바닥에 달콤한 파티클 남기기)
  const addFootprint = (x: number) => {
    const newDot = { id: Date.now() + Math.random(), x, y: 0 }
    setFootprints((prev) => [...prev.slice(-8), newDot])
    window.setTimeout(() => {
      setFootprints((prev) => prev.filter((d) => d.id !== newDot.id))
    }, 4000)
  }

  // 🏡 펫 자율 리빙 루틴: 14초마다 스스로 가구로 다가가거나 기지개 켜기
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (room.placedFurniture.length === 0) {
        // 가구가 없을 때는 좌우 가벼운 산책
        const nextX = (Math.random() - 0.5) * 80
        setPetPosX(nextX)
        setPetActivity('walk')
        addFootprint(nextX)
        setPetActionState('방 안을 가볍게 사뿐사뿐 산책하고 있어요 🐾')
        window.setTimeout(() => setPetActivity('idle'), 3500)
        return
      }

      // 배치된 가구 중 하나로 자율 이동
      const randomFurnId = room.placedFurniture[Math.floor(Math.random() * room.placedFurniture.length)]
      const targetFurn = ROOM_FURNITURE_CATALOG.find((f) => f.id === randomFurnId)
      if (targetFurn) {
        handleInteractFurniture(targetFurn, true)
      }
    }, 14000)

    return () => window.clearInterval(interval)
  }, [room.placedFurniture])

  // 🎵 미니룸 입장 시 힐링 BGM 자동 재생 & 화면 나갈 때 정리
  useEffect(() => {
    const startBgm = () => {
      try {
        miniRoomBgm.start()
        setBgmPlaying(miniRoomBgm.getStatus())
      } catch {}
    }

    // 진입 즉시 재생 시도
    startBgm()

    // 브라우저 Autoplay 차단 정책 대응: 사용자 첫 터치 시 즉시 재생 활성화
    const handleFirstInteract = () => {
      if (!miniRoomBgm.getStatus()) {
        startBgm()
      }
    }
    window.addEventListener('pointerdown', handleFirstInteract, { once: true })

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteract)
      miniRoomBgm.stop()
    }
  }, [])

  const handleToggleBgm = () => {
    const nextState = miniRoomBgm.toggle()
    setBgmPlaying(nextState)
    if (nextState) {
      const info = BGM_TRACKS.find(t => t.id === currentTrack) ?? BGM_TRACKS[0]
      showToast(`${info.icon} [${info.name}] 사운드를 재생합니다!`)
    } else {
      showToast('⏸️ BGM을 일시 정지했습니다.')
    }
  }

  const handleSelectTrack = (track: BgmTrack) => {
    miniRoomBgm.setTrack(track)
    setCurrentTrack(track)
    setBgmPlaying(true)
    setShowBgmPicker(false)
    const info = BGM_TRACKS.find(t => t.id === track) ?? BGM_TRACKS[0]
    showToast(`✨ BGM이 [${info.icon} ${info.name}]으로 변경되었습니다!`)
  }

  const currentTheme: RoomThemeDef = ROOM_THEMES.find((t) => t.id === room.themeId) ?? ROOM_THEMES[0]
  const look = monsterLook(monster)

  // 실제 서비스: 방 설정·방명록·좋아요 수는 서버에서 받아 온다
  const reloadRoom = async () => {
    const r = await roomGet(ownerId)
    if (!r.ok) {
      showToast(r.message ?? '방 정보를 불러오지 못했어요.')
      return
    }
    setMyId(r.me ?? null)
    setLikedToday(!!r.likedToday)
    setRoom({
      themeId: r.theme ?? 'room-patisserie',
      placedFurniture: r.furniture ?? [],
      bgmId: 'patisserie-sweet',
      todayVisitors: r.todayVisitors ?? 0,
      totalVisitors: r.totalVisitors ?? 0,
      likes: r.likes ?? 0,
    })
    setGuestBook(groupEntries(r.entries ?? []))
  }
  useEffect(() => {
    if (!IS_DEV_MOCK) void reloadRoom()
    // 방을 열 때(또는 다른 지인의 방으로 바뀔 때) 한 번 받아 온다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId])

  // 방 꾸미기 저장: 실제 서비스에서는 서버가 산 아이템만 받아 준다
  const persistRoom = async (next: RoomCustom) => {
    if (IS_DEV_MOCK) {
      saveRoomCustom(next)
      return
    }
    const r = await roomSave(next.themeId, next.placedFurniture)
    if (!r.ok) {
      showToast(r.message ?? '저장하지 못했어요.')
      void reloadRoom()
    }
  }

  // 글을 지울 수 있는 사람: 방 주인은 모든 글, 작성자는 자기 글
  const canDelete = (authorId?: string) => !IS_DEV_MOCK && (!isVisitor || (!!authorId && authorId === myId))
  const handleDelete = async (id: string) => {
    if (busy) return
    setBusy(true)
    const r = await guestbookDelete(id)
    setBusy(false)
    showToast(r.ok ? '🗑️ 방명록 글을 지웠어요.' : (r.message ?? '지우지 못했어요.'))
    void reloadRoom()
  }

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
    if (isVisitor) return
    const nextRoom = { ...room, themeId: theme.id }
    setRoom(nextRoom)
    void persistRoom(nextRoom)
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

    if (isVisitor) return
    const nextRoom = { ...room, placedFurniture: nextList }
    setRoom(nextRoom)
    void persistRoom(nextRoom)
    playDessertAsmr(furn.soundKind)
    showToast(isPlaced ? `${furn.name}을(를) 보관함에 넣었습니다.` : `🛋️ ${furn.name}을(를) 방에 배치했습니다!`)
  }

  // 가구 터치 시 상호작용 액션 (펫이 직접 해당 가구로 다가가 상호작용)
  const handleInteractFurniture = (furn: RoomFurnitureDef, isAutonomous = false) => {
    playDessertAsmr(furn.soundKind)
    setBouncePet(true)

    // 배치된 순서에 따른 가구 X 좌표 계산 (-50 ~ +50px)
    const idx = room.placedFurniture.indexOf(furn.id)
    const total = Math.max(1, room.placedFurniture.length)
    const computedX = total === 1 ? 0 : -55 + (idx / (total - 1)) * 110
    setPetPosX(computedX)
    addFootprint(computedX)

    if (furn.id === 'trampoline-jelly') {
      setPetActivity('jump')
      setPetActionState(
        isAutonomous
          ? `🎪 스스로 젤리 트램펄린에 올라가 뽀용뽀용 신나게 점프하고 있어요! (+기분 최고 ✨)`
          : `🎪 젤리 트램펄린에서 뽀용뽀용 높이 점프하며 깔깔 웃고 있어요! (+행복도 UP ✨)`,
      )
      window.setTimeout(() => {
        setBouncePet(false)
        setPetActivity('idle')
      }, 3000)
    } else if (furn.id === 'sofa-macaron' || furn.id === 'sofa-parfait') {
      setPetActivity('sleep')
      setPetActionState(
        isAutonomous
          ? `🛋️ 스르륵 폭신한 소파로 걸어가 베개를 베고 쿨쿨 낮잠을 청하고 있어요 💤`
          : `🛋️ 푹신 소파의 생크림 쿠션에 푹 기대어 쿨쿨 잠이 들었어요 💤 (+피로 회복 중)`,
      )
      window.setTimeout(() => setBouncePet(false), 800)
      window.setTimeout(() => setPetActivity('idle'), 4500)
    } else if (furn.id === 'fountain-choco') {
      setPetActivity('eat')
      setPetActionState(`⛲ 초코 분수대 앞으로 달려가 따뜻한 가나슈를 콕 찍어 달콤하게 냠냠 먹고 있어요 🍫 (+포만감 가득)`)
      window.setTimeout(() => setBouncePet(false), 800)
      window.setTimeout(() => setPetActivity('idle'), 3500)
    } else if (furn.id === 'table-pretzel') {
      setPetActivity('eat')
      setPetActionState(`🪑 프레첼 테이블 앞에 앉아 향긋한 딸기 홍차를 꼴깍 마시며 티타임을 즐겨요 ☕`)
      window.setTimeout(() => setBouncePet(false), 800)
      window.setTimeout(() => setPetActivity('idle'), 3500)
    } else if (furn.id === 'lamp-fondue') {
      setPetActivity('idle')
      setPetActionState(`🫕💡 퐁듀 초콜릿 무드 램프 앞으로 다가가 은은한 온기를 쬐며 눈을 반짝여요 🕯️`)
      window.setTimeout(() => setBouncePet(false), 800)
    } else if (furn.id === 'stool-macaron') {
      setPetActivity('jump')
      setPetActionState(`🍬🪑 파스텔 마카롱 벨벳 스툴에 폴짝 올라앉아 신나게 다리를 흔들거리고 있어요 🎵`)
      window.setTimeout(() => {
        setBouncePet(false)
        setPetActivity('idle')
      }, 2500)
    } else if (furn.id === 'clock-pretzel') {
      setPetActivity('idle')
      setPetActionState(`🥨⏰ 골든 프레첼 벽시계가 째깍째깍 울릴 때마다 고개를 좌우로 갸우뚱거려요 ⏳`)
      window.setTimeout(() => setBouncePet(false), 800)
    } else if (furn.id === 'rug-waffle') {
      setPetActivity('sleep')
      setPetActionState(`🧇🧶 와플 체크 메이플 러그의 달콤한 시럽 향기에 취해 배를 보이고 뒹굴뒹굴 누웠어요 🍯`)
      window.setTimeout(() => setBouncePet(false), 800)
      window.setTimeout(() => setPetActivity('idle'), 3500)
    } else {
      setPetActivity('idle')
      setPetActionState(`💡 ${furn.name}을(를) 호기심 가득한 눈으로 톡톡 건드리며 탐색해요!`)
      window.setTimeout(() => setBouncePet(false), 800)
    }
  }

  // 🐾 펫 직접 터치 상호작용 (고유 디저트 ASMR 사운드 & 뽀용 바운스 & 지인 방명록 응원 연계)
  const handleTouchPet = () => {
    const activeSpecies = look.mallang?.morphForm ?? monster.species
    const soundKind = getSpeciesSoundKind(activeSpecies, look.mallang?.dessertBase)
    playDessertAsmr(soundKind, 1)
    setBouncePet(true)
    setPetActivity('jump')

    if (isVisitor) {
      const visitorTargetName = visit?.nickname ?? '지인'
      addRibbonCoins(5, '지인 펫 쓰다듬기 교감')
      setPetActionState(`${visitorTargetName}님의 펫을 쓰다듬어 주었어요! 꼬리를 흔들며 기분 좋게 그르릉거려요 🍰 (🎀 +5 리본)`)
      showToast(`💖 ${visitorTargetName}님의 펫을 쓰다듬고 디저트 ASMR 소리를 들었습니다! (+5 리본)`)
    } else {
      const petTouchChatters = [
        '토닥토닥 쓰다듬어 주니 쫀득하게 부풀어 올랐어요! 💖',
        '기분 좋은 디저트 ASMR 소리를 내며 품에 쏙 안겨요! ✨',
        '보들보들한 볼살을 부비며 행복해하고 있어요! 🌸',
        '달콤한 향기를 풍기며 방 안을 콩콩 뛰어요! 🐾',
      ]
      const randomChatter = petTouchChatters[Math.floor(Math.random() * petTouchChatters.length)]
      setPetActionState(randomChatter)
      showToast('💖 펫을 다정하게 쓰다듬었습니다!')
    }

    window.setTimeout(() => {
      setBouncePet(false)
      setPetActivity('idle')
    }, 2400)
  }

  // 좋아요(응원 하트) 누르기
  const handleLikeRoom = async () => {
    if (!IS_DEV_MOCK) {
      if (!ownerId) {
        showToast('내 방의 하트는 지인들이 눌러 줘요! 💗')
        return
      }
      if (busy) return
      setBusy(true)
      const r = await roomLike(ownerId)
      setBusy(false)
      if (!r.ok) {
        showToast(r.message ?? '잠시 후 다시 시도해 주세요.')
        if (r.code === 'liked') setLikedToday(true)
        return
      }
      playDessertAsmr('sugar-crack')
      setLikedToday(true)
      setRoom((cur) => ({ ...cur, likes: r.likes ?? cur.likes + 1 }))
      showToast('❤️ 룸에 사랑의 하트를 보냈습니다! (+5 🎀 리본 코인)')
      void refreshAccount().then(() => setCoinsState(getRibbonCoins()))
      return
    }
    playDessertAsmr('sugar-crack')
    const nextRoom = { ...room, likes: room.likes + 1 }
    setRoom(nextRoom)
    saveRoomCustom(nextRoom)
    const earned = addRibbonCoins(5, '룸 좋아요')
    setCoinsState(earned)
    showToast('❤️ 룸에 사랑의 하트를 보냈습니다! (+5 🎀 리본 코인)')
  }

  // 방명록 등록
  const handleAddComment = async () => {
    if (!newComment.trim()) return
    if (!IS_DEV_MOCK) {
      const target = ownerId ?? myId
      if (!target || busy) return
      setBusy(true)
      const r = await guestbookAdd(target, newComment)
      setBusy(false)
      if (!r.ok) {
        showToast(r.message ?? '잠시 후 다시 시도해 주세요.')
        return
      }
      playDessertAsmr('cookie-crisp')
      setNewComment('')
      showToast(isVisitor ? '📝 방명록을 남겼습니다! (+10 🎀 리본 코인)' : '📝 방명록을 남겼습니다!')
      await reloadRoom()
      void refreshAccount().then(() => setCoinsState(getRibbonCoins()))
      return
    }
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
  const handleAddReply = async (entryId: string) => {
    const text = replyText.trim()
    if (!text) return
    if (!IS_DEV_MOCK) {
      const target = ownerId ?? myId
      if (!target || busy) return
      setBusy(true)
      const r = await guestbookAdd(target, text, entryId)
      setBusy(false)
      if (!r.ok) {
        showToast(r.message ?? '잠시 후 다시 시도해 주세요.')
        return
      }
      playDessertAsmr('mochi-squish')
      setReplyText('')
      setReplyingToId(null)
      showToast('💌 답글을 남겼습니다! (+5 🎀 리본 코인)')
      await reloadRoom()
      void refreshAccount().then(() => setCoinsState(getRibbonCoins()))
      return
    }
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
        width: '100%',
        minWidth: '100%',
        height: '100dvh',
        maxHeight: '100dvh',
        background: '#FFF5F7',
        color: '#4A2E2B',
        overflow: 'hidden',
        userSelect: 'none',
        position: 'relative',
        boxSizing: 'border-box',
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
                🏰 {monster.name}의 미니룸{visit ? ` (${visit.nickname})` : ''}
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
              flexShrink: 0,
              whiteSpace: 'nowrap',
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

      {/* 2. 감성 BGM 티커 & 룸 규격 & 편집 토글 바 */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={handleToggleBgm}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: bgmPlaying ? '#FCE7F3' : '#FFFFFF',
              border: '1px solid #F472B6',
              borderRadius: 8,
              padding: '2px 7px',
              color: '#831843',
              fontWeight: 800,
              fontSize: 10,
              cursor: 'pointer',
            }}
            title="BGM 켜기/끄기"
          >
            <span>{bgmPlaying ? '🔊' : '🔈'}</span>
            <span style={{ color: '#BE185D' }}>
              {(BGM_TRACKS.find(t => t.id === currentTrack) ?? BGM_TRACKS[0]).name}
            </span>
          </button>
          <button
            onClick={() => setShowBgmPicker(true)}
            style={{
              padding: '2px 6px',
              borderRadius: 8,
              border: '1px solid #F472B6',
              background: '#FFF0F5',
              color: '#9D174D',
              fontWeight: 800,
              fontSize: 10,
              cursor: 'pointer',
            }}
            title="자연의 소리 및 클래식 음악 선택"
          >
            음악 ▾
          </button>

          {/* 룸 규격 (1단계 다락방 / 2단계 복층 / 3단계 팰리스) */}
          <button
            onClick={() => {
              const maxTier = (monster.evo_stage ?? 1) >= 3 ? 3 : monster.level >= 15 ? 2 : 1
              setRoomTier((cur) => {
                const next = cur >= maxTier ? 1 : ((cur + 1) as 1 | 2 | 3)
                showToast(`🏰 룸 테라스가 [${next === 1 ? '1단계: 아늑한 다락방' : next === 2 ? '2단계: 복층 카페' : '3단계: 슈가 팰리스'}] 규격으로 변경되었습니다!`)
                return next
              })
            }}
            style={{
              padding: '2px 6px',
              borderRadius: 8,
              border: '1px solid #FBCFE8',
              background: '#FFFFFF',
              color: '#BE185D',
              fontWeight: 800,
              fontSize: 10,
              cursor: 'pointer',
            }}
            title="룸 크기 및 테마 확장 변경"
          >
            {roomTier === 1 ? '🏠 1단 다락방' : roomTier === 2 ? '🏡 2단 복층카페' : '🏰 3단 팰리스'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isVisitor && (
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
          )}
          <button
            onClick={handleLikeRoom}
            style={{
              padding: '3px 8px',
              borderRadius: 8,
              border: '1px solid #FDA4AF',
              background: likedToday ? '#FDA4AF' : '#FFF1F2',
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

      {/* 3. 🌟 아늑하고 예쁜 비율의 싸이월드 감성 미니룸 캔버스 스테이지 */}
      <div
        style={{
          height: 'clamp(260px, 38vh, 320px)',
          minHeight: 260,
          position: 'relative',
          margin: '4px 10px',
          borderRadius: 18,
          background: currentTheme.wallBg,
          border: '2px solid #FBCFE8',
          boxShadow: 'inset 0 4px 14px rgba(0,0,0,0.06), 0 6px 20px rgba(244,114,182,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* 상단 벽면 (감성 레이스 창문 & 파티세리 벽면 선반 & 복층 계단 난간 & 네온 레터링) */}
        <div style={{ flex: 1, position: 'relative', padding: 8 }}>
          {/* 복층 계단 & 난간 (2단계 이상 해금 시 렌더링) */}
          {roomTier >= 2 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 90,
                height: 70,
                pointerEvents: 'none',
                opacity: 0.85,
                zIndex: 1,
              }}
            >
              {/* 복층 2층 바닥 & 난간 라인 */}
              <div
                style={{
                  width: '100%',
                  height: 12,
                  background: 'repeating-linear-gradient(90deg, #D97706 0px, #D97706 8px, #FDE68A 8px, #FDE68A 16px)',
                  borderRadius: '0 0 6px 0',
                  borderBottom: '2px solid #92400E',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 4,
                  fontSize: 8,
                }}
              >
                <span>🌿 2F 테라스</span>
              </div>
              {/* 계단 실루엣 */}
              <div
                style={{
                  width: 32,
                  height: 38,
                  borderRight: '2px solid #92400E',
                  borderBottom: '2px solid #92400E',
                  background: 'rgba(251, 191, 36, 0.2)',
                  borderRadius: '0 0 4px 0',
                }}
              />
            </div>
          )}

          {/* 3단계 슈가 팰리스 샹들리에 */}
          {roomTier === 3 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 16,
                filter: 'drop-shadow(0 2px 6px #FDE047)',
                zIndex: 2,
              }}
            >
              ✨💎✨
            </div>
          )}

          {/* 1. 감성 레이스 창문 */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: roomTier >= 2 ? 72 : 10,
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
              transition: 'left 0.3s ease',
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
            {roomTier === 1
              ? '💖 Sweet Patisserie Attic'
              : roomTier === 2
                ? '🏡 Duplex Dessert Cafe'
                : '🏰 Sugar Palace Mansion'}
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
              left: `calc(50% + ${petPosX * 0.4}px)`,
              transform: 'translateX(-50%)',
              width: 104,
              height: 36,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, #FCE7F3 0%, #FBCFE8 65%, transparent 70%)',
              border: '1.5px dashed #F472B6',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EC4899',
              fontSize: 10,
              opacity: 0.85,
              transition: 'left 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            🌸
          </div>

          {/* 🐾 산책 발자국 파티클 트레일 (Footprints Trail) */}
          {footprints.map((dot) => (
            <div
              key={dot.id}
              style={{
                position: 'absolute',
                bottom: 8,
                left: `calc(50% + ${dot.x}px)`,
                fontSize: 9,
                color: '#F59E0B',
                pointerEvents: 'none',
                opacity: 0.75,
                zIndex: 2,
                animation: 'mon-twinkle 1.5s infinite',
              }}
            >
              🐾
            </div>
          ))}

          {/* 5. 중앙 3D 펫 모델 (터치 시 고유 디저트 ASMR 사운드 재생 & 뽀용 바운스 반응) */}
          <div
            onClick={handleTouchPet}
            title="터치하여 펫 고유 디저트 ASMR 듣기 & 쓰다듬기"
            style={{
              position: 'absolute',
              bottom: 2,
              left: `calc(50% + ${petPosX}px)`,
              transform: `translateX(-50%) ${
                bouncePet
                  ? 'translateY(-16px) scale(1.1)'
                  : petActivity === 'sleep'
                    ? 'translateY(6px) rotate(-6deg)'
                    : 'translateY(0)'
              }`,
              transition: 'left 0.7s cubic-bezier(0.25, 1, 0.5, 1), transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              width: 115,
              height: 115,
              zIndex: 3,
              cursor: 'pointer',
            }}
          >
            {/* 펫 머리 위 상태 이모티콘 (낮잠 zzz / 점프 별빛 / 식사 하트) */}
            {petActivity === 'sleep' && (
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 12,
                  fontSize: 12,
                  fontWeight: 900,
                  color: '#6366F1',
                  background: 'rgba(255,255,255,0.92)',
                  padding: '1px 5px',
                  borderRadius: 10,
                  border: '1px solid #C7D2FE',
                  boxShadow: '0 2px 6px rgba(99,102,241,0.2)',
                  zIndex: 10,
                  animation: 'pulse 1.5s infinite',
                }}
              >
                💤 zzz...
              </div>
            )}
            {petActivity === 'jump' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 10,
                  fontSize: 11.5,
                  fontWeight: 900,
                  color: '#F59E0B',
                  background: 'rgba(255,255,255,0.92)',
                  padding: '1px 5px',
                  borderRadius: 10,
                  border: '1px solid #FDE68A',
                  zIndex: 10,
                }}
              >
                ✨ 뽀용!
              </div>
            )}
            {petActivity === 'eat' && (
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 10,
                  fontSize: 11.5,
                  fontWeight: 900,
                  color: '#EC4899',
                  background: 'rgba(255,255,255,0.92)',
                  padding: '1px 5px',
                  borderRadius: 10,
                  border: '1px solid #FBCFE8',
                  zIndex: 10,
                }}
              >
                💖 냠냠!
              </div>
            )}
            <Monster3DView look={look} size={115} fluid interactive />
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

      {/* 5. 룸 꾸미기 편집 패널 or 방명록 (모바일 하단까지 시원하게 꽉 채움) */}
      <div
        style={{
          flex: 1,
          minHeight: 140,
          margin: '0 10px calc(10px + env(safe-area-inset-bottom, 0px))',
          borderRadius: 16,
          background: '#FFFFFF',
          border: '1.5px solid #FBCFE8',
          boxShadow: '0 2px 10px rgba(244,114,182,0.12)',
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
                placeholder={isVisitor ? '친구에게 따뜻한 한마디를 남겨보세요! (+10 🎀)' : '내 방에 온 친구들에게 한마디를 남겨보세요!'}
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
                        <span style={{ fontSize: 10, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {entry.createdAt}
                          {canDelete(entry.authorId) && (
                            <button onClick={() => void handleDelete(entry.id)} aria-label="글 지우기" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, padding: 2, lineHeight: 1 }}>🗑️</button>
                          )}
                        </span>
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
                              <span style={{ fontSize: 9, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {rep.createdAt}
                                {canDelete(rep.authorId) && (
                                  <button onClick={() => void handleDelete(rep.id)} aria-label="답글 지우기" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, padding: 2, lineHeight: 1 }}>🗑️</button>
                                )}
                              </span>
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

            {/* 🎵 미니룸 감성 사운드 & 자연의 소리 선택 모달 */}
      {showBgmPicker && (
        <div
          onClick={() => setShowBgmPicker(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(20, 10, 15, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 12,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 400,
              background: '#FFFDF9',
              borderRadius: 22,
              padding: '18px 16px',
              border: '2px solid #FBCFE8',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 20 }}>🎵</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#831843' }}>미니룸 감성 사운드 선택</h3>
                  <p style={{ margin: 0, fontSize: 11, color: '#9D174D' }}>자연의 소리 및 클래식 오르골로 공간을 채워보세요</p>
                </div>
              </div>
              <button
                onClick={() => setShowBgmPicker(false)}
                style={{
                  border: 'none',
                  background: '#FCE7F3',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#831843',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {BGM_TRACKS.map((t) => {
                const isSelected = currentTrack === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTrack(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: isSelected ? '2px solid #DB2777' : '1.5px solid #FCE7F3',
                      background: isSelected ? 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isSelected ? '0 3px 10px rgba(219,39,119,0.2)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: isSelected ? '#9D174D' : '#3E2723' }}>
                          {t.name}
                        </span>
                        {isSelected && (
                          <span style={{ fontSize: 11, color: '#DB2777', fontWeight: 900 }}>재생 중 ♬</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#8D6E63' }}>{t.sub}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

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
