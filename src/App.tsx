import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase, type Player } from './lib/supabase'
import Home from './screens/Home'
import Login from './screens/Login'
import Nickname from './screens/Nickname'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [player, setPlayer] = useState<Player | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
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
  }, [userId])

  if (session === undefined) return null
  if (!session) return <Login />
  if (player === undefined) return null
  if (player === null) return <Nickname userId={session.user.id} onDone={setPlayer} />
  return <Home player={player} />
}
