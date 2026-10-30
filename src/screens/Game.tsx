import { useCallback, useEffect, useRef, useState } from 'react'
import { callEgg, issueNewTestEgg, saveLocalMonsters, serverNow, type EggRow, type MonsterRow } from '../lib/api'
import { PLAZA_SHOWCASE_FRIENDS, type PlazaFriendEntry } from '../lib/battleEngine'
import { callCare } from '../lib/careApi'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import { IS_DEV_MOCK } from '../lib/devMode'
import { supabase, type Player } from '../lib/supabase'
import Loading from '../ui/Loading'
import AsmrBattleArena from './AsmrBattleArena'
import BoutiqueShop from './BoutiqueShop'
import CarePantry from './CarePantry'
import DessertPokedexScreen from './DessertPokedex'
import DessertPlaza from './DessertPlaza'
import EggHome, { type CareFx } from './EggHome'
import EvolutionRevealScreen from './EvolutionReveal'
import HatchReveal from './HatchReveal'
import MonsterDetail from './MonsterDetail'
import ServerBattle from './ServerBattle'
import { refreshAccount } from '../lib/shopApi'
import { lookSave } from '../lib/roomApi'
import { saveMallangCustomLocal, setRemoteLookSaver } from '../monsters/MallangChameleon'
import { isRealMonsterId } from '../lib/battleApi'
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
type MonsterSubView = 'home' | 'detail' | 'care' | 'train' | 'skills' | 'plaza' | 'battle' | 'evolution' | 'pokedex' | 'boutique' | 'myroom' | 'visit'

// 서버에서 받은 알·몬스터 상태에 따라 보여 줄 화면을 고른다 (알 → 부화 → 이름 짓기 → 몬스터 홈 / 돌보기 / 훈련 / 공방)
export default function Game({ player }: { player: Player }) {
  const [egg, setEgg] = useState<EggRow | null>(null)
  const [monsters, setMonsters] = useState<MonsterRow[]>([])
  const [coins, setCoins] = useState<number>(IS_DEV_MOCK ? Math.max(player.coins, 200) : player.coins)
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
  const [visitTarget, setVisitTarget] = useState<PlazaFriendEntry | null>(null)
  const hydratedLooksRef = useRef<Set<string>>(new Set())
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

  // 미션·광장·대전의 코인 보상은 아직 서버에 연결되지 않았다 (3~4단계).
  // 실제 서비스에서는 화면에서만 코인을 늘리지 않는다: 새로고침하면 사라지는 가짜 코인을 막기 위해서다.
  const earnLocalCoins = (delta: number) => {
    if (IS_DEV_MOCK) setCoins((c) => c + delta)
  }

  // 실제 서비스: 서버에서 받은 코인 총액을 반영하고, 함께 바뀌었을 리본 코인·미션 진행도 새로 받아 온다
  const setCoinsFromServer = (next: number) => {
    setCoins(next)
    if (!IS_DEV_MOCK) void refreshAccount()
  }

  // 실제 서비스: 꾸민 모습은 저장할 때 서버에도 올리고(서버가 산 장식만 남긴다), 서버에 있는 내 꾸민 모습은 처음 한 번 내려 받는다
  useEffect(() => {
    if (IS_DEV_MOCK) return
    setRemoteLookSaver((id, custom) => {
      void lookSave(id, custom).then((r) => {
        if (r.ok && r.look) saveMallangCustomLocal(id, r.look)
      })
    })
    return () => setRemoteLookSaver(null)
  }, [])
  useEffect(() => {
    if (IS_DEV_MOCK) return
    for (const m of monsters) {
      if (m.look_custom && !hydratedLooksRef.current.has(m.id)) {
        hydratedLooksRef.current.add(m.id)
        saveMallangCustomLocal(m.id, m.look_custom)
      }
    }
  }, [monsters])

  // 실제 서비스: 로그인하면 리본 코인·보유 아이템·미션 진행을 서버에서 받아 온다
  useEffect(() => {
    if (!IS_DEV_MOCK) void refreshAccount()
  }, [])

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
      // 개발용 로컬 모드에서는 아래 로컬 저장으로 처리한다
    }
    // 실제 서비스에서는 서버에 저장되지 않았으면 실패로 알린다 (이름은 한 번 정하면 바꿀 수 없다)
    if (!IS_DEV_MOCK) return '이름을 저장하지 못했어요. 한글·영문·숫자 1~10자인지 확인하고 다시 시도해 주세요.'
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
  if (!loaded) return <Loading />

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
      if (!IS_DEV_MOCK) void refreshAccount() // 훈련·돌보기·타워로 생긴 리본 코인·미션 진행 반영
      // 가방 정보 없이 호출되는 경우(타워 보상 등)에는 기존 가방을 그대로 둔다
      setFoodBag((cur) => (Object.keys(nextBag).length > 0 ? nextBag : cur))
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
    if (subView === 'visit' && visitTarget) {
      return (
        <MyRoomScreen
          monster={monster}
          visit={{ ownerId: visitTarget.monster.owner, nickname: visitTarget.ownerNickname, monster: visitTarget.monster }}
          onBack={() => setSubView('plaza')}
          onOpenBoutique={() => setSubView('boutique')}
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
          onEarnCoins={earnLocalCoins}
          onCoins={setCoinsFromServer}
          onChallenge={(friend) => {
            setBattleTarget(friend)
            setSubView('battle')
          }}
          onOpenSkillTree={() => setSubView('skills')}
          onVisit={(friend) => {
            setVisitTarget(friend)
            setSubView('visit')
          }}
          onBack={() => setSubView('home')}
        />
      )
    }
    if (subView === 'battle') {
      // 실제 서비스에서 실제 지인과의 대전은 서버가 시드·결과·보상을 정한다. 연습 상대(NPC)는 화면에서만 재생한다.
      if (!IS_DEV_MOCK && isRealMonsterId(battleTarget.monster.id)) {
        return (
          <ServerBattle
            challenger={monster}
            defender={battleTarget.monster}
            defenderOwnerName={battleTarget.ownerNickname}
            onCoins={setCoinsFromServer}
            onBack={() => setSubView('plaza')}
          />
        )
      }
      return (
        <AsmrBattleArena
          challenger={monster}
          defender={battleTarget.monster}
          defenderOwnerName={battleTarget.ownerNickname}
          onRewardClaimed={earnLocalCoins}
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
          // 도감에서 펫을 바꿔 보는 기능은 개발용 로컬 모드에서만 연다 (실제 서비스에서는 서버의 몬스터만 쓴다)
          onSwitchPet={
            IS_DEV_MOCK
              ? (newPet) => {
                  const switchedMonster: MonsterRow = {
                    ...monster,
                    species: newPet.species,
                    name: newPet.name,
                    element: newPet.element,
                  }
                  setMonsters([switchedMonster])
                  saveLocalMonsters([switchedMonster])
                }
              : undefined
          }
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
        onRewardCoins={earnLocalCoins}
        onCoins={setCoinsFromServer}
        onResetTestEgg={
          IS_DEV_MOCK
            ? () => {
                const newEgg = issueNewTestEgg('common')
                setMonsters([])
                setEgg(newEgg)
                setSubView('home')
              }
            : undefined
        }
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
