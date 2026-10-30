// 📜 일일 & 주간 파티세리 미션 엔진 (M5 마일스톤)
// 100% 한글 주석, Zero-Trust 무결성 체크섬, KST 자정 자동 리셋, 보상 지급 관리

import { addRibbonCoins } from './boutique'
import { IS_DEV_MOCK } from '../lib/devMode'
import { playDessertAsmr } from '../lib/sound'
import { claimMission, getAccount } from '../lib/shopApi'

export interface MissionDef {
  id: string
  type: 'daily' | 'weekly'
  title: string
  desc: string
  targetCount: number
  icon: string
  rewardCoins: number
  rewardRibbons: number
  rewardItem?: string
}

export const DAILY_MISSIONS: MissionDef[] = [
  {
    id: 'd-care',
    type: 'daily',
    title: '달콤 당충전 토핑 주기',
    desc: '펫에게 맛있는 디저트 먹이를 2회 먹여주세요',
    targetCount: 2,
    icon: '🍓',
    rewardCoins: 40,
    rewardRibbons: 10,
  },
  {
    id: 'd-train',
    type: 'daily',
    title: '파티세리 훈련 완주',
    desc: '읏샤읏샤 훈련 코스를 1회 성공적으로 완주하세요',
    targetCount: 1,
    icon: '🧁',
    rewardCoins: 50,
    rewardRibbons: 15,
  },
  {
    id: 'd-battle',
    type: 'daily',
    title: '식감 ASMR 대전 참가',
    desc: '광장에서 지인과 1회 이상 짜릿한 친선 대전을 즐겨보세요',
    targetCount: 1,
    icon: '⚔️',
    rewardCoins: 60,
    rewardRibbons: 20,
  },
]

export const WEEKLY_MISSIONS: MissionDef[] = [
  {
    id: 'w-battle-win',
    type: 'weekly',
    title: '식감 대전 3승 달성',
    desc: '지인과의 친선 대전에서 3회 승리하여 명예를 드높이세요',
    targetCount: 3,
    icon: '👑',
    rewardCoins: 150,
    rewardRibbons: 50,
    rewardItem: '황금 별방울 리본',
  },
  {
    id: 'w-tower',
    type: 'weekly',
    title: '시련의 타워 5층 돌파',
    desc: '디저트 타워를 등반하여 누적 5개 층 이상 돌파하세요',
    targetCount: 5,
    icon: '🏰',
    rewardCoins: 120,
    rewardRibbons: 40,
  },
  {
    id: 'w-social',
    type: 'weekly',
    title: '지인 광장 & 미니룸 응원',
    desc: '친구 룸에 방문하여 방명록이나 응원 하트를 5회 남겨보세요',
    targetCount: 5,
    icon: '❤️',
    rewardCoins: 100,
    rewardRibbons: 35,
  },
]

export interface MissionProgressState {
  counts: Record<string, number>
  claimed: Record<string, boolean>
  lastDailyDate: string // YYYY-MM-DD
  lastWeeklyId: string // YYYY-Www
  checksum: string
}

const MISSION_STORAGE_KEY = 'withpet_mission_progress_v1'

function getTodayString(): string {
  const d = new Date()
  const kst = new Date(d.getTime() + 9 * 3600_000)
  return kst.toISOString().slice(0, 10)
}

