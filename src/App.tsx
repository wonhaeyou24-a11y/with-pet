import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase, type Player } from './lib/supabase'
import Game from './screens/Game'
import Login from './screens/Login'
import { IS_DEV_MOCK } from './lib/devMode'
import Nickname from './screens/Nickname'
import Loading from './ui/Loading'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [player, setPlayer] = useState<Player | null | undefined>(undefined)

  // 개발 서버에서만 가능한 가짜 로그인 (배포 빌드에서는 항상 꺼져 있다)
  const isDevBypass = IS_DEV_MOCK

  useEffect(() => {
    if (isDevBypass) {
      setPlayer({
        id: 'test-p-01',
        nickname: '초코마스터',
        coins: 520,
        star_shards: 12,
        rank_score: 1200,
      })
      setSession({
        user: { id: 'test-p-01' } as any,
      } as any)
      return
    }

    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [isDevBypass])

  const userId = session?.user.id
  useEffect(() => {
    if (isDevBypass) return
    if (!userId) {
      setPlayer(undefined)
      return
    }
    supabase
      .from('players')
      .select('id, nickname, coins, star_shards, rank_score')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setPlayer(data))
  }, [userId, isDevBypass])

  if (session === undefined) return <Loading />
  if (!session) return <Login />
  if (player === undefined) return <Loading />

  if (player === null) return <Nickname userId={session.user.id} onDone={setPlayer} />
  return <Game player={player} />
}
