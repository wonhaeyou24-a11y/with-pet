// M3 오감 자극 식감 ASMR 대전 엔진 (난수 시드 기반 100% 재현 가능한 턴제 리플레이 생성기)
// 동일한 시드(seed)와 양측 스냅샷을 넣으면 언제나 똑같은 턴 기록과 식감 사운드 연출이 재생됩니다.

import { DEFAULT_EQUIPPED_SKILLS, SKILL_NODES_T1, type BattleStanceId, type SkillNodeDef } from '../config/skills'
import { SPECIES_INFO } from '../config/species'
import type { Element } from '../monsters/types'
import type { MonsterRow } from './api'
import { getSpeciesSoundKind, type DessertSoundKind } from './sound'

export interface BattleTurnLog {
  turn: number
  actor: 'challenger' | 'defender'
  actorName: string
  skillName: string
  skillIcon: string
  asmr: DessertSoundKind
  onomatopoeia: string
  damage: number
  heal: number
  shield: number
  isCrit: boolean
  isAdvantage: boolean
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
  challenger: MonsterRow,
  defender: MonsterRow,
  seed: number = Math.floor(Date.now() % 1_000_000),
): BattleSimulationResult {
  const rng = createSeededRng(seed)

  const cMaxHp = Math.max(80, (challenger.stats.hp ?? 45) * 3 + challenger.level * 8)
  const dMaxHp = Math.max(80, (defender.stats.hp ?? 45) * 3 + defender.level * 8)

  let cHp = cMaxHp
  let dHp = dMaxHp
  let cShield = 0
  let dShield = 0
  let cDefBuff = 0
  let dDefBuff = 0

  const cEquippedIds = challenger.equipped_skills?.length ? challenger.equipped_skills : DEFAULT_EQUIPPED_SKILLS
  const dEquippedIds = defender.equipped_skills?.length ? defender.equipped_skills : DEFAULT_EQUIPPED_SKILLS

  const cSkills = cEquippedIds
    .map((id) => SKILL_NODES_T1.find((s) => s.id === id))
    .filter((s): s is SkillNodeDef => Boolean(s) && s!.kind === 'active')
  const dSkills = dEquippedIds
    .map((id) => SKILL_NODES_T1.find((s) => s.id === id))
    .filter((s): s is SkillNodeDef => Boolean(s) && s!.kind === 'active')

  const fallbackSkill = SKILL_NODES_T1[0]
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
      const atkName = atkMon.name || SPECIES_INFO[atkMon.species]?.name || '디저트몬'
      const defName = defMon.name || SPECIES_INFO[defMon.species]?.name || '상대 디저트'

      const hpRatio = isChallenger ? cHp / cMaxHp : dHp / dMaxHp
      const stance = (atkMon.battle_stance as BattleStanceId) ?? 'balanced'
      const skill = pickSkill(isChallenger ? cSkills : dSkills, stance, hpRatio)

      // 캐릭터 고유 식감 사운드와 스킬 사운드 결합
      const speciesSound = getSpeciesSoundKind(atkMon.species)
      const asmrSound: DessertSoundKind = skill.id === 'kataifi-strike' || skill.id === 'element-drizzle' ? speciesSound : skill.asmr

      let damage = 0
      let heal = 0
      let shield = 0
      let isCrit = false
      let isAdvantage = false
      let diceValue: number | undefined
      let hitCount: number | undefined
      let narrative = ''

      if (skill.kindTag === 'heal') {
        heal = Math.round((isChallenger ? cMaxHp : dMaxHp) * 0.18)
        if (isChallenger) cHp = Math.min(cMaxHp, cHp + heal)
        else dHp = Math.min(dMaxHp, dHp + heal)
        narrative = `💖 [${atkName}]의 [${skill.name}]! 달콤한 교감으로 체력을 +${heal} 회복했어요!`
      } else if (skill.kindTag === 'shield') {
        shield = Math.round((isChallenger ? cMaxHp : dMaxHp) * 0.16)
        if (isChallenger) {
          cShield += shield
          cDefBuff = 2
        } else {
          dShield += shield
          dDefBuff = 2
        }
        if (skill.power > 0) {
          damage = Math.max(8, Math.round(skill.power * 0.7))
          if (isChallenger) dHp = Math.max(0, dHp - damage)
          else cHp = Math.max(0, cHp - damage)
        }
        narrative = `💎 [${atkName}]의 [${skill.name}]! 빠작거리는 설탕 보호막(+${shield})을 둘렀어요!`
      } else {
        // 공격 / 주사위 / 미러 / 디버프 / 날씨 공격
        let basePower = skill.power || 40
        if (skill.id === 'cookie-flurry') {
          hitCount = 2 + Math.floor(rng() * 3) // 2~4회
          basePower = skill.power * hitCount
        } else if (skill.kindTag === 'dice') {
          diceValue = 1 + Math.floor(rng() * 6)
          basePower = 22 * diceValue
        }

        const atkStat = (atkMon.stats.atk ?? 28) + (atkMon.stats.int ?? 28) * 0.35
        const defStat = (defMon.stats.def ?? 28) * (1 + ((isChallenger ? dDefBuff : cDefBuff) > 0 ? 0.35 : 0))
        const elMult = elementMultiplier(atkMon.element, defMon.element)
        isAdvantage = elMult > 1.05
        isCrit = rng() < 0.18

        const rawDmg = ((basePower * (atkStat / Math.max(15, defStat))) * 0.68 + 8) * elMult * (isCrit ? 1.45 : 1.0)
        damage = Math.max(9, Math.round(rawDmg * (0.92 + rng() * 0.16)))

        // 상대 보호막 차감 후 체력 차감
        if (isChallenger) {
          const absorbed = Math.min(dShield, damage)
          dShield -= absorbed
          dHp = Math.max(0, dHp - (damage - absorbed))
        } else {
          const absorbed = Math.min(cShield, damage)
          cShield -= absorbed
          cHp = Math.max(0, cHp - (damage - absorbed))
        }

        const extraTag = hitCount
          ? ` (${hitCount}연속 바삭 타격!)`
          : diceValue
            ? ` (주사위 🎲${diceValue}!)`
            : isCrit
              ? ' (치명적 크런치!!)'
              : isAdvantage
                ? ' (속성 상성 우위!)'
                : ''
        narrative = `${skill.icon} [${atkName}]의 [${skill.name}]!${extraTag} [${defName}]에게 ${damage} 피해!`
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
        damage,
        heal,
        shield,
        isCrit,
        isAdvantage,
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

// 지인 디저트 쇼케이스 광장 기본 파트너 5인 (실제 유저 몬스터와 함께 광장에 전시되어 언제든 구경·좋아요·친선전 가능)
export interface PlazaFriendEntry {
  ownerNickname: string
  badge: string
  bio: string
  likes: number
  monster: MonsterRow
  comments: { author: string; emoji: string; text: string }[]
}

export const PLAZA_SHOWCASE_FRIENDS: PlazaFriendEntry[] = [
  {
    ownerNickname: '민트파티시에',
    badge: '🏆 주간 쇼케이스 1위',
    bio: '피스타치오 크림을 듬뿍 채운 바사삭 두바이 쫀득쿠키예요! 소리 켜고 눌러보세요 💚',
    likes: 84,
    comments: [
      { author: '딸기공방', emoji: '💚', text: '카다이프 바사삭 소리가 진짜 군침 돌아요!!' },
      { author: '푸딩집사', emoji: '🥄', text: '초코칩 쿠키 받침대랑 찰떡이네요 한입 투표 꾹!' },
    ],
    monster: {
      id: 'friend-dubai-1',
      owner: 'friend-1',
      name: '카다이프킹',
      species: 'dubai-cookie',
      element: 'earth',
      element2: 'fire',
      level: 5,
      trait: '황금카다이프',
      fav_food: '피스타치오 크림',
      discovered_fav: true,
      personality_active: 28,
      personality_bond: 15,
      is_shiny: true,
      mutation: 'gold',
      hatched_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
      talents: { hp: 12, atk: 14, def: 11, spd: 8, int: 10, cha: 15 },
      stats: { hp: 58, atk: 48, def: 46, spd: 34, int: 40, cha: 56 },
      equipped_skills: ['kataifi-strike', 'cookie-flurry', 'sugar-shield', 'element-drizzle'],
      battle_stance: 'aggressive',
      parts: {
        palette: 0,
        bodyType: 'chubby',
        scale: 1.05,
        ears: 1,
        tail: 0,
        top: 0,
        expression: 'round',
        patternSeed: 777,
        shiny: true,
        mallang: {
          morphForm: 'dubai-cookie',
          dessertBase: 'choco-cookie',
          syrups: ['choco-drizzle', 'matcha-powder'],
          decorations: { head: 'cream-cherry', effect: 'star-powder', dye: 3 },
        },
      },
    },
  },
  {
    ownerNickname: '왁싱볼장인',
    badge: '🫧 과즙팡 ASMR 마스터',
    bio: '톡! 파삭 깨물면 시원한 포도·소다 과즙이 쭈욱 터지는 왁싱볼이에요 🫧💦',
    likes: 76,
    comments: [
      { author: '민트파티시에', emoji: '🫧', text: '터치할 때 톡! 파삭~ 과즙 터지는 소리 중독성 미쳤어요 ㅋㅋ' },
      { author: '딸기공방', emoji: '💦', text: '탕후루랑 번갈아 누르면 귀가 녹아요!' },
    ],
    monster: {
      id: 'friend-wax-2',
      owner: 'friend-wax',
      name: '톡톡포도볼',
      species: 'wax-ball',
      element: 'water',
      element2: 'electric',
      level: 5,
      trait: '과즙팡왁스',
      fav_food: '과즙팡 왁싱볼',
      discovered_fav: true,
      personality_active: 20,
      personality_bond: 22,
      is_shiny: true,
      mutation: 'crystal',
      hatched_at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
      talents: { hp: 12, atk: 14, def: 11, spd: 13, int: 14, cha: 15 },
      stats: { hp: 52, atk: 44, def: 38, spd: 42, int: 44, cha: 56 },
      equipped_skills: ['wax-ball-burst', 'sugar-shield', 'sweet-gaze', 'element-drizzle'],
      battle_stance: 'aggressive',
      parts: {
        palette: 0,
        bodyType: 'normal',
        scale: 1.04,
        ears: 0,
        tail: 0,
        top: 0,
        expression: 'round',
        patternSeed: 208,
        shiny: true,
        mallang: {
          morphForm: 'wax-ball',
          dessertBase: 'parfait-cup',
          syrups: ['berry-syrup', 'rainbow-sprinkles'],
          decorations: { head: 'cream-cherry', neck: 'bell-ribbon', dye: 1 },
        },
      },
    },
  },
  {
    ownerNickname: '딸기공방',
    badge: '🍓 설탕코팅 장인',
    bio: '빠작! 유리알 설탕 시럽을 3겹 입힌 생딸기 탕후루예요 🍓💎',
    likes: 67,
    comments: [
      { author: '민트파티시에', emoji: '🍓', text: '설탕 깨지는 빠작 소리가 완전 힐링이에요!' },
    ],
    monster: {
      id: 'friend-tanghulu-2',
      owner: 'friend-2',
      name: '빠작베리',
      species: 'tanghulu',
      element: 'water',
      element2: null,
      level: 4,
      trait: '슈가글레이즈',
      fav_food: '생딸기 슈가시럽',
      discovered_fav: true,
      personality_active: 18,
      personality_bond: 32,
      is_shiny: false,
      mutation: 'crystal',
      hatched_at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
      talents: { hp: 9, atk: 12, def: 10, spd: 14, int: 13, cha: 15 },
      stats: { hp: 46, atk: 42, def: 34, spd: 46, int: 48, cha: 54 },
      equipped_skills: ['sugar-shield', 'element-drizzle', 'sweet-gaze', 'macaron-roulette'],
      battle_stance: 'balanced',
      parts: {
        palette: 1,
        bodyType: 'normal',
        scale: 1.0,
        ears: 0,
        tail: 0,
        top: 0,
        expression: 'round',
        patternSeed: 202,
        shiny: false,
        mallang: {
          morphForm: 'tanghulu',
          dessertBase: 'parfait-cup',
          syrups: ['berry-syrup', 'rainbow-sprinkles'],
          decorations: { head: 'birthday-candle', neck: 'pretzel-ribbon', dye: 1 },
        },
      },
    },
  },
  {
    ownerNickname: '푸딩집사',
    badge: '🍮 탱글 워블 챔피언',
    bio: '건드리면 탱글탱글~ 끝없이 출렁이는 커스터드 푸딩 친구랍니다!',
    likes: 59,
    comments: [
      { author: '캠핑요리사', emoji: '🍮', text: '출렁거리는 애니메이션이랑 소리가 너무 귀여워요 ㅋㅋ' },
    ],
    monster: {
      id: 'friend-pudding-3',
      owner: 'friend-3',
      name: '탱글커스터드',
      species: 'pudding',
      element: 'water',
      element2: 'wind',
      level: 3,
      trait: '쫀득탄력',
      fav_food: '메이플 허니버터',
      discovered_fav: true,
      personality_active: -18,
      personality_bond: 25,
      is_shiny: false,
      mutation: null,
      hatched_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      talents: { hp: 13, atk: 8, def: 14, spd: 10, int: 12, cha: 14 },
      stats: { hp: 52, atk: 26, def: 42, spd: 38, int: 40, cha: 49 },
      equipped_skills: ['mochi-cushion', 'sugar-shield', 'sweet-gaze', 'chameleon-mirror'],
      battle_stance: 'defensive',
      parts: {
        palette: 2,
        bodyType: 'chubby',
        scale: 1.04,
        ears: 2,
        tail: 1,
        top: 0,
        expression: 'sleepy',
        patternSeed: 303,
        shiny: false,
        mallang: {
          morphForm: 'pudding',
          dessertBase: 'custard-pudding',
          syrups: ['choco-drizzle', 'sugar-powder'],
          decorations: { head: 'cream-cherry', dye: 0 },
        },
      },
    },
  },
  {
    ownerNickname: '캠핑요리사',
    badge: '🔥 모닥불 파티시에',
    bio: '통밀 크래커 사이에 노릇노릇하게 구운 마시멜로 스모어예요 🔥🐾',
    likes: 53,
    comments: [
      { author: '초코마스터', emoji: '🔥', text: '바삭~ 폭신 사르르 소리에 밤마다 야식 생각나요!' },
    ],
    monster: {
      id: 'friend-smore-4',
      owner: 'friend-4',
      name: '노릇스모어',
      species: 'smore',
      element: 'fire',
      element2: null,
      level: 4,
      trait: '겉바속촉',
      fav_food: '초코 퐁듀볼',
      discovered_fav: true,
      personality_active: 22,
      personality_bond: -12,
      is_shiny: false,
      mutation: null,
      hatched_at: new Date(Date.now() - 6 * 86_400_000).toISOString(),
      talents: { hp: 11, atk: 13, def: 10, spd: 11, int: 11, cha: 12 },
      stats: { hp: 50, atk: 42, def: 36, spd: 36, int: 38, cha: 45 },
      equipped_skills: ['smore-lullaby', 'cookie-flurry', 'patisserie-weather', 'kataifi-strike'],
      battle_stance: 'trickster',
      parts: {
        palette: 3,
        bodyType: 'normal',
        scale: 1.02,
        ears: 1,
        tail: 2,
        top: 1,
        expression: 'round',
        patternSeed: 404,
        shiny: false,
        mallang: {
          morphForm: 'smore',
          dessertBase: 'choco-cookie',
          syrups: ['choco-drizzle', 'sugar-powder'],
          decorations: { hand: 'lollipop-wand', dye: 2 },
        },
      },
    },
  },
  {
    ownerNickname: '초코마스터',
    badge: '🍫 가나슈 쇼콜라티에',
    bio: '사르르 녹아내리는 다크 가나슈 퐁듀 초코와 쫀득 젤리 듀오!',
    likes: 48,
    comments: [
      { author: '민트파티시에', emoji: '🍫', text: '생딸기 홀케이크 위에 올라간 퐁듀 초코 비주얼 최고!' },
    ],
    monster: {
      id: 'friend-choco-5',
      owner: 'friend-5',
      name: '가나슈퐁듀',
      species: 'choco',
      element: 'earth',
      element2: 'water',
      level: 3,
      trait: '꾸덕가나슈',
      fav_food: '우유 생크림',
      discovered_fav: true,
      personality_active: -10,
      personality_bond: 20,
      is_shiny: false,
      mutation: null,
      hatched_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      talents: { hp: 14, atk: 11, def: 13, spd: 8, int: 12, cha: 13 },
      stats: { hp: 54, atk: 36, def: 42, spd: 30, int: 38, cha: 44 },
      equipped_skills: ['ganache-swamp', 'mochi-cushion', 'element-drizzle', 'sweet-gaze'],
      battle_stance: 'balanced',
      parts: {
        palette: 4,
        bodyType: 'chubby',
        scale: 1.0,
        ears: 0,
        tail: 0,
        top: 0,
        expression: 'round',
        patternSeed: 505,
        shiny: false,
        mallang: {
          morphForm: 'choco',
          dessertBase: 'strawberry-cake',
          syrups: ['choco-drizzle', 'berry-syrup', 'rainbow-sprinkles'],
          decorations: { head: 'cream-cherry', neck: 'pretzel-ribbon', dye: 0 },
        },
      },
    },
  },
]
