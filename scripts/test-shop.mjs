// 리본 코인·부티크·미션 서버 규칙 검증:  npm run test:shop
// 화면 설정(boutique.ts, missions.ts)과 DB 마이그레이션의 가격표·미션 규칙이 어긋나지 않는지 확인한다.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildMigration, parseDefaultOwned, parseMissionRules, parseShopItems } from './gen-shop-migration.mjs'

const boutique = readFileSync('src/config/boutique.ts', 'utf8')
const missions = readFileSync('src/config/missions.ts', 'utf8')
const migration = readFileSync('supabase/migrations/20261030300000_m5_shop_missions.sql', 'utf8').replace(/\r\n/g, '\n')

let passed = 0
const test = (name, fn) => {
  fn()
  passed++
  console.log('  ✓', name)
}

console.log('상점·미션 규칙')
test('DB 마이그레이션이 화면 설정(가격표·미션)에서 만든 것과 같다 — 다르면 node scripts/gen-shop-migration.mjs 를 다시 돌린다', () => {
  assert.equal(migration, buildMigration(boutique, missions))
})
test('상품 아이디는 중복이 없고 가격은 0 이상이다', () => {
  const items = parseShopItems(boutique)
  assert.ok(items.length >= 30, `상품이 ${items.length}개뿐이다`)
  assert.equal(new Set(items.map((i) => i.id)).size, items.length)
  for (const i of items) assert.ok(Number.isInteger(i.price) && i.price >= 0, i.id)
})
test('기본 지급 아이템은 모두 상품표에 있고 서버에서도 이미 가진 것으로 처리된다', () => {
  const ids = new Set(parseShopItems(boutique).map((i) => i.id))
  // 받침대의 기본 지급은 상품 id(base-nest) 와 받침대 종류 id(nest) 둘 다 들어 있다
  for (const m of boutique.matchAll(/baseId: '([^']+)'/g)) ids.add(m[1])
  const defaults = parseDefaultOwned(boutique)
  assert.ok(defaults.length >= 3)
  for (const d of defaults) {
    assert.ok(ids.has(d), `${d} 가 상품표에 없다`)
    assert.ok(migration.includes(`'${d}'`))
  }
})
test('미션 6개가 DB 규칙표에 들어 있고 목표·보상이 양수다', () => {
  const rules = parseMissionRules(missions)
  assert.equal(rules.length, 6)
  for (const r of rules) {
    assert.ok(r.target > 0 && r.coins >= 0 && r.ribbons >= 0, r.id)
    assert.ok(migration.includes(`('${r.id}', '${r.kind}', ${r.target}, ${r.coins}, ${r.ribbons})`), r.id)
  }
})

console.log('서버 기록 → 보상 연결')
test('트리거가 보는 기록 이름을 서버 함수들이 실제로 남긴다 (feed·play·rest·train_*·tower)', () => {
  const care = readFileSync('supabase/functions/care/logic.ts', 'utf8')
  assert.ok(care.includes("logAction: 'feed'"))
  assert.ok(care.includes('logAction: `train_${courseId}`'))
  assert.ok(care.includes("kind === 'play'") && care.includes("kind === 'rest'") && care.includes('logAction: kind'))
  const battle = readFileSync('supabase/functions/battle/index.ts', 'utf8')
  assert.ok(battle.includes("action: 'tower'") || readFileSync('supabase/functions/care/index.ts', 'utf8').includes("action: 'tower'"))
  assert.match(migration, /a = 'feed'/)
  assert.match(migration, /a = 'tower'/)
})
test('화면이 직접 한입 투표 기록을 만들 수 없다 (보상·미션 조작 방지)', () => {
  assert.match(migration, /revoke insert on public\.social_reactions from authenticated/)
})
test('하루 리본 획득 상한이 있고 구매·수령 함수는 로그인한 사용자만 부를 수 있다', () => {
  assert.match(migration, /cap constant int := 300/)
  assert.match(migration, /grant execute on function public\.shop_state\(\), public\.shop_buy\(text\), public\.shop_claim_mission\(text\) to authenticated/)
  assert.match(migration, /revoke all on function public\._game_event/)
})
test('실제 서비스에서는 화면이 리본 코인을 직접 올리지 못한다 (boutique.ts, missions.ts 의 분기)', () => {
  assert.ok(boutique.includes('if (!IS_DEV_MOCK) return getAccount().ribbon'))
  assert.ok(missions.includes('if (!IS_DEV_MOCK) return\n  try {'))
})

console.log(`\n${passed}개 통과`)
