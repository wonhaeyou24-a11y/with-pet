// M4 디저트 몬스터 진화 판정 & 실행 엔진
// 1단계 베이비 -> 2단계 파티세리 디저트 (Lv.8) -> 3단계 로얄 마스터 디저트 (Lv.15)
// 4대 분기: sweet-melty(달콤 멜팅), crispy-crunch(크런치 바삭), royal-chef(로얄 셰프), gourmet-rainbow(고메 레인보우)

import { EVO_BRANCHES, SPECIES_EVOLUTIONS, type EvoBranchId } from '../config/evolution'
import type { MonsterRow, Stats } from './api'
import { playDessertAsmr } from './sound'

export interface EvolutionEligibility {
  canEvolve: boolean
  targetStage: 2 | 3 | null
  currentStage: 1 | 2 | 3
  requiredLevel: number
  recommendedBranch: EvoBranchId
  branchScores: Record<EvoBranchId, number>
  missingReason?: string
}

export interface EvolutionResult {
  success: boolean
  updatedMonster: MonsterRow
  oldStage: number
  newStage: number
  branch: EvoBranchId
  branchName: string
  newSpeciesTitle: string
  newSpeciesName: string
  statBoost: Partial<Stats>
  bonusSp: number
}

// 진화 가능 여부 및 추천 분기 산출
export function checkEvolutionEligibility(monster: MonsterRow): EvolutionEligibility {
  const currentStage = (monster.evo_stage ?? 1) as 1 | 2 | 3
  const level = monster.level ?? 1

  // 3단계는 이미 최종 진화 상태
  if (currentStage >= 3) {
    return {
      canEvolve: false,
      targetStage: null,
      currentStage: 3,
      requiredLevel: 999,
      recommendedBranch: (monster.evo_branch as EvoBranchId) || 'sweet-melty',
      branchScores: { 'sweet-melty': 0, 'crispy-crunch': 0, 'royal-chef': 0, 'gourmet-rainbow': 0 },
      missingReason: '이미 최종 로얄 마스터 디저트 단계에 도달했습니다.',
    }
  }

  const targetStage = (currentStage + 1) as 2 | 3
  const requiredLevel = targetStage === 2 ? 8 : 15

  // 4대 분기 적합도 점수 계산
  // 1. 달콤 멜팅 (sweet-melty): 달콤함(sweetness), HP, 매력(CHA), 애정 쓰다듬기/브러싱 이력
  // 2. 크런치 바삭 (crispy-crunch): 배부름, 근력(ATK), 방어(DEF), 크런치 다지기 훈련 횟수
  // 3. 로얄 셰프 (royal-chef): 청결도, 지능(INT), 민첩(SPD), 시크릿 레시피 훈련 횟수
  // 4. 고메 레인보우 (gourmet-rainbow): 6대 스탯의 균형도(표준편차가 작을수록 고득점)

  const stats = monster.stats ?? { hp: 100, atk: 20, def: 20, spd: 20, int: 20, cha: 20 }
  const sweetness = monster.sweetness ?? 50
  const hunger = monster.hunger ?? 50
  const hygiene = monster.hygiene ?? 50

  const sweetScore = sweetness * 0.4 + (stats.hp * 0.2 + stats.cha * 0.4)
  const crunchScore = hunger * 0.3 + (stats.atk * 0.4 + stats.def * 0.3)
  const royalScore = hygiene * 0.3 + (stats.int * 0.4 + stats.spd * 0.3)

  // 6대 스탯 표준편차 계산 (작을수록 모든 스탯이 균형 잡힌 레인보우형)
  const statValues = [stats.hp / 2, stats.atk, stats.def, stats.spd, stats.int, stats.cha]
  const mean = statValues.reduce((a, b) => a + b, 0) / statValues.length
  const variance = statValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / statValues.length
  const stdDev = Math.sqrt(variance)
  const balanceBonus = Math.max(0, 50 - stdDev * 1.5)
  const rainbowScore = mean + balanceBonus * 1.2

  const branchScores: Record<EvoBranchId, number> = {
    'sweet-melty': Math.round(sweetScore),
    'crispy-crunch': Math.round(crunchScore),
    'royal-chef': Math.round(royalScore),
    'gourmet-rainbow': Math.round(rainbowScore),
  }

  // 2단계에서 이미 분기가 결정되었다면 3단계도 같은 분기를 기본 추천
  let recommendedBranch: EvoBranchId = (monster.evo_branch as EvoBranchId) || 'sweet-melty'
  if (currentStage === 1) {
    let highestScore = -1
    const branches: EvoBranchId[] = ['sweet-melty', 'crispy-crunch', 'royal-chef', 'gourmet-rainbow']
    for (const b of branches) {
      if (branchScores[b] > highestScore) {
        highestScore = branchScores[b]
        recommendedBranch = b
      }
    }
  }

  const canEvolve = level >= requiredLevel
  const missingReason = !canEvolve ? `진화에 필요한 레벨 Lv.${requiredLevel}에 아직 도달하지 못했습니다 (현재 Lv.${level})` : undefined

  return {
    canEvolve,
    targetStage,
    currentStage,
    requiredLevel,
    recommendedBranch,
    branchScores,
    missingReason,
  }
}

