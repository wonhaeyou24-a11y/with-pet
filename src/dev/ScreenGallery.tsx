import { EggArt } from '../ui/EggArt'
// 개발용 화면 갤러리 (주소 끝에 #/dev/screens). 가짜 데이터로 모든 화면을 확인한다. 운영 빌드에는 들어가지 않는다.
import { useEffect, useState, type ReactNode } from 'react'
import type { EggRow, MonsterRow } from '../lib/api'
import AsmrBattleArena from '../screens/AsmrBattleArena'
import BoutiqueShop from '../screens/BoutiqueShop'
import CakeBoxShareModal from '../screens/CakeBoxShareModal'
import CarePantry from '../screens/CarePantry'
import DessertPokedexScreen from '../screens/DessertPokedex'
import DessertPlaza from '../screens/DessertPlaza'
import DessertSoundStudioModal from '../screens/DessertSoundStudioModal'
import EggHome from '../screens/EggHome'
import ExploreScreen from '../screens/ExploreScreen'
import GearScreen from '../screens/GearScreen'
import EvolutionRevealScreen from '../screens/EvolutionReveal'
import HatchReveal from '../screens/HatchReveal'
import Login from '../screens/Login'
import MissionModal from '../screens/MissionModal'
import MonsterDetail from '../screens/MonsterDetail'
import MonsterHome from '../screens/MonsterHome'
import Monster3DView from '../monsters/Monster3DView'
import MyRoomScreen from '../screens/MyRoomScreen'
import Naming from '../screens/Naming'
import Nickname from '../screens/Nickname'
import PatisserieTraining from '../screens/PatisserieTraining'
import SkillTreeScreen from '../screens/SkillTreeScreen'
import { createWorldBossMonster, WORLD_BOSS_CATALOG } from '../lib/bossScheduler'

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
  '탐험(M5)': () => <ExploreScreen monster={{ ...shiny, name: '두바이쫀득', level: 8, evo_stage: 2 }} coins={320} onUpdate={noop} onGoRest={noop} onBack={noop} />,
  '장비·강화(M5)': () => <GearGallery monster={{ ...shiny, name: '두바이쫀득', level: 8 }} />,
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
  '1:1 지인 친선 대전': () => (
    <AsmrBattleArena
      challenger={{ ...shiny, name: '두바이쫀득', level: 8 }}
      defender={{ ...monster, name: '딸기모찌', level: 7 }}
      defenderOwnerName="유리알집사"
      battleMode="friendly"
      onRewardClaimed={noop}
      onBack={noop}
    />
  ),
  '1:1 지인 친선 대전 (승리)': () => (
    <AsmrBattleArena
      challenger={{ ...shiny, name: '두바이쫀득', level: 30 }}
      defender={{ ...monster, name: '딸기모찌', level: 1 }}
      defenderOwnerName="유리알집사"
      battleMode="friendly"
      onRewardClaimed={noop}
      onBack={noop}
    />
  ),
  'DESSERT MAX 월드 보스 레이드': () => (
    <AsmrBattleArena
      challenger={{ ...shiny, name: '두바이쫀득', level: 15 }}
      defender={createWorldBossMonster(WORLD_BOSS_CATALOG[0])}
      defenderOwnerName="광장 중앙 슈가 분수"
      battleMode="boss-raid"
      onRewardClaimed={noop}
      onBack={noop}
    />
  ),
  '각성 진화(M4)': () => (
    <EvolutionRevealScreen
      monster={{ ...shiny, name: '두바이쫀득', level: 8, sp: 4 }}
      onUpdateMonster={noop}
      onBack={noop}
    />
  ),
  '디저트 도감(M4)': () => <DessertPokedexScreen onBack={noop} />,
  '몬스터 상세': () => <MonsterDetail monster={{ ...shiny, name: '두바이쫀득' }} onBack={noop} />,
  '알 부화 및 무지개 충전': () => (
    <div style={{ padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, height: '100%', background: '#FFFDF9' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#3E2723' }}>🌈 로그인 무지개 충전 알</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8D6E63' }}>로그인 및 인증 중 알이 생동감 있게 물들며 춤을 춥니다.</p>
      </div>
      <EggArt rarity="common" mood="happy" size={180} rainbowLoading={true} />
    </div>
  ),
  '파티세리 부티크': () => (
    <BoutiqueShop
      monster={{ ...shiny, name: '두바이쫀득' }}
      onBack={noop}
      onOpenMyRoom={noop}
    />
  ),
  '✨ 3대 개성 꾸미기 (마카롱베레모·웨이퍼롤핀·딸기시럽드리즐)': () => (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#FFFDF9' }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#880E4F' }}>🍓 디저트 펫 3대 시그니처 꾸미기</h2>
        <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#AD1457', fontWeight: 800 }}>
          프렌치 마카롱 베레모 + 볼살 바닐라 웨이퍼 롤 핀 + 생딸기 퐁듀 드리즐
        </p>
      </div>
      <div style={{ width: 280, height: 320, background: 'radial-gradient(circle, #FFF0F5 0%, #FCE4EC 100%)', borderRadius: 24, boxShadow: '0 12px 28px rgba(233,30,99,0.18)', border: '2.5px solid #F8BBD0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Monster3DView
          look={{
            species: 'mochi',
            palette: 0,
            bodyType: 'normal',
            scale: 1,
            ears: 0,
            tail: 0,
            top: 0,
            expression: 'mochi-sparkle',
            patternSeed: 42,
            shiny: false,
            evoStage: 2,
            evoBranch: 'sweet-melty',
            decorations: {
              head: 'macaron-beret',
              face: 'wafer-roll-pin',
              effect: 'syrup-drizzle-strawberry',
            },
            mallang: {
              dessertBase: 'strawberry-cake',
            },
          }}
          size={270}
        />
      </div>
    </div>
  ),
  '✨ 3대 개성 꾸미기 (24K순금박파우더·달콤딸기잼발자국)': () => (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#FFFDF9' }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#E65100' }}>👑 순금박 슈가 파우더 & 딸기잼 발자국</h2>
        <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#D84315', fontWeight: 800 }}>
          360도 반짝이는 24K 순금박 플레이크 + 바닥에 사르르 번지는 젤리 딸기잼 풋프린트
        </p>
      </div>
      <div style={{ width: 280, height: 320, background: 'radial-gradient(circle, #FFFDE7 0%, #FFF8E1 100%)', borderRadius: 24, boxShadow: '0 12px 28px rgba(255,160,0,0.18)', border: '2.5px solid #FFE082', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Monster3DView
          look={{
            species: 'mochi',
            palette: 0,
            bodyType: 'normal',
            scale: 1,
            ears: 0,
            tail: 0,
            top: 0,
            expression: 'mochi-sparkle',
            patternSeed: 99,
            shiny: false,
            evoStage: 2,
            evoBranch: 'sweet-melty',
            decorations: {
              face: 'gold-sugar-powder',
              effect: 'footprint-strawberry-jam',
            },
            mallang: {
              dessertBase: 'macaron-cushion',
            },
          }}
          size={270}
        />
      </div>
    </div>
  ),
  '나만의 미니룸': () => (
    <MyRoomScreen
      monster={{ ...shiny, name: '두바이쫀득' }}
      onBack={noop}
      onOpenBoutique={noop}
    />
  ),
  '파티세리 미션': () => <MissionModal onRewardCoins={noop} onClose={noop} />,
  '케이크 상자 포장 카드': () => (
    <CakeBoxShareModal
      monster={{ ...shiny, name: '두바이쫀득' }}
      ownerNickname="초록집사"
      onClose={noop}
    />
  ),
  '펫 ASMR 사운드 스튜디오': () => <DessertSoundStudioModal onClose={noop} />,
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
    <div style={{ width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
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
      <div style={{ width: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }} key={name}>
        {SCREENS[name]?.()}
      </div>
    </div>
  )
}

function GearGallery({ monster }: { monster: MonsterRow }) {
  const [coins, setCoins] = useState(5000)
  useEffect(() => {
    void import('../lib/gearApi').then(async (g) => {
      if (g.getGear().items.length === 0) {
        for (const d of ['wood-spoon', 'apron-cotton', 'sugar-charm']) await g.buyGear(d)
        const items = g.getGear().items
        await g.equipGear(items[0].id, monster.id)
      }
    })
  }, [monster.id])
  return <GearScreen monster={monster} coins={coins} onCoins={setCoins} onBack={() => {}} />
}
