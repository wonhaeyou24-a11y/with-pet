import { useState } from 'react'
import { ELEMENT_INFO, MUTATION_LABEL, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow, type Rarity } from '../lib/api'
import { getSpeciesSoundKind, playDessertAsmr } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { EggArt, EggShellCup } from '../ui/EggArt'
import { ElementIcon, SparkleIcon } from '../ui/Icons'

const CONFETTI = [
  ['10%', '#ffb347', 0],
  ['22%', '#ff8a65', 0.15],
  ['34%', '#76c7a2', 0.05],
  ['46%', '#4fa3e0', 0.25],
  ['58%', '#b07cf0', 0.1],
  ['70%', '#faD36e', 0.3],
  ['82%', '#ff8fa8', 0.2],
  ['90%', '#76c7a2', 0.12],
] as const

export default function HatchReveal({ rarity, monster, onNext }: { rarity: Rarity; monster: MonsterRow | null; onNext: () => void }) {
  const [asmrBubble, setAsmrBubble] = useState<string | null>(null)

  if (!monster) {
    return (
      <main className="screen center">
        <div className="stage" style={{ alignItems: 'center' }}>
          <div className="halo" />
          <div className="egg-shake">
            <EggArt rarity={rarity} mood="ready" size={200} />
          </div>
        </div>
        <p className="title center-text">빠작…! 달콤한 알이 깨어나는 중…</p>
      </main>
    )
  }

  const info = SPECIES_INFO[monster.species]
  const look = monsterLook(monster)

  function handlePlayHatchAsmr() {
    if (!monster) return
    const meta = playDessertAsmr(getSpeciesSoundKind(monster.species, look.mallang?.dessertBase))
    setAsmrBubble(meta.onomatopoeia)
    setTimeout(() => setAsmrBubble(null), 1800)
  }

  return (
    <main className="screen center">
      <div className="stage" style={{ alignItems: 'center', position: 'relative', cursor: 'pointer' }} onClick={handlePlayHatchAsmr}>
        <div className="halo" />
        {CONFETTI.map(([left, color, delay], i) => (
          <span key={i} className="confetti" style={{ left, background: color, animationDelay: `${delay}s` }} />
        ))}
        {asmrBubble && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              zIndex: 10,
              padding: '6px 14px',
              borderRadius: 999,
              background: '#3B2F2F',
              color: '#FFFDF9',
              fontSize: 13,
              fontWeight: 800,
              boxShadow: '0 6px 16px rgba(59,47,47,0.22)',
              pointerEvents: 'none',
            }}
          >
            🔊 {asmrBubble}
          </div>
        )}
        <div className="pop-in" style={{ position: 'relative', zIndex: 0 }}>
          <MonsterView look={look} size={230} title={info?.name} />
        </div>
        <div style={{ marginTop: -50, position: 'relative', zIndex: 1 }}>
          <EggShellCup rarity={rarity} width={170} />
        </div>
      </div>

      <div className="stack center-text" style={{ gap: 8, alignItems: 'center' }}>
        <h1 className="title-xl">태어났어요!</h1>
        <p className="sub">따뜻한 보살핌 속에서 달콤한 디저트 친구가 깨어났어요</p>
        <div className="chip" style={{ fontSize: 17, padding: '8px 16px', gap: 10 }}>
          {info?.name ?? monster.species}
          <span style={{ color: 'var(--border)' }}>|</span>
          <ElementIcon element={monster.element} size={22} />
          {ELEMENT_INFO[monster.element].label}
          {monster.element2 && (
            <>
              <ElementIcon element={monster.element2} size={22} />
              {ELEMENT_INFO[monster.element2].label}
            </>
          )}
        </div>
        {info?.textureLabel && (
          <button
            className="chip coral"
            onClick={handlePlayHatchAsmr}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800 }}
          >
            🎧 {info.textureLabel} (터치해 소리 듣기)
          </button>
        )}
        {monster.is_shiny && (
          <span className="chip honey">
            <SparkleIcon size={16} /> 빛나는 몬스터!
          </span>
        )}
        {monster.mutation && (
          <span className="chip honey">
            <SparkleIcon size={16} /> 특수 변이: {MUTATION_LABEL[monster.mutation] ?? monster.mutation}
          </span>
        )}
      </div>

      <button className="btn block big" onClick={onNext}>
        이름 지어 주기
      </button>
    </main>
  )
}
