// 한글 조사 붙이기: 받침이 있으면 앞 글자, 없으면 뒤 글자 ("빠작이" + 이/가 → "빠작이가", "초코" + 이/가 → "초코가")
const PAIRS = {
  '이/가': ['이', '가'],
  '은/는': ['은', '는'],
  '을/를': ['을', '를'],
  '과/와': ['과', '와'],
} as const

function hasBatchim(word: string) {
  const code = word.trim().charCodeAt(word.trim().length - 1) - 0xac00
  // 한글 완성형이 아니면(영문·숫자) 받침이 없는 것으로 본다
  return code >= 0 && code <= 11171 && code % 28 !== 0
}

export function withJosa(word: string, pair: keyof typeof PAIRS) {
  const [withBatchim, without] = PAIRS[pair]
  return word + (hasBatchim(word) ? withBatchim : without)
}
