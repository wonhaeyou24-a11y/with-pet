// 탐험 규칙 검증:  npm run test:explore
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { GEAR_DEFS } from '../src/config/equipment.ts'
import { FOODS } from '../supabase/functions/care/logic.ts'
import {
  applyTripClaim,
  checkTripStart,
  EXPLORE,
  effectivePower,
  isRegionOpen,
  recommendedPower,
  REGIONS,
  resolveTrip,
  tierOf,
} from '../supabase/functions/care/explore.ts'

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
let passed = 0
const test = (name, fn) => {
  fn()
  passed++
  console.log('  ✓', name)
}

console.log('탐험')
test('지역 6곳: 권장 전투력이 기획서 표(1구역→10구역)와 같고 구역이 올라갈수록 커진다', () => {
  const want = { 'dew-forest': [60, 200], 'sparkle-beach': [120, 320], 'bubbling-volcano': [200, 480], 'frost-field': [280, 600], 'cloud-island': [360, 720], 'forgotten-ruins': [480, 900] }
  assert.equal(REGIONS.length, 6)
  for (const r of REGIONS) {
    assert.deepEqual(r.power, want[r.id])
    assert.equal(recommendedPower(r, 1), r.power[0])
    assert.equal(recommendedPower(r, 10), r.power[1])
    for (let z = 2; z <= 10; z++) assert.ok(recommendedPower(r, z) > recommendedPower(r, z - 1))
  }
})
test('해금 조건: 이슬 숲은 처음부터, 바닷가 Lv5, 화산 2단계, 설원 Lv15, 구름섬 Lv20, 유적 3단계', () => {
  const open = (id, level, evoStage) => isRegionOpen(REGIONS.find((r) => r.id === id), { level, evoStage })
  assert.ok(open('dew-forest', 1, 1))
  assert.ok(!open('sparkle-beach', 4, 1) && open('sparkle-beach', 5, 1))
  assert.ok(!open('bubbling-volcano', 30, 1) && open('bubbling-volcano', 1, 2))
  assert.ok(!open('frost-field', 14, 3) && open('frost-field', 15, 1))
  assert.ok(!open('cloud-island', 19, 3) && open('cloud-island', 20, 1))
  assert.ok(!open('forgotten-ruins', 40, 2) && open('forgotten-ruins', 1, 3))
})
test('출발 검사: 잠긴 지역·구역·피로·시간·구역 번호를 서버가 거절한다', () => {
  const m = { level: 6, evoStage: 1, progress: { 'dew-forest': 2 }, fatigue: 10 }
  assert.ok(checkTripStart(m, 'dew-forest', 3, 4).ok)
  assert.equal(checkTripStart(m, 'dew-forest', 4, 4).code, 'zone_locked')
  assert.equal(checkTripStart(m, 'bubbling-volcano', 1, 4).code, 'locked')
  assert.equal(checkTripStart(m, 'dew-forest', 1, 3).code, 'bad_hours')
  assert.equal(checkTripStart(m, 'dew-forest', 0, 4).code, 'bad_zone')
  assert.equal(checkTripStart(m, 'nowhere', 1, 4).code, 'bad_region')
  assert.equal(checkTripStart({ ...m, fatigue: EXPLORE.fatigueBlock }, 'dew-forest', 1, 4).code, 'too_tired')
})
test('결과 등급 경계: 1.3 이상 대성공, 1.0~1.3 성공, 0.8~1.0 고전, 0.8 미만 중도 귀환', () => {
  assert.equal(tierOf(1.3), 'great')
  assert.equal(tierOf(1.29), 'success')
  assert.equal(tierOf(1.0), 'success')
  assert.equal(tierOf(0.99), 'struggle')
  assert.equal(tierOf(0.8), 'struggle')
  assert.equal(tierOf(0.79), 'retreat')
})
// 이슬 숲 3구역 권장 전투력은 60 + 140×2/9 = 91
const run = (over = {}) => resolveTrip({ regionId: 'dew-forest', zone: 3, hours: 4, power: 100, seed: 777, firstClear: true, coinRoom: 400, ...over })
test('같은 시드·같은 입력이면 항상 같은 결과다 (재현 가능)', () => {
  assert.deepEqual(run(), run())
  assert.notDeepEqual(run({ seed: 1 }), run({ seed: 2 }))
})
test('오래 보낼수록 경험치·코인이 늘고, 중도 귀환은 경험치만 조금 받는다', () => {
  const a = run({ hours: 1 })
  const b = run({ hours: 8 })
  assert.ok(b.exp > a.exp && b.coins > a.coins)
  const lose = run({ power: 10 })
  assert.equal(lose.tier, 'retreat')
  assert.equal(lose.coins, 0)
  assert.ok(lose.exp > 0 && lose.foods.length === 0 && lose.gearGrade === null)
})
test('대성공은 성공보다 보상이 많고, 고전은 줄어들며 피로가 더 쌓인다', () => {
  const great = run({ power: 400 })
  const ok = run({ power: 100 })
  const hard = run({ power: 80 })
  assert.equal(great.tier, 'great')
  assert.equal(ok.tier, 'success')
  assert.ok(great.exp > ok.exp)
  assert.equal(hard.tier, 'struggle')
  assert.ok(hard.exp < ok.exp)
  assert.ok(hard.fatigue > ok.fatigue)
})
test('하루 코인 한도(coinRoom)를 넘지 않고, 경험치는 한도와 상관없이 오른다', () => {
  const r = run({ coinRoom: 5 })
  assert.ok(r.coins <= 5)
  assert.equal(r.exp, run().exp)
})
test('첫 돌파(성공 이상)에만 별조각이 크게 나오고, 실패하면 없다', () => {
  assert.ok(run({ firstClear: true }).shards >= 2)
  assert.ok(run({ firstClear: false, seed: 5 }).shards <= 1)
  assert.equal(run({ firstClear: true, power: 10 }).shards, 0)
})
test('받을 수 있는 토핑·장비 등급이 실제 존재한다', () => {
  const grades = new Set(GEAR_DEFS.map((d) => d.grade))
  for (const r of REGIONS) {
    for (const f of r.foods) assert.ok(FOODS[f], `${r.id}: 없는 토핑 ${f}`)
    for (const g of Object.keys(r.gear)) assert.ok(grades.has(g), `${r.id}: 없는 장비 등급 ${g}`)
    for (const t of ['great', 'success', 'struggle', 'retreat']) assert.ok(r.journals[t].length >= 1)
  }
})
test('복귀 보상은 피로만 오르고 능력치는 깎이지 않으며, 코인·토핑·레벨이 반영된다', () => {
  const s = {
    hunger: 80, mood: 80, fatigue: 10, cleanliness: 100, active: 0, bond: 0,
    stats: { hp: 50, atk: 40, def: 40, spd: 35, int: 35, cha: 35 }, talents: { hp: 5, atk: 5, def: 5, spd: 5, int: 5, cha: 5 },
    level: 3, exp: 0, sp: 0, coins: 100, foodBag: {}, recentFoods: [], careCounts: {}, discoveredFav: false, discoveredDisliked: false, favFood: '', dislikedFood: '', trait: '',
  }
  const res = run({ hours: 8, power: 400 })
  const { state } = applyTripClaim(s, res)
  assert.equal(state.fatigue, 10 + res.fatigue)
  for (const k of Object.keys(s.stats)) assert.ok(state.stats[k] >= s.stats[k])
  assert.equal(state.coins, 100 + res.coins)
  assert.equal(Object.values(state.foodBag).reduce((a, b) => a + b, 0), res.foods.length)
  assert.ok(state.level >= s.level)
})
test('전투력에 속성이 반영된다 (같은 속성 지역은 전투력이 더 높다)', () => {
  const stats = { hp: 50, atk: 40, def: 40, spd: 35, int: 35, cha: 35 }
  const forest = REGIONS.find((r) => r.id === 'dew-forest')
  assert.ok(effectivePower(forest, stats, 'grass') > effectivePower(forest, stats, 'fire'))
})
test('서버 care 함수는 시간·판정을 서버에서 하고, 훈련·타워와 겹치지 않는다', () => {
  const care = read('supabase/functions/care/index.ts')
  for (const a of ['explore_state', 'explore_start', 'explore_finish']) assert.ok(care.includes(`action === '${a}'`))
  assert.ok(care.includes('checkTripStart(') && care.includes('resolveTrip(') && care.includes('applyTripClaim('))
  assert.ok(care.includes('if (await getTrip()) return json(exploring)'))
  assert.ok(care.includes("if (await getActive('train'))") && care.includes("if (await getActive('tower'))"))
  // 복귀: 기록을 먼저 '받음'으로 바꾼 뒤에 보상을 준다
  assert.ok(care.indexOf(".update({ status: 'claimed', claimed_at: now.toISOString(), result: res })") < care.indexOf('applyTripClaim(state, res)'))
})
test('DB: 탐험 기록은 본인만 읽고 화면이 못 쓰며, 한 몬스터는 한 번에 한 곳만 간다', () => {
  const sql = read('supabase/migrations/20261031300000_m5_explore.sql')
  assert.match(sql, /explore_trips_read_own[\s\S]*using \(owner = auth\.uid\(\)\)/)
  assert.match(sql, /revoke all on public\.explore_trips from anon, authenticated;\ngrant select on public\.explore_trips to authenticated;/)
  assert.match(sql, /create unique index if not exists explore_trips_one_active_uidx on public\.explore_trips \(monster_id\) where status = 'active'/)
  assert.match(sql, /revoke all on function public\.gear_grant\(uuid, text, text\) from public, anon, authenticated/)
})
test('시험용으로 줄여 둔 시간 배율이 배포 설정에 남아 있지 않다 (1시간 = 3600초)', () => {
  assert.equal(EXPLORE.secondsPerHour, 3600)
})

console.log(`\n${passed}개 통과`)
