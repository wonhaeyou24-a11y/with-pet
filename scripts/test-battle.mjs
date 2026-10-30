// 친선 대전 엔진(supabase/functions/battle/engine.ts) 검증:  npm run test:battle
// 서버(battle 함수)와 화면이 같은 파일을 쓰므로, 여기서 통과하면 둘의 결과가 같다.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BATTLE } from '../supabase/functions/battle/config.ts'
import { simulateAsmrBattle } from '../supabase/functions/battle/engine.ts'
import { SPECIES_NAMES } from '../supabase/functions/battle/speciesNames.ts'
import { checkEvolutionEligibility, computeEvolution, EVO_FAVORED_STATS } from '../supabase/functions/battle/evolution.ts'
import { planSkillUpgrade } from '../supabase/functions/battle/skillLevels.ts'

const mon = (over = {}) => ({
  name: '테스트',
  species: 'mochi',
  element: 'earth',
  level: 5,
  stats: { hp: 50, atk: 40, def: 40, spd: 35, int: 35, cha: 35 },
  battle_stance: 'balanced',
  unlocked_skills: null,
  equipped_skills: null,
  skill_levels: null,
  ...over,
})

let passed = 0
const test = (name, fn) => {
  fn()
  passed++
  console.log('  ✓', name)
}

console.log('대전 엔진')
test('같은 시드와 같은 양측이면 턴 기록이 완전히 같다 (리플레이 재현)', () => {
  const a = simulateAsmrBattle(mon(), mon({ name: '상대', element: 'fire' }), 123456)
  const b = simulateAsmrBattle(mon(), mon({ name: '상대', element: 'fire' }), 123456)
  assert.deepEqual(a, b)
})
test('시드가 다르면 대부분 다른 전개가 나온다', () => {
  const seen = new Set()
  for (let s = 1; s <= 20; s++) seen.add(JSON.stringify(simulateAsmrBattle(mon(), mon({ name: '상대' }), s).turns.map((t) => t.damage)))
  assert.ok(seen.size >= 15, `서로 다른 전개가 ${seen.size}개뿐이다`)
})
test('DB에서 막 읽은 행(스킬 표가 비어 있음)도 기본 스킬로 대전이 된다', () => {
  const r = simulateAsmrBattle(mon(), mon(), 7)
  assert.ok(r.turns.length > 0 && r.turns.length <= 24)
  assert.ok(['challenger', 'defender', 'draw'].includes(r.winner))
})
test('승자는 마지막 체력이 더 많은 쪽이다', () => {
  for (let s = 1; s <= 50; s++) {
    const r = simulateAsmrBattle(mon(), mon({ stats: { hp: 45, atk: 38, def: 38, spd: 33, int: 33, cha: 33 } }), s)
    const last = r.turns[r.turns.length - 1]
    if (last.challengerHp > last.defenderHp) assert.equal(r.winner, 'challenger')
    else if (last.defenderHp > last.challengerHp) assert.equal(r.winner, 'defender')
  }
})
test('능력치가 훨씬 높은 쪽이 거의 이긴다 (100판 중 90판 이상)', () => {
  const strong = mon({ level: 10, stats: { hp: 90, atk: 80, def: 80, spd: 60, int: 70, cha: 60 } })
  const weak = mon({ level: 3, stats: { hp: 40, atk: 30, def: 30, spd: 30, int: 30, cha: 30 } })
  let wins = 0
  for (let s = 1; s <= 100; s++) if (simulateAsmrBattle(strong, weak, s * 977).winner === 'challenger') wins++
  assert.ok(wins >= 90, `${wins}승`)
})
test('체력은 음수가 되지 않고 최대 체력을 넘지 않는다', () => {
  for (let s = 1; s <= 30; s++) {
    const r = simulateAsmrBattle(mon(), mon(), s)
    for (const t of r.turns) {
      assert.ok(t.challengerHp >= 0 && t.defenderHp >= 0)
      assert.ok(t.challengerHp <= r.challengerMaxHp && t.defenderHp <= r.defenderMaxHp)
    }
  }
})
test('입력 몬스터 객체는 바뀌지 않는다', () => {
  const a = mon()
  const snap = JSON.stringify(a)
  simulateAsmrBattle(a, mon(), 99)
  assert.equal(JSON.stringify(a), snap)
})

console.log('서버·화면 공용 코드')
test('화면의 대전·스킬·사운드 코드는 서버와 같은 파일을 가져다 쓴다', () => {
  assert.match(readFileSync('src/lib/battleEngine.ts', 'utf8'), /supabase\/functions\/battle\/engine\.ts/)
  assert.match(readFileSync('src/config/skills.ts', 'utf8'), /supabase\/functions\/battle\/skills\.ts/)
  assert.match(readFileSync('src/config/skillLevels.ts', 'utf8'), /supabase\/functions\/battle\/skillLevels\.ts/)
  assert.match(readFileSync('src/lib/sound.ts', 'utf8'), /supabase\/functions\/battle\/soundKinds\.ts/)
})
test('서버의 종족 이름 표가 화면의 SPECIES_INFO 이름과 같다', () => {
  const sp = readFileSync('src/config/species.ts', 'utf8')
  for (const [id, name] of Object.entries(SPECIES_NAMES)) {
    assert.ok(sp.includes(`name: '${name}'`), `${id}: ${name} 이름이 species.ts 에 없다`)
  }
})
test('보상 수치: 이기면 지는 것보다 많고, 하루 상한이 있다', () => {
  assert.ok(BATTLE.rewardWin > BATTLE.rewardLose && BATTLE.rewardLose > 0)
  assert.ok(BATTLE.rewardedPerDay >= 1 && BATTLE.votesRewardedPerDay >= 1)
})

