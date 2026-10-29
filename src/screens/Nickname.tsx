import { useState, type FormEvent } from 'react'
import { NICKNAME } from '../config/game'
import { supabase, type Player } from '../lib/supabase'
import { EggArt } from '../ui/EggArt'
import { PawIcon } from '../ui/Icons'

type Props = { userId: string; onDone: (player: Player) => void }

export default function Nickname({ userId, onDone }: Props) {
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const trimmed = nickname.trim()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { data, error: insertError } = await supabase
      .from('players')
      .insert({ id: userId, nickname: trimmed })
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
    <main className="screen center">
      <div className="stage">
        <div className="bubble">반가워요! 뭐라고 부르면 될까요?</div>
        <div style={{ marginTop: 18 }}>
          <EggArt rarity="common" mood="happy" size={140} />
        </div>
      </div>

      <form className="card" onSubmit={submit}>
        <h1 className="title">닉네임을 정해 주세요</h1>
        <p className="sub">친구들에게 보여지는 이름이에요</p>
        <div className={`input-wrap${error ? ' invalid' : ''}`}>
          <input
            value={nickname}
            maxLength={NICKNAME.maxLength}
            placeholder={`닉네임 (${NICKNAME.minLength}~${NICKNAME.maxLength}자)`}
            required
            autoFocus
            onChange={(e) => setNickname(e.target.value)}
          />
          <span className="counter">
            {nickname.length}/{NICKNAME.maxLength}
          </span>
        </div>
        {error && <p className="error-line">{error}</p>}
        <button className="btn block big" disabled={busy || trimmed.length < NICKNAME.minLength}>
          {busy ? '저장 중…' : '시작하기'}
          <PawIcon size={22} color="#fff" />
        </button>
      </form>
      <p className="small center-text">입력하신 닉네임은 친구들에게도 함께 보여져요</p>
    </main>
  )
}
