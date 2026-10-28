// 게임 전반의 수치·문구 설정. 기획서 숫자는 초안이므로 코드 곳곳에 박지 말고 여기에 모은다.
export const GAME_NAME = '펫과함께'

export const NICKNAME = {
  minLength: 2,
  maxLength: 10,
} as const

export const AUTH = {
  otpLength: 6,
  inviteCodeLength: 8,
} as const
