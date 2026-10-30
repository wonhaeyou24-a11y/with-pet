import { useCallback, useEffect, useRef, useState } from 'react'
import { callEgg, issueNewTestEgg, saveLocalMonsters, serverNow, type EggRow, type MonsterRow } from '../lib/api'
import { PLAZA_SHOWCASE_FRIENDS, type PlazaFriendEntry } from '../lib/battleEngine'
import { callCare } from '../lib/careApi'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import { supabase, type Player } from '../lib/supabase'
import AsmrBattleArena from './AsmrBattleArena'
import BoutiqueShop from './BoutiqueShop'
import CarePantry from './CarePantry'
import DessertPokedexScreen from './DessertPokedex'
import DessertPlaza from './DessertPlaza'
import EggHome, { type CareFx } from './EggHome'
import EvolutionRevealScreen from './EvolutionReveal'
import HatchReveal from './HatchReveal'
import MonsterDetail from './MonsterDetail'
import MonsterHome from './MonsterHome'
import MyRoomScreen from './MyRoomScreen'
import Naming from './Naming'
import PatisserieTraining from './PatisserieTraining'
import SkillTreeScreen from './SkillTreeScreen'

const HATCH_ANIMATION_MS = 1600

// 돌봄을 받은 디저트 알이 하는 말
const EGG_LINES = {
  pet: ['쫀득쫀득~ 반죽이 말랑해져요!', '쓰담쓰담 달콤해요!', '콩닥콩닥~ 맛있게 부풀어요', '헤헤, 슈가파우더가 간지러워요'],
  warm: ['따끈따끈~ 오븐처럼 포근해요', '설탕 시럽이 사르르 녹아요', '히히, 노릇노릇 따뜻해~', '달콤한 바닐라 향기가 나요'],
}

type Limits = { pet: number; warm: number }
type MonsterSubView = 'home' | 'detail' | 'care' | 'train' | 'skills' | 'plaza' | 'battle' | 'evolution' | 'pokedex' | 'boutique' | 'myroom'

