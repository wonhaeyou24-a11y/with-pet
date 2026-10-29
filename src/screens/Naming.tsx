import { useState, type FormEvent } from 'react'
import { MONSTER_NAME } from '../config/game'
import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import MonsterView from '../monsters/MonsterView'
import { ElementIcon, HeartIcon } from '../ui/Icons'
import { Nest } from '../ui/parts'

type Props = { monster: MonsterRow; onSubmit: (name: string) => Promise<string | null> }

export default function Naming({ monster, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const valid = MONSTER_NAME.pattern.test(name)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    setError('')
    const message = await onSubmit(name)
    if (message) setError(message)
    setBusy(false)
  }

  const info = SPECIES_INFO[monster.species]
  return (
    <main className="screen">
      <div className="center-text stack" style={{ alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span className="chip coral">부화 성공!</span>
        <h1 className="title">새 친구의 이름을 지어 주세요</h1>
        <p className="sub">다정한 이름을 입력해 주세요</p>
        <span className="chip" style={{ gap: 8 }}>
          종족 {info?.name ?? monster.species}
          <ElementIcon element={monster.element} size={20} />
          {ELEMENT_INFO[monster.element].label} 속성
        </span>
      </div>

      <div className="stage" style={{ alignItems: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <MonsterView look={monsterLook(monster)} size={200} title={info?.name} />
        </div>
        <Nest width={230} lift={42} front={false} />
      </div>

      <form className="card" onSubmit={submit}>
        <div className="field">
          <label className="field-label" htmlFor="mon-name">
            새 친구의 이름
            <span className="hint">한글, 영문, 숫자 가능</span>
          </label>
          <div className={`input-wrap${error ? ' invalid' : ''}`}>
            <input
              id="mon-name"
              value={name}
              maxLength={MONSTER_NAME.maxLength}
              placeholder="이름을 지어 주세요"
              autoComplete="off"
              onChange={(e) => setName(e.target.value.replace(/\s/g, ''))}
            />
            <span className="counter">
              {name.length}/{MONSTER_NAME.maxLength}
            </span>
          </div>
        </div>
        {name && !valid && <p className="error-line">한글, 영문, 숫자만 쓸 수 있어요.</p>}
        {error && <p className="error-line">{error}</p>}
        <p className="note-line">한 번 정하면 바꿀 수 없어요</p>
        <button className="btn block big" disabled={busy || !valid}>
          <HeartIcon size={20} color="#fff" />
          {busy ? '저장 중…' : '이 이름으로 정하기'}
        </button>
        <p className="small center-text">이름을 1자 이상 입력하면 버튼이 활성화돼요</p>
      </form>
    </main>
  )
}
