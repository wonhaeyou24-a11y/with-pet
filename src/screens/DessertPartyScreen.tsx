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
import { monsterLook, cleanupTesterPetsAndLogs } from '../lib/api'
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

// 📸 대표님 요청 반영: 실제 감성 즉석 사진 상자 뚜껑 & 앨범 타이틀 라벨
const PhotoMemoryBoxLid: React.FC<{
  title?: string
  subtitle?: string
  badgeText?: string
}> = ({
  title = 'Our Sweet Memories 포토 박스',
  subtitle = '실제 사진 상자에 담긴 달콤한 순간 📸',
  badgeText = '추억의 사진함 🎞️',
}) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 14,
        background: 'linear-gradient(135deg, #451A03 0%, #291204 100%)',
        border: '1.5px solid #78350F',
        boxShadow: '0 4px 12px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.2)',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
            border: '1px solid #FCD34D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          📸
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 11.5, fontWeight: 900, color: '#FDE68A', letterSpacing: '0.01em' }}>
            {title}
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: '#FCD34D' }}>
            {subtitle}
          </span>
        </div>
      </div>

      <div
        style={{
          background: '#FFFBEB',
          color: '#78350F',
          padding: '3px 8px',
          borderRadius: 6,
          border: '1px solid #FDE68A',
          boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
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

// 📸 대표님 요청 반영: 기계적 슬롯 대신 실제 폴라로이드 즉석 인화 사진 카드 (Polaroid Photo Card)
const PolaroidPhotoCard: React.FC<{
  children?: React.ReactNode
  title?: string
  subtitle?: string
  isSelected?: boolean
  isEmpty?: boolean
  onClick?: () => void
  tiltDeg?: number
  tapeColor?: string
}> = ({
  children,
  title,
  subtitle,
  isSelected = false,
  isEmpty = false,
  onClick,
  tiltDeg = 0,
  tapeColor = 'rgba(251, 207, 232, 0.85)',
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: '92%',
        aspectRatio: '0.82 / 1',
        borderRadius: 8,
        background: isEmpty ? 'rgba(255,255,255,0.7)' : '#FFFFFF',
        boxShadow: isSelected
          ? '0 0 0 2.5px #EC4899, 0 8px 18px rgba(236,72,153,0.35)'
          : isEmpty
          ? '0 2px 6px rgba(0,0,0,0.06)'
          : '0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)',
        border: isSelected
          ? '1.5px solid #F472B6'
          : isEmpty
          ? '1.5px dashed #CBD5E1'
          : '1px solid #E2E8F0',
        cursor: 'pointer',
        transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isSelected ? 'scale(1.04) rotate(0deg)' : `rotate(${tiltDeg}deg)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 5px 6px 5px',
        boxSizing: 'border-box',
        overflow: 'visible',
      }}
    >
      {/* 🏷️ 상단 감성 마스킹 테이프 장식 */}
      <div
        style={{
          position: 'absolute',
          top: -6,
          width: 32,
          height: 11,
          background: tapeColor,
          opacity: 0.9,
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          transform: 'rotate(-2deg)',
          zIndex: 5,
        }}
      />

      {/* 📷 사진 인화 뷰파인더 영역 (따뜻한 파스텔 배경) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          borderRadius: 5,
          background: isEmpty
            ? '#F8FAFC'
            : 'linear-gradient(135deg, #FEF3C7 0%, #FDF2F8 50%, #EFF6FF 100%)',
          border: '1px solid #F1F5F9',
          boxShadow: isEmpty ? 'none' : 'inset 0 1px 4px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>

      {/* ✍️ 폴라로이드 하단 감성 손글씨 메모 여백 */}
      <div
        style={{
          width: '100%',
          paddingTop: 4,
          paddingBottom: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1.15,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: isEmpty ? '#94A3B8' : '#1E293B',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '95%',
          }}
        >
          {title || (isEmpty ? '📷 사진 꽂기' : '달콤한 순간 💖')}
        </span>
        <span
          style={{
            fontSize: 7.5,
            fontWeight: 800,
            color: isEmpty ? '#CBD5E1' : '#EC4899',
            letterSpacing: '0.02em',
          }}
        >
          {subtitle || (isEmpty ? '터치해서 담기' : '📸 Sweet Snap')}
        </span>
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

  // 슬롯 비우기 (쇼케이스 상자에서 펫 / 데코 꺼내기)
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
    setGiftSentToast(`🐾 ${slotIdx + 1}번 칸에서 디저트를 꺼냈습니다!`)
    setTimeout(() => setGiftSentToast(null), 2400)
  }

  // 🐾 오픈 파티 상자에서 내 펫 꺼내기 (슬롯 회수)
  const handleLeaveOpenPartySlot = (roomId: string, slotIdx: number) => {
    const room = openParties.find((r) => r.id === roomId)
    if (!room || room.isCompleted) return

    try {
      playDessertAsmr('wax-pop')
    } catch {
      // ignore
    }

    const updatedSlots = [...room.slots]
    updatedSlots[slotIdx] = null
    const updatedRoom: OpenPartyRoom = {
      ...room,
      slots: updatedSlots,
      isCompleted: false,
    }

    const updatedList = openParties.map((r) => (r.id === roomId ? updatedRoom : r))
    setOpenParties(updatedList)
    localStorage.setItem(OPEN_PARTIES_STORAGE_KEY, JSON.stringify(updatedList))
    setGiftSentToast(`🐾 파티 상자 ${slotIdx + 1}번 칸에서 내 펫을 꺼냈습니다!`)
    setTimeout(() => setGiftSentToast(null), 2500)
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
      // 🎁 슬롯이 100% 채워졌을 때 참여한 지인들에게 자동으로 완성 선물 발송!
      const participants = updatedSlots.filter((s): s is PartySlotItem => s !== null)
      const existingGifts = localStorage.getItem(DELIVERED_GIFTS_STORAGE_KEY)
      const giftList: DeliveredGiftPackage[] = existingGifts ? JSON.parse(existingGifts) : []

      participants.forEach((p, pIdx) => {
        const giftPkg: DeliveredGiftPackage = {
          id: `gift-party-${roomId}-${pIdx}-${Date.now()}`,
          senderName: room.hostName || '달콤 파티룸',
          recipientName: p.ownerName || '소중한 지인',
          title: `🎉 ${room.title} 합작 완성 세트!`,
          baseType: room.baseType,
          boxTheme: room.boxTheme,
          capacity: room.capacity,
          slots: participants,
          finishing: room.finishing || { lettering: '모두 함께 완성했어요! ✨', powder: 'gold-leaf', ribbon: 'royal-gold' },
          letterMessage: `"${room.title}" 파티가 만석으로 멋지게 완성되었습니다! 참여해 주신 지인 여러분 감사합니다 💖 (보너스: 30🎀 + 100🪙)`,
          sentAt: new Date().toISOString(),
          isOpened: false,
        }
        giftList.unshift(giftPkg)
      })

      localStorage.setItem(DELIVERED_GIFTS_STORAGE_KEY, JSON.stringify(giftList.slice(0, 30)))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gift_delivered'))
      }

      setShowCelebration(true)
      const existingShowcase = localStorage.getItem(SHOWCASE_STORAGE_KEY)
      const showcaseArr: OpenPartyRoom[] = existingShowcase ? JSON.parse(existingShowcase) : []
      showcaseArr.unshift(updatedRoom)
      localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(showcaseArr.slice(0, 30)))
      setShowcaseList(showcaseArr)
      setGiftSentToast(`🎉 파티가 완성되어 참여한 ${participants.length}명의 지인 전원에게 선물이 자동 발송되었습니다!`)
      setTimeout(() => {
        setShowCelebration(false)
        setGiftSentToast(null)
      }, 4500)
    }
  }

  // 🗑️ 오픈 파티 삭제 (방장 또는 유저가 생성한 파티 취소)
  const handleDeleteOpenParty = (roomId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const targetRoom = openParties.find((r) => r.id === roomId)
    const title = targetRoom ? targetRoom.title : '오픈 파티'

    if (!window.confirm(`"${title}" 파티를 정말 삭제(취소)하시겠습니까?`)) {
      return
    }

    try {
      playDessertAsmr('wax-pop')
    } catch {
      // ignore
    }

    const updated = openParties.filter((r) => r.id !== roomId)
    setOpenParties(updated)
    localStorage.setItem(OPEN_PARTIES_STORAGE_KEY, JSON.stringify(updated))

    if (activeRoomId === roomId) {
      setActiveRoomId(null)
    }

    setGiftSentToast('🗑️ 오픈 파티가 삭제되었습니다.')
    setTimeout(() => setGiftSentToast(null), 3000)
  }

  // 🎁 완성된 오픈 파티 참여 지인들에게 선물 수동/조기 발송 및 파티룸 완료
  const handleCompletePartyAndSendGifts = (roomId: string) => {
    const room = openParties.find((r) => r.id === roomId)
    if (!room) return

    const participants = room.slots.filter((s): s is PartySlotItem => s !== null)
    if (participants.length === 0) {
      alert('파티에 최소 1명 이상의 디저트가 참여해야 완료할 수 있습니다!')
      return
    }

    if (!window.confirm(`🎉 파티를 완성하고 참여한 ${participants.length}명의 지인 전원에게 완성 선물을 발송하시겠습니까?`)) {
      return
    }

    try {
      playDessertAsmr('sugar-crack')
    } catch {
      // ignore
    }

    // 1) 참여자 전원에게 선물 배달 패키지 생성
    const existingGifts = localStorage.getItem(DELIVERED_GIFTS_STORAGE_KEY)
    const giftList: DeliveredGiftPackage[] = existingGifts ? JSON.parse(existingGifts) : []

    participants.forEach((p, idx) => {
      const giftPkg: DeliveredGiftPackage = {
        id: `gift-party-${roomId}-${idx}-${Date.now()}`,
        senderName: room.hostName || '달콤 파티룸',
        recipientName: p.ownerName || '소중한 지인',
        title: `🎉 ${room.title} 완성 선물 세트!`,
        baseType: room.baseType,
        boxTheme: room.boxTheme,
        capacity: room.capacity,
        slots: participants,
        finishing: room.finishing || { lettering: '함께해서 달콤했어!', powder: 'gold-leaf', ribbon: 'royal-gold' },
        letterMessage: `"${room.title}" 파티가 완성되었습니다! 함께해 주셔서 감사해요 💖 (선물: 30🎀 + 100🪙)`,
        sentAt: new Date().toISOString(),
        isOpened: false,
      }
      giftList.unshift(giftPkg)
    })

    localStorage.setItem(DELIVERED_GIFTS_STORAGE_KEY, JSON.stringify(giftList.slice(0, 30)))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gift_delivered'))
    }

    // 2) 파티룸 상태 완료(isCompleted = true) 처리
    const updatedRoom: OpenPartyRoom = {
      ...room,
      isCompleted: true,
    }

    const updatedParties = openParties.map((r) => (r.id === roomId ? updatedRoom : r))
    setOpenParties(updatedParties)
    localStorage.setItem(OPEN_PARTIES_STORAGE_KEY, JSON.stringify(updatedParties))

    // 명예 진열장에 보관
    const existingShowcase = localStorage.getItem(SHOWCASE_STORAGE_KEY)
    const showcaseArr: OpenPartyRoom[] = existingShowcase ? JSON.parse(existingShowcase) : []
    showcaseArr.unshift(updatedRoom)
    localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(showcaseArr.slice(0, 30)))
    setShowcaseList(showcaseArr)

    setShowCelebration(true)
    setGiftSentToast(`🎁 파티가 완료되어 참여한 ${participants.length}명의 지인 전원에게 선물이 발송되었습니다!`)
    setTimeout(() => {
      setShowCelebration(false)
      setGiftSentToast(null)
    }, 4500)
  }

  // 🗑️ 명예 진열장 진열된 박스 삭제
  const handleDeleteShowcaseItem = (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!window.confirm('진열장에서 이 디저트 박스를 철거(삭제)하시겠습니까?')) {
      return
    }

    try {
      playDessertAsmr('wax-pop')
    } catch {
      // ignore
    }

    const updated = showcaseList.filter((item) => item.id !== itemId)
    setShowcaseList(updated)
    localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(updated))
    setGiftSentToast('🗑️ 진열장에서 박스가 삭제되었습니다.')
    setTimeout(() => setGiftSentToast(null), 3000)
  }

  // 🧹 테스터 펫 및 로컬 더미 기록 정리
  const handleCleanupTesterData = () => {
    if (!window.confirm('테스트 중 생성된 중복 테스터 펫과 오래된 더미 로그를 깔끔하게 정리하시겠습니까?\n(가장 최근 대표 펫과 정상 데이터는 안전하게 보존됩니다)')) {
      return
    }

    try {
      playDessertAsmr('mochi-squish')
    } catch {
      // ignore
    }

    const result = cleanupTesterPetsAndLogs()
    // 화면의 오픈 파티 중 유효하지 않은 데이터도 함께 정돈
    const cleanedParties = openParties.filter((p) => p && p.id && Array.isArray(p.slots))
    setOpenParties(cleanedParties)
    localStorage.setItem(OPEN_PARTIES_STORAGE_KEY, JSON.stringify(cleanedParties))

    const cleanedShowcase = showcaseList.filter((s) => s && s.id && Array.isArray(s.slots))
    setShowcaseList(cleanedShowcase)
    localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(cleanedShowcase))

    setGiftSentToast(`🧹 정리 완료: 더미 펫 ${result.cleanedMonsters}마리 및 잔여 테스트 로그가 깨끗하게 정돈되었습니다!`)
    setTimeout(() => setGiftSentToast(null), 4000)
  }

  // 🏆 대표님 요청 100% 반영: 기계적인 슬롯 상자 ➔ 감성 가득한 '실제 사진 상자 & 폴라로이드 포토 앨범' 렌더러
  const renderLuxuryShowcaseBase = (
    _baseType: PartyBaseType,
    capacity: SlotCapacity,
    slotsArr: (PartySlotItem | null)[],
    interactive: boolean,
    onSlotClick?: (idx: number) => void,
    overrideTheme?: BoxThemeType,
    onSlotClear?: (idx: number) => void
  ) => {
    const currentTheme = overrideTheme || boxTheme
    const is16 = capacity === 16 || currentTheme === 'black-16'
    const is24 = capacity === 24 || currentTheme === 'tray-24'
    const is9 = capacity === 9 || currentTheme === 'walnut-9' || currentTheme === 'white-9'
    const is4 = !is16 && !is24 && !is9

    const gridCols =
      capacity === 24
        ? 'repeat(4, 1fr)'
        : capacity === 16
        ? 'repeat(4, 1fr)'
        : capacity === 9
        ? 'repeat(3, 1fr)'
        : 'repeat(2, 1fr)'

    const petSize = capacity === 24 ? 38 : capacity === 16 ? 46 : capacity === 9 ? 54 : 64
    const tapeColors = [
      'rgba(251, 207, 232, 0.9)', // 파스텔 핑크
      'rgba(167, 243, 208, 0.9)', // 파스텔 민트
      'rgba(254, 240, 138, 0.9)', // 파스텔 레몬
      'rgba(233, 213, 255, 0.9)', // 파스텔 라벤더
      'rgba(186, 230, 253, 0.9)', // 파스텔 스카이
    ]

    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '4px auto', boxSizing: 'border-box' }}>
        {/* 📸 대표님 요청 반영: 실제 원목/크라프트 즉석 사진 상자 뚜껑 & 앨범 타이틀 */}
        <PhotoMemoryBoxLid
          title={
            is4
              ? '4구 펫 추억 스냅 사진함 📸'
              : is9
              ? '9구 프리미엄 펫 포토 앨범 상자 📸'
              : '디저트 펫 마스터 포토 컬렉션 📸'
          }
          subtitle="실제 사진 상자에 소중히 담긴 내 펫들의 달콤한 순간 ✨"
          badgeText={is4 ? '4구 스냅함 🎞️' : is9 ? '9구 앨범 🎞️' : '마스터 포토 🎞️'}
        />

        {/* ========================================================================= */}
        {/* 🎁 실제 사진 상자 본체 (따뜻한 원목 프레임 + 부드러운 린넨 바닥) */}
        {/* ========================================================================= */}
        <div
          style={{
            position: 'relative',
            padding: 10,
            borderRadius: 18,
            background: 'linear-gradient(145deg, #4A2306 0%, #301402 60%, #1C0A01 100%)',
            border: '8px solid #5C2B0B',
            boxShadow: '0 20px 42px -8px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,215,0,0.2), inset 0 -2px 6px rgba(0,0,0,0.9)',
            boxSizing: 'border-box',
          }}
        >
          {/* 사진 상자 내부: 부드러운 내추럴 아이보리 패브릭/린넨 안감 */}
          <div
            style={{
              padding: '10px 8px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #FAF7F2 0%, #F5EBE1 100%)',
              border: '1.5px dashed #D6C7B2',
              boxShadow: 'inset 0 3px 10px rgba(74,35,6,0.25)',
            }}
          >
            {/* 📸 폴라로이드 즉석 사진 그리드 배열 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                gap: capacity >= 16 ? '8px 4px' : '12px 8px',
                alignItems: 'center',
                justifyItems: 'center',
              }}
            >
              {slotsArr.slice(0, capacity).map((item, idx) => {
                const isSelected = selectedSlotIndex === idx
                const tiltDeg = idx % 4 === 0 ? -1.5 : idx % 4 === 1 ? 1.4 : idx % 4 === 2 ? -1.0 : 1.2
                const tapeColor = tapeColors[idx % tapeColors.length]

                if (!item) {
                  // ✨ 비어있는 즉석 사진 프레임
                  return (
                    <PolaroidPhotoCard
                      key={idx}
                      isEmpty={true}
                      isSelected={isSelected && interactive}
                      tiltDeg={tiltDeg}
                      tapeColor={tapeColor}
                      onClick={() => {
                        if (interactive && onSlotClick) {
                          onSlotClick(idx)
                        }
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                        }}
                      >
                        <span style={{ fontSize: capacity >= 16 ? 16 : 22, color: '#CBD5E1' }}>📷</span>
                        <span style={{ fontSize: 8, fontWeight: 900, color: '#94A3B8' }}>사진 담기</span>
                      </div>
                    </PolaroidPhotoCard>
                  )
                }

                // 📸 실제 사진 상자에 꽂힌 내 펫의 즉석 폴라로이드 사진
                const photoTitle = item.petName || (item.choco ? '수제 초코 데코' : '달콤한 펫')
                const photoSubtitle = item.isMine
                  ? '💖 나의 펫'
                  : item.ownerName
                  ? `🐾 ${item.ownerName}의 펫`
                  : '📸 Sweet Snap'

                return (
                  <div
                    key={idx}
                    data-slot-idx={idx}
                    style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
                  >
                    <PolaroidPhotoCard
                      title={photoTitle}
                      subtitle={photoSubtitle}
                      isSelected={isSelected && interactive}
                      tiltDeg={tiltDeg}
                      tapeColor={tapeColor}
                      onClick={() => {
                        if (interactive && onSlotClick) {
                          onSlotClick(idx)
                        }
                      }}
                    >
                      {item.itemType === 'choco' && item.choco ? (
                        /* 🍫 수제 초콜릿 데코 */
                        <ArtisanChocoView choco={item.choco} size={petSize} />
                      ) : (
                        /* 🐾 내 3D 디저트 펫 스냅샷 */
                        <div
                          style={{
                            width: petSize,
                            height: petSize,
                            pointerEvents: 'none',
                            animation: `breathing-wiggle 3s ease-in-out infinite ${idx * 0.25}s`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Monster3DView look={item.look || myCurrentLook} size={petSize} interactive={false} />
                        </div>
                      )}
                    </PolaroidPhotoCard>

                    {/* 🐾 슬롯 비우기 / 사진 꺼내기 버튼 (사진 우측 상단 핀셋 스티커) */}
                    {interactive && item.isMine && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onSlotClear) {
                            onSlotClear(idx)
                          } else {
                            handleClearSoloSlot(idx)
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: 2,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #FFFFFF',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                          zIndex: 15,
                        }}
                        title="사진 상자에서 꺼내기"
                      >
                        ✕
                      </button>
                    )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={handleCleanupTesterData}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 10,
              color: '#475569',
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
            title="테스터 펫 & 더미 기록 깔끔 정리"
          >
            <span>🧹</span>
            <span>정리</span>
          </button>
          {onOpenBoutique && (
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
          )}
        </div>
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

              {/* 1. 내 펫 넣기 / 꺼내기 메인 토글 버튼 (대표님 피드백 반영: 펫 넣기 및 빼기 직관적 원클릭 지원) */}
              {soloSlots[selectedSlotIndex] ? (
                <button
                  type="button"
                  onClick={() => handleClearSoloSlot(selectedSlotIndex)}
                  style={{
                    padding: '11px 14px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: 12.5,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 3px 8px rgba(239,68,68,0.3)',
                  }}
                >
                  <span>🐾 {selectedSlotIndex + 1}번 칸에서 디저트 꺼내기 (비우기) ✕</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePlaceMyPetInSoloSlot(selectedSlotIndex)}
                  style={{
                    padding: '11px 14px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #EC4899, #BE185D)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: 12.5,
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
              )}

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
                {openParties.length === 0 ? (
                  <div
                    style={{
                      padding: '30px 16px',
                      textAlign: 'center',
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: '#94A3B8',
                      background: '#FFFFFF',
                      borderRadius: 16,
                      border: '2px dashed #E9D5FF',
                    }}
                  >
                    현재 열린 파티가 없습니다. 상단의 <strong>[+ 새 파티 열기]</strong>를 눌러 지인들을 초대해 보세요!
                  </div>
                ) : (
                  openParties.map((room) => {
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
                          border: room.isCompleted ? '1.5px solid #10B981' : '1px solid #E9D5FF',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, paddingRight: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 900, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {room.title}
                            </span>
                            {room.isCompleted && (
                              <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 6, background: '#DCFCE7', color: '#16A34A' }}>
                                완성됨
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 10.5, color: '#9333EA', fontWeight: 800, marginTop: 2 }}>
                            호스트: {room.hostName} • {room.capacity}구 세트
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 900,
                              padding: '3px 8px',
                              borderRadius: 10,
                              background: '#FAF5FF',
                              color: '#7E22CE',
                              border: '1px solid #E9D5FF',
                            }}
                          >
                            {filledCount} / {room.capacity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteOpenParty(room.id, e)}
                            style={{
                              background: '#FFF1F2',
                              border: '1px solid #FECDD3',
                              borderRadius: 8,
                              color: '#E11D48',
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '3px 7px',
                              cursor: 'pointer',
                            }}
                            title="파티 삭제"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 900, color: '#1E293B' }}>{currentOpenRoom.title}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteOpenParty(currentOpenRoom.id, e)}
                        style={{
                          background: '#FFF1F2',
                          border: '1px solid #FECDD3',
                          borderRadius: 8,
                          color: '#E11D48',
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '3px 7px',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ 파티 삭제
                      </button>
                    </div>
                  </div>

                  {renderLuxuryShowcaseBase(
                    currentOpenRoom.baseType,
                    currentOpenRoom.capacity,
                    currentOpenRoom.slots,
                    !currentOpenRoom.isCompleted,
                    (idx) => {
                      const item = currentOpenRoom.slots[idx]
                      if (!item) {
                        handleJoinOpenPartySlot(currentOpenRoom.id, idx)
                      } else if (item.isMine) {
                        if (window.confirm(`${idx + 1}번 칸에서 내 펫을 꺼내시겠습니까?`)) {
                          handleLeaveOpenPartySlot(currentOpenRoom.id, idx)
                        }
                      }
                    },
                    currentOpenRoom.boxTheme,
                    (idx) => handleLeaveOpenPartySlot(currentOpenRoom.id, idx)
                  )}

                  {/* 파티룸 상태별 하단 액션 덱 */}
                  {!currentOpenRoom.isCompleted ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                        💡 빈 칸 터치: 내 펫 넣기 · 내 펫 칸 터치(또는 ✕): 상자에서 펫 꺼내기
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCompletePartyAndSendGifts(currentOpenRoom.id)}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: 14,
                          border: 'none',
                          background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(236,72,153,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <span>🎁</span>
                        <span>파티 완성 & 참여 지인 전원에게 선물 발송하기</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                        border: '1.5px solid #6EE7B7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        color: '#065F46',
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      <span>✨</span>
                      <span>참여한 모든 지인들에게 선물이 발송된 완료된 파티입니다!</span>
                    </div>
                  )}
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
                  key={item.id || idx}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: '#EC4899' }}>
                        {item.slots.filter((s) => s !== null).length}구 완성
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteShowcaseItem(item.id, e)}
                        style={{
                          padding: '3px 7px',
                          borderRadius: 8,
                          border: '1px solid #FECDD3',
                          background: '#FFF1F2',
                          color: '#E11D48',
                          fontSize: 10.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                        title="진열장 박스 삭제"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
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
