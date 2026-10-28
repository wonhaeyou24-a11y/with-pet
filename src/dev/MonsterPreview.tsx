// 개발용 확인 페이지 (주소 끝에 #/dev/monsters). 운영 빌드에는 들어가지 않는다.
import { useState, type ReactNode } from 'react'
import refBeongaekkori from '../../design/characters/species-번개꼬리.png'
import refByeolbineul from '../../design/characters/species-별비늘.png'
import refGangcheoldeung from '../../design/characters/species-강철등.png'
import refHeugyeom from '../../design/characters/species-흑염.png'
import refKongkong from '../../design/characters/species-콩콩.png'
import refMongsil from '../../design/characters/species-몽실.png'
import MonsterView from '../monsters/MonsterView'
import { SPECIES } from '../monsters/registry'
import type { BodyType, Expression, MonsterLook } from '../monsters/types'

const REFS: Record<string, string> = {
  mongsil: refMongsil,
  kongkong: refKongkong,
  beongaekkori: refBeongaekkori,
  gangcheoldeung: refGangcheoldeung,
  heugyeom: refHeugyeom,
  byeolbineul: refByeolbineul,
}

const BODY_TYPES: BodyType[] = ['chubby', 'normal', 'slim']
const EXPRESSIONS: Expression[] = ['round', 'sleepy', 'sharp']

function baseLook(species: string): MonsterLook {
  return {
    species,
    palette: 0,
    bodyType: 'normal',
    scale: 1,
    ears: 0,
    tail: 0,
    top: 0,
    expression: 'round',
    patternSeed: 7,
    shiny: false,
  }
}

function randomLook(species: string): MonsterLook {
  const def = SPECIES[species]
  const pick = (n: number) => Math.floor(Math.random() * n)
  return {
    species,
    palette: pick(def.paletteCount),
    bodyType: BODY_TYPES[pick(3)],
    scale: 0.9 + Math.random() * 0.2,
    ears: pick(def.partCounts.ears),
    tail: pick(def.partCounts.tail),
    top: pick(def.partCounts.top),
    expression: EXPRESSIONS[pick(3)],
    patternSeed: pick(1_000_000),
    shiny: Math.random() < 0.1,
  }
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </section>
  )
}

function Cell({ look, label }: { look: MonsterLook; label: string }) {
  return (
    <figure style={{ margin: 0, textAlign: 'center', fontSize: 12, color: '#7A6A60' }}>
      <MonsterView look={look} size={120} />
      <figcaption>{label}</figcaption>
    </figure>
  )
}

export default function MonsterPreview() {
  const ids = Object.keys(SPECIES)
  const [species, setSpecies] = useState(() => {
    const hash = location.hash.split('/')[3]
    return hash && SPECIES[hash] ? hash : ids[0]
  })
  const [rolled, setRolled] = useState(() => Array.from({ length: 12 }, () => randomLook(species)))
  const def = SPECIES[species]
  const BASE = baseLook(species)
  const range = (n: number) => Array.from({ length: n }, (_, i) => i)

  function choose(id: string) {
    setSpecies(id)
    setRolled(Array.from({ length: 12 }, () => randomLook(id)))
  }

  return (
    <div style={{ width: '100%', maxWidth: 960, padding: 20, boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0 }}>{def.name} 확인 페이지 (개발용)</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {ids.map((id) => (
          <button key={id} onClick={() => choose(id)} style={{ opacity: id === species ? 1 : 0.5 }}>
            {SPECIES[id].name}
          </button>
        ))}
      </div>

      <Row title="시안(왼쪽)과 직접 그린 SVG(오른쪽)">
        <img src={REFS[species]} width={260} height={260} alt={`${def.name} 시안`} style={{ borderRadius: 16 }} />
        <MonsterView look={BASE} size={260} />
      </Row>

      <Row title="팔레트 6개">
        {range(def.paletteCount).map((i) => (
          <Cell key={i} look={{ ...BASE, palette: i }} label={`팔레트 ${i + 1}`} />
        ))}
      </Row>
      <Row title="체형 3종 / 크기 ±10%">
        {BODY_TYPES.map((b) => (
          <Cell key={b} look={{ ...BASE, bodyType: b }} label={b} />
        ))}
        <Cell look={{ ...BASE, scale: 0.9 }} label="크기 90%" />
        <Cell look={{ ...BASE, scale: 1.1 }} label="크기 110%" />
      </Row>
      <Row title="귀·뿔 4종">
        {range(def.partCounts.ears).map((i) => (
          <Cell key={i} look={{ ...BASE, ears: i }} label={`귀 ${i + 1}`} />
        ))}
      </Row>
      <Row title="꼬리 4종">
        {range(def.partCounts.tail).map((i) => (
          <Cell key={i} look={{ ...BASE, tail: i }} label={`꼬리 ${i + 1}`} />
        ))}
      </Row>
      <Row title="머리 장식 4종">
        {range(def.partCounts.top).map((i) => (
          <Cell key={i} look={{ ...BASE, top: i }} label={`장식 ${i + 1}`} />
        ))}
      </Row>
      <Row title="눈매 3종 (활발 / 차분 / 독립)">
        {EXPRESSIONS.map((e) => (
          <Cell key={e} look={{ ...BASE, expression: e }} label={e} />
        ))}
      </Row>
      <Row title="고유 무늬 (시드 1~8)">
        {range(8).map((i) => (
          <Cell key={i} look={{ ...BASE, patternSeed: i + 1, palette: i % def.paletteCount }} label={`시드 ${i + 1}`} />
        ))}
      </Row>
      <Row title="빛나는 몬스터">
        <Cell look={{ ...BASE, shiny: true }} label="빛나는 몬스터" />
      </Row>

      <Row title="무작위로 12마리 뽑기">
        {rolled.map((look, i) => (
          <Cell key={i} look={look} label={`#${i + 1}`} />
        ))}
      </Row>
      <button onClick={() => setRolled(Array.from({ length: 12 }, () => randomLook(species)))}>다시 뽑기</button>
    </div>
  )
}
