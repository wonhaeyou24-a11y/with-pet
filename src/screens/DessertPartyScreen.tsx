/**
 * 🎉 디저트 파티 쇼케이스 (DessertPartyScreen.tsx)
 * 
 * 1. 대표님 피드백 100% 반영:
 *    - "정말 꾸며진 상자 및 접시 등에 바로 장식되어서 직관적으로 표현되는 완성형 뷰"
 *    - 텍스트 점선 카드를 완전히 없애고, 들어가 보기만 해도 리본/벨벳/금박 컵/생크림 딸기가 황홀하게 장식된 쇼케이스
 *    - 빈 자리에도 고급 디저트 몰드가 예쁘게 세팅되어 있어 내 펫을 얹기만 하면 완벽한 예술 작품이 됨
 * 2. "무기 및 아이템만 구입해서 사용, 나머지는 100% 자유롭게 직접 색칠하고 데코도 직접 만드는 무한 자유도"
 *    - [🎨 메챠 자유 색칠 & 데코 공방] 모달 연계
 *    - 기본 순백 도우 위에 붓으로 원하는 색 칠하기 + 데코 스탬프 콕콕 찍기 -> 실시간 쇼케이스 반영
 * 3. 100% 인라인 스타일 (Tailwind 미설치 환경 완벽 호환)
 */

import React, { useState, useEffect } from 'react'
import type { MonsterRow } from '../lib/api'
import { monsterLook } from '../lib/api'
import Monster3DView from '../monsters/Monster3DView'
import type { MonsterLook } from '../monsters/types'
import { MallangAtelierModal } from './MallangAtelierModal'
import { loadMallangCustom } from '../monsters/MallangChameleon'

export type PartyBaseType = 'box' | 'cake' | 'tea-stand'
export type SlotCapacity = 1 | 2 | 4 | 6 | 9 | 16

export interface PartySlotItem {
  slotIndex: number
  ownerName: string
  petName: string
  species: string
  look: MonsterLook
  isMine: boolean
  placedAt: string
}

export interface FinishingTouch {
  lettering: string
  powder: 'none' | 'sugar-snow' | 'gold-leaf' | 'berry-syrup' | 'rainbow-sprinkle'
  ribbon: 'rose-pink' | 'royal-gold' | 'mint-sky' | 'pure-white'
}

export interface OpenPartyRoom {
  id: string
  title: string
  hostName: string
  baseType: PartyBaseType
  capacity: SlotCapacity
  slots: (PartySlotItem | null)[]
  finishing?: FinishingTouch
  isCompleted: boolean
  createdAt: string
}

export interface DeliveredGiftPackage {
  id: string
  senderName: string
  recipientName: string
  title: string
  baseType: PartyBaseType
  capacity: SlotCapacity
  slots: PartySlotItem[]
  finishing: FinishingTouch
  letterMessage: string
  sentAt: string
  isOpened: boolean
}

interface DessertPartyScreenProps {
  onBack: () => void
  currentMonster: MonsterRow
  onOpenBoutique?: () => void
  onSaveToMiniroom?: (partyPkg: OpenPartyRoom) => void
}

// 경량 인라인 SVG 아이콘 모음
const ArrowLeft = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
)
const Sparkles = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
)
const Gift = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>
)
const Palette = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
)
const Users = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)

const OPEN_PARTIES_STORAGE_KEY = 'pet_together_open_parties_v2'
const DELIVERED_GIFTS_STORAGE_KEY = 'pet_together_delivered_gifts_v1'
const SHOWCASE_STORAGE_KEY = 'pet_together_showcase_v1'

