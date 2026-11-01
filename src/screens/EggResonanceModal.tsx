// 🥚 탐험 알 온기 숙성(에그 블렌딩) 모달
// - 방안 1: 탐험에서 얻은 알과 내 펫의 온기 숙성을 통해 등급 승급 & 스페셜 비기 스킬 계승

import { useState } from 'react'
import type { MonsterRow } from '../lib/api'
import {
  getOwnedExploreEggs,
  resonateEggWithPet,
  type ExploreEggDef,
  type ResonanceResult,
} from '../lib/eggResonance'
import { playDessertAsmr } from '../lib/sound'

interface Props {
  monster: MonsterRow
  onClose: () => void
  onSuccess?: () => void
}

export default function EggResonanceModal({ monster, onClose, onSuccess }: Props) {
  const [eggs, setEggs] = useState<ExploreEggDef[]>(() => getOwnedExploreEggs())
  const [selectedEgg, setSelectedEgg] = useState<ExploreEggDef | null>(() => eggs[0] ?? null)
  const [isBlending, setIsBlending] = useState<boolean>(false)
  const [result, setResult] = useState<ResonanceResult | null>(null)

  const currentRarity = (monster as any).rarity ?? 'common'

  const handleStartBlending = () => {
    if (!selectedEgg || isBlending) return
    setIsBlending(true)
    playDessertAsmr('smore-sizzle')

    setTimeout(() => {
      const res = resonateEggWithPet(monster, selectedEgg)
      setIsBlending(false)
      setResult(res)
      playDessertAsmr('sugar-crack', 2)
      setEggs(getOwnedExploreEggs())
      if (onSuccess) onSuccess()
    }, 1600)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(15, 8, 26, 0.82)',
        backdropFilter: 'blur(7px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'linear-gradient(180deg, #FFFDF8 0%, #FFF8EE 100%)',
          borderRadius: 24,
          border: '2.5px solid #F59E0B',
          boxShadow: '0 20px 48px rgba(0,0,0,0.4), 0 0 24px rgba(245,158,11,0.25)',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        {/* 상단 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #FDE68A', paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20 }}>🥚</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#451A03' }}>에그 온기 숙성 (블렌딩)</div>
              <div style={{ fontSize: 10, color: '#B45309', fontWeight: 700 }}>알의 온기로 등급 승급 & 비기 스킬 계승</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '50%',
              width: 28,
              height: 28,
              fontSize: 14,
              fontWeight: 900,
              color: '#78350F',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* 결과 성공 팝업 */}
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 48, animation: 'bounce 0.8s infinite alternate' }}>
              {result.learnedSkill.icon}
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#78350F' }}>
              {result.promoted ? '🌟 전설의 등급 승급 완료!' : '✨ 비기 스킬 각인 성공!'}
            </div>
            <div style={{ fontSize: 11.5, color: '#B45309', fontWeight: 700, lineHeight: 1.5, textAlign: 'center', padding: '0 8px' }}>
              {result.message}
            </div>

            {/* 계승된 스킬 카드 */}
            <div
              style={{
                width: '100%',
                background: '#FFFFFF',
                borderRadius: 16,
                border: '2px solid #F59E0B',
                padding: '12px',
                textAlign: 'left',
                boxShadow: '0 4px 12px rgba(245,158,11,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#1F2937' }}>
                  {result.learnedSkill.icon} {result.learnedSkill.name}
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: result.learnedSkill.rarity === 'legendary' ? '#FEF3C7' : '#FCE7F3',
                    color: result.learnedSkill.rarity === 'legendary' ? '#B45309' : '#BE185D',
                    border: '1px solid currentColor',
                  }}
                >
                  {result.learnedSkill.rarity.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.4 }}>
                {result.learnedSkill.desc}
              </div>
              <div style={{ fontSize: 10, color: '#E11D48', fontWeight: 800, marginTop: 4 }}>
                ⚔️ 전투 효과: {result.learnedSkill.battleEffect}
              </div>
            </div>

            <button
              onClick={() => {
                setResult(null)
                onClose()
              }}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
              }}
            >
              확인 & 마이홈으로
            </button>
          </div>
        ) : isBlending ? (
          /* 숙성 애니메이션 중 */
          <div style={{ padding: '36px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 52, animation: 'spin 1.6s linear infinite' }}>
              🔥
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#78350F' }}>
              따뜻한 달콤 오븐에서 온기 블렌딩 중...
            </div>
            <div style={{ fontSize: 11, color: '#B45309', fontWeight: 700 }}>
              알의 영혼과 비기가 펫에게 사르르 스며들고 있어요 ✨
            </div>
          </div>
        ) : (
          /* 알 선택 및 숙성 화면 */
          <>
            {/* 보유 탐험 에그 선택 탭/그리드 */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#78350F', marginBottom: 6 }}>
                📦 보유한 신비한 탐험 에그 ({eggs.length}개)
              </div>
              {eggs.length === 0 ? (
                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 14, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                  보유 중인 탐험 알이 없습니다.<br />탐험을 보내어 신비한 알을 찾아오세요!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {eggs.map((egg) => {
                    const isSel = selectedEgg?.id === egg.id
                    return (
                      <button
                        key={egg.id}
                        onClick={() => {
                          setSelectedEgg(egg)
                          playDessertAsmr('sugar-crack')
                        }}
                        style={{
                          padding: '8px',
                          borderRadius: 12,
                          border: isSel ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                          background: isSel ? '#FEF3C7' : '#FFFFFF',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 18 }}>{egg.icon}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 900, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {egg.name}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 800,
                            color: egg.rarity === 'legendary' ? '#B45309' : '#BE185D',
                          }}
                        >
                          [{egg.rarity.toUpperCase()}]
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 선택된 알의 정보 및 승급 예측 */}
            {selectedEgg && (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1.5px solid #FDE68A',
                  padding: '12px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#92400E' }}>
                    🌟 예상 등급 변화
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 900 }}>
                    <span style={{ color: '#6B7280' }}>{currentRarity.toUpperCase()}</span>
                    <span>➔</span>
                    <span style={{ color: '#D97706', fontSize: 12 }}>
                      {selectedEgg.rarity.toUpperCase()} ✨
                    </span>
                  </div>
                </div>

                {/* 비기 스킬 정보 */}
                <div style={{ background: '#FFFBEB', padding: '8px 10px', borderRadius: 10, border: '1px solid #FEF3C7', marginTop: 2 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 900, color: '#B45309', marginBottom: 2 }}>
                    전수 비기: {selectedEgg.secretSkill.icon} {selectedEgg.secretSkill.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#4B5563', lineHeight: 1.4 }}>
                    {selectedEgg.secretSkill.desc}
                  </div>
                </div>
              </div>
            )}

            {/* 하단 숙성 시작 버튼 */}
            <button
              disabled={!selectedEgg || eggs.length === 0}
              onClick={handleStartBlending}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 16,
                border: 'none',
                background: selectedEgg
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : '#D1D5DB',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 13.5,
                cursor: selectedEgg ? 'pointer' : 'not-allowed',
                boxShadow: selectedEgg ? '0 4px 14px rgba(217,119,6,0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>🔥</span>
              <span>달콤 오븐 온기 숙성 시작</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
