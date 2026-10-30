// 소리를 고치기 전/후를 번갈아 들어 보는 비교 파일 만들기:
//   node scripts/sound-compare.mjs <고치기 전 soundSynth.ts 경로>
// 출력: design/sounds/real-food/비교-이전_새로.wav (디저트마다 "이전 → 새 소리"를 이어 붙임), 새 소리 WAV 개별 파일
import { mkdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import * as after from '../src/lib/soundSynth.ts'

const beforePath = process.argv[2]
if (!beforePath) throw new Error('고치기 전 soundSynth.ts 경로를 넘겨 주세요')
const before = await import(pathToFileURL(resolve(beforePath)).href)

const SR = 44100
const OUT = 'design/sounds/real-food'
mkdirSync(OUT, { recursive: true })

const KINDS = [
  ['mochi-squish', '찹쌀떡모찌'],
  ['pudding-jiggle', '말랑푸딩'],
  ['jelly-gummy', '쫀득젤리'],
  ['choco-melt', '달콤초코'],
  ['chameleon-morph', '말랑카멜레온'],
  ['sugar-crack', '유리알탕후루'],
  ['acorn-snap', '콩콩도토리'],
  ['biscuit-armor', '강철등비스킷'],
  ['starlight-ting', '별비늘별사탕'],
  ['syrup-drizzle', '시럽토핑'],
  ['wax-pop', '왁뿌볼'],
]

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
const wav = (L, R) => {
  const n = L.length
  const buf = Buffer.alloc(44 + n * 4)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28)
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40)
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4)
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4)
  }
  return buf
}
const rms = (s) => Math.sqrt(s.L.reduce((a, v) => a + v * v, 0) / s.L.length)
// 음량 착시를 막으려고 이전/새 소리의 평균 음량을 같게 맞춘다
const level = (s, target) => {
  const g = target / (rms(s) || 1)
  for (let i = 0; i < s.L.length; i++) { s.L[i] *= g; s.R[i] *= g }
  return s
}

const gapS = Math.round(SR * 0.45)
const gapBig = Math.round(SR * 1.1)
const chunks = []
for (const [kind] of KINDS) {
  const b = before.synthesizeDessertSound(kind, SR, seeded(777))
  const a = after.synthesizeDessertSound(kind, SR, seeded(777))
  const target = 0.03
  level(b, target)
  level(a, target)
  writeFileSync(`${OUT}/${kind}.wav`, wav(a.L, a.R))
  chunks.push(b, 'gap', a, 'bigGap')
}
let total = 0
for (const c of chunks) total += c === 'gap' ? gapS : c === 'bigGap' ? gapBig : c.L.length
const L = new Float32Array(total)
const R = new Float32Array(total)
let pos = 0
for (const c of chunks) {
  if (c === 'gap') pos += gapS
  else if (c === 'bigGap') pos += gapBig
  else { L.set(c.L, pos); R.set(c.R, pos); pos += c.L.length }
}
// 너무 크면 눌러 준다
let peak = 0
for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
const g = peak > 0.9 ? 0.9 / peak : 1
for (let i = 0; i < total; i++) { L[i] *= g; R[i] *= g }
writeFileSync(`${OUT}/비교-이전_새로.wav`, wav(L, R))
console.log('순서:', KINDS.map(([, n], i) => `${i + 1}.${n}`).join('  '))
console.log('길이', (total / SR).toFixed(1) + '초')
