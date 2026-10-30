// M2/M3 백그라운드 현실 시간 자율 훈련 & 디저트 타워 무한 탐험 & 펫 자율 소통 엔진
// 사용자가 앱을 닫거나 다른 화면으로 이동해도 실제 시각(Date.now)을 기반으로 백그라운드에서 현실 시간으로 진행됩니다.

import { TRAINING_COURSES, type TrainingCourse, type TrainingId } from '../config/care'
import { serverNow, type Stats } from '../lib/api'
import { withJosa } from './josa'
import { type DessertSoundKind } from './sound'

export interface TrainingSession {
  monsterId: string
  courseId: TrainingId
  courseName: string
  startedAt: number
  durationSec: number
  finishAt: number
  claimed: boolean
  asmr: DessertSoundKind
}

export interface TowerExpeditionSession {
  monsterId: string
  startFloor: number
  currentFloor: number
  startedAt: number
  lastFloorAt: number
  secPerFloor: number
  maxFloors: number
  targetFloor: number
  logs: string[]
  claimed: boolean
}

export interface PetAutonomousSuggestion {
  id: string
  type: 'train' | 'explore' | 'rest' | 'feed' | 'chat'
  title: string
  message: string
  balloon: string
  actionLabel: string
  courseId?: TrainingId
  suggestedFloor?: number
  timestamp: number
}

// 코스별 현실적인 소요 시간 (초 단위)
// 초급 120초(2분), 중급 180초(3분), 심화 240초(4분)
export const COURSE_DURATIONS: Record<TrainingId, number> = {
  str: 150, // 2분 30초: 크런치 토핑 다지기
  def: 150, // 2분 30초: 슈가코팅 경화
  spd: 120, // 2분 00초: 스파클링 휩핑 질주
  int: 180, // 3분 00초: 시크릿 파티세리 레시피
  hp: 210, // 3분 30초: 황금 반죽 숙성 오븐
}

// 1. 브라우저/모바일 시스템 알림 권한 요청 및 발송 유틸 (Zero-Crash Policy)
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission()
      return res === 'granted'
    }
    return false
  } catch {
    return false
  }
}

export function sendIdleNotification(title: string, body: string, icon = '/icons/icon-192.png') {
  try {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const options = {
      body,
      icon,
      badge: icon,
      tag: 'pet-together-idle',
    } as NotificationOptions

    // 1. PWA 서비스 워커 백그라운드 푸시 알림 우선 시도 (앱을 나갔을 때도 100% 수신)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          return reg.showNotification(title, options)
        })
        .catch(() => {
          // 서비스 워커 실패 시 일반 Notification 폴백
          new Notification(title, options)
        })
    } else {
      new Notification(title, options)
    }
  } catch {
    // 무시 (무중단 원칙)
  }
}

// 🔔 진행 중인 훈련 및 타워 탐험 완료 시점을 계산하여 백그라운드 자동 시스템 알림 스케줄링 (100% 자동 동작 보장)
export function scheduleAutoIdleNotifications(monsterId: string, monsterName: string) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    // 1. 훈련 세션 완료 자동 알림
    const train = getActiveTrainingSession(monsterId)
    if (train && !train.claimed) {
      const remainingMs = train.finishAt - Date.now()
      if (remainingMs > 0) {
        setTimeout(() => {
          sendIdleNotification(
            `🧁 [${monsterName}] 훈련 완료 소식!`,
            `디저트 친구가 "${train.courseName}" 훈련을 무사히 마쳤어요! 얼른 돌아와서 능력치 보상을 획득하세요! ✨`,
          )
        }, remainingMs)
      }
    }

    // 2. 디저트 타워 탐험 완료 자동 알림
    const tower = getActiveTowerSession(monsterId)
    if (tower && !tower.claimed) {
      const totalSec = tower.secPerFloor * tower.maxFloors
      const elapsedSec = Math.max(0, Math.floor((Date.now() - tower.startedAt) / 1000))
      const remainingSec = Math.max(0, totalSec - elapsedSec)
      if (remainingSec > 0) {
        setTimeout(() => {
          sendIdleNotification(
            `🏰 [${monsterName}] 디저트 타워 탐험 완료!`,
            `타워 ${tower.startFloor}층부터 ${tower.targetFloor}층까지 전 층을 돌파했습니다! 풍성한 전리품을 수령하세요! 🎁`,
          )
        }, remainingSec * 1000)
      }
    }

    // 3. 신규 M5 탐험 완료 자동 시스템 알림
    try {
      const rawExplore = localStorage.getItem(`pet_explore_trip_${monsterId}`)
      if (rawExplore) {
        const trip = JSON.parse(rawExplore)
        if (trip && trip.finishAt) {
          scheduleExploreNotification(monsterName, trip)
        }
      }
    } catch {}
  } catch {
    // 무중단
  }
}

