import { useRef, useState } from 'react'
import { defaultDessertBase, ELEMENT_INFO, MUTATION_LABEL, personalityLabel, SPECIES_INFO } from '../config/species'
import { monsterLook, serverNow, type MonsterRow } from '../lib/api'
import {
  DESSERT_SOUND_CATALOG,
  getSpeciesSoundKind,
  isAsmrMuted,
  playDessertAsmr,
  setAsmrMuted,
  type DessertSoundKind,
} from '../lib/sound'
import { DECO_ITEMS, DYE_THEMES, type DecoSlot } from '../monsters/Decorations'
import {
  CHAMELEON_PALETTES,
  CLAY_PAINTS,
  DESSERT_BASES,
  loadMallangCustom,
  MALLANG_PRESETS,
  MORPH_FORMS,
  saveMallangCustom,
  STAMP_CATALOG,
  SYRUP_CATALOG,
  WING_CATALOG,
  type DessertBaseId,
  type MorphFormId,
  type PaintStamp,
  type PaintStroke,
  type StampKind,
  type SyrupId,
  type WingKind,
} from '../monsters/MallangChameleon'
import MonsterView from '../monsters/MonsterView'
import { SPECIES } from '../monsters/registry'
import type { MonsterDecorations, MonsterMedals } from '../monsters/types'
import { BackIcon, ElementChip, SparkleIcon } from '../ui/Icons'
import { Nest, StatBars, totalStats } from '../ui/parts'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'

const SLOT_LABELS: { slot: DecoSlot; label: string; defaultIcon: string }[] = [
  { slot: 'head', label: '머리', defaultIcon: '🎩' },
  { slot: 'face', label: '얼굴', defaultIcon: '👓' },
  { slot: 'neck', label: '목', defaultIcon: '🧣' },
  { slot: 'back', label: '등', defaultIcon: '🪽' },
  { slot: 'hand', label: '손', defaultIcon: '🏮' },
  { slot: 'bg', label: '배경', defaultIcon: '🌌' },
  { slot: 'effect', label: '이펙트', defaultIcon: '✨' },
]

type StudioTab = 'dessert' | 'paint' | 'morph' | 'parts'

function daysTogether(hatchedAt: string) {
  return Math.max(1, Math.floor((serverNow() - Date.parse(hatchedAt)) / 86_400_000) + 1)
}

