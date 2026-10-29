import { useCallback, useEffect, useRef, useState } from 'react'
import { callEgg, serverNow, type EggRow, type MonsterRow } from '../lib/api'
import { supabase, type Player } from '../lib/supabase'
import EggHome from './EggHome'
import HatchReveal from './HatchReveal'
import MonsterDetail from './MonsterDetail'
import MonsterHome from './MonsterHome'
import Naming from './Naming'

const HATCH_ANIMATION_MS = 1600

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
  const [burst, setBurst] = useState(0)
  const [tick, setTick] = useState(0)
  const [hatching, setHatching] = useState<{ rarity: EggRow['rarity']; monster: MonsterRow | null } | null>(null)
  const [detail, setDetail] = useState(false)
  const toastTimer = useRef<number | undefined>(undefined)

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
    const res = await callEgg(action, { eggId: egg.id })
    setBusy(false)
    if (res.egg) setEgg(res.egg)
    if (res.ok) {
      setBurst((n) => n + 1)
      say(action === 'pet' ? '알이 기분 좋은 듯 꿈틀했어요' : '알이 따뜻해서 편안해 보여요')
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
        burst={burst}
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
