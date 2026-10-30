// M1~M3 통합 스튜디오: 🍰 3D 모찌 디저트 플레이팅 & 변신 공방 (원스크린 100dvh 무스크롤 덱 레이아웃)
// 1. 플레이팅 받침대·시럽 / 2. 9종 식감 ASMR 사운드보드 / 3. 15종 체형 몰딩 / 4. 2D 바디 페인팅 / 5. 만능 파츠·프로필을
// 단 한 화면에서 스크롤 없이 탭 전환만으로 조작합니다.

import { useEffect, useRef, useState } from 'react'
import { getOwnedBoutiqueItems, getRibbonCoins } from '../config/boutique'
import { useAccount, refreshAccount } from '../lib/shopApi'
import { IS_DEV_MOCK } from '../lib/devMode'
import { defaultDessertBase, SPECIES_INFO } from '../config/species'
import { monsterLook, serverNow, type MonsterRow } from '../lib/api'
import {
  DESSERT_SOUND_CATALOG,
  getSpeciesSoundKind,
  isAsmrMuted,
  playDessertAsmr,
  setAsmrMuted,
  type DessertSoundKind,
} from '../lib/sound'
import { DECO_ITEMS, type DecoSlot } from '../monsters/Decorations'
import {
  CHAMELEON_PALETTES,
  DESSERT_BASES,
  loadMallangCustom,
  MALLANG_PRESETS,
  MORPH_FORMS,
  saveMallangCustom,
  SYRUP_CATALOG,
  WING_CATALOG,
  type DessertBaseId,
  type MorphFormId,
  type PaintStamp,
  type PaintStroke,
  type SyrupId,
  type WingKind,
} from '../monsters/MallangChameleon'
import MonsterView from '../monsters/MonsterView'
import { SPECIES } from '../monsters/registry'
import type { MonsterDecorations, MonsterMedals } from '../monsters/types'
import { BackIcon } from '../ui/Icons'
import { totalStats } from '../ui/parts'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'

const SLOT_LABELS: { slot: DecoSlot; label: string; defaultIcon: string }[] = [
  { slot: 'head', label: '머리', defaultIcon: '🎩' },
  { slot: 'face', label: '얼굴', defaultIcon: '👓' },
  { slot: 'neck', label: '목', defaultIcon: '🧣' },
  { slot: 'back', label: '등', defaultIcon: '🪽' },
  { slot: 'hand', label: '손', defaultIcon: '🏮' },
  { slot: 'bg', label: '배경', defaultIcon: '🌌' },
  { slot: 'effect', label: '효과', defaultIcon: '✨' },
]

type StudioTab = 'dessert' | 'soundboard' | 'morph' | 'parts'

function daysTogether(hatchedAt: string) {
  return Math.max(1, Math.floor((serverNow() - Date.parse(hatchedAt)) / 86_400_000) + 1)
}

// 서버의 리본 코인·보유 아이템이 바뀌면 다시 그린다
function useAccountRefresh() {
  useAccount()
}