console.log('스킬 올리기 (서버가 검사하는 규칙)')
const sm = (over = {}) => ({ ...mon(), level: 5, sp: 3, ...over })
test('SP가 충분하면 한 단계 오르고 비용이 계산된다', () => {
  const r = planSkillUpgrade(sm(), 'cookie-flurry')
  assert.equal(r.ok, true)
  assert.equal(r.nextLevel, 1)
  assert.equal(r.cost, 1)
  assert.equal(r.nextLevels['cookie-flurry'], 1)
})
test('SP가 모자라면 거절한다 (SP는 서버 값만 믿는다)', () => {
  assert.equal(planSkillUpgrade(sm({ sp: 0 }), 'cookie-flurry').code, 'no_sp')
})
test('2단계 스킬은 Lv.8 전에는 잠겨 있다, 없는 스킬은 거절', () => {
  assert.equal(planSkillUpgrade(sm({ level: 7 }), 't2-kataifi-cyclone').code, 'locked')
  assert.equal(planSkillUpgrade(sm(), '없는스킬').code, 'bad_skill')
})
test('최고 레벨에서는 더 올릴 수 없다', () => {
  const r = planSkillUpgrade(sm({ skill_levels: { 'cookie-flurry': 5 }, sp: 9 }), 'cookie-flurry')
  assert.equal(r.code, 'max')
})
test('올릴수록 비용이 조금씩 늘어난다', () => {
  const a = planSkillUpgrade(sm({ skill_levels: { 'cookie-flurry': 1 }, sp: 9 }), 'cookie-flurry')
  const b = planSkillUpgrade(sm({ skill_levels: { 'cookie-flurry': 4 }, sp: 9 }), 'cookie-flurry')
  assert.ok(b.cost > a.cost)
})

console.log('진화 (서버가 판정하는 규칙)')
const em = (over = {}) => ({ level: 8, stats: { hp: 60, atk: 40, def: 40, spd: 40, int: 40, cha: 40 }, sp: 2, evo_stage: 1, evo_branch: null, hunger: 60, ...over })
test('Lv.8 미만이면 1→2단계 진화 불가, Lv.8이면 가능', () => {
  assert.equal(checkEvolutionEligibility(em({ level: 7 })).canEvolve, false)
  assert.equal(checkEvolutionEligibility(em()).canEvolve, true)
})
test('2→3단계는 Lv.15, 3단계는 더 진화할 수 없다', () => {
  assert.equal(checkEvolutionEligibility(em({ evo_stage: 2, level: 14 })).canEvolve, false)
  assert.equal(checkEvolutionEligibility(em({ evo_stage: 2, level: 15 })).canEvolve, true)
  assert.equal(checkEvolutionEligibility(em({ evo_stage: 3, level: 30 })).canEvolve, false)
})
test('진화하면 모든 능력치가 오르고 보너스 SP가 붙는다 (능력치가 깎이지 않는다)', () => {
  const r = computeEvolution(em(), 'crispy-crunch')
  for (const k of Object.keys(r.newStats)) assert.ok(r.newStats[k] > em().stats[k])
  assert.equal(r.bonusSp, 3)
  assert.equal(r.newSp, 5)
  assert.equal(computeEvolution(em({ evo_stage: 2, evo_branch: 'crispy-crunch', level: 15 })).bonusSp, 5)
})
test('갈래 특화 능력치가 더 크게 오른다', () => {
  const r = computeEvolution(em(), 'crispy-crunch')
  assert.ok(r.statBoost.atk > r.statBoost.cha)
})
test('2→3단계에서는 이미 정해진 갈래를 그대로 이어 간다 (폰이 바꿔 보내도 소용없다)', () => {
  const r = computeEvolution(em({ evo_stage: 2, evo_branch: 'royal-chef', level: 15 }), 'sweet-melty')
  assert.equal(r.branch, 'royal-chef')
})
test('알 수 없는 갈래를 보내면 무시한다', () => {
  const r = computeEvolution(em(), '해킹')
  assert.ok(Object.keys(EVO_FAVORED_STATS).includes(r.branch))
})
test('화면의 진화 갈래·요구 레벨 표가 서버와 같은 파일을 쓴다', () => {
  const cfg = readFileSync('src/config/evolution.ts', 'utf8')
  assert.ok(cfg.includes('supabase/functions/battle/evolution.ts'))
  assert.ok(readFileSync('src/lib/evolutionEngine.ts', 'utf8').includes('supabase/functions/battle/evolution.ts'))
})

console.log(`\n${passed}개 통과`)
