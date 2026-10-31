import fs from 'node:fs';

// 1. equipment.ts 수정
let eqCode = fs.readFileSync('src/config/equipment.ts', 'utf8');

const oldEnhance = `export const GEAR_ENHANCE: { level: number; chance: number; cost: number }[] = [
  { level: 1, chance: 100, cost: 50 },
  { level: 2, chance: 100, cost: 100 },
  { level: 3, chance: 100, cost: 150 },
  { level: 4, chance: 70, cost: 300 },
  { level: 5, chance: 70, cost: 400 },
  { level: 6, chance: 70, cost: 500 },
  { level: 7, chance: 40, cost: 800 },
  { level: 8, chance: 40, cost: 1000 },
  { level: 9, chance: 40, cost: 1200 },
  { level: 10, chance: 20, cost: 2000 },
]`;

const newEnhance = `export const GEAR_ENHANCE: { level: number; chance: number; cost: number }[] = [
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

eqCode = eqCode.replace(oldEnhance, newEnhance);

const oldDrop = `  { minFloor: 30, grade: 'rare', weight: 70 },
  { minFloor: 30, grade: 'legend', weight: 30 },`;

const newDrop = `  { minFloor: 30, grade: 'rare', weight: 85 },
  { minFloor: 30, grade: 'legend', weight: 15 },`;

eqCode = eqCode.replace(oldDrop, newDrop);

fs.writeFileSync('src/config/equipment.ts', eqCode, 'utf8');
console.log('equipment.ts: Hardcore balance applied (10-grade: 5% chance)');

// 2. test-gear.mjs 수정
let testCode = fs.readFileSync('scripts/test-gear.mjs', 'utf8');

testCode = testCode.replace(
  "assert.deepEqual(GEAR_ENHANCE.map((r) => r.chance), [100, 100, 100, 70, 70, 70, 40, 40, 40, 20])",
  "assert.deepEqual(GEAR_ENHANCE.map((r) => r.chance), [100, 100, 100, 60, 60, 50, 35, 25, 15, 5])"
);

testCode = testCode.replace(
  "assert.deepEqual(GEAR_ENHANCE.map((r) => r.cost), [50, 100, 150, 300, 400, 500, 800, 1000, 1200, 2000])",
  "assert.deepEqual(GEAR_ENHANCE.map((r) => r.cost), [50, 100, 150, 300, 450, 600, 1000, 1400, 1800, 3500])"
);

fs.writeFileSync('scripts/test-gear.mjs', testCode, 'utf8');
console.log('test-gear.mjs: assertions updated');

