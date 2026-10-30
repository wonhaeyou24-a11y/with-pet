// 디저트 식감 ASMR 순수 합성기: Web Audio·DOM 없이 Float32Array만으로 소리를 계산한다.
// 브라우저에서는 AudioBuffer로 감싸 재생하고, Node에서는 같은 코드로 분석·WAV 저장이 가능하다 (scripts/sound-lab.mjs).
//
// 설계 원칙: 소리마다 "물리적으로 다른 재료"를 쓰고 "시간 구조"도 다르게 한다.
//  - 껍질·쿠키가 부서지는 소리  → 짧은 감쇠 입자(grain) 수십~수백 개의 군집 (crackCluster)
//  - 물방울·과즙·반죽 속 기포   → 주파수가 올라가며 사라지는 Minnaert 기포 (bubble)
//  - 나무·유리·도자기 울림      → 감쇠하는 사인 여러 개의 합 (modal)
//  - 누르기·늘어나기·부어지기   → 필터 주파수가 움직이는 노이즈 (swell)
//  - 묵직한 눌림·쿵            → 음높이가 떨어지는 저음 (thump)
//  - 젤리 탄성·카멜레온        → 음높이가 미끄러지는 탱글 (boing)
//  - 탄산·지글지글             → 무작위 미세 기포 입자 (fizz)
//  - 스프링클·부스러기         → 점점 빨라지며 떨어지는 알갱이 (scatter)

export type Rand = () => number

export interface SynthSound {
  L: Float32Array
  R: Float32Array
  sampleRate: number
}

const TAU = Math.PI * 2

// ───────── 기본 도구 ─────────

class Mixer {
  sr: number
  rand: Rand
  L: Float32Array
  R: Float32Array
  constructor(sr: number, seconds: number, rand: Rand) {
    this.sr = sr
    this.rand = rand
    const n = Math.ceil(seconds * sr)
    this.L = new Float32Array(n)
    this.R = new Float32Array(n)
  }
  add(i: number, v: number, gl: number, gr: number) {
    if (i < 0 || i >= this.L.length) return
    this.L[i] += v * gl
    this.R[i] += v * gr
  }
}

function panGains(pan: number): [number, number] {
  const p = Math.max(-1, Math.min(1, pan))
  const a = ((p + 1) * Math.PI) / 4
  return [Math.cos(a), Math.sin(a)]
}

type BiquadType = 'lp' | 'hp' | 'bp'

function biquadCoef(type: BiquadType, f: number, q: number, sr: number) {
  const fc = Math.max(20, Math.min(sr * 0.45, f))
  const w = (TAU * fc) / sr
  const cos = Math.cos(w)
  const alpha = Math.sin(w) / (2 * Math.max(0.1, q))
  let b0: number, b1: number, b2: number
  if (type === 'lp') {
    b0 = (1 - cos) / 2
    b1 = 1 - cos
    b2 = (1 - cos) / 2
  } else if (type === 'hp') {
    b0 = (1 + cos) / 2
    b1 = -(1 + cos)
    b2 = (1 + cos) / 2
  } else {
    b0 = alpha
    b1 = 0
    b2 = -alpha
  }
  const a0 = 1 + alpha
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 }
}

type NoiseColor = 'white' | 'pink' | 'brown'

function makeNoise(color: NoiseColor, rand: Rand): () => number {
  if (color === 'pink') {
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0
    return () => {
      const w = rand() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      const out = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362
      b6 = w * 0.115926
      return out * 0.11
    }
  }
  if (color === 'brown') {
    let last = 0
    return () => {
      const w = rand() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      return last * 3.5
    }
  }
  return () => rand() * 2 - 1
}

// ───────── 소리 재료(목소리) ─────────

// 짧게 감쇠하는 입자 하나: 감쇠 사인 + 약간의 노이즈. 부서지는 소리의 최소 단위.
function grain(m: Mixer, t0: number, f: number, decayMs: number, amp: number, pan = 0, noiseMix = 0.4) {
  const sr = m.sr
  const i0 = Math.floor(t0 * sr)
  const dS = Math.max(4, (decayMs / 1000) * sr)
  const len = Math.floor(dS * 6)
  const [gl, gr] = panGains(pan)
  const w = (TAU * f) / sr
  const cw = Math.cos(w)
  const sw = Math.sin(w)
  const phase = m.rand() * TAU
  let s = Math.sin(phase)
  let c = Math.cos(phase)
  const r = Math.exp(-1 / dS)
  let env = amp
  const tone = 1 - noiseMix
  // 사인과 감쇠를 곱셈 점화식으로 계산해 빠르게 만든다 (수천 개의 입자를 짧은 시간에 합성)
  for (let j = 0; j < len; j++) {
    const att = j < 5 ? (j + 1) / 5 : 1
    m.add(i0 + j, env * att * (s * tone + (m.rand() * 2 - 1) * noiseMix), gl, gr)
    const ns = s * cw + c * sw
    c = c * cw - s * sw
    s = ns
    env *= r
  }
}

interface ClusterOpts {
  n: number
  spanMs: number
  fLo: number
  fHi: number
  dLo: number
  dHi: number
  amp: number
  ampDecay?: number // 군집 안에서 뒤로 갈수록 작아지는 정도
  skew?: number // 1보다 크면 앞쪽에 몰림
  noiseMix?: number
  pan?: number
  panSpread?: number
}

// 입자 수십~수백 개를 흩뿌려 "바삭·아그작·오독"의 질감을 만든다
function crackCluster(m: Mixer, t0: number, o: ClusterOpts) {
  for (let k = 0; k < o.n; k++) {
    const u = Math.pow(m.rand(), o.skew ?? 1)
    const t = t0 + (u * o.spanMs) / 1000
    const f = o.fLo * Math.pow(o.fHi / o.fLo, m.rand())
    const d = o.dLo + m.rand() * (o.dHi - o.dLo)
    const a = o.amp * (0.35 + 0.65 * m.rand()) * Math.exp(-(o.ampDecay ?? 1.5) * u)
    const pan = (o.pan ?? 0) + (m.rand() * 2 - 1) * (o.panSpread ?? 0.45)
    grain(m, t, f, d, a, pan, o.noiseMix ?? 0.4)
  }
}

