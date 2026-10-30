// 서버 응답이 오래 걸려도 화면이 로딩에서 멈추지 않도록, 지정한 시간이 지나면 실패로 처리한다
export function withTimeout<T>(task: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    task.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

export const SERVER_TIMEOUT_MS = 6000

export const NETWORK_MESSAGE = '연결이 불안정해요. 잠시 후 다시 시도해 주세요.'

// 서버 함수가 보낸 오류 응답(401·404 등)에서 사용자에게 보여 줄 문구를 꺼낸다
export async function readFunctionError(error: unknown): Promise<string> {
  try {
    const res = (error as { context?: Response }).context
    const body = res && typeof res.json === 'function' ? await res.json() : null
    if (body && typeof body.message === 'string') return body.message
  } catch {
    // 본문이 없으면 기본 문구를 쓴다
  }
  return NETWORK_MESSAGE
}
