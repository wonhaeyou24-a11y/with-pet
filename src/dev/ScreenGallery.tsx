// 개발용 화면 갤러리 (주소 끝에 #/dev/screens). 가짜 데이터로 모든 화면을 확인한다. 운영 빌드에는 들어가지 않는다.
import { useState, type ReactNode } from 'react'
import type { EggRow, MonsterRow } from '../lib/api'
import EggHome from '../screens/EggHome'
import HatchReveal from '../screens/HatchReveal'
import Login from '../screens/Login'
import MonsterDetail from '../screens/MonsterDetail'
import MonsterHome from '../screens/MonsterHome'
import Naming from '../screens/Naming'
import Nickname from '../screens/Nickname'

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
  name: '구름이',
  species: 'mongsil',
  element: 'wind',
  element2: null,
  parts: { palette: 0, bodyType: 'normal', scale: 1, ears: 2, tail: 0, top: 3, expression: 'round', patternSeed: 11, shiny: false },
  talents: { hp: 5, atk: 3, def: 8, spd: 12, int: 4, cha: 9 },
  stats: { hp: 47, atk: 21, def: 31, spd: 35, int: 31, cha: 40 },
  trait: '먹보',
  level: 1,
  personality_active: 12,
  personality_bond: 24,
  is_shiny: false,
  mutation: null,
  hatched_at: new Date().toISOString(),
}

const shiny: MonsterRow = { ...monster, id: 'm2', species: 'heugyeom', element: 'fire', element2: 'water', name: null, is_shiny: true, mutation: 'crystal', parts: { ...monster.parts, palette: 1, ears: 1, tail: 0, top: 1, expression: 'sharp', shiny: true } }

const noop = () => {}
const eggProps = {
  nickname: '초록집사',
  egg,
  limits: { pet: 5, warm: 5 },
  usedPet: 2,
  usedWarm: 1,
  busy: false,
  toast: '',
  burst: 0,
  onPet: noop,
  onWarm: noop,
  onHatch: noop,
}

const SCREENS: Record<string, () => ReactNode> = {
  '로그인': () => <Login />,
  '닉네임': () => <Nickname userId="x" onDone={noop} />,
  '알(대기)': () => <EggHome {...eggProps} remainingMs={2 * 3600_000 + 14 * 60_000 + 28_000} toast="알이 기분 좋은 듯 꿈틀했어요" burst={1} />,
  '알(부화 가능)': () => <EggHome {...eggProps} remainingMs={0} />,
  '부화 중': () => <HatchReveal rarity="common" monster={null} onNext={noop} />,
  '태어남': () => <HatchReveal rarity="common" monster={monster} onNext={noop} />,
  '태어남(빛나는)': () => <HatchReveal rarity="legendary" monster={shiny} onNext={noop} />,
  '이름 짓기': () => <Naming monster={monster} onSubmit={async () => null} />,
  '몬스터 홈': () => <MonsterHome nickname="초록집사" monster={monster} onDetail={noop} />,
  '몬스터 상세': () => <MonsterDetail monster={{ ...shiny, name: '불꽃이' }} onBack={noop} />,
}

export default function ScreenGallery() {
  const [name, setName] = useState(() => decodeURIComponent(location.hash.split('/')[3] ?? '') || '알(대기)')
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, position: 'sticky', top: 0, background: '#fff8', zIndex: 50 }}>
        {Object.keys(SCREENS).map((n) => (
          <button key={n} onClick={() => setName(n)} style={{ opacity: n === name ? 1 : 0.55, fontSize: 12 }}>
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }} key={name}>
        {SCREENS[name]?.()}
      </div>
    </div>
  )
}
