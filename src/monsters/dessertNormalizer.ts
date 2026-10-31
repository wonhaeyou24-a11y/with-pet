// 디저트 펫 단일 정규화 및 안전 보정 유틸리티
// 구버전 종족이나 알 수 없는 문자열이 들어와도 언제나 사랑스러운 8대 디저트 펫으로 안전하게 변환합니다.

export type DessertSpeciesId =
  | 'mochi'          // 쫀득 찹쌀떡 모찌 (시그니처)
  | 'dubai-cookie'  // 두바이 쫀득쿠키 & 황금 카다이프
  | 'pudding'       // 말랑 커스터드 푸딩
  | 'jelly'         // 쫀득 구미 젤리베어
  | 'smore'         // 구운 스모어 마시멜로
  | 'choco'         // 달콤 퐁듀 초코
  | 'wax-ball'      // 톡톡 과즙 왁싱볼
  | 'tanghulu'      // 유리알 설탕 탕후루
  | 'chameleon'     // 만능 모찌 카멜레온

export const VALID_DESSERT_SPECIES: DessertSpeciesId[] = [
  'mochi',
  'dubai-cookie',
  'pudding',
  'jelly',
  'smore',
  'choco',
  'wax-ball',
  'tanghulu',
  'chameleon',
]

// 구버전 레거시 종족 -> 최신 디저트 펫 1:1 매핑 테이블
const LEGACY_SPECIES_MAP: Record<string, DessertSpeciesId> = {
  mongsil: 'mochi',          // 몽실(구름) -> 폭신 쫀득 찹쌀떡 모찌
  kongkong: 'dubai-cookie',  // 콩콩(도토리) -> 바삭 두바이 쫀득쿠키
  byeolbineul: 'jelly',      // 별비늘(드래곤) -> 영롱한 별빛 젤리베어
  heugyeom: 'choco',         // 흑염(불꽃) -> 진한 다크 퐁듀 초코
  beongaekkori: 'wax-ball',  // 번개꼬리 -> 톡톡 스파클링 과즙 왁싱볼
  gangcheoldeung: 'pudding', // 강철등 -> 탱글탱글 커스터드 푸딩
}

/**
 * 어떤 입력값이 들어와도 무조건 검증된 디저트 펫 종족 ID로 변환합니다.
 */
export function normalizeDessertSpecies(species: string | null | undefined): DessertSpeciesId {
  if (!species) return 'mochi'
  const trimmed = species.trim().toLowerCase()
  if (VALID_DESSERT_SPECIES.includes(trimmed as DessertSpeciesId)) {
    return trimmed as DessertSpeciesId
  }
  if (LEGACY_SPECIES_MAP[trimmed]) {
    return LEGACY_SPECIES_MAP[trimmed]
  }
  return 'mochi'
}
