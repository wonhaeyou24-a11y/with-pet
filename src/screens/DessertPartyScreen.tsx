/**
 * 🎉 디저트 파티 쇼케이스 (DessertPartyScreen.tsx) - 프리미엄 파티세리 에디션
 * 
 * 1. 3대 럭셔리 베이스 비주얼:
 *    - 🎁 수제 초콜릿 선물상자: 다크초코 원목 프레임 + 샴페인 골드 디바이더 + 금박 유산지 컵
 *    - 🎂 파티 케이크: 순백 생크림 원형 케이크 + 생크림 똬리 & 통딸기/마카롱 데코
 *    - 🫖 애프터눈 티 트레이: 프렌치 레이스 도일리가 깔린 우아한 로열 골드/실버 플레이트
 * 2. 쫀득 숨쉬기 액션: 컵/케이크 위에 앉아 살아 숨쉬듯 말랑하게 부풀고 갸웃거리는 펫 모션
 * 3. 내 현재 개성 펫(색칠+장식 완료) 원터치 장식 & 공방 바로가기
 * 4. 오픈 지인 모드: 초대링크 없이 누구나 들어와 함께 채우고 완성 시 명예의 진열장 등재
 * 5. 미니룸 선물 배달 & 리본 언박싱 연계
 */

import React, { useState, useEffect } from 'react'
import type { MonsterRow } from '../lib/api'
import { monsterLook } from '../lib/api'
import Monster3DView from '../monsters/Monster3DView'
import type { MonsterLook } from '../monsters/types'

export type PartyBaseType = 'box' | 'cake' | 'tea-stand'
export type SlotCapacity = 1 | 2 | 4 | 6 | 9

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

