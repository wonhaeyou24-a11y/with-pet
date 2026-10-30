// M3 오감 자극 식감 ASMR 대전 엔진 (난수 시드 기반 100% 재현 가능한 턴제 리플레이 생성기)
// 동일한 시드(seed)와 양측 스냅샷을 넣으면 언제나 똑같은 턴 기록과 식감 사운드 연출이 재생됩니다.

import { getBoostedStats, getSkillLevels, getSkillPowerMult, type Stats } from './skillLevels.ts'
import { ALL_SKILL_NODES, type BattleStanceId, type SkillNodeDef } from './skills.ts'
import { SPECIES_NAMES } from './speciesNames.ts'
import { getSpeciesSoundKind, type DessertSoundKind } from './soundKinds.ts'

export type Element = 'fire' | 'water' | 'grass' | 'electric' | 'wind' | 'earth'

// 대전에 필요한 몬스터 정보만 (화면의 MonsterRow와 서버의 DB 행이 모두 들어맞는다)
export interface BattleMonster {
  name: string | null
  species: string
  element: Element
  level: number
  stats: Stats
  battle_stance?: string | null
  unlocked_skills?: string[] | null
  equipped_skills?: string[] | null
  skill_levels?: Record<string, number> | null
  gear?: Partial<Stats> | null
}

export interface BattleTurnLog {
  turn: number
  actor: 'challenger' | 'defender'
  actorName: string
  skillName: string
  skillIcon: string
  asmr: DessertSoundKind
  onomatopoeia: string
  actionType: 'attack' | 'skill' | 'dodge' | 'block' | 'critical' | 'heal'
  motion: 'rush' | 'jump' | 'shield' | 'shake' | 'bounce'
  targetReaction: 'hit' | 'dodge' | 'block' | 'none'
  damage: number
  heal: number
  shield: number
  isCrit: boolean
  isAdvantage: boolean
  isDodge?: boolean
  isBlock?: boolean
  bannerText?: string
  diceValue?: number
  hitCount?: number
  challengerHp: number
  defenderHp: number
  narrative: string
}

export interface BattleSimulationResult {
  seed: number
  challengerMaxHp: number
  defenderMaxHp: number
  winner: 'challenger' | 'defender' | 'draw'
  turns: BattleTurnLog[]
}

