// 🛍️ 파티세리 부티크 상점: 패션 장신구 & 마이룸 인테리어 쇼핑 (3D 피팅룸 지원)
// 100dvh 모바일 최적화, 무스크롤 덱 구조, Zero-Crash 무결성 보장

import { useEffect, useState, useRef } from 'react'
import {
  BOUTIQUE_FASHION_ITEMS,
  BOUTIQUE_PLATING_ITEMS,
  getOwnedBoutiqueItems,
  getRibbonCoins,
  loadRoomCustom,
  purchaseBoutiqueItem,
  ROOM_FURNITURE_CATALOG,
  ROOM_THEMES,
  saveRoomCustom,
  type BoutiqueItem,
  type RoomFurnitureDef,
  type RoomThemeDef,
} from '../config/boutique'
import { monsterLook, type MonsterRow } from '../lib/api'
import { IS_DEV_MOCK } from '../lib/devMode'
import { roomSave } from '../lib/roomApi'
import { refreshAccount } from '../lib/shopApi'
import { playDessertAsmr } from '../lib/sound'
import { loadMallangCustom, saveMallangCustom, type DessertBaseId, type MallangCustom } from '../monsters/MallangChameleon'
import Monster3DView from '../monsters/Monster3DView'
import type { MonsterDecorations } from '../monsters/types'
import { BackIcon } from '../ui/Icons'
import DessertShowroomModal from './DessertShowroomModal'
import ScenicBackdrop from '../ui/ScenicBackdrop'

type BoutiqueTab = 'fashion' | 'plating' | 'interior'

interface Props {
  monster: MonsterRow
  onBack: () => void
  onOpenMyRoom: () => void
  onUpdate?: (updatedMonster: MonsterRow) => void
}

