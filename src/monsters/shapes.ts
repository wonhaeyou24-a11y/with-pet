const f = (n: number) => Math.round(n * 100) / 100

// 타원 둘레에 동그란 볼록이를 붙인 구름·털뭉치 모양 경로. puff가 클수록 볼록이가 불룩하다 (0.5 이상).
export function scallopPath(cx: number, cy: number, rx: number, ry: number, n: number, puff = 0.6, rot = -Math.PI / 2) {
  const pts = Array.from({ length: n }, (_, i) => {
    const t = rot + (i * 2 * Math.PI) / n
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)] as const
  })
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 1; i <= n; i++) {
    const [px, py] = pts[i % n]
    const [qx, qy] = pts[i - 1]
    const r = Math.hypot(px - qx, py - qy) * puff
    d += ` A ${f(r)} ${f(r)} 0 0 1 ${f(px)} ${f(py)}`
  }
  return d + ' Z'
}