// 진화 실행 함수: 스탯 증폭(+25~35%), 보너스 SP(+3), 진화 단계 갱신
export function executeEvolution(monster: MonsterRow, chosenBranch?: EvoBranchId): EvolutionResult {
  const currentStage = (monster.evo_stage ?? 1) as 1 | 2
  const nextStage = (currentStage + 1) as 2 | 3
  const branch = chosenBranch || (monster.evo_branch as EvoBranchId) || 'sweet-melty'
  const branchMeta = EVO_BRANCHES[branch]

  const currentStats = monster.stats ?? { hp: 100, atk: 20, def: 20, spd: 20, int: 20, cha: 20 }

  // 진화 스탯 증폭: 기본 +20% 증가 + 분기 특화 스탯 +35% 추가 증폭
  const boostMult = nextStage === 2 ? 1.25 : 1.35
  const newStats: Stats = {
    hp: Math.round(currentStats.hp * (branchMeta.favoredStats.includes('hp') ? boostMult + 0.1 : boostMult)),
    atk: Math.round(currentStats.atk * (branchMeta.favoredStats.includes('atk') ? boostMult + 0.1 : boostMult)),
    def: Math.round(currentStats.def * (branchMeta.favoredStats.includes('def') ? boostMult + 0.1 : boostMult)),
    spd: Math.round(currentStats.spd * (branchMeta.favoredStats.includes('spd') ? boostMult + 0.1 : boostMult)),
    int: Math.round(currentStats.int * (branchMeta.favoredStats.includes('int') ? boostMult + 0.1 : boostMult)),
    cha: Math.round(currentStats.cha * (branchMeta.favoredStats.includes('cha') ? boostMult + 0.1 : boostMult)),
  }

  const statBoost: Partial<Stats> = {
    hp: newStats.hp - currentStats.hp,
    atk: newStats.atk - currentStats.atk,
    def: newStats.def - currentStats.def,
    spd: newStats.spd - currentStats.spd,
    int: newStats.int - currentStats.int,
    cha: newStats.cha - currentStats.cha,
  }

  const bonusSp = nextStage === 2 ? 3 : 5
  const currentSp = monster.sp ?? 0

  // 종족 진화 명칭 조회
  const evoData = SPECIES_EVOLUTIONS[monster.species]
  let newSpeciesName = `${monster.name} (${branchMeta.name})`
  let newSpeciesTitle = `${branchMeta.name} 파티세리`

  if (evoData) {
    if (nextStage === 2) {
      newSpeciesName = evoData.stageNames[2]?.[branch] ?? newSpeciesName
      newSpeciesTitle = evoData.titles[2]?.[branch] ?? newSpeciesTitle
    } else if (nextStage === 3) {
      newSpeciesName = evoData.stageNames[3]?.[branch] ?? newSpeciesName
      newSpeciesTitle = evoData.titles[3]?.[branch] ?? newSpeciesTitle
    }
  }

  const updatedMonster: MonsterRow = {
    ...monster,
    evo_stage: nextStage,
    evo_branch: branch,
    stats: newStats,
    sp: currentSp + bonusSp,
    title: newSpeciesTitle,
  }

  // 진화 고유 ASMR 사운드 재생
  try {
    playDessertAsmr(branchMeta.asmr)
    setTimeout(() => {
      playDessertAsmr('sugar-crack')
    }, 400)
  } catch (err) {
    console.warn('[Evolution] ASMR 사운드 재생 예외 안전 격리:', err)
  }

  // 도감(Dex) 발견 기록 로컬스토리지에 안전 저장
  recordDiscoveredDexEntry(monster.species, nextStage, branch)

  return {
    success: true,
    updatedMonster,
    oldStage: currentStage,
    newStage: nextStage,
    branch,
    branchName: branchMeta.name,
    newSpeciesTitle,
    newSpeciesName,
    statBoost,
    bonusSp,
  }
}

const DEX_STORAGE_KEY = 'pet_dessert_dex_unlocked_v1'

// 도감 해금 기록 함수
export function recordDiscoveredDexEntry(species: string, stage: number, branch?: EvoBranchId): void {
  try {
    const raw = localStorage.getItem(DEX_STORAGE_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    const key = `${species}_stage${stage}_${branch || 'base'}`
    if (!list.includes(key)) {
      list.push(key)
      localStorage.setItem(DEX_STORAGE_KEY, JSON.stringify(list))
    }
  } catch (e) {
    console.warn('[Dex] 도감 기록 저장 실패 방어:', e)
  }
}

// 도감 해금 목록 조회
export function getDiscoveredDexEntries(): Set<string> {
  try {
    const raw = localStorage.getItem(DEX_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

