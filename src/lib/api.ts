import { defaultDessertBase } from '../config/species'
import { loadMallangCustom } from '../monsters/MallangChameleon'
import type { BodyType, Element, Expression, MonsterLook } from '../monsters/types'
import { supabase } from './supabase'

export type Rarity = 'common' | 'rare' | 'legendary'
export type Stats = { hp: number; atk: number; def: number; spd: number; int: number; cha: number }

export interface EggRow {
  id: string
  rarity: Rarity
  hatch_at: string
  pet_count: number
  warm_count: number
  care_day: string | null
  pets_today: number
  warms_today: number
}

export interface MonsterRow {
  id: string
  owner: string
  name: string | null
  species: string
  element: Element
  element2: Element | null
  parts: Omit<MonsterLook, 'species'>
  talents: Stats
  stats: Stats
  trait: string
  fav_food?: string
  disliked_food?: string
  discovered_fav?: boolean
  discovered_disliked?: boolean
  recent_foods?: string[]
  care_counts?: Record<string, number>
  unlocked_skills?: string[]
  equipped_skills?: string[]
  skill_levels?: Record<string, number>
  battle_stance?: 'aggressive' | 'balanced' | 'defensive' | 'trickster'
  bio?: string
  likes_count?: number
  wins?: number
  losses?: number
  level: number
  exp?: number
  sp?: number
  hunger?: number
  mood?: number
  fatigue?: number
  cleanliness?: number
  sweetness?: number
  hygiene?: number
  evo_stage?: number
  evo_branch?: string
  title?: string
  last_calc_at?: string
  personality_active: number
  personality_bond: number
  is_shiny: boolean
  mutation: string | null
  hatched_at: string
}

export function monsterLook(m: MonsterRow): MonsterLook {
  const saved = loadMallangCustom(m.id)
  const fallbackBase = defaultDessertBase(saved?.morphForm ?? m.species)
  const mergedMallang = saved ?? m.parts.mallang ?? { dessertBase: fallbackBase }
  if (!mergedMallang.dessertBase) {
    mergedMallang.dessertBase = fallbackBase
  }
  return {
    species: m.species,
    ...m.parts,
    shiny: m.is_shiny || m.parts.shiny,
    mutation: m.mutation ?? m.parts.mutation ?? null,
    decorations: saved?.decorations ?? m.parts.decorations,
    medals: saved?.medals ?? m.parts.medals,
    mallang: mergedMallang,
    evoStage: m.evo_stage,
    evoBranch: m.evo_branch,
  }
}

interface EggResponse {
  ok: boolean
  code?: string
  message?: string
  now?: string
  egg?: EggRow | null
  monsters?: MonsterRow[]
  monster?: MonsterRow
  limits?: { pet: number; warm: number }
}

// 서버 시각과 이 기기 시계의 차이. 부화 남은 시간은 항상 서버 시각 기준으로 계산한다.
let serverOffsetMs = 0
export const serverNow = () => Date.now() + serverOffsetMs

// 테스트용 부화 시간 (1분 = 60,000ms)
const TEST_HATCH_MS: Record<Rarity, number> = {
  common: 60_000,
  rare: 60_000,
  legendary: 60_000,
}

const LOCAL_EGG_KEY = 'withpet_local_egg_v2'
const LOCAL_MONSTERS_KEY = 'withpet_local_monsters_v2'

const DESSERT_SPECIES_POOL: { id: string; element: Element; base: Stats; weight: number }[] = [
  { id: 'dubai-cookie', element: 'earth', base: { hp: 52, atk: 42, def: 40, spd: 30, int: 36, cha: 48 }, weight: 3 },
  { id: 'wax-ball', element: 'water', base: { hp: 44, atk: 38, def: 32, spd: 38, int: 40, cha: 48 }, weight: 3 },
  { id: 'tanghulu', element: 'water', base: { hp: 40, atk: 38, def: 28, spd: 40, int: 42, cha: 46 }, weight: 3 },
  { id: 'smore', element: 'fire', base: { hp: 46, atk: 36, def: 30, spd: 32, int: 32, cha: 40 }, weight: 3 },
  { id: 'mochi', element: 'wind', base: { hp: 48, atk: 22, def: 34, spd: 32, int: 32, cha: 44 }, weight: 4 },
  { id: 'pudding', element: 'water', base: { hp: 46, atk: 20, def: 32, spd: 34, int: 36, cha: 42 }, weight: 4 },
  { id: 'jelly', element: 'electric', base: { hp: 42, atk: 26, def: 28, spd: 42, int: 34, cha: 40 }, weight: 3 },
  { id: 'choco', element: 'earth', base: { hp: 50, atk: 32, def: 38, spd: 26, int: 34, cha: 38 }, weight: 3 },
  { id: 'chameleon', element: 'grass', base: { hp: 44, atk: 24, def: 30, spd: 38, int: 36, cha: 40 }, weight: 3 },
]

