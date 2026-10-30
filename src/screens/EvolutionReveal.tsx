// M4 화면 2: ✨ 디저트 몬스터 각성 진화의 전당 (포켓몬고 1번 씬 스타일 시네마틱 듀얼 연출)
// - [아기 펫 & 거대 각성체 듀얼 스테이지]: 전면의 베이비 펫과 후면의 거대 각성체가 함께 서서 공명하는 웅장한 구도
// - [에너지 링크 스트랜드]: 두 펫 코어를 연결하는 실시간 황금빛 빛줄기 및 승천 파티클
// - [4대 분기 실시간 인터랙션]: 분기 선택 시 거대 각성체의 3D 외형과 각성 아우라 즉각 반응
// - [시네마틱 융합 각성 시퀀스]: 충전(Charge) -> 융합(Fuse) -> 대폭발(Burst) 3단계 감동 연출

import { useMemo, useState } from 'react'
import { EVO_BRANCHES, SPECIES_EVOLUTIONS, type EvoBranchId } from '../config/evolution'
import type { MonsterRow, Stats } from '../lib/api'
import { checkEvolutionEligibility, executeEvolution, type EvolutionResult } from '../lib/evolutionEngine'
import { callBattle } from '../lib/battleApi'
import { IS_DEV_MOCK } from '../lib/devMode'
import { playDessertAsmr } from '../lib/sound'
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
  const [evolveStep, setEvolveStep] = useState<'idle' | 'charge' | 'fuse' | 'burst'>('idle')
  const [evoResult, setEvoResult] = useState<EvolutionResult | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const curStage = monster.evo_stage ?? 1
  const targetStage = eligibility.targetStage ?? ((curStage + 1) as 2 | 3)
  const branchMeta = EVO_BRANCHES[selectedBranch]

  // 진화 전 (아기/현재 단계) 룩
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

  // 거대 각성 진화체 룩 (선택된 분기 적용)
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

  // 🎬 포켓몬고 스타일 3단계 시네마틱 각성 진화 연출
  async function handleStartEvolution() {
    if (!eligibility.canEvolve) {
      showToast(eligibility.missingReason || '아직 진화 조건을 충족하지 못했습니다.')
      return
    }

    try {
      // 1단계: 에너지 충전 및 코어 공명 (Charge)
      setEvolveStep('charge')
      playDessertAsmr('sugar-crack', 2)

      const serverCall = IS_DEV_MOCK ? null : callBattle('evolve', { monsterId: monster.id, branch: selectedBranch })

      // 2단계: 아기 펫이 빛의 구체로 융합 (Fuse)
      setTimeout(() => {
        setEvolveStep('fuse')
        playDessertAsmr('starlight-ting', 2)
      }, 700)

      // 3단계: 거대 각성체 대폭발 & 환희의 각성 (Burst)
      setTimeout(async () => {
        setEvolveStep('burst')
        playDessertAsmr('mochi-squish', 4)

        let serverMonster: MonsterRow | undefined
        if (serverCall) {
          try {
            const res = await serverCall
            if (res.ok && res.monster) {
              serverMonster = res.monster
            }
          } catch (e) {
            console.warn('서버 진화 동기화 폴백:', e)
          }
        }

        const result = executeEvolution(monster, selectedBranch, serverMonster)
        setTimeout(() => {
          setEvoResult(result)
          onUpdateMonster(result.updatedMonster)
          setEvolveStep('idle')
        }, 650)
      }, 1500)
    } catch (err) {
      console.error('진화 처리 예외 안전 격리:', err)
      setEvolveStep('idle')
      showToast('진화 처리 중 일시적인 오류가 발생했습니다.')
    }
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
        background: 'linear-gradient(180deg, #100A1C 0%, #1F132B 40%, #12091D 100%)',
        color: '#FFF8F0',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes energyStrandFlow {
          0% { stroke-dashoffset: 100; opacity: 0.6; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.6; }
        }
        @keyframes auraPulse {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.12); opacity: 1; filter: drop-shadow(0 0 24px rgba(255,215,0,0.8)); }
        }
        @keyframes altarRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes babyHover {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
        }
        @keyframes giantTower {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.04); }
        }
        @keyframes fuseAscend {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(110px, -70px) scale(0.2); opacity: 0; }
        }
        @keyframes burstShockwave {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes whiteFlash {
          0% { opacity: 0; }
          50% { opacity: 0.85; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* 1. 상단 네비게이션 헤더 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            borderRadius: 10,
            padding: '7px 12px',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12.5,
            fontWeight: 800,
          }}
        >
          <BackIcon size={16} />
          돌아가기
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: '#FFE082', letterSpacing: '-0.3px' }}>
            ✨ 각성 진화 시네마틱
          </h2>
          <span style={{ fontSize: 10, color: '#B39DDB', fontWeight: 700 }}>
            {curStage}단계 베이비 ➔ {targetStage}단계 {branchMeta.name}
          </span>
        </div>
        <div style={{ width: 68 }} />
      </header>

      {/* 시네마틱 플래시 오버레이 */}
      {evolveStep === 'burst' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FFFFFF',
            zIndex: 100,
            pointerEvents: 'none',
            animation: 'whiteFlash 0.65s ease-out forwards',
          }}
        />
      )}

      {/* 진화 성공 축하 결과 뷰 */}
      {evoResult ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
            textAlign: 'center',
            gap: 10,
            animation: 'fadeIn 0.4s ease',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '6px 18px',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #FFD700, #FFA000)',
              color: '#3E2723',
              fontSize: 13.5,
              fontWeight: 900,
              boxShadow: '0 4px 16px rgba(255, 215, 0, 0.45)',
            }}
          >
            🎉 {evoResult.newStage}단계 {evoResult.branchName} 각성 성공!
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              margin: '2px 0',
              background: 'linear-gradient(90deg, #FFFFFF, #FFE082)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {evoResult.newSpeciesName}
          </h1>
          <div style={{ fontSize: 12.5, color: '#FFB74D', fontWeight: 800 }}>
            칭호: [{evoResult.newSpeciesTitle}]
          </div>

          {/* 거대 각성체 3D 뷰 & 아기 펫 미니 홀로그램 듀얼 연출 */}
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              height: 220,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 거대 각성체 전면 배치 */}
            <div
              style={{
                width: 210,
                height: 210,
                filter: `drop-shadow(0 12px 28px ${branchMeta.color}88)`,
                animation: 'giantTower 3.6s ease-in-out infinite',
              }}
            >
              <Monster3DView look={postLook} size={210} fluid interactive />
            </div>

            {/* 좌하단: 추억의 아기 펫 미니 홀로그램 */}
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: 12,
                width: 72,
                height: 72,
                opacity: 0.85,
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1.5px dashed #FFD700',
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'babyHover 2.2s ease-in-out infinite',
                boxShadow: '0 2px 10px rgba(255, 215, 0, 0.3)',
              }}
            >
              <div style={{ width: 62, height: 62 }}>
                <Monster3DView look={preLook} size={62} fluid />
              </div>
              <span
                style={{
                  position: 'absolute',
                  bottom: -6,
                  background: '#3E2723',
                  color: '#FFE082',
                  fontSize: 8,
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                베이비 시절 💖
              </span>
            </div>
          </div>

          {/* 전후 스탯 증폭 카드 */}
          <div
            style={{
              width: '100%',
              maxWidth: 340,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              border: `1.5px solid ${branchMeta.color}66`,
              padding: '10px 12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              fontSize: 11,
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
                    background: 'rgba(0,0,0,0.3)',
                    padding: '5px 6px',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: '#E0E0E0', fontSize: 10 }}>{label}</div>
                  <strong style={{ fontSize: 13, color: '#FFFFFF' }}>{finalVal}</strong>
                  <div style={{ color: '#4CAF50', fontSize: 10, fontWeight: 800 }}>+{boost} ▲</div>
                </div>
              )
            })}
          </div>

          <div
            style={{
              background: 'rgba(124, 77, 255, 0.25)',
              border: '1px solid #B388FF',
              borderRadius: 10,
              padding: '6px 12px',
              fontSize: 12,
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
              marginTop: 4,
              padding: '13px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(90deg, #FF4081, #FF80AB)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(255, 64, 129, 0.4)',
            }}
          >
            🏠 각성 완료 &amp; 홈으로 복귀
          </button>
        </div>
      ) : (
        /* 진화 전: 포켓몬고 1번 씬 스타일 시네마틱 듀얼 스테이지 & 분기 선택 */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '6px 12px 10px',
            overflowY: 'auto',
            gap: 6,
          }}
        >
          {/* 🌟 1. 아기 펫과 거대 각성 디저트가 함께 서는 시네마틱 듀얼 스테이지 */}
          <div
            style={{
              position: 'relative',
              height: 'clamp(210px, 32dvh, 260px)',
              borderRadius: 18,
              background: 'radial-gradient(ellipse at 50% 60%, #2A173B 0%, #170C24 60%, #0D0517 100%)',
              border: `1.5px solid ${branchMeta.color}88`,
              boxShadow: `0 8px 24px rgba(0,0,0,0.5), inset 0 0 30px ${branchMeta.color}22`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {/* 별빛 오로라 및 신비로운 파티클 텍스처 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 75% 35%, ${branchMeta.color}33 0%, transparent 65%)`,
                pointerEvents: 'none',
              }}
            />

            {/* 듀얼 코어 공명 헤더 뱃지 */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 10,
                zIndex: 25,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(0, 0, 0, 0.65)',
                border: `1px solid ${branchMeta.color}`,
                padding: '3px 9px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 900,
                color: '#FFE082',
              }}
            >
              <span>✨ 듀얼 시네마틱 공명</span>
              <span style={{ color: '#E0E0E0', fontSize: 9 }}>({targetStage}단계 미래형 프리뷰)</span>
            </div>

            {/* [바닥 제단 1] 아기 펫 발판 (좌하단 원형 룬) */}
            <div
              style={{
                position: 'absolute',
                bottom: '10%',
                left: '12%',
                width: 100,
                height: 34,
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(255, 215, 0, 0.5) 0%, rgba(255, 215, 0, 0.1) 60%, transparent 100%)',
                border: '1.5px solid rgba(255, 215, 0, 0.6)',
                transform: 'rotateX(60deg)',
                boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)',
                pointerEvents: 'none',
                zIndex: 3,
              }}
            />

            {/* [바닥 제단 2] 거대 각성체 발판 (우상단 웅장한 각성 신전 제단) */}
            <div
              style={{
                position: 'absolute',
                top: '46%',
                right: '8%',
                width: 160,
                height: 52,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, ${branchMeta.color}77 0%, ${branchMeta.color}22 65%, transparent 100%)`,
                border: `2px solid ${branchMeta.color}`,
                transform: 'rotateX(60deg)',
                boxShadow: `0 0 25px ${branchMeta.color}aa`,
                pointerEvents: 'none',
                zIndex: 3,
                animation: 'altarRotate 16s linear infinite',
              }}
            />

            {/* ⚡ 두 펫 코어를 잇는 실시간 에너지 링크 스트랜드 (SVG 오버레이) */}
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 8,
              }}
            >
              <defs>
                <linearGradient id="strandGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFD54F" stopOpacity="0.8" />
                  <stop offset="50%" stopColor={branchMeta.color} stopOpacity="1" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
                </linearGradient>
                <filter id="glowStrand" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* 공명 에너지 링크 곡선 */}
              <path
                d="M 100 175 Q 155 120, 245 85"
                fill="none"
                stroke="url(#strandGrad)"
                strokeWidth={evolveStep !== 'idle' ? '4.5' : '2.5'}
                strokeDasharray="6 4"
                filter="url(#glowStrand)"
                style={{
                  animation: 'energyStrandFlow 1.2s linear infinite',
                }}
              />
            </svg>

            {/* 🍼 [전면 좌하단] 아기 펫 (베이비 폼) */}
            <div
              style={{
                position: 'absolute',
                bottom: '8%',
                left: '10%',
                width: 105,
                height: 105,
                zIndex: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation:
                  evolveStep === 'fuse'
                    ? 'fuseAscend 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                    : 'babyHover 3s ease-in-out infinite',
              }}
            >
              <Monster3DView look={preLook} size={105} fluid interactive />
              <div
                style={{
                  background: 'rgba(0,0,0,0.65)',
                  padding: '2px 7px',
                  borderRadius: 999,
                  fontSize: 9,
                  fontWeight: 900,
                  color: '#FFE082',
                  marginTop: -4,
                  whiteSpace: 'nowrap',
                }}
              >
                🍼 베이비 펫 (Lv.{monster.level})
              </div>
            </div>

            {/* 👑 [후면 우상단] 거대 각성 디저트 몬스터 (웅장한 위용) */}
            <div
              style={{
                position: 'absolute',
                top: '6%',
                right: '6%',
                width: 175,
                height: 175,
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation:
                  evolveStep === 'burst'
                    ? 'auraPulse 0.4s ease-out infinite'
                    : 'giantTower 3.8s ease-in-out infinite',
                filter: `drop-shadow(0 0 20px ${branchMeta.color}aa)`,
              }}
            >
              {/* 회전 각성 오라 링 */}
              <div
                style={{
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '50%',
                  border: `2px dotted ${branchMeta.color}`,
                  opacity: 0.75,
                  animation: 'altarRotate 8s linear infinite',
                  pointerEvents: 'none',
                }}
              />
              <Monster3DView look={postLook} size={175} fluid interactive />
              <div
                style={{
                  background: `linear-gradient(90deg, ${branchMeta.color}, #FFA000)`,
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 9.5,
                  fontWeight: 900,
                  color: '#210C1B',
                  marginTop: -4,
                  whiteSpace: 'nowrap',
                  boxShadow: `0 2px 8px ${branchMeta.color}88`,
                }}
              >
                👑 거대 각성체 [{branchMeta.name}]
              </div>
            </div>

            {/* 시네마틱 각성 진행 중 충격파 */}
            {evolveStep !== 'idle' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 40,
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, #FFFFFF 0%, ${branchMeta.color} 70%, transparent 100%)`,
                    animation: 'burstShockwave 0.8s ease-out infinite',
                  }}
                />
                <strong style={{ fontSize: 15, color: '#FFE082', textShadow: '0 2px 8px #000' }}>
                  {evolveStep === 'charge'
                    ? '✨ 영혼의 유대 에너지 충전 중...'
                    : evolveStep === 'fuse'
                      ? '🌀 디저트 코어 융합 진행 중!'
                      : '💥 찬란한 거대 각성 폭발!!'}
                </strong>
                <span style={{ fontSize: 11, color: '#FFF8E1' }}>
                  {branchMeta.subtitle} 궁극의 식감이 눈을 뜹니다!
                </span>
              </div>
            )}
          </div>

          {/* 2. 진화 목표 및 스탯 요약 배너 */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              border: `1.5px solid ${branchMeta.color}`,
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 10.5, color: '#B39DDB', fontWeight: 700 }}>
                목표 진화형: {targetStage}단계 [{branchMeta.name}]
              </div>
              <strong style={{ fontSize: 13.5, color: '#FFFFFF' }}>{targetName}</strong>
              <div style={{ fontSize: 10, color: '#FFB74D' }}>칭호: {targetTitle}</div>
            </div>
            <div
              style={{
                background: eligibility.canEvolve ? '#4CAF50' : '#E53935',
                color: '#FFFFFF',
                padding: '3px 8px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 900,
              }}
            >
              {eligibility.canEvolve ? '진화 가능!' : `Lv.${eligibility.requiredLevel} 필요`}
            </div>
          </div>

          {/* 3. 4대 진화 갈래 선택 그리드 (터치 시 거대 각성체 즉각 반응) */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#E1BEE7', marginBottom: 4 }}>
              🌟 진화 갈래 선택 (선택 시 거대 각성체 실시간 변환)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 }}>
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
                        padding: '6px 8px',
                        borderRadius: 10,
                        border: isSelected ? `2px solid ${b.color}` : '1.5px solid rgba(255,255,255,0.12)',
                        background: isSelected ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0,0,0,0.3)',
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
                            top: -4,
                            right: 4,
                            background: '#FFD700',
                            color: '#3E2723',
                            fontSize: 8.5,
                            fontWeight: 900,
                            padding: '1px 4px',
                            borderRadius: 999,
                          }}
                        >
                          추천
                        </span>
                      )}
                      <div style={{ fontSize: 12, fontWeight: 900, color: b.color }}>
                        {b.icon} {b.name}
                      </div>
                      <div style={{ fontSize: 9.5, color: '#CCCCCC', marginTop: 1 }}>{b.subtitle}</div>
                      <div style={{ fontSize: 9.5, color: '#FFD54F', marginTop: 1 }}>
                        적합도: <strong>{score}점</strong>
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          </div>

          {/* 4. 선택한 분기 가이드 카드 */}
          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              borderRadius: 10,
              padding: '6px 8px',
              fontSize: 10.5,
              lineHeight: 1.35,
              color: '#EDE7F6',
              borderLeft: `3px solid ${branchMeta.color}`,
              flexShrink: 0,
            }}
          >
            <div style={{ fontWeight: 800, color: branchMeta.color, marginBottom: 1 }}>
              {branchMeta.icon} {branchMeta.name} 특화 가이드
            </div>
            <p style={{ margin: 0 }}>{branchMeta.desc}</p>
          </div>

          {/* 5. 하단 시네마틱 각성 진화 시작 버튼 */}
          <div style={{ marginTop: 'auto', paddingTop: 2, paddingBottom: 4 }}>
            <button
              onClick={handleStartEvolution}
              disabled={!eligibility.canEvolve || evolveStep !== 'idle'}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 14,
                border: 'none',
                background: eligibility.canEvolve
                  ? `linear-gradient(90deg, ${branchMeta.color}, #FFD700)`
                  : 'rgba(255,255,255,0.12)',
                color: eligibility.canEvolve ? '#1F112B' : '#888888',
                fontSize: 14.5,
                fontWeight: 900,
                cursor: eligibility.canEvolve ? 'pointer' : 'not-allowed',
                boxShadow: eligibility.canEvolve
                  ? `0 4px 16px ${branchMeta.color}88`
                  : 'none',
              }}
            >
              {evolveStep !== 'idle'
                ? '✨ 시네마틱 각성 진화 진행 중...'
                : eligibility.canEvolve
                  ? `👑 [${branchMeta.name}] 시네마틱 각성 진화 시작!`
                  : `🔒 Lv.${eligibility.requiredLevel} 달성 후 진화 가능`}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
