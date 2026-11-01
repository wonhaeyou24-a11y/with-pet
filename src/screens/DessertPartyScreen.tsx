/**
 * 🎉 디저트 파티 플레이팅 시스템 (DessertPartyScreen.tsx)
 * 
 * 1. 3대 시그니처 베이스: 초콜릿 선물상자, 파티 케이크, 애프터눈티 트레이
 * 2. 소수~다수 지인을 위한 칸 수 선택: 1구(미니 솔로), 2구(커플 페어), 4구(콰르텟), 6구(하프 더즌), 9구(그랜드)
 * 3. 1인 모드(내 펫의 다채로운 DIY 데코) vs 지인 모드(슬롯별 지인 합작 플레이팅)
 * 4. 3단계 피니싱 터치: 초코펜 레터링, 슈가파우더/금박 글리터, 선물 리본
 * 5. 4단계 완성과 감동의 선물: 패키징 뚜껑 연출, 미니룸 보관함 영구 소장, 지인 선물 보내기
 * 
 * 🔒 보안 수칙:
 * - Strict Sanitization: 초코펜 레터링 악성 스크립트 차단 및 30자 길이 제한
 * - Zero-Crash Policy: 모든 저장 및 비동기 작업에 예외 처리 적용
 */

import React, { useState, useEffect } from 'react'
// 🎨 경량화 인라인 SVG 아이콘 모음 (의존성 없이 고성능 렌더링)
const ArrowLeft = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
)
const Sparkles = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
)
const Heart = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
)
const Gift = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>
)
const Share2 = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
)
const Check = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5"/></svg>
)
const RefreshCw = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
)
const BookmarkCheck = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/><path d="m9 10 2 2 4-4"/></svg>
)
import type { MonsterRow } from '../lib/api'
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
  paletteIndex: number
  toppingName: string
  isMine: boolean
}

// 피니싱 터치 데코 옵션
export interface FinishingTouch {
  lettering: string // 초코펜 손글씨 메시지
  powder: 'none' | 'sugar-snow' | 'gold-leaf' | 'berry-syrup' | 'rainbow-sprinkle'
  ribbon: 'rose-pink' | 'royal-gold' | 'mint-sky' | 'pure-white'
}

// 완성된 디저트 파티 패키지
export interface DessertPartyPackage {
  id: string
  title: string
  baseType: PartyBaseType
  capacity: SlotCapacity
  mode: 'solo' | 'friends'
  slots: (PartySlotItem | null)[]
  finishing: FinishingTouch
  isCompleted: boolean
  createdAt: string
  giftRecipient?: string
}

interface DessertPartyScreenProps {
  onBack: () => void
  currentMonster?: MonsterRow | null
  allMonsters?: MonsterRow[]
  onSaveToMiniroom?: (partyPkg: DessertPartyPackage) => void
}

// 베이스 정보 카탈로그
const BASE_CATALOG: { type: PartyBaseType; name: string; icon: string; desc: string; capacities: SlotCapacity[] }[] = [
  {
    type: 'box',
    name: '초콜릿 선물상자',
    icon: '🎁',
    desc: '칸칸이 포근하게 감싸주는 고급 수제 디저트 박스',
    capacities: [1, 2, 4, 6, 9],
  },
  {
    type: 'cake',
    name: '파티 셀러브레이션 케이크',
    icon: '🎂',
    desc: '새하얀 생크림 케이크 위에 옹기종기 얹는 파티 베이스',
    capacities: [1, 2, 4, 6],
  },
  {
    type: 'tea-stand',
    name: '애프터눈 티 트레이',
    icon: '🫖',
    desc: '은빛 티 타워 트레이에 우아하게 플레이팅하는 귀족 베이스',
    capacities: [1, 2, 4, 6],
  },
]

// 1인 DIY용 다채로운 맛/토핑 프리셋
const SOLO_FLAVOR_PRESETS = [
  { name: '순백 우유 모찌', species: 'mochi', paletteIndex: 0, topping: '말랑 우유 도우' },
  { name: '달콤 딸기 모찌', species: 'mochi', paletteIndex: 1, topping: '통딸기 슬라이스' },
  { name: '탱글 커스터드 푸딩', species: 'pudding', paletteIndex: 0, topping: '달콤 카라멜 시럽' },
  { name: '쌉싸름 말차 푸딩', species: 'pudding', paletteIndex: 2, topping: '진한 말차 파우더' },
  { name: '루비 과즙 젤리곰', species: 'jelly', paletteIndex: 1, topping: '블루베리 구미' },
  { name: '화이트 가나슈 초코', species: 'choco', paletteIndex: 0, topping: '순금 금박 가루' },
  { name: '두바이 피스타치오', species: 'dubai-cookie', paletteIndex: 0, topping: '바삭 카다이프' },
  { name: '노릇 마시멜로 스모어', species: 'smore', paletteIndex: 0, topping: '통밀 크래커' },
]

