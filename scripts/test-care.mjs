// care 서버 함수의 순수 계산(supabase/functions/care/logic.ts) 검증:  npm run test:care
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HATCH, SPECIES } from '../supabase/functions/egg/config.ts'
import { ACTIVITY, applyTowerClaim, battlePower, coinRoomToday, remainingSeconds, rollGrade, towerFloorInfo, towerFloorsCleared, towerSecPerFloor } from '../supabase/functions/care/activity.ts'
import { applyCareAction, applyExpAndLevelUp, applyFeed, applyTimeDecay, applyTrain, buyFood, expForNextLevel, FOODS } from '../supabase/functions/care/logic.ts'

const base = () => ({
  hunger: 80,
  mood: 80,
  fatigue: 0,
  cleanliness: 100,
  active: 0,
  bond: 0,
  stats: { hp: 40, atk: 30, def: 30, spd: 30, int: 30, cha: 30 },
  talents: { hp: 0, atk: 0, def: 0, spd: 0, int: 0, cha: 0 },
  level: 1,
  exp: 0,
  sp: 0,
  coins: 100,
  foodBag: { '기본 슈가파우더': 3, '생딸기 슈가시럽': 2, '초코 퐁듀볼': 2 },
  recentFoods: [],
  careCounts: {},
  discoveredFav: false,
  discoveredDisliked: false,
  favFood: '생딸기 슈가시럽',
  dislikedFood: '초코 퐁듀볼',
  trait: '',
})

let passed = 0
const test = (name, fn) => {
  fn()
  passed++
  console.log('  ✓', name)
}

console.log('상태 감소')
test('5시간이 지나면 배고픔 -25, 기분 -15, 청결 -10', () => {
  const now = new Date('2026-10-30T12:00:00Z')
  const d = applyTimeDecay(base(), '2026-10-30T07:00:00Z', now)
  assert.equal(d.hunger, 55)
  assert.equal(d.mood, 65)
  assert.equal(d.cleanliness, 90)
})
test('3분 미만이면 그대로, 기준 시각도 바꾸지 않는다', () => {
  const now = new Date('2026-10-30T12:00:00Z')
  const d = applyTimeDecay(base(), '2026-10-30T11:58:00Z', now)
  assert.equal(d.hunger, 80)
  assert.equal(d.lastCalcAt, '2026-10-30T11:58:00Z')
})
test('오래 방치해도 0 아래로 내려가지 않고, 능력치는 깎이지 않는다 (스트레스 최소화)', () => {
  const d = applyTimeDecay(base(), '2026-01-01T00:00:00Z', new Date('2026-10-30T00:00:00Z'))
  assert.equal(d.hunger, 0)
  assert.equal(d.mood, 0)
  assert.equal(d.cleanliness, 0)
})
test('미래 시각(폰 시계 조작)이 와도 음수 경과 시간은 0으로 처리', () => {
  const d = applyTimeDecay(base(), '2027-01-01T00:00:00Z', new Date('2026-10-30T00:00:00Z'))
  assert.equal(d.hunger, 80)
})

