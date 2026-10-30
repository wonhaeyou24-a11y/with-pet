// 왁뿌볼 선택음 후보를 만들어 비교해 듣는 도구:  node scripts/wax-tap-variants.mjs
// 출력: design/sounds/wax-tap-variants/*.wav (후보별 + 이어 붙인 비교 파일)
import { mkdirSync, writeFileSync } from 'node:fs'
import { synthesizeWaxTapVariant, WAX_TAP_DEFAULT } from '../src/lib/soundSynth.ts'

const SR = 44100
const OUT = 'design/sounds/wax-tap-variants'
mkdirSync(OUT, { recursive: true })

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

const VARIANTS = [
  ['1-지금소리', { ...WAX_TAP_DEFAULT }],
  ['2-더밝게', { ...WAX_TAP_DEFAULT, fScale: 1.3, shimmer: 1.7, clicks: 46 }],
  ['3-더묵직하게', { ...WAX_TAP_DEFAULT, fScale: 0.8, shimmer: 0.6, body: 1.0 }],
  ['4-밝고묵직하게', { ...WAX_TAP_DEFAULT, fScale: 1.25, shimmer: 1.4, body: 0.8 }],
]

function wav(L, R) {
  const n = L.length
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
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4)
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4)
  }
  return buf
}

// 소리의 밝기(스펙트럼 중심)와 음량 측정
function measure(L) {
  let rms = 0, peak = 0
  for (const v of L) { rms += v * v; peak = Math.max(peak, Math.abs(v)) }
  rms = Math.sqrt(rms / L.length)
  const N = 2048, seg = L.slice(0, N)
  let cn = 0, cd = 0
  for (let k = 1; k < N / 2; k += 2) {
    let re = 0, im = 0
    for (let i = 0; i < N; i++) { const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)); const ph = (2 * Math.PI * k * i) / N; re += seg[i] * w * Math.cos(ph); im -= seg[i] * w * Math.sin(ph) }
    const p = re * re + im * im, f = (k * SR) / N
    cn += f * p; cd += p
  }
  return { rmsDb: +(20 * Math.log10(rms + 1e-9)).toFixed(1), peak: +peak.toFixed(2), centroidHz: Math.round(cn / (cd || 1)) }
}

const parts = []
for (const [name, opts] of VARIANTS) {
  const s = synthesizeWaxTapVariant(opts, SR, seeded(20261030))
  // 음량 착시를 막으려고 모든 후보의 평균 음량을 같게 맞춘다 (원본 녹음 -31.6dB 부근)
  const g = Math.pow(10, (-31 - measure(s.L).rmsDb) / 20)
  for (let i = 0; i < s.L.length; i++) { s.L[i] *= g; s.R[i] *= g }
  writeFileSync(`${OUT}/${name}.wav`, wav(s.L, s.R))
  console.log(name.padEnd(10), JSON.stringify(measure(s.L)))
  parts.push(s)
}

// 이어 붙인 비교 파일: 후보마다 두 번씩, 사이에 0.9초 쉼
const gap = Math.round(SR * 0.9)
let total = 0
for (const s of parts) total += (s.L.length + gap) * 2
const L = new Float32Array(total), R = new Float32Array(total)
let pos = 0
for (const s of parts) {
  for (let rep = 0; rep < 2; rep++) {
    L.set(s.L, pos); R.set(s.R, pos)
    pos += s.L.length + gap
  }
}
writeFileSync(`${OUT}/비교-1지금_2밝게_3묵직_4밝고묵직.wav`, wav(L, R))
console.log('비교 파일 길이', (total / SR).toFixed(1) + '초')
