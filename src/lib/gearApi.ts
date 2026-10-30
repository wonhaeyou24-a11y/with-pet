// 장비·강화: 장비 가방은 서버(DB)가 기억하고, 사기·입기·강화는 서버 함수가 판정한다 (실제 서비스).
// 화면은 서버가 준 값을 여기에 담아 두고 읽기만 한다. 개발용 로컬 모드에서는 같은 규칙으로 메모리에서만 흉내 낸다.

import { useSyncExternalStore } from 'react'
import { GEAR_BAG_LIMIT, GEAR_ENHANCE, GEAR_MAX_LEVEL, gearDefById } from '../config/equipment'
import { IS_DEV_MOCK } from './devMode'
import { NETWORK_MESSAGE, SERVER_TIMEOUT_MS, withTimeout } from './net'
import { supabase } from './supabase'

export interface GearItem {
  id: string
  def: string
  level: number
  monster: string | null
}

export interface GearState {
  loaded: boolean
  items: GearItem[]
}

let state: GearState = { loaded: false, items: [] }
const listeners = new Set<() => void>()

function setState(next: GearState) {
  state = next
  listeners.forEach((l) => l())
}

export const getGear = () => state

export function useGear(): GearState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

interface RpcResult {
  ok: boolean
  code?: string
  message?: string
  coins?: number
  items?: GearItem[]
  success?: boolean
  level?: number
  spent?: number
}

export interface GearActionResult {
  ok: boolean
  message: string
  coins?: number
  // 강화일 때: 성공 여부와 결과 단계
  success?: boolean
  level?: number
}

async function rpc(fn: 'gear_list' | 'gear_buy' | 'gear_equip' | 'gear_enhance', args?: Record<string, string | null>): Promise<RpcResult> {
  try {
    const { data, error } = await withTimeout(Promise.resolve(supabase.rpc(fn, args ?? {})), SERVER_TIMEOUT_MS)
    if (error || !data) return { ok: false, code: 'network', message: NETWORK_MESSAGE }
    return data as RpcResult
  } catch {
    return { ok: false, code: 'network', message: NETWORK_MESSAGE }
  }
}

// ---- 개발용 로컬 모드(메모리) ----
let devSeq = 0
const devCoins = { value: 5000 }

function devAct(fn: string, args: Record<string, string | null>): RpcResult {
  if (fn === 'gear_list') return { ok: true, coins: devCoins.value, items: state.items }
  if (fn === 'gear_buy') {
    const d = gearDefById(String(args.p_def))
    if (!d || d.price === null) return { ok: false, message: '상점에서 파는 장비가 아니에요.' }
    if (state.items.length >= GEAR_BAG_LIMIT) return { ok: false, message: `장비 가방이 가득 찼어요. (최대 ${GEAR_BAG_LIMIT}개)` }
    if (devCoins.value < d.price) return { ok: false, message: `코인이 부족해요. (필요: ${d.price} 🪙)` }
    devCoins.value -= d.price
    setState({ loaded: true, items: [...state.items, { id: `dev-${++devSeq}`, def: d.id, level: 0, monster: null }] })
    return { ok: true, coins: devCoins.value, message: '장비를 샀어요!' }
  }
  if (fn === 'gear_equip') {
    const it = state.items.find((i) => i.id === args.p_item)
    if (!it) return { ok: false, message: '장비를 찾지 못했어요.' }
    const slot = gearDefById(it.def)?.slot
    setState({
      loaded: true,
      items: state.items.map((i) => {
        if (i.id === it.id) return { ...i, monster: args.p_monster }
        if (args.p_monster && i.monster === args.p_monster && gearDefById(i.def)?.slot === slot) return { ...i, monster: null }
        return i
      }),
    })
    return { ok: true, message: args.p_monster ? '장비를 착용했어요!' : '장비를 벗었어요.' }
  }
  const it = state.items.find((i) => i.id === args.p_item)
  if (!it) return { ok: false, message: '장비를 찾지 못했어요.' }
  if (it.level >= GEAR_MAX_LEVEL) return { ok: false, message: '이미 최대 단계예요.' }
  const rule = GEAR_ENHANCE[it.level]
  if (devCoins.value < rule.cost) return { ok: false, message: `코인이 부족해요. (필요: ${rule.cost} 🪙)` }
  devCoins.value -= rule.cost
  const won = Math.random() * 100 < rule.chance
  const level = won ? it.level + 1 : it.level
  setState({ loaded: true, items: state.items.map((i) => (i.id === it.id ? { ...i, level } : i)) })
  return {
    ok: true,
    success: won,
    level,
    coins: devCoins.value,
    spent: rule.cost,
    message: won ? `강화 성공! +${level} 단계가 됐어요 ✨` : '아쉽게 실패했어요. 장비는 그대로예요.',
  }
}

async function call(fn: 'gear_list' | 'gear_buy' | 'gear_equip' | 'gear_enhance', args: Record<string, string | null> = {}): Promise<RpcResult> {
  return IS_DEV_MOCK ? devAct(fn, args) : rpc(fn, args)
}

// 서버의 최신 장비 가방을 받아 온다. 코인도 함께 돌려준다.
export async function refreshGear(): Promise<number | undefined> {
  const res = await call('gear_list')
  if (!res.ok) return undefined
  setState({ loaded: true, items: res.items ?? [] })
  return res.coins
}

export async function buyGear(defId: string): Promise<GearActionResult> {
  const res = await call('gear_buy', { p_def: defId })
  if (res.ok) await refreshGear()
  return { ok: res.ok, message: res.message ?? '잠시 후 다시 시도해 주세요.', coins: res.coins }
}

// monsterId 가 null 이면 벗기
export async function equipGear(itemId: string, monsterId: string | null): Promise<GearActionResult> {
  const res = await call('gear_equip', { p_item: itemId, p_monster: monsterId })
  if (res.ok) await refreshGear()
  return { ok: res.ok, message: res.message ?? '잠시 후 다시 시도해 주세요.' }
}

export async function enhanceGear(itemId: string): Promise<GearActionResult> {
  const res = await call('gear_enhance', { p_item: itemId })
  if (res.ok) await refreshGear()
  return { ok: res.ok, message: res.message ?? '잠시 후 다시 시도해 주세요.', coins: res.coins, success: res.success, level: res.level }
}

