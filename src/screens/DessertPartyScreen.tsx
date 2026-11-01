/**
 * 🎉 디저트 파티 플레이팅 시스템 (DessertPartyScreen.tsx)
 * 
 * 1. 탑다운(Top-down) 선물상자 뷰: 위에서 내려다보는 리얼 선물상자 안감 + 디저트 컵 페이퍼
 * 2. 쫀득 움직임(Ambient Breathing & Wiggle): 상자 안에서 가볍게 살짝 숨쉬고 갸웃거리는 펫 액션
 * 3. 기성 토핑 선택창 제거: 내가 공방에서 마음껏 색칠하고 꾸민 '현재 내 펫' 본연의 모습으로 장식
 * 4. 언제든 자유로운 색칠·꾸미기 숏컷 제공 (부티크/공방 연계)
 * 5. 오픈 지인 모드: 초대링크 없이 누구나 들어와 빈 칸에 자기 펫을 장식하는 오픈 라운지
 *    - 모든 슬롯 완성 시 축하 애니메이션과 함께 [공용 명예의 진열장] 등록
 * 6. 1인 모드 & 피니싱 터치 후 미니룸 선물 배달: 상대방 미니룸에 배달되어 리본 풀리는 언박싱 연출
 */

import React, { useState, useEffect } from 'react'
import type { MonsterRow } from '../lib/api'
import { monsterLook } from '../lib/api'
import Monster3DView from '../monsters/Monster3DView'
import type { MonsterLook } from '../monsters/types'

// 3대 시그니처 베이스 종류
export type PartyBaseType = 'box' | 'cake' | 'tea-stand'

// 지원되는 칸 수 (1구, 2구, 4구, 6구, 9구)
export type SlotCapacity = 1 | 2 | 4 | 6 | 9

// 플레이팅 슬롯 데이터
export interface PartySlotItem {
  slotIndex: number
  ownerName: string
  petName: string
  species: string
  look: MonsterLook
  isMine: boolean
  placedAt: string
}

// 피니싱 터치 데코 옵션
export interface FinishingTouch {
  lettering: string // 초코펜 손글씨 메시지
  powder: 'none' | 'sugar-snow' | 'gold-leaf' | 'berry-syrup' | 'rainbow-sprinkle'
  ribbon: 'rose-pink' | 'royal-gold' | 'mint-sky' | 'pure-white'
}

// 오픈 파티 방 데이터
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

