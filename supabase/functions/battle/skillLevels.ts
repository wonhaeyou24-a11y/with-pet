// 스킬 레벨 시스템: 스킬을 '장착'하는 대신 스킬마다 레벨을 올리면 즉시 펫에 적용됩니다.
// - 액티브 스킬: 레벨이 오를수록 위력이 커지고, 레벨 1 이상이면 대전에서 자동으로 사용됩니다.
// - 패시브 스킬: 레벨이 오를수록 가지(계열)별 능력치가 영구 상승합니다.
// - 모든 액티브/패시브 레벨은 능력치 보너스도 함께 줍니다. (여러 스킬을 골고루 올릴수록 강해짐)

import {
  ALL_SKILL_NODES,
  DEFAULT_EQUIPPED_SKILLS,
  DEFAULT_UNLOCKED_SKILLS,
  type SkillBranchId,
  type SkillNodeDef,
} from './skills.ts'

// 서버(Deno)와 화면이 같이 쓰는 최소 몬스터 모양 (화면의 MonsterRow가 그대로 들어맞는다)
export type Stats = { hp: number; atk: number; def: number; spd: number; int: number; cha: number }
export interface SkillMonster {
  stats: Stats
  unlocked_skills?: string[] | null
  equipped_skills?: string[] | null
  skill_levels?: Record<string, number> | null
  // 장착한 장비가 더해 주는 능력치 (서버가 gear_bonus 로 채운다. 화면 미리보기는 비워 둔다)
  gear?: Partial<Stats> | null
}

// 티어별 최대 레벨 (1티어 5, 2티어 4, 3티어 궁극기 3)
export function getSkillMaxLevel(node: SkillNodeDef): number {
  return node.tier === 1 ? 5 : node.tier === 2 ? 4 : 3
}

// 다음 레벨로 올리는 데 필요한 SP (현재 레벨이 높을수록 비싸짐)
export function getSkillUpgradeCost(node: SkillNodeDef, currentLevel: number): number {
  return Math.max(1, node.spCost + Math.floor(currentLevel / 2))
}

// 레벨에 따른 액티브 위력 배율 (Lv1=1.0, 이후 레벨당 +16%)
export function getSkillPowerMult(level: number): number {
  const lv = Math.max(1, Math.min(9, Math.floor(level)))
  return 1 + (lv - 1) * 0.16
}

// 안전하게 레벨 값을 0 ~ 최대 레벨 범위로 보정 (저장값 변조 방어)
function clampLevel(node: SkillNodeDef, raw: unknown): number {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? Math.floor(raw) : 0
  return Math.max(0, Math.min(getSkillMaxLevel(node), n))
}

// 몬스터의 스킬 레벨 표를 읽습니다. 예전 '해금/장착' 데이터가 있으면 자동으로 이전합니다.
export function getSkillLevels(m: Pick<SkillMonster, 'skill_levels' | 'unlocked_skills' | 'equipped_skills'>): Record<string, number> {
  const out: Record<string, number> = {}
  if (m.skill_levels && typeof m.skill_levels === 'object') {
    for (const node of ALL_SKILL_NODES) {
      const lv = clampLevel(node, m.skill_levels[node.id])
      if (lv > 0) out[node.id] = lv
    }
    return out
  }
  // 예전 데이터 이전: 해금된 스킬은 Lv1, 장착 중이던 스킬은 Lv2로 시작
  const unlocked = m.unlocked_skills?.length ? m.unlocked_skills : DEFAULT_UNLOCKED_SKILLS
  const equipped = m.equipped_skills?.length ? m.equipped_skills : DEFAULT_EQUIPPED_SKILLS
  for (const node of ALL_SKILL_NODES) {
    if (equipped.includes(node.id)) out[node.id] = Math.min(2, getSkillMaxLevel(node))
    else if (unlocked.includes(node.id)) out[node.id] = 1
  }
  return out
}

// 가지별로 어떤 능력치가 오르는지 (레벨 1당 상승량)
const BRANCH_STAT_GAIN: Record<SkillBranchId, Partial<Stats>> = {
  assault: { atk: 1.6 },
  fortress: { def: 1.6, hp: 1.2 },
  bond: { hp: 3, cha: 1 },
  mystic: { int: 1.6 },
  quirky: { spd: 1.6, cha: 0.6 },
  elemental: { atk: 0.8, int: 0.8 },
}

