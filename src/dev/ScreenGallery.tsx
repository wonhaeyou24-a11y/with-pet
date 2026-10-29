// 개발용 화면 갤러리 (주소 끝에 #/dev/screens). 가짜 데이터로 모든 화면을 확인한다. 운영 빌드에는 들어가지 않는다.
import { useEffect, useState, type ReactNode } from 'react'
import type { EggRow, MonsterRow } from '../lib/api'
import AsmrBattleArena from '../screens/AsmrBattleArena'
import CarePantry from '../screens/CarePantry'
import DessertPlaza from '../screens/DessertPlaza'
import EggHome from '../screens/EggHome'
import HatchReveal from '../screens/HatchReveal'
import Login from '../screens/Login'
import MonsterDetail from '../screens/MonsterDetail'
import MonsterHome from '../screens/MonsterHome'
import Naming from '../screens/Naming'
import Nickname from '../screens/Nickname'
import PatisserieTraining from '../screens/PatisserieTraining'
import SkillTreeScreen from '../screens/SkillTreeScreen'

const egg: EggRow = {
  id: 'e1',
  rarity: 'common',
  hatch_at: '',
  pet_count: 2,
  warm_count: 1,
  care_day: null,
  pets_today: 2,
  warms_today: 1,
}

const monster: MonsterRow = {
  id: 'm1',
  owner: 'u1',
  name: '딸기모찌',
  species: 'mochi',
  element: 'wind',
  element2: null,
  parts: { palette: 0, bodyType: 'normal', scale: 1, ears: 0, tail: 0, top: 0, expression: 'round', patternSeed: 11, shiny: false },
  talents: { hp: 5, atk: 3, def: 8, spd: 12, int: 4, cha: 9 },
  stats: { hp: 48, atk: 22, def: 34, spd: 32, int: 32, cha: 44 },
  trait: '쫀득탄력',
  fav_food: '생딸기 슈가시럽',
  disliked_food: '고대 과일',
  level: 1,
  personality_active: 12,
  personality_bond: 24,
  is_shiny: false,
  mutation: null,
  hatched_at: new Date().toISOString(),
}

const shiny: MonsterRow = {
  ...monster,
  id: 'm2',
  species: 'dubai-cookie',
  element: 'earth',
  element2: 'fire',
  name: null,
  trait: '황금카다이프',
  fav_food: '피스타치오 크림',
  is_shiny: true,
  mutation: 'gold',
  parts: { ...monster.parts, palette: 0, ears: 1, tail: 0, top: 0, expression: 'round', shiny: true },
}

const noop = () => {}
const eggProps = {
  nickname: '초록집사',
  egg,
  limits: { pet: 5, warm: 5 },
  usedPet: 2,
  usedWarm: 1,
  busy: false,
  toast: '',
  bubble: '',
  fx: null,
  onPet: noop,
  onWarm: noop,
  onHatch: noop,
}

const SCREENS: Record<string, () => ReactNode> = {
  '로그인': () => <Login />,
  '닉네임': () => <Nickname userId="x" onDone={noop} />,
  '알(대기)': () => <EggHome {...eggProps} remainingMs={2 * 3600_000 + 14 * 60_000 + 28_000} />,
  '쓰다듬기': () => <EggHome {...eggProps} remainingMs={55 * 60_000} fx={{ kind: 'pet', key: 1, minutes: 3 }} bubble="쓰담쓰담 좋아요!" />,
  '따뜻하게': () => <EggHome {...eggProps} remainingMs={55 * 60_000} fx={{ kind: 'warm', key: 1, minutes: 5 }} bubble="따끈따끈~ 포근해요" />,
  '알(부화 가능)': () => <EggHome {...eggProps} remainingMs={0} />,
  '부화 중': () => <HatchReveal rarity="common" monster={null} onNext={noop} />,
  '태어남': () => <HatchReveal rarity="common" monster={monster} onNext={noop} />,
  '태어남(빛나는)': () => <HatchReveal rarity="legendary" monster={shiny} onNext={noop} />,
  '이름 짓기': () => <Naming monster={monster} onSubmit={async () => null} />,
  '몬스터 홈': () => (
    <MonsterHome
      nickname="초록집사"
      monster={monster}
      onDetail={noop}
      onOpenCare={noop}
      onOpenTrain={noop}
      onOpenSkills={noop}
      onOpenPlaza={noop}
    />
  ),
  '토핑·돌보기(M2)': () => (
    <CarePantry
      monster={{ ...shiny, name: '두바이쫀득' }}
      coins={320}
      foodBag={{ '기본 슈가파우더': 3, '생딸기 슈가시럽': 2, '피스타치오 크림': 2, '황금 카다이프칩': 1 }}
      onUpdate={noop}
      onBack={noop}
    />
  ),
  '파티세리 훈련(M2)': () => (
    <PatisserieTraining
      monster={{ ...shiny, name: '두바이쫀득' }}
      coins={320}
      onUpdate={noop}
      onGoRest={noop}
      onBack={noop}
    />
  ),
  '식감 스킬트리(M3)': () => (
    <SkillTreeScreen
      monster={{ ...shiny, name: '두바이쫀득', level: 8, sp: 4 }}
      onUpdateMonster={noop}
      onBack={noop}
    />
  ),
  '지인 디저트 광장(M3)': () => (
    <DessertPlaza
      myMonster={{ ...shiny, name: '두바이쫀득', level: 8 }}
      myNickname="초록집사"
      coins={320}
      onEarnCoins={noop}
      onChallenge={noop}
      onOpenSkillTree={noop}
      onBack={noop}
    />
  ),
  '식감 ASMR 대전(M3)': () => (
    <AsmrBattleArena
      challenger={{ ...shiny, name: '두바이쫀득', level: 8 }}
      defender={{ ...monster, name: '딸기모찌', level: 7 }}
      defenderOwnerName="유리알집사"
      onRewardClaimed={noop}
      onBack={noop}
    />
  ),
  '몬스터 상세': () => <MonsterDetail monster={{ ...shiny, name: '두바이쫀득' }} onBack={noop} />,
}

export default function ScreenGallery() {
  const [name, setName] = useState(() => decodeURIComponent(location.hash.split('/')[3] ?? '') || '알(대기)')

  useEffect(() => {
    const onHash = () => {
      const next = decodeURIComponent(location.hash.split('/')[3] ?? '')
      if (next && SCREENS[next]) setName(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <select
        aria-label="화면 전환"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          position: 'fixed',
          top: 4,
          right: 6,
          zIndex: 99,
          fontSize: 11,
          padding: '2px 6px',
          borderRadius: 999,
          border: '1px solid #e2cf9f',
          background: 'rgba(255,253,249,0.85)',
          color: '#7a6a60',
        }}
      >
        {Object.keys(SCREENS).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }} key={name}>
        {SCREENS[name]?.()}
      </div>
    </div>
  )
}
