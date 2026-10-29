import { useRef, useState } from 'react'
import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { ChevronIcon, ElementIcon, SparkleIcon } from '../ui/Icons'
import { StatBars, TopBar, totalStats } from '../ui/parts'
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
    <main className="screen" style={{ justifyContent: 'space-between' }}>
      {/* 1. 상단 바 & 코인·알 리셋 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <TopBar nickname={nickname} onLogout={onLogout} />
        <div className="row wrap between" style={{ gap: 4 }}>
          <div className="row" style={{ gap: 4 }}>
            {monster.is_shiny && (
              <span className="chip honey" style={{ fontSize: 12, padding: '2px 7px' }}>
                <SparkleIcon size={13} /> 빛나는
              </span>
            )}
            <span className="chip honey" style={{ fontSize: 12, fontWeight: 800, padding: '2px 7px' }}>
              🪙 {coins} 코인
            </span>
          </div>
          <div className="row" style={{ gap: 4 }}>
            <button
              className="chip"
              onClick={handleTouchMonster}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, background: '#FFF2EC', color: '#D85A3A', padding: '2px 8px' }}
            >
              🎧 식감 ASMR
            </button>
            {onResetTestEgg && (
              <button
                className="chip"
                onClick={onResetTestEgg}
                style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, background: '#EBF8FF', color: '#1976D2', padding: '2px 8px' }}
                title="테스트용 새 1분 디저트 알을 다시 받습니다"
              >
                🥚 1분 알
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. 4대 디저트 컨디션 게이지 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 5, flexShrink: 0 }}>
        <div style={{ padding: '5px 4px', borderRadius: 12, background: '#FFF8F2', border: '1px solid #F0DFB8', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', whiteSpace: 'nowrap' }}>🍓 당충전 {hunger}</div>
        </div>
        <div style={{ padding: '5px 4px', borderRadius: 12, background: '#FFF8F2', border: '1px solid #F0DFB8', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', whiteSpace: 'nowrap' }}>💖 달콤함 {mood}</div>
        </div>
        <div
          style={{
            padding: '5px 4px',
            borderRadius: 12,
            background: fatigue >= 80 ? '#FFF0EE' : '#FFF8F2',
            border: fatigue >= 80 ? '1.5px solid #D9534F' : '1px solid #F0DFB8',
            textAlign: 'center',
            color: fatigue >= 80 ? '#D9534F' : '#3B2F2F',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>💤 노곤함 {fatigue}</div>
        </div>
        <div style={{ padding: '5px 4px', borderRadius: 12, background: '#FFF8F2', border: '1px solid #F0DFB8', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', whiteSpace: 'nowrap' }}>✨ 윤기 {cleanliness}</div>
        </div>
      </div>

      {/* 3. 3D 디저트 캐릭터 전용 스테이지 카드 (글박스 충돌 완전 해소) */}
      <div
        className="card"
        style={{
          flex: 1,
          minHeight: 0,
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            minHeight: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={handleTouchMonster}
          title="터치하면 오감 식감 ASMR 소리·진동·파편이 터져요!"
        >
          <SensoryBurst kind={soundKind} triggerKey={burstKey} bubble={asmrBubble} combo={combo} />
          <div
            key={`home-react-${burstKey}`}
            className={burstKey > 0 ? getSensoryReactionClass(soundKind) : ''}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <MonsterView look={look} size={170} title={info?.name} />
          </div>
        </div>

        {/* 캐릭터 이름 및 종족·속성·레벨 뱃지 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
          <h1 className="title-xl" style={{ fontSize: 20, margin: 0, lineHeight: 1.1 }}>{monster.name}</h1>
          <div className="row wrap center" style={{ gap: 4 }}>
            <span className="chip" style={{ fontSize: 12, padding: '2px 7px' }}>{info?.name ?? monster.species}</span>
            {info?.textureLabel && <span className="chip honey" style={{ fontSize: 12, padding: '2px 7px' }}>{info.textureLabel}</span>}
            <span className="chip" style={{ fontSize: 12, padding: '2px 7px' }}>
              <ElementIcon element={monster.element} size={14} />
              {ELEMENT_INFO[monster.element].label}
            </span>
            <span className="chip coral" style={{ fontSize: 12, padding: '2px 7px' }}>Lv.{monster.level}</span>
          </div>
        </div>
      </div>

      {/* 4. 능력치 요약 카드 */}
      <div className="card tight" style={{ flexShrink: 0, padding: '8px 12px', gap: 4 }}>
        <div className="row between">
          <h2 className="title" style={{ fontSize: 14 }}>
            능력치 <span className="chip" style={{ fontSize: 12, marginLeft: 4, padding: '1px 6px' }}>총점 {totalStats(monster.stats)}</span>
          </h2>
          <button className="btn-link" onClick={onDetail} style={{ padding: 2, fontWeight: 800, fontSize: 12 }}>
            🍰 플레이팅·변신 공방 <ChevronIcon size={14} />
          </button>
        </div>
        <StatBars stats={monster.stats} compact />
      </div>

      {/* 5. 하단 4대 네비게이션 버튼 (2×2 그리드) */}
      <div className="grid-2" style={{ gap: 6, flexShrink: 0 }}>
        <button className="btn" onClick={onOpenCare} style={{ padding: '10px 8px', fontSize: 13, minHeight: 46 }}>
          <span>🍓 토핑·돌보기</span>
        </button>
        <button className="btn mint" onClick={onOpenTrain} style={{ padding: '10px 8px', fontSize: 13, minHeight: 46 }}>
          <span>🧁 파티세리 훈련</span>
        </button>
        <button
          className="btn"
          onClick={onOpenSkills}
          style={{ padding: '10px 8px', fontSize: 13, minHeight: 46, background: 'linear-gradient(180deg, #9C6ADE 0%, #7C4DFF 100%)', boxShadow: '0 4px 0 #5E35B1' }}
        >
          <span>🌈 식감 스킬트리</span>
        </button>
        <button
          className="btn"
          onClick={onOpenPlaza}
          style={{ padding: '10px 8px', fontSize: 13, minHeight: 46, background: 'linear-gradient(180deg, #FFB74D 0%, #F57C00 100%)', boxShadow: '0 4px 0 #E65100' }}
        >
          <span>🏆 광장 · ASMR 대전</span>
        </button>
      </div>
    </main>
  )
}
