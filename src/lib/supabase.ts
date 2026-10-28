import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY 환경변수가 없습니다. .env.local 을 확인하세요.')
}

export const supabase = createClient(url, key)

export type Player = {
  id: string
  nickname: string
  coins: number
  star_shards: number
  rank_score: number
}
