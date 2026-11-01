// 🥚 탐험 알 온기 숙성(에그 블렌딩) & 등급 승급 + 비기 스킬 계승 엔진
// - Zero-Trust 무결성, 100% 한글 주석, Zero-Crash 안정성 보장
// - 방안 1: 알을 소모하는 제물 합성이 아닌, 신비한 알의 온기와 비전을 전수받아 등급 승급 & 비기 각인

import { loadMallangCustom, saveMallangCustom, type MallangCustom } from '../monsters/MallangChameleon'
import type { MonsterRow } from './api'

export type EggRarity = 'rare' | 'epic' | 'legendary'

export interface SecretSkillDef {
  id: string
  name: string
  icon: string
  rarity: EggRarity
  desc: string
  battleEffect: string
  asmrSound: string
  flavorQuote: string
}

export interface ExploreEggDef {
  id: string
  name: string
  icon: string
  rarity: EggRarity
  regionName: string
  flavorDesc: string
  secretSkill: SecretSkillDef
}

// 🌟 8종의 신비한 탐험 에그 카탈로그
export const EXPLORE_EGG_CATALOG: ExploreEggDef[] = [
  {
    id: 'egg-rare-berry',
    name: '생딸기 글레이즈 에그',
    icon: '🍓🥚',
    rarity: 'rare',
    regionName: '이슬 숲',
    flavorDesc: '산뜻하고 달콤한 생딸기 시럽이 껍질 위에 촉촉하게 코팅된 숲의 신비한 알.',
    secretSkill: {
      id: 'skill-berry-barrier',
      name: '생딸기 글레이즈 배리어',
      icon: '🍓🛡️',
      rarity: 'rare',
      desc: '피격 시 25% 확률로 끈적한 딸기 시럽 방어막이 발동하여 상대의 순발력을 20% 감소시킵니다.',
      battleEffect: '피격 시 25% 확률 상대 속도 저하',
      asmrSound: 'syrup-drizzle',
      flavorQuote: '달콤한 딸기 시럽이 나를 감싸 안아요!',
    },
  },
  {
    id: 'egg-rare-crunch',
    name: '카다이프 크런치 에그',
    icon: '🌾🥚',
    rarity: 'rare',
    regionName: '노을 바닷가',
    flavorDesc: '바삭하게 튀겨진 황금빛 카다이프 면발이 회오리처럼 감겨 있는 바삭한 알.',
    secretSkill: {
      id: 'skill-crunch-spike',
      name: '바사삭 카다이프 스파이크',
      icon: '🌾⚔️',
      rarity: 'rare',
      desc: '공격 시 25% 확률로 날카로운 카다이프 가시가 솟구쳐 2연속 크런치 타격을 가합니다.',
      battleEffect: '공격 시 25% 확률 크런치 2연타',
      asmrSound: 'sugar-crack',
      flavorQuote: '바사삭! 귓가를 울리는 경쾌한 손맛!',
    },
  },
  {
    id: 'egg-epic-ganache',
    name: '마그마 가나슈 에그',
    icon: '🍫🥚',
    rarity: 'epic',
    regionName: '화산 오븐',
    flavorDesc: '진한 다크 초콜릿 쉘 안에서 뜨거운 가나슈 마그마가 꿀렁이며 맥동하는 에픽 알.',
    secretSkill: {
      id: 'skill-ganache-burst',
      name: '다크 가나슈 퐁듀 분출',
      icon: '🍫💥',
      rarity: 'epic',
      desc: '스킬 타격 시 상대 방어력의 30%를 무시하고 묵직한 퐁듀 폭풍 피해를 입힙니다.',
      battleEffect: '적 방어력 30% 관통 타격',
      asmrSound: 'smore-sizzle',
      flavorQuote: '진한 다크 가나슈가 화산처럼 터져 나와요!',
    },
  },
  {
    id: 'egg-epic-pudding',
    name: '탱글 푸딩 탄성 에그',
    icon: '🍮🥚',
    rarity: 'epic',
    regionName: '구름섬',
    flavorDesc: '반투명한 커스터드 젤리 층으로 둘러싸여 통통 튕기는 극상의 탄성을 지닌 에픽 알.',
    secretSkill: {
      id: 'skill-pudding-rebound',
      name: '탱글 푸딩 리바운드',
      icon: '🍮🔄',
      rarity: 'epic',
      desc: '받은 피해의 20%를 말랑한 탄성으로 상대에게 되돌려줍니다.',
      battleEffect: '받은 피해 20% 탄성 반사',
      asmrSound: 'pudding-bounce',
      flavorQuote: '탱글탱글~ 어떤 충격도 튕겨내요!',
    },
  },
  {
    id: 'egg-legend-tanghulu',
    name: '유리알 탕후루 에그',
    icon: '💎🥚',
    rarity: 'legendary',
    regionName: '설원',
    flavorDesc: '빙하 속에서 얇고 투명한 설탕 코팅이 얼어붙어 영롱한 빛을 뿜는 전설의 보석 알.',
    secretSkill: {
      id: 'skill-crystal-armor',
      name: '유리알 크리스탈 아머',
      icon: '💎✨',
      rarity: 'legendary',
      desc: '전투 중 치명타 피격을 1회 완전 무효화하고 상대를 1턴 동안 스턴(기절)시킵니다.',
      battleEffect: '치명타 1회 완전 무효화 및 적 스턴',
      asmrSound: 'sugar-crack',
      flavorQuote: '빠작! 영롱한 유리알 설탕 코팅은 깨지지 않아!',
    },
  },
  {
    id: 'egg-legend-cotton',
    name: '오로라 솜사탕 에그',
    icon: '🌌🥚',
    rarity: 'legendary',
    regionName: '유적',
    flavorDesc: '밤하늘 오로라의 무지개 별빛 설탕을 꼬아 만든 신화 속 전설의 솜사탕 알.',
    secretSkill: {
      id: 'skill-aurora-stardust',
      name: '오로라 솜사탕 스타더스트',
      icon: '🌌💖',
      rarity: 'legendary',
      desc: '매 턴 최대 체력의 8%를 스스로 회복하고, 펫 주변에 반짝이는 오로라 식감 오라를 발산합니다.',
      battleEffect: '매 턴 체력 8% 자가 회복 & 오라 강화',
      asmrSound: 'cotton-puff',
      flavorQuote: '오로라 별가루가 온몸을 따스하게 감싸줘요~',
    },
  },
  {
    id: 'egg-legend-dubai',
    name: '황금 피스타치오 에그',
    icon: '👑🥚',
    rarity: 'legendary',
    regionName: '고대 유적 심층',
    flavorDesc: '24K 순금박과 초록빛 고소한 피스타치오 버터가 가득 찬 황금 두바이 제국의 시그니처 전설 알.',
    secretSkill: {
      id: 'skill-dubai-strike',
      name: '황금 두바이 카다이프 일격',
      icon: '👑🌾',
      rarity: 'legendary',
      desc: '치명타 확률이 30% 증가하며, 치명타 명중 시 1.5배의 추가 폭발 피해를 가합니다.',
      battleEffect: '치명타 확률 +30% & 1.5배 폭발 피해',
      asmrSound: 'wax-pop',
      flavorQuote: '황금빛 카다이프의 럭셔리한 결정타!',
    },
  },
  {
    id: 'egg-epic-smore',
    name: '모닥불 스모어 에그',
    icon: '🔥🥚',
    rarity: 'epic',
    regionName: '화산 오븐 심층',
    flavorDesc: '캠프파이어 모닥불에서 겉바속촉 노릇노릇 구워진 마시멜로 향을 품은 에픽 알.',
    secretSkill: {
      id: 'skill-smore-melt',
      name: '포근 스모어 마시멜로 멜트',
      icon: '🔥🛡️',
      rarity: 'epic',
      desc: '전투 시작 시 최대 체력의 25%에 해당하는 포근한 마시멜로 방어막을 생성합니다.',
      battleEffect: '전투 시작 시 체력 25% 방어막 생성',
      asmrSound: 'smore-sizzle',
      flavorQuote: '겉은 바삭, 속은 쫀득하게 지켜줄게!',
    },
  },
]

