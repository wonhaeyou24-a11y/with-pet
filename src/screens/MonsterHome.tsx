import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import MonsterView from '../monsters/MonsterView'
import { ChevronIcon, ElementIcon, SparkleIcon } from '../ui/Icons'
import { LockedCard, Nest, StatBars, TopBar, totalStats } from '../ui/parts'

type Props = { nickname: string; monster: MonsterRow; onDetail: () => void; onLogout?: () => void }

export default function MonsterHome({ nickname, monster, onDetail, onLogout }: Props) {
  const info = SPECIES_INFO[monster.species]
  return (
    <main className="screen fit">
      <TopBar nickname={nickname} onLogout={onLogout} />

      <div className="card fill">
        {monster.is_shiny && (
          <span className="chip honey">
            <SparkleIcon size={16} /> 빛나는 몬스터
          </span>
        )}
        <div className="stage fill no-pad">
          <div className="fit-fill" style={{ position: 'relative', zIndex: 1 }}>
            <MonsterView look={monsterLook(monster)} size={0} fluid title={info?.name} />
          </div>
          <Nest width={230} lift={36} front={false} />
        </div>
        <h1 className="title-xl" style={{ fontSize: 26 }}>{monster.name}</h1>
        <div className="row wrap center">
          <span className="chip">종족 {info?.name ?? monster.species}</span>
          <span className="chip" style={{ paddingLeft: 6 }}>
            <ElementIcon element={monster.element} size={20} />
            {ELEMENT_INFO[monster.element].label} 속성
          </span>
          <span className="chip coral">Lv.{monster.level}</span>
        </div>
      </div>

      <div className="card tight">
        <div className="row between">
          <h2 className="title" style={{ fontSize: 17 }}>
            능력치 <span className="chip" style={{ fontSize: 12, marginLeft: 4 }}>총점 {totalStats(monster.stats)}</span>
          </h2>
          <button className="btn-link" onClick={onDetail} style={{ padding: 2 }}>
            자세히 보기 <ChevronIcon size={16} />
          </button>
        </div>
        <StatBars stats={monster.stats} compact />
      </div>

      <div className="grid-2">
        <LockedCard compact icon={<span style={{ fontSize: 22 }}>🥣</span>} title="먹이 주기" />
        <LockedCard compact icon={<span style={{ fontSize: 22 }}>🎯</span>} title="훈련 하기" />
      </div>
    </main>
  )
}
