// 🛍️ 파티세리 부티크 상점: 패션 장신구 & 마이룸 인테리어 쇼핑 (3D 피팅룸 지원)
// 100dvh 모바일 최적화, 무스크롤 덱 구조, Zero-Crash 무결성 보장

import { useState } from 'react'
import {
  BOUTIQUE_FASHION_ITEMS,
  getOwnedBoutiqueItems,
  getRibbonCoins,
  purchaseBoutiqueItem,
  ROOM_FURNITURE_CATALOG,
  ROOM_THEMES,
  type BoutiqueItem,
  type RoomFurnitureDef,
  type RoomThemeDef,
} from '../config/boutique'
import { monsterLook, type MonsterRow } from '../lib/api'
import { playDessertAsmr } from '../lib/sound'
import { loadMallangCustom, saveMallangCustom } from '../monsters/MallangChameleon'
import Monster3DView from '../monsters/Monster3DView'
import type { MonsterDecorations } from '../monsters/types'
import { BackIcon } from '../ui/Icons'
import DessertShowroomModal from './DessertShowroomModal'

type BoutiqueTab = 'fashion' | 'interior'

interface Props {
  monster: MonsterRow
  onBack: () => void
  onOpenMyRoom: () => void
}

export default function BoutiqueShop({ monster, onBack, onOpenMyRoom }: Props) {
  const [tab, setTab] = useState<BoutiqueTab>('fashion')
  const [ribbonCoins, setCoinsState] = useState<number>(() => getRibbonCoins())
  const [ownedItems, setOwnedItems] = useState<Set<string>>(() => getOwnedBoutiqueItems())
  const [toast, setToast] = useState<string | null>(null)
  const [showShowroom, setShowShowroom] = useState<boolean>(false)

  // 3D 피팅룸 미리보기 상태 (실제 저장은 구매 후 장착 시)
  const savedCustom = loadMallangCustom(monster.id)
  const [previewDeco, setPreviewDeco] = useState<MonsterDecorations>(
    savedCustom?.decorations ?? {
      head: null,
      face: null,
      neck: null,
      back: null,
      hand: null,
      bg: null,
      effect: null,
      dye: 0,
    },
  )
  const [selectedFashionItem, setSelectedFashionItem] = useState<BoutiqueItem>(BOUTIQUE_FASHION_ITEMS[0])
  const [selectedTheme, setSelectedTheme] = useState<RoomThemeDef>(ROOM_THEMES[0])
  const [selectedFurniture, setSelectedFurniture] = useState<RoomFurnitureDef | null>(ROOM_FURNITURE_CATALOG[0])

  const look = monsterLook(monster)
  const previewLook = {
    ...look,
    decorations: previewDeco,
    mallang: {
      ...look.mallang,
      decorations: previewDeco,
    },
  }

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3000)
  }

  // 패션 아이템 미리보기 피팅
  const handleSelectFashionItem = (item: BoutiqueItem) => {
    setSelectedFashionItem(item)
    playDessertAsmr(item.soundKind)

    if (item.slot) {
      setPreviewDeco((prev) => ({
        ...prev,
        [item.slot!]: item.id,
      }))
    }
  }

  // 패션 아이템 구매
  const handlePurchaseFashion = (item: BoutiqueItem) => {
    const res = purchaseBoutiqueItem(item.id, item.price)
    if (res.success) {
      playDessertAsmr('sugar-crack')
      setCoinsState(getRibbonCoins())
      setOwnedItems(new Set(getOwnedBoutiqueItems()))
      showToast(`🎉 ${item.name}을(를) 구매했습니다!`)

      // 바로 펫에게 착용 및 기존 커스텀과 안전 병합 저장
      if (item.slot) {
        const nextDeco = { ...previewDeco, [item.slot]: item.id }
        setPreviewDeco(nextDeco)
        const currentCustom = loadMallangCustom(monster.id) ?? {}
        saveMallangCustom(monster.id, { ...currentCustom, decorations: nextDeco })
      }
    } else {
      showToast(res.message)
    }
  }

  // 룸 테마 / 가구 구매
  const handlePurchaseInterior = (id: string, name: string, price: number) => {
    const res = purchaseBoutiqueItem(id, price)
    if (res.success) {
      playDessertAsmr('cookie-crisp')
      setCoinsState(getRibbonCoins())
      setOwnedItems(new Set(getOwnedBoutiqueItems()))
      showToast(`🎉 ${name}을(를) 구매했습니다! 마이룸에서 배치해보세요.`)
    } else {
      showToast(res.message)
    }
  }

  // 패션 장착/해제 토글
  const handleEquipFashion = (item: BoutiqueItem) => {
    if (!item.slot) return
    const isEquipped = previewDeco[item.slot] === item.id
    const nextDeco = {
      ...previewDeco,
      [item.slot]: isEquipped ? null : item.id,
    }
    setPreviewDeco(nextDeco)
    const currentCustom = loadMallangCustom(monster.id) ?? {}
    saveMallangCustom(monster.id, { ...currentCustom, decorations: nextDeco })
    playDessertAsmr(item.soundKind)
    showToast(isEquipped ? `✨ ${item.name} 장착을 해제했습니다.` : `✨ ${item.name}을(를) 착용했습니다!`)
  }

  // 전체 장착 해제 (기본 모습으로 리셋)
  const handleClearAllDecorations = () => {
    const emptyDeco: MonsterDecorations = {
      head: null,
      face: null,
      neck: null,
      back: null,
      hand: null,
      effect: null,
    }
    setPreviewDeco(emptyDeco)
    const currentCustom = loadMallangCustom(monster.id) ?? {}
    saveMallangCustom(monster.id, { ...currentCustom, decorations: emptyDeco })
    playDessertAsmr('mochi-squish')
    showToast('✨ 모든 장신구를 벗었습니다.')
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
            onClick={onBack}
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

      {/* 2. 메인 탭 전환: 패션 vs 룸 인테리어 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          padding: '6px 12px 2px',
          gap: 6,
          background: '#FFF5F7',
          flexShrink: 0,
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
            fontSize: 12,
            cursor: 'pointer',
            boxShadow: tab === 'fashion' ? '0 2px 6px rgba(236,72,153,0.2)' : 'none',
          }}
        >
          👗 패션 장신구 피팅룸
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
            fontSize: 12,
            cursor: 'pointer',
            boxShadow: tab === 'interior' ? '0 2px 6px rgba(236,72,153,0.2)' : 'none',
          }}
        >
          🛋️ 마이룸 가구·테마
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
          background: tab === 'fashion'
            ? 'radial-gradient(circle, #FFF1F2 0%, #FFE4E6 100%)'
            : selectedTheme.wallBg,
          border: '1.5px solid #FBCFE8',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.04), 0 4px 12px rgba(244,114,182,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {tab === 'fashion' ? (
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
            }}
          >
            <div style={{ flex: 1, padding: 8, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 10,
                  fontSize: 11,
                  fontWeight: 900,
                  color: selectedTheme.accentColor,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '2px 8px',
                  borderRadius: 8,
                }}
              >
                테마: {selectedTheme.name}
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
              }}
            >
              {selectedFurniture && (
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
                    }}
                  >
                    {selectedFurniture.name}
                  </span>
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
        }}
      >
        <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>
              {tab === 'fashion'
                ? selectedFashionItem.icon
                : selectedFurniture?.icon ?? selectedTheme.icon}
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#9D174D', whiteSpace: 'nowrap' }}>
              {tab === 'fashion'
                ? selectedFashionItem.name
                : selectedFurniture?.name ?? selectedTheme.name}
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
                : selectedFurniture?.charm ?? selectedTheme.charm}
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
              : selectedFurniture?.desc ?? selectedTheme.desc}
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
          ) : selectedFurniture ? (
            ownedItems.has(selectedFurniture.id) ? (
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
                onClick={() =>
                  handlePurchaseInterior(selectedFurniture.id, selectedFurniture.name, selectedFurniture.price)
                }
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
                <span>구매</span>
                <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.15)', padding: '1px 5px', borderRadius: 6 }}>
                  🎀 {selectedFurniture.price}
                </span>
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* 5. 아이템 카탈로그 격자 목록 (내부 스크롤) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {tab === 'interior' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#9D174D' }}>🎨 벽지 &amp; 바닥 테마 선택</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {ROOM_THEMES.map((theme) => {
                const isSelected = selectedTheme.id === theme.id
                const isOwned = ownedItems.has(theme.id) || theme.price === 0
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setSelectedTheme(theme)
                      playDessertAsmr('mochi-squish')
                    }}
                    style={{
                      padding: '5px 2px',
                      borderRadius: 8,
                      border: isSelected ? '2px solid #EC4899' : '1px solid #FBCFE8',
                      background: isSelected ? '#FDF2F8' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{theme.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#4E342E', whiteSpace: 'nowrap' }}>
                      {theme.name.slice(0, 4)}
                    </span>
                    <span style={{ fontSize: 8, color: isOwned ? '#059669' : '#BE185D', fontWeight: 800 }}>
                      {isOwned ? '보유' : `🎀${theme.price}`}
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            alignContent: 'start',
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
                        padding: '1px 4px',
                        borderRadius: 6,
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
          : ROOM_FURNITURE_CATALOG.map((furn) => {
              const isOwned = ownedItems.has(furn.id)
              const isSelected = selectedFurniture?.id === furn.id

              return (
                <div
                  key={furn.id}
                  onClick={() => {
                    setSelectedFurniture(furn)
                    playDessertAsmr(furn.soundKind)
                  }}
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
                    }}
                  >
                    {furn.name}
                  </span>
                  <div style={{ marginTop: 2 }}>
                    {isOwned ? (
                      <span style={{ fontSize: 9, color: '#059669', fontWeight: 800 }}>소유완료</span>
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
