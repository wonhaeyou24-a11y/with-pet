// 디저트 사운드 연구실: 합성한 소리를 분석하고(귀로 듣는 차이를 숫자로 확인), 직접 들어 볼 WAV와 스펙트로그램 시트를 만든다.
//   npm run sound:lab
// 출력: design/sounds/*.wav (소리 17종), design/sounds/spectrogram-sheet.png, 콘솔 분석표
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { SYNTH_KINDS, synthesizeDessertSound } from '../src/lib/soundSynth.ts'

const SR = 44100
const OUT = 'design/sounds'
mkdirSync(OUT, { recursive: true })

// 같은 소리를 재현할 수 있도록 시드 난수를 쓴다
function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ───────── FFT ─────────
function fft(re, im) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wr = Math.cos(ang)
    const wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k]
        const ui = im[i + k]
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr
        re[i + k] = ur + vr
        im[i + k] = ui + vi
        re[i + k + len / 2] = ur - vr
        im[i + k + len / 2] = ui - vi
        const nr = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = nr
      }
    }
  }
}

function stft(mono, N, hop) {
  const win = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)))
  const frames = []
  for (let s = 0; s + N <= mono.length + N / 2; s += hop) {
    const re = new Float64Array(N)
    const im = new Float64Array(N)
    for (let i = 0; i < N; i++) re[i] = (mono[s + i] ?? 0) * win[i]
    fft(re, im)
    const mag = new Float64Array(N / 2)
    for (let i = 0; i < N / 2; i++) mag[i] = re[i] * re[i] + im[i] * im[i]
    frames.push(mag)
  }
  return frames
}

// ───────── 분석 ─────────
function analyze(snd) {
  const n = snd.L.length
  const mono = new Float64Array(n)
  let peak = 0
  let sum2 = 0
  for (let i = 0; i < n; i++) {
    const v = (snd.L[i] + snd.R[i]) / 2
    mono[i] = v
    peak = Math.max(peak, Math.abs(snd.L[i]), Math.abs(snd.R[i]))
    sum2 += v * v
  }
  const N = 2048
  const frames = stft(mono, N, 512)
  const bins = N / 2
  const hz = (k) => (k * SR) / N
  const total = new Float64Array(bins)
  for (const f of frames) for (let k = 0; k < bins; k++) total[k] += f[k]
  let e = 0
  let ce = 0
  for (let k = 1; k < bins; k++) {
    e += total[k]
    ce += total[k] * hz(k)
  }
  const centroid = ce / e
  let acc = 0
  let rolloff = 0
  for (let k = 1; k < bins; k++) {
    acc += total[k]
    if (acc >= 0.85 * e) {
      rolloff = hz(k)
      break
    }
  }
  const band = (lo, hi) => {
    let s = 0
    for (let k = 1; k < bins; k++) if (hz(k) >= lo && hz(k) < hi) s += total[k]
    return s / e
  }
  // 음정감(0=잡음 같은 바삭함, 1=또렷한 음높이): 프레임별 스펙트럼 평탄도의 반대, 에너지로 가중 평균
  let tw = 0
  let ts = 0
  for (const f of frames) {
    let s = 0
    let lg = 0
    for (let k = 2; k < bins; k++) {
      s += f[k]
      lg += Math.log(f[k] + 1e-18)
    }
    if (s < 1e-9) continue
    const flat = Math.exp(lg / (bins - 2)) / (s / (bins - 2))
    ts += (1 - Math.min(1, flat * 8)) * s
    tw += s
  }
  const tonal = tw ? ts / tw : 0
  // 소리가 시작되는 지점(타격) 수: 4ms 단위 에너지가 갑자기 커지는 곳
  const w = Math.floor(0.004 * SR)
  const env = []
  for (let s = 0; s + w <= n; s += w) {
    let a = 0
    for (let i = 0; i < w; i++) a += mono[s + i] * mono[s + i]
    env.push(10 * Math.log10(a / w + 1e-12))
  }
  const gmax = Math.max(...env)
  let onsets = 0
  let last = -99
  for (let i = 3; i < env.length; i++) {
    const before = Math.min(env[i - 1], env[i - 2], env[i - 3])
    if (env[i] > before + 9 && env[i] > gmax - 32 && i - last >= 5) {
      onsets++
      last = i
    }
  }
  // 소리가 최고점에서 -30dB까지 가라앉는 데 걸린 시간 (잔향·꼬리 길이)
  const pk = env.indexOf(gmax)
  let tail = env.length
  for (let i = env.length - 1; i > pk; i--) {
    if (env[i] > gmax - 30) {
      tail = i
      break
    }
  }
  return {
    dur: n / SR,
    peakDb: 20 * Math.log10(peak + 1e-12),
    rmsDb: 10 * Math.log10(sum2 / n + 1e-12),
    centroid,
    rolloff,
    low: band(0, 400),
    mid: band(400, 2000),
    high: band(2000, 6000),
    air: band(6000, 22050),
    onsets,
    tonal,
    tail: (tail * w) / SR,
    frames,
  }
}

// ───────── WAV ─────────
function wav(snd) {
  const n = snd.L.length
  const buf = Buffer.alloc(44 + n * 4)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 4, 4)
  buf.write('WAVEfmt ', 8)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(2, 22)
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 4, 28)
  buf.writeUInt16LE(4, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 4, 40)
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(snd.L[i] * 32767))), 44 + i * 4)
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(snd.R[i] * 32767))), 46 + i * 4)
  }
  return buf
}

