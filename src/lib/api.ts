import { supabase } from './supabase'
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
  level: number
  personality_active: number
  personality_bond: number
  is_shiny: boolean
  mutation: string | null
  hatched_at: string
}

export function monsterLook(m: MonsterRow): MonsterLook {
  return { species: m.species, ...m.parts }
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