console.log('토핑 급여')
test('보통 토핑: 가방 1개 감소, 배고픔·기분 상승, 코인 +5, 경험치 +10', () => {
  const r = applyFeed(base(), '기본 슈가파우더')
  assert.ok(r.ok)
  assert.equal(r.state.foodBag['기본 슈가파우더'], 2)
  assert.equal(r.state.hunger, 100) // 80+30 → 100 상한
  assert.equal(r.state.coins, 105)
  assert.equal(r.state.exp, 10)
})
test('최애 토핑은 1.5배 + 기분 +15 + 발견 표시', () => {
  const r = applyFeed(base(), '생딸기 슈가시럽')
  assert.ok(r.ok && r.state.discoveredFav)
  assert.equal(r.state.hunger, 100)
  assert.equal(r.state.stats.cha, 31) // 보너스 능력치
})
test('기피 토핑은 효과 절반 + 기분 -5 + 발견 표시', () => {
  const s = { ...base(), hunger: 20, mood: 50 }
  const r = applyFeed(s, '초코 퐁듀볼')
  assert.ok(r.ok && r.state.discoveredDisliked)
  assert.equal(r.state.hunger, 20 + Math.round(35 * 0.5))
  assert.equal(r.state.mood, 50 - 5 + Math.round(12 * 0.5))
})
test('같은 토핑을 세 번째 먹이면 물림(0.85배)', () => {
  const s = { ...base(), hunger: 10, recentFoods: ['기본 슈가파우더', '기본 슈가파우더'] }
  const r = applyFeed(s, '기본 슈가파우더')
  assert.ok(r.ok)
  assert.equal(r.state.hunger, 10 + Math.round(30 * 0.85))
})
test('가방이 비었거나 없는 토핑이면 거절하고 상태를 바꾸지 않는다', () => {
  const empty = applyFeed({ ...base(), foodBag: { '기본 슈가파우더': 0 } }, '기본 슈가파우더')
  assert.equal(empty.ok, false)
  assert.equal(empty.code, 'empty_food')
  const bad = applyFeed(base(), '없는 토핑')
  assert.equal(bad.ok, false)
  assert.equal(bad.status, 400)
})
test('입력 상태 객체는 바뀌지 않는다 (순수 계산)', () => {
  const s = base()
  applyFeed(s, '기본 슈가파우더')
  assert.equal(s.foodBag['기본 슈가파우더'], 3)
  assert.equal(s.exp, 0)
})

console.log('돌보기')
test('놀기: 기분 +22, 피로 +5, 코인 +15', () => {
  const r = applyCareAction({ ...base(), mood: 50 }, 'play')
  assert.ok(r.ok)
  assert.equal(r.state.mood, 72)
  assert.equal(r.state.fatigue, 5)
  assert.equal(r.state.coins, 115)
})
test('피로 90 이상이면 놀 수 없다', () => {
  const r = applyCareAction({ ...base(), fatigue: 90 }, 'play')
  assert.equal(r.ok, false)
  assert.equal(r.code, 'tired')
})
test('씻기·휴식 효과와 알 수 없는 행동 거절', () => {
  const c = applyCareAction({ ...base(), cleanliness: 20 }, 'clean')
  assert.ok(c.ok && c.state.cleanliness === 55)
  const rest = applyCareAction({ ...base(), fatigue: 60 }, 'rest')
  assert.ok(rest.ok && rest.state.fatigue === 25)
  assert.equal(applyCareAction(base(), 'fly').ok, false)
})

console.log('훈련')
test('근력 훈련: 공격 +2, 체력 +1, 피로 +15, 코인 +25(great)', () => {
  const r = applyTrain(base(), 'str', 'great')
  assert.ok(r.ok)
  assert.equal(r.state.stats.atk, 32)
  assert.equal(r.state.stats.hp, 41)
  assert.equal(r.state.fatigue, 15)
  assert.equal(r.state.coins, 125)
})
test('PERFECT는 주·보조 능력치 +1, 코인 +30', () => {
  const r = applyTrain(base(), 'str', 'perfect')
  assert.ok(r.ok)
  assert.equal(r.state.stats.atk, 33)
  assert.equal(r.state.stats.hp, 42)
  assert.equal(r.state.coins, 130)
})
test('배고프거나 기분이 낮으면 훈련 효과 -1 (최소 1)', () => {
  const r = applyTrain({ ...base(), hunger: 10 }, 'str', 'great')
  assert.ok(r.ok && r.state.stats.atk === 31)
})
test('골고루 먹이면(최근 3종) 훈련 보너스 +1', () => {
  const r = applyTrain({ ...base(), recentFoods: ['a', 'b', 'c'] }, 'str', 'great')
  assert.ok(r.ok && r.state.stats.atk === 33)
})
test('피로 80 이상이면 훈련 불가, 알 수 없는 코스는 400', () => {
  assert.equal(applyTrain({ ...base(), fatigue: 80 }, 'str', 'great').code, 'too_tired')
  assert.equal(applyTrain(base(), 'dance', 'great').status, 400)
})

