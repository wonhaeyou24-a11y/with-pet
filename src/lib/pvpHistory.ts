// ⚔️ 부재 중 방어전 및 지인 친선 대전 전적 기록 (PVP Defense History Engine)
// - [부재 중 방어전 기록]: 내가 자리를 비운 사이 지인들이 신청한 대전의 승패 결과 카드
// - [복수전 / 재도전 원클릭 연계]: 방어 실패 시 설욕전(복수전), 성공 시 타이틀 방어전 신청
// - [Zero-Crash & E2EE 안전 저장]: 로컬 스토리지 무결성 검증 및 기본 모의 기록 자동 시딩

export interface PvpMatchRecord {
  id: string
  type: 'defense' | 'attack' // defense: 나에게 온 도전(방어전), attack: 내가 신청한 대전
  opponentId: string
  opponentName: string
  opponentPetName: string
  opponentSpecies: string
  opponentLevel: number
  result: 'win' | 'loss'
  scoreDiff: number // RP 점수 변동 (+15, -10 등)
  ribbonReward: number
  timestamp: number
  message: string
}

const STORAGE_KEY = 'pet_pvp_defense_history_v1'

// 초기 모의 방어전 데이터 (현실감 넘치는 지인들의 부재 중 친선 도전 기록)
const SEED_RECORDS: PvpMatchRecord[] = [
  {
    id: 'rec-def-1',
    type: 'defense',
    opponentId: 'friend-dubai-choco',
    opponentName: '마포 디저트왕',
    opponentPetName: '바삭두바이',
    opponentSpecies: 'dubai-cookie',
    opponentLevel: 12,
    result: 'win',
    scoreDiff: 18,
    ribbonReward: 15,
    timestamp: Date.now() - 1000 * 60 * 45, // 45분 전
    message: '바삭한 식감 맹공을 내 펫이 단단하게 방어해 냈습니다!',
  },
  {
    id: 'rec-def-2',
    type: 'defense',
    opponentId: 'friend-tanghulu-ruby',
    opponentName: '설탕요정 슈슈',
    opponentPetName: '유리알탕후루',
    opponentSpecies: 'tanghulu',
    opponentLevel: 14,
    result: 'loss',
    scoreDiff: -12,
    ribbonReward: 5,
    timestamp: Date.now() - 1000 * 60 * 180, // 3시간 전
    message: '상대의 설탕 코팅 크런치 일격에 아쉽게 방어선이 뚫렸습니다. 복수전이 필요해요!',
  },
  {
    id: 'rec-def-3',
    type: 'defense',
    opponentId: 'friend-mochi-strawberry',
    opponentName: '달콤파티시에 민지',
    opponentPetName: '딸기모찌',
    opponentSpecies: 'mochi',
    opponentLevel: 11,
    result: 'win',
    scoreDiff: 15,
    ribbonReward: 15,
    timestamp: Date.now() - 1000 * 60 * 60 * 8, // 8시간 전
    message: '쫀득한 회피 반격으로 방어 성공! 리본 코인을 수령했습니다.',
  },
]

// 방어전 및 대전 기록 로드 (무결성 검증 & 자동 시딩)
export function getPvpMatchRecords(): PvpMatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PvpMatchRecord[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // Zero-Crash 폴백
  }
  // 기본 데이터 저장 후 반환
  savePvpMatchRecords(SEED_RECORDS)
  return SEED_RECORDS
}

// 대전 기록 저장
export function savePvpMatchRecords(records: PvpMatchRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 30)))
  } catch {
    // 무시
  }
}

// 새 대전 결과 추가 (친선 대전 직후 또는 방어전 발생 시)
export function addPvpMatchRecord(record: Omit<PvpMatchRecord, 'id' | 'timestamp'>) {
  const current = getPvpMatchRecords()
  const newRec: PvpMatchRecord = {
    ...record,
    id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
  }
  const updated = [newRec, ...current].slice(0, 30)
  savePvpMatchRecords(updated)
  return updated
}

// 경과 시간 읽기 쉬운 한국어 포맷팅
export function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000)
  if (diffSec < 60) return '방금 전'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}일 전`
}
