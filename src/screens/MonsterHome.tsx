import { ELEMENT_INFO, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import MonsterView from '../monsters/MonsterView'
import { ChevronIcon, ElementIcon, LockIcon, SparkleIcon } from '../ui/Icons'
import { LockedCard, Nest, StatBars, TopBar, totalStats } from '../ui/parts'

type Props = { nickname: string; monster: MonsterRow; onDetail: () => void; onLogout?: () => void }

export default function MonsterHome({ nickname, monster, onDetail, onLogout }: Props) {
  const info = SPECIES_INFO[monster.species]
  return (
    <main className="screen">
      <TopBar nickname={nickname} onLogout={onLogout} />

      <div className="card center-text" style={{ alignItems: 'center', paddingBottom: 22 }}>
        {monster.is_shiny && (
          <span className="chip honey">
            <SparkleIcon size={16} /> 빛나는 몬스터
          </span>
        )}
        <div className="stage" style={{ alignItems: 'center' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <MonsterView look={monsterLook(monster)} size={210} title={info?.name} />
          </div>
          <Nest width={230} lift={44} front={false} />
        </div>
        <h1 className="title-xl" style={{ marginTop: 6 }}>{monster.name}</h1>
        <div className="row wrap center">
          <span className="chip">종족 {info?.name ?? monster.species}</span>
          <span className="chip" style={{ paddingLeft: 6 }}>
            <ElementIcon element={monster.element} size={20} />
            {ELEMENT_INFO[monster.element].label} 속성
          </span>
          <span className="chip coral">Lv.{monster.level}</span>
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <h2 className="title" style={{ fontSize: 19 }}>
            능력치 <span className="chip" style={{ fontSize: 12, marginLeft: 6 }}>총점 {totalStats(monster.stats)}</span>
          </h2>
          <button className="btn-link" onClick={onDetail}>
            자세히 보기 <ChevronIcon size={16} />
          </button>
        </div>
        <StatBars stats={monster.stats} />
      </div>

      <p className="small row" style={{ gap: 6 }}>
        <LockIcon size={14} /> 돌봄 활동
      </p>
      <div className="grid-2">
        <LockedCard icon={<span style={{ fontSize: 28 }}>🥣</span>} title="먹이 주기" desc="따뜻한 열매 이유식" />
        <LockedCard icon={<span style={{ fontSize: 28 }}>🎯</span>} title="훈련 하기" desc="바람 일으키기 놀이" />
      </div>
    </main>
  )
}