console.log('레벨업')
test('경험치가 차면 레벨이 오르고 능력치가 재능에 따라 오른다', () => {
  const s = { ...base(), exp: expForNextLevel(1) - 5, talents: { hp: 12, atk: 0, def: 0, spd: 0, int: 0, cha: 0 } }
  const r = applyExpAndLevelUp(s, 10)
  assert.equal(r.level, 2)
  assert.equal(r.sp, 1)
  assert.equal(r.exp, 5)
  assert.equal(r.stats.hp, 40 + 1 + 2) // 재능 12 → 보너스 2
  assert.equal(r.stats.atk, 31)
})
test('한 번에 두 레벨 이상 오를 수도 있다', () => {
  const r = applyExpAndLevelUp(base(), 400)
  assert.ok(r.level >= 3)
})

console.log('상점')
test('코인이 있으면 구매되고 가방에 담긴다', () => {
  const r = buyFood(100, { '기본 슈가파우더': 1 }, '기본 슈가파우더')
  assert.ok(r.ok)
  assert.equal(r.coins, 80)
  assert.equal(r.foodBag['기본 슈가파우더'], 2)
})
test('코인이 모자라면 거절, 없는 토핑은 400', () => {
  assert.equal(buyFood(10, {}, '우유 생크림').code, 'no_coins')
  assert.equal(buyFood(999, {}, '없음').status, 400)
})
test('코인이 없어도 게임이 막히지 않게 기본 슈가파우더는 가장 싸다', () => {
  const cheapest = Math.min(...Object.values(FOODS).map((f) => f.price))
  assert.equal(FOODS['기본 슈가파우더'].price, cheapest)
})

console.log('서버·클라이언트 이름 일치')
test('부화 때 배정되는 최애·기피 토핑은 모두 실제로 먹일 수 있는 토핑이다', () => {
  for (const food of HATCH.foods) assert.ok(FOODS[food], `${food} 토핑이 care 함수에 없다`)
})
test('클라이언트 토핑 목록(src/config/care.ts)과 서버 토핑 표가 같은 이름을 쓴다', () => {
  const client = readFileSync('src/config/care.ts', 'utf8')
  for (const food of Object.keys(FOODS)) assert.ok(client.includes(`id: '${food}'`), `${food} 토핑이 클라이언트에 없다`)
})
test('부화 설정의 종족은 모두 클라이언트에 그림이 등록돼 있다', () => {
  const registry = readFileSync('src/monsters/registry.ts', 'utf8') + readFileSync('src/monsters/MallangChameleon.tsx', 'utf8')
  for (const id of Object.keys(SPECIES)) assert.ok(registry.includes(`'${id}'`) || registry.includes(id), `${id} 종족 그림이 없다`)
})