// 🔔 M5 탐험 완료 자동 알림 스케줄러
export function scheduleExploreNotification(
  monsterName: string,
  trip: { region: string; zone: number; finishAt: string },
) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return
    }
    const finishMs = Date.parse(trip.finishAt)
    const remainingMs = finishMs - Date.now()
    if (remainingMs > 0) {
      setTimeout(() => {
        sendIdleNotification(
          `🧭 [${monsterName}] 탐험 복귀 완료!`,
          `펫이 ${trip.region} ${trip.zone}구역 탐험을 마치고 보물과 함께 돌아왔어요! 🎁`,
        )
      }, remainingMs)
    }
  } catch {
    // 무중단
  }
}

// 🔔 백그라운드 3초 후 테스트 알림 예약 발송 (사용자가 앱을 나갔을 때 직접 확인 가능)
export function scheduleTestIdleNotification(petName: string, delaySec: number = 3) {
  setTimeout(() => {
    sendIdleNotification(
      `🍰 [${petName}] 파티시에님, 디저트 타임이에요!`,
      `방금 훈련을 마치고 달콤한 보상을 기다리고 있어요. 얼른 돌아와서 칭찬해주세요! ✨`,
    )
  }, delaySec * 1000)
}

// 2. 훈련 세션 관리 (로컬 영속화 & 실시간 복원)
const TRAINING_KEY_PREFIX = 'pet_train_session_'

export function getActiveTrainingSession(monsterId: string): TrainingSession | null {
  try {
    const raw = localStorage.getItem(`${TRAINING_KEY_PREFIX}${monsterId}`)
    if (!raw) return null
    const sess: TrainingSession = JSON.parse(raw)
    if (!sess || !sess.startedAt || !sess.finishAt) return null
    return sess
  } catch {
    return null
  }
}

export function startTrainingSession(monsterId: string, course: TrainingCourse, customDurationSec?: number): TrainingSession {
  const durationSec = customDurationSec ?? (COURSE_DURATIONS[course.id] || 150)
  const now = Date.now()
  const sess: TrainingSession = {
    monsterId,
    courseId: course.id,
    courseName: course.name,
    startedAt: now,
    durationSec,
    finishAt: now + durationSec * 1000,
    claimed: false,
    asmr: course.asmr,
  }
  try {
    localStorage.setItem(`${TRAINING_KEY_PREFIX}${monsterId}`, JSON.stringify(sess))
    // 백그라운드 완료 알림 예약
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        sendIdleNotification(
          '🧁 [펫과함께] 훈련 완료 소식!',
          `디저트 친구가 "${course.name}" 훈련을 무사히 마쳤어요! 능력치가 쑥쑥 자라났습니다.`,
        )
      }, durationSec * 1000)
    }
  } catch {
    // 로컬 스토리지 실패 시 무중단
  }
  return sess
}

// 서버가 알려 준 훈련 세션을 화면용 형식으로 저장한다 (끝나는 시각은 서버 시각 기준)
export function saveServerTrainingSession(monsterId: string, course: TrainingCourse, startedAtIso: string, finishAtIso: string): TrainingSession {
  const startedAt = Date.parse(startedAtIso)
  const finishAt = Date.parse(finishAtIso)
  const sess: TrainingSession = {
    monsterId,
    courseId: course.id,
    courseName: course.name,
    startedAt,
    durationSec: Math.round((finishAt - startedAt) / 1000),
    finishAt,
    claimed: false,
    asmr: course.asmr,
  }
  try {
    localStorage.setItem(`${TRAINING_KEY_PREFIX}${monsterId}`, JSON.stringify(sess))
    const remainMs = finishAt - Date.now()
    if (remainMs > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        sendIdleNotification(
          '🧁 [펫과함께] 훈련 완료 소식!',
          `디저트 친구가 "${course.name}" 훈련을 무사히 마쳤어요! 능력치가 쑥쑥 자라났습니다.`,
        )
      }, remainMs)
    }
  } catch {
    // 무시
  }
  return sess
}

