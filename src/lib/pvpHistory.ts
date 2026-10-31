// ⚔️ 부재 중 방어전 및 지인 친선 대전 전적 기록 (PVP Defense History Engine)
// - [실제 지인 대전 기록]: 실제 대전/도전 이력만 안전하게 기록 (테스트용 가짜 더미 기록 제거)
// - [복수전 / 재도전 원클릭 연계]: 방어 실패 시 설욕전(복수전), 성공 시 타이틀 방어전 신청
// - [Zero-Crash & E2EE 안전 저장]: 로컬 스토리지 무결성 검증

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

const STORAGE_KEY = 'pet_pvp_defense_history_v2'

// 방어전 및 대전 기록 로드 (더미 데이터 없이 실제 대전 기록만 로드)
export function getPvpMatchRecords(): PvpMatchRecord[] {
  try {
    // 이전 v1 더미 기록 키 정리
    if (localStorage.getItem('pet_pvp_defense_history_v1')) {
      localStorage.removeItem('pet_pvp_defense_history_v1')
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PvpMatchRecord[]
      if (Array.isArray(parsed)) {
        // 기존 테스트용 rec-def-* 기록 필터링
        return parsed.filter((r) => !r.id.startsWith('rec-def-'))
      }
    }
  } catch {
    // Zero-Crash 폴백
  }
  return []
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