console.log('훈련·타워 서버 판정 (2단계)')
test('훈련 시간 표가 클라이언트(idleActivity.ts)와 같다', () => {
  const client = readFileSync('src/lib/idleActivity.ts', 'utf8')
  for (const [id, sec] of Object.entries(ACTIVITY.trainSeconds)) assert.ok(client.includes(`${id}: ${sec},`), `${id} 훈련 시간(${sec}초)이 클라이언트와 다르다`)
})
test('훈련은 서버 시각 기준으로 끝나기 전에는 남은 시간이 나온다', () => {
  const now = new Date('2026-10-30T12:00:00Z')
  assert.equal(remainingSeconds('2026-10-30T12:02:30Z', now), 150)
  assert.equal(remainingSeconds('2026-10-30T11:59:00Z', now), 0)
})
test('등급은 시드가 같으면 항상 같고, 확률 합은 1이다', () => {
  assert.equal(rollGrade(12345), rollGrade(12345))
  const w = ACTIVITY.gradeWeights
  assert.ok(Math.abs(w.perfect + w.great + w.normal - 1) < 1e-9)
})
test('등급 분포가 설정 확률에 가깝다 (1만 번)', () => {
  const n = { perfect: 0, great: 0, normal: 0 }
  for (let i = 0; i < 10000; i++) n[rollGrade(i * 7919 + 13)]++
  assert.ok(Math.abs(n.perfect / 10000 - ACTIVITY.gradeWeights.perfect) < 0.03)
  assert.ok(Math.abs(n.normal / 10000 - ACTIVITY.gradeWeights.normal) < 0.03)
})
test('하루 코인 상한: 남은 한도만큼만 코인이 들어오고 능력치·경험치는 그대로 오른다', () => {
  const r = applyTrain(base(), 'str', 'perfect', 5)
  assert.equal(r.state.coins, 100 + 5)
  assert.equal(r.state.stats.atk, 30 + 3)
  assert.ok(r.state.exp > 0)
  assert.match(r.message, /한도/)
})
test('코인 한도가 0이어도 훈련은 막히지 않는다', () => {
  const r = applyTrain(base(), 'str', 'great', 0)
  assert.equal(r.ok, true)
  assert.equal(r.state.coins, 100)
})
test('오늘 받은 만큼 한도에서 빠진다', () => {
  assert.equal(coinRoomToday(0), ACTIVITY.dailyCoinCap)
  assert.equal(coinRoomToday(ACTIVITY.dailyCoinCap + 50), 0)
})
test('타워: 전투력이 높을수록 한 층이 빠르다', () => {
  assert.ok(towerSecPerFloor(500, 1) < towerSecPerFloor(40, 1))
})
test('타워: 지난 시간만큼만 층이 열리고, 끝까지 가도 최대 층 수를 넘지 않는다', () => {
  const t0 = '2026-10-30T12:00:00Z'
  assert.equal(towerFloorsCleared(t0, 100, 3, new Date('2026-10-30T12:01:39Z')), 0)
  assert.equal(towerFloorsCleared(t0, 100, 3, new Date('2026-10-30T12:03:40Z')), 2)
  assert.equal(towerFloorsCleared(t0, 100, 3, new Date('2026-10-31T12:00:00Z')), 3)
})
test('타워: 첫 층도 못 올랐으면 보상 없음 (조기 수령 방지)', () => {
  assert.equal(applyTowerClaim(base(), 1, 0, 400).code, 'not_yet')
})
test('타워: 층마다 경험치·코인이 쌓이고 피로가 오르며 능력치는 깎이지 않는다', () => {
  const r = applyTowerClaim(base(), 1, 3, 400)
  assert.equal(r.ok, true)
  const want = [1, 2, 3].reduce((sum, f) => sum + towerFloorInfo(f).rewardCoins, 0)
  assert.equal(r.coinsGain, want)
  assert.equal(r.state.coins, 100 + want)
  assert.equal(r.state.fatigue, 3 * ACTIVITY.tower.fatiguePerFloor)
  assert.equal(r.state.careCounts.tower, 3)
  for (const k of Object.keys(base().stats)) assert.ok(r.state.stats[k] >= base().stats[k])
})
test('타워: 코인 한도에 걸려도 경험치는 받고 안내가 나온다', () => {
  const r = applyTowerClaim(base(), 1, 3, 10)
  assert.equal(r.coinsGain, 10)
  assert.ok(r.coinsCut > 0)
  assert.ok(r.expGain > 0)
  assert.match(r.message, /한도/)
})
test('타워: 하루 입장 3회, 서버 표와 클라이언트 층 보상 식이 같다', () => {
  assert.equal(ACTIVITY.tower.dailyEntries, 3)
  const client = readFileSync('src/screens/PatisserieTraining.tsx', 'utf8')
  assert.ok(client.includes('45 + floor * 22') && client.includes('25 + floor * 15') && client.includes('20 + floor * 8'))
})

console.log(`\n${passed}개 통과`)