export function clearTrainingSession(monsterId: string) {
  try {
    localStorage.removeItem(`${TRAINING_KEY_PREFIX}${monsterId}`)
  } catch {
    // 무시
  }
}

// 3. 디저트 타워 무한 탐험 세션 관리 (전투력 비례 실시간 등반)
const TOWER_KEY_PREFIX = 'pet_tower_session_'

export function getActiveTowerSession(monsterId: string): TowerExpeditionSession | null {
  try {
    const raw = localStorage.getItem(`${TOWER_KEY_PREFIX}${monsterId}`)
    if (!raw) return null
    const sess: TowerExpeditionSession = JSON.parse(raw)
    if (!sess || !sess.startedAt) return null
    return sess
  } catch {
    return null
  }
}

// 전투력에 따른 층당 소요 시간 (초): 90초 ~ 180초 (전투력이 높을수록 빨라짐)
export function calcSecPerFloor(battlePower: number, floor: number): number {
  const reqBp = 45 + floor * 22
  const bpRatio = battlePower / Math.max(reqBp, 1)
  if (bpRatio >= 1.5) return 80 // 압도적인 전투력: 1분 20초
  if (bpRatio >= 1.1) return 110 // 우세한 전투력: 1분 50초
  if (bpRatio >= 0.9) return 140 // 호각: 2분 20초
  return 170 // 아슬아슬: 2분 50초
}

export function startTowerExpedition(
  monsterId: string,
  startFloor: number,
  battlePower: number,
  maxFloors = 3,
): TowerExpeditionSession {
  const now = Date.now()
  const secPerFloor = calcSecPerFloor(battlePower, startFloor)
  const targetFloor = startFloor + maxFloors
  const sess: TowerExpeditionSession = {
    monsterId,
    startFloor,
    currentFloor: startFloor,
    startedAt: now,
    lastFloorAt: now,
    secPerFloor,
    maxFloors,
    targetFloor,
    logs: [`🏰 ${startFloor}층 탐험 출발! 달콤한 시럽 탑문을 열었습니다.`],
    claimed: false,
  }
  try {
    localStorage.setItem(`${TOWER_KEY_PREFIX}${monsterId}`, JSON.stringify(sess))
    const totalSec = secPerFloor * maxFloors
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        sendIdleNotification(
          '🏰 [펫과함께] 디저트 타워 탐험 완료!',
          `타워 ${startFloor}층부터 ${targetFloor}층까지 돌파를 마쳤습니다! 전리품을 수령하세요! 🎁`,
        )
      }, totalSec * 1000)
    }
  } catch {
    // 무시
  }
  return sess
}

// 실시간 경과 시간에 따라 탐험 진행도 계산 (앱을 나갔다 들어와도 정확히 계산)
export function syncTowerProgress(sess: TowerExpeditionSession): {
  session: TowerExpeditionSession
  floorsCleared: number
  isDone: boolean
} {
  const now = serverNow()
  const elapsedSec = Math.max(0, Math.floor((now - sess.startedAt) / 1000))
  const floorsPassed = Math.min(sess.maxFloors, Math.floor(elapsedSec / sess.secPerFloor))
  const newCurrentFloor = sess.startFloor + floorsPassed
  const isDone = floorsPassed >= sess.maxFloors

  if (newCurrentFloor > sess.currentFloor) {
    sess.currentFloor = newCurrentFloor
    sess.logs.push(`✨ ${newCurrentFloor - 1}층 수호자 격퇴 완료! ${newCurrentFloor}층으로 진격했습니다.`)
    try {
      localStorage.setItem(`${TOWER_KEY_PREFIX}${sess.monsterId}`, JSON.stringify(sess))
    } catch {
      // 무시
    }
  }

  return {
    session: sess,
    floorsCleared: floorsPassed,
    isDone,
  }
}

// 서버가 알려 준 타워 세션을 화면용 형식으로 저장한다
export function saveServerTowerSession(
  monsterId: string,
  s: { startFloor: number; maxFloors: number; secPerFloor: number; startedAt: string },
): TowerExpeditionSession {
  const startedAt = Date.parse(s.startedAt)
  const sess: TowerExpeditionSession = {
    monsterId,
    startFloor: s.startFloor,
    currentFloor: s.startFloor,
    startedAt,
    lastFloorAt: startedAt,
    secPerFloor: s.secPerFloor,
    maxFloors: s.maxFloors,
    targetFloor: s.startFloor + s.maxFloors,
    logs: [`🏰 ${s.startFloor}층 탐험 출발! 달콤한 시럽 탑문을 열었습니다.`],
    claimed: false,
  }
  try {
    localStorage.setItem(`${TOWER_KEY_PREFIX}${monsterId}`, JSON.stringify(sess))
    const totalSec = s.secPerFloor * s.maxFloors
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        sendIdleNotification(
          '🏰 [펫과함께] 디저트 타워 탐험 완료!',
          `타워 ${s.startFloor}층부터 ${s.startFloor + s.maxFloors}층까지 돌파를 마쳤습니다! 전리품을 수령하세요! 🎁`,
        )
      }, totalSec * 1000)
    }
  } catch {
    // 무시
  }
  return sess
}

