// 진화 판정·스탯 증폭 (순수 코드: 서버 battle 함수와 화면이 같은 파일을 쓴다)
// 1단계 베이비 -> 2단계 파티세리 디저트 (Lv.8) -> 3단계 로얄 마스터 디저트 (Lv.15)
// 4대 갈래: sweet-melty(달콤 멜팅), crispy-crunch(크런치 바삭), royal-chef(로얄 셰프), gourmet-rainbow(고메 레인보우)

import type { Stats } from './skillLevels.ts'

export type EvoBranchId = 'sweet-melty' | 'crispy-crunch' | 'royal-chef' | 'gourmet-rainbow'
export const EVO_BRANCH_IDS: EvoBranchId[] = ['sweet-melty', 'crispy-crunch', 'royal-chef', 'gourmet-rainbow']

// 갈래별로 더 크게 오르는 능력치 (이름·설명 같은 화면용 정보는 src/config/evolution.ts)
export const EVO_FAVORED_STATS: Record<EvoBranchId, (keyof Stats)[]> = {
  'sweet-melty': ['hp', 'cha'],
  'crispy-crunch': ['atk', 'def'],
  'royal-chef': ['int', 'spd'],
  'gourmet-rainbow': ['hp', 'atk', 'def', 'spd', 'int', 'cha'],
}

export const EVO_REQUIRED_LEVEL = { 2: 8, 3: 15 } as const
export const EVO_BONUS_SP = { 2: 3, 3: 5 } as const

export interface EvoMonster {
  level: number
  stats: Stats
  sp?: number | null
  evo_stage?: number | null
  evo_branch?: string | null
  hunger?: number | null
  sweetness?: number | null
  hygiene?: number | null
}

export interface EvolutionEligibility {
  canEvolve: boolean
  targetStage: 2 | 3 | null
  currentStage: 1 | 2 | 3
  requiredLevel: number
  recommendedBranch: EvoBranchId
  branchScores: Record<EvoBranchId, number>
  missingReason?: string
}

const asBranch = (b: unknown): EvoBranchId | null => (EVO_BRANCH_IDS.includes(b as EvoBranchId) ? (b as EvoBranchId) : null)

// 진화 가능 여부 및 추천 갈래 산출
export function checkEvolutionEligibility(monster: EvoMonster): EvolutionEligibility {
  const currentStage = (monster.evo_stage ?? 1) as 1 | 2 | 3
  const level = monster.level ?? 1

  // 3단계는 이미 최종 진화 상태
  if (currentStage >= 3) {
    return {
      canEvolve: false,
      targetStage: null,
      currentStage: 3,
      requiredLevel: 999,
      recommendedBranch: asBranch(monster.evo_branch) ?? 'sweet-melty',
      branchScores: { 'sweet-melty': 0, 'crispy-crunch': 0, 'royal-chef': 0, 'gourmet-rainbow': 0 },
      missingReason: '이미 최종 로얄 마스터 디저트 단계에 도달했습니다.',
    }
  }

  const targetStage = (currentStage + 1) as 2 | 3
  const requiredLevel = EVO_REQUIRED_LEVEL[targetStage]

  const stats = monster.stats ?? { hp: 100, atk: 20, def: 20, spd: 20, int: 20, cha: 20 }
  const sweetness = monster.sweetness ?? 50
  const hunger = monster.hunger ?? 50
  const hygiene = monster.hygiene ?? 50

  const sweetScore = sweetness * 0.4 + (stats.hp * 0.2 + stats.cha * 0.4)
  const crunchScore = hunger * 0.3 + (stats.atk * 0.4 + stats.def * 0.3)
  const royalScore = hygiene * 0.3 + (stats.int * 0.4 + stats.spd * 0.3)

  // 6대 스탯 표준편차 (작을수록 모든 스탯이 균형 잡힌 레인보우형)
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

  // 2단계에서 이미 갈래가 정해졌다면 3단계도 같은 갈래를 기본 추천
  let recommendedBranch: EvoBranchId = asBranch(monster.evo_branch) ?? 'sweet-melty'
  if (currentStage === 1) {
    let highestScore = -1
    for (const b of EVO_BRANCH_IDS) {
      if (branchScores[b] > highestScore) {
        highestScore = branchScores[b]
        recommendedBranch = b
      }
    }
  }

  const canEvolve = level >= requiredLevel
  const missingReason = !canEvolve ? `진화에 필요한 레벨 Lv.${requiredLevel}에 아직 도달하지 못했습니다 (현재 Lv.${level})` : undefined

  return { canEvolve, targetStage, currentStage, requiredLevel, recommendedBranch, branchScores, missingReason }
}

export interface EvolutionCompute {
  oldStage: 1 | 2
  nextStage: 2 | 3
  branch: EvoBranchId
  newStats: Stats
  statBoost: Stats
  bonusSp: number
  newSp: number
}

// 진화 실행 계산: 스탯 증폭(2단계 x1.25, 3단계 x1.35, 갈래 특화 스탯 +0.1), 보너스 SP(+3/+5)
// 2단계 → 3단계는 이미 정해진 갈래를 그대로 이어 간다 (chosenBranch 는 1단계에서만 쓴다)
export function computeEvolution(monster: EvoMonster, chosenBranch?: string | null): EvolutionCompute {
  const oldStage = (monster.evo_stage ?? 1) as 1 | 2
  const nextStage = (oldStage + 1) as 2 | 3
  const existing = asBranch(monster.evo_branch)
  const branch: EvoBranchId = oldStage === 1 ? (asBranch(chosenBranch) ?? existing ?? 'sweet-melty') : (existing ?? asBranch(chosenBranch) ?? 'sweet-melty')

  const cur = monster.stats ?? { hp: 100, atk: 20, def: 20, spd: 20, int: 20, cha: 20 }
  const favored = EVO_FAVORED_STATS[branch]
  const boostMult = nextStage === 2 ? 1.25 : 1.35
  const grow = (key: keyof Stats) => Math.round(cur[key] * (favored.includes(key) ? boostMult + 0.1 : boostMult))
  const newStats: Stats = { hp: grow('hp'), atk: grow('atk'), def: grow('def'), spd: grow('spd'), int: grow('int'), cha: grow('cha') }
  const statBoost: Stats = {
    hp: newStats.hp - cur.hp,
    atk: newStats.atk - cur.atk,
    def: newStats.def - cur.def,
    spd: newStats.spd - cur.spd,
    int: newStats.int - cur.int,
    cha: newStats.cha - cur.cha,
  }
  const bonusSp = EVO_BONUS_SP[nextStage]
  return { oldStage, nextStage, branch, newStats, statBoost, bonusSp, newSp: (monster.sp ?? 0) + bonusSp }
}