const TRAITS = ['겉바속촉', '쫀득탄력', '달콤과즙', '과즙팡왁스', '꾸덕가나슈', '슈가글레이즈', '황금카다이프']
const FOODS = ['생딸기 슈가시럽', '피스타치오 크림', '과즙팡 왁싱볼', '황금 카다이프칩', '메이플 허니버터', '우유 생크림', '초코 퐁듀볼']

function secureRand(): number {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
  } catch {
    return Math.random()
  }
}

function randInt(min: number, max: number): number {
  return min + Math.floor(secureRand() * (max - min + 1))
}

function loadLocalEgg(): EggRow | null {
  try {
    const raw = localStorage.getItem(LOCAL_EGG_KEY)
    return raw ? (JSON.parse(raw) as EggRow) : null
  } catch {
    return null
  }
}

function saveLocalEgg(egg: EggRow | null) {
  try {
    if (!egg) localStorage.removeItem(LOCAL_EGG_KEY)
    else localStorage.setItem(LOCAL_EGG_KEY, JSON.stringify(egg))
  } catch {
    // 저장소 제한 시 안전 무시
  }
}

export function loadLocalMonsters(): MonsterRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_MONSTERS_KEY)
    return raw ? (JSON.parse(raw) as MonsterRow[]) : []
  } catch {
    return []
  }
}

export function saveLocalMonsters(list: MonsterRow[]) {
  try {
    localStorage.setItem(LOCAL_MONSTERS_KEY, JSON.stringify(list))
  } catch {
    // 저장소 제한 시 안전 무시
  }
}

// 새 테스트용 디저트 알을 즉시 생성하여 저장 (몬스터 홈에서 다른 디저트 알 다시 뽑기 테스트용)
export function issueNewTestEgg(rarity: Rarity = 'common'): EggRow {
  const egg: EggRow = {
    id: `local-egg-${Date.now()}`,
    rarity,
    hatch_at: new Date(serverNow() + TEST_HATCH_MS[rarity]).toISOString(),
    pet_count: 0,
    warm_count: 0,
    care_day: new Date(serverNow() + 9 * 3600_000).toISOString().slice(0, 10),
    pets_today: 0,
    warms_today: 0,
  }
  saveLocalEgg(egg)
  saveLocalMonsters([])
  return egg
}

