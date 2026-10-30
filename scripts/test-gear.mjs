// 장비·강화 규칙 검증:  npm run test:gear
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildGearMigration, OUT } from './gen-gear-migration.mjs'
import {
  GEAR_BAG_LIMIT,
  GEAR_BOSS_EVERY,
  GEAR_DEFS,
  GEAR_DROPS,
  GEAR_ENHANCE,
  GEAR_GRADES,
  GEAR_MAX_LEVEL,
  GEAR_SLOTS,
  gearStatValue,
} from '../src/config/equipment.ts'
import { simulateAsmrBattle } from '../supabase/functions/battle/engine.ts'

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
let passed = 0
const test = (name, fn) => {
  fn()
  passed++
  console.log('  ✓', name)
}

console.log('장비·강화')
test('DB 마이그레이션이 화면 설정(equipment.ts)에서 만든 것과 같다 (어긋나면 gen-gear-migration 을 다시 돌린다)', () => {
  assert.equal(read(OUT), buildGearMigration())
})
test('장비 표: 슬롯 3칸·등급 4단계가 모두 있고 id 가 겹치지 않는다', () => {
  assert.equal(new Set(GEAR_DEFS.map((d) => d.id)).size, GEAR_DEFS.length)
  for (const s of GEAR_SLOTS) for (const g of Object.keys(GEAR_GRADES)) assert.ok(GEAR_DEFS.some((d) => d.slot === s.id && d.grade === g), `${s.id}/${g} 없음`)
})
test('등급이 높을수록 같은 칸 장비의 능력치 합이 커지고, 상점에서 파는 건 일반뿐이다', () => {
  const order = ['common', 'fine', 'rare', 'legend']
  for (const s of GEAR_SLOTS) {
    const sums = order.map((g) => Object.values(GEAR_DEFS.find((d) => d.slot === s.id && d.grade === g).bonus).reduce((a, b) => a + b, 0))
    for (let i = 1; i < sums.length; i++) assert.ok(sums[i] > sums[i - 1], `${s.id} 등급 순서`)
  }
  for (const d of GEAR_DEFS) assert.equal(d.price !== null, d.grade === 'common')
})
test('강화 표가 기획서와 같다: +1~3 100%, +4~6 70%, +7~9 40%, +10 20%, 비용 50/100/150/300/400/500/800/1000/1200/2000', () => {
  assert.equal(GEAR_ENHANCE.length, GEAR_MAX_LEVEL)
  assert.deepEqual(GEAR_ENHANCE.map((r) => r.chance), [100, 100, 100, 70, 70, 70, 40, 40, 40, 20])
  assert.deepEqual(GEAR_ENHANCE.map((r) => r.cost), [50, 100, 150, 300, 400, 500, 800, 1000, 1200, 2000])
})
test('단계마다 능력치 +5% (반올림), 0단계는 기본값', () => {
  assert.equal(gearStatValue(20, 0), 20)
  assert.equal(gearStatValue(20, 10), 30)
  assert.equal(gearStatValue(6, 5), 8)
})
test('DB 함수는 코인 차감을 한 번의 조건부 갱신으로 하고, 실패해도 단계가 내려가지 않는다', () => {
  const sql = read(OUT)
  assert.match(sql, /update public\.players set coins = coins - rule\.cost where id = uid and coins >= rule\.cost returning coins/)
  assert.match(sql, /update public\.players set coins = coins - d\.price where id = uid and coins >= d\.price returning coins/)
  assert.ok(!/level = level - 1|level = it\.level - 1/.test(sql))
  assert.match(sql, /won := \(random\(\) \* 100\) < rule\.chance/)
})
test('장비 테이블은 화면이 직접 쓸 수 없고(읽기만), 내부 함수는 로그인한 사용자가 못 부른다', () => {
  const sql = read(OUT)
  assert.match(sql, /revoke all on public\.gear_items from anon, authenticated;\ngrant select on public\.gear_items to authenticated;/)
  assert.match(sql, /revoke all on function public\.gear_bonus\(uuid\) from public, anon, authenticated/)
  assert.match(sql, /revoke all on function public\.gear_tower_drop\(uuid, int, int\) from public, anon, authenticated/)
  assert.ok(!/grant (insert|update|delete)/.test(sql))
})
test('드롭 규칙: 보스 층 5층마다, 가방 한도가 설정과 같다', () => {
  const sql = read(OUT)
  assert.ok(sql.includes(`x % ${GEAR_BOSS_EVERY} = 0`))
  assert.ok(sql.includes(`have >= ${GEAR_BAG_LIMIT}`))
  for (const g of new Set(GEAR_DROPS.map((r) => r.grade))) assert.ok(GEAR_DEFS.some((d) => d.grade === g))
})
test('서버 함수가 장비를 쓴다: 대전은 gear_bonus 로 양쪽 능력치를 더하고, 타워는 전투력과 보스 층 드롭에 쓴다', () => {
  const battle = read('supabase/functions/battle/index.ts')
  const care = read('supabase/functions/care/index.ts')
  assert.ok(battle.includes("admin.rpc('gear_bonus', { p_monster: mine.id })") && battle.includes("admin.rpc('gear_bonus', { p_monster: other.id })"))
  assert.ok(care.includes("admin.rpc('gear_bonus'") && care.includes("admin.rpc('gear_tower_drop'"))
})
test('장비 능력치가 대전 결과에 반영된다 (같은 시드에서 체력 장비를 낀 쪽 최대 체력이 늘어난다)', () => {
  const mon = (gear) => ({ name: 't', species: 'mochi', element: 'earth', level: 5, stats: { hp: 50, atk: 40, def: 40, spd: 35, int: 35, cha: 35 }, gear })
  const a = simulateAsmrBattle(mon(null), mon(null), 123)
  const b = simulateAsmrBattle(mon({ hp: 20 }), mon(null), 123)
  assert.equal(b.challengerMaxHp - a.challengerMaxHp, 60)
  assert.equal(b.defenderMaxHp, a.defenderMaxHp)
})

console.log(`\n${passed}개 통과`)
