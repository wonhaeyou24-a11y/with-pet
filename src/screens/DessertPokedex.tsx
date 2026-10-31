// M4 화면 3: 🖼️ 디저트 몬스터 도감 액자 갤러리 (Dessert Pokedex Frames)
// 직관적인 카드 액자(썸네일 그리드) 형태로 내가 보유하고 발견한 디저트를 한눈에 볼 수 있으며,
// 액자를 터치하면 3D 프리뷰와 식감 ASMR 사운드 및 상세 진화 정보를 감상합니다.

import { useEffect, useMemo, useState } from 'react'
import { EVO_BRANCHES, SPECIES_EVOLUTIONS, type EvoBranchId } from '../config/evolution'
import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { fetchDiscoveredDexEntries } from '../lib/evolutionEngine'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import type { MonsterLook } from '../monsters/types'
import { BackIcon, ElementIcon } from '../ui/Icons'

interface Props {
  onBack: () => void
  currentMonsterId?: string
  onSwitchPet?: (pet: { species: string; name: string; element: 'wind' | 'earth' | 'fire' | 'water' | 'grass' | 'electric' }) => void
}

interface DexFrameItem {
  id: string
  species: string
  stage: 1 | 2 | 3
  branch?: EvoBranchId
  name: string
  title: string
  element: 'wind' | 'earth' | 'fire' | 'water' | 'grass' | 'electric'
  desc: string
  isUnlocked: boolean
}

const SPECIES_ORDER = [
  'mochi',
  'dubai-cookie',
  'wax-ball',
  'tanghulu',
  'pudding',
  'jelly',
  'choco',
  'smore',
]

const SPECIES_DEFAULT_ELEMENT: Record<string, 'wind' | 'earth' | 'fire' | 'water' | 'grass' | 'electric'> = {
  mochi: 'wind',
  'dubai-cookie': 'earth',
  'wax-ball': 'water',
  tanghulu: 'fire',
  pudding: 'grass',
  jelly: 'electric',
  choco: 'earth',
  smore: 'fire',
}

// 진화 형태 및 종족별 고유 3D 눈매 매핑 (동그란 눈, 졸린 반달 눈, 날렵한 캣아이, 별빛 눈 차별화)
export function getBranchExpression(branch?: EvoBranchId, _stage?: number, species?: string): 'round' | 'sleepy' | 'sharp' {
  if (branch === 'crispy-crunch' || branch === 'royal-chef') return 'sharp'
  if (branch === 'sweet-melty') return 'sleepy'
  if (branch === 'gourmet-rainbow') return 'round'
  if (species === 'wax-ball' || species === 'pudding') return 'sleepy'
  if (species === 'tanghulu' || species === 'choco' || species === 'dubai-cookie') return 'sharp'
  return 'round'
}