// 가상 지인 디저트 펫 목록 (소셜 합작 시뮬레이션용)
const MOCK_FRIENDS_PETS: PartySlotItem[] = [
  { slotIndex: 1, ownerName: '초코마카롱', petName: '딸기퐁당', species: 'mochi', paletteIndex: 1, toppingName: '생딸기 하트', isMine: false },
  { slotIndex: 2, ownerName: '달콤슈가', petName: '탱글이', species: 'pudding', paletteIndex: 0, toppingName: '카라멜 왕관', isMine: false },
  { slotIndex: 3, ownerName: '민트초코단', petName: '젤리베어', species: 'jelly', paletteIndex: 2, toppingName: '별사탕 스프링클', isMine: false },
  { slotIndex: 4, ownerName: '바닐라라떼', petName: '쇼콜라', species: 'choco', paletteIndex: 0, toppingName: '금빛 글리터', isMine: false },
  { slotIndex: 5, ownerName: '말랑단원', petName: '쿠키몬', species: 'dubai-cookie', paletteIndex: 0, toppingName: '피스타치오 분태', isMine: false },
]

const LOCAL_STORAGE_KEY = 'pet_together_dessert_party_packages_v1'

export const DessertPartyScreen: React.FC<DessertPartyScreenProps> = ({
  onBack,
  currentMonster,
  onSaveToMiniroom,
}) => {
  // 단계 네비게이션: 1(베이스 및 모드 선택) -> 2(플레이팅) -> 3(피니싱 터치) -> 4(완성과 선물)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // 1단계 상태: 베이스 종류, 칸 수, 모드
  const [selectedBase, setSelectedBase] = useState<PartyBaseType>('box')
  const [selectedCapacity, setSelectedCapacity] = useState<SlotCapacity>(4)
  const [partyMode, setPartyMode] = useState<'solo' | 'friends'>('solo')

  // 2단계 슬롯 상태: 배열 크기는 selectedCapacity
  const [slots, setSlots] = useState<(PartySlotItem | null)[]>(() => new Array(4).fill(null))
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0)

  // 3단계 피니싱 터치 상태
  const [lettering, setLettering] = useState<string>('오늘도 달콤한 하루 보내! 💖')
  const [powder, setPowder] = useState<FinishingTouch['powder']>('sugar-snow')
  const [ribbon, setRibbon] = useState<FinishingTouch['ribbon']>('rose-pink')

  // 4단계 포장 및 보관 상태
  const [isBoxClosed, setIsBoxClosed] = useState<boolean>(false)
  const [giftFriendName, setGiftFriendName] = useState<string>('')
  const [isSaved, setIsSaved] = useState<boolean>(false)
  const [isGiftSent, setIsGiftSent] = useState<boolean>(false)

  // 칸 수가 변경될 때 슬롯 배열 동기화
  useEffect(() => {
    setSlots((prev) => {
      const next = new Array(selectedCapacity).fill(null)
      for (let i = 0; i < Math.min(prev.length, selectedCapacity); i++) {
        next[i] = prev[i]
      }
      // 0번 슬롯에 내 메인 펫 기본 배치
      if (!next[0]) {
        next[0] = {
          slotIndex: 0,
          ownerName: '나 (호스트)',
          petName: currentMonster?.name || '순백 모찌',
          species: currentMonster?.species || 'mochi',
          paletteIndex: 0,
          toppingName: '말랑 우유 도우',
          isMine: true,
        }
      }
      return next
    })
  }, [selectedCapacity, currentMonster])

  // 1단계 -> 2단계 진입 시 초기화
  const handleStartPlating = () => {
    try {
      const initialSlots: (PartySlotItem | null)[] = new Array(selectedCapacity).fill(null)
      // 첫 번째 슬롯은 내 펫으로 배치
      initialSlots[0] = {
        slotIndex: 0,
        ownerName: '나',
        petName: currentMonster?.name || '순백 모찌',
        species: currentMonster?.species || 'mochi',
        paletteIndex: 0,
        toppingName: '순백 우유 도우',
        isMine: true,
      }

      // 지인 모드일 경우 예시 지인 펫들로 일부 채워둠
      if (partyMode === 'friends' && selectedCapacity > 1) {
        for (let i = 1; i < Math.min(selectedCapacity, MOCK_FRIENDS_PETS.length + 1); i++) {
          initialSlots[i] = {
            ...MOCK_FRIENDS_PETS[i - 1],
            slotIndex: i,
          }
        }
      }

      setSlots(initialSlots)
      setActiveSlotIdx(0)
      setCurrentStep(2)
    } catch (err) {
      console.error('디저트 파티 초기화 오류:', err)
      setCurrentStep(2)
    }
  }

  // 슬롯에 펫/디저트 배치하기
  const handleAssignPetToSlot = (slotIdx: number, item: PartySlotItem) => {
    setSlots((prev) => {
      const updated = [...prev]
      updated[slotIdx] = { ...item, slotIndex: slotIdx }
      return updated
    })
  }

  // 지인 파티 초대 시뮬레이션 (지인이 들어와 빈 슬롯 장식)
  const handleInviteFriendPlating = () => {
    const emptyIdx = slots.findIndex((s) => s === null)
    if (emptyIdx === -1) {
      alert('모든 슬롯이 달콤하게 채워졌습니다! 피니싱 터치로 넘어가 보세요. ✨')
      return
    }
    const randomFriend = MOCK_FRIENDS_PETS[emptyIdx % MOCK_FRIENDS_PETS.length]
    handleAssignPetToSlot(emptyIdx, {
      ...randomFriend,
      slotIndex: emptyIdx,
    })
  }

  // 슬롯 비우기
  const handleClearSlot = (slotIdx: number) => {
    setSlots((prev) => {
      const updated = [...prev]
      updated[slotIdx] = null
      return updated
    })
  }

  // 초코펜 레터링 입력 검증 (Strict Sanitization & 30자 제한)
  const handleLetteringChange = (val: string) => {
    // 특수 스크립트 태그 필터링 및 30자 제한
    const sanitized = val.replace(/[<>'"/\\;]/g, '').slice(0, 30)
    setLettering(sanitized)
  }

  // 완성된 패키지 데이터 생성
  const buildCurrentPackage = (): DessertPartyPackage => {
    return {
      id: `party-pkg-${Date.now()}`,
      title: `${selectedBase === 'box' ? '초콜릿 상자' : selectedBase === 'cake' ? '파티 케이크' : '티 트레이'} (${selectedCapacity}구)`,
      baseType: selectedBase,
      capacity: selectedCapacity,
      mode: partyMode,
      slots,
      finishing: {
        lettering,
        powder,
        ribbon,
      },
      isCompleted: true,
      createdAt: new Date().toISOString(),
      giftRecipient: giftFriendName || undefined,
    }
  }

  // 미니룸 보관함에 저장하기
  const handleSavePackage = () => {
    try {
      const pkg = buildCurrentPackage()
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY)
      const list: DessertPartyPackage[] = existing ? JSON.parse(existing) : []
      list.unshift(pkg)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list.slice(0, 20)))

      if (onSaveToMiniroom) {
        onSaveToMiniroom(pkg)
      }
      setIsSaved(true)
    } catch (err) {
      console.error('파티 패키지 저장 실패:', err)
      setIsSaved(true)
    }
  }

  // 지인에게 선물 보내기
  const handleSendGift = () => {
    if (!giftFriendName.trim()) {
      alert('선물 받을 지인의 닉네임을 입력해 주세요!')
      return
    }
    handleSavePackage()
    setIsGiftSent(true)
  }

  // 3D 뷰 렌더링용 더미 룩 생성 헬퍼
  const getLookForSpecies = (species: string, palette: number): MonsterLook => ({
    species,
    palette,
    bodyType: 'normal',
    scale: 1,
    ears: 0,
    tail: 0,
    top: 0,
    expression: 'round',
    patternSeed: 0,
    shiny: false,
    mutation: null,
    mallang: {
      skinPalette: palette,
      dessertBase: 'none', // 접시 없는 순수 도우
    },
  })

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#FFF5F7] via-[#FFF9F2] to-[#FFF0F5] text-slate-800 select-none overflow-y-auto">
      {/* 🌸 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/85 backdrop-blur-md border-b border-pink-100 shadow-xs">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-pink-50 transition"
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-extrabold text-pink-700 flex items-center gap-1.5">
            <span>🎉</span>
            <span>디저트 파티 플레이팅</span>
          </h1>
          <span className="text-[11px] font-medium text-pink-400">
            {currentStep === 1 && '1단계: 베이스 & 모드 고르기'}
            {currentStep === 2 && `2단계: ${selectedCapacity}구 베이스에 펫 장식하기`}
            {currentStep === 3 && '3단계: 피니싱 터치 (레터링 & 리본)'}
            {currentStep === 4 && '4단계: 완성과 감동의 선물'}
          </span>
        </div>
        <div className="w-8 flex justify-end">
          <span className="px-2 py-0.5 text-xs font-bold bg-pink-100 text-pink-600 rounded-full">
            {currentStep}/4
          </span>
        </div>
      </header>

      {/* 🍓 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col gap-4">
        {/* ========================================================================= */}
        {/* STEP 1: 베이스, 칸 수, 모드 선택 */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* 상단 안내 배너 */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-amber-500/10 to-rose-500/10 border border-pink-200/60 shadow-xs">
              <h2 className="text-sm font-bold text-pink-900 flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-amber-500" />
                <span>나 혼자서도, 지인들과 다 함께도 즐기는 파티!</span>
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                비어있는 베이스에 순백의 디저트 펫들을 올려 나만의 작품을 완성해 보세요. 소수의 지인과 1~2구 커플 상자부터 다 함께 만드는 9구 상자까지 자유롭게 선택할 수 있어요.
              </p>
            </div>

            {/* 1. 모드 선택 (1인 모드 vs 지인 합작 모드) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-slate-700">플레이 모드 선택</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPartyMode('solo')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                    partyMode === 'solo'
                      ? 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-400 shadow-md ring-2 ring-pink-300/40'
                      : 'bg-white border-slate-200 hover:border-pink-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🧑‍🍳</span>
                    {partyMode === 'solo' && <Check size={16} className="text-pink-600 font-bold" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800">1인 나만의 모드</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    내 펫의 여러 변형과 다채로운 맛으로 베이스를 혼자 채우고 지인에게 자랑하기
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPartyMode('friends')}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                    partyMode === 'friends'
                      ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-400 shadow-md ring-2 ring-purple-300/40'
                      : 'bg-white border-slate-200 hover:border-pink-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">👥</span>
                    {partyMode === 'friends' && <Check size={16} className="text-purple-600 font-bold" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800">함께하는 지인 모드</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    한 칸씩 지인들이 들어와 각자의 디저트 펫을 얹어 함께 완성하는 합작 파티
                  </span>
                </button>
              </div>
            </div>

            {/* 2. 3대 시그니처 베이스 선택 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-slate-700">시그니처 비어있는 베이스 선택</label>
              <div className="grid grid-cols-3 gap-2">
                {BASE_CATALOG.map((b) => (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => {
                      setSelectedBase(b.type)
                      if (!b.capacities.includes(selectedCapacity)) {
                        setSelectedCapacity(b.capacities[0])
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                      selectedBase === b.type
                        ? 'bg-pink-500 text-white border-pink-500 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-pink-200'
                    }`}
                  >
                    <span className="text-2xl">{b.icon}</span>
                    <span className="text-xs font-bold leading-tight">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 칸 수 (구) 선택 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700">칸 수 선택 (소수/다수 인원 맞춤)</label>
                <span className="text-[11px] text-pink-600 font-semibold">{selectedCapacity}구 선택됨</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {([1, 2, 4, 6, 9] as SlotCapacity[]).map((cap) => {
                  const currentBaseInfo = BASE_CATALOG.find((b) => b.type === selectedBase)
                  const isAvailable = currentBaseInfo?.capacities.includes(cap)
                  return (
                    <button
                      key={cap}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedCapacity(cap)}
                      className={`py-2.5 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                        selectedCapacity === cap
                          ? 'bg-rose-500 text-white shadow-sm'
                          : isAvailable
                          ? 'bg-white text-slate-700 border border-slate-200 hover:border-rose-300'
                          : 'bg-slate-100 text-slate-300 border border-slate-100 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{cap}구</span>
                      <span className="text-[10px] opacity-80">
                        {cap === 1 ? '솔로' : cap === 2 ? '커플' : cap === 4 ? '미니' : cap === 6 ? '하프' : '그랜드'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 다음 단계 버튼 */}
            <button
              type="button"
              onClick={handleStartPlating}
              className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-sm shadow-md hover:from-pink-600 hover:to-rose-600 transition flex items-center justify-center gap-2"
            >
              <span>플레이팅 시작하기</span>
              <Sparkles size={16} />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: 디저트 펫 플레이팅 (베이스 채우기) */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* 베이스 플레이팅 시각적 컨테이너 */}
            <div className="relative p-4 rounded-3xl bg-gradient-to-b from-amber-50/80 via-white to-pink-50/80 border-2 border-pink-200/80 shadow-md">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-extrabold text-pink-800 flex items-center gap-1.5">
                  <span>{selectedBase === 'box' ? '🎁 초코 상자' : selectedBase === 'cake' ? '🎂 파티 케이크' : '🫖 애프터눈 티'}</span>
                  <span className="text-[11px] font-medium text-pink-500">({selectedCapacity}구 슬롯)</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {slots.filter((s) => s !== null).length} / {selectedCapacity} 장식됨
                </span>
              </div>

              {/* 슬롯 격자 그리드 */}
              <div
                className={`grid gap-2.5 ${
                  selectedCapacity === 1
                    ? 'grid-cols-1'
                    : selectedCapacity === 2
                    ? 'grid-cols-2'
                    : selectedCapacity === 4
                    ? 'grid-cols-2'
                    : selectedCapacity === 6
                    ? 'grid-cols-3'
                    : 'grid-cols-3'
                }`}
              >
                {slots.map((item, idx) => {
                  const isActive = activeSlotIdx === idx
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveSlotIdx(idx)}
                      className={`relative min-h-[110px] rounded-2xl p-2 flex flex-col items-center justify-center border-2 transition cursor-pointer select-none ${
                        isActive
                          ? 'border-pink-500 bg-pink-50/70 shadow-md ring-2 ring-pink-300/50'
                          : item
                          ? 'border-pink-200 bg-white/90 hover:border-pink-300'
                          : 'border-dashed border-slate-300 bg-white/50 hover:border-pink-300 hover:bg-pink-50/30'
                      }`}
                    >
                      {item ? (
                        <>
                          {/* 3D 미니 펫 프리뷰 */}
                          <div className="w-16 h-16 pointer-events-none">
                            <Monster3DView
                              look={getLookForSpecies(item.species, item.paletteIndex)}
                              size={64}
                              interactive={false}
                            />
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-800 mt-0.5 truncate max-w-[90px]">
                            {item.petName}
                          </span>
                          <span className="text-[9px] text-pink-600 font-semibold truncate max-w-[90px]">
                            {item.toppingName}
                          </span>
                          <span className="text-[8px] text-slate-400 mt-0.5 truncate">
                            by {item.ownerName}
                          </span>

                          {/* 슬롯 비우기 버튼 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClearSlot(idx)
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-200/80 hover:bg-rose-500 hover:text-white text-slate-600 text-[10px] flex items-center justify-center transition"
                            title="슬롯 비우기"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-400 py-3">
                          <span className="text-xl opacity-60">➕</span>
                          <span className="text-[10px] font-bold">비어있는 {idx + 1}번 칸</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 지인 모드 시뮬레이션 버튼 */}
              {partyMode === 'friends' && slots.some((s) => s === null) && (
                <div className="mt-3 pt-3 border-t border-pink-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">초대 링크로 지인이 들어오는 중...</span>
                  <button
                    type="button"
                    onClick={handleInviteFriendPlating}
                    className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-700 text-xs font-bold hover:bg-purple-200 transition flex items-center gap-1"
                  >
                    <span>지인 펫 즉시 배치</span>
                    <RefreshCw size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* 하단 펫 꾸미기 & 토핑 팔레트 서랍 */}
            <div className="p-3.5 rounded-2xl bg-white border border-pink-100 shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700">
                  선택된 <strong className="text-pink-600 font-black">{activeSlotIdx + 1}번 칸</strong>에 얹을 펫과 토핑
                </span>
                <span className="text-[10px] text-slate-400">클릭하면 즉시 플레이팅</span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {SOLO_FLAVOR_PRESETS.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() =>
                      handleAssignPetToSlot(activeSlotIdx, {
                        slotIndex: activeSlotIdx,
                        ownerName: partyMode === 'solo' ? '나' : `지인_${pIdx + 1}`,
                        petName: p.name,
                        species: p.species,
                        paletteIndex: p.paletteIndex,
                        toppingName: p.topping,
                        isMine: partyMode === 'solo',
                      })
                    }
                    className="p-2 rounded-xl border border-slate-200 hover:border-pink-400 hover:bg-pink-50/50 text-left transition flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-100/60 flex items-center justify-center shrink-0 text-base">
                      {p.species === 'mochi' ? '🍡' : p.species === 'pudding' ? '🍮' : p.species === 'jelly' ? '🐻' : '🍫'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate">{p.name}</span>
                      <span className="text-[10px] text-pink-600 font-medium truncate">{p.topping}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 네비게이션 버튼들 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-3 px-4 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
              >
                이전으로
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-xs shadow-md hover:from-pink-600 hover:to-rose-600 transition flex items-center justify-center gap-1.5"
              >
                <span>3단계: 피니싱 터치 하러 가기</span>
                <Sparkles size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: 피니싱 터치 (레터링, 파우더, 리본) */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* 상단 프리뷰 카드 */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-pink-50 via-white to-amber-50 border-2 border-pink-200 shadow-sm flex flex-col items-center text-center gap-2">
              <span className="text-2xl">✨ 🎀 ✨</span>
              <h3 className="text-sm font-extrabold text-pink-900">달콤함을 완성하는 시그니처 터치</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                초코펜으로 따뜻한 메시지를 쓰고, 고운 슈가파우더와 선물 리본을 둘러 완성도를 높여보세요.
              </p>

              {/* 실시간 레터링 미리보기 리본 배너 */}
              <div className="mt-2 w-full py-2 px-3 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 font-extrabold text-xs tracking-wider shadow-inner">
                {lettering || '메시지를 입력해 주세요'}
              </div>
            </div>

            {/* 1. 초코펜 레터링 메시지 입력 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                <span>🍫 초코펜 손글씨 레터링 (최대 30자)</span>
                <span className="text-[10px] text-pink-500">{lettering.length}/30</span>
              </label>
              <input
                type="text"
                value={lettering}
                onChange={(e) => handleLetteringChange(e.target.value)}
                placeholder="예: 생일 축하해! 언제나 달콤하길 💖"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
              />
              {/* 추천 메시지 프리셋 칩들 */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {['생일 축하해! 🎂', '오늘도 고마워 💖', '달콤한 하루 보내 🌸', '너를 위한 스페셜 선물 🎁'].map((msg) => (
                  <button
                    key={msg}
                    type="button"
                    onClick={() => setLettering(msg)}
                    className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 text-[10px] font-semibold border border-pink-200 transition"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 파우더 & 시럽 효과 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700">❄️ 솔솔 파우더 & 글리터</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sugar-snow', name: '슈가파우더 눈꽃', icon: '❄️' },
                  { id: 'gold-leaf', name: '순금 금박 글리터', icon: '✨' },
                  { id: 'berry-syrup', name: '산딸기 시럽 드리즐', icon: '🍓' },
                  { id: 'rainbow-sprinkle', name: '무지개 스프링클', icon: '🌈' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPowder(p.id as FinishingTouch['powder'])}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                      powder === p.id
                        ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs ring-1 ring-rose-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-pink-200'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 선물 리본 선택 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700">🎀 선물 포장 리본 매듭</label>
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
                    className={`py-2 rounded-xl border text-[11px] font-bold transition flex flex-col items-center gap-1 ${
                      ribbon === r.id
                        ? 'bg-pink-100/60 border-pink-500 text-pink-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-pink-200'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: r.color }} />
                    <span className="truncate">{r.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 네비게이션 버튼들 */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-3 px-4 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
              >
                이전으로
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsBoxClosed(true)
                  setCurrentStep(4)
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-xs shadow-md hover:from-pink-600 hover:to-rose-600 transition flex items-center justify-center gap-1.5"
              >
                <span>4단계: 선물 패키징 완성하기</span>
                <Gift size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: 완성과 감동의 선물 (포장 연출, 보관 및 선물) */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* 🎁 완성된 디저트 박스 패키지 연출 카드 */}
            <div className="relative p-6 rounded-3xl bg-gradient-to-b from-rose-500/10 via-amber-500/10 to-pink-500/10 border-2 border-pink-300 shadow-lg flex flex-col items-center text-center gap-3 overflow-hidden">
              {/* 반짝이 축하 파티클 배너 */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500 text-white text-xs font-black shadow-xs">
                <Sparkles size={14} />
                <span>스페셜 디저트 파티 패키지 완성!</span>
              </div>

              {/* 뚜껑 & 리본 연출 박스 그래픽 */}
              <div className="relative my-2 w-40 h-40 rounded-3xl bg-gradient-to-br from-pink-100 to-amber-100 border-4 border-pink-400 shadow-xl flex flex-col items-center justify-center">
                {isBoxClosed ? (
                  <div className="flex flex-col items-center gap-1 animate-scale-up">
                    <span className="text-5xl">🎁</span>
                    <span className="text-[11px] font-black text-pink-700 mt-1">리본 매듭 완료</span>
                    <span className="text-[9px] text-pink-500 font-semibold">{lettering}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl">🍰</span>
                    <span className="text-xs font-bold text-slate-700">달콤 오픈 상태</span>
                  </div>
                )}

                {/* 뚜껑 열기/닫기 토글 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsBoxClosed((prev) => !prev)}
                  className="absolute bottom-2 px-2 py-0.5 rounded-full bg-white/90 text-slate-700 text-[10px] font-bold shadow-xs hover:bg-white"
                >
                  {isBoxClosed ? '상자 열어보기' : '뚜껑 닫기'}
                </button>
              </div>

              {/* 패키지 요약 정보 */}
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-black text-slate-800">
                  {selectedBase === 'box' ? '수제 초콜릿 선물상자' : selectedBase === 'cake' ? '시그니처 파티 케이크' : '애프터눈 티 트레이'}
                </h3>
                <p className="text-xs text-pink-600 font-semibold">
                  {partyMode === 'solo' ? '🧑‍🍳 나만의 1인 마스터피스' : '👥 지인들과 함께 빚은 합작 파티'} • {selectedCapacity}구 가득
                </p>
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  &ldquo;{lettering}&rdquo;
                </p>
              </div>
            </div>

            {/* 1. 나의 미니룸 장식장에 영구 보관 */}
            <div className="p-4 rounded-2xl bg-white border border-pink-200 shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="text-pink-600" size={18} />
                  <span className="text-xs font-extrabold text-slate-800">나만의 미니룸 보관함에 소장</span>
                </div>
                {isSaved && (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check size={14} /> 저장 완료!
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                내가 꾸민 파티 베이스를 미니룸 장식장에 영구 보관하여 언제든 지인들이 구경할 수 있게 전시해요.
              </p>
              <button
                type="button"
                onClick={handleSavePackage}
                disabled={isSaved}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                  isSaved
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                }`}
              >
                <BookmarkCheck size={14} />
                <span>{isSaved ? '미니룸 장식장에 진열됨' : '미니룸 보관함에 진열하기'}</span>
              </button>
            </div>

            {/* 2. 지인에게 감동의 선물 보내기 */}
            <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="text-purple-600" size={18} />
                  <span className="text-xs font-extrabold text-slate-800">지인에게 선물하기</span>
                </div>
                {isGiftSent && (
                  <span className="text-[11px] text-purple-600 font-bold flex items-center gap-0.5">
                    <Check size={14} /> 발송 완료!
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                정성스레 완성한 패키지를 지인에게 서프라이즈 선물로 전달할 수 있어요.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={giftFriendName}
                  onChange={(e) => setGiftFriendName(e.target.value.slice(0, 15))}
                  placeholder="지인 닉네임 입력 (예: 달콤단짝)"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="button"
                  onClick={handleSendGift}
                  disabled={isGiftSent}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    isGiftSent
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700 shadow-xs'
                  }`}
                >
                  <Share2 size={13} />
                  <span>보내기</span>
                </button>
              </div>
            </div>

            {/* 홈으로 돌아가기 버튼 */}
            <button
              type="button"
              onClick={onBack}
              className="mt-1 w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-sm shadow-md hover:from-pink-600 hover:to-rose-600 transition flex items-center justify-center gap-1.5"
            >
              <span>파티 파티 완료 & 광장으로</span>
              <Heart size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