export const BRANCH_STAT_LABEL: Record<SkillBranchId, string> = {
  assault: '공격',
  fortress: '방어·체력',
  bond: '체력·매력',
  mystic: '지능',
  quirky: '속도',
  elemental: '공격·지능',
}

// 스킬 레벨 전체가 펫 능력치에 주는 보너스 합계 (패시브는 2배)
export function computeSkillStatBonus(levels: Record<string, number>): Stats {
  const bonus: Stats = { hp: 0, atk: 0, def: 0, spd: 0, int: 0, cha: 0 }
  for (const node of ALL_SKILL_NODES) {
    const lv = levels[node.id] ?? 0
    if (lv <= 0) continue
    const weight = node.kind === 'passive' ? 2 : 1
    const gain = BRANCH_STAT_GAIN[node.branch]
    for (const key of Object.keys(gain) as (keyof Stats)[]) {
      bonus[key] += (gain[key] ?? 0) * lv * weight
    }
  }
  for (const key of Object.keys(bonus) as (keyof Stats)[]) bonus[key] = Math.round(bonus[key])
  return bonus
}

// 전투 등에 쓰는 '스킬 보너스가 반영된' 능력치
export function getBoostedStats(m: SkillMonster): Stats {
  const bonus = computeSkillStatBonus(getSkillLevels(m))
  const g = m.gear ?? {}
  return {
    hp: (m.stats.hp ?? 0) + bonus.hp + (g.hp ?? 0),
    atk: (m.stats.atk ?? 0) + bonus.atk + (g.atk ?? 0),
    def: (m.stats.def ?? 0) + bonus.def + (g.def ?? 0),
    spd: (m.stats.spd ?? 0) + bonus.spd + (g.spd ?? 0),
    int: (m.stats.int ?? 0) + bonus.int + (g.int ?? 0),
    cha: (m.stats.cha ?? 0) + bonus.cha + (g.cha ?? 0),
  }
}

// 이 스킬을 올릴 수 있는 상태인지 검사 (잠금 사유를 한국어로 돌려줌)
export function getSkillLockReason(
  node: SkillNodeDef,
  levels: Record<string, number>,
  monsterLevel: number,
): string | null {
  if (node.tier === 2 && monsterLevel < 8) return 'Lv.8 이상 필요'
  if (node.tier === 3 && monsterLevel < 15) return 'Lv.15 이상 필요'
  if (node.requires?.some((id) => (levels[id] ?? 0) < 1)) return '선행 스킬을 먼저 배우세요'
  return null
}


export type SkillUpgradePlan =
  | { ok: true; nextLevels: Record<string, number>; cost: number; nextLevel: number; node: SkillNodeDef }
  | { ok: false; code: string; message: string }

// 스킬 한 단계 올리기 계산 (서버가 검사하고, 화면도 같은 규칙으로 미리 안내한다)
export function planSkillUpgrade(m: SkillMonster & { level: number; sp?: number | null }, skillId: string): SkillUpgradePlan {
  const node = ALL_SKILL_NODES.find((n) => n.id === skillId)
  if (!node) return { ok: false, code: 'bad_skill', message: '알 수 없는 스킬이에요.' }
  const levels = getSkillLevels(m)
  const curLv = levels[node.id] ?? 0
  if (curLv >= getSkillMaxLevel(node)) return { ok: false, code: 'max', message: `👑 [${node.name}]은(는) 이미 최고 레벨(MAX)입니다!` }
  const lock = getSkillLockReason(node, levels, m.level ?? 1)
  if (lock) return { ok: false, code: 'locked', message: `🔒 ${lock}` }
  const cost = getSkillUpgradeCost(node, curLv)
  if ((m.sp ?? 0) < cost) return { ok: false, code: 'no_sp', message: `⭐ SP가 부족해요! (필요: ${cost} SP) 파티세리 훈련으로 SP를 획득하세요.` }
  return { ok: true, nextLevels: { ...levels, [node.id]: curLv + 1 }, cost, nextLevel: curLv + 1, node }
}