// ───────── PNG(스펙트로그램 시트) ─────────
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (b) => {
  let c = 0xffffffff
  for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function png(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
const heat = (v) => {
  // 어두운 남색 → 보라 → 주황 → 연노랑
  const stops = [
    [10, 10, 40],
    [70, 30, 120],
    [200, 70, 90],
    [250, 170, 60],
    [255, 250, 200],
  ]
  const x = Math.max(0, Math.min(1, v)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(x))
  const f = x - i
  return stops[i].map((c, k) => Math.round(c + (stops[i + 1][k] - c) * f))
}

// ───────── 실행 ─────────
const rows = []
const sounds = []
SYNTH_KINDS.forEach((kind, i) => {
  const t0 = performance.now()
  const snd = synthesizeDessertSound(kind, SR, seeded(1000 + i * 17))
  const ms = performance.now() - t0
  const a = analyze(snd)
  writeFileSync(`${OUT}/${kind}.wav`, wav(snd))
  rows.push({ kind, ms, ...a })
  sounds.push({ kind, a })
})

const f1 = (v) => v.toFixed(1)
console.log('종류'.padEnd(17), '길이s', '꼬리s', '피크dB', 'RMSdB', '무게중심Hz', '85%Hz', '저<400', '중', '고2-6k', '공기>6k', '타격수', '음정감', '계산ms')
for (const r of rows) {
  console.log(
    r.kind.padEnd(17),
    f1(r.dur).padStart(5),
    f1(r.tail).padStart(5),
    f1(r.peakDb).padStart(6),
    f1(r.rmsDb).padStart(6),
    String(Math.round(r.centroid)).padStart(8),
    String(Math.round(r.rolloff)).padStart(6),
    (r.low * 100).toFixed(0).padStart(6) + '%',
    (r.mid * 100).toFixed(0).padStart(3) + '%',
    (r.high * 100).toFixed(0).padStart(5) + '%',
    (r.air * 100).toFixed(0).padStart(6) + '%',
    String(r.onsets).padStart(5),
    r.tonal.toFixed(2).padStart(6),
    f1(r.ms).padStart(6),
  )
}

// 서로 얼마나 다른가: 소리 지문(대역 비율·길이·타격수·무게중심)의 가장 가까운 짝
const fp = (r) => [Math.log2(r.centroid) / 4, r.low, r.mid, r.high, r.air, Math.min(r.dur, 1.6) / 1.6, Math.min(r.onsets, 24) / 24, Math.min(r.tail, 1.4) / 1.4, r.tonal * 0.8]
let closest = []
for (let i = 0; i < rows.length; i++) {
  for (let j = i + 1; j < rows.length; j++) {
    const a = fp(rows[i])
    const b = fp(rows[j])
    const d = Math.sqrt(a.reduce((s, v, k) => s + (v - b[k]) ** 2, 0))
    closest.push([d, rows[i].kind, rows[j].kind])
  }
}
closest.sort((x, y) => x[0] - y[0])
console.log('\n가장 비슷한 소리 짝 (숫자가 작을수록 비슷, 0.25 미만이면 거의 같게 들릴 수 있음)')
closest.slice(0, 6).forEach(([d, a, b]) => console.log(' ', d.toFixed(2), a, '↔', b))

// 스펙트로그램 시트
const COLS = 4
const TW = 220
const TH = 110
const PAD = 6
const rowsN = Math.ceil(sounds.length / COLS)
const W = COLS * (TW + PAD) + PAD
const H = rowsN * (TH + PAD) + PAD
const img = Buffer.alloc(W * H * 3, 24)
sounds.forEach(({ a }, idx) => {
  const ox = PAD + (idx % COLS) * (TW + PAD)
  const oy = PAD + Math.floor(idx / COLS) * (TH + PAD)
  const frames = stft(Float64Array.from({ length: Math.floor(a.dur * SR) }, () => 0), 8, 8) && a.frames
  const maxT = 1.3
  const hopS = 512 / SR
  let gmax = 1e-12
  for (const f of a.frames) for (let k = 0; k < f.length; k++) gmax = Math.max(gmax, f[k])
  for (let x = 0; x < TW; x++) {
    const t = (x / TW) * maxT
    const fi = Math.min(a.frames.length - 1, Math.floor(t / hopS))
    for (let y = 0; y < TH; y++) {
      const fy = 80 * Math.pow(16000 / 80, 1 - y / TH)
      const k = Math.min(1023, Math.floor((fy * 2048) / SR))
      const v = t / hopS < a.frames.length ? a.frames[fi][k] : 0
      const db = 10 * Math.log10(v / gmax + 1e-12)
      const c = heat((db + 62) / 62)
      const p = ((oy + y) * W + ox + x) * 3
      img[p] = c[0]
      img[p + 1] = c[1]
      img[p + 2] = c[2]
    }
  }
})
writeFileSync(`${OUT}/spectrogram-sheet.png`, png(W, H, img))
console.log('\n순서(왼쪽→오른쪽, 위→아래):', SYNTH_KINDS.map((k, i) => `${i + 1}.${k}`).join('  '))
console.log('저장:', OUT)
