// M4 화면 2: ✨ 디저트 몬스터 3단계 진화 각성 연출 & 스탯 비교 화면
// 1단계 베이비 -> 2단계 파티세리 (Lv.8) -> 3단계 로얄 마스터 (Lv.15)
// 3D Three.js 회전 슬로우모션, 화려한 골드 파티클 팡파레, 4대 분기 선택, 전후 스탯 증폭 비교 및 도감 등록

import { useMemo, useState } from 'react'
import { EVO_BRANCHES, SPECIES_EVOLUTIONS, type EvoBranchId } from '../config/evolution'
import type { MonsterRow, Stats } from '../lib/api'
import { checkEvolutionEligibility, executeEvolution, type EvolutionResult } from '../lib/evolutionEngine'
import { playDessertAsmr } from '../lib/sound'
import { supabase } from '../lib/supabase'
import Monster3DView from '../monsters/Monster3DView'
import type { MonsterLook } from '../monsters/types'
import { BackIcon } from '../ui/Icons'

interface Props {
  monster: MonsterRow
  onUpdateMonster: (updated: MonsterRow) => void
  onBack: () => void
}

export default function EvolutionRevealScreen({ monster, onUpdateMonster, onBack }: Props) {
  const eligibility = useMemo(() => checkEvolutionEligibility(monster), [monster])
  const [selectedBranch, setSelectedBranch] = useState<EvoBranchId>(eligibility.recommendedBranch)
  const [isEvolving, setIsEvolving] = useState(false)
  const [evoResult, setEvoResult] = useState<EvolutionResult | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const curStage = monster.evo_stage ?? 1
  const targetStage = eligibility.targetStage ?? ((curStage + 1) as 2 | 3)
  const branchMeta = EVO_BRANCHES[selectedBranch]

  // 진화 전 룩 & 진화 후 룩 생성
  const preLook: MonsterLook = useMemo(() => {
    return {
      species: monster.species,
      palette: monster.parts?.palette ?? 0,
      bodyType: monster.parts?.bodyType ?? 'normal',
      scale: monster.parts?.scale ?? 1,
      ears: monster.parts?.ears ?? 0,
      tail: monster.parts?.tail ?? 0,
      top: monster.parts?.top ?? 0,
      expression: monster.parts?.expression ?? 'round',
      patternSeed: monster.parts?.patternSeed ?? 1,
      shiny: monster.parts?.shiny ?? false,
      decorations: monster.parts?.decorations,
      mallang: monster.parts?.mallang,
      evoStage: curStage,
      evoBranch: monster.evo_branch,
    }
  }, [monster, curStage])

  const postLook: MonsterLook = useMemo(() => {
    return {
      ...preLook,
      evoStage: targetStage,
      evoBranch: selectedBranch,
    }
  }, [preLook, targetStage, selectedBranch])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // 진화 각성 실행 연출
  async function handleStartEvolution() {
    if (!eligibility.canEvolve) {
      showToast(eligibility.missingReason || '아직 진화 조건을 충족하지 못했습니다.')
      return
    }

    setIsEvolving(true)
    playDessertAsmr('sugar-crack', 2)

    // 1.8초 동안 긴장감 넘치는 각성 3D 슬로우모션 연출
    setTimeout(async () => {
      try {
        const result = executeEvolution(monster, selectedBranch)
        setEvoResult(result)
        onUpdateMonster(result.updatedMonster)

        // Supabase / 로컬 스토리지에 동기화
        try {
          await supabase
            .from('monsters')
            .update({
              evo_stage: result.newStage,
              evo_branch: result.branch,
              stats: result.updatedMonster.stats,
              sp: result.updatedMonster.sp,
              title: result.newSpeciesTitle,
            })
            .eq('id', monster.id)
        } catch {
          // 오프라인 폴백 세이프가드
        }

        setIsEvolving(false)
        playDessertAsmr('mochi-squish', 3)
      } catch (err) {
        console.error('진화 처리 예외 안전 격리:', err)
        setIsEvolving(false)
        showToast('진화 처리 중 오류가 발생했습니다.')
      }
    }, 1800)
  }

  const evoData = SPECIES_EVOLUTIONS[monster.species]
  const targetTitle = evoData?.titles[targetStage]?.[selectedBranch] ?? `${branchMeta.name} 파티세리`
  const targetName = evoData?.stageNames[targetStage]?.[selectedBranch] ?? `${monster.name} (${branchMeta.name})`

  return (
    <main
      className="mobile-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'linear-gradient(180deg, #1A1225 0%, #291B35 45%, #180F24 100%)',
        color: '#FFF8F0',
        overflow: 'hidden',
        position: 'relative',
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
          ✨ 디저트 각성 진화의 전당
        </h2>
        <div style={{ width: 68 }} />
      </header>

      {/* 진화 성공 축하 결과 뷰 */}
      {evoResult ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            textAlign: 'center',
            gap: 12,
            animation: 'fadeIn 0.4s ease',
          }}
        >
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #FFD700, #FFA000)',
              color: '#3E2723',
              fontSize: 14,
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(255, 215, 0, 0.4)',
            }}
          >
            🎉 {evoResult.newStage}단계 {evoResult.branchName} 각성 성공!
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              margin: '4px 0',
              background: 'linear-gradient(90deg, #FFFFFF, #FFE082)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {evoResult.newSpeciesName}
          </h1>
          <div style={{ fontSize: 13, color: '#FFB74D', fontWeight: 800 }}>
            칭호: [{evoResult.newSpeciesTitle}]
          </div>

          {/* 진화 후 3D 캐릭터 렌더링 */}
          <div
            style={{
              width: 240,
              height: 240,
              margin: '8px 0',
              position: 'relative',
              filter: 'drop-shadow(0 10px 24px rgba(255, 215, 0, 0.35))',
            }}
          >
            <Monster3DView look={postLook} size={240} fluid interactive />
          </div>

          {/* 전후 스탯 증폭 카드 */}
          <div
            style={{
              width: '100%',
              maxWidth: 340,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              border: '1.5px solid rgba(255, 215, 0, 0.3)',
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              fontSize: 12,
            }}
          >
            {(['hp', 'atk', 'def', 'spd', 'int', 'cha'] as (keyof Stats)[]).map((stat) => {
              const boost = evoResult.statBoost[stat] ?? 0
              const finalVal = evoResult.updatedMonster.stats[stat]
              const label =
                stat === 'hp'
                  ? '체력'
                  : stat === 'atk'
                    ? '공격'
                    : stat === 'def'
                      ? '방어'
                      : stat === 'spd'
                        ? '민첩'
                        : stat === 'int'
                          ? '지능'
                          : '매력'
              return (
                <div
                  key={stat}
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: '6px 8px',
                    borderRadius: 10,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: '#E0E0E0', fontSize: 11 }}>{label}</div>
                  <strong style={{ fontSize: 14, color: '#FFFFFF' }}>{finalVal}</strong>
                  <div style={{ color: '#4CAF50', fontSize: 11, fontWeight: 800 }}>+{boost} ▲</div>
                </div>
              )
            })}
          </div>

          <div
            style={{
              background: 'rgba(124, 77, 255, 0.2)',
              border: '1px solid #B388FF',
              borderRadius: 12,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 800,
              color: '#EDE7F6',
            }}
          >
            ⭐ 보너스 스킬 포인트 <strong>+{evoResult.bonusSp} SP</strong> 획득 &amp; 도감 등록 완료!
          </div>

          <button
            onClick={onBack}
            style={{
              width: '100%',
              maxWidth: 340,
              marginTop: 6,
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(90deg, #FF4081, #FF80AB)',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(255, 64, 129, 0.4)',
            }}
          >
            🏠 각성 완료 &amp; 홈으로 복귀
          </button>
        </div>
      ) : (
        /* 진화 전 안내 및 4대 분기 선택 화면 (모바일 100dvh 완벽 컴팩트 배치) */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 14px 12px',
            overflowY: 'auto',
            gap: 8,
          }}
        >
          {/* 캐릭터 3D 프리뷰 & 레벨 조건 안내 */}
          <div
            style={{
              position: 'relative',
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isEvolving ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  animation: 'pulse 1s infinite alternate',
                }}
              >
                <div style={{ fontSize: 36 }}>✨👑✨</div>
                <strong style={{ fontSize: 16, color: '#FFE082' }}>
                  디저트 코어가 황금빛으로 달아오르는 중...
                </strong>
                <div style={{ fontSize: 12, color: '#FFB74D' }}>
                  {branchMeta.subtitle} 속성을 흡수하고 있습니다!
                </div>
              </div>
            ) : (
              <Monster3DView look={preLook} size={140} fluid interactive />
            )}

            {/* 레벨 및 단계 배지 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 4,
                background: 'rgba(0,0,0,0.6)',
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                color: '#FFF8E1',
              }}
            >
              현재: {curStage}단계 디저트 (Lv.{monster.level ?? 1})
            </div>
          </div>

          {/* 진화 타겟 배너 */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              border: `1.5px solid ${branchMeta.color}`,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: '#B39DDB', fontWeight: 700 }}>
                목표: {targetStage}단계 [{branchMeta.name}]
              </div>
              <strong style={{ fontSize: 14, color: '#FFFFFF' }}>{targetName}</strong>
              <div style={{ fontSize: 10, color: '#FFB74D' }}>칭호: {targetTitle}</div>
            </div>
            <div
              style={{
                background: eligibility.canEvolve ? '#4CAF50' : '#E53935',
                color: '#FFFFFF',
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {eligibility.canEvolve ? '진화 가능!' : `Lv.${eligibility.requiredLevel} 필요`}
            </div>
          </div>

          {/* 4대 진화 분기 탭 */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#E1BEE7', marginBottom: 6 }}>
              🌟 진화 갈래 선택 (적합도 AI 분석)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {(['sweet-melty', 'crispy-crunch', 'royal-chef', 'gourmet-rainbow'] as EvoBranchId[]).map(
                (bId) => {
                  const b = EVO_BRANCHES[bId]
                  const isSelected = selectedBranch === bId
                  const isBest = eligibility.recommendedBranch === bId
                  const score = eligibility.branchScores[bId]

                  return (
                    <button
                      key={bId}
                      onClick={() => {
                        setSelectedBranch(bId)
                        playDessertAsmr(b.asmr)
                      }}
                      style={{
                        padding: '8px 6px',
                        borderRadius: 10,
                        border: isSelected ? `2px solid ${b.color}` : '1.5px solid rgba(255,255,255,0.15)',
                        background: isSelected ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0,0,0,0.35)',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'left',
                        position: 'relative',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isBest && (
                        <span
                          style={{
                            position: 'absolute',
                            top: -5,
                            right: 4,
                            background: '#FFD700',
                            color: '#3E2723',
                            fontSize: 9,
                            fontWeight: 900,
                            padding: '1px 5px',
                            borderRadius: 999,
                          }}
                        >
                          추천
                        </span>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 900, color: b.color }}>
                        {b.icon} {b.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#CCCCCC', marginTop: 1 }}>{b.subtitle}</div>
                      <div style={{ fontSize: 10, color: '#FFD54F', marginTop: 2 }}>
                        적합도: <strong>{score}점</strong>
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          </div>

          {/* 선택한 분기 설명 카드 */}
          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              borderRadius: 12,
              padding: '8px 10px',
              fontSize: 11,
              lineHeight: 1.4,
              color: '#EDE7F6',
              borderLeft: `3px solid ${branchMeta.color}`,
              flexShrink: 0,
            }}
          >
            <div style={{ fontWeight: 800, color: branchMeta.color, marginBottom: 2 }}>
              {branchMeta.icon} {branchMeta.name} 특화 가이드
            </div>
            <p style={{ margin: 0 }}>{branchMeta.desc}</p>
          </div>

          {/* 하단 진화 버튼 */}
          <div style={{ marginTop: 'auto', paddingTop: 4, paddingBottom: 6 }}>
            <button
              onClick={handleStartEvolution}
              disabled={!eligibility.canEvolve || isEvolving}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 14,
                border: 'none',
                background: eligibility.canEvolve
                  ? `linear-gradient(90deg, ${branchMeta.color}, #FFD700)`
                  : 'rgba(255,255,255,0.12)',
                color: eligibility.canEvolve ? '#1F112B' : '#888888',
                fontSize: 15,
                fontWeight: 900,
                cursor: eligibility.canEvolve ? 'pointer' : 'not-allowed',
                boxShadow: eligibility.canEvolve
                  ? '0 4px 16px rgba(255, 215, 0, 0.4)'
                  : 'none',
              }}
            >
              {isEvolving
                ? '✨ 각성 진화 진행 중...'
                : eligibility.canEvolve
                  ? `👑 [${branchMeta.name}] 각성 진화 시작!`
                  : `🔒 Lv.${eligibility.requiredLevel} 달성 후 진화 가능`}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