// Minnaert 기포: 올라가는 음높이로 짧게 "뽀글/톡" — 과즙, 시럽, 반죽 속 공기방울
function bubble(m: Mixer, t0: number, f0: number, rise: number, decayMs: number, amp: number, pan = 0) {
  const sr = m.sr
  const i0 = Math.floor(t0 * sr)
  const dSec = decayMs / 1000
  const tau = dSec * sr
  const len = Math.floor(tau * 5)
  const [gl, gr] = panGains(pan)
  let phase = m.rand() * TAU
  for (let j = 0; j < len; j++) {
    const t = j / sr
    const f = f0 * (1 + rise * Math.min(1.6, t / dSec))
    phase += (TAU * f) / sr
    const env = (1 - Math.exp(-j / (0.0007 * sr))) * Math.exp(-j / tau)
    m.add(i0 + j, amp * env * Math.sin(phase), gl, gr)
  }
}

interface Partial {
  f: number
  d: number // 감쇠 시간(ms)
  a: number
}

// 감쇠하는 사인 여러 개의 합 — 나무 노크, 유리·설탕 껍질, 숟가락 울림, 크리스탈
function modal(m: Mixer, t0: number, partials: Partial[], amp: number, pan = 0, click = 0.35) {
  const sr = m.sr
  const i0 = Math.floor(t0 * sr)
  const [gl, gr] = panGains(pan)
  for (const p of partials) {
    const tau = (p.d / 1000) * sr
    const len = Math.floor(tau * 6)
    const w = (TAU * p.f) / sr
    const cw = Math.cos(w)
    const sw = Math.sin(w)
    const r = Math.exp(-1 / tau)
    let s = 0
    let c = 1
    let env = amp * p.a
    for (let j = 0; j < len; j++) {
      m.add(i0 + j, env * (j < 3 ? (j + 1) / 3 : 1) * s, gl, gr)
      const ns = s * cw + c * sw
      c = c * cw - s * sw
      s = ns
      env *= r
    }
  }
  // 부딪히는 순간의 짧은 마찰 소리
  const cl = Math.floor(0.0018 * sr)
  for (let j = 0; j < cl; j++) m.add(i0 + j, amp * click * (m.rand() * 2 - 1) * (1 - j / cl), gl, gr)
}

// 떨어지는 음높이의 묵직한 눌림·쿵 (스피커가 살짝 울리는 느낌의 저음)
function thump(m: Mixer, t0: number, f0: number, f1: number, decayMs: number, amp: number, pan = 0) {
  const sr = m.sr
  const i0 = Math.floor(t0 * sr)
  const dSec = decayMs / 1000
  const len = Math.floor(dSec * sr * 5)
  const [gl, gr] = panGains(pan)
  let phase = 0
  for (let j = 0; j < len; j++) {
    const t = j / sr
    const f = f1 + (f0 - f1) * Math.exp(-t / (dSec * 0.35))
    phase += (TAU * f) / sr
    const env = Math.exp(-t / dSec) * (j < 40 ? (j + 1) / 40 : 1)
    m.add(i0 + j, amp * env * Math.sin(phase), gl, gr)
  }
}

interface SwellOpts {
  type: BiquadType
  f0: number
  f1: number
  q: number
  attackMs: number
  releaseMs: number
  amp: number
  color?: NoiseColor
  amRate?: number
  amDepth?: number
  pan?: number
  comp?: number
}

// 필터 주파수가 움직이는 노이즈 한 덩이 — 눌림, 늘어남, 부어지는 시럽, 바람 같은 숨소리
function swell(m: Mixer, t0: number, dur: number, o: SwellOpts) {
  const sr = m.sr
  const i0 = Math.floor(t0 * sr)
  const n = Math.floor(dur * sr)
  const noise = makeNoise(o.color ?? 'white', m.rand)
  const [gl, gr] = panGains(o.pan ?? 0)
  const comp = o.comp ?? (o.type === 'bp' ? Math.min(3.2, 0.8 * Math.sqrt(o.q)) : 1)
  const amPhase = m.rand() * TAU
  let z1 = 0,
    z2 = 0
  let c = biquadCoef(o.type, o.f0, o.q, sr)
  const ratio = o.f1 / o.f0
  for (let i = 0; i < n; i++) {
    if (i % 24 === 0) c = biquadCoef(o.type, o.f0 * Math.pow(ratio, i / n), o.q, sr)
    const x = noise()
    const y = c.b0 * x + z1
    z1 = c.b1 * x - c.a1 * y + z2
    z2 = c.b2 * x - c.a2 * y
    const ms = (i / sr) * 1000
    const a = ms / Math.max(1, o.attackMs)
    const r = (((n - i) / sr) * 1000) / Math.max(1, o.releaseMs)
    const env = (a < 1 ? Math.sin((a * Math.PI) / 2) ** 2 : 1) * (r < 1 ? Math.sin((r * Math.PI) / 2) ** 2 : 1)
    const am = o.amRate ? 1 - (o.amDepth ?? 0.4) + (o.amDepth ?? 0.4) * (0.5 + 0.5 * Math.sin(TAU * o.amRate * (i / sr) + amPhase)) : 1
    m.add(i0 + i, y * comp * env * am * o.amp, gl, gr)
  }
}

interface BoingOpts {
  f0: number
  f1: number
  dur: number
  decayMs: number
  amp: number
  vibHz?: number
  vibDepth?: number
  noiseMix?: number
  pan?: number
}

// 음높이가 미끄러지는 탱글·뽀요용 (젤리 탄성, 푸딩 출렁임, 카멜레온 변신)
function boing(m: Mixer, t0: number, o: BoingOpts) {
  const sr = m.sr
  const i0 = Math.floor(t0 * sr)
  const n = Math.floor(o.dur * sr)
  const [gl, gr] = panGains(o.pan ?? 0)
  let phase = 0
  for (let j = 0; j < n; j++) {
    const t = j / sr
    const u = t / o.dur
    const s = 0.5 - 0.5 * Math.cos(Math.PI * u)
    let f = o.f0 + (o.f1 - o.f0) * s
    if (o.vibHz) f *= 1 + (o.vibDepth ?? 0.03) * Math.sin(TAU * o.vibHz * t)
    phase += (TAU * f) / sr
    const env = Math.min(1, t / 0.007) * Math.exp(-t / (o.decayMs / 1000)) * (u > 0.88 ? (1 - u) / 0.12 : 1)
    const body = Math.sin(phase) + 0.25 * Math.sin(2 * phase) + (o.noiseMix ? (m.rand() * 2 - 1) * o.noiseMix : 0)
    m.add(i0 + j, o.amp * env * body, gl, gr)
  }
}