// 서버에서 받은 알·몬스터 상태에 따라 보여 줄 화면을 고른다 (알 → 부화 → 이름 짓기 → 몬스터 홈 / 돌보기 / 훈련 / 공방)
export default function Game({ player }: { player: Player }) {
  const [egg, setEgg] = useState<EggRow | null>(null)
  const [monsters, setMonsters] = useState<MonsterRow[]>([])
  const [coins, setCoins] = useState<number>(Math.max(player.coins, 200))
  const [foodBag, setFoodBag] = useState<Record<string, number>>({
    '기본 슈가파우더': 3,
    '생딸기 슈가시럽': 1,
    '피스타치오 크림': 1,
  })
  const [limits, setLimits] = useState<Limits>({ pet: 5, warm: 5 })
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [fx, setFx] = useState<CareFx | null>(null)
  const [bubble, setBubble] = useState('')
  const [tick, setTick] = useState(0)
  const [hatching, setHatching] = useState<{ rarity: EggRow['rarity']; monster: MonsterRow | null } | null>(null)
  const [subView, setSubView] = useState<MonsterSubView>('home')
  const [battleTarget, setBattleTarget] = useState<PlazaFriendEntry>(PLAZA_SHOWCASE_FRIENDS[0])
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
    const list = res.monsters ?? []
    if (list[0]) {
      const careRes = await callCare(list[0], player.coins, 'sync')
      if (careRes.ok && careRes.monster) {
        list[0] = careRes.monster
        if (careRes.coins !== undefined) setCoins(careRes.coins)
        if (careRes.foodBag) setFoodBag(careRes.foodBag)
      }
    }
    setMonsters(list)
    if (res.limits) setLimits(res.limits)
    setLoaded(true)
  }, [player.coins])

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
      playDessertAsmr(action === 'pet' ? 'mochi-squish' : 'smore-sizzle')
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
    playDessertAsmr('sugar-crack')
    setHatching({ rarity: egg.rarity, monster: null })
    const [res] = await Promise.all([callEgg('hatch', { eggId: egg.id }), new Promise((r) => setTimeout(r, HATCH_ANIMATION_MS))])
    setBusy(false)
    if (res.ok && res.monster) {
      playDessertAsmr(getSpeciesSoundKind(res.monster.species))
      setMonsters([res.monster])
      setHatching({ rarity: egg.rarity, monster: res.monster })
      setEgg(null)
    } else {
      setHatching(null)
      if (res.egg) setEgg(res.egg)
      say(res.message ?? '부화에 실패했어요. 다시 시도해 주세요.')
    }
  }

  async function nameMonster(monster: MonsterRow, name: string): Promise<string | null> {
    const namedMonster: MonsterRow = { ...monster, name }
    try {
      const { data, error } = await supabase.from('monsters').update({ name }).eq('id', monster.id).select('*').single()
      if (!error && data) {
        const synced = data as MonsterRow
        setMonsters((list) => {
          const next = list.map((m) => (m.id === synced.id ? synced : m))
          saveLocalMonsters(next)
          return next
        })
        setHatching(null)
        return null
      }
    } catch {
      // 로컬 테스트 몬스터인 경우 아래 로컬 저장으로 안전 처리
    }
    setMonsters((list) => {
      const next = list.map((m) => (m.id === monster.id ? namedMonster : m))
      saveLocalMonsters(next)
      return next
    })
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
    const handleCareUpdate = (nextMonster: MonsterRow, nextCoins: number, nextBag: Record<string, number>) => {
      setMonsters((list) => {
        const next = list.map((m) => (m.id === nextMonster.id ? nextMonster : m))
        saveLocalMonsters(next)
        return next
      })
      setCoins(nextCoins)
      setFoodBag(nextBag)
    }

    if (subView === 'detail') {
      return (
        <MonsterDetail
          monster={monster}
          onBack={() => setSubView('home')}
          onOpenBoutique={() => setSubView('boutique')}
        />
      )
    }
    if (subView === 'boutique') {
      return (
        <BoutiqueShop
          monster={monster}
          onBack={() => setSubView('home')}
          onOpenMyRoom={() => setSubView('myroom')}
        />
      )
    }
    if (subView === 'myroom') {
      return (
        <MyRoomScreen
          monster={monster}
          onBack={() => setSubView('home')}
          onOpenBoutique={() => setSubView('boutique')}
        />
      )
    }
    if (subView === 'care') {
      return (
        <CarePantry
          monster={monster}
          coins={coins}
          foodBag={foodBag}
          onUpdate={handleCareUpdate}
          onBack={() => setSubView('home')}
        />
      )
    }
    if (subView === 'train') {
      return (
        <PatisserieTraining
          monster={monster}
          coins={coins}
          onUpdate={handleCareUpdate}
          onGoRest={() => setSubView('care')}
          onBack={() => setSubView('home')}
        />
      )
    }
    if (subView === 'skills') {
      return (
        <SkillTreeScreen
          monster={monster}
          onUpdateMonster={(nextMonster) => {
            setMonsters((list) => list.map((m) => (m.id === nextMonster.id ? nextMonster : m)))
          }}
          onBack={() => setSubView('home')}
        />
      )
    }
    if (subView === 'plaza') {
      return (
        <DessertPlaza
          myMonster={monster}
          myNickname={player.nickname}
          coins={coins}
          onEarnCoins={(delta) => setCoins((c) => c + delta)}
          onChallenge={(friend) => {
            setBattleTarget(friend)
            setSubView('battle')
          }}
          onOpenSkillTree={() => setSubView('skills')}
          onBack={() => setSubView('home')}
        />
      )
    }
    if (subView === 'battle') {
      return (
        <AsmrBattleArena
          challenger={monster}
          defender={battleTarget.monster}
          defenderOwnerName={battleTarget.ownerNickname}
          onRewardClaimed={(coinsEarned) => setCoins((c) => c + coinsEarned)}
          onBack={() => setSubView('plaza')}
        />
      )
    }
    if (subView === 'evolution') {
      return (
        <EvolutionRevealScreen
          monster={monster}
          onUpdateMonster={(nextMonster) => {
            setMonsters((list) => list.map((m) => (m.id === nextMonster.id ? nextMonster : m)))
          }}
          onBack={() => setSubView('home')}
        />
      )
    }
    if (subView === 'pokedex') {
      return (
        <DessertPokedexScreen
          currentMonsterId={monster.id}
          onSwitchPet={(newPet) => {
            const switchedMonster: MonsterRow = {
              ...monster,
              species: newPet.species,
              name: newPet.name,
              element: newPet.element,
            }
            setMonsters([switchedMonster])
            saveLocalMonsters([switchedMonster])
          }}
          onBack={() => setSubView('home')}
        />
      )
    }
    return (
      <MonsterHome
        nickname={player.nickname}
        monster={monster}
        coins={coins}
        onDetail={() => setSubView('detail')}
        onOpenCare={() => setSubView('care')}
        onOpenTrain={() => setSubView('train')}
        onOpenSkills={() => setSubView('skills')}
        onOpenPlaza={() => setSubView('plaza')}
        onOpenEvolution={() => setSubView('evolution')}
        onOpenDex={() => setSubView('pokedex')}
        onOpenMyRoom={() => setSubView('myroom')}
        onOpenBoutique={() => setSubView('boutique')}
        onRewardCoins={(amt) => setCoins((c) => c + amt)}
        onResetTestEgg={() => {
          const newEgg = issueNewTestEgg('common')
          setMonsters([])
          setEgg(newEgg)
          setSubView('home')
        }}
        onLogout={logout}
      />
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
