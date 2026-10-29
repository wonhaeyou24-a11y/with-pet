import { useCallback, useEffect, useRef, useState } from 'react'
import { callEgg, serverNow, type EggRow, type MonsterRow } from '../lib/api'
import { supabase, type Player } from '../lib/supabase'
import EggHome, { type CareFx } from './EggHome'
import HatchReveal from './HatchReveal'
import MonsterDetail from './MonsterDetail'
import MonsterHome from './MonsterHome'
import Naming from './Naming'

const HATCH_ANIMATION_MS = 1600

// 돌봄을 받은 알이 하는 말
const EGG_LINES = {
  pet: ['음냐… 기분 좋아~', '쓰담쓰담 좋아요!', '콩닥콩닥~ 두근두근', '헤헤, 간지러워요'],
  warm: ['따끈따끈~ 포근해요', '몸이 사르르 녹아요', '히히, 따뜻해~', '햇살 냄새가 나요'],
}

type Limits = { pet: number; warm: number }

// 서버에서 받은 알·몬스터 상태에 따라 보여 줄 화면을 고른다 (알 → 부화 → 이름 짓기 → 몬스터 홈)
export default function Game({ player }: { player: Player }) {
  const [egg, setEgg] = useState<EggRow | null>(null)
  const [monsters, setMonsters] = useState<MonsterRow[]>([])
  const [limits, setLimits] = useState<Limits>({ pet: 5, warm: 5 })
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [fx, setFx] = useState<CareFx | null>(null)
  const [bubble, setBubble] = useState('')
  const [tick, setTick] = useState(0)
  const [hatching, setHatching] = useState<{ rarity: EggRow['rarity']; monster: MonsterRow | null } | null>(null)
  const [detail, setDetail] = useState(false)
  const toastTimer = useRef<number | undefined>(undefined)
  const fxTimer = useRef<number | undefined>(undefined)

  const sync = useCallback(async () => {
    const res = await callEgg('sync')
    if (!res.ok) {
      setLoadError(res.message ?? '불러오지 못했어요.')
      return
    }
    setLoadError('')
    setEgg(res.egg ?? null)
    setMonsters(res.monsters ?? [])
    if (res.limits) setLimits(res.limits)
    setLoaded(true)
  }, [])

  useEffect(() => {
    sync()
  }, [sync])

  // 남은 시간 표시를 1초마다 새로 그린다
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const say = (message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 3500)
  }

  const logout = () => supabase.auth.signOut()

  async function care(action: 'pet' | 'warm') {
    if (!egg || busy) return
    setBusy(true)
    const before = Date.parse(egg.hatch_at)
    const res = await callEgg(action, { eggId: egg.id })
    setBusy(false)
    if (res.egg) setEgg(res.egg)
    if (res.ok && res.egg) {
      // 줄어든 부화 시간은 서버가 돌려준 값에서 계산한다 (수치를 화면에 따로 두지 않는다)
      const minutes = Math.round((before - Date.parse(res.egg.hatch_at)) / 60_000)
      const lines = EGG_LINES[action]
      navigator.vibrate?.(action === 'pet' ? [15, 50, 15] : 35)
      setFx((cur) => ({ kind: action, key: (cur?.key ?? 0) + 1, minutes }))
      setBubble(lines[Math.floor(Math.random() * lines.length)])
      window.clearTimeout(fxTimer.current)
      fxTimer.current = window.setTimeout(() => {
        setFx(null)
        setBubble('')
      }, 2500)
    } else if (res.message) {
      say(res.message)
    }
  }

  async function hatch() {
    if (!egg || busy) return
    setBusy(true)
    setHatching({ rarity: egg.rarity, monster: null })
    const [res] = await Promise.all([callEgg('hatch', { eggId: egg.id }), new Promise((r) => setTimeout(r, HATCH_ANIMATION_MS))])
    setBusy(false)
    if (res.ok && res.monster) {
      setHatching({ rarity: egg.rarity, monster: res.monster })
      setEgg(null)
    } else {
      setHatching(null)
      if (res.egg) setEgg(res.egg)
      say(res.message ?? '부화에 실패했어요. 다시 시도해 주세요.')
    }
  }

  async function nameMonster(monster: MonsterRow, name: string): Promise<string | null> {
    const { data, error } = await supabase.from('monsters').update({ name }).eq('id', monster.id).select('*').single()
    if (error || !data) return '이름을 저장하지 못했어요. 다시 시도해 주세요.'
    setMonsters((list) => list.map((m) => (m.id === data.id ? (data as MonsterRow) : m)))
    setHatching(null)
    return null
  }

  if (loadError) {
    return (
      <main className="screen center center-text">
        <p className="title">불러오지 못했어요</p>
        <p className="sub">{loadError}</p>
        <button className="btn" onClick={sync}>다시 시도</button>
      </main>
    )
  }
  if (!loaded) return null

  const monster = monsters[0]

  // 부화 연출 (알이 깨지는 순간과 태어난 모습)
  if (hatching) {
    return <HatchReveal rarity={hatching.rarity} monster={hatching.monster} onNext={() => hatching.monster && setHatching(null)} />
  }

  if (monster && !monster.name) {
    return <Naming monster={monster} onSubmit={(name) => nameMonster(monster, name)} />
  }

  if (monster) {
    return detail ? (
      <MonsterDetail monster={monster} onBack={() => setDetail(false)} />
    ) : (
      <MonsterHome nickname={player.nickname} monster={monster} onDetail={() => setDetail(true)} onLogout={logout} />
    )
  }

  if (egg) {
    void tick
    const today = new Date(serverNow() + 9 * 3600_000).toISOString().slice(0, 10)
    const sameDay = egg.care_day === today
    return (
      <EggHome
        nickname={player.nickname}
        egg={egg}
        remainingMs={Date.parse(egg.hatch_at) - serverNow()}
        limits={limits}
        usedPet={sameDay ? egg.pets_today : 0}
        usedWarm={sameDay ? egg.warms_today : 0}
        busy={busy}
        toast={toast}
        bubble={bubble}
        fx={fx}
        onPet={() => care('pet')}
        onWarm={() => care('warm')}
        onHatch={hatch}
        onLogout={logout}
      />
    )
  }

  return (
    <main className="screen center center-text">
      <p className="title">알을 준비하고 있어요</p>
      <button className="btn" onClick={sync}>새로고침</button>
    </main>
  )
}