interface FizzOpts {
  density: number // 초당 기포 수(시작)
  decayK: number // 시간이 갈수록 줄어드는 정도
  fLo: number
  fHi: number
  amp: number
  dLo?: number
  dHi?: number
}

// 무작위 미세 기포 — 탄산, 지글지글
function fizz(m: Mixer, t0: number, dur: number, o: FizzOpts) {
  const sr = m.sr
  const n = Math.floor(dur * sr)
  const i0 = Math.floor(t0 * sr)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    const rate = (o.density * Math.exp(-o.decayK * t)) / sr
    if (m.rand() < rate) {
      const f = o.fLo * Math.pow(o.fHi / o.fLo, m.rand())
      const d = (o.dLo ?? 0.25) + m.rand() * ((o.dHi ?? 0.8) - (o.dLo ?? 0.25))
      grain(m, (i0 + i) / sr, f, d, o.amp * (0.25 + 0.75 * m.rand()) * Math.exp(-o.decayK * 0.4 * t), (m.rand() * 2 - 1) * 0.7, 0.3)
    }
  }
}

interface ScatterOpts {
  count: number
  spanMs: number
  p: number // 1보다 크면 점점 빨라지고, 1보다 작으면 점점 뜸해진다
  fLo: number
  fHi: number
  dMs: number
  amp: number
  fade?: number
}

// 알갱이가 떨어지는 소리 — 스프링클, 부스러기, 설탕 조각
function scatter(m: Mixer, t0: number, o: ScatterOpts) {
  for (let k = 0; k < o.count; k++) {
    const x = (k + m.rand() * 0.6) / o.count
    const t = t0 + ((1 - Math.pow(1 - x, o.p)) * o.spanMs) / 1000
    const f = o.fLo * Math.pow(o.fHi / o.fLo, m.rand())
    grain(m, t, f, o.dMs * (0.7 + 0.6 * m.rand()), o.amp * (0.4 + 0.6 * m.rand()) * Math.exp(-(o.fade ?? 0.8) * x), (m.rand() * 2 - 1) * 0.8, 0.35)
  }
}

// 짧은 마찰·떼어지는 소리 (끈적하게 "탁")
function tick(m: Mixer, t0: number, f: number, decayMs: number, amp: number, pan = 0) {
  grain(m, t0, f, decayMs, amp, pan, 0.75)
}

// ───────── 마무리(공간감·부드러움·음량) ─────────

interface FinishOpts {
  reverb: number // 공간감 (0~0.5)
  level: number // 최종 음량 (1이 기준)
  highCut?: number // 날카로움을 깎는 높은 음 한계(Hz)
}

function finish(m: Mixer, o: FinishOpts): SynthSound {
  const sr = m.sr
  const n = m.L.length
  const L = m.L
  const R = m.R
  const dryL = Float32Array.from(L)
  const dryR = Float32Array.from(R)

  // 작은 방 느낌의 초기 반사: 살짝 어둡게 깎은 소리를 서로 엇갈려 더한다
  const taps: [number, number, number][] = [
    [0.011, 0.22, 0],
    [0.017, 0.17, 1],
    [0.023, 0.14, 0],
    [0.031, 0.11, 1],
    [0.043, 0.085, 0],
    [0.059, 0.06, 1],
    [0.083, 0.042, 0],
    [0.113, 0.028, 1],
  ]
  if (o.reverb > 0) {
    let lpL = 0
    let lpR = 0
    const filtL = new Float32Array(n)
    const filtR = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      lpL += 0.45 * (dryL[i] - lpL)
      lpR += 0.45 * (dryR[i] - lpR)
      filtL[i] = lpL
      filtR[i] = lpR
    }
    for (const [dt, g, cross] of taps) {
      const d = Math.floor(dt * sr)
      for (let i = d; i < n; i++) {
        L[i] += o.reverb * g * (cross ? filtR[i - d] : filtL[i - d])
        R[i] += o.reverb * g * (cross ? filtL[i - d] : filtR[i - d])
      }
    }
  }

  // 날카로운 고음을 살짝 깎고, 0Hz 근처 흔들림을 제거한다
  const a = Math.exp((-TAU * (o.highCut ?? 12500)) / sr)
  for (const ch of [L, R]) {
    let y = 0
    let dcX = 0
    let dcY = 0
    for (let i = 0; i < n; i++) {
      y = (1 - a) * ch[i] + a * y
      dcY = y - dcX + 0.995 * dcY
      dcX = y
      ch[i] = dcY
    }
  }

  // 음량을 맞추고 부드럽게 눌러 준다 (찢어지는 소리 방지)
  let peak = 1e-9
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
  const g = (0.82 * o.level) / peak
  for (let i = 0; i < n; i++) {
    L[i] = Math.tanh(L[i] * g * 1.15) / 1.15
    R[i] = Math.tanh(R[i] * g * 1.15) / 1.15
  }

  // 조용해진 뒷부분 자르기 + 시작·끝 페이드
  let end = n - 1
  while (end > 0 && Math.abs(L[end]) < 0.0008 && Math.abs(R[end]) < 0.0008) end--
  const len = Math.min(n, end + Math.floor(0.03 * sr))
  const fi = Math.floor(0.002 * sr)
  const fo = Math.floor(0.02 * sr)
  for (let i = 0; i < fi; i++) {
    L[i] *= i / fi
    R[i] *= i / fi
  }
  for (let i = 0; i < fo && len - 1 - i >= 0; i++) {
    L[len - 1 - i] *= i / fo
    R[len - 1 - i] *= i / fo
  }
  return { L: L.slice(0, len), R: R.slice(0, len), sampleRate: sr }
}

// ───────── 디저트별 레시피 ─────────

export type SynthKind =
  | 'kataifi-crunch'
  | 'wax-pop'
  | 'wax-tap'
  | 'cookie-crisp'
  | 'sugar-crack'
  | 'mochi-squish'
  | 'pudding-jiggle'
  | 'jelly-gummy'
  | 'choco-melt'
  | 'cotton-puff'
  | 'acorn-snap'
  | 'soda-fizz'
  | 'biscuit-armor'
  | 'flambe-crackle'
  | 'starlight-ting'
  | 'chameleon-morph'
  | 'syrup-drizzle'
  | 'smore-sizzle'

