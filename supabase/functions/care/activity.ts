// M2 2단계: 훈련·디저트 타워의 서버 판정용 순수 계산 (DB·네트워크 없음).
// 시간 검사(끝났는지), 훈련 등급 굴림, 타워 층 수·보상, 하루 상한을 여기서만 정한다.
// 수치는 기획서 초안이므로 이 파일의 ACTIVITY 표에서만 고친다. scripts/test-care.mjs 가 같은 코드를 검증한다.

import { applyExpAndLevelUp, type CareState, type Stats } from './logic.ts'

export const ACTIVITY = {
  // 훈련 코스별 걸리는 시간 (초)
  trainSeconds: { str: 150, def: 150, spd: 120, int: 180, hp: 210 } as Record<string, number>,
  // 훈련 등급 확률 (합 1). 등급은 서버가 굴리고 폰이 보낸 값은 믿지 않는다.
  gradeWeights: { perfect: 0.5, great: 0.35, normal: 0.15 },
  // 하루(한국 시각 기준)에 훈련·타워로 받을 수 있는 코인 상한. 넘으면 코인만 0이 되고 경험치·능력치는 그대로 오른다.
  dailyCoinCap: 400,
  tower: {
    maxFloors: 3, // 한 번 출발에 오르는 층 수
    dailyEntries: 3, // 하루 입장 횟수 (기획서: 시련의 탑 기준 하루 3회)
    fatigueBlock: 80, // 이 이상 노곤하면 출발 불가
    fatiguePerFloor: 12,
  },
}

export type Grade = 'normal' | 'great' | 'perfect'

// 같은 시드면 같은 결과 (리플레이·검증용)
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rollGrade(seed: number): Grade {
  const r = mulberry32(seed)()
  const w = ACTIVITY.gradeWeights
  if (r < w.perfect) return 'perfect'
  if (r < w.perfect + w.great) return 'great'
  return 'normal'
}

// 끝났는지 서버 시각으로 판정. 남은 시간(초)도 함께 돌려준다.
export function remainingSeconds(finishAt: string, now: Date) {
  return Math.max(0, Math.ceil((Date.parse(finishAt) - now.getTime()) / 1000))
}

export const battlePower = (s: Stats) => Math.round(s.hp * 0.5 + s.atk + s.def + s.spd + s.int + s.cha * 0.8)

// 타워 층 정보 (클라이언트 표시와 같은 식)
export function towerFloorInfo(floor: number) {
  return {
    floor,
    reqCp: 45 + floor * 22,
    rewardExp: 25 + floor * 15,
    rewardCoins: 20 + floor * 8,
  }
}

// 전투력이 높을수록 한 층에 걸리는 시간이 짧다 (초)
export function towerSecPerFloor(power: number, floor: number): number {
  const ratio = power / Math.max(towerFloorInfo(floor).reqCp, 1)
  if (ratio >= 1.5) return 80
  if (ratio >= 1.1) return 110
  if (ratio >= 0.9) return 140
  return 170
}

// 지금까지 지난 층 수 (끝까지 가면 maxFloors)
export function towerFloorsCleared(startedAt: string, secPerFloor: number, maxFloors: number, now: Date) {
  const elapsed = Math.max(0, Math.floor((now.getTime() - Date.parse(startedAt)) / 1000))
  return Math.min(maxFloors, Math.floor(elapsed / Math.max(1, secPerFloor)))
}

// 오늘 더 받을 수 있는 코인
export function coinRoomToday(earnedToday: number) {
  return Math.max(0, ACTIVITY.dailyCoinCap - Math.max(0, earnedToday))
}

export type TowerClaim =
  | {
      ok: true
      state: CareState
      leveledUp: boolean
      floorsCleared: number
      expGain: number
      coinsGain: number
      coinsCut: number
      message: string
    }
  | { ok: false; code: string; message: string }

// 타워에서 돌아와 보상을 받는다. 층마다 경험치·코인을 더하고 피로를 쌓는다 (능력치는 깎이지 않는다).
export function applyTowerClaim(s: CareState, startFloor: number, floorsCleared: number, coinRoom: number): TowerClaim {
  if (floorsCleared < 1) return { ok: false, code: 'not_yet', message: '아직 첫 층도 오르지 못했어요. 조금만 더 기다려 주세요!' }

  let exp = 0
  let coins = 0
  for (let f = startFloor; f < startFloor + floorsCleared; f++) {
    const info = towerFloorInfo(f)
    exp += info.rewardExp
    coins += info.rewardCoins
  }
  const granted = Math.min(coins, coinRoom)

  const next: CareState = { ...s, stats: { ...s.stats }, careCounts: { ...s.careCounts } }
  next.fatigue = Math.min(100, s.fatigue + floorsCleared * ACTIVITY.tower.fatiguePerFloor)
  next.careCounts.tower = (next.careCounts.tower ?? 0) + floorsCleared
  next.coins += granted

  const lv = applyExpAndLevelUp(next, exp)
  Object.assign(next, { level: lv.level, exp: lv.exp, sp: lv.sp, stats: lv.stats })

  const cut = coins - granted
  return {
    ok: true,
    state: next,
    leveledUp: lv.leveledUp,
    floorsCleared,
    expGain: exp,
    coinsGain: granted,
    coinsCut: cut,
    message:
      `🏰 ${floorsCleared}개 층 돌파 복귀! EXP +${exp} · 🪙 +${granted} 코인` +
      (cut > 0 ? ' (오늘 코인 한도에 도달해서 일부는 내일 받아요!)' : ''),
  }
}
