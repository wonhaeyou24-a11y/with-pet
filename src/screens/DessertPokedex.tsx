// M4 화면 3: 📖 디저트 진화 & 시크릿 레시피 도감 (Dessert Pokedex)
// 8대 메인 종족 × 3단계 × 4대 갈래 = 96종 진화 계통도와 발견 현황 및 ASMR 감상

import { useMemo, useState } from 'react'
import { EVO_BRANCHES, SPECIES_EVOLUTIONS, type EvoBranchId } from '../config/evolution'
import { SPECIES_INFO } from '../config/species'
import { getDiscoveredDexEntries } from '../lib/evolutionEngine'
import { playDessertAsmr } from '../lib/sound'
import { BackIcon } from '../ui/Icons'

interface Props {
  onBack: () => void
}

const SPECIES_LIST = [
  'mochi',
  'dubai-cookie',
  'wax-ball',
  'tanghulu',
  'pudding',
  'jelly',
  'choco',
  'smore',
]

export default function DessertPokedexScreen({ onBack }: Props) {
  const [selectedSpecies, setSelectedSpecies] = useState<string>('mochi')
  const [selectedTab, setSelectedTab] = useState<'evolution' | 'recipes'>('evolution')
  const discoveredSet = useMemo(() => getDiscoveredDexEntries(), [])

  // 총 96종(8대 종족 × (1단계 1종 + 2단계 4종 + 3단계 4종 = 9종) + 기본 베이비 등) 진화 도감
  const totalEntries = SPECIES_LIST.length * 9 // 72종
  const discoveredCount = useMemo(() => {
    let count = 0
    discoveredSet.forEach((key) => {
      if (key.includes('stage')) count++
    })
    // 기본으로 시작한 펫은 최소 1종 이상 해금
    return Math.max(count, 1)
  }, [discoveredSet])

  const completionRate = Math.min(100, Math.round((discoveredCount / totalEntries) * 100))

  const currentEvoData = SPECIES_EVOLUTIONS[selectedSpecies]
  const currentSpeciesMeta = SPECIES_INFO[selectedSpecies]

  return (
    <main
      className="mobile-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'linear-gradient(180deg, #1A1325 0%, #251B33 50%, #150E22 100%)',
        color: '#FFF8F0',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 1. 상단 네비게이션 헤더 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 12px',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          <BackIcon size={18} />
          돌아가기
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#FFE082' }}>
          📖 디저트 마스터 도감
        </h2>
        <div style={{ width: 68 }} />
      </header>

      {/* 2. 도감 수집 통계 배너 */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#CE93D8', fontWeight: 700 }}>
            ✨ 전체 디저트 수집 진척도
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#FFD54F' }}>
            {discoveredCount} / {totalEntries}종{' '}
            <span style={{ fontSize: 13, color: '#81C784' }}>({completionRate}%)</span>
          </div>
        </div>

        {/* 탭 전환 (진화 계통도 / 비밀 레시피) */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setSelectedTab('evolution')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: selectedTab === 'evolution' ? '#FF4081' : 'rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            진화 계통도
          </button>
          <button
            onClick={() => setSelectedTab('recipes')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              background: selectedTab === 'recipes' ? '#FF4081' : 'rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            비밀 레시피
          </button>
        </div>
      </div>

      {selectedTab === 'evolution' ? (
        <>
          {/* 3. 8대 종족 가로 칩 슬라이더 */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '10px 16px',
              overflowX: 'auto',
              flexShrink: 0,
              scrollbarWidth: 'none',
            }}
          >
            {SPECIES_LIST.map((spId) => {
              const info = SPECIES_INFO[spId]
              const isSelected = selectedSpecies === spId
              return (
                <button
                  key={spId}
                  onClick={() => {
                    setSelectedSpecies(spId)
                    playDessertAsmr('syrup-drizzle')
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: isSelected ? '2px solid #FFD54F' : '1px solid rgba(255,255,255,0.15)',
                    background: isSelected ? 'rgba(255, 213, 79, 0.2)' : 'rgba(0,0,0,0.35)',
                    color: isSelected ? '#FFE082' : '#E0E0E0',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {info?.name ?? spId}
                </button>
              )
            })}
          </div>

          {/* 4. 선택된 종족의 3단계 진화 계통도 상세 뷰 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* 1단계 베이비 디저트 */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 16,
                padding: '12px 14px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div style={{ fontSize: 11, color: '#80DEEA', fontWeight: 800 }}>
                🌱 1단계 베이비 폼 (기본 형태)
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 6,
                }}
              >
                <div>
                  <strong style={{ fontSize: 16, color: '#FFFFFF' }}>
                    {currentEvoData?.stageNames[1] ?? currentSpeciesMeta?.name}
                  </strong>
                  <div style={{ fontSize: 12, color: '#B0BEC5' }}>
                    칭호: {currentEvoData?.titles[1] ?? '햇병아리 디저트'}
                  </div>
                </div>
                <span
                  style={{
                    background: '#4CAF50',
                    color: '#FFFFFF',
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  발견 완료
                </span>
              </div>
            </div>

            {/* 2단계 파티세리 디저트 (4대 갈래) */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 16,
                padding: '12px 14px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div style={{ fontSize: 11, color: '#FFB74D', fontWeight: 800 }}>
                🍰 2단계 파티세리 폼 (Lv.8 해금 / 4대 분기)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                {(['sweet-melty', 'crispy-crunch', 'royal-chef', 'gourmet-rainbow'] as EvoBranchId[]).map(
                  (bId) => {
                    const b = EVO_BRANCHES[bId]
                    const name = currentEvoData?.stageNames[2]?.[bId] ?? `${b.name}`
                    const isUnlocked = discoveredSet.has(`${selectedSpecies}_stage2_${bId}`)
                    return (
                      <div
                        key={bId}
                        style={{
                          background: isUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)',
                          border: `1px solid ${isUnlocked ? b.color : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 12,
                          padding: '8px 10px',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, color: b.color }}>
                          {b.icon} {b.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            marginTop: 2,
                            color: isUnlocked ? '#FFFFFF' : '#888888',
                          }}
                        >
                          {isUnlocked ? name : '❓ ??? 미발견'}
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            </div>

            {/* 3단계 로얄 마스터 디저트 (4대 갈래) */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 16,
                padding: '12px 14px',
                border: '1px solid rgba(255, 215, 0, 0.25)',
              }}
            >
              <div style={{ fontSize: 11, color: '#FFD700', fontWeight: 800 }}>
                👑 3단계 로얄 마스터 폼 (Lv.15 해금 / 최종 궁극)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                {(['sweet-melty', 'crispy-crunch', 'royal-chef', 'gourmet-rainbow'] as EvoBranchId[]).map(
                  (bId) => {
                    const b = EVO_BRANCHES[bId]
                    const name = currentEvoData?.stageNames[3]?.[bId] ?? `${b.name}`
                    const isUnlocked = discoveredSet.has(`${selectedSpecies}_stage3_${bId}`)
                    return (
                      <div
                        key={bId}
                        style={{
                          background: isUnlocked ? 'rgba(255,215,0,0.1)' : 'rgba(0,0,0,0.3)',
                          border: `1px solid ${isUnlocked ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 12,
                          padding: '8px 10px',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, color: b.color }}>
                          👑 {b.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            marginTop: 2,
                            color: isUnlocked ? '#FFE082' : '#888888',
                          }}
                        >
                          {isUnlocked ? name : '🔒 ??? 미각성'}
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 비밀 레시피 북 탭 */
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: '#CE93D8' }}>
            📜 파티세리 비밀 레시피 컬렉션
          </div>
          {[
            {
              title: '황금빛 바사삭 카다이프 반죽법',
              branch: '크런치 바삭계',
              icon: '🌾',
              desc: '피스타치오 크림과 구운 카다이프면을 180도 오븐에 튀기듯 구워내어 극한의 크런치 식감을 완성하는 비법입니다.',
              source: '디저트 타워 5층 돌파 보상',
            },
            {
              title: '영롱한 무지개 글레이즈 코팅법',
              branch: '고메 레인보우계',
              icon: '🌈',
              desc: '7가지 과즙 시럽을 끓는점 직전에 서서히 떨어뜨려 유리알처럼 맑고 반짝이는 거울 광택을 빚어냅니다.',
              source: '시크릿 레시피 훈련 마스터',
            },
            {
              title: '천상계 마시멜로 퐁듀 숙성법',
              branch: '달콤 멜팅계',
              icon: '🍫',
              desc: '부드러운 마시멜로와 따끈한 다크초콜릿을 36도 체온에서 정성스레 녹여내는 전설의 힐링 레시피입니다.',
              source: '파티세리 훈련 10회 완료',
            },
          ].map((recipe, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.07)',
                borderRadius: 14,
                padding: '12px 14px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>{recipe.icon}</span>
                <strong style={{ fontSize: 14, color: '#FFE082' }}>{recipe.title}</strong>
              </div>
              <p style={{ margin: '6px 0', fontSize: 12, color: '#EDE7F6', lineHeight: 1.5 }}>
                {recipe.desc}
              </p>
              <div style={{ fontSize: 11, color: '#81C784', fontWeight: 700 }}>
                획득처: {recipe.source}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