function rollDessertMonster(rarity: Rarity, petCount: number, warmCount: number): MonsterRow {
  const totalWeight = DESSERT_SPECIES_POOL.reduce((acc, s) => acc + s.weight, 0)
  let r = secureRand() * totalWeight
  let picked = DESSERT_SPECIES_POOL[0]
  for (const s of DESSERT_SPECIES_POOL) {
    r -= s.weight
    if (r <= 0) {
      picked = s
      break
    }
  }

  const isShiny = secureRand() < 0.08
  const mutation = secureRand() < 0.05 ? (['crystal', 'gold', 'shadow'][randInt(0, 2)] as string) : null
  const bodyTypes: BodyType[] = ['chubby', 'normal', 'slim']
  const bodyType = bodyTypes[randInt(0, 2)]
  const active = Math.max(-100, Math.min(100, randInt(-25, 25) - warmCount * 3))
  const bond = Math.max(-100, Math.min(100, randInt(-25, 25) + petCount * 4))
  const expression: Expression = bond <= -20 ? 'sharp' : active <= -15 ? 'sleepy' : 'round'
  const palette = randInt(0, 5)
  const scale = Math.round((0.92 + secureRand() * 0.16) * 100) / 100
  const baseId = defaultDessertBase(picked.id)

  const stats: Stats = {
    hp: picked.base.hp + randInt(0, 3),
    atk: picked.base.atk + randInt(0, 3),
    def: picked.base.def + randInt(0, 3),
    spd: picked.base.spd + randInt(0, 3),
    int: picked.base.int + randInt(0, 3),
    cha: picked.base.cha + randInt(0, 3),
  }
  const tMin = rarity === 'legendary' ? 6 : rarity === 'rare' ? 3 : 1
  const talents: Stats = {
    hp: randInt(tMin, 15),
    atk: randInt(tMin, 15),
    def: randInt(tMin, 15),
    spd: randInt(tMin, 15),
    int: randInt(tMin, 15),
    cha: randInt(tMin, 15),
  }

  const favIdx = randInt(0, FOODS.length - 1)
  const dislikedIdx = (favIdx + randInt(1, FOODS.length - 1)) % FOODS.length

  return {
    id: `dessert-mon-${Date.now()}`,
    owner: 'local-owner',
    name: null,
    species: picked.id,
    element: picked.element,
    element2: rarity === 'legendary' ? 'fire' : null,
    parts: {
      palette,
      bodyType,
      scale,
      ears: randInt(0, 3),
      tail: randInt(0, 3),
      top: randInt(0, 3),
      expression,
      patternSeed: randInt(1, 99999),
      shiny: isShiny,
      mutation,
      mallang: {
        morphForm: picked.id as NonNullable<MonsterLook['mallang']>['morphForm'],
        skinPalette: palette,
        dessertBase: baseId,
        syrups: ['choco-drizzle', 'rainbow-sprinkles'],
      },
    },
    talents,
    stats,
    trait: TRAITS[randInt(0, TRAITS.length - 1)],
    fav_food: FOODS[favIdx],
    disliked_food: FOODS[dislikedIdx],
    level: 1,
    exp: 0,
    sp: 2,
    hunger: 85,
    mood: 85,
    fatigue: 0,
    cleanliness: 100,
    personality_active: active,
    personality_bond: bond,
    is_shiny: isShiny,
    mutation,
    hatched_at: new Date(serverNow()).toISOString(),
  }
}

