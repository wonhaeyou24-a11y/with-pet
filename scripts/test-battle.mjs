// 친선 대전 엔진(supabase/functions/battle/engine.ts) 검증:  npm run test:battle
// 서버(battle 함수)와 화면이 같은 파일을 쓰므로, 여기서 통과하면 둘의 결과가 같다.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BATTLE } from '../supabase/functions/battle/config.ts'
import { simulateAsmrBattle } from '../supabase/functions/battle/engine.ts'
import { SPECIES_NAMES } from '../supabase/functions/battle/speciesNames.ts'

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

console.log(`\n${passed}개 통과`)
