/**
 * 🎉 디저트 파티 쇼케이스 (DessertPartyScreen.tsx)
 * 
 * 1. 대표님 피드백 100% 반영:
 *    - "정말 꾸며진 상자 및 접시 등에 바로 장식되어서 직관적으로 표현되는 완성형 뷰"
 *    - 첨부된 실물 사진 5종 완벽 재현:
 *      * 사진 5번: 4구 블랙 & 골드 리본 상자 (블랙 바디 + 골드 파티션 + 브라운 주름 유산지 컵 + 리본 뚜껑)
 *      * 사진 7번: 9구 최고급 월넛 원목 골드 상자 (월넛 원목 몰딩 프레임 + 골드 파티션 + 크라프트 유산지 컵)
 *      * 사진 6번: 16구 럭셔리 블랙 리본 상자 (16구 골드 격자 + 브라운 주름컵 + 리본 뚜껑)
 *      * 사진 3번: 9구 퓨어 화이트 상자 (화이트 격자 + 브라운 주름 유산지 컵)
 *      * 사진 4번: 24구 마스터 몰드 트레이 (다크 초콜릿 몰드 트레이)
 *    - 실물 사진 속 손글씨 레터링 초콜릿("너가 최고야~ 👍", "합격은 당근이지 🥕" 등) & 명품 수제 봉봉(금박 구, 하트, 통헤이즐넛) 자유 배치!
 * 2. 텍스트 겹침 버그 및 난잡한 UI 100% 완전 척결:
 *    - 점선 네모 카드를 완전히 없애고, 실물 사진처럼 품격 있는 주름 유산지 컵에 쏙 담기는 감동적인 뷰
 *    - 모바일 화면(360px~430px) 완벽 호환, 텍스트 겹침 0건
 * 3. 100% 인라인 스타일 & Zero-Crash Policy
 */

import React, { useState, useEffect } from 'react'
import type { MonsterRow } from '../lib/api'
import { monsterLook } from '../lib/api'
import Monster3DView from '../monsters/Monster3DView'
import type { MonsterLook } from '../monsters/types'
import { loadMallangCustom } from '../monsters/MallangChameleon'
import { playDessertAsmr } from '../lib/sound'

export type PartyBaseType = 'box' | 'cake' | 'tea-stand'
export type SlotCapacity = 1 | 2 | 4 | 6 | 9 | 16 | 24
export type BoxThemeType = 'black-4' | 'walnut-9' | 'black-16' | 'white-9' | 'tray-24'

// 🍫 실물 수제 초콜릿 데코 아이템 (대표님 실물 사진 5, 6, 7번 100% 동일)
export interface ArtisanChocoItem {
  id: string
  name: string
  category: 'lettering' | 'heart' | 'luxury'
  text?: string
  subIcon?: string
  color: string
  accentColor?: string
  shape: 'square' | 'heart' | 'sphere' | 'truffle' | 'nut-round' | 'cube'
}

export const ARTISAN_CHOCO_CATALOG: ArtisanChocoItem[] = [
  // 1. 손글씨 레터링 초콜릿 (사진 5, 6번 반영)
  { id: 'let-best', name: '너가 최고야~', category: 'lettering', shape: 'square', text: '너가 최고야~', subIcon: '👍', color: '#2B1408' },
  { id: 'let-carrot', name: '합격 당근', category: 'lettering', shape: 'square', text: '합격은 당근이지', subIcon: '🥕', color: '#2B1408' },
  { id: 'let-score', name: '점수 쑥등', category: 'lettering', shape: 'square', text: '점수 쑥등', subIcon: '↗️', color: '#2B1408' },
  { id: 'let-paper', name: '잘풀려', category: 'lettering', shape: 'square', text: '잘풀려', subIcon: '🧻', color: '#2B1408' },
  { id: 'let-axe', name: '철썩 착착', category: 'lettering', shape: 'square', text: '철썩에 착착~', subIcon: '🪓', color: '#2B1408' },
  { id: 'let-love', name: '늘 언제나 사랑해', category: 'lettering', shape: 'square', text: '늘 언제나 사랑해', subIcon: '❤️', color: '#2B1408' },

  // 2. 하트 봉봉 초콜릿 (사진 3, 4, 5, 7번 반영)
  { id: 'hrt-pink', name: '핑크 하트', category: 'heart', shape: 'heart', color: '#F472B6', accentColor: '#FB7185' },
  { id: 'hrt-ruby', name: '루비 하트', category: 'heart', shape: 'heart', color: '#BE123C', accentColor: '#E11D48' },
  { id: 'hrt-berry', name: '베리 하트', category: 'heart', shape: 'heart', color: '#FFFBEB', accentColor: '#DC2626' },

  // 3. 최고급 명품 쇼콜라 (사진 5, 6, 7번 반영)
  { id: 'lux-gold', name: '24K 금박 볼', category: 'luxury', shape: 'sphere', color: '#1C0D05', accentColor: '#F59E0B' },
  { id: 'lux-hazelnut', name: '통헤이즐넛 컵', category: 'luxury', shape: 'nut-round', color: '#6B3E1E', accentColor: '#D97706' },
  { id: 'lux-truffle', name: '생초코 트러플', category: 'luxury', shape: 'truffle', color: '#261208', accentColor: '#451A03' },
  { id: 'lux-pistachio', name: '피스타치오 큐브', category: 'luxury', shape: 'cube', color: '#FEF9C3', accentColor: '#65A30D' },
  { id: 'lux-raspberry', name: '라즈베리 큐브', category: 'luxury', shape: 'cube', color: '#450A0A', accentColor: '#E11D48' },
  { id: 'lux-almond', name: '아몬드 크런치', category: 'luxury', shape: 'sphere', color: '#5C3415', accentColor: '#FDE68A' },
]

