// PWA 임시 아이콘(알 모양) 생성기. 실제 아이콘이 생기면 public/icons/ 의 PNG만 교체하면 된다.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
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

const BG = [255, 244, 214]
const EGG = [255, 255, 255]
const SPOT = [255, 160, 140]

function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const cx = size / 2
  const cy = size * 0.54
  const rx = size * 0.24
  const ry = size * 0.31
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      // 위쪽이 좁은 알 모양: 위쪽 절반은 x 반경을 줄인다
      const narrow = dy < 0 ? 1 - 0.25 * -dy : 1
      const inEgg = (dx / narrow) ** 2 + dy ** 2 <= 1
      const sx = (x - cx - rx * 0.25) / (size * 0.07)
      const sy = (y - cy - ry * 0.2) / (size * 0.07)
      const inSpot = sx * sx + sy * sy <= 1
      const c = inEgg ? (inSpot ? SPOT : EGG) : BG
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i] = c[0]
      raw[i + 1] = c[1]
      raw[i + 2] = c[2]
      raw[i + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(`public/icons/${name}`, png(size))
}
