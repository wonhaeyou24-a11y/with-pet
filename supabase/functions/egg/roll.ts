// 부화 결과를 굴리는 순수 함수. 난수 함수(rand)를 넣어 받으므로 같은 난수면 같은 결과가 나와 테스트할 수 있다.
import { ELEMENTS, HATCH, SPECIES, STAT_KEYS, type Rarity, type Stats } from './config.ts'

export type Rand = () => number

export interface RolledMonster {
  species: string
  element: string
  element2: string | null
  parts: {
    palette: number
    bodyType: 'chubby' | 'normal' | 'slim'
    scale: number
    ears: number
    tail: number
    top: number
    expression: 'round' | 'sleepy' | 'sharp'
    patternSeed: number
    shiny: boolean
  }
  talents: Stats
  stats: Stats
  trait: string
  fav_food: string
  disliked_food: string
  personality_active: number
  personality_bond: number
  is_shiny: boolean
  mutation: string | null
}

const int = (r: Rand, n: number) => Math.floor(r() * n)
const range = (r: Rand, min: number, max: number) => min + int(r, max - min + 1)
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

function weighted<T extends string>(r: Rand, weights: Record<T, number>): T {
  const entries = (Object.entries(weights) as [T, number][]).filter(([, w]) => w > 0)
  let roll = r() * entries.reduce((sum, [, w]) => sum + w, 0)
  for (const [key, w] of entries) {
    roll -= w
    if (roll < 0) return key
  }
  return entries[entries.length - 1][0]
}

export function rollMonster(r: Rand, rarity: Rarity, petCount: number, warmCount: number, shift: { bond: number; active: number }): RolledMonster {
  const species = weighted(r, Object.fromEntries(Object.entries(SPECIES).map(([id, s]) => [id, s.weights[rarity]])) as Record<string, number>)
  const def = SPECIES[species]

  const element = def.element
  const element2 = r() < HATCH.secondElementChance[rarity] ? ELEMENTS.filter((e) => e !== element)[int(r, ELEMENTS.length - 1)] : null

  const talents = {} as Stats
  const stats = {} as Stats
  for (const k of STAT_KEYS) {
    talents[k] = range(r, HATCH.talentMin[rarity], HATCH.talentMax)
    stats[k] = def.base[k] + range(r, 0, HATCH.statJitter)
  }

  const personality_active = clamp(range(r, -HATCH.personalityStart, HATCH.personalityStart) + warmCount * shift.active, -100, 100)
  const personality_bond = clamp(range(r, -HATCH.personalityStart, HATCH.personalityStart) + petCount * shift.bond, -100, 100)
  const { sharpBondMax, sleepyActiveMax } = HATCH.expression
  const expression = personality_bond <= sharpBondMax ? 'sharp' : personality_active <= sleepyActiveMax ? 'sleepy' : 'round'

  const mutation = r() < HATCH.mutationChance ? HATCH.mutations[int(r, HATCH.mutations.length)] : null
  const is_shiny = r() < HATCH.shinyChance

  const fav = int(r, HATCH.foods.length)
  const dis = (fav + 1 + int(r, HATCH.foods.length - 1)) % HATCH.foods.length

  const { palettes, ears, tail, top } = HATCH.partCounts
  const [smin, smax] = HATCH.scaleRange

  return {
    species,
    element,
    element2,
    parts: {
      palette: int(r, palettes),
      bodyType: weighted(r, HATCH.bodyTypeWeights),
      scale: Math.round((smin + r() * (smax - smin)) * 100) / 100,
      ears: int(r, ears),
      tail: int(r, tail),
      top: int(r, top),
      expression,
      patternSeed: int(r, 1_000_000),
      shiny: is_shiny,
    },
    talents,
    stats,
    trait: HATCH.traits[int(r, HATCH.traits.length)],
    fav_food: HATCH.foods[fav],
    disliked_food: HATCH.foods[dis],
    personality_active,
    personality_bond,
    is_shiny,
    mutation,
  }
}
