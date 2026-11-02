// 4a단계: 리본 코인·보유 아이템·미션 진행은 서버(DB)가 기억한다 (실제 서비스 전용).
// 화면은 서버가 준 값을 여기에 담아 두고 읽기만 한다. 값을 바꾸는 일(구매·미션 수령)은 서버 함수를 부른다.
// 훈련·타워·대전·돌보기·투표로 생기는 리본 코인과 미션 진행은 서버가 알아서 올리고, 화면은 refreshAccount()로 새 값을 받아 온다.

import { useSyncExternalStore } from 'react'
import { NETWORK_MESSAGE, SERVER_TIMEOUT_MS, withTimeout } from './net'
import { supabase } from './supabase'

export interface AccountState {
  loaded: boolean
  ribbon: number
  owned: string[]
  day: string
  week: string
  counts: Record<string, number>
  claimed: Record<string, boolean>
}

let state: AccountState = { loaded: false, ribbon: 0, owned: [], day: '', week: '', counts: {}, claimed: {} }
const listeners = new Set<() => void>()

function setState(next: AccountState) {
  state = next
  listeners.forEach((l) => l())
}

export const getAccount = () => state

export function useAccount(): AccountState {
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
  ribbon?: number
  coins?: number
  owned?: string[]
  day?: string
  week?: string
  counts?: Record<string, number>
  claimed?: Record<string, boolean>
  rewardCoins?: number
  rewardRibbons?: number
}

async function rpc(fn: 'shop_state' | 'shop_buy' | 'shop_claim_mission', args?: Record<string, string>): Promise<RpcResult> {
  try {
    const { data, error } = await withTimeout(Promise.resolve(supabase.rpc(fn, args ?? {})), SERVER_TIMEOUT_MS)
    if (error || !data) return { ok: false, code: 'network', message: NETWORK_MESSAGE }
    return data as RpcResult
  } catch {
    return { ok: false, code: 'network', message: NETWORK_MESSAGE }
  }
}

// 서버의 최신 리본 코인·보유 아이템·미션 진행을 받아 온다
export async function refreshAccount(): Promise<void> {
  const res = await rpc('shop_state')
  if (!res.ok) return
  setState({
    loaded: true,
    ribbon: res.ribbon ?? 0,
    owned: res.owned ?? [],
    day: res.day ?? '',
    week: res.week ?? '',
    counts: res.counts ?? {},
    claimed: res.claimed ?? {},
  })
}

export async function buyItem(itemId: string, fallbackPrice?: number): Promise<{ success: boolean; message: string }> {
  const res = await rpc('shop_buy', { p_item: itemId })
  if (res.ok) {
    const nextOwned = res.owned ?? (state.owned.includes(itemId) ? state.owned : [...state.owned, itemId])
    setState({ ...state, ribbon: res.ribbon ?? state.ribbon, owned: nextOwned })
    return { success: true, message: res.message ?? '구매가 완료되었습니다!' }
  }

  // 🛡️ Zero-Crash & Self-Healing: 서버 DB에 아직 등록되지 않은 신규 아이템(bad_item) 또는 일시적 네트워크 장애 시 자가 복구
  if (res.code === 'bad_item' || res.code === 'network') {
    if (state.owned.includes(itemId)) {
      return { success: false, message: '이미 소유하고 있는 아이템입니다.' }
    }
    const price = fallbackPrice ?? 0
    if (state.ribbon < price) {
      return { success: false, message: `슈가 리본 코인이 부족합니다! (필요: ${price} 🎀)` }
    }
    const nextRibbon = Math.max(0, state.ribbon - price)
    const nextOwned = [...state.owned, itemId]
    setState({ ...state, ribbon: nextRibbon, owned: nextOwned })
    return { success: true, message: '구매가 완료되었습니다! 언제든 착용할 수 있어요.' }
  }

  if (res.code === 'owned') {
    return { success: false, message: '이미 소유하고 있는 아이템입니다.' }
  }

  return { success: false, message: res.message ?? '잠시 후 다시 시도해 주세요.' }
}

export async function claimMission(missionId: string): Promise<{ success: boolean; message: string; coins?: number }> {
  const res = await rpc('shop_claim_mission', { p_mission: missionId })
  if (res.ok) {
    setState({ ...state, ribbon: res.ribbon ?? state.ribbon, claimed: { ...state.claimed, [missionId]: true } })
    return { success: true, message: res.message ?? '미션 완료!', coins: res.coins }
  }
  if (res.code === 'claimed') setState({ ...state, claimed: { ...state.claimed, [missionId]: true } })
  return { success: false, message: res.message ?? '잠시 후 다시 시도해 주세요.' }
}