type Recipe = (m: Mixer) => void

const jit = (m: Mixer, v: number, spread = 0.06) => v * (1 + (m.rand() * 2 - 1) * spread)

const RECIPES: Record<SynthKind, { total: number; finish: FinishOpts; build: Recipe }> = {
  // 🫧 왁뿌볼: 단단한 왁스 껍질을 꾹 눌러 → 끽 → "아-그-작" 세 번에 나눠 깨지고 → 부스러기 → 속의 말랑한 점액이 쭈욱
  'wax-pop': {
    total: 1.05,
    finish: { reverb: 0.2, level: 1 },
    build: (m) => {
      // 껍질이 눌리며 삐걱이는 긴장감
      swell(m, 0, 0.15, { type: 'bp', f0: 240, f1: jit(m, 780), q: 7, attackMs: 18, releaseMs: 55, amp: 0.1, amRate: 26, amDepth: 0.55, color: 'pink', pan: -0.15 })
      tick(m, 0.085, 2300, 1.1, 0.2, -0.3)
      tick(m, 0.118, 2900, 1.0, 0.26, 0.25)
      // 첫 번째 아그작: 두꺼운 껍질이 쩍 갈라지는 큰 소리 + 묵직한 '턱'
      crackCluster(m, 0.15, { n: 52, spanMs: 40, fLo: 1300, fHi: 5400, dLo: 1.2, dHi: 6.5, amp: 0.95, ampDecay: 2.2, noiseMix: 0.4, panSpread: 0.5 })
      crackCluster(m, 0.152, { n: 16, spanMs: 36, fLo: 520, fHi: 1500, dLo: 4, dHi: 10, amp: 0.7, ampDecay: 1.8, noiseMix: 0.5, panSpread: 0.3 })
      thump(m, 0.15, 200, 95, 48, 0.6)
      // 두 번째, 세 번째 조각이 연달아 아-그-작
      crackCluster(m, 0.222, { n: 38, spanMs: 32, fLo: 1800, fHi: 6400, dLo: 1.0, dHi: 5, amp: 0.78, ampDecay: 2, panSpread: 0.6, pan: -0.2 })
      thump(m, 0.222, 240, 120, 30, 0.3, -0.2)
      crackCluster(m, 0.293, { n: 28, spanMs: 28, fLo: 2200, fHi: 7200, dLo: 0.8, dHi: 4, amp: 0.62, ampDecay: 2, panSpread: 0.6, pan: 0.25 })
      crackCluster(m, 0.345, { n: 20, spanMs: 24, fLo: 1500, fHi: 5200, dLo: 1.2, dHi: 5, amp: 0.46, ampDecay: 2, panSpread: 0.5 })
      // 부서진 껍질 부스러기가 후두둑
      scatter(m, 0.3, { count: 18, spanMs: 260, p: 1.6, fLo: 2800, fHi: 7600, dMs: 1.0, amp: 0.26 })
      // 속의 말랑한 점액이 눌리며 새어 나옴
      swell(m, 0.27, 0.36, { type: 'bp', f0: 300, f1: jit(m, 840), q: 5, attackMs: 45, releaseMs: 170, amp: 0.22, amRate: 11, amDepth: 0.45, color: 'pink' })
      const bubbles = [0.31, 0.375, 0.43, 0.49, 0.545, 0.6]
      bubbles.forEach((t, i) => bubble(m, t + m.rand() * 0.012, 380 + m.rand() * 600, 1.1 + m.rand() * 0.7, 22 + m.rand() * 26, 0.2 + m.rand() * 0.18, (i % 2 ? 1 : -1) * 0.4))
      // 끈적하게 떨어지는 마지막 "쩍"
      tick(m, 0.66, 1700, 9, 0.42, 0.1)
      bubble(m, 0.665, 300, 2.2, 32, 0.34, 0.1)
      thump(m, 0.66, 130, 72, 55, 0.3)
    },
  },

  // 🫧 왁뿌볼 선택음: 얇고 단단한 왁스 껍질이 "바사삭" 여러 조각으로 깨지고, 말랑한 속이 "찌걱" 눌린다 (0.5초)
  'wax-tap': {
    total: 0.5,
    finish: { reverb: 0.08, level: 0.78, highCut: 12000 },
    build: (m) => {
      tick(m, 0, jit(m, 3200), 1, 0.25, -0.2)
      // 1) 첫 균열: 크고 날카로운 파편 묶음
      crackCluster(m, 0.004, { n: 34, spanMs: 40, fLo: jit(m, 2200), fHi: jit(m, 7200), dLo: 0.8, dHi: 3.5, amp: 1, ampDecay: 1.4, noiseMix: 0.35, panSpread: 0.5 })
      // 2) 이어서 번지는 잔 파편들 (껍질이 우수수 부서지는 느낌)
      crackCluster(m, 0.045, { n: 44, spanMs: 150, fLo: jit(m, 2800), fHi: jit(m, 8200), dLo: 0.7, dHi: 3, amp: 0.7, ampDecay: 2.4, noiseMix: 0.3, panSpread: 0.6 })
      // 3) 껍질이 뭉개지는 둔탁한 몸통
      crackCluster(m, 0.01, { n: 10, spanMs: 34, fLo: 900, fHi: 2000, dLo: 3, dHi: 8, amp: 0.55, ampDecay: 1.6, noiseMix: 0.5 })
      thump(m, 0.008, jit(m, 190), 95, 30, 0.34)
      // 4) 속의 말랑이가 눌리며 나는 촉촉한 찌걱
      swell(m, 0.07, 0.2, { type: 'bp', f0: 320, f1: 900, q: 3, attackMs: 25, releaseMs: 110, amp: 0.13, color: 'pink' })
      bubble(m, 0.09, 420 + m.rand() * 260, 1.5, 24, 0.24, 0.12)
      bubble(m, 0.15, 650 + m.rand() * 300, 1.6, 20, 0.16, 0.2)
    },
  },

  // 💚 두바이쫀득쿠키: 초코 껍질이 톡 → 수백 가닥 카다이프가 가늘고 밝게 "사사삭" → 쫀득한 쿠키 속
  'kataifi-crunch': {
    total: 0.8,
    finish: { reverb: 0.22, level: 0.96, highCut: 14000 },
    build: (m) => {
      crackCluster(m, 0, { n: 12, spanMs: 14, fLo: 700, fHi: 2200, dLo: 3, dHi: 7, amp: 0.8, ampDecay: 2, noiseMix: 0.45 })
      thump(m, 0, 150, 80, 35, 0.4)
      // 아주 가는 면발이 끊어지는 입자들 (밝고 촘촘한 사삭사삭)
      crackCluster(m, 0.012, { n: 190, spanMs: 280, fLo: 3200, fHi: 9800, dLo: 0.35, dHi: 1.1, amp: 0.5, ampDecay: 1.6, skew: 1.35, noiseMix: 0.35, panSpread: 0.8 })
      crackCluster(m, 0.07, { n: 28, spanMs: 42, fLo: 1200, fHi: 3800, dLo: 1.5, dHi: 4, amp: 0.55, ampDecay: 1.5, panSpread: 0.5, pan: -0.2 })
      crackCluster(m, 0.165, { n: 22, spanMs: 40, fLo: 1400, fHi: 4200, dLo: 1.5, dHi: 4, amp: 0.42, ampDecay: 1.5, panSpread: 0.5, pan: 0.2 })
      // 쫀득한 쿠키 반죽의 낮은 씹힘
      swell(m, 0.1, 0.24, { type: 'lp', f0: 300, f1: 170, q: 0.8, attackMs: 30, releaseMs: 130, amp: 0.13, color: 'brown' })
      scatter(m, 0.24, { count: 14, spanMs: 240, p: 0.9, fLo: 4200, fHi: 9500, dMs: 0.5, amp: 0.16 })
    },
  },

  // 🍪 오독오독 버터쿠키: 두툼하고 따뜻한 중저음의 "오독-오독-오독" 세 입
  'cookie-crisp': {
    total: 0.75,
    finish: { reverb: 0.14, level: 1 },
    build: (m) => {
      const bites = [
        { t: 0, n: 40, lo: 450, hi: 1800, amp: 0.9, th: 0.55 },
        { t: 0.175, n: 32, lo: 520, hi: 2100, amp: 0.74, th: 0.38 },
        { t: 0.36, n: 24, lo: 480, hi: 1900, amp: 0.56, th: 0.24 },
      ]
      bites.forEach((b, i) => {
        crackCluster(m, b.t, { n: b.n, spanMs: 55, fLo: b.lo, fHi: b.hi, dLo: 3, dHi: 9.5, amp: b.amp, ampDecay: 1.7, noiseMix: 0.5, panSpread: 0.35, pan: (i - 1) * 0.22 })
        thump(m, b.t, 140, 75, 42, b.th)
        scatter(m, b.t + 0.03, { count: 10, spanMs: 110, p: 1.4, fLo: 2000, fHi: 6000, dMs: 1.1, amp: 0.2 })
        swell(m, b.t + 0.02, 0.12, { type: 'hp', f0: 2400, f1: 1900, q: 0.7, attackMs: 8, releaseMs: 60, amp: 0.05 })
      })
    },
  },

  // 🍓 유리알탕후루: 얇은 설탕 유리가 "빠작!" 하고 밝게 깨지고 → 과일 과즙이 촉촉하게
  'sugar-crack': {
    total: 0.8,
    finish: { reverb: 0.2, level: 0.95, highCut: 14500 },
    build: (m) => {
      modal(m, 0, [{ f: jit(m, 3180), d: 38, a: 0.6 }, { f: jit(m, 4720), d: 26, a: 0.5 }, { f: jit(m, 6890), d: 18, a: 0.35 }, { f: jit(m, 9100), d: 12, a: 0.2 }], 0.62, -0.1, 0.5)
      crackCluster(m, 0, { n: 30, spanMs: 12, fLo: 3800, fHi: 10500, dLo: 0.6, dHi: 1.9, amp: 0.85, ampDecay: 2, noiseMix: 0.35 })
      modal(m, 0.046, [{ f: jit(m, 3560), d: 30, a: 0.5 }, { f: jit(m, 5300), d: 22, a: 0.4 }, { f: jit(m, 7600), d: 14, a: 0.25 }], 0.45, 0.25, 0.4)
      crackCluster(m, 0.046, { n: 18, spanMs: 12, fLo: 4200, fHi: 11000, dLo: 0.6, dHi: 1.6, amp: 0.6 })
      // 잘게 부서지는 유리 조각
      scatter(m, 0.06, { count: 26, spanMs: 170, p: 1.8, fLo: 5000, fHi: 11500, dMs: 0.5, amp: 0.3 })
      // 안쪽 과일이 아삭, 과즙이 톡톡
      crackCluster(m, 0.115, { n: 16, spanMs: 62, fLo: 700, fHi: 2400, dLo: 3, dHi: 7, amp: 0.42, ampDecay: 1.4, noiseMix: 0.5 })
      swell(m, 0.13, 0.22, { type: 'bp', f0: 900, f1: 1750, q: 3, attackMs: 25, releaseMs: 110, amp: 0.13, color: 'pink' })
      ;[0.15, 0.2, 0.255, 0.32].forEach((t, i) => bubble(m, t, 520 + m.rand() * 900, 1.4, 16 + m.rand() * 14, 0.24 + m.rand() * 0.1, (i % 2 ? 1 : -1) * 0.35))
    },
  },

  // 🍡 찹쌀떡모찌: 전분 가루 위로 낮고 포근하게 "푹" → 쫀득하게 늘어나는 소리 → 끈적하게 떨어지는 "쩍"
  'mochi-squish': {
    total: 0.95,
    finish: { reverb: 0.16, level: 0.95, highCut: 9500 },
    build: (m) => {
      thump(m, 0, 88, 55, 95, 0.58)
      swell(m, 0, 0.22, { type: 'lp', f0: 540, f1: 280, q: 0.8, attackMs: 28, releaseMs: 120, amp: 0.36, color: 'pink' })
      // 전분 가루가 폭 하고 날리는 보송한 숨결
      swell(m, 0, 0.2, { type: 'bp', f0: 3400, f1: 5200, q: 0.9, attackMs: 20, releaseMs: 100, amp: 0.07, pan: -0.2 })
      // 쫀득하게 늘어나는 반죽: 낮은 바디 + 가늘게 우는 끈적임
      swell(m, 0.14, 0.4, { type: 'bp', f0: 180, f1: 640, q: 3.5, attackMs: 60, releaseMs: 150, amp: 0.3, color: 'pink', amRate: 7.5, amDepth: 0.5 })
      swell(m, 0.2, 0.28, { type: 'bp', f0: 900, f1: 1750, q: 9, attackMs: 40, releaseMs: 120, amp: 0.05, amRate: 15, amDepth: 0.8, pan: 0.2 })
      // 손끝에서 떨어지며 "쩍!"
      tick(m, 0.56, 1800, 10, 0.42, 0.1)
      bubble(m, 0.56, 300, 2.2, 30, 0.36, 0.1)
      thump(m, 0.56, 120, 70, 50, 0.3)
    },
  },

  // 🍮 말랑푸딩: 숟가락 "탁" → 탱-글-탱-글 네 번 출렁이며 점점 잦아드는 탄성
  'pudding-jiggle': {
    total: 1.05,
    finish: { reverb: 0.2, level: 0.95 },
    build: (m) => {
      // 숟가락 끝이 도자기 접시에 "챙" 닿는 맑은 소리
      modal(m, 0, [{ f: jit(m, 1500), d: 34, a: 0.7 }, { f: jit(m, 2900), d: 22, a: 0.5 }, { f: jit(m, 4400), d: 14, a: 0.3 }], 0.55, 0, 0.45)
      thump(m, 0, 150, 105, 34, 0.2)
      // 탱-글-탱-글: 음높이가 미끄러지는 탄성이 점점 작아진다
      const amps = [0.6, 0.46, 0.34, 0.22]
      amps.forEach((a, i) => boing(m, 0.05 + i * 0.15, { f0: 380 + i * 42, f1: 250 + i * 26, dur: 0.15 + i * 0.006, decayMs: 62, amp: a, noiseMix: 0.05, pan: (i % 2 ? 1 : -1) * 0.25 }))
      swell(m, 0.1, 0.5, { type: 'lp', f0: 900, f1: 600, q: 0.8, attackMs: 40, releaseMs: 200, amp: 0.07, color: 'pink', amRate: 6.2, amDepth: 0.6 })
      // 카라멜 시럽이 반짝이며 맺히는 작은 방울
      ;[0.55, 0.66, 0.78].forEach((t, i) => bubble(m, t, 900 + i * 260, 1.3, 18, 0.2 - i * 0.04, (i - 1) * 0.4))
    },
  },

  // 🐻 쫀득젤리: 쫀득하게 물고 → 고무처럼 "쫘아압" 늘어나며 끼익 → 씹을 때마다 쫀득쫀득
  'jelly-gummy': {
    total: 1.0,
    finish: { reverb: 0.14, level: 0.95, highCut: 11000 },
    build: (m) => {
      thump(m, 0, 150, 100, 40, 0.26)
      crackCluster(m, 0, { n: 12, spanMs: 18, fLo: 900, fHi: 2600, dLo: 2, dHi: 5, amp: 0.4, noiseMix: 0.5 })
      // 고무처럼 팽팽하게 늘어나는 끼익 마찰 (높고 쫀쫀한 소리)
      swell(m, 0.05, 0.46, { type: 'bp', f0: 620, f1: 2600, q: 14, attackMs: 40, releaseMs: 170, amp: 0.5, amRate: 30, amDepth: 0.35 })
      boing(m, 0.14, { f0: 1500, f1: 2500, dur: 0.12, decayMs: 100, amp: 0.2 })
      // 쫀득쫀득 씹는 두 번: 낮은 쿵 대신 말랑하고 통통한 "쯥"
      ;[0.34, 0.52].forEach((t, i) => {
        tick(m, t, 1500, 12, 0.5, (i ? 1 : -1) * 0.2)
        thump(m, t, 170, 115, 40, 0.22)
        bubble(m, t + 0.01, 420, 1.8, 26, 0.3, (i ? 1 : -1) * 0.3)
      })
      boing(m, 0.64, { f0: 2000, f1: 2900, dur: 0.08, decayMs: 55, amp: 0.2, pan: 0.2 })
    },
  },

  // 🍫 달콤초코: 따뜻하고 진한 퐁듀가 낮게 흘러내리며 느린 "보글…보글"
  'choco-melt': {
    total: 1.2,
    finish: { reverb: 0.26, level: 0.92, highCut: 7500 },
    build: (m) => {
      swell(m, 0, 0.9, { type: 'lp', f0: 430, f1: 290, q: 0.8, attackMs: 130, releaseMs: 380, amp: 0.46, color: 'brown', amRate: 3.2, amDepth: 0.35 })
      thump(m, 0.05, 70, 60, 300, 0.17)
      const t = [0.14, 0.31, 0.44, 0.62, 0.78]
      const f = [230, 310, 200, 270, 240]
      const d = [95, 80, 110, 90, 120]
      const a = [0.5, 0.42, 0.5, 0.38, 0.34]
      t.forEach((tt, i) => bubble(m, tt, f[i] * (1 + (m.rand() - 0.5) * 0.1), 0.9, d[i], a[i], (i % 2 ? 1 : -1) * 0.35))
      ;[0.22, 0.52, 0.7].forEach((tt, i) => bubble(m, tt, 560 + i * 110, 1.3, 28, 0.17, (i % 2 ? -1 : 1) * 0.5))
    },
  },

  // ☁️ 몽실 솜사탕: 숨결처럼 보송하게 "푸우—" 하고 번지다 → 설탕 실이 사르르 녹는 미세 소리
  'cotton-puff': {
    total: 1.0,
    finish: { reverb: 0.36, level: 0.78, highCut: 16000 },
    build: (m) => {
      swell(m, 0, 0.58, { type: 'bp', f0: 3500, f1: 6500, q: 0.8, attackMs: 95, releaseMs: 270, amp: 0.3, pan: -0.1 })
      swell(m, 0.08, 0.5, { type: 'bp', f0: 5500, f1: 2800, q: 0.9, attackMs: 70, releaseMs: 220, amp: 0.2, pan: 0.2 })
      swell(m, 0.02, 0.32, { type: 'lp', f0: 900, f1: 700, q: 0.7, attackMs: 60, releaseMs: 200, amp: 0.08, color: 'pink' })
      scatter(m, 0.04, { count: 46, spanMs: 480, p: 0.55, fLo: 5500, fHi: 12500, dMs: 0.35, amp: 0.13, fade: 1.6 })
    },
  },

  // 🌰 콩콩 도토리: 속이 빈 나무처럼 "또각!" 하고 울리고 → 고소한 껍질이 오독
  'acorn-snap': {
    total: 0.7,
    finish: { reverb: 0.2, level: 1 },
    build: (m) => {
      modal(m, 0, [{ f: jit(m, 640, 0.05), d: 48, a: 1 }, { f: jit(m, 1420, 0.05), d: 30, a: 0.6 }, { f: jit(m, 2310, 0.05), d: 18, a: 0.4 }, { f: jit(m, 3380, 0.05), d: 10, a: 0.2 }], 0.78, 0, 0.5)
      thump(m, 0, 200, 110, 36, 0.36)
      crackCluster(m, 0.06, { n: 24, spanMs: 40, fLo: 900, fHi: 3200, dLo: 2, dHi: 6, amp: 0.6, ampDecay: 1.6, noiseMix: 0.5 })
      crackCluster(m, 0.15, { n: 15, spanMs: 34, fLo: 1000, fHi: 3000, dLo: 2, dHi: 5, amp: 0.4, ampDecay: 1.6, panSpread: 0.5 })
      scatter(m, 0.2, { count: 8, spanMs: 130, p: 1.5, fLo: 2500, fHi: 6000, dMs: 0.8, amp: 0.2 })
    },
  },

  // ⚡ 번개꼬리 소다: "치익!" 캔을 따는 순간 → 길고 촘촘하게 반짝이는 탄산 기포
  'soda-fizz': {
    total: 1.2,
    finish: { reverb: 0.22, level: 0.88, highCut: 15500 },
    build: (m) => {
      modal(m, 0, [{ f: jit(m, 2100), d: 15, a: 0.5 }, { f: jit(m, 3300), d: 10, a: 0.3 }], 0.32, -0.1, 0.5)
      swell(m, 0.01, 0.16, { type: 'hp', f0: 5500, f1: 5000, q: 0.7, attackMs: 4, releaseMs: 130, amp: 0.5, pan: -0.15 })
      swell(m, 0.03, 0.12, { type: 'bp', f0: 8000, f1: 7000, q: 0.8, attackMs: 4, releaseMs: 90, amp: 0.2, pan: 0.2 })
      fizz(m, 0.03, 1.0, { density: 2600, decayK: 2.6, fLo: 3500, fHi: 11500, amp: 0.55 })
      for (let i = 0; i < 20; i++) {
        const t = 0.05 + Math.pow(m.rand(), 1.5) * 0.85
        bubble(m, t, 1800 + m.rand() * 2400, 0.9 + m.rand() * 0.7, 6 + m.rand() * 8, 0.12 + m.rand() * 0.18, (m.rand() * 2 - 1) * 0.7)
      }
    },
  },

  // 🛡️ 강철등 비스킷: 묵직한 "쿵" → 낮고 거친 "콰드득" 세 조각 + 방패 같은 작은 울림
  'biscuit-armor': {
    total: 0.85,
    finish: { reverb: 0.12, level: 1, highCut: 9000 },
    build: (m) => {
      thump(m, 0, 76, 45, 125, 0.78)
      crackCluster(m, 0.004, { n: 36, spanMs: 52, fLo: 220, fHi: 950, dLo: 6, dHi: 16, amp: 0.95, ampDecay: 1.6, noiseMix: 0.55, panSpread: 0.3 })
      crackCluster(m, 0.006, { n: 22, spanMs: 46, fLo: 800, fHi: 2400, dLo: 3, dHi: 8, amp: 0.5, ampDecay: 1.7 })
      crackCluster(m, 0.095, { n: 26, spanMs: 46, fLo: 260, fHi: 1100, dLo: 5, dHi: 13, amp: 0.7, ampDecay: 1.7, noiseMix: 0.55, pan: -0.2 })
      thump(m, 0.095, 95, 60, 60, 0.4)
      crackCluster(m, 0.195, { n: 16, spanMs: 40, fLo: 300, fHi: 1200, dLo: 4, dHi: 11, amp: 0.45, ampDecay: 1.7, pan: 0.2 })
      modal(m, 0.018, [{ f: jit(m, 1850), d: 70, a: 0.5 }, { f: jit(m, 3100), d: 45, a: 0.3 }, { f: jit(m, 4700), d: 30, a: 0.2 }], 0.16, 0.2, 0.1)
    },
  },

  // 🔥 흑염 브륄레: 숟가락으로 캐러멜 막을 "톡!" → 불꽃이 "타닥타닥" 불규칙하게 튀고 낮은 불길 소리
  'flambe-crackle': {
    total: 1.15,
    finish: { reverb: 0.2, level: 0.95 },
    build: (m) => {
      modal(m, 0, [{ f: jit(m, 2750), d: 22, a: 0.6 }, { f: jit(m, 4200), d: 14, a: 0.4 }], 0.45, 0, 0.5)
      crackCluster(m, 0, { n: 24, spanMs: 14, fLo: 2200, fHi: 8200, dLo: 0.6, dHi: 2, amp: 0.7 })
      crackCluster(m, 0.05, { n: 16, spanMs: 16, fLo: 2000, fHi: 7000, dLo: 0.7, dHi: 2, amp: 0.5, pan: 0.2 })
      // 장작불처럼 불규칙한 타닥임 (초반에 더 자주)
      for (let i = 0; i < 15; i++) {
        const t = 0.1 + Math.pow(m.rand(), 1.4) * 0.8
        const pan = (m.rand() * 2 - 1) * 0.7
        grain(m, t, 200 + m.rand() * 420, 5 + m.rand() * 5, 0.35 + m.rand() * 0.3, pan, 0.5)
        grain(m, t, 3000 + m.rand() * 4000, 0.9, 0.3 + m.rand() * 0.25, pan, 0.4)
      }
      swell(m, 0.04, 0.9, { type: 'lp', f0: 170, f1: 250, q: 0.8, attackMs: 160, releaseMs: 420, amp: 0.2, color: 'brown', amRate: 4.3, amDepth: 0.4 })
    },
  },

  // ✨ 별비늘 별사탕: 맑은 크리스탈이 "팅-챠르르릉" 흩어지며 반짝이는 잔향
  'starlight-ting': {
    total: 1.6,
    finish: { reverb: 0.46, level: 0.82, highCut: 16000 },
    build: (m) => {
      const base = [2093, 2349, 2637, 3136, 3520, 4186]
      const order = base.map((f) => ({ f, k: m.rand() })).sort((a, b) => a.k - b.k).map((x) => x.f)
      const times = [0, 0.05, 0.115, 0.19, 0.275, 0.385]
      const amps = [0.5, 0.42, 0.38, 0.34, 0.3, 0.26]
      order.forEach((f, i) => {
        const ff = jit(m, f, 0.012)
        const d = 150 + m.rand() * 170
        modal(m, times[i] + m.rand() * 0.008, [{ f: ff, d, a: 1 }, { f: ff * 2.756, d: d * 0.5, a: 0.35 }, { f: ff * 5.404, d: d * 0.25, a: 0.15 }], amps[i], (i / 5) * 1.2 - 0.6, 0.1)
      })
      scatter(m, 0, { count: 32, spanMs: 760, p: 0.7, fLo: 7000, fHi: 13500, dMs: 0.4, amp: 0.09, fade: 1.2 })
      swell(m, 0.02, 0.7, { type: 'bp', f0: 5200, f1: 8800, q: 1.2, attackMs: 70, releaseMs: 320, amp: 0.06 })
    },
  },

  // 🦎 말랑카멜레온: "뽀-요-용" 음높이가 올라갔다 내려오며 색이 변하는 마법 모찌 + 젖은 말랑함
  'chameleon-morph': {
    total: 1.2,
    finish: { reverb: 0.22, level: 0.95 },
    build: (m) => {
      // 색이 번지듯 길게 미끄러지는 마법 같은 오르내림 (왼쪽에서 오른쪽으로 몸이 변하는 느낌)
      boing(m, 0, { f0: 150, f1: 900, dur: 0.36, decayMs: 260, amp: 0.5, vibHz: 6, vibDepth: 0.06, pan: -0.6 })
      boing(m, 0.3, { f0: 900, f1: 300, dur: 0.4, decayMs: 200, amp: 0.4, vibHz: 5.5, vibDepth: 0.05, pan: 0.6 })
      boing(m, 0.72, { f0: 300, f1: 430, dur: 0.16, decayMs: 80, amp: 0.2 })
      swell(m, 0.02, 0.6, { type: 'bp', f0: 260, f1: 1100, q: 4, attackMs: 35, releaseMs: 180, amp: 0.2, color: 'pink', amRate: 12, amDepth: 0.5 })
      // 몸 색이 바뀔 때 반짝이는 작은 알갱이
      for (let i = 0; i < 6; i++) bubble(m, 0.1 + i * 0.12 + m.rand() * 0.04, 1600 + m.rand() * 2400, 0.8, 7 + m.rand() * 7, 0.1 + m.rand() * 0.1, (m.rand() * 2 - 1) * 0.8)
    },
  },

  // 🌈 시럽 & 스프링클: 시럽이 졸졸 흐르고 방울이 똑똑 → 스프링클이 통통 튀며 쏟아지는 소리
  'syrup-drizzle': {
    total: 1.2,
    finish: { reverb: 0.24, level: 0.92, highCut: 14000 },
    build: (m) => {
      swell(m, 0, 0.44, { type: 'bp', f0: 950, f1: 1500, q: 2.2, attackMs: 40, releaseMs: 210, amp: 0.26, amRate: 19, amDepth: 0.5, color: 'pink' })
      ;[0.12, 0.24, 0.31, 0.44, 0.55].forEach((t, i) => bubble(m, t, 600 + m.rand() * 500, 1.5, 16 + m.rand() * 12, 0.3, (i % 2 ? 1 : -1) * 0.3))
      scatter(m, 0.38, { count: 24, spanMs: 520, p: 1.9, fLo: 3400, fHi: 7400, dMs: 1.2, amp: 0.48, fade: 0.5 })
      swell(m, 0.4, 0.5, { type: 'hp', f0: 6000, f1: 6000, q: 0.7, attackMs: 100, releaseMs: 300, amp: 0.035 })
    },
  },

  // 🔥 스모어: "치이익" 지글지글 → 노릇한 껍질이 "바스락" → 속은 폭신하게 길게 늘어남
  'smore-sizzle': {
    total: 1.15,
    finish: { reverb: 0.2, level: 0.95, highCut: 11500 },
    build: (m) => {
      fizz(m, 0, 0.55, { density: 900, decayK: 2.2, fLo: 2200, fHi: 6500, amp: 0.4, dLo: 0.4, dHi: 1.2 })
      swell(m, 0, 0.3, { type: 'hp', f0: 3600, f1: 3200, q: 0.7, attackMs: 14, releaseMs: 160, amp: 0.1 })
      crackCluster(m, 0.12, { n: 42, spanMs: 72, fLo: 900, fHi: 3400, dLo: 2, dHi: 6, amp: 0.7, ampDecay: 1.6, noiseMix: 0.5 })
      thump(m, 0.12, 150, 90, 46, 0.4)
      swell(m, 0.2, 0.52, { type: 'bp', f0: 220, f1: 520, q: 3, attackMs: 85, releaseMs: 230, amp: 0.27, color: 'pink', amRate: 5, amDepth: 0.4 })
      swell(m, 0.26, 0.32, { type: 'hp', f0: 2000, f1: 2000, q: 0.7, attackMs: 90, releaseMs: 200, amp: 0.1 })
      ;[0.3, 0.42, 0.55].forEach((t, i) => bubble(m, t, 260 + m.rand() * 140, 1.2, 42, 0.28, (i - 1) * 0.35))
    },
  },
}

export const SYNTH_KINDS = Object.keys(RECIPES) as SynthKind[]

// 한 번 재생할 소리를 계산한다. rand를 같은 값으로 주면 같은 소리가 나오고, 평소에는 Math.random으로 매번 살짝 다르게 들린다.
export function synthesizeDessertSound(kind: SynthKind, sampleRate: number, rand: Rand = Math.random): SynthSound {
  const recipe = RECIPES[kind] ?? RECIPES['mochi-squish']
  const m = new Mixer(sampleRate, recipe.total + 0.2, rand)
  recipe.build(m)
  return finish(m, recipe.finish)
}
