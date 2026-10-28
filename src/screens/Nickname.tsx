import { useState, type FormEvent } from 'react'
import { NICKNAME } from '../config/game'
import { supabase, type Player } from '../lib/supabase'

type Props = { userId: string; onDone: (player: Player) => void }

export default function Nickname({ userId, onDone }: Props) {
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { data, error: insertError } = await supabase
      .from('players')
      .insert({ id: userId, nickname: nickname.trim() })
      .select('id, nickname, coins, star_shards, rank_score')
      .single()
    setBusy(false)
    if (insertError) {
      setError(insertError.code === '23505' ? '이미 쓰고 있는 닉네임이에요.' : '닉네임을 저장하지 못했어요. 글자 수를 확인해 주세요.')
      return
    }
    onDone(data)
  }

  return (
    <main className="screen">
      <h1>닉네임을 정해요</h1>
      <p className="sub">친구들에게 보여지는 이름이에요</p>
      <form className="card" onSubmit={submit}>
        <input
          value={nickname}
          maxLength={NICKNAME.maxLength}
          placeholder={`${NICKNAME.minLength}~${NICKNAME.maxLength}자`}
          required
          onChange={(e) => setNickname(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button disabled={busy || nickname.trim().length < NICKNAME.minLength}>{busy ? '저장 중…' : '시작하기'}</button>
      </form>
    </main>
  )
}
