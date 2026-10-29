import { useRef, useState } from 'react'
import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { ChevronIcon, ElementIcon, SparkleIcon } from '../ui/Icons'
import { Nest, StatBars, TopBar, totalStats } from '../ui/parts'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'

type Props = {
  nickname: string
  monster: MonsterRow
  coins?: number
  onDetail: () => void
  onOpenCare?: () => void
  onOpenTrain?: () => void
  onOpenSkills?: () => void
  onOpenPlaza?: () => void
  onResetTestEgg?: () => void
  onLogout?: () => void
}

export default function MonsterHome({
  nickname,
  monster,
  coins = 200,
  onDetail,
  onOpenCare,
  onOpenTrain,
  onOpenSkills,
  onOpenPlaza,
  onResetTestEgg,
  onLogout,
}: Props) {
  const look = monsterLook(monster)
  const activeSpecies = look.mallang?.morphForm ?? monster.species
  const info = SPECIES_INFO[activeSpecies] ?? SPECIES_INFO[monster.species]
  const [asmrBubble, setAsmrBubble] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState<number>(0)
  const [combo, setCombo] = useState<number>(1)
  const lastTouchRef = useRef<number>(0)

  const hunger = monster.hunger ?? 80
  const mood = monster.mood ?? 80
  const fatigue = monster.fatigue ?? 0
  const cleanliness = monster.cleanliness ?? 100
  const soundKind = getSpeciesSoundKind(activeSpecies, look.mallang?.dessertBase)

  function handleTouchMonster() {
    const now = Date.now()
    const nextCombo = now - lastTouchRef.current < 1600 ? Math.min(20, combo + 1) : 1
    lastTouchRef.current = now
    setCombo(nextCombo)
    const meta = playDessertAsmr(soundKind, nextCombo - 1)
    setAsmrBubble(meta.onomatopoeia)
    setBurstKey((k) => k + 1)
    setTimeout(() => setAsmrBubble(null), 1650)
  }

  return (
    <main className="screen fit">
      <TopBar nickname={nickname} onLogout={onLogout} />

      <div className="card fill">
        <div className="row wrap center" style={{ gap: 5 }}>
          {monster.is_shiny && (
            <span className="chip honey" style={{ fontSize: 11 }}>
              <SparkleIcon size={14} /> 빛나는 디저트
            </span>
          )}
          <span className="chip honey" style={{ fontSize: 11, fontWeight: 800 }}>
            🪙 {coins} 코인
          </span>
          <button
            className="chip"
            onClick={handleTouchMonster}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11, background: '#FFF2EC', color: '#D85A3A' }}
          >
            🎧 식감 ASMR 듣기
          </button>
          {onResetTestEgg && (
            <button
              className="chip"
              onClick={onResetTestEgg}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 11, background: '#EBF8FF', color: '#1976D2' }}
              title="테스트용 새 1분 디저트 알을 다시 받습니다"
            >
              🥚 1분 알 다시뽑기
            </button>
          )}
        </div>

        {/* 4대 디저트 컨디션 미니 바 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, width: '100%' }}>
          <div style={{ padding: '4px 6px', borderRadius: 10, background: '#FFF8F2', border: '1px solid #F0DFB8', textAlign: 'center', fontSize: 10, fontWeight: 800 }}>
            🍓 당충전 {hunger}
          </div>
          <div style={{ padding: '4px 6px', borderRadius: 10, background: '#FFF8F2', border: '1px solid #F0DFB8', textAlign: 'center', fontSize: 10, fontWeight: 800 }}>
            💖 달콤함 {mood}
          </div>
          <div
            style={{
              padding: '4px 6px',
              borderRadius: 10,
              background: fatigue >= 80 ? '#FFF0EE' : '#FFF8F2',
              border: fatigue >= 80 ? '1px solid #D9534F' : '1px solid #F0DFB8',
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 800,
              color: fatigue >= 80 ? '#D9534F' : '#3B2F2F',
            }}
          >
            💤 노곤함 {fatigue}
          </div>
          <div style={{ padding: '4px 6px', borderRadius: 10, background: '#FFF8F2', border: '1px solid #F0DFB8', textAlign: 'center', fontSize: 10, fontWeight: 800 }}>
            ✨ 윤기 {cleanliness}
          </div>
        </div>

        <div
          className="stage fill no-pad"
          onClick={handleTouchMonster}
          style={{ cursor: 'pointer', position: 'relative' }}
          title="터치하면 오감 식감 ASMR 소리·진동·파편이 터져요!"
        >
          <SensoryBurst kind={soundKind} triggerKey={burstKey} bubble={asmrBubble} combo={combo} />
          <div
            key={`home-react-${burstKey}`}
            className={`fit-fill ${burstKey > 0 ? getSensoryReactionClass(soundKind) : ''}`}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <MonsterView look={look} size={0} fluid title={info?.name} />
          </div>
          <Nest width={230} lift={36} front={false} dessertBase={look.mallang?.dessertBase} />
        </div>
        <h1 className="title-xl" style={{ fontSize: 22 }}>{monster.name}</h1>
        <div className="row wrap center" style={{ gap: 6 }}>
          <span className="chip">종족 {info?.name ?? monster.species}</span>
          {info?.textureLabel && <span className="chip honey" style={{ fontSize: 11 }}>{info.textureLabel}</span>}
          <span className="chip" style={{ paddingLeft: 6 }}>
            <ElementIcon element={monster.element} size={18} />
            {ELEMENT_INFO[monster.element].label} 속성
          </span>
          <span className="chip coral">Lv.{monster.level}</span>
        </div>
      </div>

      <div className="card tight">
        <div className="row between">
          <h2 className="title" style={{ fontSize: 16 }}>
            능력치 <span className="chip" style={{ fontSize: 11, marginLeft: 4 }}>총점 {totalStats(monster.stats)}</span>
          </h2>
          <button className="btn-link" onClick={onDetail} style={{ padding: 2, fontWeight: 800 }}>
            🍰 플레이팅·변신 공방 <ChevronIcon size={16} />
          </button>
        </div>
        <StatBars stats={monster.stats} compact />
      </div>

      <div className="grid-2" style={{ gap: 6 }}>
        <button className="btn" onClick={onOpenCare} style={{ padding: '10px 8px', fontSize: 13 }}>
          <span>🍓 토핑·돌보기</span>
        </button>
        <button className="btn mint" onClick={onOpenTrain} style={{ padding: '10px 8px', fontSize: 13 }}>
          <span>🧁 파티세리 훈련</span>
        </button>
        <button
          className="btn"
          onClick={onOpenSkills}
          style={{ padding: '10px 8px', fontSize: 13, background: 'linear-gradient(180deg, #9C6ADE 0%, #7C4DFF 100%)', boxShadow: '0 4px 0 #5E35B1' }}
        >
          <span>🌈 식감 스킬트리</span>
        </button>
        <button
          className="btn"
          onClick={onOpenPlaza}
          style={{ padding: '10px 8px', fontSize: 13, background: 'linear-gradient(180deg, #FFB74D 0%, #F57C00 100%)', boxShadow: '0 4px 0 #E65100' }}
        >
          <span>🏆 광장 · ASMR 대전</span>
        </button>
      </div>
    </main>
  )
}
