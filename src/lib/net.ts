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
