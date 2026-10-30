// 3a단계: 친선 대전·한입 투표 서버 호출 (실제 서비스 전용). 시드·결과·보상은 모두 서버가 정한다.

import type { BattleSimulationResult } from './battleEngine'
import { syncServerTime, type MonsterRow, type Stats } from './api'
import { NETWORK_MESSAGE, readFunctionError, SERVER_TIMEOUT_MS, withTimeout } from './net'
import { supabase } from './supabase'

export interface BattleResponse {
  ok: boolean
  code?: string
  message?: string
  battleId?: string | null
  result?: BattleSimulationResult
  reward?: number
  coins?: number
  rewardsLeft?: number
  likes?: number
  votedIds?: string[]
  votesRewardLeft?: number
  monster?: MonsterRow
  skillLevel?: number
  newStage?: number
  branch?: string
  statBoost?: Stats
  bonusSp?: number
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 서버에 저장된 실제 지인 몬스터인지 (광장의 연습 상대 NPC는 id가 uuid가 아니다)
export const isRealMonsterId = (id: string) => UUID.test(id)

export async function callBattle(
  action: 'status' | 'fight' | 'vote' | 'skill_upgrade' | 'set_stance' | 'evolve',
  params: { monsterId?: string; defenderId?: string; skillId?: string; stance?: string; branch?: string } = {},
): Promise<BattleResponse> {
  try {
    // 대전은 계산이 길 수 있어 조금 더 기다린다
    const { data, error } = await withTimeout(supabase.functions.invoke('battle', { body: { action, ...params } }), SERVER_TIMEOUT_MS * 2)
    if (error) return { ok: false, code: 'server', message: await readFunctionError(error) }
    if (data && typeof data === 'object' && 'ok' in data) {
      syncServerTime((data as { now?: string }).now)
      return data as BattleResponse
    }
    return { ok: false, code: 'network', message: NETWORK_MESSAGE }
  } catch {
    return { ok: false, code: 'network', message: NETWORK_MESSAGE }
  }
}