// 시드 기반 결정론적 난수 생성기 (Mulberry32)
export function createSeededRng(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 6원소 상성 판정 (불 > 풀 > 땅 > 전기 > 물 > 불, 바람은 풀·땅에 강함)
function elementMultiplier(atkEl: Element, defEl: Element): number {
  const chart: Record<Element, Element[]> = {
    fire: ['grass', 'wind'],
    grass: ['earth', 'water'],
    earth: ['electric', 'fire'],
    electric: ['water', 'wind'],
    water: ['fire', 'earth'],
    wind: ['grass', 'earth'],
  }
  if (chart[atkEl]?.includes(defEl)) return 1.25
  if (chart[defEl]?.includes(atkEl)) return 0.85
  return 1.0
}

export function simulateAsmrBattle(
  challenger: BattleMonster,
  defender: BattleMonster,
  seed: number = Math.floor(Date.now() % 1_000_000),
): BattleSimulationResult {
  const rng = createSeededRng(seed)

  const cBoosted = getBoostedStats(challenger)
  const dBoosted = getBoostedStats(defender)

  const cMaxHp = Math.max(80, (cBoosted.hp ?? 45) * 3 + challenger.level * 8)
  const dMaxHp = Math.max(80, (dBoosted.hp ?? 45) * 3 + defender.level * 8)

  let cHp = cMaxHp
  let dHp = dMaxHp
  let cShield = 0
  let dShield = 0
  let cDefBuff = 0
  let dDefBuff = 0

  const cLevels = getSkillLevels(challenger)
  const dLevels = getSkillLevels(defender)

  // 레벨 1 이상 배운 모든 액티브 스킬들이 대전에서 발동 풀에 참여
  const cSkills = ALL_SKILL_NODES.filter((s) => s.kind === 'active' && (cLevels[s.id] ?? 0) >= 1)
  const dSkills = ALL_SKILL_NODES.filter((s) => s.kind === 'active' && (dLevels[s.id] ?? 0) >= 1)

  const fallbackSkill = ALL_SKILL_NODES[0]
  if (cSkills.length === 0) cSkills.push(fallbackSkill)
  if (dSkills.length === 0) dSkills.push(fallbackSkill)

  const turns: BattleTurnLog[] = []
  const maxTurns = 12 // 무한 루프 방지 가드: 최대 12턴 내 승부 판정

  function pickSkill(skills: SkillNodeDef[], stance: BattleStanceId, hpRatio: number): SkillNodeDef {
    if (stance === 'defensive' && hpRatio < 0.65) {
      const defSkill = skills.find((s) => s.kindTag === 'shield' || s.kindTag === 'heal')
      if (defSkill && rng() < 0.7) return defSkill
    }
    if (stance === 'aggressive') {
      const atkSkill = skills.find((s) => s.kindTag === 'attack' || s.kindTag === 'dice')
      if (atkSkill && rng() < 0.75) return atkSkill
    }
    if (stance === 'trickster') {
      const trickSkill = skills.find((s) => s.kindTag === 'debuff' || s.kindTag === 'dice' || s.kindTag === 'mirror')
      if (trickSkill && rng() < 0.7) return trickSkill
    }
    return skills[Math.floor(rng() * skills.length)] ?? fallbackSkill
  }

  for (let t = 1; t <= maxTurns; t++) {
    // 속도 + 약간의 난수로 선공 결정
    const cSpd = (challenger.stats.spd ?? 30) + rng() * 8
    const dSpd = (defender.stats.spd ?? 30) + rng() * 8
    const order: ('challenger' | 'defender')[] = cSpd >= dSpd ? ['challenger', 'defender'] : ['defender', 'challenger']

    for (const side of order) {
      if (cHp <= 0 || dHp <= 0) break

      const isChallenger = side === 'challenger'
      const atkMon = isChallenger ? challenger : defender
      const defMon = isChallenger ? defender : challenger
      const atkName = atkMon.name || SPECIES_NAMES[atkMon.species] || '디저트몬'
      const defName = defMon.name || SPECIES_NAMES[defMon.species] || '상대 디저트'

      const hpRatio = isChallenger ? cHp / cMaxHp : dHp / dMaxHp
      const stance = (atkMon.battle_stance as BattleStanceId) ?? 'balanced'
      const skill = pickSkill(isChallenger ? cSkills : dSkills, stance, hpRatio)

      const atkStats = isChallenger ? cBoosted : dBoosted
      const defStats = isChallenger ? dBoosted : cBoosted
      const skillLv = (isChallenger ? cLevels[skill.id] : dLevels[skill.id]) ?? 1
      const powerMult = getSkillPowerMult(skillLv)

      // 캐릭터 고유 식감 사운드와 스킬 사운드 결합
      const speciesSound = getSpeciesSoundKind(atkMon.species)
      const asmrSound: DessertSoundKind = skill.id === 'kataifi-strike' || skill.id === 'element-drizzle' ? speciesSound : skill.asmr

      let damage = 0
      let heal = 0
      let shield = 0
      let isCrit = false
      let isAdvantage = false
      let isDodge = false
      let isBlock = false
      let actionType: BattleTurnLog['actionType'] = 'attack'
      let motion: BattleTurnLog['motion'] = 'rush'
      let targetReaction: BattleTurnLog['targetReaction'] = 'hit'
      let bannerText: string | undefined
      let diceValue: number | undefined
      let hitCount: number | undefined
      let narrative = ''

      if (skill.kindTag === 'heal') {
        heal = Math.round((isChallenger ? cMaxHp : dMaxHp) * (0.16 + (skillLv - 1) * 0.03))
        if (isChallenger) cHp = Math.min(cMaxHp, cHp + heal)
        else dHp = Math.min(dMaxHp, dHp + heal)
        actionType = 'heal'
        motion = 'bounce'
        targetReaction = 'none'
        bannerText = skillLv > 1 ? `💖 달콤 체력 회복 (Lv.${skillLv})!` : '💖 달콤 체력 회복!'
        narrative = `💖 [${atkName}]의 [${skill.name}](Lv.${skillLv})! 달콤한 교감으로 체력을 +${heal} 회복했어요!`
      } else if (skill.kindTag === 'shield') {
        shield = Math.round((isChallenger ? cMaxHp : dMaxHp) * (0.15 + (skillLv - 1) * 0.025))
        if (isChallenger) {
          cShield += shield
          cDefBuff = 2
        } else {
          dShield += shield
          dDefBuff = 2
        }
        actionType = 'block'
        motion = 'shield'
        targetReaction = 'none'
        bannerText = skillLv > 1 ? `💎 슈가코팅 쉴드 (Lv.${skillLv})!` : '💎 슈가코팅 쉴드!'
        if (skill.power > 0) {
          damage = Math.max(8, Math.round(skill.power * powerMult * 0.7))
          if (isChallenger) dHp = Math.max(0, dHp - damage)
          else cHp = Math.max(0, cHp - damage)
        }
        narrative = `💎 [${atkName}]의 [${skill.name}](Lv.${skillLv})! 빠작거리는 설탕 보호막(+${shield})을 둘렀어요!`
      } else {
        // 상대방 속도와 방어력에 따른 다이내믹 액션 판정
        const defSpd = defStats.spd ?? 25
        const atkSpd = atkStats.spd ?? 25
        const dodgeProb = Math.min(0.22, Math.max(0.08, (defSpd - atkSpd) * 0.008 + 0.12))
        const guardProb = 0.16

        const rollAction = rng()
        if (rollAction < dodgeProb && t > 1) {
          // 💨 1. 점프 회피 발동!
          isDodge = true
          damage = 0
          actionType = 'dodge'
          motion = 'rush'
          targetReaction = 'dodge'
          bannerText = '💨 점프 회피 (MISS)!'
          narrative = `💨 [${defName}]의 날렵한 점프 회피! [${atkName}]의 공격을 가볍게 피했어요!`
        } else if (rollAction < dodgeProb + guardProb) {
          // 🛡️ 2. 슈가 가드 블록 발동!
          isBlock = true
          let basePower = Math.round((skill.power || 35) * powerMult)
          const atkStat = (atkStats.atk ?? 28) + (atkStats.int ?? 28) * 0.35
          const defStat = (defStats.def ?? 28) * 1.5
          damage = Math.max(5, Math.round(((basePower * (atkStat / Math.max(15, defStat))) * 0.4 + 4) * (0.85 + rng() * 0.2)))
          
          if (isChallenger) dHp = Math.max(0, dHp - damage)
          else cHp = Math.max(0, cHp - damage)

          actionType = 'block'
          motion = 'rush'
          targetReaction = 'block'
          bannerText = '🛡️ 슈가 가드 (BLOCK)!'
          narrative = `🛡️ [${defName}]의 단단한 슈가 가드! 공격을 막아 피해를 ${damage}로 줄였어요!`
        } else {
          // 💥 3. 일반 타격 또는 치명타
          let basePower = Math.round((skill.power || 40) * powerMult)
          if (skill.id === 'cookie-flurry') {
            hitCount = 2 + Math.floor(rng() * 3) // 2~4회
            basePower = Math.round(skill.power * powerMult * hitCount)
          } else if (skill.kindTag === 'dice') {
            diceValue = 1 + Math.floor(rng() * 6)
            basePower = Math.round(22 * powerMult * diceValue)
          }

          const atkStat = (atkStats.atk ?? 28) + (atkStats.int ?? 28) * 0.35
          const defStat = (defStats.def ?? 28) * (1 + ((isChallenger ? dDefBuff : cDefBuff) > 0 ? 0.35 : 0))
          const elMult = elementMultiplier(atkMon.element, defMon.element)
          isAdvantage = elMult > 1.05
          isCrit = rng() < 0.2

          const rawDmg = ((basePower * (atkStat / Math.max(15, defStat))) * 0.68 + 8) * elMult * (isCrit ? 1.5 : 1.0)
          damage = Math.max(9, Math.round(rawDmg * (0.92 + rng() * 0.16)))

          if (isChallenger) {
            const absorbed = Math.min(dShield, damage)
            dShield -= absorbed
            dHp = Math.max(0, dHp - (damage - absorbed))
          } else {
            const absorbed = Math.min(cShield, damage)
            cShield -= absorbed
            cHp = Math.max(0, cHp - (damage - absorbed))
          }

          if (isCrit) {
            actionType = 'critical'
            motion = 'jump'
            targetReaction = 'hit'
            bannerText = '💥 치명타 (CRITICAL)!'
          } else {
            actionType = 'attack'
            motion = 'rush'
            targetReaction = 'hit'
            bannerText = isAdvantage ? '⚡ 속성 상성 우위!' : undefined
          }

          const extraTag = hitCount
            ? ` (${hitCount}연속 바삭 타격!)`
            : diceValue
              ? ` (주사위 🎲${diceValue}!)`
              : isCrit
                ? ' (치명타 바사삭!!)'
                : isAdvantage
                  ? ' (속성 상성 우위!)'
                  : ''
          narrative = `${skill.icon} [${atkName}]의 [${skill.name}](Lv.${skillLv})!${extraTag} [${defName}]에게 ${damage} 피해!`
        }
      }

      if (cDefBuff > 0 && !isChallenger) cDefBuff -= 1
      if (dDefBuff > 0 && isChallenger) dDefBuff -= 1

      turns.push({
        turn: t,
        actor: side,
        actorName: atkName,
        skillName: skill.name,
        skillIcon: skill.icon,
        asmr: asmrSound,
        onomatopoeia: skill.onomatopoeia,
        actionType,
        motion,
        targetReaction,
        damage,
        heal,
        shield,
        isCrit,
        isAdvantage,
        isDodge,
        isBlock,
        bannerText,
        diceValue,
        hitCount,
        challengerHp: cHp,
        defenderHp: dHp,
        narrative,
      })

      if (cHp <= 0 || dHp <= 0) break
    }

    if (cHp <= 0 || dHp <= 0) break
  }

  const winner: 'challenger' | 'defender' | 'draw' =
    cHp > dHp ? 'challenger' : dHp > cHp ? 'defender' : 'challenger'

  return {
    seed,
    challengerMaxHp: cMaxHp,
    defenderMaxHp: dMaxHp,
    winner,
    turns,
  }
}