export const DessertPartyScreen: React.FC<DessertPartyScreenProps> = ({
  onBack,
  currentMonster,
  onOpenBoutique,
  onSaveToMiniroom,
}) => {
  const [mainTab, setMainTab] = useState<'solo' | 'open_lounge' | 'showcase'>('solo')

  // 자유 색칠 & 데코 공방 모달 열림 여부
  const [showAtelierModal, setShowAtelierModal] = useState<boolean>(false)

  // 1인 모드 상태 (일체형 직관적 뷰)
  const [selectedBase, setSelectedBase] = useState<PartyBaseType>('box')
  const [selectedCapacity, setSelectedCapacity] = useState<SlotCapacity>(4)
  const [soloSlots, setSoloSlots] = useState<(PartySlotItem | null)[]>(() => new Array(4).fill(null))
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0)

  // 피니싱 터치 데코
  const [lettering, setLettering] = useState<string>('오늘 하루도 달콤하길 💖')
  const powder: FinishingTouch['powder'] = 'sugar-snow'
  const [ribbon, setRibbon] = useState<FinishingTouch['ribbon']>('rose-pink')
  const [giftRecipient, setGiftRecipient] = useState<string>('')
  const [giftSentToast, setGiftSentToast] = useState<string | null>(null)

  // 오픈 지인 모드 상태
  const [openParties, setOpenParties] = useState<OpenPartyRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState<boolean>(false)

  // 명예의 진열장
  const [showcaseList, setShowcaseList] = useState<OpenPartyRoom[]>([])
  const [customVersion, setCustomVersion] = useState<number>(0)

  // 내 현재 꾸며진 펫 외형 (대표님 피드백: 순백 도우 DIY 커스텀 100% 반영)
  const myCurrentLook = React.useMemo(() => {
    const lk = monsterLook(currentMonster)
    const custom = loadMallangCustom(currentMonster.id)
    return {
      ...lk,
      color: '#FFFFFF',
      mallang: {
        ...lk.mallang,
        ...custom,
        color: '#FFFFFF',
        baseColor: '#FFFFFF',
      },
    }
  }, [currentMonster, customVersion])

  // 초기 로드
  useEffect(() => {
    try {
      const savedParties = localStorage.getItem(OPEN_PARTIES_STORAGE_KEY)
      if (savedParties) {
        setOpenParties(JSON.parse(savedParties))
      } else {
        const initialParties: OpenPartyRoom[] = [
          {
            id: 'room-1',
            title: '🍓 딸기 모찌 하우스 (오픈 파티)',
            hostName: '달콤요정',
            baseType: 'box',
            capacity: 4,
            slots: [
              {
                slotIndex: 0,
                ownerName: '달콤요정',
                petName: '베리모찌',
                species: 'mochi',
                look: { ...myCurrentLook, palette: 1 },
                isMine: false,
                placedAt: new Date().toISOString(),
              },
              null,
              null,
              null,
            ],
            isCompleted: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'room-2',
            title: '🎂 생크림 셀러브레이션 케이크 4구',
            hostName: '파티셰',
            baseType: 'cake',
            capacity: 4,
            slots: [
              {
                slotIndex: 0,
                ownerName: '파티셰',
                petName: '쇼콜라',
                species: 'choco',
                look: { ...myCurrentLook, species: 'choco', palette: 0 },
                isMine: false,
                placedAt: new Date().toISOString(),
              },
              {
                slotIndex: 1,
                ownerName: '슈가스노우',
                petName: '말랑푸딩',
                species: 'pudding',
                look: { ...myCurrentLook, species: 'pudding', palette: 0 },
                isMine: false,
                placedAt: new Date().toISOString(),
              },
              null,
              null,
            ],
            isCompleted: false,
            createdAt: new Date().toISOString(),
          },
        ]
        setOpenParties(initialParties)
        localStorage.setItem(OPEN_PARTIES_STORAGE_KEY, JSON.stringify(initialParties))
      }

      const savedShowcase = localStorage.getItem(SHOWCASE_STORAGE_KEY)
      if (savedShowcase) {
        setShowcaseList(JSON.parse(savedShowcase))
      }
    } catch (e) {
      console.error('파티 데이터 로드 오류:', e)
    }
  }, [myCurrentLook])

  // 칸 수 변경 시 슬롯 동기화
  useEffect(() => {
    setSoloSlots((prev) => {
      const next = new Array(selectedCapacity).fill(null)
      for (let i = 0; i < Math.min(prev.length, selectedCapacity); i++) {
        next[i] = prev[i]
      }
      if (!next[0]) {
        next[0] = {
          slotIndex: 0,
          ownerName: '나',
          petName: currentMonster.name || '내 펫',
          species: currentMonster.species,
          look: myCurrentLook,
          isMine: true,
          placedAt: new Date().toISOString(),
        }
      }
      return next
    })
  }, [selectedCapacity, currentMonster, myCurrentLook])

  const handlePlaceMyPetInSoloSlot = (slotIdx: number) => {
    setSoloSlots((prev) => {
      const copy = [...prev]
      copy[slotIdx] = {
        slotIndex: slotIdx,
        ownerName: '나',
        petName: currentMonster.name || '내 펫',
        species: currentMonster.species,
        look: myCurrentLook,
        isMine: true,
        placedAt: new Date().toISOString(),
      }
      return copy
    })
  }

  const handleClearSoloSlot = (slotIdx: number) => {
    setSoloSlots((prev) => {
      const copy = [...prev]
      copy[slotIdx] = null
      return copy
    })
  }

  const handleSendGiftToMiniroom = () => {
    const filledSlots = soloSlots.filter((s): s is PartySlotItem => s !== null)
    if (filledSlots.length === 0) {
      alert('상자에 최소 1마리 이상의 펫을 담아주세요!')
      return
    }

    const recipient = giftRecipient.trim() || '소중한 친구'
    const newGift: DeliveredGiftPackage = {
      id: `gift-${Date.now()}`,
      senderName: currentMonster.name ? `${currentMonster.name}의 파티셰` : '달콤한 친구',
      recipientName: recipient,
      title: `${selectedBase === 'box' ? '수제 초코상자' : selectedBase === 'cake' ? '생크림 파티케이크' : '로열 티트레이'} (${selectedCapacity}구)`,
      baseType: selectedBase,
      capacity: selectedCapacity,
      slots: filledSlots,
      finishing: { lettering, powder, ribbon },
      letterMessage: lettering,
      sentAt: new Date().toISOString(),
      isOpened: false,
    }

    try {
      const existing = localStorage.getItem(DELIVERED_GIFTS_STORAGE_KEY)
      const list: DeliveredGiftPackage[] = existing ? JSON.parse(existing) : []
      list.unshift(newGift)
      localStorage.setItem(DELIVERED_GIFTS_STORAGE_KEY, JSON.stringify(list))

      setGiftSentToast(`💌 "${recipient}"님의 미니룸으로 배달되었습니다! 리본을 풀면 편지와 함께 언박싱됩니다.`)
      setTimeout(() => setGiftSentToast(null), 4500)
    } catch (e) {
      console.error('선물 발송 오류:', e)
    }
  }

  const handleSaveToMyShowcase = () => {
    const partyData: OpenPartyRoom = {
      id: `party-solo-${Date.now()}`,
      title: `나만의 ${selectedCapacity}구 ${selectedBase === 'box' ? '선물상자' : selectedBase === 'cake' ? '케이크' : '티 트레이'}`,
      hostName: '나',
      baseType: selectedBase,
      capacity: selectedCapacity,
      slots: soloSlots,
      finishing: { lettering, powder, ribbon },
      isCompleted: true,
      createdAt: new Date().toISOString(),
    }

    try {
      const existing = localStorage.getItem(SHOWCASE_STORAGE_KEY)
      const list: OpenPartyRoom[] = existing ? JSON.parse(existing) : []
      list.unshift(partyData)
      localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(list.slice(0, 30)))
      setShowcaseList(list)

      if (onSaveToMiniroom) onSaveToMiniroom(partyData)
      alert('✨ 나만의 미니룸 진열장에 소장되었습니다!')
    } catch (e) {
      console.error('진열장 소장 실패:', e)
    }
  }

  const handleCreateOpenParty = () => {
    const title = prompt('새 오픈 파티의 이름을 입력해 주세요:', '누구나 환영하는 달콤 디저트 파티')
    if (!title) return

    const newRoom: OpenPartyRoom = {
      id: `open-room-${Date.now()}`,
      title: title.slice(0, 25),
      hostName: currentMonster.name || '방장',
      baseType: selectedBase,
      capacity: selectedCapacity,
      slots: new Array(selectedCapacity).fill(null),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    }
    newRoom.slots[0] = {
      slotIndex: 0,
      ownerName: currentMonster.name || '나',
      petName: currentMonster.name || '내 펫',
      species: currentMonster.species,
      look: myCurrentLook,
      isMine: true,
      placedAt: new Date().toISOString(),
    }

    const updated = [newRoom, ...openParties]
    setOpenParties(updated)
    localStorage.setItem(OPEN_PARTIES_STORAGE_KEY, JSON.stringify(updated))
    setActiveRoomId(newRoom.id)
  }

  const handleJoinOpenPartySlot = (roomId: string, slotIdx: number) => {
    const room = openParties.find((r) => r.id === roomId)
    if (!room || room.isCompleted) return

    const updatedSlots = [...room.slots]
    updatedSlots[slotIdx] = {
      slotIndex: slotIdx,
      ownerName: currentMonster.name || '방문 지인',
      petName: currentMonster.name || '내 펫',
      species: currentMonster.species,
      look: myCurrentLook,
      isMine: true,
      placedAt: new Date().toISOString(),
    }

    const isNowCompleted = updatedSlots.every((s) => s !== null)
    const updatedRoom: OpenPartyRoom = {
      ...room,
      slots: updatedSlots,
      isCompleted: isNowCompleted,
    }

    const updatedList = openParties.map((r) => (r.id === roomId ? updatedRoom : r))
    setOpenParties(updatedList)
    localStorage.setItem(OPEN_PARTIES_STORAGE_KEY, JSON.stringify(updatedList))

    if (isNowCompleted) {
      setShowCelebration(true)
      const existingShowcase = localStorage.getItem(SHOWCASE_STORAGE_KEY)
      const showcaseArr: OpenPartyRoom[] = existingShowcase ? JSON.parse(existingShowcase) : []
      showcaseArr.unshift(updatedRoom)
      localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(showcaseArr.slice(0, 30)))
      setShowcaseList(showcaseArr)
      setTimeout(() => setShowCelebration(false), 4000)
    }
  }

  // 🏆 대표님 피드백 반영: "들어가 보기만 해도 장식된 뷰를 볼 수 있고, 거기에 내 펫을 얹어 완성하는 직관적 뷰"
  const renderLuxuryShowcaseBase = (
    baseType: PartyBaseType,
    capacity: SlotCapacity,
    slotsArr: (PartySlotItem | null)[],
    interactive: boolean,
    onSlotClick?: (idx: number) => void
  ) => {
    const gridCols =
      capacity === 1
        ? '1fr'
        : capacity === 2
        ? 'repeat(2, 1fr)'
        : capacity === 16
        ? 'repeat(4, 1fr)'
        : capacity === 9
        ? 'repeat(3, 1fr)'
        : capacity === 6
        ? 'repeat(3, 1fr)'
        : 'repeat(2, 1fr)'

    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '6px auto', boxSizing: 'border-box' }}>
        {/* ================================================================= */}
        {/* 1. 🎁 실제 수제 초콜릿 선물상자 (첨부 사진 1, 2, 3, 4 기반) */}
        {/* ================================================================= */}
        {baseType === 'box' && (
          <div
            style={{
              position: 'relative',
              padding: '26px 14px 18px 14px',
              borderRadius: 22,
              background: 'linear-gradient(145deg, #1A0D07 0%, #2E170C 50%, #120703 100%)',
              border: '3.5px solid #C59B27',
              boxShadow: '0 24px 45px -8px rgba(0,0,0,0.7), inset 0 2px 6px rgba(255,215,0,0.3)',
              boxSizing: 'border-box',
            }}
          >
            {/* 🎀 실제 선물상자 상단 브라운 실크 리본 & 라벨 (사진 3, 4 벤치마킹) */}
            <div
              style={{
                position: 'absolute',
                top: -13,
                left: 14,
                right: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg, #5C3218 0%, #3B1B0A 100%)',
                  color: '#FFD700',
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: '1.5px solid #C59B27',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                }}
              >
                <span>🎀</span>
                <span>수제 쇼콜라 컬렉션</span>
              </div>

              {/* 하얀 선물 태그 카드 */}
              <div
                style={{
                  background: '#FFFFFF',
                  color: '#2E1A11',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #D7CCC8',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.25)',
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                {capacity}구 골드 트레이
              </div>
            </div>

            {/* 상자 내부 골드/다크초코 트레이 (사진 2, 3, 4 기반) */}
            <div
              style={{
                padding: 10,
                borderRadius: 16,
                background: 'linear-gradient(to bottom, #26160F 0%, #1A0D08 100%)',
                border: '2px solid #8D5B2A',
                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.8)',
              }}
            >
              {/* 상자 트레이 헤더 정보 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 6,
                  marginBottom: 8,
                  borderBottom: '1px solid #4A2818',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#FDE68A' }}>
                    🍫 프리미엄 수제 봉봉 박스
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: '#F59E0B',
                    background: '#1F1109',
                    padding: '2px 8px',
                    borderRadius: 10,
                    border: '1px solid #78350F',
                  }}
                >
                  {slotsArr.filter((s) => s !== null).length} / {capacity}개 완성
                </span>
              </div>

              {/* 디저트 컵 그리드: 주름진 유산지 컵(Cup Liner) 및 2칸 가변 슬롯 지원 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridCols,
                  gap: 8,
                }}
              >
                {slotsArr.map((item, idx) => {
                  const isSelected = selectedSlotIndex === idx
                  const isLongRoll = item?.look?.mallang?.doughShape === 'long-roll'

                  return (
                    <div
                      key={idx}
                      onClick={() => interactive && onSlotClick && onSlotClick(idx)}
                      style={{
                        position: 'relative',
                        gridColumn: isLongRoll ? 'span 2' : 'span 1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 110,
                        borderRadius: isLongRoll ? 20 : 16,
                        padding: 6,
                        cursor: 'pointer',
                        // 주름진 브라운 유산지 컵 (사진 1, 2, 3, 4 동일 질감)
                        background: item
                          ? 'radial-gradient(circle, #3D2214 0%, #201108 80%, #150A05 100%)'
                          : 'radial-gradient(circle, #2C180E 0%, #1F0F07 80%, #140804 100%)',
                        border: isSelected && interactive
                          ? '3px solid #F59E0B'
                          : '2px solid #5C3318',
                        boxShadow: isSelected && interactive
                          ? '0 0 0 3px rgba(245,158,11,0.4), inset 0 3px 8px rgba(0,0,0,0.6)'
                          : 'inset 0 3px 10px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.4)',
                        transform: isSelected && interactive ? 'scale(1.03)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                          {/* 실시간 3D 펫 */}
                          <div
                            style={{
                              width: isLongRoll ? 110 : 64,
                              height: 64,
                              pointerEvents: 'none',
                              animation: `breathing-wiggle 3s ease-in-out infinite ${idx * 0.3}s`,
                            }}
                          >
                            <Monster3DView look={item.look} size={64} interactive={false} />
                          </div>

                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 900,
                              color: '#FEF3C7',
                              marginTop: 2,
                              maxWidth: isLongRoll ? 120 : 70,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            }}
                          >
                            {item.petName}
                          </span>
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 800,
                              color: '#FCD34D',
                              background: '#3B1D0E',
                              padding: '1px 5px',
                              borderRadius: 6,
                              marginTop: 1,
                              border: '1px solid #78350F',
                            }}
                          >
                            by {item.ownerName}
                          </span>

                          {interactive && item.isMine && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClearSoloSlot(idx)
                              }}
                              style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                background: '#EF4444',
                                color: '#FFFFFF',
                                fontSize: 10,
                                fontWeight: 900,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                              }}
                              title="슬롯 비우기"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        /* ✨ 실제 세팅된 브라운 주름 유산지 컵 (Fluted Cup) 빈 슬롯 */
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 0' }}>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              background: 'radial-gradient(circle, #3D2214 30%, #231209 85%, #140804 100%)',
                              border: '1.5px dashed #C59B27',
                              boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                            }}
                          >
                            🍫
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#D97706' }}>
                            {idx + 1}번 유산지 컵
                          </span>
                          {interactive && (
                            <span
                              style={{
                                fontSize: 8,
                                fontWeight: 900,
                                color: '#FDE68A',
                                background: '#3F2212',
                                padding: '1px 6px',
                                borderRadius: 6,
                                border: '1px solid #78350F',
                              }}
                            >
                              + 내 펫 얹기
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. 🎂 파티 셀러브레이션 케이크: 순백 생크림 돔 + 딸기/마카롱 테두리 토핑 */}
        {/* ================================================================= */}
        {baseType === 'cake' && (
          <div
            style={{
              position: 'relative',
              padding: 20,
              borderRadius: '50%',
              aspectRatio: '1 / 1',
              width: '100%',
              maxWidth: 340,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle, #FFFFFF 40%, #FFF8F0 75%, #FDEED9 100%)',
              border: '6px solid #FFF5EB',
              boxShadow: '0 20px 40px -10px rgba(225, 29, 72, 0.25), inset 0 3px 10px rgba(0,0,0,0.06)',
              boxSizing: 'border-box',
            }}
          >
            {/* 가장자리 생크림 & 딸기 데코 */}
            <div
              style={{
                position: 'absolute',
                inset: 8,
                borderRadius: '50%',
                border: '3px dashed #FBCFE8',
                pointerEvents: 'none',
              }}
            >
              <span style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>🍓</span>
              <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>🍓</span>
              <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🍓</span>
              <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🍓</span>
            </div>

            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 260, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: '#BE185D',
                  background: 'rgba(255,241,242,0.95)',
                  padding: '3px 10px',
                  borderRadius: 12,
                  border: '1px solid #FECDD3',
                  marginBottom: 10,
                }}
              >
                🎂 생크림 파티 케이크 ({capacity}구)
              </span>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: capacity === 1 ? '1fr' : 'repeat(2, 1fr)',
                  gap: 10,
                  width: '100%',
                }}
              >
                {slotsArr.slice(0, capacity).map((item, idx) => {
                  const isSelected = selectedSlotIndex === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => interactive && onSlotClick && onSlotClick(idx)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 105,
                        borderRadius: '50%',
                        padding: 8,
                        cursor: 'pointer',
                        background: item ? '#FFFFFF' : 'radial-gradient(circle, #FFFFFF 40%, #FFF1F2 100%)',
                        border: isSelected && interactive ? '3px solid #E11D48' : '2px solid #FBCFE8',
                        boxShadow: isSelected && interactive ? '0 0 0 3px rgba(225,29,72,0.3)' : '0 3px 8px rgba(0,0,0,0.06)',
                        transform: isSelected && interactive ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              pointerEvents: 'none',
                              animation: `breathing-wiggle 3s ease-in-out infinite ${idx * 0.3}s`,
                            }}
                          >
                            <Monster3DView look={item.look} size={56} interactive={false} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 900, color: '#1E293B', maxWidth: 75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.petName}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: '50%',
                              background: '#FFF5F5',
                              border: '1.5px dashed #FB7185',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                            }}
                          >
                            🍰
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#FB7185' }}>+ 토핑 얹기</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. 🫖 로열 애프터눈 티 트레이: 프렌치 레이스 도일리 + 황금 은식기 림 */}
        {/* ================================================================= */}
        {baseType === 'tea-stand' && (
          <div
            style={{
              position: 'relative',
              padding: 16,
              borderRadius: 28,
              background: 'linear-gradient(135deg, #F3F4F6 0%, #FFFFFF 50%, #E5E7EB 100%)',
              border: '4px solid #D4AF37',
              boxShadow: '0 20px 35px -8px rgba(0,0,0,0.3), inset 0 2px 6px rgba(255,255,255,0.9)',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                padding: 14,
                borderRadius: 20,
                background: '#FFFFFF',
                border: '2px dashed #CBD5E1',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 8,
                  marginBottom: 10,
                  borderBottom: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>🫖</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#1E293B' }}>로열 하이 티 스탠드</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#92400E', background: '#FEF3C7', padding: '2px 8px', borderRadius: 12 }}>
                    {capacity}구 플레이트
                  </span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#64748B' }}>
                  {slotsArr.filter((s) => s !== null).length} / {capacity}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridCols,
                  gap: 10,
                }}
              >
                {slotsArr.slice(0, capacity).map((item, idx) => {
                  const isSelected = selectedSlotIndex === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => interactive && onSlotClick && onSlotClick(idx)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 110,
                        borderRadius: 18,
                        padding: 8,
                        cursor: 'pointer',
                        background: item ? '#FFFFFF' : '#F8FAFC',
                        border: isSelected && interactive ? '3px solid #F59E0B' : '1.5px solid #E2E8F0',
                        boxShadow: isSelected && interactive ? '0 0 0 3px rgba(245,158,11,0.3)' : '0 2px 6px rgba(0,0,0,0.05)',
                        transform: isSelected && interactive ? 'scale(1.03)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              pointerEvents: 'none',
                              animation: `breathing-wiggle 3s ease-in-out infinite ${idx * 0.3}s`,
                            }}
                          >
                            <Monster3DView look={item.look} size={56} interactive={false} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 900, color: '#1E293B', marginTop: 4, maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.petName}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0' }}>
                          <span style={{ fontSize: 22 }}>🫖</span>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#64748B' }}>+ 은식기 플레이팅</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 🍫 하단 리얼 초콜릿 메시지 팻말 */}
        {lettering && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 16px',
              borderRadius: 14,
              background: 'linear-gradient(to right, #3E2215, #4A2B19, #3E2215)',
              border: '1.5px solid #8D5A32',
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#FFD700',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            <span style={{ fontSize: 13 }}>🖋️</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              &ldquo;{lettering}&rdquo;
            </span>
          </div>
        )}
      </div>
    )
  }

  const currentOpenRoom = openParties.find((r) => r.id === activeRoomId)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#FFF9F2',
        color: '#1E293B',
        userSelect: 'none',
        overflowY: 'auto',
      }}
    >
      <style>{`
        @keyframes breathing-wiggle {
          0%, 100% {
            transform: translateY(0px) scale(1) rotate(0deg);
          }
          30% {
            transform: translateY(-3px) scale(1.04, 0.96) rotate(1.8deg);
          }
          65% {
            transform: translateY(2px) scale(0.97, 1.03) rotate(-1.8deg);
          }
        }
      `}</style>

      {/* 🎨 [메챠 자유 색칠 & 데코 공방] 모달 */}
      {showAtelierModal && (
        <MallangAtelierModal
          monster={currentMonster}
          onClose={() => setShowAtelierModal(false)}
          onSaved={(savedCustom) => {
            setCustomVersion((v) => v + 1)
            const updatedLook: MonsterLook = {
              ...monsterLook(currentMonster),
              mallang: {
                ...loadMallangCustom(currentMonster.id),
                ...savedCustom,
                color: '#FFFFFF',
                baseColor: '#FFFFFF',
              },
            }
            setSoloSlots((prev) => {
              const copy = [...prev]
              copy[0] = {
                slotIndex: 0,
                ownerName: '나',
                petName: currentMonster.name || '내 펫',
                species: currentMonster.species,
                look: updatedLook,
                isMine: true,
                placedAt: new Date().toISOString(),
              }
              return copy
            })
          }}
        />
      )}

      {/* 🌸 상단 네비게이션 헤더 */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #FFE4E6',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            marginLeft: -8,
            borderRadius: '50%',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#831843', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🎉</span>
            <span>파티 쇼케이스</span>
          </h1>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#EC4899', marginTop: 2 }}>
            {mainTab === 'solo' && '1인 상자 꾸미기 & 미니룸 선물'}
            {mainTab === 'open_lounge' && '누구나 참여하는 오픈 지인 모드'}
            {mainTab === 'showcase' && '명예의 파티 진열장'}
          </span>
        </div>
        <div style={{ width: 32 }} />
      </header>

      {/* 🎀 3대 메인 탭 바 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px 4px 16px',
          maxWidth: 430,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setMainTab('solo')
            setActiveRoomId(null)
          }}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 14,
            fontWeight: 900,
            fontSize: 13,
            border: mainTab === 'solo' ? 'none' : '1px solid #E2E8F0',
            background: mainTab === 'solo' ? 'linear-gradient(135deg, #EC4899, #BE185D)' : '#FFFFFF',
            color: mainTab === 'solo' ? '#FFFFFF' : '#475569',
            cursor: 'pointer',
            boxShadow: mainTab === 'solo' ? '0 4px 10px rgba(236,72,153,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>🧑‍🍳 1인 선물 모드</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab('open_lounge')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 14,
            fontWeight: 900,
            fontSize: 13,
            border: mainTab === 'open_lounge' ? 'none' : '1px solid #E2E8F0',
            background: mainTab === 'open_lounge' ? 'linear-gradient(135deg, #9333EA, #7E22CE)' : '#FFFFFF',
            color: mainTab === 'open_lounge' ? '#FFFFFF' : '#475569',
            cursor: 'pointer',
            boxShadow: mainTab === 'open_lounge' ? '0 4px 10px rgba(147,51,234,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Users size={14} />
          <span>오픈 지인 모드</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab('showcase')}
          style={{
            padding: '10px 16px',
            borderRadius: 14,
            fontWeight: 900,
            fontSize: 13,
            border: mainTab === 'showcase' ? 'none' : '1px solid #E2E8F0',
            background: mainTab === 'showcase' ? 'linear-gradient(135deg, #D97706, #B45309)' : '#FFFFFF',
            color: mainTab === 'showcase' ? '#FFFFFF' : '#475569',
            cursor: 'pointer',
            boxShadow: mainTab === 'showcase' ? '0 4px 10px rgba(217,119,6,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <span>🏆 진열장</span>
        </button>
      </div>

      {/* 선물 발송 알림 토스트 */}
      {giftSentToast && (
        <div
          style={{
            margin: '8px 16px',
            padding: '10px 14px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 900,
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Sparkles size={16} />
          <span>{giftSentToast}</span>
        </div>
      )}

      {/* 축하 폭죽 모달 */}
      {showCelebration && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#FFFFFF',
              borderRadius: 24,
              border: '4px solid #F59E0B',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 12,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ fontSize: 48 }}>🎊 🎁 🎊</span>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#451A03' }}>디저트 파티 완성!</h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#475569', lineHeight: 1.5 }}>
              모든 슬롯이 달콤하게 채워졌습니다! 참여자들의 정성이 담긴 쇼케이스가 <strong>[명예의 진열장]</strong>에 영구 등록되었습니다! ✨
            </p>
          </div>
        </div>
      )}

      <main style={{ flex: 1, maxWidth: 430, width: '100%', margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, boxSizing: 'border-box' }}>
        {/* ========================================================================= */}
        {/* TAB 1: 1인 나만의 모드 */}
        {/* ========================================================================= */}
        {mainTab === 'solo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* ✨ 대표님 피드백 2번 반영: [자유 색칠 & 데코 공방 (DIY 아뜰리에)] 배너 버튼 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 18,
                background: 'linear-gradient(135deg, #FFF1F2 0%, #FFFFFF 50%, #FEF3C7 100%)',
                border: '1.5px solid #FBCFE8',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: '#FCE7F3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1.5px solid #FBCFE8',
                  }}
                >
                  <Monster3DView look={myCurrentLook} size={44} interactive={false} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#1E293B' }}>
                      {currentMonster.name || '내 펫'}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: '#BE185D',
                        background: '#FFF1F2',
                        padding: '1px 6px',
                        borderRadius: 10,
                        border: '1px solid #FECDD3',
                      }}
                    >
                      DIY 펫
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                    원하는 색과 데코를 직접 자유롭게 만들어보세요!
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {/* 🎨 메챠 자유 색칠 & 데코 공방 열기 버튼 */}
                <button
                  type="button"
                  onClick={() => setShowAtelierModal(true)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #EC4899, #BE185D)',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 900,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    boxShadow: '0 3px 8px rgba(236,72,153,0.35)',
                  }}
                  title="자유롭게 색칠하고 데코를 직접 만드는 공방"
                >
                  <Palette size={13} />
                  <span>자유 공방</span>
                </button>

                {/* 🛍️ 무기/장착 아이템 부티크 상점 열기 버튼 */}
                {onOpenBoutique && (
                  <button
                    type="button"
                    onClick={onOpenBoutique}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 900,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 3px 8px rgba(139,92,246,0.35)',
                    }}
                    title="무기 및 아이템을 구입하고 착용하는 부티크 상점"
                  >
                    <span>🛍️</span>
                    <span>아이템 샵</span>
                  </button>
                )}
              </div>
            </div>

            {/* 🎁 직관적 원스톱 뷰: 들어가자마자 장식된 실제 수제 초콜릿 상자가 바로 보이고, 즉시 내 펫을 얹는 완성형 뷰 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 상단 1: 상자 베이스 및 칸 수 빠른 선택 바 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 16,
                  background: '#FFFFFF',
                  border: '1px solid #FFE4E6',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                {/* 시그니처 베이스 종류 선택 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#334155' }}>
                    상자 베이스:
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { id: 'box', name: '초코 상자', icon: '🎁' },
                      { id: 'cake', name: '케이크', icon: '🎂' },
                      { id: 'tea-stand', name: '티 트레이', icon: '🫖' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBase(b.id as PartyBaseType)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 900,
                          border: selectedBase === b.id ? '2px solid #EC4899' : '1px solid #CBD5E1',
                          background: selectedBase === b.id ? '#FFF1F2' : '#FFFFFF',
                          color: selectedBase === b.id ? '#BE185D' : '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        {b.icon} {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 칸 수 선택: 2구(소수/커플)부터 4구, 6구, 9구, 16구까지 자유 선택 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#334155' }}>
                    상자 크기:
                  </span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {([2, 4, 6, 9, 16] as SlotCapacity[]).map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setSelectedCapacity(cap)}
                        style={{
                          padding: '4px 9px',
                          borderRadius: 8,
                          fontWeight: 900,
                          fontSize: 11,
                          border: selectedCapacity === cap ? 'none' : '1px solid #E2E8F0',
                          background: selectedCapacity === cap ? '#F43F5E' : '#F1F5F9',
                          color: selectedCapacity === cap ? '#FFFFFF' : '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        {cap}구
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 🏆 중앙: 실제 프리미엄 수제 초콜릿 상자 탑다운(Top-down) 뷰 */}
              {renderLuxuryShowcaseBase(selectedBase, selectedCapacity, soloSlots, true, (idx) => {
                setSelectedSlotIndex(idx)
                if (!soloSlots[idx]) {
                  handlePlaceMyPetInSoloSlot(idx)
                }
              })}

              {/* 퀵 액션: 빈 슬롯 채우기 바 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: '#FFFFFF',
                  border: '1px solid #FFE4E6',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>
                    선택된 <strong style={{ color: '#EC4899' }}>{selectedSlotIndex + 1}번 자리</strong>
                  </span>
                  <span style={{ fontSize: 10, color: '#64748B' }}>
                    (상자의 빈 컵을 터치해도 담깁니다)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {soloSlots[selectedSlotIndex] ? (
                    <button
                      type="button"
                      onClick={() => handleClearSoloSlot(selectedSlotIndex)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 10,
                        background: '#FEE2E2',
                        color: '#DC2626',
                        fontSize: 11,
                        fontWeight: 900,
                        border: '1px solid #FCA5A5',
                        cursor: 'pointer',
                      }}
                    >
                      꺼내기
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePlaceMyPetInSoloSlot(selectedSlotIndex)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 10,
                        background: '#EC4899',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 900,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(236,72,153,0.3)',
                      }}
                    >
                      내 펫 담기
                    </button>
                  )}
                </div>
              </div>

              {/* 💌 피니싱 터치: 손글씨 메시지 카드 & 리본 포장 & 미니룸 배달/진열장 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: 14,
                  borderRadius: 18,
                  background: '#FFFFFF',
                  border: '1.5px solid #FBCFE8',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                }}
              >
                {/* 초코펜 레터링 손글씨 (사진 4, 5, 6번 스타일) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: '#451A03' }}>
                      🍫 초코펜 손글씨 카드 (선물 언박싱 시 공개됩니다)
                    </label>
                    <span style={{ fontSize: 10, color: '#EC4899', fontWeight: 800 }}>{lettering.length}/50</span>
                  </div>
                  <input
                    type="text"
                    value={lettering}
                    onChange={(e) => setLettering(e.target.value.slice(0, 50))}
                    placeholder="예: 너가 최고야~, 오늘 하루도 달콤하길 💖"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFDF9',
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#1E293B',
                      boxSizing: 'border-box',
                    }}
                  />
                  {/* 추천 문구 빠른 입력 칩 */}
                  <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
                    {[
                      '너가 최고야~ 👍',
                      '오늘 하루도 달콤하길 💖',
                      '합격은 당근이지! 🥕',
                      '언제나 응원해 ✨',
                      '사랑해 늘 고마워 💝',
                    ].map((phrase) => (
                      <button
                        key={phrase}
                        type="button"
                        onClick={() => setLettering(phrase)}
                        style={{
                          flexShrink: 0,
                          padding: '3px 7px',
                          borderRadius: 8,
                          background: '#FFF1F2',
                          border: '1px solid #FECDD3',
                          color: '#BE185D',
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 리본 색상 선택 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#451A03' }}>🎀 선물 실크 리본:</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { id: 'rose-pink', name: '로즈핑크', color: '#FF4081' },
                      { id: 'royal-gold', name: '골드브라운', color: '#8D5B2A' },
                      { id: 'mint-sky', name: '민트', color: '#26A69A' },
                      { id: 'pure-white', name: '화이트', color: '#E2E8F0' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRibbon(r.id as FinishingTouch['ribbon'])}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          borderRadius: 8,
                          border: ribbon === r.id ? '2px solid #EC4899' : '1px solid #E2E8F0',
                          background: ribbon === r.id ? '#FFF1F2' : '#FFFFFF',
                          color: ribbon === r.id ? '#BE185D' : '#475569',
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                        <span>{r.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 지인 닉네임 입력 & 선물 배달 버튼 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4, borderTop: '1px solid #FCE7F3' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={giftRecipient}
                      onChange={(e) => setGiftRecipient(e.target.value.slice(0, 15))}
                      placeholder="받는 친구 닉네임 (비우면 내 미니룸에 배달)"
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: 12,
                        border: '1.5px solid #D8B4FE',
                        background: '#FAF5FF',
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#1E293B',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendGiftToMiniroom}
                      style={{
                        padding: '9px 16px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #EC4899, #F43F5E)',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        fontSize: 12,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '0 3px 8px rgba(236,72,153,0.3)',
                      }}
                    >
                      <Gift size={13} />
                      <span>미니룸 배달 🎁</span>
                    </button>
                  </div>
                  <span style={{ fontSize: 9.5, color: '#7E22CE', fontWeight: 700 }}>
                    💡 배달된 선물은 미니룸에서 터치 시 리본이 풀리며 글과 함께 화려하게 언박싱됩니다!
                  </span>
                </div>

                {/* 내 진열장 소장 버튼 */}
                <button
                  type="button"
                  onClick={handleSaveToMyShowcase}
                  style={{
                    width: '100%',
                    padding: '11px 0',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #D97706, #B45309)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: 12,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 3px 8px rgba(217,119,6,0.25)',
                  }}
                >
                  <Sparkles size={13} />
                  <span>내 명예의 진열장에 영구 소장하기</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 오픈 지인 모드 */}
        {/* ========================================================================= */}
        {mainTab === 'open_lounge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 18,
                background: 'linear-gradient(135deg, #FAF5FF 0%, #FFF1F2 50%, #FEF3C7 100%)',
                border: '1.5px solid #E9D5FF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#581C87', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={15} />
                  <span>오픈 디저트 파티 라운지</span>
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: 11, color: '#475569', fontWeight: 700 }}>
                  누구나 자유롭게 들어와 빈 칸에 자기 펫을 장식할 수 있어요!
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateOpenParty}
                style={{
                  padding: '8px 14px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #9333EA, #7E22CE)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(147,51,234,0.3)',
                  whiteSpace: 'nowrap',
                }}
              >
                + 새 파티 열기
              </button>
            </div>

            {!activeRoomId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>참여 가능한 열린 파티 목록</span>
                {openParties.map((room) => {
                  const filledCount = room.slots.filter((s) => s !== null).length
                  return (
                    <div
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: 18,
                        background: '#FFFFFF',
                        border: '1px solid #E9D5FF',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#1E293B' }}>{room.title}</span>
                        <span style={{ fontSize: 11, color: '#9333EA', fontWeight: 800, marginTop: 3 }}>
                          호스트: {room.hostName} • {room.capacity}구 베이스
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: 12,
                            background: '#FAF5FF',
                            color: '#7E22CE',
                            border: '1px solid #E9D5FF',
                          }}
                        >
                          {filledCount} / {room.capacity}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#94A3B8' }}>입장 ➔</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              currentOpenRoom && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => setActiveRoomId(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9333EA',
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      ← 목록으로 돌아가기
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#1E293B' }}>{currentOpenRoom.title}</span>
                  </div>

                  {renderLuxuryShowcaseBase(
                    currentOpenRoom.baseType,
                    currentOpenRoom.capacity,
                    currentOpenRoom.slots,
                    !currentOpenRoom.isCompleted,
                    (idx) => {
                      if (!currentOpenRoom.slots[idx]) {
                        handleJoinOpenPartySlot(currentOpenRoom.id, idx)
                      }
                    }
                  )}

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      background: '#FEF3C7',
                      border: '1.5px solid #FCD34D',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#92400E',
                      textAlign: 'center',
                    }}
                  >
                    💡 비어있는 칸을 터치하면 현재 내가 색칠하고 꾸민 펫이 즉시 들어갑니다!
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: 명예의 진열장 */}
        {/* ========================================================================= */}
        {mainTab === 'showcase' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #FEF3C7, #FFFBEB)',
                border: '1.5px solid #FCD34D',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 900, color: '#78350F', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🏆</span>
                <span>모두가 함께 완성한 명예의 진열장</span>
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#92400E' }}>{showcaseList.length}개 소장됨</span>
            </div>

            {showcaseList.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#94A3B8',
                  background: '#FFFFFF',
                  borderRadius: 18,
                  border: '2px dashed #CBD5E1',
                }}
              >
                아직 완성된 파티가 없습니다. 1인 모드 또는 오픈 지인 모드에서 파티를 완성해 보세요!
              </div>
            ) : (
              showcaseList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 14,
                    borderRadius: 20,
                    background: '#FFFFFF',
                    border: '1.5px solid #FCD34D',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #FEF3C7', paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#1E293B' }}>{item.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#EC4899' }}>
                      {item.slots.filter((s) => s !== null).length}구 완성
                    </span>
                  </div>
                  {renderLuxuryShowcaseBase(item.baseType, item.capacity, item.slots, false)}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
