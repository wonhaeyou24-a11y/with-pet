const f = (n: number) => Math.round(n * 100) / 100

// 타원 둘레에 불꽃 모양 뾰족이를 둘러싼 경로 (갈기용). len이 클수록 불꽃이 길다.
export function flamePath(cx: number, cy: number, rx: number, ry: number, n: number, len = 0.35, rot = -Math.PI / 2) {
  const total = n * 2
  const pt = (i: number, lean = 0) => {
    const t = rot + (i * Math.PI) / n + lean
    const r = i % 2 === 0 ? 1 + len : 1
    return [cx + rx * r * Math.cos(t), cy + ry * r * Math.sin(t)] as const
  }
  const [sx, sy] = pt(0)
  let d = `M ${f(sx)} ${f(sy)}`
  for (let i = 1; i <= total; i++) {
    const [px, py] = pt(i % total)
    const mid = (rot + ((i - 0.5) * Math.PI) / n) + 0.1
    const mr = i % 2 === 0 ? 1.12 : 1.1 + len * 0.3
    const qx = cx + rx * mr * Math.cos(mid)
    const qy = cy + ry * mr * Math.sin(mid)
    d += ` Q ${f(qx)} ${f(qy)} ${f(px)} ${f(py)}`
  }
  return d + ' Z'
}

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