export default function BoutiqueShop({ monster, onBack, onOpenMyRoom, onUpdate }: Props) {
  const [tab, setTab] = useState<BoutiqueTab>('fashion')
  const [ribbonCoins, setCoinsState] = useState<number>(() => getRibbonCoins())
  const [ownedItems, setOwnedItems] = useState<Set<string>>(() => getOwnedBoutiqueItems())
  const [toast, setToast] = useState<string | null>(null)
  const [showShowroom, setShowShowroom] = useState<boolean>(false)
  const [buying, setBuying] = useState(false)

  // 실제 서비스: 열 때 서버의 최신 리본 코인·보유 아이템을 받아 온다
  useEffect(() => {
    if (IS_DEV_MOCK) return
    void refreshAccount().then(() => {
      setCoinsState(getRibbonCoins())
      setOwnedItems(new Set(getOwnedBoutiqueItems()))
    })
  }, [])

  // 3D 피팅룸 미리보기 상태 (실제 영구 저장은 구매 완료 또는 보유 아이템 장착 시에만 적용)
  const savedCustom = loadMallangCustom(monster.id)

  // 🛡️ 과거 버그로 미구매 아이템이 잘못 저장되어 있는 경우 자동 정화 (Sanitization)
  const sanitizeDeco = (rawDeco?: MonsterDecorations): MonsterDecorations => {
    const base: MonsterDecorations = {
      head: null,
      face: null,
      ear: null,
      neck: null,
      back: null,
      hand: null,
      bg: null,
      effect: null,
      dye: 0,
    }
    if (!rawDeco) return base
    const currentOwned = getOwnedBoutiqueItems()
    const result: MonsterDecorations = { ...rawDeco }
    const checkSlots: (keyof MonsterDecorations)[] = ['head', 'face', 'ear', 'neck', 'back', 'hand', 'bg', 'effect']
    for (const s of checkSlots) {
      const val = result[s]
      if (typeof val === 'string' && val.length > 0) {
        // 부티크 카탈로그에서 유료 아이템인데 보유 목록에 없다면 제거
        const catalogItem = BOUTIQUE_FASHION_ITEMS.find((it) => it.id === val)
        if (catalogItem && catalogItem.price > 0 && !currentOwned.has(val)) {
          (result as any)[s] = null
        }
      }
    }
    return result
  }

  const [previewDeco, setPreviewDeco] = useState<MonsterDecorations>(() =>
    sanitizeDeco(savedCustom?.decorations),
  )
  const [selectedFashionItem, setSelectedFashionItem] = useState<BoutiqueItem>(BOUTIQUE_FASHION_ITEMS[0])
  const [selectedPlatingItem, setSelectedPlatingItem] = useState<BoutiqueItem>(BOUTIQUE_PLATING_ITEMS[0])

  // 🛡️ 원래 저장되어 있던 데코 보관 (미구매 피팅 후 뒤로가기 시 롤백용)
  const activeSavedDecoRef = useRef<MonsterDecorations>(sanitizeDeco(savedCustom?.decorations))

  // 💡 대표님 피드백 반영: 구매 완료 또는 보유 아이템 착용 시에만 전체 펫 뷰 및 영구 저장소에 반영
  const notifyMonsterUpdate = (nextDeco?: MonsterDecorations, nextBase?: DessertBaseId) => {
    const currentCustom = loadMallangCustom(monster.id) ?? {}
    const updatedDeco = nextDeco ?? activeSavedDecoRef.current
    const updatedBase = nextBase ?? currentBase
    const mergedCustom: MallangCustom = {
      ...currentCustom,
      decorations: updatedDeco,
      dessertBase: updatedBase,
    }
    saveMallangCustom(monster.id, mergedCustom)

    const updatedMonster: MonsterRow = {
      ...monster,
      parts: {
        ...monster.parts,
        decorations: updatedDeco,
        mallang: mergedCustom,
      },
      look_custom: mergedCustom,
    }
    if (onUpdate) {
      onUpdate(updatedMonster)
    }
  }

  const [selectedTheme, setSelectedTheme] = useState<RoomThemeDef>(ROOM_THEMES[0])
  const [selectedFurniture, setSelectedFurniture] = useState<RoomFurnitureDef | null>(ROOM_FURNITURE_CATALOG[0])
  const [interiorType, setInteriorType] = useState<'theme' | 'furniture'>('furniture')
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => loadRoomCustom().themeId ?? 'room-patisserie')
  const [currentBase, setCurrentBase] = useState<DessertBaseId>(() => savedCustom?.dessertBase ?? 'nest')
  const [previewBase, setPreviewBase] = useState<DessertBaseId>(() => savedCustom?.dessertBase ?? 'nest')

  const look = monsterLook(monster)
  const previewLook = {
    ...look,
    decorations: previewDeco,
    mallang: {
      ...look.mallang,
      decorations: previewDeco,
      dessertBase: previewBase,
    },
  }

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }

  // 플레이팅 받침대 선택 및 실시간 피팅룸 미리보기
  const handleSelectPlatingItem = (item: BoutiqueItem) => {
    setSelectedPlatingItem(item)
    playDessertAsmr('wax-pop')

    if (item.baseId) {
      setPreviewBase(item.baseId)
      const isOwned = ownedItems.has(item.id) || item.price === 0
      const isEquipped = currentBase === item.baseId

      if (isEquipped) {
        showToast(`✨ 현재 착용 중인 ${item.name}입니다.`)
      } else if (isOwned) {
        showToast(`👀 ${item.name}을(를) 피팅룸에 올려봤어요! 아래 [받침대 착용]을 누르면 적용돼요.`)
      } else {
        showToast(`👀 ${item.name}을(를) 미리 입혀봤어요! 마음에 들면 구매해 보세요.`)
      }
    }
  }

  // 플레이팅 받침대 실제 장착
  const handleEquipPlating = (item: BoutiqueItem) => {
    if (!item.baseId) return
    setCurrentBase(item.baseId)
    setPreviewBase(item.baseId)
    const currentCustom = loadMallangCustom(monster.id) ?? {}
    saveMallangCustom(monster.id, { ...currentCustom, dessertBase: item.baseId })
    notifyMonsterUpdate(undefined, item.baseId)
    playDessertAsmr('wax-pop')
    showToast(`✨ ${item.name}을(를) 착용했습니다!`)
  }

  // 플레이팅 받침대 착용 해제 (기본 둥지로 복귀)
  const handleUnequipPlating = () => {
    setCurrentBase('nest')
    setPreviewBase('nest')
    const currentCustom = loadMallangCustom(monster.id) ?? {}
    saveMallangCustom(monster.id, { ...currentCustom, dessertBase: 'nest' })
    notifyMonsterUpdate(undefined, 'nest')
    playDessertAsmr('wax-pop')
    showToast('🪹 기본 포근 나무 둥지로 변경되었습니다.')
  }

  // 플레이팅 받침대 구매
  const handlePurchasePlating = async (item: BoutiqueItem) => {
    if (buying) return
    setBuying(true)
    const res = await purchaseBoutiqueItem(item.id, item.price)
    setBuying(false)
    if (res.success) {
      playDessertAsmr('sugar-crack')
      setCoinsState(getRibbonCoins())
      setOwnedItems(new Set(getOwnedBoutiqueItems()))
      showToast(`🎉 ${item.name}을(를) 구매하여 즉시 착용했습니다!`)

      if (item.baseId) {
        setCurrentBase(item.baseId)
        setPreviewBase(item.baseId)
        const currentCustom = loadMallangCustom(monster.id) ?? {}
        saveMallangCustom(monster.id, { ...currentCustom, dessertBase: item.baseId })
        notifyMonsterUpdate(undefined, item.baseId)
      }
    } else {
      showToast(res.message)
    }
  }

  // 패션 아이템 미리보기 피팅 (🛡️ 구매 전에는 상점 피팅룸에서만 보이고 홈 화면에는 절대 저장/반영되지 않음!)
  const handleSelectFashionItem = (item: BoutiqueItem) => {
    setSelectedFashionItem(item)
    playDessertAsmr('wax-pop')

    if (item.slot) {
      setPreviewDeco((prev) => {
        // 이미 피팅 중인 아이템을 다시 누르면 벗기(null), 아니면 입어보기!
        const isFitted = prev[item.slot!] === item.id
        const nextDeco = {
          ...prev,
          [item.slot!]: isFitted ? null : item.id,
        }
        return nextDeco
      })

      const isOwned = ownedItems.has(item.id) || item.price === 0
      if (isOwned) {
        showToast(`👀 ${item.name}을(를) 피팅룸에 입어봤어요! 아래 [바로 착용]을 누르면 홈에 적용돼요.`)
      } else {
        showToast(`👀 ${item.name}을(를) 피팅룸에서 미리 입어봤어요! 마음에 들면 구매해 보세요.`)
      }
    }
  }

  // 패션 아이템 구매 (🛡️ 결제 완료 시에만 실제 착용 및 영구 저장소/홈 화면 동기화)
  const handlePurchaseFashion = async (item: BoutiqueItem) => {
    if (buying) return
    setBuying(true)
    const res = await purchaseBoutiqueItem(item.id, item.price)
    setBuying(false)
    if (res.success) {
      playDessertAsmr('sugar-crack')
      const updatedCoins = getRibbonCoins()
      const updatedOwned = new Set(getOwnedBoutiqueItems())
      setCoinsState(updatedCoins)
      setOwnedItems(updatedOwned)
      showToast(`🎉 ${item.name}을(를) 구매했습니다!`)

      // 구매 즉시 펫에게 정식 착용 및 영구 저장
      if (item.slot) {
        const nextDeco = { ...previewDeco, [item.slot]: item.id }
        setPreviewDeco(nextDeco)
        activeSavedDecoRef.current = nextDeco
        const currentCustom = loadMallangCustom(monster.id) ?? {}
        saveMallangCustom(monster.id, { ...currentCustom, decorations: nextDeco })
        notifyMonsterUpdate(nextDeco)
      }
    } else {
      showToast(res.message)
    }
  }

  // 룸 테마 선택
  const handleSelectTheme = (theme: RoomThemeDef) => {
    setSelectedTheme(theme)
    setInteriorType('theme')
    playDessertAsmr('mochi-squish')
    const isOwned = ownedItems.has(theme.id) || theme.price === 0
    if (theme.id === currentThemeId) {
      showToast(`🏠 현재 마이룸에 적용 중인 ${theme.name}입니다.`)
    } else if (isOwned) {
      showToast(`👀 ${theme.name} 테마를 둘러봤어요! 아래 [마이룸 테마 적용]을 누르면 바로 적용돼요.`)
    } else {
      showToast(`👀 ${theme.name} 테마를 미리 둘러봤어요! 마음에 들면 구매해 보세요.`)
    }
  }

  // 룸 테마 마이룸 적용 (보유 중인 테마)
  const handleApplyTheme = (theme: RoomThemeDef) => {
    setCurrentThemeId(theme.id)
    // 1. 로컬 룸 커스텀 저장
    const currentRoom = loadRoomCustom()
    const nextRoom = { ...currentRoom, themeId: theme.id }
    saveRoomCustom(nextRoom)

    // 2. 서버 룸 커스텀 저장
    if (!IS_DEV_MOCK) {
      void roomSave(theme.id, currentRoom.placedFurniture ?? [])
    }

    // 3. 펫 홈화면 여행지 백드롭에도 실시간 동기화
    try {
      const currentCustom = loadMallangCustom(monster.id) ?? {}
      const nextDeco = { ...(currentCustom.decorations ?? {}), bg: theme.id }
      saveMallangCustom(monster.id, { ...currentCustom, decorations: nextDeco })
      notifyMonsterUpdate(nextDeco)
    } catch {}

    playDessertAsmr('sugar-crack')
    showToast(`🎉 ${theme.name} 테마가 마이룸 및 홈화면에 적용되었습니다!`)
  }

  // 룸 테마 구매 및 즉시 적용
  const handlePurchaseTheme = async (theme: RoomThemeDef) => {
    if (buying) return
    setBuying(true)
    const res = await purchaseBoutiqueItem(theme.id, theme.price)
    setBuying(false)
    if (res.success) {
      playDessertAsmr('sugar-crack')
      setCoinsState(getRibbonCoins())
      setOwnedItems(new Set(getOwnedBoutiqueItems()))
      handleApplyTheme(theme)
    } else {
      showToast(res.message)
    }
  }

  // 가구 소품 선택
  const handleSelectFurniture = (furn: RoomFurnitureDef) => {
    setSelectedFurniture(furn)
    setInteriorType('furniture')
    playDessertAsmr('wax-pop')
  }

  // 가구 소품 구매
  const handlePurchaseFurniture = async (furn: RoomFurnitureDef) => {
    if (buying) return
    setBuying(true)
    const res = await purchaseBoutiqueItem(furn.id, furn.price)
    setBuying(false)
    if (res.success) {
      playDessertAsmr('cookie-crisp')
      setCoinsState(getRibbonCoins())
      setOwnedItems(new Set(getOwnedBoutiqueItems()))
      showToast(`🎉 ${furn.name}을(를) 구매했습니다! 마이룸에서 배치해보세요.`)
    } else {
      showToast(res.message)
    }
  }

  // 패션 장착/해제 토글 (보유 중인 아이템 착용 시 실제 저장)
  const handleEquipFashion = (item: BoutiqueItem) => {
    if (!item.slot) return
    const isEquipped = previewDeco[item.slot] === item.id
    const nextDeco = {
      ...previewDeco,
      [item.slot]: isEquipped ? null : item.id,
    }
    setPreviewDeco(nextDeco)
    activeSavedDecoRef.current = nextDeco
    const currentCustom = loadMallangCustom(monster.id) ?? {}
    saveMallangCustom(monster.id, { ...currentCustom, decorations: nextDeco })
    notifyMonsterUpdate(nextDeco)
    playDessertAsmr('wax-pop')
    showToast(isEquipped ? `✨ ${item.name} 장착을 해제했습니다.` : `✨ ${item.name}을(를) 착용했습니다!`)
  }

  // 전체 장착 해제 (기본 모습으로 리셋)
  const handleClearAllDecorations = () => {
    const emptyDeco: MonsterDecorations = {
      head: null,
      face: null,
      ear: null,
      neck: null,
      back: null,
      hand: null,
      bg: null,
      effect: null,
      dye: 0,
    }
    setPreviewDeco(emptyDeco)
    activeSavedDecoRef.current = emptyDeco
    const currentCustom = loadMallangCustom(monster.id) ?? {}
    saveMallangCustom(monster.id, { ...currentCustom, decorations: emptyDeco })
    notifyMonsterUpdate(emptyDeco)
    playDessertAsmr('mochi-squish')
    showToast('✨ 모든 장신구를 벗었습니다.')
  }

  // 🛡️ 상점 닫기 안전 핸들러 (피팅룸에서 미구매 아이템을 입어보던 상태를 홈 화면에 남기지 않고 원복)
  const handleSafeBack = () => {
    try {
      // 실제 영구 저장된 최신 커스텀 상태로 홈 화면 몬스터 뷰를 정화/복구
      const currentCustom = loadMallangCustom(monster.id)
      const confirmedDeco = activeSavedDecoRef.current || currentCustom?.decorations
      notifyMonsterUpdate(confirmedDeco, currentCustom?.dessertBase)
    } catch {}
    onBack()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        maxHeight: '100dvh',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        background: '#FFF5F7',
        color: '#4A2E2B',
        overflow: 'hidden',
        overflowX: 'hidden',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* 1. 상단 탑바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: '#FFFFFF',
          borderBottom: '1px solid #FCE7F3',
          boxShadow: '0 2px 8px rgba(244,114,182,0.08)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleSafeBack}
            style={{
              background: '#FFF0F5',
              border: '1px solid #FBCFE8',
              borderRadius: 10,
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BackIcon size={16} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#9D174D', lineHeight: 1.2 }}>
              🛍️ 파티세리 부티크
            </h2>
            <p style={{ margin: 0, fontSize: 10, color: '#BE185D', fontWeight: 600 }}>
              남들과 다른 나만의 디저트 패션 & 공간 꾸미기
            </p>
          </div>
        </div>

        {/* 우측 도구: 쇼룸 & 보유 특별 주화 (슈가 리본 코인 🎀) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => {
              setShowShowroom(true)
              playDessertAsmr('sugar-crack')
            }}
            style={{
              padding: '4px 8px',
              borderRadius: 14,
              border: '1.5px solid #FFD54F',
              background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
              color: '#E65100',
              fontWeight: 900,
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              boxShadow: '0 2px 6px rgba(255,179,0,0.2)',
            }}
            title="Stitch 디저트 비주얼 에셋 쇼룸 열기"
          >
            <span>✨ 쇼룸</span>
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              padding: '5px 10px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
              border: '1.5px solid #F472B6',
              boxShadow: '0 2px 6px rgba(244,114,182,0.18)',
            }}
          >
            <span style={{ fontSize: 15 }}>🎀</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#BE185D' }}>{ribbonCoins}</span>
          </div>
        </div>
      </div>

      {/* 2. 메인 탭 전환: 패션 vs 받침대 vs 룸 인테리어 (3열 덱) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          padding: '6px 12px 2px',
          gap: 5,
          background: '#FFF5F7',
          flexShrink: 0,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <button
          onClick={() => {
            setTab('fashion')
            playDessertAsmr('mochi-squish')
          }}
          style={{
            padding: '7px 0',
            borderRadius: 10,
            border: tab === 'fashion' ? '2px solid #EC4899' : '1px solid #FBCFE8',
            background: tab === 'fashion' ? 'linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 100%)' : '#FFFFFF',
            color: tab === 'fashion' ? '#BE185D' : '#64748B',
            fontWeight: 900,
            fontSize: 11,
            cursor: 'pointer',
            boxShadow: tab === 'fashion' ? '0 2px 6px rgba(236,72,153,0.2)' : 'none',
          }}
        >
          👗 7칸 패션
        </button>
        <button
          onClick={() => {
            setTab('plating')
            playDessertAsmr('sugar-crack')
          }}
          style={{
            padding: '7px 0',
            borderRadius: 10,
            border: tab === 'plating' ? '2px solid #EC4899' : '1px solid #FBCFE8',
            background: tab === 'plating' ? 'linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 100%)' : '#FFFFFF',
            color: tab === 'plating' ? '#BE185D' : '#64748B',
            fontWeight: 900,
            fontSize: 11,
            cursor: 'pointer',
            boxShadow: tab === 'plating' ? '0 2px 6px rgba(236,72,153,0.2)' : 'none',
          }}
        >
          🎂 받침대 플레이팅
        </button>
        <button
          onClick={() => {
            setTab('interior')
            playDessertAsmr('cookie-crisp')
          }}
          style={{
            padding: '7px 0',
            borderRadius: 10,
            border: tab === 'interior' ? '2px solid #EC4899' : '1px solid #FBCFE8',
            background: tab === 'interior' ? 'linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 100%)' : '#FFFFFF',
            color: tab === 'interior' ? '#BE185D' : '#64748B',
            fontWeight: 900,
            fontSize: 11,
            cursor: 'pointer',
            boxShadow: tab === 'interior' ? '0 2px 6px rgba(236,72,153,0.2)' : 'none',
          }}
        >
          🛋️ 룸 인테리어
        </button>
      </div>

      {/* 3. 중앙 3D 실시간 피팅룸 스테이지 (하단 버튼 짤림 방지: 컴팩트 180px) */}
      <div
        style={{
          height: 250,
          minHeight: 230,
          maxHeight: 260,
          position: 'relative',
          margin: '4px 12px',
          borderRadius: 18,
          background: tab !== 'interior'
            ? 'radial-gradient(circle, #FFF1F2 0%, #FFE4E6 100%)'
            : selectedTheme.wallBg,
          border: '1.5px solid #FBCFE8',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.04), 0 4px 12px rgba(244,114,182,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        {tab !== 'interior' ? (
          <>
            <div style={{ width: '100%', height: '100%' }}>
              <Monster3DView look={previewLook} size={230} fluid interactive />
            </div>
            {/* 전체 해제 버튼 & 360도 회전 힌트 뱃지 */}
            <button
              onClick={handleClearAllDecorations}
              style={{
                position: 'absolute',
                bottom: 6,
                left: 8,
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid #FBCFE8',
                borderRadius: 12,
                padding: '3px 8px',
                fontSize: 10,
                color: '#64748B',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              🧹 모두 벗기
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                right: 8,
                background: 'rgba(255,255,255,0.85)',
                borderRadius: 12,
                padding: '2px 7px',
                fontSize: 10,
                color: '#BE185D',
                fontWeight: 800,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              🔄 드래그하여 360° 확인
            </div>
          </>
        ) : (
          /* 마이룸 인테리어 미리보기 */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* 🗺️ 랜드마크 & 자연풍경 백드롭 미리보기 */}
            <ScenicBackdrop
              themeId={selectedTheme.id}
              mode="room"
              style={{ position: 'absolute', inset: 0, zIndex: 0 }}
            />
            <div style={{ flex: 1, padding: 8, position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 10,
                  fontSize: 11,
                  fontWeight: 900,
                  color: selectedTheme.accentColor,
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(4px)',
                  padding: '2px 8px',
                  borderRadius: 8,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
              >
                테마: {selectedTheme.icon} {selectedTheme.name}
              </div>
            </div>
            {/* 바닥 영역 */}
            <div
              style={{
                height: 55,
                background: selectedTheme.floorBg,
                borderTop: '2px solid rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 16px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {interiorType === 'furniture' && selectedFurniture ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transform: 'translateY(-12px)',
                  }}
                >
                  <span style={{ fontSize: 32, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}>
                    {selectedFurniture.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      background: '#FFFFFF',
                      padding: '1px 5px',
                      borderRadius: 6,
                      color: '#4E342E',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {selectedFurniture.name}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: 11, fontWeight: 900, color: '#9D174D', background: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  ✨ {selectedTheme.name} 전경 미리보기
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. 선택 아이템 상세 카드 및 구매/착용 버튼 */}
      <div
        style={{
          margin: '0 12px 6px',
          padding: '8px 12px',
          borderRadius: 14,
          background: '#FFFFFF',
          border: '1.5px solid #FBCFE8',
          boxShadow: '0 2px 8px rgba(244,114,182,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>
              {tab === 'fashion'
                ? selectedFashionItem.icon
                : tab === 'plating'
                  ? selectedPlatingItem.icon
                  : interiorType === 'theme'
                    ? selectedTheme.icon
                    : (selectedFurniture?.icon ?? '🛋️')}
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#9D174D', whiteSpace: 'nowrap' }}>
              {tab === 'fashion'
                ? selectedFashionItem.name
                : tab === 'plating'
                  ? selectedPlatingItem.name
                  : interiorType === 'theme'
                    ? selectedTheme.name
                    : (selectedFurniture?.name ?? '가구')}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: 6,
                background: '#FDF2F8',
                color: '#EC4899',
              }}
            >
              매력 +
              {tab === 'fashion'
                ? selectedFashionItem.charm
                : tab === 'plating'
                  ? selectedPlatingItem.charm
                  : interiorType === 'theme'
                    ? selectedTheme.charm
                    : (selectedFurniture?.charm ?? 10)}
            </span>
          </div>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 10,
              color: '#831843',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tab === 'fashion'
              ? selectedFashionItem.desc
              : tab === 'plating'
                ? selectedPlatingItem.desc
                : interiorType === 'theme'
                  ? selectedTheme.desc
                  : (selectedFurniture?.desc ?? '소품')}
          </p>
        </div>

        {/* 액션 버튼 (구매 / 장착 토글) */}
        <div style={{ flexShrink: 0 }}>
          {tab === 'fashion' ? (
            ownedItems.has(selectedFashionItem.id) ? (
              <button
                onClick={() => handleEquipFashion(selectedFashionItem)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background:
                    selectedFashionItem.slot && previewDeco[selectedFashionItem.slot] === selectedFashionItem.id
                      ? '#E11D48'
                      : 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(219,39,119,0.3)',
                }}
              >
                {selectedFashionItem.slot && previewDeco[selectedFashionItem.slot] === selectedFashionItem.id
                  ? '착용 해제'
                  : '✨ 바로 착용'}
              </button>
            ) : (
              <button
                onClick={() => handlePurchaseFashion(selectedFashionItem)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(225,29,72,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>구매</span>
                <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.15)', padding: '1px 5px', borderRadius: 6 }}>
                  🎀 {selectedFashionItem.price}
                </span>
              </button>
            )
          ) : tab === 'plating' ? (
            ownedItems.has(selectedPlatingItem.id) || selectedPlatingItem.price === 0 ? (
              currentBase === selectedPlatingItem.baseId ? (
                selectedPlatingItem.baseId !== 'nest' ? (
                  <button
                    onClick={handleUnequipPlating}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#E11D48',
                      color: '#FFFFFF',
                      fontWeight: 900,
                      fontSize: 12,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(225,29,72,0.3)',
                    }}
                  >
                    착용 해제 (기본 둥지)
                  </button>
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: '#059669',
                      padding: '6px 12px',
                      background: '#ECFDF5',
                      borderRadius: 8,
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    기본 둥지 착용 중
                  </span>
                )
              ) : (
                <button
                  onClick={() => handleEquipPlating(selectedPlatingItem)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(219,39,119,0.35)',
                  }}
                >
                  ✨ 받침대 착용
                </button>
              )
            ) : (
              <button
                onClick={() => handlePurchasePlating(selectedPlatingItem)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(225,29,72,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>구매 & 착용</span>
                <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.15)', padding: '1px 5px', borderRadius: 6 }}>
                  🎀 {selectedPlatingItem.price}
                </span>
              </button>
            )
          ) : interiorType === 'theme' ? (
            ownedItems.has(selectedTheme.id) || selectedTheme.price === 0 ? (
              <button
                onClick={() => handleApplyTheme(selectedTheme)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: currentThemeId === selectedTheme.id ? '#10B981' : 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(219,39,119,0.3)',
                }}
              >
                {currentThemeId === selectedTheme.id ? '✓ 적용 중' : '✨ 마이룸 테마 적용'}
              </button>
            ) : (
              <button
                onClick={() => handlePurchaseTheme(selectedTheme)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(225,29,72,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>테마 구매 & 적용</span>
                <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.15)', padding: '1px 5px', borderRadius: 6 }}>
                  🎀 {selectedTheme.price}
                </span>
              </button>
            )
          ) : selectedFurniture ? (
            ownedItems.has(selectedFurniture.id) || selectedFurniture.price === 0 ? (
              <button
                onClick={onOpenMyRoom}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                마이룸 배치
              </button>
            ) : (
              <button
                onClick={() => handlePurchaseFurniture(selectedFurniture)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>가구 구매</span>
                <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.15)', padding: '1px 5px', borderRadius: 6 }}>
                  🎀 {selectedFurniture.price}
                </span>
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* 5. 아이템 카탈로그 격자 목록 (내부 스크롤 - 좌우 덜렁거림 및 가로 스크롤 완벽 차단) */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehaviorX: 'none',
          overscrollBehaviorY: 'auto',
          padding: '0 12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {tab === 'interior' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%', boxSizing: 'border-box' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#9D174D' }}>🎨 벽지 &amp; 바닥 테마 선택</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4, width: '100%', boxSizing: 'border-box' }}>
              {ROOM_THEMES.map((theme) => {
                const isSelected = interiorType === 'theme' && selectedTheme.id === theme.id
                const isOwned = ownedItems.has(theme.id) || theme.price === 0
                const isApplied = currentThemeId === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme)}
                    style={{
                      padding: '5px 2px',
                      borderRadius: 8,
                      border: isSelected ? '2px solid #EC4899' : '1px solid #FBCFE8',
                      background: isSelected ? '#FDF2F8' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{theme.icon}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        color: '#4E342E',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        maxWidth: '100%',
                      }}
                    >
                      {theme.name.slice(0, 4)}
                    </span>
                    <span style={{ fontSize: 8, color: isApplied ? '#2563EB' : isOwned ? '#059669' : '#BE185D', fontWeight: 800 }}>
                      {isApplied ? '적용중' : isOwned ? '보유' : `🎀${theme.price}`}
                    </span>
                  </button>
                )
              })}
            </div>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#9D174D', marginTop: 4 }}>🛋️ 가구 &amp; 인테리어 소품</span>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 6,
            alignContent: 'start',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
        {tab === 'fashion'
          ? BOUTIQUE_FASHION_ITEMS.map((item) => {
              const isOwned = ownedItems.has(item.id)
              const isSelected = selectedFashionItem.id === item.id
              const isEquipped = item.slot && previewDeco[item.slot] === item.id

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectFashionItem(item)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 12,
                    background: isSelected ? '#FDF2F8' : '#FFFFFF',
                    border: isSelected ? '2px solid #EC4899' : '1px solid #FCE7F3',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: isSelected ? '0 2px 6px rgba(236,72,153,0.2)' : 'none',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {isEquipped && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        fontSize: 9,
                        fontWeight: 900,
                        background: '#10B981',
                        color: '#FFFFFF',
                        padding: '1px 5px',
                        borderRadius: 6,
                        boxShadow: '0 1px 4px rgba(16,185,129,0.3)',
                      }}
                    >
                      착용중
                    </span>
                  )}
                  <span style={{ fontSize: 28, margin: '2px 0' }}>{item.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#4E342E',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      maxWidth: '100%',
                      display: 'block',
                    }}
                  >
                    {item.name}
                  </span>
                  <div style={{ marginTop: 2 }}>
                    {isOwned ? (
                      <span style={{ fontSize: 9, color: '#059669', fontWeight: 800 }}>소유완료</span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#BE185D', fontWeight: 800 }}>🎀 {item.price}</span>
                    )}
                  </div>
                </div>
              )
            })
          : tab === 'plating'
          ? BOUTIQUE_PLATING_ITEMS.map((item) => {
              const isOwned = ownedItems.has(item.id) || item.price === 0
              const isSelected = selectedPlatingItem.id === item.id
              const isEquipped = currentBase === item.baseId

              return (
                <div
                  key={item.id}
                  data-item-id={item.id}
                  onClick={() => handleSelectPlatingItem(item)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 12,
                    background: isSelected ? '#FDF2F8' : '#FFFFFF',
                    border: isSelected ? '2px solid #EC4899' : '1px solid #FCE7F3',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: isSelected ? '0 2px 6px rgba(236,72,153,0.2)' : 'none',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {isEquipped ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        fontSize: 9,
                        fontWeight: 900,
                        background: '#10B981',
                        color: '#FFFFFF',
                        padding: '1px 5px',
                        borderRadius: 6,
                        boxShadow: '0 1px 4px rgba(16,185,129,0.3)',
                      }}
                    >
                      착용중
                    </span>
                  ) : previewBase === item.baseId ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        fontSize: 9,
                        fontWeight: 900,
                        background: '#EC4899',
                        color: '#FFFFFF',
                        padding: '1px 5px',
                        borderRadius: 6,
                        boxShadow: '0 1px 4px rgba(236,72,153,0.3)',
                      }}
                    >
                      피팅중
                    </span>
                  ) : null}
                  <span style={{ fontSize: 28, margin: '2px 0' }}>{item.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#4E342E',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      maxWidth: '100%',
                      display: 'block',
                    }}
                  >
                    {item.name}
                  </span>
                  <div style={{ marginTop: 2 }}>
                    {isOwned ? (
                      <span style={{ fontSize: 9, color: '#059669', fontWeight: 800 }}>{item.price === 0 ? '기본 제공' : '소유완료'}</span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#BE185D', fontWeight: 800 }}>🎀 {item.price}</span>
                    )}
                  </div>
                </div>
              )
            })
          : ROOM_FURNITURE_CATALOG.map((furn) => {
              const isOwned = ownedItems.has(furn.id) || furn.price === 0
              const isSelected = interiorType === 'furniture' && selectedFurniture?.id === furn.id

              return (
                <div
                  key={furn.id}
                  onClick={() => handleSelectFurniture(furn)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 12,
                    background: isSelected ? '#FDF2F8' : '#FFFFFF',
                    border: isSelected ? '2px solid #EC4899' : '1px solid #FCE7F3',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    minWidth: 0,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{ fontSize: 28, margin: '2px 0' }}>{furn.icon}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#4E342E',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      maxWidth: '100%',
                      display: 'block',
                    }}
                  >
                    {furn.name}
                  </span>
                  <div style={{ marginTop: 2 }}>
                    {isOwned ? (
                      <span style={{ fontSize: 9, color: '#059669', fontWeight: 800 }}>{furn.price === 0 ? '기본 제공' : '소유완료'}</span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#BE185D', fontWeight: 800 }}>🎀 {furn.price}</span>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* 6. 하단 마이룸 바로가기 액션 바 (화면 짤림 원천 차단) */}
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 14px calc(10px + env(safe-area-inset-bottom, 0px))',
          background: '#FFFFFF',
          borderTop: '1.5px solid #FCE7F3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
          zIndex: 20,
        }}
      >
        <div style={{ fontSize: 10, color: '#831843', fontWeight: 700, lineHeight: 1.3 }}>
          💡 <b>슈가 리본 코인 모으는 법</b><br />
          대전 승리(+30🎀) · 타워 탐사(+20🎀) · 쓰담쓰담(+5🎀)
        </div>
        <button
          onClick={onOpenMyRoom}
          style={{
            padding: '8px 14px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: 12,
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(236,72,153,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          🏰 내 마이룸 가기
        </button>
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

      {/* ✨ Stitch 디저트 비주얼 에셋 쇼룸 모달 */}
      {showShowroom && (
        <DessertShowroomModal
          onClose={() => setShowShowroom(false)}
        />
      )}
    </div>
  )
}
