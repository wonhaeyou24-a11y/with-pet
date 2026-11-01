import { IS_DEV_MOCK } from './devMode'
import { NETWORK_MESSAGE, SERVER_TIMEOUT_MS, withTimeout } from './net'
import { supabase } from './supabase'
import { sanitizeMallangCustom, type MallangCustom } from '../monsters/MallangChameleon'

export interface LookPreset {
  id: string
  name: string
  custom: MallangCustom
  updatedAt?: string
}

export interface LookPresetTemplate {
  id: string
  name: string
  desc: string
  icon: string
  custom: MallangCustom
}

// 👑 기본 제공 3대 시그니처 추천 코디 프리셋
export const RECOMMENDED_PRESETS: LookPresetTemplate[] = [
  {
    id: 'template-sweet-cute',
    name: '달콤 큐트',
    desc: '상큼한 체리 모자와 꽃보라로 사랑스러움을 극대화한 시그니처 룩 🍰',
    icon: '🍒',
    custom: {
      dessertBase: 'strawberry-cake',
      decorations: {
        head: 'cream-cherry',
        face: null,
        neck: 'pretzel-ribbon',
        back: null,
        hand: 'lollipop-wand',
        bg: 'sunny-meadow',
        effect: 'blossom-breeze',
        dye: 1, // 로즈베리
      },
    },
  },
  {
    id: 'template-star-wizard',
    name: '별빛 마법사',
    desc: '신비로운 별마법사 모자와 황금 별자리 오라를 두른 대마법사 룩 ✨',
    icon: '🧙‍♂️',
    custom: {
      dessertBase: 'macaron-cushion',
      decorations: {
        head: 'wizard-hat',
        face: 'alchemy-glasses',
        neck: 'rune-scarf',
        back: 'meteor-wings',
        hand: 'lantern-staff',
        bg: 'night-observatory',
        effect: 'constellation-aura',
        dye: 4, // 오로라 퍼플
      },
    },
  },
  {
    id: 'template-battle-patissier',
    name: '전투 파티시에',
    desc: '순백 천사 머랭 날개와 황금 왕관으로 완성한 기품 넘치는 전투 룩 🪽',
    icon: '👑',
    custom: {
      dessertBase: 'choco-cookie',
      decorations: {
        head: 'star-crown',
        face: 'star-patch',
        neck: 'bell-ribbon',
        back: 'wings-meringue-angel',
        hand: 'star-wand',
        bg: null,
        effect: 'aura-galaxy-orbit',
        dye: 3, // 선셋 골드
      },
    },
  },
]

interface Result { ok: boolean; message?: string; presets?: LookPreset[]; id?: string }
const DEV_KEY = 'withpet_look_presets_v1'

function devLoad(): LookPreset[] {
  try {
    const raw = localStorage.getItem(DEV_KEY)
    return raw ? (JSON.parse(raw) as LookPreset[]).slice(0, 8).map((item) => ({ ...item, custom: sanitizeMallangCustom(item.custom) })) : []
  } catch { return [] }
}
function devSave(items: LookPreset[]) { localStorage.setItem(DEV_KEY, JSON.stringify(items.slice(0, 8))) }

async function rpc(name: 'look_preset_list' | 'look_preset_save' | 'look_preset_delete', args?: Record<string, unknown>): Promise<Result> {
  try {
    const { data, error } = await withTimeout(Promise.resolve(supabase.rpc(name, args ?? {})), SERVER_TIMEOUT_MS)
    return error || !data ? { ok: false, message: NETWORK_MESSAGE } : data as Result
  } catch { return { ok: false, message: NETWORK_MESSAGE } }
}

export async function listLookPresets(): Promise<Result> {
  return IS_DEV_MOCK ? { ok: true, presets: devLoad() } : rpc('look_preset_list')
}

export async function saveLookPreset(name: string, custom: MallangCustom): Promise<Result> {
  const clean = sanitizeMallangCustom(custom)
  if (IS_DEV_MOCK) {
    const items = devLoad()
    if (items.length >= 8) return { ok: false, message: '코디 프리셋은 최대 8개까지 저장할 수 있어요.' }
    const item = { id: `dev-preset-${Date.now()}`, name: name.trim(), custom: clean }
    devSave([item, ...items])
    return { ok: true, id: item.id }
  }
  return rpc('look_preset_save', { p_id: null, p_name: name.trim(), p_custom: clean })
}

export async function deleteLookPreset(id: string): Promise<Result> {
  if (IS_DEV_MOCK) { devSave(devLoad().filter((item) => item.id !== id)); return { ok: true } }
  return rpc('look_preset_delete', { p_id: id })
}
