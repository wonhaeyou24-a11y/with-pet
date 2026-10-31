import fs from 'node:fs';

// 1. equipment.ts 수정: 10강 1%, 전설 드롭 weight 1%
let eqCode = fs.readFileSync('src/config/equipment.ts', 'utf8');

const targetEnhance = `export const GEAR_ENHANCE: { level: number; chance: number; cost: number }[] = [
  { level: 1, chance: 100, cost: 50 },
  { level: 2, chance: 100, cost: 100 },
  { level: 3, chance: 100, cost: 150 },
  { level: 4, chance: 60, cost: 300 },
  { level: 5, chance: 60, cost: 450 },
  { level: 6, chance: 50, cost: 600 },
  { level: 7, chance: 35, cost: 1000 },
  { level: 8, chance: 25, cost: 1400 },
  { level: 9, chance: 15, cost: 1800 },
  { level: 10, chance: 5, cost: 3500 },
]`;

const newEnhance = `export const GEAR_ENHANCE: { level: number; chance: number; cost: number }[] = [
  { level: 1, chance: 100, cost: 50 },
  { level: 2, chance: 100, cost: 100 },
  { level: 3, chance: 100, cost: 150 },
  { level: 4, chance: 50, cost: 300 },
  { level: 5, chance: 40, cost: 450 },
  { level: 6, chance: 30, cost: 600 },
  { level: 7, chance: 20, cost: 1000 },
  { level: 8, chance: 10, cost: 1500 },
  { level: 9, chance: 5, cost: 2500 },
  { level: 10, chance: 1, cost: 5000 },
]`;

eqCode = eqCode.replace(targetEnhance, newEnhance);

const targetDrop = `  { minFloor: 30, grade: 'rare', weight: 85 },
  { minFloor: 30, grade: 'legend', weight: 15 },`;

const newDrop = `  { minFloor: 30, grade: 'rare', weight: 99 },
  { minFloor: 30, grade: 'legend', weight: 1 },`;

eqCode = eqCode.replace(targetDrop, newDrop);

fs.writeFileSync('src/config/equipment.ts', eqCode, 'utf8');
console.log('equipment.ts: Hardcore 1% probability applied');

// 2. test-gear.mjs 검증 assertion 동기화
let testCode = fs.readFileSync('scripts/test-gear.mjs', 'utf8');

testCode = testCode.replace(
  "assert.deepEqual(GEAR_ENHANCE.map((r) => r.chance), [100, 100, 100, 60, 60, 50, 35, 25, 15, 5])",
  "assert.deepEqual(GEAR_ENHANCE.map((r) => r.chance), [100, 100, 100, 50, 40, 30, 20, 10, 5, 1])"
);

testCode = testCode.replace(
  "assert.deepEqual(GEAR_ENHANCE.map((r) => r.cost), [50, 100, 150, 300, 450, 600, 1000, 1400, 1800, 3500])",
  "assert.deepEqual(GEAR_ENHANCE.map((r) => r.cost), [50, 100, 150, 300, 450, 600, 1000, 1500, 2500, 5000])"
);

fs.writeFileSync('scripts/test-gear.mjs', testCode, 'utf8');
console.log('test-gear.mjs updated');

