// 탐험(보내 놓고 기다리기) 서버 호출. 출발·복귀·보상은 care 함수가 서버 시각과 시드로 판정하고, 화면은 결과만 받는다.
// 개발용 로컬 모드에서는 같은 계산 코드로 메모리에서 흉내 낸다 (1시간 = 5초).

import {
  applyTripClaim,
  checkTripStart,
  effectivePower,
  regionById,
  resolveTrip,
  type TripResult,
} from '../config/explore'
import { serverNow, syncServerTime, type MonsterRow } from './api'
import { IS_DEV_MOCK } from './devMode'
import { NETWORK_MESSAGE, readFunctionError, SERVER_TIMEOUT_MS, withTimeout } from './net'
import { supabase } from './supabase'

export interface Trip {
  id: string
  region: string
  zone: number
  hours: number
  power: number
  startedAt: string
  finishAt: string
}

export interface JournalEntry {
  id: string
  region: string
  zone: number
  hours: number
  claimed_at: string
  result: (TripResult & { gearDef?: string | null }) | null
}

export interface ExploreState {
  ok: boolean
  code?: string
  message?: string
  progress: Record<string, number>
  trip: Trip | null
  journal: JournalEntry[]
  fatigue?: number
}

export interface ExploreFinish {
  ok: boolean
  code?: string
  message?: string
  monster?: MonsterRow
  coins?: number
  foodBag?: Record<string, number>
  leveledUp?: boolean
  progress?: Record<string, number>
  result?: TripResult & { gearDef?: string | null }
  trip?: { region: string; zone: number; hours: number }
}

type Action = 'explore_state' | 'explore_start' | 'explore_finish'

async function call<T extends { ok: boolean }>(monsterId: string, action: Action, params: Record<string, unknown> = {}): Promise<T> {
  try {
    const { data, error } = await withTimeout(supabase.functions.invoke('care', { body: { action, monsterId, ...params } }), SERVER_TIMEOUT_MS)
    if (error) return { ok: false, code: 'server', message: await readFunctionError(error) } as unknown as T
    if (data && typeof data === 'object' && 'ok' in data) {
      syncServerTime((data as { now?: string }).now)
      return data as T
    }
    return { ok: false, code: 'network', message: NETWORK_MESSAGE } as unknown as T
  } catch {
    return { ok: false, code: 'network', message: NETWORK_MESSAGE } as unknown as T
  }
}

// ---- 개발용 로컬 모드(메모리) ----
const dev: { trip: Trip | null; seed: number; progress: Record<string, number>; journal: JournalEntry[] } = {
  trip: null,
  seed: 1,
  progress: {},
  journal: [],
}

function devState(): ExploreState {
  return { ok: true, progress: dev.progress, trip: dev.trip, journal: dev.journal }
}

function devStart(monster: MonsterRow, region: string, zone: number, hours: number): { ok: boolean; message?: string; trip?: Trip } {
  const chk = checkTripStart(
    { level: monster.level, evoStage: monster.evo_stage ?? 1, progress: dev.progress, fatigue: monster.fatigue ?? 0 },
    region,
    zone,
    hours,
  )
  if (!chk.ok) return { ok: false, message: chk.message }
  const now = serverNow()
  dev.seed += 7919
  dev.trip = {
    id: `dev-${dev.seed}`,
    region,
    zone,
    hours,
    power: effectivePower(regionById(region)!, monster.stats, monster.element),
    startedAt: new Date(now).toISOString(),
    finishAt: new Date(now + hours * 5000).toISOString(),
  }
  return { ok: true, trip: dev.trip }
}

function devFinish(monster: MonsterRow): ExploreFinish {
  const t = dev.trip
  if (!t) return { ok: false, message: '탐험 중이 아니에요.' }
  const left = Math.ceil((Date.parse(t.finishAt) - serverNow()) / 1000)
  if (left > 0) return { ok: false, code: 'not_yet', message: `⏳ 아직 탐험 중이에요! ${left}초 뒤에 돌아와요.` }
  const cleared = dev.progress[t.region] ?? 0
  const res = resolveTrip({ regionId: t.region, zone: t.zone, hours: t.hours, power: t.power, seed: dev.seed, firstClear: t.zone > cleared, coinRoom: 400 })
  const nextProgress = { ...dev.progress }
  if (res.cleared && t.zone > cleared) nextProgress[t.region] = t.zone
  dev.progress = nextProgress
  dev.journal = [{ id: t.id, region: t.region, zone: t.zone, hours: t.hours, claimed_at: new Date(serverNow()).toISOString(), result: res }, ...dev.journal].slice(0, 8)
  dev.trip = null
  const base = {
    hunger: monster.hunger ?? 80, mood: monster.mood ?? 80, fatigue: monster.fatigue ?? 0, cleanliness: monster.cleanliness ?? 100,
    active: 0, bond: 0, stats: monster.stats, talents: monster.talents, level: monster.level, exp: monster.exp ?? 0, sp: monster.sp ?? 0,
    coins: 0, foodBag: {}, recentFoods: [], careCounts: {}, discoveredFav: false, discoveredDisliked: false, favFood: '', dislikedFood: '', trait: '',
  }
  const claim = applyTripClaim(base, res)
  const s = claim.state
  return {
    ok: true,
    monster: { ...monster, level: s.level, exp: s.exp, sp: s.sp, stats: s.stats, fatigue: s.fatigue },
    coins: 0,
    foodBag: s.foodBag,
    leveledUp: claim.leveledUp,
    progress: nextProgress,
    result: res,
    trip: { region: t.region, zone: t.zone, hours: t.hours },
  }
}

export async function exploreState(monsterId: string): Promise<ExploreState> {
  if (IS_DEV_MOCK) return devState()
  const res = await call<ExploreState>(monsterId, 'explore_state')
  return res.ok ? res : { ...res, progress: {}, trip: null, journal: [] }
}

export async function exploreStart(monster: MonsterRow, region: string, zone: number, hours: number): Promise<{ ok: boolean; message?: string; trip?: Trip }> {
  if (IS_DEV_MOCK) return devStart(monster, region, zone, hours)
  return call(monster.id, 'explore_start', { region, zone, hours })
}

export async function exploreFinish(monster: MonsterRow): Promise<ExploreFinish> {
  if (IS_DEV_MOCK) return devFinish(monster)
  return call<ExploreFinish>(monster.id, 'explore_finish')
}