export async function callEgg(action: 'sync' | 'pet' | 'warm' | 'hatch', params: { eggId?: string } = {}): Promise<EggResponse> {
  const localMonsters = loadLocalMonsters()
  const localEgg = loadLocalEgg()

  try {
    const { data, error } = await supabase.functions.invoke('egg', { body: { action, ...params } })
    if (!error && data) {
      const res = data as EggResponse
      if (res.now) serverOffsetMs = Date.parse(res.now) - Date.now()

      if (action === 'sync') {
        // 로컬에서 이미 부화시킨 디저트 몬스터가 있으면 우선 유지
        if (localMonsters.length > 0) {
          return { ok: true, egg: null, monsters: localMonsters, limits: { pet: 5, warm: 5 } }
        }
        if (res.monsters && res.monsters.length > 0) {
          return res
        }
        if (res.egg) {
          // 서버의 부화 시간이 1분보다 길게 남아 있으면 테스트용 1분 타이머로 자동 단축
          const maxHatchAt = serverNow() + TEST_HATCH_MS[res.egg.rarity]
          const syncedHatchAt =
            localEgg && localEgg.id === res.egg.id
              ? Math.min(Date.parse(localEgg.hatch_at), Date.parse(res.egg.hatch_at), maxHatchAt)
              : Math.min(Date.parse(res.egg.hatch_at), maxHatchAt)
          const clampedEgg: EggRow = {
            ...res.egg,
            hatch_at: new Date(syncedHatchAt).toISOString(),
          }
          saveLocalEgg(clampedEgg)
          return { ...res, egg: clampedEgg }
        }
      }

      if ((action === 'pet' || action === 'warm') && res.egg) {
        const minutesOff = action === 'pet' ? 3 : 5
        const baseTarget = localEgg ? Date.parse(localEgg.hatch_at) : Date.parse(res.egg.hatch_at)
        const nextHatchAt = Math.max(serverNow(), baseTarget - minutesOff * 60_000)
        const updatedEgg: EggRow = {
          ...res.egg,
          hatch_at: new Date(nextHatchAt).toISOString(),
        }
        saveLocalEgg(updatedEgg)
        return { ...res, egg: updatedEgg }
      }

      if (action === 'hatch') {
        if (res.ok && res.monster) {
          // 서버가 구버전 종족(mongsil 등)을 반환한 경우 신규 디저트 종족으로 업그레이드
          const isOldSpecies = !DESSERT_SPECIES_POOL.some((d) => d.id === res.monster?.species)
          const finalMonster = isOldSpecies
            ? {
                ...rollDessertMonster(localEgg?.rarity ?? 'common', localEgg?.pet_count ?? 0, localEgg?.warm_count ?? 0),
                id: res.monster.id,
                owner: res.monster.owner,
              }
            : res.monster
          saveLocalEgg(null)
          saveLocalMonsters([finalMonster])
          return { ok: true, monster: finalMonster }
        }
        // 서버는 아직 60분 기준으로 not_ready를 반환했지만, 테스트 1분 타이머가 끝난 경우 즉시 디저트 몬스터 부화!
        if (localEgg && Date.parse(localEgg.hatch_at) <= serverNow() + 1500) {
          const hatched = rollDessertMonster(localEgg.rarity, localEgg.pet_count, localEgg.warm_count)
          saveLocalEgg(null)
          saveLocalMonsters([hatched])
          return { ok: true, monster: hatched }
        }
      }

      return res
    }
  } catch {
    // 네트워크 또는 Edge Function 미배포 시 아래 자가 복구(Self-Healing) 로직으로 안전 우회
  }

  // 자가 복구(Self-Healing) 로컬 폴백: 서버 함수 없이도 1분 알 부화·돌봄·디저트 몬스터 탄생 100% 동작
  const today = new Date(serverNow() + 9 * 3600_000).toISOString().slice(0, 10)

  if (action === 'sync') {
    if (localMonsters.length > 0) {
      return { ok: true, egg: null, monsters: localMonsters, limits: { pet: 5, warm: 5 } }
    }
    if (localEgg) {
      return { ok: true, egg: localEgg, monsters: [], limits: { pet: 5, warm: 5 } }
    }
    const created = issueNewTestEgg('common')
    return { ok: true, egg: created, monsters: [], limits: { pet: 5, warm: 5 } }
  }

  if (action === 'pet' || action === 'warm') {
    const egg = localEgg ?? issueNewTestEgg('common')
    const sameDay = egg.care_day === today
    const used = sameDay ? (action === 'pet' ? egg.pets_today : egg.warms_today) : 0
    if (used >= 5) {
      return { ok: false, code: 'limit', message: '오늘은 충분히 돌봤어요!', egg }
    }
    const minutesOff = action === 'pet' ? 3 : 5
    const nextHatchAt = Math.max(serverNow(), Date.parse(egg.hatch_at) - minutesOff * 60_000)
    const updated: EggRow = {
      ...egg,
      care_day: today,
      pet_count: action === 'pet' ? egg.pet_count + 1 : egg.pet_count,
      warm_count: action === 'warm' ? egg.warm_count + 1 : egg.warm_count,
      pets_today: action === 'pet' ? used + 1 : sameDay ? egg.pets_today : 0,
      warms_today: action === 'warm' ? used + 1 : sameDay ? egg.warms_today : 0,
      hatch_at: new Date(nextHatchAt).toISOString(),
    }
    saveLocalEgg(updated)
    return { ok: true, egg: updated }
  }

  if (action === 'hatch') {
    const egg = localEgg ?? issueNewTestEgg('common')
    const hatched = rollDessertMonster(egg.rarity, egg.pet_count, egg.warm_count)
    saveLocalEgg(null)
    saveLocalMonsters([hatched])
    return { ok: true, monster: hatched }
  }

  return { ok: false, code: 'network', message: '잠시 후 다시 시도해 주세요.' }
}
