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

interface FizzOpts {
  density: number // 초당 기포 수(시작)
  decayK: number // 시간이 갈수록 줄어드는 정도
  fLo: number
  fHi: number
  amp: number
  dLo?: number
  dHi?: number
  noiseMix?: number // 1에 가까울수록 소음(기본 0.3)
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
      grain(m, (i0 + i) / sr, f, d, o.amp * (0.25 + 0.75 * m.rand()) * Math.exp(-o.decayK * 0.4 * t), (m.rand() * 2 - 1) * 0.7, o.noiseMix ?? 0.3)
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

interface SmackOpts {
  f: number // 중심 주파수(Hz)
  q?: number // 낮을수록 넓고 음정이 없다 (기본 1.6)
  decayMs: number
  amp: number
  glide?: number // 끝에서의 주파수 배율 (1보다 크면 올라가며 "쩌-억", 작으면 내려가며 "푸욱")
  pan?: number
  color?: NoiseColor
}

// 짧고 촉촉한 마찰·눌림·떨어짐. 소음에서 만들기 때문에 "삐용"하는 맑은 음정이 생기지 않는다.
function smack(m: Mixer, t0: number, o: SmackOpts) {
  const sr = m.sr
  const i0 = Math.floor(t0 * sr)
  const dS = Math.max(8, (o.decayMs / 1000) * sr)
  const len = Math.floor(dS * 5)
  const noise = makeNoise(o.color ?? 'white', m.rand)
  const [gl, gr] = panGains(o.pan ?? 0)
  const q = o.q ?? 1.6
  const glide = o.glide ?? 1
  const comp = Math.min(3.2, 0.8 * Math.sqrt(q))
  const atk = Math.max(6, Math.floor(0.0006 * sr))
  let z1 = 0
  let z2 = 0
  let c = biquadCoef('bp', o.f, q, sr)
  for (let j = 0; j < len; j++) {
    if (j % 8 === 0) c = biquadCoef('bp', o.f * Math.pow(glide, Math.min(1, j / dS)), q, sr)
    const x = noise()
    const y = c.b0 * x + z1
    z1 = c.b1 * x - c.a1 * y + z2
    z2 = c.b2 * x - c.a2 * y
    const att = j < atk ? (j + 1) / atk : 1
    m.add(i0 + j, y * comp * att * Math.exp(-j / dS) * o.amp, gl, gr)
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

// 왁뿌볼 선택음 조절값: fScale(밝기 배율), shimmer(10kHz 위 반짝임), body(묵직한 몸통), clicks(클릭 개수)
export interface WaxTapOpts {
  fScale: number
  shimmer: number
  body: number
  clicks: number
  level: number
}
export const WAX_TAP_DEFAULT: WaxTapOpts = { fScale: 1, shimmer: 1, body: 0, clicks: 40, level: 0.56 }

function buildWaxTap(m: Mixer, o: WaxTapOpts) {
  const top = (f: number) => Math.min(15500, f * o.fScale)
  // 첫 타격: 바싹 마른 껍질이 갈라지는 한 번의 날카로운 "딱"
  tick(m, 0, jit(m, top(5200)), 0.9, 1, -0.1)
  // 본체: 앞쪽에 몰려 있다가 뒤로 갈수록 듬성듬성해지는 클릭 (skew 로 앞쪽 밀집)
  crackCluster(m, 0.002, { n: o.clicks, spanMs: 460, skew: 2.3, fLo: jit(m, 2800 * o.fScale), fHi: jit(m, top(9500)), dLo: 0.5, dHi: 2.2, amp: 0.95, ampDecay: 1.2, noiseMix: 0.55, panSpread: 0.55 })
  // 가장 밝은 반짝임(10kHz 이상)
  scatter(m, 0.004, { count: 14, spanMs: 340, p: 1.6, fLo: 7500 * o.fScale, fHi: top(12500), dMs: 0.6, amp: 0.3 * o.shimmer })
  // 부서지는 조각이 이어서 바스락거리는 가벼운 꼬리
  crackCluster(m, 0.2, { n: 8, spanMs: 300, skew: 1.6, fLo: 3200, fHi: top(7000), dLo: 0.8, dHi: 2.8, amp: 0.4, ampDecay: 1.6, noiseMix: 0.6, panSpread: 0.6 })
  // 묵직함: 껍질이 단단하게 눌리는 낮은 "툭" + 중저음 균열
  if (o.body > 0) {
    thump(m, 0.004, jit(m, 190), 95, 34, 0.34 * o.body)
    crackCluster(m, 0.006, { n: 12, spanMs: 90, skew: 1.4, fLo: 700, fHi: 2000, dLo: 3, dHi: 8, amp: 0.5 * o.body, ampDecay: 1.5, noiseMix: 0.5, panSpread: 0.4 })
  }
}

// 후보 소리 비교용 (sound-lab 과 scripts/wax-tap-variants.mjs 에서 쓴다)
export function synthesizeWaxTapVariant(o: WaxTapOpts, sampleRate: number, rand: Rand = Math.random): SynthSound {
  const m = new Mixer(sampleRate, 0.8, rand)
  buildWaxTap(m, o)
  return finish(m, { reverb: 0.04, level: o.level, highCut: o.fScale > 1.1 ? 17000 : 14000 })
}

const RECIPES: Record<SynthKind, { total: number; finish: FinishOpts; build: Recipe }> = {
  // 🫧 왁뿌볼: 단단한 왁스 껍질이 와지끈 부서지며(실제 녹음 분석: 5~10ms 간격 밝은 클릭이 앞쪽에 몰렸다 듬성듬성) → 속의 말랑한 점액이 쭈욱 새는 촉촉한 소리
  'wax-pop': {
    total: 1.15,
    finish: { reverb: 0.05, level: 0.95, highCut: 14000 },
    build: (m) => {
      tick(m, 0, jit(m, 5200), 0.9, 1, -0.1)
      crackCluster(m, 0.002, { n: 64, spanMs: 640, skew: 2.3, fLo: jit(m, 2800), fHi: jit(m, 9500), dLo: 0.5, dHi: 2.4, amp: 0.95, ampDecay: 1.15, noiseMix: 0.55, panSpread: 0.55 })
      scatter(m, 0.004, { count: 22, spanMs: 520, p: 1.6, fLo: 7500, fHi: 12500, dMs: 0.6, amp: 0.28 })
      // 껍질이 뭉개지는 둔탁한 눌림
      smack(m, 0.01, { f: 420, q: 1.1, decayMs: 26, amp: 0.55, glide: 0.8, color: 'pink' })
      // 속의 말랑한 점액: 걸쭉하게 흘러나오며 쩝쩝 달라붙는다
      swell(m, 0.26, 0.5, { type: 'bp', f0: 320, f1: 1000, q: 1.3, attackMs: 70, releaseMs: 200, amp: 0.2, color: 'pink', amRate: 8, amDepth: 0.55 })
      smack(m, 0.34, { f: 620, q: 1.5, decayMs: 22, amp: 0.4, glide: 1.7, pan: -0.2 })
      smack(m, 0.5, { f: 520, q: 1.5, decayMs: 24, amp: 0.36, glide: 1.8, pan: 0.2 })
      smack(m, 0.7, { f: 760, q: 1.6, decayMs: 20, amp: 0.34, glide: 2.0 })
      smack(m, 0.92, { f: 900, q: 1.7, decayMs: 14, amp: 0.4, glide: 2.2 })
    },
  },

  // 🫧 왁뿌볼 선택음: 실제 "왁스 부수기" 녹음(design/reference/wax_crush_asmr_crisp.wav)의 특징을 따라간다.
  // 녹음 분석: 한 번 부술 때 0.4~0.7초 동안 5~10ms 간격의 날카로운 클릭이 처음에 촘촘히 터지고 점점 듬성듬성해진다.
  // 소리의 중심은 3~6kHz(약 48%)이고 6kHz 이상도 약 35%로 아주 밝다. 저음(700Hz 아래)은 거의 없다.
  'wax-tap': {
    total: 0.6,
    finish: { reverb: 0.04, level: WAX_TAP_DEFAULT.level, highCut: 14000 },
    build: (m) => buildWaxTap(m, WAX_TAP_DEFAULT),
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

  // 🍓 유리알 탕후루: 얇고 투명한 설탕 껍질이 "빠작!" 하고 날카롭게 깨지며 유리 조각이 흩어지고 → 과즙이 촉촉하게 눌린다
  'sugar-crack': {
    total: 0.6,
    finish: { reverb: 0.05, level: 0.95, highCut: 14500 },
    build: (m) => {
      tick(m, 0, jit(m, 6400), 0.7, 1, -0.1)
      crackCluster(m, 0.001, { n: 24, spanMs: 34, fLo: jit(m, 3600), fHi: jit(m, 9800), dLo: 0.4, dHi: 1.6, amp: 0.95, ampDecay: 1.6, noiseMix: 0.62, panSpread: 0.5 })
      // 유리 조각이 사방으로 튀는 소리
      scatter(m, 0.03, { count: 12, spanMs: 240, p: 1.5, fLo: 4800, fHi: 11000, dMs: 0.5, amp: 0.32 })
      // 과즙이 터지듯 눌리는 촉촉함
      smack(m, 0.07, { f: 720, q: 1.4, decayMs: 34, amp: 0.38, glide: 1.5, pan: 0.1 })
      swell(m, 0.08, 0.14, { type: 'bp', f0: 500, f1: 1500, q: 1.2, attackMs: 20, releaseMs: 70, amp: 0.14, color: 'pink' })
    },
  },

  // 🍡 찹쌀떡모찌: 말랑한 반죽이 포근하게 눌리고 → 끈적하게 길게 늘어나다 → "쩍" 하고 떨어지는 소리 (소음으로만 만들어 음정이 없다)
  'mochi-squish': {
    total: 0.95,
    finish: { reverb: 0.06, level: 0.95, highCut: 10500 },
    build: (m) => {
      // 포근하게 눌림
      swell(m, 0, 0.16, { type: 'lp', f0: 900, f1: 380, q: 0.7, attackMs: 24, releaseMs: 90, amp: 0.3, color: 'brown' })
      smack(m, 0.02, { f: 320, q: 0.9, decayMs: 50, amp: 0.38, glide: 0.8, color: 'pink' })
      // 쫀득하게 길게 늘어남: 끈적한 실이 가늘어지는 마찰 소음 (주파수가 올라가며 떨림)
      swell(m, 0.14, 0.42, { type: 'bp', f0: 320, f1: 1500, q: 1.4, attackMs: 70, releaseMs: 160, amp: 0.34, color: 'pink', amRate: 9, amDepth: 0.65 })
      swell(m, 0.2, 0.3, { type: 'bp', f0: 1800, f1: 3200, q: 1.6, attackMs: 50, releaseMs: 130, amp: 0.06, amRate: 17, amDepth: 0.9, pan: 0.2 })
      // 늘어나는 중간중간 침 같은 끈적한 방울이 터지는 "쩝"
      smack(m, 0.3, { f: 560, q: 1.5, decayMs: 20, amp: 0.3, glide: 1.8, pan: -0.25 })
      smack(m, 0.42, { f: 700, q: 1.5, decayMs: 18, amp: 0.26, glide: 1.9, pan: 0.25 })
      // 손끝에서 떨어지며 "쩍!"
      tick(m, 0.58, 2000, 6, 0.4, 0.1)
      smack(m, 0.58, { f: 1100, q: 1.3, decayMs: 22, amp: 0.55, glide: 2.0 })
      smack(m, 0.64, { f: 480, q: 1.2, decayMs: 40, amp: 0.3, glide: 0.8, color: 'pink' })
      swell(m, 0.02, 0.8, { type: 'bp', f0: 3000, f1: 6800, q: 0.8, attackMs: 70, releaseMs: 280, amp: 0.2, amRate: 9, amDepth: 0.7 })
      scatter(m, 0.14, { count: 16, spanMs: 440, p: 1.1, fLo: 2500, fHi: 7000, dMs: 0.8, amp: 0.18 })
    },
  },

  // 🍮 말랑푸딩: 숟가락이 "톡" 닿고 → 부드러운 커스터드가 "푹" 갈라지며 → 촉촉한 "쯥" 하고 숟가락이 빠진다
  'pudding-jiggle': {
    total: 0.8,
    finish: { reverb: 0.08, level: 0.95, highCut: 9000 },
    build: (m) => {
      tick(m, 0, 2400, 3, 0.32, -0.15)
      // 푸욱: 낮고 부드럽게 파고드는 소리
      swell(m, 0.012, 0.2, { type: 'lp', f0: 800, f1: 300, q: 0.7, attackMs: 22, releaseMs: 110, amp: 0.3, color: 'brown' })
      smack(m, 0.03, { f: 380, q: 0.9, decayMs: 60, amp: 0.4, glide: 0.8, color: 'pink' })
      // 부드럽게 출렁이는 표면: 아주 낮은 소음의 느린 떨림 (소리가 아니라 숨결)
      swell(m, 0.1, 0.4, { type: 'bp', f0: 220, f1: 420, q: 0.9, attackMs: 60, releaseMs: 180, amp: 0.14, color: 'pink', amRate: 5.5, amDepth: 0.6 })
      // 숟가락이 빠지며 공기가 들어가는 촉촉한 소리
      smack(m, 0.36, { f: 520, q: 1.4, decayMs: 26, amp: 0.4, glide: 1.7, pan: 0.15 })
      smack(m, 0.45, { f: 360, q: 1.3, decayMs: 22, amp: 0.26, glide: 1.6, pan: -0.15 })
      swell(m, 0.01, 0.55, { type: 'bp', f0: 2500, f1: 6000, q: 0.7, attackMs: 30, releaseMs: 260, amp: 0.24 })
      scatter(m, 0.3, { count: 10, spanMs: 260, p: 1.0, fLo: 2200, fHi: 6500, dMs: 0.8, amp: 0.2 })
    },
  },

  // 🐻 쫀득젤리: 탄력 있는 젤리를 "꾹" 깨물면 저항하다 → 쫀득하게 씹히고 → "탁" 튕겨 돌아오는 소리
  'jelly-gummy': {
    total: 0.85,
    finish: { reverb: 0.05, level: 0.95, highCut: 11000 },
    build: (m) => {
      tick(m, 0, 2800, 2.5, 0.48, -0.1)
      // 이빨에 눌리는 탄성의 저항: 고무가 마찰하듯 가늘고 짧게 떠는 소음
      swell(m, 0.01, 0.13, { type: 'bp', f0: 1500, f1: 2700, q: 2.6, attackMs: 14, releaseMs: 60, amp: 0.2, amRate: 34, amDepth: 0.55 })
      smack(m, 0.02, { f: 520, q: 1.2, decayMs: 40, amp: 0.45, glide: 0.8, color: 'pink' })
      // 쫀득쫀득 씹는 촉촉한 소리 세 번
      smack(m, 0.17, { f: 1150, q: 1.6, decayMs: 15, amp: 0.4, glide: 1.4, pan: -0.2 })
      smack(m, 0.27, { f: 950, q: 1.6, decayMs: 15, amp: 0.34, glide: 1.4, pan: 0.2 })
      smack(m, 0.39, { f: 1350, q: 1.6, decayMs: 14, amp: 0.36, glide: 1.5 })
      swell(m, 0.15, 0.3, { type: 'bp', f0: 600, f1: 1400, q: 1.1, attackMs: 40, releaseMs: 140, amp: 0.12, color: 'pink', amRate: 11, amDepth: 0.7 })
      // 탄력 있게 "탁" 튕겨 돌아옴
      smack(m, 0.52, { f: 2200, q: 1.3, decayMs: 7, amp: 0.45, glide: 1.2 })
      smack(m, 0.55, { f: 700, q: 1.1, decayMs: 26, amp: 0.3, glide: 0.9, color: 'pink' })
      swell(m, 0.02, 0.6, { type: 'bp', f0: 3200, f1: 7000, q: 0.8, attackMs: 40, releaseMs: 240, amp: 0.1, amRate: 12, amDepth: 0.5 })
      scatter(m, 0.16, { count: 12, spanMs: 360, p: 1.0, fLo: 2600, fHi: 8000, dMs: 0.7, amp: 0.1 })
    },
  },

  // 🍫 달콤초코: 따뜻하게 녹은 초콜릿이 걸쭉하게 흐르며 느린 방울이 "꾸륵…꾸륵" 터지는 소리 (낮고 굵은 소음 방울)
  'choco-melt': {
    total: 1.4,
    finish: { reverb: 0.1, level: 0.95, highCut: 8500 },
    build: (m) => {
      // 걸쭉하게 흐르는 숨결
      swell(m, 0, 1.2, { type: 'lp', f0: 650, f1: 380, q: 0.7, attackMs: 140, releaseMs: 380, amp: 0.2, color: 'brown', amRate: 3, amDepth: 0.4 })
      // 느리고 큰 방울들: 불규칙한 간격, 낮은 소음 (맑은 음정 없이 "꾸륵")
      smack(m, 0.08, { f: 240, q: 1.0, decayMs: 65, amp: 0.5, glide: 2.0, color: 'pink' })
      smack(m, 0.4, { f: 240, q: 1.1, decayMs: 55, amp: 0.55, glide: 2.1, color: 'pink', pan: -0.2 })
      smack(m, 0.66, { f: 210, q: 1.0, decayMs: 80, amp: 0.5, glide: 2.2, color: 'pink', pan: 0.2 })
      smack(m, 1.0, { f: 220, q: 1.1, decayMs: 60, amp: 0.5, glide: 2.0, color: 'pink' })
      // 걸쭉한 표면의 작은 기포들
      fizz(m, 0.05, 1.2, { density: 26, decayK: 1.1, fLo: 500, fHi: 1700, amp: 0.2, dLo: 1.2, dHi: 3.4, noiseMix: 0.9 })
      swell(m, 0, 1.2, { type: 'bp', f0: 2400, f1: 5200, q: 0.7, attackMs: 160, releaseMs: 400, amp: 0.17, amRate: 4, amDepth: 0.5 })
      scatter(m, 0.1, { count: 24, spanMs: 1000, p: 1.0, fLo: 2200, fHi: 7000, dMs: 0.9, amp: 0.16 })
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

  // 🌰 콩콩 도토리: 단단한 껍질이 "딱!" 갈라지며 속이 비어 울리는 "톡" → 껍질 조각이 후드득
  'acorn-snap': {
    total: 0.5,
    finish: { reverb: 0.05, level: 0.95, highCut: 12000 },
    build: (m) => {
      tick(m, 0, jit(m, 4200), 0.9, 1, -0.1)
      crackCluster(m, 0.001, { n: 8, spanMs: 12, fLo: jit(m, 2600), fHi: jit(m, 7200), dLo: 0.5, dHi: 1.8, amp: 0.9, ampDecay: 1.4, noiseMix: 0.6, panSpread: 0.4 })
      // 속이 빈 열매가 울리는 "톡" (맑은 종소리가 아니라 짧은 소음 덩어리)
      smack(m, 0.002, { f: 820, q: 2.0, decayMs: 16, amp: 0.7, glide: 0.85 })
      // 껍질 조각이 떨어지는 소리
      crackCluster(m, 0.05, { n: 10, spanMs: 150, skew: 1.8, fLo: 1800, fHi: 5500, dLo: 0.8, dHi: 2.6, amp: 0.42, ampDecay: 2, noiseMix: 0.6, panSpread: 0.6 })
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

  // 🛡️ 강철등 비스킷: 단단하고 두꺼운 통밀 비스킷이 "콰득!" 부러지며 낮은 균열이 퍼지고 → 부스러기가 후두둑
  'biscuit-armor': {
    total: 0.75,
    finish: { reverb: 0.05, level: 0.95, highCut: 11000 },
    build: (m) => {
      tick(m, 0, 2400, 1.4, 0.8, -0.1)
      crackCluster(m, 0.001, { n: 12, spanMs: 34, fLo: jit(m, 1100), fHi: jit(m, 3800), dLo: 1.2, dHi: 4.5, amp: 1, ampDecay: 1.5, noiseMix: 0.6, panSpread: 0.4 })
      // 두꺼운 반죽이 눌려 부러지는 낮은 "툭"
      smack(m, 0.004, { f: 360, q: 1.1, decayMs: 30, amp: 0.7, glide: 0.8, color: 'pink' })
      // 부스러기
      crackCluster(m, 0.05, { n: 28, spanMs: 340, skew: 1.7, fLo: 1900, fHi: 6500, dLo: 0.6, dHi: 2.6, amp: 0.46, ampDecay: 1.7, noiseMix: 0.62, panSpread: 0.6 })
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

  // ✨ 별비늘 별사탕: 작고 단단한 설탕 결정이 "오도독" 아주 곱고 밝게 부서지는 소리 (맑은 종소리 아님)
  'starlight-ting': {
    total: 0.95,
    finish: { reverb: 0.06, level: 0.9, highCut: 15500 },
    build: (m) => {
      tick(m, 0, 7600, 0.7, 0.75, -0.1)
      crackCluster(m, 0.002, { n: 26, spanMs: 260, skew: 1.9, fLo: jit(m, 5200), fHi: jit(m, 12500), dLo: 0.35, dHi: 1.1, amp: 0.85, ampDecay: 1.3, noiseMix: 0.7, panSpread: 0.7 })
      // 곱게 부서진 설탕 가루가 흩어지는 소리
      scatter(m, 0.02, { count: 20, spanMs: 520, p: 1.2, fLo: 6500, fHi: 13500, dMs: 0.4, amp: 0.2 })
      smack(m, 0.01, { f: 1700, q: 1.2, decayMs: 12, amp: 0.2, glide: 0.9 })
    },
  },

  // 🦎 말랑 카멜레온: 반죽이 늘어나며 모양이 바뀌는 끈적한 변신 → "뽁" 하고 새 모양으로 튀어나온다
  'chameleon-morph': {
    total: 1.2,
    finish: { reverb: 0.07, level: 0.95, highCut: 10500 },
    build: (m) => {
      // 반죽이 위로 길게 늘어나는 소리 (소음의 주파수가 올라가며 떨림)
      swell(m, 0, 0.58, { type: 'bp', f0: 300, f1: 2400, q: 1.1, attackMs: 80, releaseMs: 180, amp: 0.3, color: 'pink', amRate: 8, amDepth: 0.6 })
      smack(m, 0.1, { f: 520, q: 1.3, decayMs: 18, amp: 0.3, glide: 1.7, pan: -0.3 })
      smack(m, 0.26, { f: 820, q: 1.3, decayMs: 16, amp: 0.3, glide: 1.8, pan: 0.3 })
      smack(m, 0.42, { f: 1250, q: 1.3, decayMs: 13, amp: 0.3, glide: 1.9 })
      // 새 모양으로 "뽁!"
      tick(m, 0.62, 3200, 3, 0.45, 0)
      smack(m, 0.62, { f: 1800, q: 1.2, decayMs: 11, amp: 0.6, glide: 2.2 })
      // 새 모양이 되며 반짝이는 작은 기포들이 사르르 터진다
      fizz(m, 0.66, 0.5, { density: 46, decayK: 3.2, fLo: 1500, fHi: 6500, amp: 0.18, dLo: 0.4, dHi: 1.3, noiseMix: 0.9 })
      swell(m, 0.02, 0.75, { type: 'bp', f0: 2600, f1: 6500, q: 0.8, attackMs: 80, releaseMs: 260, amp: 0.1, amRate: 7, amDepth: 0.6 })
      scatter(m, 0.1, { count: 12, spanMs: 560, p: 1.1, fLo: 2400, fHi: 7500, dMs: 0.8, amp: 0.09 })
    },
  },

  // 🍒 시럽 & 스프링클 토핑: 시럽이 "쪼르륵" 흐르며 작은 기포가 이어 터지고 → 스프링클이 후드득 (소음 기포로만)
  'syrup-drizzle': {
    total: 1.0,
    finish: { reverb: 0.07, level: 0.95, highCut: 12500 },
    build: (m) => {
      // 흐르는 액체
      swell(m, 0, 0.7, { type: 'bp', f0: 800, f1: 1900, q: 1.1, attackMs: 90, releaseMs: 240, amp: 0.2, color: 'pink', amRate: 12, amDepth: 0.35 })
      // 작은 기포가 잇달아 터지는 소리 (음정 없는 소음 기포)
      fizz(m, 0.02, 0.8, { density: 75, decayK: 1.2, fLo: 500, fHi: 2600, amp: 0.26, dLo: 0.6, dHi: 2.2, noiseMix: 0.85 })
      // 처음 닿을 때와 끝에 고이는 "퐁"
      smack(m, 0.03, { f: 430, q: 1.3, decayMs: 26, amp: 0.4, glide: 1.7 })
      smack(m, 0.62, { f: 520, q: 1.3, decayMs: 22, amp: 0.3, glide: 1.8, pan: 0.2 })
      // 스프링클이 떨어지는 소리
      scatter(m, 0.5, { count: 14, spanMs: 380, p: 1.4, fLo: 4200, fHi: 9500, dMs: 0.5, amp: 0.2 })
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