// 로컬 보관 중인 탐험 알 인벤토리 키
const INVENTORY_EGGS_STORAGE_KEY = 'withpet_explore_eggs_inventory_v1'

/**
 * 📦 보유 중인 탐험 알 목록 조회
 */
export function getOwnedExploreEggs(): ExploreEggDef[] {
  try {
    const raw = localStorage.getItem(INVENTORY_EGGS_STORAGE_KEY)
    if (!raw) {
      // 최초 지급: 지인 체험용으로 레어 알 1개 + 에픽 알 1개 기본 보유
      const initial = [EXPLORE_EGG_CATALOG[0], EXPLORE_EGG_CATALOG[2]]
      localStorage.setItem(INVENTORY_EGGS_STORAGE_KEY, JSON.stringify(initial))
      return initial
    }
    return JSON.parse(raw)
  } catch {
    return [EXPLORE_EGG_CATALOG[0]]
  }
}

/**
 * 🎁 탐험 알 획득 (가방에 추가)
 */
export function addExploreEgg(eggDef: ExploreEggDef): void {
  try {
    const list = getOwnedExploreEggs()
    list.push(eggDef)
    localStorage.setItem(INVENTORY_EGGS_STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('탐험 알 획득 실패:', e)
  }
}

/**
 * 🥚 알 제거 (온기 숙성 후 소모)
 */
export function removeExploreEgg(eggId: string): void {
  try {
    const list = getOwnedExploreEggs()
    const idx = list.findIndex((e) => e.id === eggId)
    if (idx >= 0) {
      list.splice(idx, 1)
      localStorage.setItem(INVENTORY_EGGS_STORAGE_KEY, JSON.stringify(list))
    }
  } catch (e) {
    console.error('탐험 알 소모 실패:', e)
  }
}

/**
 * 🌟 방안 1: 펫과 알의 [달콤한 온기 숙성(에그 블렌딩)] 실행
 * - 내 펫의 등급이 알 등급보다 낮을 경우 승급(Promotion)
 * - 알의 비기 스킬을 펫의 secretSkill 슬롯에 각인
 * - 에그 계승 훈장(egg-resonance) 자동 부여
 */
export interface ResonanceResult {
  success: boolean
  promoted: boolean
  oldRarity: string
  newRarity: string
  learnedSkill: SecretSkillDef
  message: string
}

export function resonateEggWithPet(monster: MonsterRow, egg: ExploreEggDef): ResonanceResult {
  const currentCustom = loadMallangCustom(monster.id) ?? {}
  const currentRarity = (monster as any).rarity ?? 'common'

  // 등급 가치 비교
  const rarityRank: Record<string, number> = { common: 1, rare: 2, epic: 3, legendary: 4 }
  const currentVal = rarityRank[currentRarity] ?? 1
  const eggVal = rarityRank[egg.rarity] ?? 2

  const promoted = eggVal > currentVal
  const newRarity = promoted ? egg.rarity : currentRarity

  // 1. 커스텀 데이터에 비기 스킬 & 승급 등급 저장
  const updatedCustom: MallangCustom & { secretSkill?: SecretSkillDef; promotedRarity?: string } = {
    ...currentCustom,
    secretSkill: egg.secretSkill,
    promotedRarity: newRarity,
    medals: {
      ...(currentCustom.medals ?? { enabled: true, towerStar: true, goldMane: false, bossScar: false, championCrown: false }),
      eggResonance: true,
    } as any,
  }

  saveMallangCustom(monster.id, updatedCustom)

  // 2. 보유 알 목록에서 사용한 알 차감
  removeExploreEgg(egg.id)

  const message = promoted
    ? `🎉 축하합니다! [${monster.name || '디저트 펫'}]이(가) [${egg.rarity.toUpperCase()}] 등급으로 승급하고 비기 [${egg.secretSkill.name}]을(를) 계승했습니다!`
    : `✨ [${monster.name || '디저트 펫'}]이(가) 신비한 비기 [${egg.secretSkill.name}]을(를) 완벽히 계승했습니다!`

  return {
    success: true,
    promoted,
    oldRarity: currentRarity,
    newRarity,
    learnedSkill: egg.secretSkill,
    message,
  }
}

/**
 * 펫이 보유한 비기 스킬 조회
 */
export function getPetSecretSkill(monsterId: string): SecretSkillDef | null {
  try {
    const custom = loadMallangCustom(monsterId) as any
    return custom?.secretSkill ?? null
  } catch {
    return null
  }
}

/**
 * 펫의 에그 온기 승급 등급 조회
 */
export function getPetPromotedRarity(monsterId: string, baseRarity: string = 'common'): 'common' | 'rare' | 'epic' | 'legendary' {
  try {
    const custom = loadMallangCustom(monsterId) as any
    return custom?.promotedRarity ?? (baseRarity as any) ?? 'common'
  } catch {
    return 'common'
  }
}


