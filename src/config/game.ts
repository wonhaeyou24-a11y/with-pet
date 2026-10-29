// 게임 전반의 수치·문구 설정. 기획서 숫자는 초안이므로 코드 곳곳에 박지 말고 여기에 모은다.
export const GAME_NAME = '펫과함께'

export const NICKNAME = {
  minLength: 2,
  maxLength: 10,
} as const

// 몬스터 이름: 한글·영문·숫자만. DB의 제약(monsters.name)과 같은 규칙이어야 한다.
export const MONSTER_NAME = {
  maxLength: 10,
  pattern: /^[가-힣A-Za-z0-9]{1,10}$/,
} as const

export const AUTH = {
  otpLength: 6,
  inviteCodeLength: 8,
} as const