// 경량 인라인 SVG 아이콘
const ArrowLeft = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
)
const Sparkles = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
)
const Gift = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>
)
const Palette = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
)
const Users = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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

  // 1인 모드 상태
  const [soloStep, setSoloStep] = useState<1 | 2 | 3>(1)
  const [selectedBase, setSelectedBase] = useState<PartyBaseType>('box')
  const [selectedCapacity, setSelectedCapacity] = useState<SlotCapacity>(4)
  const [soloSlots, setSoloSlots] = useState<(PartySlotItem | null)[]>(() => new Array(4).fill(null))
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0)

  // 피니싱 터치 데코
  const [lettering, setLettering] = useState<string>('오늘 하루도 달콤함이 가득하길 💖')
  const [powder, setPowder] = useState<FinishingTouch['powder']>('sugar-snow')
  const [ribbon, setRibbon] = useState<FinishingTouch['ribbon']>('rose-pink')
  const [giftRecipient, setGiftRecipient] = useState<string>('')
  const [giftSentToast, setGiftSentToast] = useState<string | null>(null)

  // 오픈 지인 모드 상태
  const [openParties, setOpenParties] = useState<OpenPartyRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState<boolean>(false)

  // 명예의 진열장
  const [showcaseList, setShowcaseList] = useState<OpenPartyRoom[]>([])

  // 내 현재 꾸며진 펫 외형
  const myCurrentLook = React.useMemo(() => {
    return monsterLook(currentMonster)
  }, [currentMonster])

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

  // 🏆 럭셔리 파티세리 쇼케이스 베이스 렌더러 (입체 탑다운 뷰)
  const renderLuxuryShowcaseBase = (
    baseType: PartyBaseType,
    capacity: SlotCapacity,
    slotsArr: (PartySlotItem | null)[],
    interactive: boolean,
    onSlotClick?: (idx: number) => void
  ) => {
    return (
      <div className="relative w-full max-w-[360px] mx-auto select-none my-1">
        {/* ================================================================= */}
        {/* 1. 🎁 수제 초콜릿 선물상자: 럭셔리 옻칠 원목 + 샴페인 골드 림 + 금박 유산지 컵 */}
        {/* ================================================================= */}
        {baseType === 'box' && (
          <div
            className="relative p-4 rounded-3xl shadow-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #2D150B 0%, #431E10 45%, #1F0D06 100%)',
              border: '4px solid #C59B27',
              boxShadow: '0 20px 35px -8px rgba(0,0,0,0.65), inset 0 2px 6px rgba(255,215,0,0.4)',
            }}
          >
            {/* 상자 내부 푹신한 벨벳 크림 안감 쿠션 */}
            <div
              className="p-3.5 rounded-2xl shadow-inner relative"
              style={{
                background: 'linear-gradient(to bottom, #FFFBF5 0%, #FDF3E3 60%, #F5E5C9 100%)',
                border: '1.5px solid #E8D3B0',
              }}
            >
              {/* 상자 골드 헤더 */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-amber-200/90 px-1">
                <span className="text-[11px] font-black text-amber-950 flex items-center gap-1.5 tracking-tight">
                  <span className="text-sm">🎁</span>
                  <span>쇼콜라티에 수제 컬렉션</span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
                    {capacity}구 골드 박스
                  </span>
                </span>
                <span className="text-[10px] font-black text-amber-900 bg-white/90 px-2 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                  {slotsArr.filter((s) => s !== null).length} / {capacity}
                </span>
              </div>

              {/* 디저트 컵 그리드 */}
              <div
                className={`grid gap-2.5 ${
                  capacity === 1
                    ? 'grid-cols-1'
                    : capacity === 2
                    ? 'grid-cols-2'
                    : capacity === 4
                    ? 'grid-cols-2'
                    : capacity === 6
                    ? 'grid-cols-3'
                    : 'grid-cols-3'
                }`}
              >
                {slotsArr.map((item, idx) => {
                  const isSelected = selectedSlotIndex === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => interactive && onSlotClick && onSlotClick(idx)}
                      className={`relative flex flex-col items-center justify-center min-h-[120px] rounded-2xl p-1.5 transition-all duration-300 cursor-pointer ${
                        item
                          ? 'bg-gradient-to-b from-[#FFFDF7] via-[#FFF8E7] to-[#FCE8C3] shadow-md border-2 border-[#D4AF37]'
                          : 'bg-[#FFF8EC]/60 border-2 border-dashed border-[#D4AF37]/70 hover:bg-[#FFF3D6]'
                      } ${isSelected && interactive ? 'ring-3 ring-pink-500 scale-[1.03] shadow-lg' : ''}`}
                    >
                      {/* 금박 유산지 컵 주름 림 (오목한 입체감) */}
                      <div className="absolute inset-1 rounded-xl border border-[#D4AF37]/40 pointer-events-none" />

                      {item ? (
                        <div className="relative flex flex-col items-center w-full">
                          {/* 쫀득 숨쉬기 액션 래퍼 */}
                          <div
                            className="w-16 h-16 pointer-events-none transition-transform"
                            style={{
                              animation: `breathing-wiggle 3s ease-in-out infinite ${idx * 0.35}s`,
                            }}
                          >
                            <Monster3DView look={item.look} size={64} interactive={false} />
                          </div>

                          <span className="text-[11px] font-black text-amber-950 mt-1 truncate max-w-[85px]">
                            {item.petName}
                          </span>
                          <span className="text-[9px] font-bold text-pink-700 bg-pink-100/90 px-1.5 py-0.2 rounded-full mt-0.5 truncate max-w-[85px] border border-pink-200">
                            by {item.ownerName}
                          </span>

                          {interactive && item.isMine && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClearSoloSlot(idx)
                              }}
                              className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold shadow-xs hover:bg-rose-600 transition"
                              title="슬롯 비우기"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 py-3 text-amber-900/60">
                          <span className="text-xl">🧁</span>
                          <span className="text-[10px] font-black text-amber-900/80">
                            {idx + 1}번 금박 컵
                          </span>
                          {interactive && (
                            <span className="text-[8px] text-pink-600 font-extrabold bg-pink-50 px-1.5 py-0.5 rounded-full border border-pink-200">
                              터치하여 넣기
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
            className="relative p-5 rounded-full shadow-2xl overflow-hidden aspect-square flex flex-col items-center justify-center"
            style={{
              background: 'radial-gradient(circle, #FFFFFF 40%, #FFF8F0 75%, #FDEED9 100%)',
              border: '6px solid #FFF5EB',
              boxShadow: '0 20px 40px -10px rgba(225, 29, 72, 0.25), inset 0 3px 10px rgba(0,0,0,0.06)',
            }}
          >
            {/* 가장자리 생크림 똬리 & 통딸기 데코 원형 림 */}
            <div className="absolute inset-2 rounded-full border-4 border-dashed border-pink-200/80 pointer-events-none flex items-center justify-center">
              <span className="absolute top-1 text-base">🍓</span>
              <span className="absolute bottom-1 text-base">🍓</span>
              <span className="absolute left-1 text-base">🍓</span>
              <span className="absolute right-1 text-base">🍓</span>
              <span className="absolute top-3 right-3 text-sm">🧁</span>
              <span className="absolute top-3 left-3 text-sm">🧁</span>
              <span className="absolute bottom-3 right-3 text-sm">🧁</span>
              <span className="absolute bottom-3 left-3 text-sm">🧁</span>
            </div>

            {/* 케이크 상판 중앙 플레이팅 영역 */}
            <div className="relative z-10 w-full max-w-[270px] flex flex-col items-center">
              <span className="text-[10px] font-black text-pink-700 bg-pink-50/90 px-2 py-0.5 rounded-full border border-pink-200 mb-2">
                🎂 생크림 파티 케이크 ({capacity}구)
              </span>

              <div
                className={`grid gap-2 w-full ${
                  capacity === 1 ? 'grid-cols-1' : capacity === 2 ? 'grid-cols-2' : 'grid-cols-2'
                }`}
              >
                {slotsArr.slice(0, capacity).map((item, idx) => {
                  const isSelected = selectedSlotIndex === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => interactive && onSlotClick && onSlotClick(idx)}
                      className={`relative flex flex-col items-center justify-center min-h-[105px] rounded-full p-2 transition cursor-pointer ${
                        item
                          ? 'bg-white/90 shadow-md border-2 border-pink-300'
                          : 'bg-pink-100/40 border-2 border-dashed border-pink-300 hover:bg-pink-100/70'
                      } ${isSelected && interactive ? 'ring-3 ring-rose-500 scale-105' : ''}`}
                    >
                      {item ? (
                        <div className="relative flex flex-col items-center">
                          <div
                            className="w-14 h-14 pointer-events-none"
                            style={{ animation: `breathing-wiggle 3s ease-in-out infinite ${idx * 0.3}s` }}
                          >
                            <Monster3DView look={item.look} size={56} interactive={false} />
                          </div>
                          <span className="text-[10px] font-black text-slate-800 truncate max-w-[75px]">
                            {item.petName}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5 text-pink-400">
                          <span className="text-base">🍰</span>
                          <span className="text-[9px] font-black">{idx + 1}번 토핑</span>
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
            className="relative p-4 rounded-3xl shadow-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #F3F4F6 0%, #FFFFFF 50%, #E5E7EB 100%)',
              border: '4px solid #D4AF37',
              boxShadow: '0 20px 35px -8px rgba(0,0,0,0.3), inset 0 2px 6px rgba(255,255,255,0.9)',
            }}
          >
            {/* 레이스 도일리 패턴 테두리 */}
            <div
              className="p-3.5 rounded-2xl relative shadow-inner"
              style={{
                background: '#FFFFFF',
                border: '2px dashed #CBD5E1',
              }}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 px-1">
                <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                  <span>🫖</span>
                  <span>로열 하이 티 스탠드</span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                    {capacity}구 플레이트
                  </span>
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {slotsArr.filter((s) => s !== null).length} / {capacity}
                </span>
              </div>

              <div
                className={`grid gap-2.5 ${
                  capacity === 1 ? 'grid-cols-1' : capacity === 2 ? 'grid-cols-2' : capacity === 4 ? 'grid-cols-2' : 'grid-cols-3'
                }`}
              >
                {slotsArr.slice(0, capacity).map((item, idx) => {
                  const isSelected = selectedSlotIndex === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => interactive && onSlotClick && onSlotClick(idx)}
                      className={`relative flex flex-col items-center justify-center min-h-[110px] rounded-2xl p-1.5 transition cursor-pointer ${
                        item
                          ? 'bg-gradient-to-b from-white to-slate-50 shadow-md border-2 border-amber-300'
                          : 'bg-slate-50 border-2 border-dashed border-slate-300 hover:bg-amber-50/50'
                      } ${isSelected && interactive ? 'ring-3 ring-amber-500 scale-105' : ''}`}
                    >
                      {item ? (
                        <div className="relative flex flex-col items-center">
                          <div
                            className="w-14 h-14 pointer-events-none"
                            style={{ animation: `breathing-wiggle 3s ease-in-out infinite ${idx * 0.3}s` }}
                          >
                            <Monster3DView look={item.look} size={56} interactive={false} />
                          </div>
                          <span className="text-[10px] font-black text-slate-800 mt-1 truncate max-w-[80px]">
                            {item.petName}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400 py-3">
                          <span className="text-lg">🫖</span>
                          <span className="text-[9px] font-bold">{idx + 1}번 은식기</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 🍫 하단 리얼 초콜릿 메시지 팻말 (Chocolate Message Plaque) */}
        {lettering && (
          <div
            className="mt-2.5 mx-auto max-w-[320px] py-1.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 border border-[#8D5A32]"
            style={{
              background: 'linear-gradient(to right, #3E2215, #4A2B19, #3E2215)',
              color: '#FFD700',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            <span className="text-xs">🖋️</span>
            <span className="text-[11px] font-black tracking-wide truncate">
              &ldquo;{lettering}&rdquo;
            </span>
          </div>
        )}
      </div>
    )
  }

  const currentOpenRoom = openParties.find((r) => r.id === activeRoomId)

  return (
    <div className="flex flex-col h-full bg-[#FFF9F2] text-slate-800 select-none overflow-y-auto">
      {/* 쫀득 앰비언트 모션 키프레임 */}
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

      {/* 🌸 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-xs">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-pink-50 transition"
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-black text-pink-900 flex items-center gap-1.5">
            <span>🎉</span>
            <span>파티 쇼케이스</span>
          </h1>
          <span className="text-[11px] font-bold text-pink-500">
            {mainTab === 'solo' && '1인 상자 꾸미기 & 미니룸 선물'}
            {mainTab === 'open_lounge' && '누구나 참여하는 오픈 지인 모드'}
            {mainTab === 'showcase' && '명예의 파티 진열장'}
          </span>
        </div>
        <div className="w-8" />
      </header>

      {/* 🎀 3대 메인 탭 */}
      <div className="flex px-4 pt-3 pb-1 gap-2 max-w-md w-full mx-auto">
        <button
          type="button"
          onClick={() => {
            setMainTab('solo')
            setActiveRoomId(null)
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            mainTab === 'solo'
              ? 'bg-pink-500 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-pink-50'
          }`}
        >
          <span>🧑‍🍳 1인 선물 모드</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab('open_lounge')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            mainTab === 'open_lounge'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-purple-50'
          }`}
        >
          <Users size={14} />
          <span>오픈 지인 모드</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab('showcase')}
          className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 ${
            mainTab === 'showcase'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
          }`}
        >
          <span>🏆 진열장</span>
        </button>
      </div>

      {/* 알림 토스트 */}
      {giftSentToast && (
        <div className="mx-4 mt-2 p-3 rounded-2xl bg-emerald-500 text-white text-xs font-black shadow-lg flex items-center gap-2 animate-bounce">
          <Sparkles size={16} />
          <span>{giftSentToast}</span>
        </div>
      )}

      {/* 축하 폭죽 모달 */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs p-6 rounded-3xl bg-white border-4 border-amber-400 shadow-2xl flex flex-col items-center text-center gap-3">
            <span className="text-5xl">🎊 🎁 🎊</span>
            <h2 className="text-lg font-black text-amber-950">디저트 파티 완성!</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              모든 슬롯이 달콤하게 채워졌습니다! 참여자들의 정성이 담긴 쇼케이스가 <strong>[명예의 진열장]</strong>에 영구 등록되었습니다! ✨
            </p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col gap-4">
        {/* ========================================================================= */}
        {/* TAB 1: 1인 나만의 모드 */}
        {/* ========================================================================= */}
        {mainTab === 'solo' && (
          <div className="flex flex-col gap-4">
            {/* 현재 내 펫 실시간 정보 & 공방 바로가기 */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 via-white to-amber-50 border border-pink-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                  <Monster3DView look={myCurrentLook} size={40} interactive={false} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <span>{currentMonster.name || '내 펫'}</span>
                    <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-1.5 py-0.2 rounded-full border border-pink-200">
                      개성 펫
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    내가 색칠하고 장식한 모습 그대로 담깁니다
                  </span>
                </div>
              </div>

              {onOpenBoutique && (
                <button
                  type="button"
                  onClick={onOpenBoutique}
                  className="px-2.5 py-1.5 rounded-xl bg-pink-600 text-white text-xs font-black hover:bg-pink-700 transition flex items-center gap-1 shadow-xs"
                >
                  <Palette size={13} />
                  <span>색칠·꾸미기</span>
                </button>
              )}
            </div>

            {/* 1단계: 베이스 & 칸 수 선택 */}
            {soloStep === 1 && (
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">시그니처 베이스 종류</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'box', name: '초코 상자', icon: '🎁', desc: '다크초코 원목 & 금박 컵' },
                      { id: 'cake', name: '파티 케이크', icon: '🎂', desc: '생크림 홀케이크 & 딸기' },
                      { id: 'tea-stand', name: '티 트레이', icon: '🫖', desc: '로열 실버 & 레이스 도일리' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBase(b.id as PartyBaseType)}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                          selectedBase === b.id
                            ? 'bg-pink-500 text-white border-pink-500 shadow-md font-black'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-pink-200 font-bold'
                        }`}
                      >
                        <span className="text-2xl">{b.icon}</span>
                        <span className="text-xs font-black">{b.name}</span>
                        <span className="text-[9px] opacity-80">{b.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700">칸 수 선택 (1구 ~ 9구)</label>
                    <span className="text-xs text-pink-600 font-black">{selectedCapacity}구 선택</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 4, 6, 9] as SlotCapacity[]).map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setSelectedCapacity(cap)}
                        className={`py-2 rounded-xl text-center font-black transition ${
                          selectedCapacity === cap
                            ? 'bg-rose-500 text-white shadow-xs text-xs'
                            : 'bg-white text-slate-700 border border-slate-200 text-xs hover:border-rose-300'
                        }`}
                      >
                        {cap}구
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSoloStep(2)}
                  className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xs shadow-md hover:from-pink-600 hover:to-rose-600 transition flex items-center justify-center gap-1.5"
                >
                  <span>쇼케이스에 내 펫 담기</span>
                  <Sparkles size={14} />
                </button>
              </div>
            )}

            {/* 2단계: 입체 탑다운 베이스 뷰 & 내 펫 담기 */}
            {soloStep === 2 && (
              <div className="flex flex-col gap-3">
                {renderLuxuryShowcaseBase(selectedBase, selectedCapacity, soloSlots, true, (idx) => {
                  setSelectedSlotIndex(idx)
                  handlePlaceMyPetInSoloSlot(idx)
                })}

                <div className="p-3 rounded-2xl bg-white border border-pink-100 flex items-center justify-between shadow-xs">
                  <span className="text-xs font-black text-slate-700">
                    선택된 <strong className="text-pink-600">{selectedSlotIndex + 1}번 자리</strong>에 내 펫 넣기
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlaceMyPetInSoloSlot(selectedSlotIndex)}
                    className="px-3.5 py-1.5 rounded-xl bg-pink-500 text-white text-xs font-black hover:bg-pink-600 transition shadow-xs"
                  >
                    내 펫 넣기
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSoloStep(1)}
                    className="py-3 px-4 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                  >
                    이전으로
                  </button>
                  <button
                    type="button"
                    onClick={() => setSoloStep(3)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-xs shadow-md hover:from-pink-600 hover:to-rose-600 transition flex items-center justify-center gap-1.5"
                  >
                    <span>피니싱 터치 & 선물 포장</span>
                    <Gift size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* 3단계: 피니싱 터치 & 미니룸 선물 */}
            {soloStep === 3 && (
              <div className="flex flex-col gap-3.5">
                {renderLuxuryShowcaseBase(selectedBase, selectedCapacity, soloSlots, false)}

                {/* 초코펜 레터링 메시지 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                    <span>🍫 초코펜 손글씨 (초콜릿 팻말에 새겨집니다)</span>
                    <span className="text-[10px] text-pink-500">{lettering.length}/50</span>
                  </label>
                  <input
                    type="text"
                    value={lettering}
                    onChange={(e) => setLettering(e.target.value.slice(0, 50))}
                    placeholder="언박싱 시 공개될 감동의 한마디를 적어주세요"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                {/* 파우더 데코 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">❄️ 솔솔 파우더 & 시럽</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'sugar-snow', name: '슈가스노우', icon: '❄️' },
                      { id: 'gold-leaf', name: '순금금박', icon: '✨' },
                      { id: 'berry-syrup', name: '딸기시럽', icon: '🍓' },
                      { id: 'rainbow-sprinkle', name: '스프링클', icon: '🌈' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPowder(p.id as FinishingTouch['powder'])}
                        className={`py-2 rounded-xl border text-[10px] font-black transition flex flex-col items-center gap-0.5 ${
                          powder === p.id
                            ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-sm">{p.icon}</span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 리본 색상 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">🎀 선물 리본 매듭</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'rose-pink', name: '로즈핑크', color: '#FF4081' },
                      { id: 'royal-gold', name: '로열골드', color: '#FFD700' },
                      { id: 'mint-sky', name: '민트스카이', color: '#26A69A' },
                      { id: 'pure-white', name: '순백실크', color: '#E0E0E0' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRibbon(r.id as FinishingTouch['ribbon'])}
                        className={`py-2 rounded-xl border text-[11px] font-black transition flex flex-col items-center gap-1 ${
                          ribbon === r.id
                            ? 'bg-pink-100 border-pink-500 text-pink-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: r.color }} />
                        <span>{r.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 미니룸 선물 배달 */}
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col gap-2">
                  <label className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                    <Gift size={14} className="text-purple-600" />
                    <span>선물 배달할 지인의 닉네임</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={giftRecipient}
                      onChange={(e) => setGiftRecipient(e.target.value.slice(0, 15))}
                      placeholder="지인 닉네임 (비우면 내 미니룸에 배달)"
                      className="flex-1 px-3 py-2 rounded-xl border border-purple-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button
                      type="button"
                      onClick={handleSendGiftToMiniroom}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition shadow-xs flex items-center gap-1"
                    >
                      <Gift size={13} />
                      <span>선물 배달</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-purple-700 font-semibold">
                    💡 배달된 선물은 미니룸에서 터치 시 리본이 풀리며 화려하게 언박싱됩니다!
                  </span>
                </div>

                {/* 내 미니룸 진열장에 바로 전시 */}
                <button
                  type="button"
                  onClick={handleSaveToMyShowcase}
                  className="w-full py-3 rounded-xl bg-amber-100 text-amber-900 font-black text-xs hover:bg-amber-200 transition border border-amber-300"
                >
                  내 미니룸 진열장에 바로 전시하기
                </button>

                <button
                  type="button"
                  onClick={() => setSoloStep(2)}
                  className="py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  배치 수정하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 오픈 지인 모드 */}
        {/* ========================================================================= */}
        {mainTab === 'open_lounge' && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-200/80 shadow-xs flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-xs font-black text-purple-950 flex items-center gap-1">
                  <Users size={14} className="text-purple-600" />
                  <span>오픈 디저트 파티 라운지</span>
                </h3>
                <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  누구나 자유롭게 들어와 빈 칸에 자기 펫을 장식할 수 있어요!
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateOpenParty}
                className="px-3 py-2 rounded-xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700 transition shadow-xs shrink-0"
              >
                + 새 파티 열기
              </button>
            </div>

            {!activeRoomId ? (
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-black text-slate-700">참여 가능한 열린 파티 목록</span>
                {openParties.map((room) => {
                  const filledCount = room.slots.filter((s) => s !== null).length
                  return (
                    <div
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className="p-3.5 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 shadow-xs transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800">{room.title}</span>
                        <span className="text-[10px] text-purple-600 font-bold mt-0.5">
                          호스트: {room.hostName} • {room.capacity}구 베이스
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {filledCount} / {room.capacity}
                        </span>
                        <span className="text-xs font-bold text-slate-400">입장 ➔</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              currentOpenRoom && (
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveRoomId(null)}
                      className="text-xs font-black text-purple-700 flex items-center gap-1 hover:underline"
                    >
                      ← 목록으로 돌아가기
                    </button>
                    <span className="text-xs font-black text-slate-800">{currentOpenRoom.title}</span>
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

                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 text-center">
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
          <div className="flex flex-col gap-3.5">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-between">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                <span>🏆</span>
                <span>모두가 함께 완성한 명예의 진열장</span>
              </span>
              <span className="text-[10px] text-amber-700 font-bold">{showcaseList.length}개 소장됨</span>
            </div>

            {showcaseList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold bg-white rounded-2xl border border-dashed border-slate-200">
                아직 완성된 파티가 없습니다. 1인 모드 또는 오픈 지인 모드에서 파티를 완성해 보세요!
              </div>
            ) : (
              showcaseList.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                    <span className="text-xs font-black text-slate-800">{item.title}</span>
                    <span className="text-[10px] text-pink-600 font-bold">
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
