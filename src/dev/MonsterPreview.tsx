// 개발용 확인 페이지 (주소 끝에 #/dev/monsters). 운영 빌드에는 들어가지 않는다.
import { useState, type ReactNode } from 'react'
import refBeongaekkori from '../../design/characters/species-번개꼬리.png'
import refByeolbineul from '../../design/characters/species-별비늘.png'
import refGangcheoldeung from '../../design/characters/species-강철등.png'
import refHeugyeom from '../../design/characters/species-흑염.png'
import refKongkong from '../../design/characters/species-콩콩.png'
import refMongsil from '../../design/characters/species-몽실.png'
import { MALLANG_PRESETS } from '../monsters/MallangChameleon'
import MonsterView from '../monsters/MonsterView'
import { SPECIES } from '../monsters/registry'
import type { BodyType, Expression, MonsterLook } from '../monsters/types'

const REFS: Record<string, string> = {
  'dubai-cookie': refKongkong,
  tanghulu: refByeolbineul,
  smore: refMongsil,
  mochi: refMongsil,
  pudding: refKongkong,
  jelly: refByeolbineul,
  choco: refHeugyeom,
  chameleon: refMongsil,
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{children}</div>
    </section>
  )
}

function Cell({ look, label }: { look: MonsterLook; label: string }) {
  return (
    <figure style={{ margin: 0, textAlign: 'center', fontSize: 12, color: '#7A6A60', background: '#fff', padding: 8, borderRadius: 18, border: '1.5px solid #F0DFB8' }}>
      <MonsterView look={look} size={128} />
      <figcaption style={{ fontWeight: 700, marginTop: 4 }}>{label}</figcaption>
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
    <div style={{ width: '100%', maxWidth: 980, padding: 20, boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0 }}>🦎 말랑 카멜레온(메챠 카멜레온 방식) & 7대 체형·바디페인팅·장신구 확인 페이지</h2>

      <Row title="🦎 메챠 카멜레온 방식: 바디 페인팅 & 스탬프 & 만능 파츠 변신 예시">
        <Cell look={baseLook('chameleon')} label="원조 말랑 카멜레온 (기본)" />
        {MALLANG_PRESETS.map((pr) => (
          <Cell
            key={pr.id}
            look={{ ...baseLook('chameleon'), mallang: pr.custom }}
            label={pr.name}
          />
        ))}
        <Cell
          look={{
            ...baseLook('chameleon'),
            mallang: {
              morphForm: 'chameleon',
              skinPalette: 4,
              wingKind: 'flame-mane',
              stamps: [
                { kind: 'star', x: 120, y: 184, color: '#FBC02D', scale: 1.3 },
                { kind: 'flame', x: 90, y: 170, color: '#FF7043', scale: 0.9 },
                { kind: 'flame', x: 150, y: 170, color: '#FF7043', scale: 0.9 },
              ],
            },
            decorations: { head: 'wizard-hat', hand: 'lantern-staff', effect: 'constellation-aura' },
          }}
          label="🔥 불꽃갈기 마법사 말랑이"
        />
      </Row>

      <Row title="🌟 7대 변신 체형·고유 실루엣 한눈에 비교 (자세 0 ~ 자세 F)">
        {ids.map((id) => (
          <Cell key={id} look={baseLook(id)} label={`${SPECIES[id].name} (${SPECIES[id].postureLabel})`} />
        ))}
      </Row>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {ids.map((id) => (
          <button key={id} onClick={() => choose(id)} style={{ opacity: id === species ? 1 : 0.5 }}>
            {SPECIES[id].name}
          </button>
        ))}
      </div>

      <Row title={`${def.name} — 시안(왼쪽) · 기본 SVG(가운데) · 별마법사 풀세트 장착(오른쪽)`}>
        <img src={REFS[species]} width={240} height={240} alt={`${def.name} 시안`} style={{ borderRadius: 16 }} />
        <MonsterView look={BASE} size={240} />
        <MonsterView
          look={{
            ...BASE,
            decorations: {
              head: 'wizard-hat',
              face: 'alchemy-glasses',
              neck: 'rune-scarf',
              back: 'meteor-wings',
              hand: 'lantern-staff',
              bg: 'night-observatory',
              effect: 'constellation-aura',
              dye: 0,
            },
            medals: { enabled: true, towerStar: true, goldMane: true },
          }}
          size={240}
        />
      </Row>

      <Row title="특수 변이 3종 (수정 0.2% / 그림자 0.2% / 황금 0.2%) & 육성 훈장">
        <Cell look={{ ...BASE, shiny: true }} label="✨ 빛나는 몬스터 (1%)" />
        <Cell look={{ ...BASE, mutation: 'crystal' }} label="💎 수정 변이" />
        <Cell look={{ ...BASE, mutation: 'shadow' }} label="🌑 그림자 변이" />
        <Cell look={{ ...BASE, mutation: 'gold' }} label="👑 황금 변이" />
        <Cell look={{ ...BASE, medals: { enabled: true, towerStar: true, goldMane: true, bossScar: true, championCrown: true } }} label="🏆 훈장 4종 전체" />
      </Row>

      <Row title="장식 7칸 조합 & 별조각 염색 프리셋">
        <Cell
          look={{
            ...BASE,
            decorations: { head: 'wizard-hat', face: 'alchemy-glasses', neck: 'rune-scarf', hand: 'lantern-staff', effect: 'constellation-aura', dye: 0 },
          }}
          label="별마법사 세트 (기본)"
        />
        <Cell
          look={{
            ...BASE,
            decorations: { head: 'wizard-hat', face: 'alchemy-glasses', neck: 'rune-scarf', hand: 'lantern-staff', effect: 'constellation-aura', dye: 1 },
          }}
          label="별마법사 (로즈베리 염색)"
        />
        <Cell
          look={{
            ...BASE,
            decorations: { head: 'berry-beret', face: 'star-patch', neck: 'bell-ribbon', back: 'explorer-pack', bg: 'sunny-meadow', effect: 'blossom-breeze', dye: 1 },
          }}
          label="봄소풍 딸기베레모 세트"
        />
        <Cell
          look={{
            ...BASE,
            decorations: { head: 'star-crown', face: 'sleep-mask', back: 'meteor-wings', hand: 'star-wand', bg: 'night-observatory', dye: 4 },
          }}
          label="꿈나라 왕관 요술봉 세트"
        />
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

      <Row title="무작위로 12마리 뽑기">
        {rolled.map((look, i) => (
          <Cell key={i} look={look} label={`#${i + 1}`} />
        ))}
      </Row>
      <button onClick={() => setRolled(Array.from({ length: 12 }, () => randomLook(species)))}>다시 뽑기</button>
    </div>
  )
}
