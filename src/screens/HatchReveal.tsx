import { ELEMENT_INFO, MUTATION_LABEL, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow, type Rarity } from '../lib/api'
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
  if (!monster) {
    return (
      <main className="screen center">
        <div className="stage" style={{ alignItems: 'center' }}>
          <div className="halo" />
          <div className="egg-shake">
            <EggArt rarity={rarity} mood="ready" size={200} />
          </div>
        </div>
        <p className="title center-text">알이 깨어나는 중…</p>
      </main>
    )
  }

  const info = SPECIES_INFO[monster.species]
  return (
    <main className="screen center">
      <div className="stage" style={{ alignItems: 'center' }}>
        <div className="halo" />
        {CONFETTI.map(([left, color, delay], i) => (
          <span key={i} className="confetti" style={{ left, background: color, animationDelay: `${delay}s` }} />
        ))}
        <div className="pop-in" style={{ position: 'relative', zIndex: 0 }}>
          <MonsterView look={monsterLook(monster)} size={230} title={info?.name} />
        </div>
        <div style={{ marginTop: -50, position: 'relative', zIndex: 1 }}>
          <EggShellCup rarity={rarity} width={170} />
        </div>
      </div>

      <div className="stack center-text" style={{ gap: 8, alignItems: 'center' }}>
        <h1 className="title-xl">태어났어요!</h1>
        <p className="sub">따뜻한 보살핌 속에서 알을 깨고 나왔어요</p>
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
