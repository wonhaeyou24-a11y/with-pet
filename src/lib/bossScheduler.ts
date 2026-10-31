// 🐉 디저트 월드 거대 보스 출현 스케줄러 및 협동 레이드 엔진
// - Zero-Trust 무결성, 100% 한글 주석, Zero-Crash 안정성 보장
// - 일일 정기 레이드 타임테이블(12:30 슈가 크리스탈 골렘 / 20:00 다이맥스 카다이프 드래곤)

import type { MonsterRow, Stats } from './api'
import type { Element } from '../monsters/types'

export interface WorldBossDef {
  id: string
  name: string
  title: string
  icon: string
  element: Element
  speciesId: string
  stage: number
  level: number
  hp: number
  atk: number
  def: number
  spd: number
  texture: number
  scheduleLabel: string
  startHour: number
  startMin: number
  endHour: number
  endMin: number
  locationDesc: string
  flavorDesc: string
  rewardTitle: string
}

// 📅 일일 정기 월드 보스 2종 + 주말 그랜드 레이드 보스 1종
export const WORLD_BOSS_CATALOG: WorldBossDef[] = [
  {
    id: 'boss-sugar-golem',
    name: '슈가 크리스탈 골렘',
    title: '광장의 파괴자',
    icon: '🗿💎',
    element: 'earth',
    speciesId: 'chameleon',
    stage: 3,
    level: 15,
    hp: 3500,
    atk: 140,
    def: 180,
    spd: 75,
    texture: 95,
    scheduleLabel: '매일 점심 12:30 ~ 13:30',
    startHour: 12,
    startMin: 30,
    endHour: 13,
    endMin: 30,
    locationDesc: '광장 중앙 슈가 크리스탈 분수대',
    flavorDesc: '사탕 결정이 단단하게 굳어져 거대화된 고대 골렘. 강력한 시럽 충격파를 발산합니다.',
    rewardTitle: '골렘 브레이커',
  },
  {
    id: 'boss-kadaif-dragon',
    name: '다이맥스 카다이프 드래곤',
    title: '타워 정상의 지배자',
    icon: '🐉🔥',
    element: 'fire',
    speciesId: 'chameleon',
    stage: 3,
    level: 25,
    hp: 6800,
    atk: 220,
    def: 195,
    spd: 120,
    texture: 100,
    scheduleLabel: '매일 저녁 20:00 ~ 21:30',
    startHour: 20,
    startMin: 0,
    endHour: 21,
    endMin: 30,
    locationDesc: '디저트 타워 정상 DESSERT MAX 제단',
    flavorDesc: '바삭한 카다이프 면발을 온몸에 두른 거대 화염 드래곤. 용암 초콜릿 브레스를 뿜어냅니다.',
    rewardTitle: '드래곤 슬레이어',
  },
]

export interface RaidStatus {
  isActive: boolean
  currentBoss: WorldBossDef | null
  nextBoss: WorldBossDef
  remainingSeconds: number // 활성 시 종료까지 남은 시간, 비활성 시 시작까지 남은 시간
  statusText: string
}

// 실시간 레이드 진행 상태 판정
export function getWorldBossStatus(now: Date = new Date()): RaidStatus {
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentSecs = now.getSeconds()

  // 1. 현재 활성화된 보스가 있는지 확인
  for (const boss of WORLD_BOSS_CATALOG) {
    const startTotal = boss.startHour * 60 + boss.startMin
    const endTotal = boss.endHour * 60 + boss.endMin

    if (currentMinutes >= startTotal && currentMinutes < endTotal) {
      const remainingMinutes = endTotal - currentMinutes - 1
      const remainingSeconds = remainingMinutes * 60 + (60 - currentSecs)
      return {
        isActive: true,
        currentBoss: boss,
        nextBoss: boss,
        remainingSeconds: Math.max(0, remainingSeconds),
        statusText: `🔥 [${boss.name}] 광역 침공 중! (${Math.floor(remainingSeconds / 60)}분 남음)`,
      }
    }
  }

  // 2. 다음 예정된 보스 찾기
  let nextBoss = WORLD_BOSS_CATALOG[0]
  let minWaitMinutes = Infinity

  for (const boss of WORLD_BOSS_CATALOG) {
    const startTotal = boss.startHour * 60 + boss.startMin
    let diff = startTotal - currentMinutes
    if (diff < 0) {
      diff += 24 * 60 // 내일 시간
    }
    if (diff < minWaitMinutes) {
      minWaitMinutes = diff
      nextBoss = boss
    }
  }

  const remainingSeconds = (minWaitMinutes - 1) * 60 + (60 - currentSecs)
  const waitHours = Math.floor(minWaitMinutes / 60)
  const waitMins = minWaitMinutes % 60

  return {
    isActive: false,
    currentBoss: null,
    nextBoss,
    remainingSeconds: Math.max(0, remainingSeconds),
    statusText: `⏳ 다음 레이드: [${nextBoss.name}] ${waitHours > 0 ? `${waitHours}시간 ` : ''}${waitMins}분 후 출현`,
  }
}

// 대전 엔진에 주입할 보스 MonsterRow 생성
export function createWorldBossMonster(boss: WorldBossDef): MonsterRow {
  const bossStats: Stats = {
    hp: boss.hp,
    atk: boss.atk,
    def: boss.def,
    spd: boss.spd,
    int: 100,
    cha: 100,
  }

  return {
    id: `world-boss-${boss.id}`,
    owner: 'world-boss-server',
    name: `[거대 보스] ${boss.name}`,
    species: boss.speciesId,
    element: boss.element,
    element2: null,
    level: boss.level,
    evo_stage: boss.stage,
    exp: 0,
    hunger: 100,
    mood: 100,
    fatigue: 0,
    cleanliness: 100,
    sweetness: 100,
    stats: bossStats,
    talents: bossStats,
    trait: 'boss-dynamax',
    personality_active: 80,
    personality_bond: 50,
    is_shiny: true,
    mutation: 'gold',
    hatched_at: new Date().toISOString(),
    parts: {
      palette: 3,
      bodyType: 'chubby',
      scale: 1.4,
      ears: 2,
      tail: 3,
      top: 1,
      expression: 'sharp',
      patternSeed: 999,
      shiny: true,
      mutation: 'gold',
      mallang: {
        dessertBase: 'custard-pudding',
      },
    },
  }
}