export default function MonsterDetail({ monster, onBack }: { monster: MonsterRow; onBack: () => void }) {
  const savedCustom = loadMallangCustom(monster.id)

  // 스튜디오 상단 탭 (Stitch 12·13번 통합: 1. 디저트 플레이팅 / 2. 바디 페인팅 / 3. 체형 몰딩 8종 / 4. 파츠 & 장신구)
  const [studioTab, setStudioTab] = useState<StudioTab>('dessert')

  // 말랑 카멜레온·모찌 체형 몰딩 & 만능 파츠 & 디저트 플레이팅 상태
  const [morphForm, setMorphForm] = useState<MorphFormId>(
    savedCustom?.morphForm ?? (monster.species as MorphFormId) ?? 'mochi',
  )
  const [skinPalette, setSkinPalette] = useState<number>(savedCustom?.skinPalette ?? monster.parts.palette ?? 0)
  const [wingKind, setWingKind] = useState<WingKind>(savedCustom?.wingKind ?? 'none')
  const [dessertBase, setDessertBase] = useState<DessertBaseId>(
    savedCustom?.dessertBase ?? defaultDessertBase(savedCustom?.morphForm ?? monster.species),
  )
  const [syrups, setSyrups] = useState<SyrupId[]>(savedCustom?.syrups ?? ['choco-drizzle', 'rainbow-sprinkles'])
  const [showcaseBoxMode, setShowcaseBoxMode] = useState<boolean>(false)
  const [biteVotes, setBiteVotes] = useState<number>(42)

  // 바디 페인팅 & 스탬프 상태
  const [toolMode, setToolMode] = useState<'brush' | 'stamp'>('brush')
  const [paintColor, setPaintColor] = useState<string>(CLAY_PAINTS[0].color)
  const [brushSize, setBrushSize] = useState<number>(12)
  const [selectedStamp, setSelectedStamp] = useState<StampKind>('star')
  const [strokes, setStrokes] = useState<PaintStroke[]>(savedCustom?.strokes ?? [])
  const [stamps, setStamps] = useState<PaintStamp[]>(savedCustom?.stamps ?? [])
  const isDrawingRef = useRef(false)

  // 장식 7칸 & 육성 훈장 상태
  const [activeSlot, setActiveSlot] = useState<DecoSlot>('head')
  const [deco, setDeco] = useState<MonsterDecorations>(
    savedCustom?.decorations ?? {
      head: null,
      face: null,
      neck: null,
      back: null,
      hand: null,
      bg: null,
      effect: null,
      dye: 0,
    },
  )
  const [medals, setMedals] = useState<MonsterMedals>(
    savedCustom?.medals ?? {
      enabled: true,
      towerStar: false,
      goldMane: false,
      bossScar: false,
      championCrown: false,
    },
  )
  const [saveToast, setSaveToast] = useState<string | null>(null)
  const [asmrBubble, setAsmrBubble] = useState<string | null>(null)
  const [activeSoundKind, setActiveSoundKind] = useState<DessertSoundKind>(() =>
    getSpeciesSoundKind(savedCustom?.morphForm ?? monster.species, savedCustom?.dessertBase),
  )
  const [burstKey, setBurstKey] = useState<number>(0)
  const [combo, setCombo] = useState<number>(1)
  const lastTouchRef = useRef<number>(0)
  const [muted, setMuted] = useState<boolean>(() => isAsmrMuted())

  // 디저트 ASMR 힐링 사운드 재생 + 시각 파편 버스트 + 탄성 반응 + 손맛 콤보
  function triggerAsmr(kind: DessertSoundKind) {
    const now = Date.now()
    const nextCombo = now - lastTouchRef.current < 1600 ? Math.min(20, combo + 1) : 1
    lastTouchRef.current = now
    setCombo(nextCombo)
    setActiveSoundKind(kind)
    const meta = playDessertAsmr(kind, nextCombo - 1)
    setAsmrBubble(meta.onomatopoeia)
    setBurstKey((k) => k + 1)
    setTimeout(() => setAsmrBubble(null), 1650)
  }

  function handleToggleMute() {
    const next = !muted
    setMuted(next)
    setAsmrMuted(next)
  }

  const activeSpeciesId = morphForm || monster.species
  const info = SPECIES_INFO[activeSpeciesId] ?? SPECIES_INFO[monster.species]
  const speciesDef = SPECIES[activeSpeciesId] ?? SPECIES[monster.species]

  const baseLook = monsterLook(monster)
  const look = {
    ...baseLook,
    decorations: deco,
    medals,
    mallang: {
      morphForm,
      skinPalette,
      wingKind,
      strokes,
      stamps,
      dessertBase,
      syrups,
      decorations: deco,
      medals,
    },
  }

  const equippedCharm = DECO_ITEMS.reduce((sum, item) => (deco[item.slot] === item.id ? sum + item.charm : sum), 0)
  const baseCharm = DESSERT_BASES.find((b) => b.id === dessertBase)?.charm ?? 10
  const syrupCharm = syrups.reduce((sum, s) => sum + (SYRUP_CATALOG.find((c) => c.id === s)?.charm ?? 0), 0)
  const paintBonusCharm =
    baseCharm + syrupCharm + Math.min(30, strokes.length * 3 + stamps.length * 5 + (wingKind !== 'none' ? 10 : 0))
  const slotItems = DECO_ITEMS.filter((i) => i.slot === activeSlot)

  // 몬스터 캔버스 위에 직접 그리거나 스탬프를 찍는 핸들러 (터치 시 실제 디저트 질감 ASMR 사운드 재생!)
  function handleCanvasPoint(x: number, y: number, phase: 'down' | 'move' | 'up') {
    if (phase === 'down') {
      triggerAsmr(getSpeciesSoundKind(morphForm, dessertBase))
      if (toolMode === 'stamp') {
        const meta = STAMP_CATALOG.find((s) => s.kind === selectedStamp)
        setStamps((prev) => [
          ...prev.slice(-39),
          {
            kind: selectedStamp,
            x,
            y,
            color: paintColor || meta?.defaultColor || '#FBC02D',
            scale: 1.05,
          },
        ])
        return
      }
      isDrawingRef.current = true
      setStrokes((prev) => [
        ...prev.slice(-59),
        {
          color: paintColor,
          size: brushSize,
          points: [[x, y]],
        },
      ])
    } else if (phase === 'move') {
      if (!isDrawingRef.current || toolMode !== 'brush') return
      setStrokes((prev) => {
        if (prev.length === 0) return prev
        const last = prev[prev.length - 1]
        const lastPt = last.points[last.points.length - 1]
        if (lastPt && Math.hypot(lastPt[0] - x, lastPt[1] - y) < 3.5) return prev
        const updated: PaintStroke = {
          ...last,
          points: [...last.points.slice(-119), [x, y]],
        }
        return [...prev.slice(0, -1), updated]
      })
    } else if (phase === 'up') {
      isDrawingRef.current = false
    }
  }

  function undoPaint() {
    if (toolMode === 'stamp' && stamps.length > 0) {
      setStamps((prev) => prev.slice(0, -1))
    } else if (strokes.length > 0) {
      setStrokes((prev) => prev.slice(0, -1))
    } else if (stamps.length > 0) {
      setStamps((prev) => prev.slice(0, -1))
    }
  }

  function clearPaint() {
    setStrokes([])
    setStamps([])
  }

  function applyMallangPreset(presetId: string) {
    const found = MALLANG_PRESETS.find((p) => p.id === presetId)
    if (!found) return
    const nextForm = found.custom.morphForm ?? morphForm
    const nextBase = found.custom.dessertBase ?? dessertBase
    if (found.custom.morphForm) setMorphForm(found.custom.morphForm)
    if (found.custom.skinPalette !== undefined) setSkinPalette(found.custom.skinPalette)
    if (found.custom.wingKind) setWingKind(found.custom.wingKind)
    if (found.custom.dessertBase) setDessertBase(found.custom.dessertBase)
    if (found.custom.syrups) setSyrups(found.custom.syrups)
    if (found.custom.decorations) setDeco((prev) => ({ ...prev, ...found.custom.decorations }))
    setStrokes(found.custom.strokes ?? [])
    setStamps(found.custom.stamps ?? [])
    triggerAsmr(getSpeciesSoundKind(nextForm, nextBase))
  }

  function toggleSyrup(id: SyrupId) {
    setSyrups((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
    triggerAsmr('syrup-drizzle')
  }

  function randomizeMallang() {
    const forms = MORPH_FORMS.map((f) => f.id)
    const wings = WING_CATALOG.map((w) => w.id)
    const bases = DESSERT_BASES.map((b) => b.id)
    const randomForm = forms[Math.floor(Math.random() * forms.length)]
    const randomPal = Math.floor(Math.random() * CHAMELEON_PALETTES.length)
    const randomWing = wings[Math.floor(Math.random() * wings.length)]
    const randomBase = bases[Math.floor(Math.random() * bases.length)]
    const randStamp1 = STAMP_CATALOG[Math.floor(Math.random() * STAMP_CATALOG.length)]
    const randStamp2 = STAMP_CATALOG[Math.floor(Math.random() * STAMP_CATALOG.length)]
    setMorphForm(randomForm)
    setSkinPalette(randomPal)
    setWingKind(randomWing)
    setDessertBase(randomBase)
    setStamps([
      { kind: randStamp1.kind, x: 94, y: 176, color: randStamp1.defaultColor, scale: 1.0 },
      { kind: randStamp2.kind, x: 146, y: 176, color: randStamp2.defaultColor, scale: 1.0 },
    ])
    triggerAsmr(getSpeciesSoundKind(randomForm, randomBase))
  }

  function toggleDeco(slot: DecoSlot, id: string) {
    setDeco((prev) => ({ ...prev, [slot]: prev[slot] === id ? null : id }))
  }

  function equipWizardPreset() {
    setDeco({
      head: 'wizard-hat',
      face: 'alchemy-glasses',
      neck: 'rune-scarf',
      back: 'meteor-wings',
      hand: 'lantern-staff',
      bg: 'night-observatory',
      effect: 'constellation-aura',
      dye: deco.dye ?? 0,
    })
    setMedals({ enabled: true, towerStar: true, goldMane: true, bossScar: false, championCrown: false })
  }

  function handleSaveStudio() {
    const ok = saveMallangCustom(monster.id, {
      morphForm,
      skinPalette,
      wingKind,
      strokes,
      stamps,
      dessertBase,
      syrups,
      decorations: deco,
      medals,
    })
    setSaveToast(
      ok
        ? '🍰 나만의 모찌 디저트 플레이팅 & 바디 페인팅이 완성되어 보육실 식탁(홈 화면)에 전시되었어요!'
        : '⚠️ 저장 공간 접근에 실패했어요.',
    )
    setTimeout(() => setSaveToast(null), 3500)
  }

  return (
    <main className="screen">
      <div className="row between">
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title">🍰 모찌 디저트 & 변신 공방</h1>
        <span className="chip honey" style={{ fontSize: 12 }}>
          ✨ {monster.stats.cha + equippedCharm + paintBonusCharm} · ❤️ {biteVotes}
        </span>
      </div>

      {/* 상단 인터랙티브 쇼케이스 스테이지 카드 (Stitch 12·13번 통합: 케이크 상자 포장 프레임 지원) */}
      <div
        className="card center-text"
        style={{
          alignItems: 'center',
          paddingBottom: 16,
          background: showcaseBoxMode ? 'linear-gradient(180deg, #FFF5F7 0%, #FFFDF9 100%)' : undefined,
          border: showcaseBoxMode ? '2.5px dashed #FF7A59' : undefined,
        }}
      >
        <div className="row wrap center" style={{ gap: 6 }}>
          <span className="chip coral">
            {DESSERT_BASES.find((b) => b.id === dessertBase)?.icon ?? '🍡'} {speciesDef?.postureLabel ?? info?.name}
          </span>
          <span className="chip" style={{ background: '#E8F8F0', color: '#177051', fontWeight: 800 }}>
            🏆 쇼케이스 Top 5% 후보
          </span>
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

        {showcaseBoxMode ? (
          <div
            style={{
              marginTop: 6,
              padding: '5px 14px',
              borderRadius: 999,
              background: '#FF7A59',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            🎀 파티세리 케이크 상자 포장 모드 · [{monster.name}] 스페셜 에디션
          </div>
        ) : (
          <div
            style={{
              marginTop: 6,
              padding: '5px 12px',
              borderRadius: 999,
              background: '#FFF5EB',
              border: '1.5px dashed #FF8A65',
              fontSize: 11,
              fontWeight: 700,
              color: '#D85A3A',
            }}
          >
            {toolMode === 'brush'
              ? '🖌️ 모찌 몸통을 문질러 시럽·물감을 그리거나 아래에서 케이크·쿠키 받침대를 골라보세요!'
              : `🍒 모찌 몸통의 원하는 위치를 톡 눌러 [${STAMP_CATALOG.find((s) => s.kind === selectedStamp)?.label}] 토핑을 얹어보세요!`}
          </div>
        )}

        <div className="stage" style={{ alignItems: 'center', position: 'relative' }}>
          <SensoryBurst kind={activeSoundKind} triggerKey={burstKey} bubble={asmrBubble} combo={combo} />
          <div
            key={`studio-react-${burstKey}`}
            className={burstKey > 0 ? getSensoryReactionClass(activeSoundKind) : ''}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <MonsterView
              look={look}
              size={220}
              title={info?.name}
              animate={studioTab !== 'paint'}
              interactive={true}
              onCanvasPoint={handleCanvasPoint}
            />
          </div>
          <Nest width={230} lift={40} front={false} dessertBase={dessertBase} />
        </div>

        {/* 쇼케이스 & 캔버스 퀵 액션 바 (Stitch 13번: 상자 포장 / 시럽 뿌리기 / 받침대 교체 / 한입 투표 / ASMR 힐링 사운드) */}
        <div className="row wrap center" style={{ gap: 6, marginTop: 6 }}>
          <button
            className="chip coral"
            onClick={() => triggerAsmr(getSpeciesSoundKind(morphForm, dessertBase))}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800 }}
          >
            🎧 식감 ASMR 듣기
          </button>
          <button
            className={muted ? 'chip' : 'chip honey'}
            onClick={handleToggleMute}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 700 }}
          >
            {muted ? '🔇 사운드 꺼짐' : '🔊 ASMR 켜짐'}
          </button>
          <button
            className={showcaseBoxMode ? 'chip coral' : 'chip'}
            onClick={() => setShowcaseBoxMode((v) => !v)}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 700 }}
          >
            📦 {showcaseBoxMode ? '상자 포장 해제' : '케이크 상자 포장'}
          </button>
          <button
            className="chip honey"
            onClick={() => {
              setBiteVotes((v) => v + 1)
              triggerAsmr(getSpeciesSoundKind(morphForm, dessertBase))
            }}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 700 }}
          >
            🥄 한입 투표 ❤️ {biteVotes}
          </button>
          <button className="chip" onClick={undoPaint} style={{ cursor: 'pointer', border: 'none' }}>
            ↩️ 되돌리기
          </button>
          <button className="chip" onClick={clearPaint} style={{ cursor: 'pointer', border: 'none' }}>
            🗑️ 무늬 지우기
          </button>
        </div>
      </div>

      {/* Stitch 12·13번 통합: 말랑 모찌 디저트 플레이팅 & 바디 페인팅 공방 */}
      <div className="card">
        <div className="row between">
          <h2 className="title" style={{ fontSize: 18 }}>
            🍰 모찌 디저트 & 변신 공방
          </h2>
          <button
            className="chip honey"
            onClick={randomizeMallang}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 700 }}
          >
            🎲 랜덤 디저트 변신
          </button>
        </div>

        {/* 공방 4대 탭 전환 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
          <button
            onClick={() => setStudioTab('dessert')}
            style={{
              padding: '9px 4px',
              borderRadius: 14,
              border: studioTab === 'dessert' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: studioTab === 'dessert' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🎂 받침대·ASMR
          </button>
          <button
            onClick={() => setStudioTab('paint')}
            style={{
              padding: '9px 4px',
              borderRadius: 14,
              border: studioTab === 'paint' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: studioTab === 'paint' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🖌️ 바디 페인팅
          </button>
          <button
            onClick={() => setStudioTab('morph')}
            style={{
              padding: '9px 4px',
              borderRadius: 14,
              border: studioTab === 'morph' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: studioTab === 'morph' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🍡 체형 14종
          </button>
          <button
            onClick={() => setStudioTab('parts')}
            style={{
              padding: '9px 4px',
              borderRadius: 14,
              border: studioTab === 'parts' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: studioTab === 'parts' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🍒 토핑·장신구
          </button>
        </div>

        {/* 탭 0 (Stitch 13번 신규): 케이크·쿠키 받침대 6종 & 달콤 시럽·파우더 토핑 & 8종 디저트 ASMR 힐링 사운드보드 */}
        {studioTab === 'dessert' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 원터치 모찌 디저트 세트 프리셋 */}
            <div>
              <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
                ✨ 원터치 파티세리 추천 디저트 세트 (클릭 시 실제 식감 ASMR 재생!)
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                {MALLANG_PRESETS.map((pr) => (
                  <button
                    key={pr.id}
                    className="chip honey"
                    onClick={() => applyMallangPreset(pr.id)}
                    style={{ cursor: 'pointer', border: 'none', fontWeight: 700 }}
                  >
                    {pr.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 디저트 식감 ASMR 힐링 사운드보드 8종 */}
            <div
              style={{
                padding: '12px',
                borderRadius: 18,
                background: 'linear-gradient(180deg, #FFF9F2 0%, #FFF3E0 100%)',
                border: '1.5px solid #F5D6A7',
              }}
            >
              <div className="row between" style={{ marginBottom: 8 }}>
                <span className="small" style={{ fontWeight: 800, color: '#5D4037' }}>
                  🎧 디저트 식감 ASMR 힐링 사운드보드 (8종 군침 도는 실제 질감 소리)
                </span>
                <span className="small" style={{ color: '#D85A3A', fontWeight: 800 }}>
                  터치·이동·대전 연동
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {Object.values(DESSERT_SOUND_CATALOG).map((snd) => (
                  <button
                    key={snd.kind}
                    onClick={() => triggerAsmr(snd.kind)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 14,
                      border: '1.5px solid #EED5B0',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{snd.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#3B2F2F' }}>{snd.label}</div>
                      <div style={{ fontSize: 10, color: '#D85A3A', fontWeight: 700 }}>{snd.onomatopoeia}</div>
                      <div style={{ fontSize: 9.5, color: '#7A6A60' }}>{snd.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 케이크·쿠키 디저트 받침대 6종 그리드 */}
            <div>
              <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
                🎂 케이크·쿠키 플레이팅 받침대 6종 (모찌를 어디에 올릴까요?)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {DESSERT_BASES.map((base) => {
                  const selected = dessertBase === base.id
                  return (
                    <button
                      key={base.id}
                      onClick={() => {
                        setDessertBase(base.id)
                        triggerAsmr(getSpeciesSoundKind(morphForm, base.id))
                      }}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 16,
                        border: selected ? '2.5px solid #FF7A59' : '1.5px solid #F0DFB8',
                        background: selected ? '#FFF2EC' : '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 26 }}>{base.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#3B2F2F' }}>{base.name}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 999,
                          background: selected ? '#FF7A59' : '#FFF3D6',
                          color: selected ? '#FFFFFF' : '#8D5524',
                        }}
                      >
                        +{base.charm} 매력
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 달콤 시럽 & 파우더 효과 5종 토글 */}
            <div>
              <div className="row between" style={{ marginBottom: 6 }}>
                <span className="small" style={{ fontWeight: 700 }}>
                  🍫 달콤 시럽 & 파우더 토핑 (중복 선택 가능)
                </span>
                <span className="small" style={{ color: '#FF7A59', fontWeight: 800 }}>
                  {syrups.length}개 적용 중
                </span>
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                {SYRUP_CATALOG.map((s) => {
                  const active = syrups.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSyrup(s.id)}
                      style={{
                        padding: '7px 11px',
                        borderRadius: 999,
                        border: active ? '2px solid #8D4024' : '1.5px solid #F0DFB8',
                        background: active ? '#FFE8D6' : '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#3B2F2F',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        cursor: 'pointer',
                      }}
                    >
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                      {active && <span style={{ color: '#FF7A59' }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 탭 1: 바디 페인팅 & 스탬프 (메챠 카멜레온 감성) */}
        {studioTab === 'paint' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 원터치 추천 페인팅 프리셋 3종 */}
            <div>
              <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
                ✨ 원터치 메챠 카멜레온 추천 도안
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                {MALLANG_PRESETS.map((pr) => (
                  <button
                    key={pr.id}
                    className="chip honey"
                    onClick={() => applyMallangPreset(pr.id)}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {pr.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 찰흙 물감 8색 팔레트 + 브러시 굵기 */}
            <div>
              <div className="row between" style={{ marginBottom: 6 }}>
                <span className="small" style={{ fontWeight: 700 }}>
                  🎨 찰흙 물감 8색 & 브러시 굵기
                </span>
                <div className="row" style={{ gap: 4 }}>
                  {[
                    { size: 7, label: '얇게' },
                    { size: 12, label: '보통' },
                    { size: 18, label: '굵게' },
                  ].map((b) => (
                    <button
                      key={b.size}
                      onClick={() => {
                        setBrushSize(b.size)
                        setToolMode('brush')
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 999,
                        border: brushSize === b.size ? '2px solid #3B2F2F' : '1px solid #E5D4B0',
                        background: brushSize === b.size ? '#FFE8D6' : '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {CLAY_PAINTS.map((c) => {
                  const selected = paintColor === c.color
                  return (
                    <button
                      key={c.id}
                      onClick={() => setPaintColor(c.color)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 12,
                        border: selected ? '2px solid #3B2F2F' : '1.5px solid #F0DFB8',
                        background: selected ? '#FFF8EE' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 99,
                          background: c.color,
                          border: '1.5px solid #3B2F2F',
                          display: 'inline-block',
                        }}
                      />
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 원터치 무늬 스탬프 7종 */}
            <div>
              <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
                ⭐ 원터치 바디 스탬프 (선택 후 위 몬스터 몸통을 톡 누르세요!)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {STAMP_CATALOG.map((st) => {
                  const active = toolMode === 'stamp' && selectedStamp === st.kind
                  return (
                    <button
                      key={st.kind}
                      onClick={() => {
                        setToolMode('stamp')
                        setSelectedStamp(st.kind)
                        setPaintColor(st.defaultColor)
                      }}
                      style={{
                        padding: '8px 6px',
                        borderRadius: 14,
                        border: active ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                        background: active ? '#FFF2EC' : '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{st.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#3B2F2F' }}>{st.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: 체형 몰딩 14종 (디저트 7종: 두바이 쫀득쿠키·유리알 탕후루·구운 스모어·모찌·푸딩·젤리·초코 + 말랑 변신 7종!) */}
        {studioTab === 'morph' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="small" style={{ fontWeight: 700 }}>
              🍡 바사삭·탱글탱글한 디저트 체형 7종(두바이 쫀득쿠키·탕후루·스모어·모찌·푸딩·젤리·초코)과 말랑 카멜레온 체형 7종 중 무엇으로든 변신해요! (선택 시 고유 식감 ASMR 재생)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {MORPH_FORMS.map((form) => {
                const isSelected = morphForm === form.id
                return (
                  <button
                    key={form.id}
                    onClick={() => {
                      setMorphForm(form.id)
                      triggerAsmr(getSpeciesSoundKind(form.id, dessertBase))
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 16,
                      border: isSelected ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                      background: isSelected ? '#FFF2EC' : '#FFFFFF',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{form.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#3B2F2F' }}>{form.name}</div>
                      <div style={{ fontSize: 10, color: '#7A6A60', marginTop: 2 }}>{form.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 모찌 피부 기본 색상 6종 */}
            <div>
              <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
                🍬 모찌 젤리 피부 톤 (6종)
              </div>
              <div className="row wrap" style={{ gap: 8 }}>
                {CHAMELEON_PALETTES.map((pal, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSkinPalette(idx)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: pal.fur,
                      border: skinPalette === idx ? '3px solid #3B2F2F' : '2px solid #E5D4B0',
                      boxShadow: skinPalette === idx ? '0 3px 8px rgba(0,0,0,0.18)' : 'none',
                      cursor: 'pointer',
                    }}
                    aria-label={`피부톤 ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 탭 3: 만능 등 파츠 & 7칸 장신구 & 육성 훈장 */}
        {studioTab === 'parts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 만능 등/날개/갈기 파츠 (종족 불문 부착 가능) */}
            <div>
              <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
                🪽 종족 초월 만능 파츠 (어떤 체형에도 날개·갈기·등딱지 장착!)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {WING_CATALOG.map((w) => {
                  const selected = wingKind === w.id
                  return (
                    <button
                      key={w.id}
                      onClick={() => setWingKind(w.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 14,
                        border: selected ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                        background: selected ? '#FFF2EC' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{w.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>{w.name}</div>
                        <div style={{ fontSize: 10, color: '#7A6A60' }}>{w.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 장식 7칸 슬롯 바 */}
            <div>
              <div className="row between" style={{ marginBottom: 6 }}>
                <span className="small" style={{ fontWeight: 700 }}>
                  🎩 꾸미기 장신구 7칸 슬롯 (+{equippedCharm} 매력)
                </span>
                <button
                  className="chip honey"
                  onClick={equipWizardPreset}
                  style={{ cursor: 'pointer', border: 'none', fontSize: 11 }}
                >
                  ✨ 별마법사 풀세트
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
                {SLOT_LABELS.map(({ slot, label, defaultIcon }) => {
                  const equippedId = deco[slot]
                  const item = DECO_ITEMS.find((i) => i.id === equippedId)
                  const selected = activeSlot === slot
                  return (
                    <button
                      key={slot}
                      onClick={() => setActiveSlot(slot)}
                      style={{
                        padding: '7px 2px',
                        borderRadius: 14,
                        border: selected ? '2px solid #FF8A65' : '1.5px solid #F0DFB8',
                        background: equippedId ? '#FFF8EE' : '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 17 }}>{item?.icon ?? defaultIcon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#3B2F2F' }}>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 선택된 슬롯의 장신구 목록 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {slotItems.map((item) => {
                const isEquipped = deco[item.slot] === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleDeco(item.slot, item.id)}
                    style={{
                      padding: '9px 11px',
                      borderRadius: 16,
                      border: isEquipped ? '2px solid #FF8A65' : '1.5px solid #F0DFB8',
                      background: isEquipped ? '#FFF3EE' : '#FFFFFF',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#3B2F2F' }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: '#FF8A65', fontWeight: 700 }}>
                        +{item.charm} 매력 {isEquipped ? '· 장착중' : ''}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 별조각 염색 팔레트 6종 */}
            <div>
              <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
                ⭐ 별조각 장식 염색
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                {DYE_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDeco((prev) => ({ ...prev, dye: t.id }))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 999,
                      border: (deco.dye ?? 0) === t.id ? '2px solid #3B2F2F' : '1.5px solid #F0DFB8',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{ width: 10, height: 10, borderRadius: 99, background: t.main, display: 'inline-block' }}
                    />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 키우며 생기는 육성 훈장 표식 토글 */}
            <div>
              <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
                🏆 육성 훈장 표식 미리보기 (On/Off)
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                <button
                  className={medals.towerStar ? 'chip coral' : 'chip'}
                  onClick={() => setMedals((m) => ({ ...m, towerStar: !m.towerStar }))}
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  ⭐ 탑 30층 이마 별표식
                </button>
                <button
                  className={medals.goldMane ? 'chip coral' : 'chip'}
                  onClick={() => setMedals((m) => ({ ...m, goldMane: !m.goldMane }))}
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  👑 대전 100승 금빛 갈기
                </button>
                <button
                  className={medals.bossScar ? 'chip coral' : 'chip'}
                  onClick={() => setMedals((m) => ({ ...m, bossScar: !m.bossScar }))}
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  ⚡ 보스 토벌 흉터
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 저장하기 액션 버튼 */}
        <button className="btn btn-coral" onClick={handleSaveStudio} style={{ marginTop: 4 }}>
          ✨ 변신 & 바디 페인팅 저장하기
        </button>
        {saveToast && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              background: '#E8F8F0',
              color: '#1E7E52',
              fontSize: 12,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {saveToast}
          </div>
        )}
      </div>

      {/* 전투 장비 3칸 슬롯 (M5 예고) */}
      <div className="card">
        <div className="row between">
          <h2 className="title" style={{ fontSize: 18 }}>
            ⚔️ 전투 장비 (3칸)
          </h2>
          <span className="chip" style={{ fontSize: 11 }}>
            M5 업데이트 예정
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div
            style={{
              padding: 10,
              borderRadius: 18,
              background: '#FFF5F0',
              border: '1.5px dashed #F5C2B0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 18 }}>⚡</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>무기 슬롯</div>
            <div style={{ fontSize: 10, color: '#7A6A60' }}>공격력 보너스</div>
          </div>
          <div
            style={{
              padding: 10,
              borderRadius: 18,
              background: '#F0FAF5',
              border: '1.5px dashed #A8DFC4',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 18 }}>🛡️</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>방어구 슬롯</div>
            <div style={{ fontSize: 10, color: '#7A6A60' }}>방어력 보너스</div>
          </div>
          <div
            style={{
              padding: 10,
              borderRadius: 18,
              background: '#F6F0FF',
              border: '1.5px dashed #CDB8F5',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 18 }}>💍</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>장신구 슬롯</div>
            <div style={{ fontSize: 10, color: '#7A6A60' }}>치명타·속도</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="title" style={{ fontSize: 19 }}>
          프로필 정보
        </h2>
        <div>
          <div className="info-row">
            <span>현재 체형</span>
            <span>{info?.name ?? monster.species}</span>
          </div>
          {info?.textureLabel && (
            <div className="info-row">
              <span>디저트 식감</span>
              <span className="chip" style={{ fontSize: 11 }}>{info.textureLabel}</span>
            </div>
          )}
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
          {monster.fav_food && (
            <div className="info-row">
              <span>최애 토핑</span>
              <span>🍓 {monster.fav_food}</span>
            </div>
          )}
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
          <h2 className="title" style={{ fontSize: 19 }}>
            능력치
          </h2>
          <span className="chip">총점 {totalStats(monster.stats)}</span>
        </div>
        <StatBars stats={monster.stats} />
      </div>
      <p className="small center-text">
        {ELEMENT_INFO[monster.element].label} 속성 몬스터는 같은 속성 지역에서 유리해요 (곧 만나요)
      </p>
    </main>
  )
}