// 미니룸 배달 선물 패키지
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
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
)
const Users = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
  // 메인 탭: 'solo'(1인 나만의 파티/선물) | 'open_lounge'(오픈 지인 모드) | 'showcase'(명예의 진열장)
  const [mainTab, setMainTab] = useState<'solo' | 'open_lounge' | 'showcase'>('solo')

  // 1인 모드 단계: 1(베이스 선택) -> 2(상자 속 내 펫 배치) -> 3(피니싱 터치 & 선물)
  const [soloStep, setSoloStep] = useState<1 | 2 | 3>(1)
  const [selectedBase, setSelectedBase] = useState<PartyBaseType>('box')
  const [selectedCapacity, setSelectedCapacity] = useState<SlotCapacity>(4)
  const [soloSlots, setSoloSlots] = useState<(PartySlotItem | null)[]>(() => new Array(4).fill(null))
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0)

  // 피니싱 터치 상태
  const [lettering, setLettering] = useState<string>('달콤한 마음을 가득 담아 보냅니다 💖')
  const [powder, setPowder] = useState<FinishingTouch['powder']>('sugar-snow')
  const [ribbon, setRibbon] = useState<FinishingTouch['ribbon']>('rose-pink')
  const [giftRecipient, setGiftRecipient] = useState<string>('')
  const [giftSentToast, setGiftSentToast] = useState<string | null>(null)

  // 오픈 지인 모드 상태
  const [openParties, setOpenParties] = useState<OpenPartyRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState<boolean>(false)

  // 진열장 목록
  const [showcaseList, setShowcaseList] = useState<OpenPartyRoom[]>([])

  // 내 현재 꾸며진 펫의 실시간 외형 룩 계산
  const myCurrentLook = React.useMemo(() => {
    return monsterLook(currentMonster)
  }, [currentMonster])

  // 오픈 파티 및 진열장 초기 로딩
  useEffect(() => {
    try {
      const savedParties = localStorage.getItem(OPEN_PARTIES_STORAGE_KEY)
      if (savedParties) {
        setOpenParties(JSON.parse(savedParties))
      } else {
        // 초기 예시 오픈 파티 생성 (누구나 들어와 채울 수 있는 방)
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
            title: '🍫 다크초코 셀러브레이션 6구',
            hostName: '쇼콜라티에',
            baseType: 'box',
            capacity: 6,
            slots: [
              {
                slotIndex: 0,
                ownerName: '쇼콜라티에',
                petName: '다크가나슈',
                species: 'choco',
                look: { ...myCurrentLook, species: 'choco', palette: 0 },
                isMine: false,
                placedAt: new Date().toISOString(),
              },
              {
                slotIndex: 1,
                ownerName: '슈가프리',
                petName: '밀크푸딩',
                species: 'pudding',
                look: { ...myCurrentLook, species: 'pudding', palette: 0 },
                isMine: false,
                placedAt: new Date().toISOString(),
              },
              null,
              null,
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
      console.error('오픈 파티 로드 오류:', e)
    }
  }, [myCurrentLook])

  // 1인 모드 칸 수 변경 시 슬롯 동기화
  useEffect(() => {
    setSoloSlots((prev) => {
      const next = new Array(selectedCapacity).fill(null)
      for (let i = 0; i < Math.min(prev.length, selectedCapacity); i++) {
        next[i] = prev[i]
      }
      // 0번 칸에 기본으로 내 현재 꾸며진 펫 배치
      if (!next[0]) {
        next[0] = {
          slotIndex: 0,
          ownerName: '나',
          petName: currentMonster.name || '내 디저트 펫',
          species: currentMonster.species,
          look: myCurrentLook,
          isMine: true,
          placedAt: new Date().toISOString(),
        }
      }
      return next
    })
  }, [selectedCapacity, currentMonster, myCurrentLook])

  // 1인 모드: 슬롯에 내 펫 담기
  const handlePlaceMyPetInSoloSlot = (slotIdx: number) => {
    setSoloSlots((prev) => {
      const copy = [...prev]
      copy[slotIdx] = {
        slotIndex: slotIdx,
        ownerName: '나',
        petName: currentMonster.name || '내 디저트 펫',
        species: currentMonster.species,
        look: myCurrentLook,
        isMine: true,
        placedAt: new Date().toISOString(),
      }
      return copy
    })
  }

  // 1인 모드: 슬롯 비우기
  const handleClearSoloSlot = (slotIdx: number) => {
    setSoloSlots((prev) => {
      const copy = [...prev]
      copy[slotIdx] = null
      return copy
    })
  }

  // 1인 모드: 미니룸으로 선물 보내기
  const handleSendGiftToMiniroom = () => {
    const filledSlots = soloSlots.filter((s): s is PartySlotItem => s !== null)
    if (filledSlots.length === 0) {
      alert('상자에 최소 1마리 이상의 펫을 장식해 주세요!')
      return
    }

    const recipient = giftRecipient.trim() || '소중한 친구'
    const newGift: DeliveredGiftPackage = {
      id: `gift-${Date.now()}`,
      senderName: currentMonster.name ? `${currentMonster.name}의 주인` : '달콤한 친구',
      recipientName: recipient,
      title: `${selectedBase === 'box' ? '수제 초코상자' : selectedBase === 'cake' ? '축하 케이크' : '티 트레이'} (${selectedCapacity}구)`,
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

  // 1인 모드: 내 미니룸 장식장에 즉시 진열하기
  const handleSaveToMyShowcase = () => {
    const partyData: OpenPartyRoom = {
      id: `party-solo-${Date.now()}`,
      title: `나만의 ${selectedCapacity}구 ${selectedBase === 'box' ? '선물상자' : '케이크'}`,
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

  // 오픈 지인 모드: 새 오픈 파티 방 개설
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
    // 0번 슬롯에 호스트(내 펫) 바로 장식
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

  // 오픈 지인 모드: 빈 슬롯에 내 펫 장식하기
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

    // 모든 슬롯이 채워졌는지 확인!
    const isNowCompleted = updatedSlots.every((s) => s !== null)

    const updatedRoom: OpenPartyRoom = {
      ...room,
      slots: updatedSlots,
      isCompleted: isNowCompleted,
    }

    const updatedList = openParties.map((r) => (r.id === roomId ? updatedRoom : r))
    setOpenParties(updatedList)
    localStorage.setItem(OPEN_PARTIES_STORAGE_KEY, JSON.stringify(updatedList))

    // 🎉 모든 슬롯이 다 찼을 때 축하 애니메이션 발생 및 명예의 진열장에 영구 등록!
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

  // 탑다운 선물상자 렌더러 (위에서 내려다보는 리얼 박스 뷰)
  const renderTopDownBox = (
    baseType: PartyBaseType,
    capacity: SlotCapacity,
    slotsArr: (PartySlotItem | null)[],
    interactive: boolean,
    onSlotClick?: (idx: number) => void
  ) => {
    return (
      <div className="relative w-full max-w-[360px] mx-auto p-4 rounded-3xl bg-gradient-to-b from-[#4A2810] via-[#5C3214] to-[#3B1E0A] shadow-2xl border-4 border-[#8B5A2B] overflow-hidden">
        {/* 상자 내부 부드러운 패딩 안감 */}
        <div className="relative p-3 rounded-2xl bg-gradient-to-b from-[#FFF5E6] via-[#FFFBF2] to-[#FFEEDB] shadow-inner border border-amber-200">
          {/* 상자 골드 엠블럼 타이틀 */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200/80 px-1">
            <span className="text-[11px] font-black text-amber-950 flex items-center gap-1">
              <span>{baseType === 'box' ? '🎁 수제 초코상자' : baseType === 'cake' ? '🎂 파티 케이크' : '🫖 애프터눈 티'}</span>
              <span className="text-[10px] text-amber-700 font-bold">({capacity}구 쇼케이스)</span>
            </span>
            <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
              {slotsArr.filter((s) => s !== null).length} / {capacity}
            </span>
          </div>

          {/* 칸칸이 나뉜 탑다운 그리드 */}
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
                  className={`relative flex flex-col items-center justify-center min-h-[115px] rounded-2xl p-1.5 transition select-none cursor-pointer ${
                    // 베이킹 컵 페이퍼 실루엣 (원형 엠보싱 몰드)
                    item
                      ? 'bg-gradient-to-b from-amber-50 to-[#FFF3E0] shadow-md border-2 border-amber-300'
                      : 'bg-amber-100/40 border-2 border-dashed border-amber-300/80 hover:bg-amber-100/70'
                  } ${isSelected && interactive ? 'ring-2 ring-pink-500 scale-[1.02]' : ''}`}
                >
                  {/* 디저트 컵 페이퍼 가장자리 주름 질감 */}
                  <div className="absolute inset-1 rounded-xl border border-amber-200/60 pointer-events-none" />

                  {item ? (
                    <div className="relative flex flex-col items-center w-full">
                      {/* 쫀득 숨쉬기 액션 래퍼 (Breathing & Subtle Wobble) */}
                      <div
                        className="w-16 h-16 pointer-events-none transition-transform"
                        style={{
                          animation: `breathing-wiggle 3s ease-in-out infinite ${idx * 0.4}s`,
                        }}
                      >
                        <Monster3DView
                          look={item.look}
                          size={64}
                          interactive={false}
                        />
                      </div>

                      {/* 펫 이름 & 장식한 주인 라벨 */}
                      <span className="text-[11px] font-black text-amber-950 mt-1 truncate max-w-[85px]">
                        {item.petName}
                      </span>
                      <span className="text-[9px] font-bold text-pink-600 bg-pink-100/70 px-1.5 py-0.2 rounded-full mt-0.5 truncate max-w-[85px]">
                        by {item.ownerName}
                      </span>

                      {/* 1인 모드에서 슬롯 비우기 버튼 */}
                      {interactive && item.isMine && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClearSoloSlot(idx)
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold shadow-xs hover:bg-rose-600 transition"
                          title="슬롯 비우기"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 py-4 text-amber-800/60">
                      <span className="text-xl">🧁</span>
                      <span className="text-[10px] font-extrabold text-amber-900/70">
                        {idx + 1}번 칸 (빈 자리)
                      </span>
                      {interactive && (
                        <span className="text-[8px] text-pink-600 font-bold bg-pink-50 px-1.5 py-0.5 rounded-full border border-pink-200">
                          터치하여 넣기
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 피니싱 터치 데코 반영 (상자 윗면에 뿌려진 파우더/리본) */}
          <div className="mt-2.5 pt-2 border-t border-amber-200 flex items-center justify-between text-[10px] font-bold text-amber-800">
            <span>✨ 핸드메이드 데코</span>
            <span className="text-pink-600 font-extrabold">{lettering ? `"${lettering.slice(0, 16)}..."` : '메시지 없음'}</span>
          </div>
        </div>
      </div>
    )
  }

  const currentOpenRoom = openParties.find((r) => r.id === activeRoomId)

  return (
    <div className="flex flex-col h-full bg-[#FFF9F2] text-slate-800 select-none overflow-y-auto">
      {/* 쫀득 앰비언트 숨쉬기 & 갸웃 키프레임 인라인 정의 */}
      <style>{`
        @keyframes breathing-wiggle {
          0%, 100% {
            transform: translateY(0px) scale(1) rotate(0deg);
          }
          30% {
            transform: translateY(-2.5px) scale(1.03, 0.97) rotate(1.5deg);
          }
          65% {
            transform: translateY(1.5px) scale(0.98, 1.02) rotate(-1.5deg);
          }
        }
      `}</style>

      {/* 🌸 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-xs">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-pink-50 transition"
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-extrabold text-pink-800 flex items-center gap-1.5">
            <span>🎉</span>
            <span>디저트 파티 쇼케이스</span>
          </h1>
          <span className="text-[11px] font-medium text-pink-500">
            {mainTab === 'solo' && '1인 나만의 상자 & 미니룸 선물'}
            {mainTab === 'open_lounge' && '누구나 참여하는 오픈 지인 모드'}
            {mainTab === 'showcase' && '명예의 파티 진열장'}
          </span>
        </div>
        <div className="w-8" />
      </header>

      {/* 🎀 3대 메인 탭 전환 네비게이션 */}
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

      {/* 선물 발송 완료 토스트 */}
      {giftSentToast && (
        <div className="mx-4 mt-2 p-3 rounded-2xl bg-emerald-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-2 animate-bounce">
          <Sparkles size={16} />
          <span>{giftSentToast}</span>
        </div>
      )}

      {/* 전 슬롯 완료 축하 폭죽 모달 */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs p-6 rounded-3xl bg-white border-4 border-amber-400 shadow-2xl flex flex-col items-center text-center gap-3 animate-scale-up">
            <span className="text-5xl">🎊 🎁 🎊</span>
            <h2 className="text-lg font-black text-amber-950">디저트 파티 완성!</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              모든 칸이 달콤하게 채워졌습니다! 참여자들의 정성이 담긴 베이스가 <strong>[명예의 진열장]</strong>에 영구 등록되었습니다! ✨
            </p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col gap-4">
        {/* ========================================================================= */}
        {/* TAB 1: 1인 나만의 모드 (내 펫으로 담기 + 피니싱터치 + 미니룸 선물) */}
        {/* ========================================================================= */}
        {mainTab === 'solo' && (
          <div className="flex flex-col gap-4">
            {/* 상단 현재 내 펫 실시간 정보 & 공방 숏컷 바 */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 via-white to-amber-50 border border-pink-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                  <Monster3DView look={myCurrentLook} size={40} interactive={false} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <span>{currentMonster.name || '내 펫'}</span>
                    <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-1.5 py-0.2 rounded-full border border-pink-200">
                      꾸미기 반영됨
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    내가 색칠하고 장식한 모습 그대로 담깁니다
                  </span>
                </div>
              </div>

              {/* 언제든 색칠·꾸미기 공방으로 이동하는 원터치 버튼 */}
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
                      { id: 'box', name: '초코 상자', icon: '🎁' },
                      { id: 'cake', name: '파티 케이크', icon: '🎂' },
                      { id: 'tea-stand', name: '티 트레이', icon: '🫖' },
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
                        <span className="text-xs">{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700">칸 수 (1구 ~ 9구)</label>
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
                  <span>탑다운 상자에 내 펫 담으러 가기</span>
                  <Sparkles size={14} />
                </button>
              </div>
            )}

            {/* 2단계: 위에서 내려다보는 리얼 선물상자 뷰 & 내 펫 담기 */}
            {soloStep === 2 && (
              <div className="flex flex-col gap-3">
                {/* 리얼 탑다운 상자 뷰 */}
                {renderTopDownBox(selectedBase, selectedCapacity, soloSlots, true, (idx) => {
                  setSelectedSlotIndex(idx)
                  handlePlaceMyPetInSoloSlot(idx)
                })}

                {/* 슬롯 조작 바 */}
                <div className="p-3 rounded-2xl bg-white border border-pink-100 flex items-center justify-between shadow-xs">
                  <span className="text-xs font-black text-slate-700">
                    선택된 <strong className="text-pink-600">{selectedSlotIndex + 1}번 칸</strong>에 내 펫 담기
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlaceMyPetInSoloSlot(selectedSlotIndex)}
                    className="px-3 py-1.5 rounded-xl bg-pink-500 text-white text-xs font-black hover:bg-pink-600 transition shadow-xs"
                  >
                    내 펫 넣기
                  </button>
                </div>

                {/* 네비게이션 버튼 */}
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

            {/* 3단계: 피니싱 터치 & 미니룸 선물하기 */}
            {soloStep === 3 && (
              <div className="flex flex-col gap-3.5">
                {/* 상단 탑다운 미니 프리뷰 */}
                {renderTopDownBox(selectedBase, selectedCapacity, soloSlots, false)}

                {/* 초코펜 레터링 메시지 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                    <span>🍫 초코펜 편지 메시지 (언박싱 시 공개)</span>
                    <span className="text-[10px] text-pink-500">{lettering.length}/50</span>
                  </label>
                  <input
                    type="text"
                    value={lettering}
                    onChange={(e) => setLettering(e.target.value.slice(0, 50))}
                    placeholder="미니룸에서 리본을 풀었을 때 보여질 글을 적어주세요"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">❄️ 슈가/금박 파우더</label>
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

                {/* 리본 색상 선택 */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700">🎀 선물 포장 리본</label>
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

                {/* 선물 보낼 상대방 미니룸 닉네임 */}
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
                  className="py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  상자 펫 배치 수정하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 오픈 지인 모드 (초대링크 X ➔ 누구나 들어와 자기 펫 장식) */}
        {/* ========================================================================= */}
        {mainTab === 'open_lounge' && (
          <div className="flex flex-col gap-4">
            {/* 상단 라운지 안내 및 새 방 개설 버튼 */}
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

            {/* 현재 열려있는 오픈 파티 선택창 */}
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
                          호스트: {room.hostName} • {room.capacity}구 상자
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
              /* 특정 오픈 파티 방 내부: 탑다운 상자에서 빈 칸 터치하여 내 펫 장식 */
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

                  {/* 탑다운 상자 뷰 (빈 칸을 누르면 내 현재 펫이 즉시 배치됨) */}
                  {renderTopDownBox(
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
        {/* TAB 3: 명예의 진열장 (Showcase) */}
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
                  {renderTopDownBox(item.baseType, item.capacity, item.slots, false)}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