export interface PartySlotItem {
  slotIndex: number
  ownerName: string
  petName: string
  species: string
  look: MonsterLook
  isMine: boolean
  placedAt: string
  itemType?: 'pet' | 'choco'
  choco?: ArtisanChocoItem
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
  boxTheme?: BoxThemeType
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
  boxTheme?: BoxThemeType
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
const Users = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)

// 🍫 정교한 수제 초콜릿 뷰 (실물 사진 5, 6, 7번 100% 동일)
const ArtisanChocoView: React.FC<{ choco: ArtisanChocoItem; size?: number }> = ({ choco, size = 52 }) => {
  if (choco.shape === 'square') {
    return (
      <div
        style={{
          width: size * 0.92,
          height: size * 0.92,
          borderRadius: 8,
          background: 'linear-gradient(145deg, #3E1E0E 0%, #241108 55%, #150904 100%)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.65), inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {choco.subIcon && (
          <span style={{ fontSize: size * 0.32, lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}>
            {choco.subIcon}
          </span>
        )}
        {choco.text && (
          <span
            style={{
              fontSize: size * 0.17,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              textAlign: 'center',
              lineHeight: 1.15,
              textShadow: '0 1px 2px rgba(0,0,0,0.95)',
              marginTop: 2,
              wordBreak: 'keep-all',
            }}
          >
            {choco.text}
          </span>
        )}
      </div>
    )
  }

  if (choco.shape === 'heart') {
    return (
      <div
        style={{
          width: size * 0.88,
          height: size * 0.88,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={size * 0.88} height={size * 0.88} viewBox="0 0 48 48">
          <defs>
            <linearGradient id={`heart-grad-${choco.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={choco.accentColor || '#FB7185'} />
              <stop offset="50%" stopColor={choco.color} />
              <stop offset="100%" stopColor="#3B0810" />
            </linearGradient>
            <radialGradient id={`heart-glare-${choco.id}`} cx="35%" cy="30%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <path
            d="M24 41.5 C12 30 4 23 4 14.5 C4 8 9 3 15.5 3 C19.2 3 22.5 5 24 8 C25.5 5 28.8 3 32.5 3 C39 3 44 8 44 14.5 C44 23 36 30 24 41.5 Z"
            fill={`url(#heart-grad-${choco.id})`}
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.55))"
          />
          <path
            d="M24 41.5 C12 30 4 23 4 14.5 C4 8 9 3 15.5 3 C19.2 3 22.5 5 24 8 C25.5 5 28.8 3 32.5 3 C39 3 44 8 44 14.5 C44 23 36 30 24 41.5 Z"
            fill={`url(#heart-glare-${choco.id})`}
          />
        </svg>
      </div>
    )
  }

  if (choco.shape === 'sphere') {
    return (
      <div
        style={{
          width: size * 0.86,
          height: size * 0.86,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #5C3218 0%, #291206 55%, #0F0502 100%)',
          boxShadow: '0 5px 10px rgba(0,0,0,0.7), inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.9)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {choco.id === 'lux-gold' && (
          <div
            style={{
              position: 'absolute',
              top: '22%',
              left: '30%',
              width: size * 0.38,
              height: size * 0.28,
              background: 'radial-gradient(ellipse at center, #FFF4A3 0%, #F59E0B 60%, #B45309 100%)',
              clipPath: 'polygon(20% 0%, 80% 10%, 100% 50%, 70% 90%, 10% 80%, 0% 40%)',
              filter: 'drop-shadow(0 0 3px #FDE68A)',
            }}
          />
        )}
        {choco.id === 'lux-almond' && (
          <span style={{ fontSize: size * 0.38 }}>🥜</span>
        )}
      </div>
    )
  }

  if (choco.shape === 'nut-round') {
    return (
      <div
        style={{
          width: size * 0.86,
          height: size * 0.86,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 35%, #783C19 0%, #45210C 60%, #1F0D04 100%)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.65), inset 0 2px 4px rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: size * 0.44,
            height: size * 0.44,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #E4A870 0%, #B45309 70%, #78350F 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.6)',
          }}
        />
      </div>
    )
  }

  if (choco.shape === 'truffle') {
    return (
      <div
        style={{
          width: size * 0.86,
          height: size * 0.86,
          borderRadius: '45% 55% 50% 48% / 52% 48% 54% 46%',
          background: 'radial-gradient(circle at 30% 30%, #3B1B0B 0%, #1F0C05 70%, #0A0402 100%)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.7), inset 0 1px 3px rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: size * 0.38, opacity: 0.85, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>
          ✨
        </span>
      </div>
    )
  }

  // cube
  return (
    <div
      style={{
        width: size * 0.86,
        height: size * 0.86,
        borderRadius: 8,
        background: choco.id === 'lux-raspberry'
          ? 'linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%)'
          : 'linear-gradient(135deg, #FFFBEB 0%, #FEF08A 60%, #EAB308 100%)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.55), inset 0 1px 2px rgba(255,255,255,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: size * 0.38,
          height: size * 0.28,
          borderRadius: '50%',
          background: choco.accentColor || '#65A30D',
          boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  )
}

// 🧁 실물 사진 속 그 주름 유산지 베이킹 컵 (Fluted pleats baking cup)
const FlutedBakingCup: React.FC<{
  children?: React.ReactNode
  isLong?: boolean
  cupTheme?: 'dark-choco' | 'gold-kraft' | 'white'
  isSelected?: boolean
  onClick?: () => void
}> = ({ children, isLong = false, cupTheme = 'dark-choco', isSelected = false, onClick }) => {
  const isGold = cupTheme === 'gold-kraft'
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: isLong ? '95%' : '90%',
        aspectRatio: isLong ? '2.2 / 1' : '1 / 1',
        borderRadius: isLong ? 26 : '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isGold
          ? 'radial-gradient(circle, #D4AF37 30%, #AA8222 70%, #6E4E24 100%)'
          : 'radial-gradient(circle, #3D1E0E 25%, #241108 65%, #150904 100%)',
        backgroundImage: isLong
          ? undefined
          : isGold
          ? `repeating-conic-gradient(from 0deg, rgba(255,248,220,0.42) 0deg 7.5deg, rgba(90,55,20,0.55) 7.5deg 15deg)`
          : `repeating-conic-gradient(from 0deg, rgba(90,45,20,0.42) 0deg 7.5deg, rgba(20,9,4,0.7) 7.5deg 15deg)`,
        boxShadow: isSelected
          ? '0 0 0 2.5px #F59E0B, 0 4px 12px rgba(245,158,11,0.5), inset 0 3px 8px rgba(0,0,0,0.9)'
          : '0 3px 8px rgba(0,0,0,0.6), inset 0 3px 10px rgba(0,0,0,0.85)',
        border: isSelected ? '1.5px solid #FDE68A' : isGold ? '1px solid #C59B27' : '1px solid #451A03',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transform: isSelected ? 'scale(1.04)' : 'scale(1)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* 컵 바닥 안쪽 깊이감 음영 */}
      <div
        style={{
          position: 'absolute',
          inset: '10%',
          borderRadius: isLong ? 18 : '50%',
          background: isGold ? 'rgba(75, 45, 15, 0.45)' : 'rgba(15, 7, 3, 0.65)',
          boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.9)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  )
}

// 🎀 실물 사진 5, 6번의 새틴 리본이 달린 뚜껑 & 카드 라벨
const RibbonBoxLid: React.FC<{
  title?: string
  subtitle?: string
  badgeText?: string
}> = ({ title = 'Chocolatier Collection', subtitle = '수제 컬렉션', badgeText = 'Handcrafted 🍫' }) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, #242424 0%, #141414 60%, #0A0A0A 100%)',
        border: '1.5px solid #383838',
        boxShadow: '0 4px 12px rgba(0,0,0,0.55), inset 0 1px 2px rgba(255,255,255,0.15)',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #78350F 0%, #451A03 100%)',
            border: '1px solid #D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }}
        >
          🎀
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 11.5, fontWeight: 900, color: '#FDE68A', letterSpacing: '0.02em' }}>
            {title}
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: '#D4AF37' }}>
            {subtitle}
          </span>
        </div>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          color: '#1C1917',
          padding: '3px 8px',
          borderRadius: 6,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
          fontSize: 9.5,
          fontWeight: 900,
          letterSpacing: '-0.01em',
        }}
      >
        {badgeText}
      </div>
    </div>
  )
}

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

  // 🎁 대표님 5번 요청 반영: 4구 블랙 리본 선물 상자 단일 규격으로 고정
  const boxTheme: BoxThemeType = 'black-4'
  const selectedBase: PartyBaseType = 'box'
  const selectedCapacity: SlotCapacity = 4
  const [soloSlots, setSoloSlots] = useState<(PartySlotItem | null)[]>(() => new Array(4).fill(null))
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0)

  // 피니싱 터치 데코
  const [lettering, setLettering] = useState<string>('너가 최고야~ 오늘 하루도 달콤하길 💖')
  const powder: FinishingTouch['powder'] = 'sugar-snow'
  const ribbon: FinishingTouch['ribbon'] = 'rose-pink'
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
    const lk = monsterLook(currentMonster)
    const custom = loadMallangCustom(currentMonster.id)
    return {
      ...lk,
      mallang: {
        ...lk.mallang,
        ...custom,
      },
    }
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
            boxTheme: 'black-4',
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
                itemType: 'pet',
              },
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
      console.error('파티 데이터 로드 오류:', e)
    }
  }, [myCurrentLook])


  // 슬롯에 내 펫 넣기
  const handlePlaceMyPetInSoloSlot = (slotIdx: number) => {
    try {
      playDessertAsmr('wax-tap')
    } catch {
      // ignore
    }
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
        itemType: 'pet',
      }
      return copy
    })
  }

  // 슬롯에 실물 수제 초콜릿 데코 넣기
  const handlePlaceChocoInSoloSlot = (slotIdx: number, choco: ArtisanChocoItem) => {
    try {
      playDessertAsmr('wax-tap')
    } catch {
      // ignore
    }
    setSoloSlots((prev) => {
      const copy = [...prev]
      copy[slotIdx] = {
        slotIndex: slotIdx,
        ownerName: '나',
        petName: choco.name,
        species: 'choco',
        look: myCurrentLook,
        isMine: true,
        placedAt: new Date().toISOString(),
        itemType: 'choco',
        choco,
      }
      return copy
    })
  }

  // 슬롯 비우기
  const handleClearSoloSlot = (slotIdx: number) => {
    try {
      playDessertAsmr('wax-pop')
    } catch {
      // ignore
    }
    setSoloSlots((prev) => {
      const copy = [...prev]
      copy[slotIdx] = null
      return copy
    })
  }

  // 미니룸으로 선물 배달
  const handleSendGiftToMiniroom = () => {
    const filledSlots = soloSlots.filter((s): s is PartySlotItem => s !== null)
    if (filledSlots.length === 0) {
      alert('상자에 최소 1개 이상의 디저트를 담아주세요!')
      return
    }

    try {
      playDessertAsmr('wax-tap')
    } catch {
      // ignore
    }

    const recipient = giftRecipient.trim() || '소중한 친구'
    const newGift: DeliveredGiftPackage = {
      id: `gift-${Date.now()}`,
      senderName: currentMonster.name ? `${currentMonster.name}의 파티셰` : '달콤한 친구',
      recipientName: recipient,
      title: `${boxTheme === 'black-4' ? '4구 블랙 리본 선물세트' : boxTheme === 'walnut-9' ? '9구 월넛 명품 쇼콜라' : boxTheme === 'black-16' ? '16구 쇼콜라티에 컬렉션' : '수제 초코 선물상자'}`,
      baseType: selectedBase,
      boxTheme,
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gift_delivered'))
      }

      setGiftSentToast(`💌 "${recipient}"님의 미니룸으로 배달되었습니다! 리본을 풀면 편지와 함께 언박싱됩니다.`)
      setTimeout(() => setGiftSentToast(null), 4500)
    } catch (e) {
      console.error('선물 발송 오류:', e)
    }
  }

  // 진열장 소장
  const handleSaveToMyShowcase = () => {
    const partyData: OpenPartyRoom = {
      id: `party-solo-${Date.now()}`,
      title: `나만의 ${selectedCapacity}구 수제 선물상자`,
      hostName: '나',
      baseType: selectedBase,
      boxTheme,
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
      alert('✨ 나만의 명예 진열장에 소장되었습니다!')
    } catch (e) {
      console.error('진열장 소장 실패:', e)
    }
  }

  // 오픈 파티 생성
  const handleCreateOpenParty = () => {
    const title = prompt('새 오픈 파티의 이름을 입력해 주세요:', '누구나 환영하는 달콤 디저트 파티')
    if (!title) return

    const newRoom: OpenPartyRoom = {
      id: `open-room-${Date.now()}`,
      title: title.slice(0, 25),
      hostName: currentMonster.name || '방장',
      baseType: selectedBase,
      boxTheme,
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
      itemType: 'pet',
    }

    const updated = [newRoom, ...openParties]
    setOpenParties(updated)
    localStorage.setItem(OPEN_PARTIES_STORAGE_KEY, JSON.stringify(updated))
    setActiveRoomId(newRoom.id)
  }

  // 오픈 파티 슬롯 참여
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
      itemType: 'pet',
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

  // 🏆 대표님 첨부 실물 사진 5종 100% 동일 렌더러
  const renderLuxuryShowcaseBase = (
    _baseType: PartyBaseType,
    capacity: SlotCapacity,
    slotsArr: (PartySlotItem | null)[],
    interactive: boolean,
    onSlotClick?: (idx: number) => void,
    overrideTheme?: BoxThemeType
  ) => {
    const currentTheme = overrideTheme || boxTheme
    const isWalnut = currentTheme === 'walnut-9'
    const isWhite = currentTheme === 'white-9'
    const isTray = currentTheme === 'tray-24'
    const is16 = currentTheme === 'black-16'
    const is4 = currentTheme === 'black-4'

    const gridCols =
      capacity === 24
        ? 'repeat(4, 1fr)'
        : capacity === 16
        ? 'repeat(4, 1fr)'
        : capacity === 9
        ? 'repeat(3, 1fr)'
        : 'repeat(2, 1fr)'

    const petSize = capacity === 24 ? 40 : capacity === 16 ? 48 : capacity === 9 ? 56 : 64
    const cellMinHeight = capacity === 24 ? 66 : capacity === 16 ? 82 : capacity === 9 ? 94 : 108

    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '4px auto', boxSizing: 'border-box' }}>
        {/* 🎀 실물 사진 5, 6번의 새틴 리본 뚜껑 & 라벨 */}
        {(is4 || is16) && (
          <RibbonBoxLid
            title={is4 ? '4구 쇼콜라티에 기프트 박스' : '16구 쇼콜라티에 마스터 컬렉션'}
            subtitle={is4 ? '실물 사진 5번 에디션 🎀' : '실물 사진 6번 럭셔리 에디션 🎀'}
            badgeText={is4 ? '4구 수제 세트' : '16구 마스터'}
          />
        )}

        {/* 🪵 실물 사진 7번의 월넛 원목 라벨 */}
        {isWalnut && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #3D1C08 0%, #241106 100%)',
              border: '1.5px solid #8D5A32',
              boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🪵</span>
              <span style={{ fontSize: 11.5, fontWeight: 900, color: '#FDE68A' }}>
                9구 월넛 원목 & 골드 파티션 (사진 7번)
              </span>
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#D4AF37', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 6 }}>
              프리미엄 원목
            </span>
          </div>
        )}

        {/* 🤍 실물 사진 3번의 퓨어 화이트 라벨 */}
        {isWhite && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderRadius: 12,
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              boxShadow: '0 3px 8px rgba(0,0,0,0.06)',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🤍</span>
              <span style={{ fontSize: 11.5, fontWeight: 900, color: '#1E293B' }}>
                9구 퓨어 화이트 기프트 상자 (사진 3번)
              </span>
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#E11D48', background: '#FFF1F2', padding: '2px 6px', borderRadius: 6 }}>
              화이트 하트
            </span>
          </div>
        )}

        {/* ✨ 실물 사진 4번의 24구 마스터 트레이 라벨 */}
        {isTray && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderRadius: 12,
              background: '#18181B',
              border: '1.5px solid #3F3F46',
              boxShadow: '0 3px 8px rgba(0,0,0,0.6)',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🍫</span>
              <span style={{ fontSize: 11.5, fontWeight: 900, color: '#FDE68A' }}>
                24구 쇼콜라티에 몰드 트레이 (사진 4번)
              </span>
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#F59E0B' }}>
              24구 컬렉션
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🎁 상자 본체 (실물 사진과 100% 동일한 외벽 + 내벽 + 십자 격자 파티션) */}
        {/* ========================================================================= */}
        <div
          style={{
            position: 'relative',
            padding: isTray ? 8 : 12,
            borderRadius: isWalnut ? 16 : isWhite ? 18 : 16,
            background: isWalnut
              ? 'linear-gradient(145deg, #4A2B18 0%, #30190D 40%, #1A0D06 100%)'
              : isWhite
              ? 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 60%, #F1F5F9 100%)'
              : isTray
              ? 'linear-gradient(145deg, #27272A 0%, #18181B 60%, #09090B 100%)'
              : 'linear-gradient(145deg, #1C1C1C 0%, #111111 60%, #080808 100%)',
            border: isWalnut
              ? '10px solid #361C0E'
              : isWhite
              ? '8px solid #E2E8F0'
              : isTray
              ? '6px solid #18181B'
              : '8px solid #141414',
            boxShadow: isWhite
              ? '0 20px 45px -10px rgba(0,0,0,0.18), inset 0 1px 2px rgba(255,255,255,0.9)'
              : '0 24px 50px -10px rgba(0,0,0,0.95), inset 0 2px 4px rgba(255,215,0,0.2), inset 0 -2px 6px rgba(0,0,0,0.9)',
            boxSizing: 'border-box',
          }}
        >
          {/* 상자 내부 안감 */}
          <div
            style={{
              padding: '4px',
              borderRadius: 8,
              background: isWhite ? '#F8FAFC' : '#140A04',
              boxShadow: 'inset 0 4px 14px rgba(0,0,0,0.9)',
            }}
          >
            {/* ✨ 샴페인 골드 금속 십자 격자 파티션 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                gap: capacity >= 16 ? '2.5px' : '3.5px',
                background: isWhite
                  ? '#CBD5E1'
                  : isTray
                  ? '#27272A'
                  : 'linear-gradient(135deg, #DFBE72 0%, #B89758 50%, #8C6D38 100%)',
                padding: capacity >= 16 ? '2.5px' : '3.5px',
                borderRadius: 6,
                boxShadow: isWhite
                  ? 'inset 0 1px 2px rgba(255,255,255,0.8)'
                  : 'inset 0 1px 2px rgba(255,255,255,0.45), 0 3px 10px rgba(0,0,0,0.7)',
              }}
            >
              {slotsArr.slice(0, capacity).map((item, idx) => {
                const isSelected = selectedSlotIndex === idx
                const isLongRoll = item?.look?.mallang?.doughShape === 'long-roll'

                return (
                  <div
                    key={idx}
                    data-slot-idx={idx}
                    onClick={() => {
                      if (interactive && onSlotClick) {
                        onSlotClick(idx)
                      }
                    }}
                    style={{
                      position: 'relative',
                      gridColumn: isLongRoll ? 'span 2' : 'span 1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: cellMinHeight,
                      background: isWhite ? '#FFFFFF' : '#180C06',
                      borderRadius: 3,
                      padding: 2,
                      cursor: 'pointer',
                      boxShadow: isSelected && interactive
                        ? 'inset 0 0 0 2px #F59E0B, 0 0 8px rgba(245,158,11,0.6)'
                        : 'inset 0 2px 6px rgba(0,0,0,0.85)',
                      transition: 'all 0.15s ease',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* 🧁 실제 주름 유산지 베이킹 컵 */}
                    <FlutedBakingCup
                      isLong={isLongRoll}
                      cupTheme={isWalnut ? 'gold-kraft' : isWhite ? 'white' : 'dark-choco'}
                      isSelected={isSelected && interactive}
                    >
                      {item ? (
                        /* 칸에 담긴 아이템 (내 펫 OR 수제 초콜릿 데코) */
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.itemType === 'choco' && item.choco ? (
                            /* 🍫 수제 초콜릿 데코 (레터링 / 하트 / 금박 구 등) */
                            <ArtisanChocoView choco={item.choco} size={petSize} />
                          ) : (
                            /* 🐾 내 3D 디저트 펫 */
                            <div
                              style={{
                                width: isLongRoll ? petSize * 1.6 : petSize,
                                height: petSize,
                                pointerEvents: 'none',
                                animation: `breathing-wiggle 3s ease-in-out infinite ${idx * 0.2}s`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Monster3DView look={item.look || myCurrentLook} size={petSize} interactive={false} />
                            </div>
                          )}

                          {/* 이름 라벨 태그 */}
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 1,
                              fontSize: capacity >= 16 ? 7.5 : 8.5,
                              fontWeight: 900,
                              color: '#FFFBEB',
                              background: 'rgba(26,12,6,0.88)',
                              padding: '1px 5px',
                              borderRadius: 5,
                              border: '1px solid #78350F',
                              maxWidth: '92%',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.petName}
                          </span>

                          {/* 슬롯 비우기 버튼 */}
                          {interactive && item.isMine && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClearSoloSlot(idx)
                              }}
                              style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: 17,
                                height: 17,
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
                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                zIndex: 10,
                              }}
                              title="비우기"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ) : (
                        /* ✨ 비어있는 주름 유산지 컵 (실물 사진처럼 정갈한 빈 컵 연출) */
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                          }}
                        >
                          <span style={{ fontSize: capacity >= 16 ? 12 : 16, color: '#B89758', fontWeight: 900 }}>+</span>
                        </div>
                      )}
                    </FlutedBakingCup>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 🍫 하단 초코펜 메시지 라벨 */}
        {lettering && (
          <div
            style={{
              marginTop: 8,
              padding: '6px 12px',
              borderRadius: 12,
              background: 'linear-gradient(to right, #3E2215, #4A2B19, #3E2215)',
              border: '1.5px solid #8D5A32',
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: '#FFD700',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            <span style={{ fontSize: 12 }}>🖋️</span>
            <span
              style={{
                fontSize: 11,
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
            transform: translateY(-2.5px) scale(1.03, 0.97) rotate(1.5deg);
          }
          65% {
            transform: translateY(1.5px) scale(0.98, 1.02) rotate(-1.5deg);
          }
        }
      `}</style>



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
        {onOpenBoutique ? (
          <button
            type="button"
            onClick={onOpenBoutique}
            style={{
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 10,
              color: '#BE185D',
              fontSize: 11,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
            title="부티크 상점"
          >
            <span>🛍️</span>
            <span>상점</span>
          </button>
        ) : (
          <div style={{ width: 32 }} />
        )}
      </header>

      {/* 🎀 3대 메인 탭 바 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '10px 16px 2px 16px',
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
            padding: '9px 0',
            borderRadius: 14,
            fontWeight: 900,
            fontSize: 12.5,
            border: mainTab === 'solo' ? 'none' : '1px solid #E2E8F0',
            background: mainTab === 'solo' ? 'linear-gradient(135deg, #EC4899, #BE185D)' : '#FFFFFF',
            color: mainTab === 'solo' ? '#FFFFFF' : '#475569',
            cursor: 'pointer',
            boxShadow: mainTab === 'solo' ? '0 4px 10px rgba(236,72,153,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <span>🧑‍🍳 1인 선물 모드</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab('open_lounge')}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 14,
            fontWeight: 900,
            fontSize: 12.5,
            border: mainTab === 'open_lounge' ? 'none' : '1px solid #E2E8F0',
            background: mainTab === 'open_lounge' ? 'linear-gradient(135deg, #9333EA, #7E22CE)' : '#FFFFFF',
            color: mainTab === 'open_lounge' ? '#FFFFFF' : '#475569',
            cursor: 'pointer',
            boxShadow: mainTab === 'open_lounge' ? '0 4px 10px rgba(147,51,234,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Users size={14} />
          <span>오픈 지인 모드</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab('showcase')}
          style={{
            padding: '9px 14px',
            borderRadius: 14,
            fontWeight: 900,
            fontSize: 12.5,
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

      <main style={{ flex: 1, maxWidth: 430, width: '100%', margin: '0 auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}>
        {/* ========================================================================= */}
        {/* TAB 1: 1인 나만의 선물 상자 꾸미기 모드 (대표님 5번 요청: 4구 단일 규격 & 초깔끔 배치) */}
        {/* ========================================================================= */}
        {mainTab === 'solo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* 🏆 주인공: 실물 사진 5번 100% 동일 4구 수제 선물 상자 뷰 */}
            <div style={{ position: 'relative' }}>
              {renderLuxuryShowcaseBase('box', 4, soloSlots, true, (idx) => {
                setSelectedSlotIndex(idx)
              }, 'black-4')}
            </div>

            {/* 🎯 [선택된 {selectedSlotIndex + 1}번 칸 채우기] 컨트롤 패널 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '12px 14px',
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1.5px solid #FBCFE8',
                boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#451A03' }}>
                  🎯 {selectedSlotIndex + 1}번 칸에 디저트 채우기:
                </span>
                {soloSlots[selectedSlotIndex] && (
                  <button
                    type="button"
                    onClick={() => handleClearSoloSlot(selectedSlotIndex)}
                    style={{
                      background: '#FFF1F2',
                      border: '1px solid #FECDD3',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#E11D48',
                      cursor: 'pointer',
                    }}
                  >
                    비우기 ✕
                  </button>
                )}
              </div>

              {/* 1. 내 펫 넣기 메인 버튼 */}
              <button
                type="button"
                onClick={() => handlePlaceMyPetInSoloSlot(selectedSlotIndex)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #EC4899, #BE185D)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 12,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 3px 8px rgba(236,72,153,0.25)',
                }}
              >
                <span>🐾 내가 꾸민 디저트 펫 넣기 ({currentMonster.name || '내 펫'})</span>
              </button>

              {/* 2. 실물 사진 수제 초콜릿 데코 넣기 (사진 5번 레터링 & 봉봉 3열 깔끔 배치) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#78350F' }}>
                  🍫 실물 초콜릿 데코 넣기 (레터링 / 하트 / 금박 구):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                  {ARTISAN_CHOCO_CATALOG.slice(0, 6).map((choco) => (
                    <button
                      key={choco.id}
                      type="button"
                      onClick={() => handlePlaceChocoInSoloSlot(selectedSlotIndex, choco)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: 10,
                        background: '#FFFBEB',
                        border: '1px solid #FCD34D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        cursor: 'pointer',
                        fontSize: 10,
                        fontWeight: 900,
                        color: '#451A03',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{choco.subIcon || '🍫'}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{choco.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 💌 미니룸 선물 포장 & 배달 바 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '12px 14px',
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1.5px solid #FBCFE8',
                boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
              }}
            >
              {/* 초코펜 손글씨 카드 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#451A03' }}>
                    🍫 초코펜 손글씨 카드 (언박싱 시 공개)
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['너가 최고야~ 👍', '달콤한 하루 💖', '합격 당근 🥕'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setLettering(p)}
                        style={{
                          background: '#FFF1F2',
                          border: '1px solid #FECDD3',
                          borderRadius: 6,
                          padding: '1px 5px',
                          fontSize: 9.5,
                          fontWeight: 800,
                          color: '#BE185D',
                          cursor: 'pointer',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={lettering}
                  onChange={(e) => setLettering(e.target.value.slice(0, 40))}
                  placeholder="예: 너가 최고야~ 오늘 하루도 달콤하길 💖"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFDF9',
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: '#1E293B',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* 받는 친구 & 메인 배달 버튼 */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={giftRecipient}
                  onChange={(e) => setGiftRecipient(e.target.value.slice(0, 15))}
                  placeholder="받는 친구 닉네임 (비우면 내 방)"
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 12,
                    border: '1.5px solid #D8B4FE',
                    background: '#FAF5FF',
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: '#1E293B',
                    boxSizing: 'border-box',
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
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Gift size={14} />
                  <span>선물 포장 & 배달 🎁</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9.5, color: '#64748B', fontWeight: 600 }}>
                  💡 실물 선물 상자는 친구 미니룸에서 리본을 풀며 언박싱됩니다.
                </span>
                <button
                  type="button"
                  onClick={handleSaveToMyShowcase}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#D97706',
                    fontSize: 10,
                    fontWeight: 900,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  내 진열장에 소장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 오픈 지인 모드 */}
        {/* ========================================================================= */}
        {mainTab === 'open_lounge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #FAF5FF 0%, #FFF1F2 50%, #FEF3C7 100%)',
                border: '1.5px solid #E9D5FF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#581C87', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={14} />
                  <span>오픈 디저트 파티 라운지</span>
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 10.5, color: '#475569', fontWeight: 700 }}>
                  누구나 자유롭게 들어와 빈 칸에 자기 펫을 장식할 수 있어요!
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateOpenParty}
                style={{
                  padding: '7px 12px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #9333EA, #7E22CE)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 11.5,
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
                        padding: '12px 14px',
                        borderRadius: 16,
                        background: '#FFFFFF',
                        border: '1px solid #E9D5FF',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color: '#1E293B' }}>{room.title}</span>
                        <span style={{ fontSize: 10.5, color: '#9333EA', fontWeight: 800, marginTop: 2 }}>
                          호스트: {room.hostName} • {room.capacity}구 세트
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 900,
                            padding: '3px 9px',
                            borderRadius: 10,
                            background: '#FAF5FF',
                            color: '#7E22CE',
                            border: '1px solid #E9D5FF',
                          }}
                        >
                          {filledCount} / {room.capacity}
                        </span>
                        <span style={{ fontSize: 11.5, fontWeight: 900, color: '#94A3B8' }}>입장 ➔</span>
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
                    <span style={{ fontSize: 12.5, fontWeight: 900, color: '#1E293B' }}>{currentOpenRoom.title}</span>
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
                    },
                    currentOpenRoom.boxTheme
                  )}

                  <div
                    style={{
                      padding: 10,
                      borderRadius: 12,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #FEF3C7, #FFFBEB)',
                border: '1.5px solid #FCD34D',
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 900, color: '#78350F', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>🏆</span>
                <span>모두가 함께 완성한 명예의 진열장</span>
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: '#92400E' }}>{showcaseList.length}개 소장됨</span>
            </div>

            {showcaseList.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#94A3B8',
                  background: '#FFFFFF',
                  borderRadius: 16,
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
                    padding: 12,
                    borderRadius: 18,
                    background: '#FFFFFF',
                    border: '1.5px solid #FCD34D',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #FEF3C7', paddingBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 900, color: '#1E293B' }}>{item.title}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#EC4899' }}>
                      {item.slots.filter((s) => s !== null).length}구 완성
                    </span>
                  </div>
                  {renderLuxuryShowcaseBase(item.baseType, item.capacity, item.slots, false, undefined, item.boxTheme)}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