export default function DessertPokedexScreen({ onBack, onSwitchPet }: Props) {
  // 🌟 전체 72종 쇼룸 모드 (기본 ON)
  const [showroomMode, setShowroomMode] = useState<boolean>(true)
  const [filterSpecies, setFilterSpecies] = useState<string>('all')
  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState<DexFrameItem | null>(null)
  const [switchToast, setSwitchToast] = useState<string | null>(null)
  const [discoveredSet, setDiscoveredSet] = useState<Set<string>>(() => new Set())
  const [dexError, setDexError] = useState(false)
  useEffect(() => {
    let alive = true
    fetchDiscoveredDexEntries()
      .then((s) => alive && setDiscoveredSet(s))
      .catch(() => alive && setDexError(true))
    return () => {
      alive = false
    }
  }, [])

  // 전체 도감 액자 리스트 생성 (종족별 1단계 1종 + 2단계 4종 + 3단계 4종)
  const allFrames = useMemo<DexFrameItem[]>(() => {
    const list: DexFrameItem[] = []

    SPECIES_ORDER.forEach((spId) => {
      const spInfo = SPECIES_INFO[spId]
      const evoData = SPECIES_EVOLUTIONS[spId]
      const elem = SPECIES_DEFAULT_ELEMENT[spId] ?? 'wind'

      // 1단계 베이비
      const baseKey = `${spId}_stage1_base`
      const isBaseUnlocked = showroomMode || discoveredSet.has(baseKey)
      list.push({
        id: `${spId}-1`,
        species: spId,
        stage: 1,
        name: evoData?.stageNames[1] ?? spInfo?.name ?? spId,
        title: evoData?.titles[1] ?? '말랑말랑 햇디저트',
        element: elem,
        desc: `${spInfo?.textureLabel ?? '달콤한 디저트'}의 가장 순수하고 부드러운 아기 형태입니다.`,
        isUnlocked: isBaseUnlocked,
      })

      // 2단계 파티세리 (4대 분기)
      const branches: EvoBranchId[] = ['sweet-melty', 'crispy-crunch', 'royal-chef', 'gourmet-rainbow']
      branches.forEach((bId) => {
        const bMeta = EVO_BRANCHES[bId]
        const key = `${spId}_stage2_${bId}`
        const isUnlocked = showroomMode || discoveredSet.has(key)
        list.push({
          id: `${spId}-2-${bId}`,
          species: spId,
          stage: 2,
          branch: bId,
          name: evoData?.stageNames[2]?.[bId] ?? `${spInfo?.name ?? spId} (${bMeta.name})`,
          title: evoData?.titles[2]?.[bId] ?? `${bMeta.name} 파티세리`,
          element: elem,
          desc: bMeta.desc,
          isUnlocked,
        })
      })

      // 3단계 로얄 마스터 (4대 분기)
      branches.forEach((bId) => {
        const bMeta = EVO_BRANCHES[bId]
        const key = `${spId}_stage3_${bId}`
        const isUnlocked = showroomMode || discoveredSet.has(key)
        list.push({
          id: `${spId}-3-${bId}`,
          species: spId,
          stage: 3,
          branch: bId,
          name: evoData?.stageNames[3]?.[bId] ?? `로얄 ${spInfo?.name ?? spId}`,
          title: evoData?.titles[3]?.[bId] ?? `전설의 ${bMeta.name}`,
          element: elem,
          desc: `궁극의 디저트 로얄 마스터 단계로 각성한 전설의 형태입니다.`,
          isUnlocked,
        })
      })
    })

    return list
  }, [discoveredSet, showroomMode])

  // 필터링 적용
  const filteredFrames = useMemo(() => {
    return allFrames.filter((item) => {
      if (filterSpecies !== 'all' && item.species !== filterSpecies) return false
      if (filterUnlockedOnly && !item.isUnlocked) return false
      return true
    })
  }, [allFrames, filterSpecies, filterUnlockedOnly])

  const totalCount = allFrames.length
  const unlockedCount = allFrames.filter((f) => f.isUnlocked).length
  const completionPct = Math.round((unlockedCount / totalCount) * 100)

  // 선택된 아이템의 3D 룩 생성
  const previewLook: MonsterLook | null = useMemo(() => {
    if (!selectedItem) return null
    return {
      species: selectedItem.species,
      palette: 0,
      bodyType: 'normal',
      scale: 1,
      ears: 0,
      tail: 0,
      top: 0,
      expression: getBranchExpression(selectedItem.branch, selectedItem.stage, selectedItem.species),
      patternSeed: 1,
      shiny: selectedItem.stage === 3,
      evoStage: selectedItem.stage,
      evoBranch: selectedItem.branch,
    }
  }, [selectedItem])

  return (
    <main
      className="mobile-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: '#FAF6F0',
        color: '#3B2F2F',
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
          padding: '10px 14px',
          background: '#FFFDF9',
          borderBottom: '1.5px solid #F0DFB8',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 800,
            color: '#5D4037',
          }}
        >
          <BackIcon size={18} />
          돌아가기
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#4E342E' }}>
          🖼️ 디저트 도감 액자 갤러리
        </h1>
        <button
          onClick={() => {
            const next = !showroomMode
            setShowroomMode(next)
            playDessertAsmr('mochi-squish')
            setSwitchToast(
              next
                ? '✨ 전체 72종 디저트 펫 쇼룸 모드 활성화! (전 종족 3D 외형과 눈매를 자유롭게 감상해 보세요)'
                : '🔒 내 도감 수집 모드로 전환되었습니다.',
            )
            setTimeout(() => setSwitchToast(null), 3500)
          }}
          style={{
            padding: '5px 10px',
            borderRadius: 999,
            border: showroomMode ? '1.5px solid #FF80AB' : '1.5px solid #D7CCC8',
            background: showroomMode ? 'linear-gradient(90deg, #FCE4EC 0%, #F8BBD0 100%)' : '#FFFDF9',
            color: showroomMode ? '#C2185B' : '#5D4037',
            fontSize: 11,
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          }}
          title="전체 72종 펫 쇼룸 보기 토글"
        >
          <span>👁️</span>
          <span>{showroomMode ? '72종 쇼룸 ON' : '72종 쇼룸'}</span>
        </button>
      </header>

      {/* 2. 도감 수집률 통계 배너 */}
      <div
        style={{
          padding: '8px 14px',
          background: '#FFF8F2',
          borderBottom: '1px solid #F0DFB8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <span style={{ fontSize: 11, color: '#8D6E63', fontWeight: 800 }}>✨ 수집 현황: </span>
          <strong style={{ fontSize: 14, color: '#FF7A59' }}>
            {unlockedCount} / {totalCount}종
          </strong>
          <span style={{ fontSize: 11, color: '#4CAF50', marginLeft: 4, fontWeight: 800 }}>
            ({completionPct}%)
          </span>
          {dexError && <span style={{ fontSize: 10, color: '#C62828', marginLeft: 6, fontWeight: 800 }}>기록을 못 불러왔어요</span>}
        </div>

        <button
          onClick={() => setFilterUnlockedOnly((v) => !v)}
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            border: filterUnlockedOnly ? '1.5px solid #FF7A59' : '1px solid #D7CCC8',
            background: filterUnlockedOnly ? '#FFF2EC' : '#FFFFFF',
            color: filterUnlockedOnly ? '#D84315' : '#6D4C41',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {filterUnlockedOnly ? '✓ 보유/발견만' : '전체 보기'}
        </button>
      </div>

      {/* 3. 종족 가로 칩 필터 */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 14px',
          overflowX: 'auto',
          flexShrink: 0,
          background: '#FFFDF9',
          borderBottom: '1px solid #F0DFB8',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => setFilterSpecies('all')}
          style={{
            padding: '5px 12px',
            borderRadius: 999,
            border: filterSpecies === 'all' ? '2px solid #FF7A59' : '1px solid #E0D3C5',
            background: filterSpecies === 'all' ? '#FFF2EC' : '#FFFFFF',
            color: filterSpecies === 'all' ? '#D84315' : '#5D4037',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          전체
        </button>
        {SPECIES_ORDER.map((spId) => {
          const info = SPECIES_INFO[spId]
          const isSel = filterSpecies === spId
          return (
            <button
              key={spId}
              onClick={() => setFilterSpecies(spId)}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                border: isSel ? '2px solid #FF7A59' : '1px solid #E0D3C5',
                background: isSel ? '#FFF2EC' : '#FFFFFF',
                color: isSel ? '#D84315' : '#5D4037',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {info?.name ?? spId}
            </button>
          )
        })}
      </div>

      {/* 4. 도감 액자 그리드 (3열 썸네일 액자 카드) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          alignContent: 'start',
        }}
      >
        {filteredFrames.map((item) => {
          const isUnlocked = item.isUnlocked
          const mockLook: MonsterLook = {
            species: item.species,
            palette: 0,
            bodyType: 'normal',
            scale: 1,
            ears: 0,
            tail: 0,
            top: 0,
            expression: getBranchExpression(item.branch, item.stage, item.species),
            patternSeed: 1,
            shiny: item.stage === 3,
            evoStage: item.stage,
            evoBranch: item.branch,
          }

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isUnlocked) {
                  setSelectedItem(item)
                  playDessertAsmr('mochi-squish')
                } else {
                  playDessertAsmr('sugar-crack')
                  setSelectedItem(item)
                }
              }}
              style={{
                background: isUnlocked
                  ? 'linear-gradient(180deg, #FFFDF9 0%, #FFF5EB 100%)'
                  : 'linear-gradient(180deg, #ECEFF1 0%, #CFD8DC 100%)',
                borderRadius: 14,
                border: isUnlocked
                  ? item.stage === 3
                    ? '2px solid #FFD700'
                    : '1.5px solid #FFCC80'
                  : '1.5px dashed #B0BEC5',
                boxShadow: isUnlocked
                  ? item.stage === 3
                    ? '0 4px 12px rgba(255, 215, 0, 0.35)'
                    : '0 3px 8px rgba(0,0,0,0.06)'
                  : 'none',
                padding: '8px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                opacity: isUnlocked ? 1 : 0.65,
                transition: 'transform 0.15s ease',
              }}
            >
              {/* 단계 배지 */}
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 6,
                  fontSize: 9,
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: 6,
                  background: isUnlocked
                    ? item.stage === 3
                      ? '#FFD700'
                      : item.stage === 2
                        ? '#BA68C8'
                        : '#81C784'
                    : '#90A4AE',
                  color: item.stage === 3 && isUnlocked ? '#3E2723' : '#FFFFFF',
                }}
              >
                {item.stage === 3 ? '3단계' : item.stage === 2 ? '2단계' : '베이비'}
              </div>

              {/* 썸네일 캐릭터 / 자물쇠 */}
              <div
                style={{
                  width: 68,
                  height: 68,
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {isUnlocked ? (
                  <MonsterView look={mockLook} size={64} title={item.name} />
                ) : (
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: '50%',
                      background: '#B0BEC5',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 24,
                    }}
                  >
                    🔒
                  </div>
                )}
              </div>

              {/* 디저트 이름 */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: isUnlocked ? '#3E2723' : '#78909C',
                  marginTop: 4,
                  maxWidth: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isUnlocked ? item.name : '??? 미발견'}
              </div>
            </div>
          )
        })}
      </div>

      {/* 5. 도감 액자 상세 팝업 모달 */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 320,
              maxHeight: '88dvh',
              overflowY: 'auto',
              background: '#FFFDF9',
              borderRadius: 20,
              border: '2px solid #FFD54F',
              padding: '16px 14px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* 상단 타이틀 */}
            <div className="row between" style={{ alignItems: 'center' }}>
              <div className="row" style={{ gap: 4 }}>
                <span className="chip honey" style={{ fontSize: 11 }}>
                  {selectedItem.stage}단계
                </span>
                <span className="chip" style={{ fontSize: 11 }}>
                  <ElementIcon element={selectedItem.element} size={12} />
                  {ELEMENT_INFO[selectedItem.element].label}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 16,
                  cursor: 'pointer',
                  color: '#8D6E63',
                }}
              >
                ✕
              </button>
            </div>

            {/* 3D 캐릭터 뷰 / 자물쇠 */}
            <div
              style={{
                width: 130,
                height: 130,
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedItem.isUnlocked && previewLook ? (
                <MonsterView look={previewLook} size={124} title={selectedItem.name} />
              ) : (
                <div style={{ fontSize: 50 }}>🔒❓</div>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#3E2723' }}>
                {selectedItem.isUnlocked ? selectedItem.name : '미지의 디저트'}
              </h3>
              <div style={{ fontSize: 12, color: '#FF7A59', fontWeight: 800, marginTop: 2 }}>
                칭호: [{selectedItem.title}]
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: '#5D4037', lineHeight: 1.5 }}>
              {selectedItem.isUnlocked
                ? selectedItem.desc
                : '아직 발견되지 않은 신비한 디저트입니다. 파티세리 훈련과 타워 탐험을 통해 진화 조건을 충족해 보세요!'}
            </p>

            {/* ASMR 소리 듣기 & 메인 대표 펫으로 이어 키우기 버튼 */}
            {selectedItem.isUnlocked && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={() => {
                    const sound = getSpeciesSoundKind(selectedItem.species)
                    playDessertAsmr(sound, 2)
                  }}
                  style={{
                    padding: '8px',
                    borderRadius: 12,
                    border: '1.5px solid #FF8A65',
                    background: '#FFF2EC',
                    color: '#D85A3A',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  🎧 고유 식감 ASMR 사운드 듣기
                </button>

                {onSwitchPet && (
                  <button
                    onClick={() => {
                      const sound = getSpeciesSoundKind(selectedItem.species)
                      playDessertAsmr(sound, 3)
                      onSwitchPet({
                        species: selectedItem.species,
                        name: selectedItem.name,
                        element: selectedItem.element,
                      })
                      setSwitchToast(`🎉 [${selectedItem.name}]을(를) 파티세리 대표 펫으로 지정했습니다! 이어서 성장시켜 보세요.`)
                      setTimeout(() => {
                        setSelectedItem(null)
                        onBack()
                      }, 1100)
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: 12,
                      border: 'none',
                      background: 'linear-gradient(90deg, #FF7A59 0%, #FF9800 100%)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 3px 8px rgba(255,122,89,0.3)',
                    }}
                  >
                    🐾 이 디저트로 대표 펫 교체 &amp; 이어 키우기!
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedItem(null)}
              style={{
                padding: '9px',
                borderRadius: 12,
                border: '1px solid #D7CCC8',
                background: '#FFFFFF',
                color: '#5D4037',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {switchToast && <div className="toast">{switchToast}</div>}
    </main>
  )
}