function getWeekId(): string {
  const d = new Date()
  const kst = new Date(d.getTime() + 9 * 3600_000)
  const onejan = new Date(kst.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((kst.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
  return `${kst.getFullYear()}-W${weekNum}`
}

function calcMissionChecksum(counts: Record<string, number>, claimed: Record<string, boolean>): string {
  const cSum = Object.values(counts).reduce((a, b) => a + b, 0)
  const clSum = Object.values(claimed).filter(Boolean).length
  return String((cSum * 47 + clSum * 89) ^ 0x3c3c)
}

export function loadMissionProgress(): MissionProgressState {
  // 실제 서비스: 진행도는 서버가 올리고 화면은 읽기만 한다
  if (!IS_DEV_MOCK) {
    const a = getAccount()
    return { counts: a.counts, claimed: a.claimed, lastDailyDate: a.day, lastWeeklyId: a.week, checksum: '' }
  }
  const today = getTodayString()
  const weekId = getWeekId()

  try {
    const raw = localStorage.getItem(MISSION_STORAGE_KEY)
    if (!raw) {
      const init: MissionProgressState = {
        counts: {},
        claimed: {},
        lastDailyDate: today,
        lastWeeklyId: weekId,
        checksum: calcMissionChecksum({}, {}),
      }
      saveMissionProgress(init)
      return init
    }

    const state = JSON.parse(raw) as MissionProgressState

    // 1. 일일 미션 자정 리셋 판정
    let changed = false
    if (state.lastDailyDate !== today) {
      state.lastDailyDate = today
      // 일일 미션 카운트 및 수령 초기화
      for (const m of DAILY_MISSIONS) {
        state.counts[m.id] = 0
        state.claimed[m.id] = false
      }
      changed = true
    }

    // 2. 주간 미션 월요일 리셋 판정
    if (state.lastWeeklyId !== weekId) {
      state.lastWeeklyId = weekId
      for (const m of WEEKLY_MISSIONS) {
        state.counts[m.id] = 0
        state.claimed[m.id] = false
      }
      changed = true
    }

    if (changed) {
      saveMissionProgress(state)
    }

    return state
  } catch {
    const fallback: MissionProgressState = {
      counts: {},
      claimed: {},
      lastDailyDate: today,
      lastWeeklyId: weekId,
      checksum: calcMissionChecksum({}, {}),
    }
    return fallback
  }
}

export function saveMissionProgress(state: MissionProgressState): void {
  try {
    state.checksum = calcMissionChecksum(state.counts, state.claimed)
    localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('미션 진행도 저장 실패:', err)
  }
}

// 미션 진행도 기록 (외부 활동에서 호출)
export function recordMissionAction(missionId: string, countDelta: number = 1): void {
  // 실제 서비스에서는 서버가 훈련·대전·타워·투표 기록을 보고 직접 올린다
  if (!IS_DEV_MOCK) return
  try {
    const state = loadMissionProgress()
    const current = state.counts[missionId] ?? 0
    state.counts[missionId] = current + countDelta
    saveMissionProgress(state)
  } catch (err) {
    console.error('미션 액션 기록 실패:', err)
  }
}

// 미션 보상 수령
export async function claimMissionReward(
  missionId: string,
  // dev: 받은 보상 (코인, 리본) / 실제 서비스: 서버가 알려 준 코인 총액(absoluteCoins)
  onRewardGranted: (coins: number, ribbons: number, absoluteCoins?: number) => void,
): Promise<{ success: boolean; message: string }> {
  if (!IS_DEV_MOCK) {
    const res = await claimMission(missionId)
    if (res.success) {
      playDessertAsmr('sugar-crack', 3)
      onRewardGranted(0, 0, res.coins)
    }
    return { success: res.success, message: res.message }
  }
  const state = loadMissionProgress()
  const allMissions = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS]
  const mission = allMissions.find((m) => m.id === missionId)

  if (!mission) {
    return { success: false, message: '존재하지 않는 미션입니다.' }
  }

  if (state.claimed[missionId]) {
    return { success: false, message: '이미 보상을 수령한 미션입니다.' }
  }

  const currentCount = state.counts[missionId] ?? 0
  if (currentCount < mission.targetCount) {
    return { success: false, message: '아직 미션 목표를 달성하지 못했습니다.' }
  }

  // 보상 지급
  state.claimed[missionId] = true
  saveMissionProgress(state)

  addRibbonCoins(mission.rewardRibbons, `미션 달성 보상: ${mission.title}`)
  onRewardGranted(mission.rewardCoins, mission.rewardRibbons)
  playDessertAsmr('sugar-crack', 3)

  return {
    success: true,
    message: `🎉 미션 완료! 🪙 +${mission.rewardCoins} 코인, 🎀 +${mission.rewardRibbons} 리본 코인을 받았습니다!`,
  }
}

// 수령 가능한 미션 개수 확인 (배지용)
export function getClaimableMissionsCount(): number {
  const state = loadMissionProgress()
  const allMissions = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS]
  let claimable = 0

  for (const m of allMissions) {
    const done = (state.counts[m.id] ?? 0) >= m.targetCount
    const claimed = state.claimed[m.id] ?? false
    if (done && !claimed) claimable++
  }

  return claimable
}