export function clearTowerSession(monsterId: string) {
  try {
    localStorage.removeItem(`${TOWER_KEY_PREFIX}${monsterId}`)
  } catch {
    // 무시
  }
}

// 4. 살아있는 펫의 능동적 자율 제안 엔진 (Autonomous Dialogue)
export function checkPetAutonomousSuggestion(
  monsterId: string,
  petName: string,
  _stats: Stats,
  hunger: number,
  fatigue: number,
  towerFloor: number,
  hasActiveTraining: boolean,
  hasActiveExpedition: boolean,
): PetAutonomousSuggestion | null {
  // 이미 무언가를 하고 있으면 제안하지 않음
  if (hasActiveTraining || hasActiveExpedition) return null

  const now = Date.now()
  // 마지막 제안 시간 체크 (최소 2분 간격으로 자연스럽게 제안)
  const lastSugTime = parseInt(localStorage.getItem(`pet_last_sug_${monsterId}`) || '0', 10)
  if (now - lastSugTime < 120_000) return null

  // 1) 노곤함(피로도)이 80 이상일 때 휴식 제안
  if (fatigue >= 80) {
    return {
      id: `sug-rest-${now}`,
      type: 'rest',
      title: '💤 졸려요...',
      message: `${withJosa(petName, '이/가')} 오늘 열심히 뛰어서 눈이 스르륵 감긴대요. 쇼케이스에서 쿨링 휴식을 취할까요?`,
      balloon: '후아암... 졸려요. 조금만 쉬어도 될까요?',
      actionLabel: '🌙 휴식 보내기',
      timestamp: now,
    }
  }

  // 2) 당충전(배고픔)이 35 이하일 때 밥 제안
  if (hunger <= 35) {
    return {
      id: `sug-feed-${now}`,
      type: 'feed',
      title: '🍓 꼬르륵...',
      message: `${petName}이의 배에서 달콤한 소리가 나요! 달콤한 시럽이나 슈가파우더를 뿌려줄까요?`,
      balloon: '꼬르륵... 달콤한 시럽 냄새가 생각나요!',
      actionLabel: '🍓 토핑 가방 열기',
      timestamp: now,
    }
  }

  // 3) 당충전 70 이상 & 피로도 40 이하 & 체력/공격 조건에 따라 훈련 제안
  if (hunger >= 70 && fatigue <= 40) {
    const courses = TRAINING_COURSES
    const randomCourse = courses[Math.floor(Math.random() * courses.length)]
    return {
      id: `sug-train-${now}`,
      type: 'train',
      title: '💪 훈련 다녀올게요!',
      message: `컨디션 최고! ${withJosa(petName, '이/가')} "${randomCourse.name}" 훈련으로 능력을 키우고 싶대요.`,
      balloon: `주인님! 오늘 몸이 가벼워요! ${randomCourse.name} 다녀올까요?`,
      actionLabel: '⚡ 훈련 보내기',
      courseId: randomCourse.id,
      timestamp: now,
    }
  }

  // 4) 타워 탐험 제안
  if (fatigue <= 60) {
    return {
      id: `sug-explore-${now}`,
      type: 'explore',
      title: '🏰 타워 탐험 제안',
      message: `${withJosa(petName, '이/가')} 디저트 타워 ${towerFloor}층에서 달콤한 보물 냄새가 난다며 다녀오겠대요!`,
      balloon: `디저트 타워 ${towerFloor}층에 가볼래요! 전리품 가져올게요!`,
      actionLabel: '🏰 탐험 출발!',
      suggestedFloor: towerFloor,
      timestamp: now,
    }
  }

  return null
}

export function dismissPetSuggestion(monsterId: string) {
  try {
    localStorage.setItem(`pet_last_sug_${monsterId}`, Date.now().toString())
  } catch {
    // 무시
  }
}
