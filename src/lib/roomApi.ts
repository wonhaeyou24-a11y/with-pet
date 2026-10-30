// 4b단계: 마이룸·방명록·꾸민 모습은 서버(DB)가 저장한다 (실제 서비스 전용). 쓰기는 모두 DB 함수를 거친다.

import { NETWORK_MESSAGE, SERVER_TIMEOUT_MS, withTimeout } from './net'
import { supabase } from './supabase'
import type { MallangCustom } from '../monsters/MallangChameleon'

export interface RoomEntryRaw {
  id: string
  authorId: string
  author: string
  message: string
  parentId: string | null
  createdAt: string
}

export interface RoomData {
  ok: boolean
  code?: string
  message?: string
  me?: string
  isOwner?: boolean
  ownerName?: string
  theme?: string
  furniture?: string[]
  likes?: number
  todayVisitors?: number
  totalVisitors?: number
  likedToday?: boolean
  entries?: RoomEntryRaw[]
}

interface Plain {
  ok: boolean
  code?: string
  message?: string
  likes?: number
  look?: MallangCustom
}

type RpcName = 'room_get' | 'room_save' | 'room_like' | 'guestbook_add' | 'guestbook_delete' | 'look_save'

async function rpc<T extends { ok: boolean; message?: string; code?: string }>(fn: RpcName, args: Record<string, unknown>): Promise<T> {
  try {
    const { data, error } = await withTimeout(Promise.resolve(supabase.rpc(fn, args)), SERVER_TIMEOUT_MS)
    if (error || !data) return { ok: false, code: 'network', message: NETWORK_MESSAGE } as T
    return data as T
  } catch {
    return { ok: false, code: 'network', message: NETWORK_MESSAGE } as T
  }
}

// ownerId 를 비우면 내 방
export const roomGet = (ownerId?: string) => rpc<RoomData>('room_get', { p_owner: ownerId ?? null })
export const roomSave = (theme: string, furniture: string[]) => rpc<Plain>('room_save', { p_theme: theme, p_furniture: furniture })
export const roomLike = (ownerId: string) => rpc<Plain>('room_like', { p_owner: ownerId })
export const guestbookAdd = (ownerId: string, message: string, parentId?: string | null) =>
  rpc<Plain>('guestbook_add', { p_owner: ownerId, p_message: message, p_parent: parentId ?? null })
export const guestbookDelete = (id: string) => rpc<Plain>('guestbook_delete', { p_id: id })
export const lookSave = (monsterId: string, custom: MallangCustom) => rpc<Plain>('look_save', { p_monster: monsterId, p_custom: custom })
