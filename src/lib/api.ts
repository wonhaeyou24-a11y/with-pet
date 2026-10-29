import { defaultDessertBase } from '../config/species'
import { supabase } from './supabase'
import { loadMallangCustom } from '../monsters/MallangChameleon'
import type { Element, MonsterLook } from '../monsters/types'

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

export async function callEgg(action: 'sync' | 'pet' | 'warm' | 'hatch', params: { eggId?: string } = {}): Promise<EggResponse> {
  const { data, error } = await supabase.functions.invoke('egg', { body: { action, ...params } })
  if (error || !data) return { ok: false, code: 'network', message: '연결이 불안정해요. 잠시 후 다시 시도해 주세요.' }
  const res = data as EggResponse
  if (res.now) serverOffsetMs = Date.parse(res.now) - Date.now()
  return res
}
