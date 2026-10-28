import { GAME_NAME } from '../config/game'
import { supabase, type Player } from '../lib/supabase'

export default function Home({ player }: { player: Player }) {
  return (
    <main className="screen top">
      <div className="home-bar">
        <strong>{GAME_NAME}</strong>
        <span>{player.nickname}</span>
      </div>
      <div className="empty">
        <p>
          환영해요, {player.nickname}님!
          <br />
          알은 곧 만나볼 수 있어요.
        </p>
      </div>
      <button className="link" onClick={() => supabase.auth.signOut()}>
        로그아웃
      </button>
    </main>
  )
}