export default function MonsterDetail({
  monster,
  onBack,
  onOpenBoutique,
}: {
  monster: MonsterRow
  onBack: () => void
  onOpenBoutique?: () => void
}) {
  useAccountRefresh()
  const savedCustom = loadMallangCustom(monster.id)

  const [studioTab, setStudioTab] = useState<StudioTab>('dessert')
  // 실제 서비스: 열 때 서버의 최신 보유 아이템을 받아 온다
  useEffect(() => {
    if (!IS_DEV_MOCK) void refreshAccount()
  }, [])
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

  // 바디 페인팅 보존 상태 (레거시 커스텀 유지용)
  const [strokes, setStrokes] = useState<PaintStroke[]>(savedCustom?.strokes ?? [])
  const [stamps, setStamps] = useState<PaintStamp[]>(savedCustom?.stamps ?? [])

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
    setMorphForm(randomForm)
    setSkinPalette(randomPal)
    setWingKind(randomWing)
    setDessertBase(randomBase)
    triggerAsmr(getSpeciesSoundKind(randomForm, randomBase))
  }

  function toggleDeco(slot: DecoSlot, id: string) {
    const owned = getOwnedBoutiqueItems()
    if (!owned.has(id)) {
      setSaveToast('🛍️ 부티크 상점에서 구매할 수 있는 장신구입니다!')
      setTimeout(() => {
        setSaveToast(null)
        if (onOpenBoutique) onOpenBoutique()
      }, 1000)
      return
    }
    const nextDeco = { ...deco, [slot]: deco[slot] === id ? null : id }
    setDeco(nextDeco)
    saveMallangCustom(monster.id, {
      morphForm,
      skinPalette,
      wingKind,
      strokes,
      stamps,
      dessertBase,
      syrups,
      decorations: nextDeco,
      medals,
    })
    triggerAsmr('sugar-crack')
    setSaveToast('🎀 장식 착용이 즉시 저장되었어요!')
    setTimeout(() => setSaveToast(null), 2000)
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
    triggerAsmr('syrup-drizzle')
    setSaveToast(
      ok
        ? '🍰 플레이팅 & 변신이 저장되어 홈 화면에 반영되었어요!'
        : '⚠️ 저장 공간 접근에 실패했어요.',
    )
    setTimeout(() => setSaveToast(null), 3000)
  }

  return (
    <main className="screen">
      {/* 상단 바 */}
      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 17 }}>🍰 플레이팅·변신 공방</h1>
        <div className="row" style={{ gap: 4 }}>
          <button
            className="chip honey"
            onClick={randomizeMallang}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, padding: '3px 8px' }}
          >
            🎲 랜덤
          </button>
          <button
            className="chip coral"
            onClick={handleSaveStudio}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, padding: '3px 8px' }}
          >
            💾 저장
          </button>
        </div>
      </div>

      {/* 상단 3D/2D 쇼케이스 스테이지 카드 */}
      <div
        className="card center-text"
        style={{
          alignItems: 'center',
          padding: '8px 12px',
          gap: 5,
          flexShrink: 0,
          background: showcaseBoxMode ? 'linear-gradient(180deg, #FFF5F7 0%, #FFFDF9 100%)' : undefined,
          border: showcaseBoxMode ? '2px dashed #FF7A59' : undefined,
        }}
      >
        <div className="row wrap between" style={{ width: '100%', gap: 4 }}>
          <span className="chip coral" style={{ fontSize: 12, padding: '2px 8px' }}>
            {DESSERT_BASES.find((b) => b.id === dessertBase)?.icon ?? '🍡'} {speciesDef?.postureLabel ?? info?.name}
          </span>
          <span className="chip honey" style={{ fontSize: 12, padding: '2px 8px', fontWeight: 800 }}>
            ✨ 매력 {monster.stats.cha + equippedCharm + paintBonusCharm} · ❤️ {biteVotes}
          </span>
        </div>

        <div
          className="stage"
          style={{ alignItems: 'center', position: 'relative', width: '100%', height: 162, minHeight: 162, padding: 2 }}
        >
          <SensoryBurst kind={activeSoundKind} triggerKey={burstKey} bubble={asmrBubble} combo={combo} />
          <div
            key={`studio-react-${burstKey}`}
            className={burstKey > 0 ? getSensoryReactionClass(activeSoundKind) : ''}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <MonsterView
              look={look}
              size={156}
              title={info?.name}
              animate
            />
          </div>
        </div>

        {/* 퀵 액션 바 */}
        <div className="row wrap center" style={{ gap: 4 }}>
          <button
            className="chip coral"
            onClick={() => triggerAsmr(getSpeciesSoundKind(morphForm, dessertBase))}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, padding: '3px 8px' }}
          >
            🎧 식감 ASMR
          </button>
          <button
            className={muted ? 'chip' : 'chip honey'}
            onClick={handleToggleMute}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: 12, padding: '3px 8px' }}
          >
            {muted ? '🔇 음소거' : '🔊 소리켜짐'}
          </button>
          <button
            className={showcaseBoxMode ? 'chip coral' : 'chip'}
            onClick={() => setShowcaseBoxMode((v) => !v)}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: 12, padding: '3px 8px' }}
          >
            📦 {showcaseBoxMode ? '상자해제' : '케이크상자'}
          </button>
          <button
            className="chip honey"
            onClick={() => {
              setBiteVotes((v) => v + 1)
              triggerAsmr(getSpeciesSoundKind(morphForm, dessertBase))
            }}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: 12, padding: '3px 8px' }}
          >
            🥄 투표 +1
          </button>
        </div>

        {saveToast && (
          <div
            style={{
              width: '100%',
              padding: '4px 10px',
              borderRadius: 10,
              background: '#E8F8F0',
              color: '#1E7E52',
              fontSize: 12,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {saveToast}
          </div>
        )}
      </div>

      {/* 하단 원스크린 4대 공방 탭 덱 */}
      <div className="card deck-card" style={{ padding: '10px 12px', gap: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4, flexShrink: 0 }}>
          {[
            { id: 'dessert' as const, label: '🎂 받침대' },
            { id: 'soundboard' as const, label: '🎧 ASMR' },
            { id: 'morph' as const, label: '🍡 15체형' },
            { id: 'parts' as const, label: '🎀 7칸 장식' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setStudioTab(t.id)}
              style={{
                padding: '8px 2px',
                borderRadius: 11,
                border: studioTab === t.id ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                background: studioTab === t.id ? '#FFF2EC' : '#FFFFFF',
                fontSize: 12,
                fontWeight: 800,
                color: '#3B2F2F',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 탭 1: 케이크·쿠키 받침대 6종 & 시럽 5종 & 추천 세트 */}
        {studioTab === 'dessert' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6, flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 5 }}>
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
                      padding: '6px 4px',
                      borderRadius: 12,
                      border: selected ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                      background: selected ? '#FFF2EC' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{base.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>{base.name}</span>
                  </button>
                )
              })}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#5D4037', marginBottom: 4 }}>
                🍫 시럽 토핑 ({syrups.length}개) & 원터치 추천 세트
              </div>
              <div className="row wrap" style={{ gap: 4 }}>
                {SYRUP_CATALOG.map((s) => {
                  const active = syrups.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSyrup(s.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        border: active ? '2px solid #8D4024' : '1px solid #F0DFB8',
                        background: active ? '#FFE8D6' : '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#3B2F2F',
                        cursor: 'pointer',
                      }}
                    >
                      {s.icon} {s.name}
                    </button>
                  )
                })}
                {MALLANG_PRESETS.slice(0, 4).map((pr) => (
                  <button
                    key={pr.id}
                    onClick={() => applyMallangPreset(pr.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 999,
                      border: '1px solid #F3B63F',
                      background: '#FFF3D6',
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#6A4608',
                      cursor: 'pointer',
                    }}
                  >
                    {pr.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: 9종 리얼 폴리 식감 ASMR 사운드보드 (3×3 그리드) */}
        {studioTab === 'soundboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 5, flex: 1, alignContent: 'start' }}>
            {Object.values(DESSERT_SOUND_CATALOG).map((snd) => (
              <button
                key={snd.kind}
                onClick={() => triggerAsmr(snd.kind)}
                style={{
                  padding: '7px 5px',
                  borderRadius: 12,
                  border: activeSoundKind === snd.kind ? '2px solid #FF7A59' : '1.5px solid #EED5B0',
                  background: activeSoundKind === snd.kind ? '#FFF2EC' : '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 20 }}>{snd.icon}</span>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', lineHeight: 1.15 }}>{snd.label}</div>
                <div style={{ fontSize: 12, color: '#D85A3A', fontWeight: 700, lineHeight: 1.1 }}>
                  {snd.onomatopoeia.slice(0, 10)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 탭 3: 15종 3D 디저트·카멜레온 체형 몰딩 (3×5 그리드 + 피부톤 6종) */}
        {studioTab === 'morph' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 5, flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4 }}>
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
                      padding: '5px 6px',
                      borderRadius: 10,
                      border: isSelected ? '2px solid #FF7A59' : '1px solid #F0DFB8',
                      background: isSelected ? '#FFF2EC' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{form.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', lineHeight: 1.1 }}>
                      {form.name.replace(/^[^\s]+\s/, '')}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="row between">
              <span style={{ fontSize: 12, fontWeight: 800, color: '#5D4037' }}>🍬 젤리 피부톤 6종</span>
              <div className="row" style={{ gap: 6 }}>
                {CHAMELEON_PALETTES.map((pal, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSkinPalette(idx)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: pal.fur,
                      border: skinPalette === idx ? '2.5px solid #3B2F2F' : '1.5px solid #E5D4B0',
                      cursor: 'pointer',
                    }}
                    aria-label={`피부톤 ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 탭 4: 만능 날개·장신구 7칸·프로필 요약 */}
        {studioTab === 'parts' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6, flex: 1 }}>
            {/* 부티크 상점 바로가기 배너 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: 10,
                background: 'linear-gradient(90deg, #FDF2F8 0%, #FCE7F3 100%)',
                border: '1px solid #F472B6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 13 }}>🛍️</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#9D174D' }}>
                  더 특별한 장신구를 원하시나요?
                </span>
                <span style={{ fontSize: 10, color: '#BE185D', fontWeight: 800 }}>
                  (보유: 🎀 {getRibbonCoins()})
                </span>
              </div>
              {onOpenBoutique && (
                <button
                  onClick={onOpenBoutique}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#EC4899',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                >
                  부티크 상점 가기
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4 }}>
              {WING_CATALOG.map((w) => {
                const selected = wingKind === w.id
                return (
                  <button
                    key={w.id}
                    onClick={() => setWingKind(w.id)}
                    style={{
                      padding: '5px 2px',
                      borderRadius: 10,
                      border: selected ? '2px solid #FF7A59' : '1px solid #F0DFB8',
                      background: selected ? '#FFF2EC' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{w.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{w.name.slice(0, 3)}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
              {SLOT_LABELS.map(({ slot, label, defaultIcon }) => {
                const equippedId = deco[slot]
                const item = DECO_ITEMS.find((i) => i.id === equippedId)
                const selected = activeSlot === slot
                return (
                  <button
                    key={slot}
                    onClick={() => setActiveSlot(slot)}
                    style={{
                      padding: '5px 2px',
                      borderRadius: 10,
                      border: selected ? '2px solid #FF8A65' : '1px solid #F0DFB8',
                      background: equippedId ? '#FFF8EE' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{item?.icon ?? defaultIcon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 5 }}>
              {slotItems.map((item) => {
                const isEquipped = deco[item.slot] === item.id
                const isOwned = getOwnedBoutiqueItems().has(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleDeco(item.slot, item.id)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 12,
                      border: isEquipped ? '2px solid #FF8A65' : '1px solid #F0DFB8',
                      background: isEquipped ? '#FFF3EE' : isOwned ? '#FFFFFF' : '#FFF9F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 10, color: '#FF8A65', fontWeight: 700 }}>+{item.charm} 매력</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: isEquipped ? '#E11D48' : isOwned ? '#10B981' : '#F59E0B', flexShrink: 0 }}>
                      {isEquipped ? '착용' : isOwned ? '보유' : '🔒상점'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="row wrap between" style={{ fontSize: 12, fontWeight: 700, color: '#5D4037' }}>
              <span>함께한 날 {daysTogether(monster.hatched_at)}일째</span>
              <button
                className={medals.goldMane ? 'chip coral' : 'chip'}
                onClick={() => setMedals((m) => ({ ...m, goldMane: !m.goldMane, towerStar: !m.towerStar }))}
                style={{ cursor: 'pointer', border: 'none', fontSize: 12, padding: '2px 7px' }}
              >
                👑 훈장 표식 {medals.goldMane ? 'ON' : 'OFF'}
              </button>
              <span>총점 {totalStats(monster.stats)}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
