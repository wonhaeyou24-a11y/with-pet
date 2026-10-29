import { ELEMENT_INFO, MUTATION_LABEL, personalityLabel, SPECIES_INFO } from '../config/species'
import { monsterLook, serverNow, type MonsterRow } from '../lib/api'
import MonsterView from '../monsters/MonsterView'
import { BackIcon, ElementChip, SparkleIcon } from '../ui/Icons'
import { Nest, StatBars, totalStats } from '../ui/parts'

function daysTogether(hatchedAt: string) {
  return Math.max(1, Math.floor((serverNow() - Date.parse(hatchedAt)) / 86_400_000) + 1)
}

export default function MonsterDetail({ monster, onBack }: { monster: MonsterRow; onBack: () => void }) {
  const info = SPECIES_INFO[monster.species]
  return (
    <main className="screen">
      <div className="row between">
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title">{monster.name}</h1>
        <span style={{ width: 44 }} />
      </div>

      <div className="card center-text" style={{ alignItems: 'center', paddingBottom: 22 }}>
        <div className="row wrap center">
          {monster.is_shiny && (
            <span className="chip honey">
              <SparkleIcon size={16} /> 빛나는 몬스터
            </span>
          )}
          {monster.mutation && (
            <span className="chip honey">
              <SparkleIcon size={16} /> 특수 변이: {MUTATION_LABEL[monster.mutation] ?? monster.mutation}
            </span>
          )}
        </div>
        <div className="stage" style={{ alignItems: 'center' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <MonsterView look={monsterLook(monster)} size={190} title={info?.name} />
          </div>
          <Nest width={220} lift={40} front={false} />
        </div>
        <div className="row center" style={{ marginTop: 6 }}>
          <h2 className="title-xl">{monster.name}</h2>
          <span className="chip coral">Lv.{monster.level}</span>
        </div>
        <p className="sub">{info?.desc}</p>
      </div>

      <div className="card">
        <h2 className="title" style={{ fontSize: 19 }}>프로필 정보</h2>
        <div>
          <div className="info-row">
            <span>종족</span>
            <span>{info?.name ?? monster.species}</span>
          </div>
          <div className="info-row">
            <span>속성</span>
            <span className="row">
              <ElementChip element={monster.element} />
              {monster.element2 && <ElementChip element={monster.element2} />}
            </span>
          </div>
          <div className="info-row">
            <span>특성</span>
            <span>{monster.trait}</span>
          </div>
          <div className="info-row">
            <span>성격</span>
            <span className="chip coral">{personalityLabel(monster.personality_active, monster.personality_bond)}</span>
          </div>
          <div className="info-row">
            <span>함께한 날</span>
            <span>{daysTogether(monster.hatched_at)}일째</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <h2 className="title" style={{ fontSize: 19 }}>능력치</h2>
          <span className="chip">총점 {totalStats(monster.stats)}</span>
        </div>
        <StatBars stats={monster.stats} />
      </div>
      <p className="small center-text">{ELEMENT_INFO[monster.element].label} 속성 몬스터는 같은 속성 지역에서 유리해요 (곧 만나요)</p>
    </main>
  )
}
