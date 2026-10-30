// M1~M3 통합 프로필: 🧁 디저트 펫 상세 프로필 & 장신구 덱
// 유저 피드백 반영: 조건 없는 무제한 종족 변신 및 중복 사운드보드를 제거하고,
// 디저트 펫 고유의 정체성과 애착을 높이는 상세 프로필 및 보유 장신구 관리 화면으로 정돈.
// 받침대 6종은 부티크 상점에서 정식 구매·장착하도록 이전됨.

import { useEffect, useRef, useState } from 'react'
import { getOwnedBoutiqueItems, getRibbonCoins } from '../config/boutique'
import { useAccount, refreshAccount } from '../lib/shopApi'
import { IS_DEV_MOCK } from '../lib/devMode'
import { defaultDessertBase, SPECIES_INFO } from '../config/species'
import { monsterLook, serverNow, type MonsterRow } from '../lib/api'
import {
  getSpeciesSoundKind,
  isAsmrMuted,
  playDessertAsmr,
  setAsmrMuted,
  type DessertSoundKind,
} from '../lib/sound'
import { DECO_ITEMS, type DecoSlot } from '../monsters/Decorations'
import {
  DESSERT_BASES,
  loadMallangCustom,
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

type StudioTab = 'profile' | 'parts'

function daysTogether(hatchedAt: string) {
  return Math.max(1, Math.floor((serverNow() - Date.parse(hatchedAt)) / 86_400_000) + 1)
}

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

  const [studioTab, setStudioTab] = useState<StudioTab>('profile')

  useEffect(() => {
    if (!IS_DEV_MOCK) void refreshAccount()
  }, [])

  // 무조건 변신 방지: 종족은 펫 고유 종족 유지
  const morphForm = (monster.species as MorphFormId) ?? 'mochi'
  const skinPalette = savedCustom?.skinPalette ?? monster.parts.palette ?? 0
  const dessertBase: DessertBaseId = savedCustom?.dessertBase ?? defaultDessertBase(monster.species)
  const [wingKind, setWingKind] = useState<WingKind>(savedCustom?.wingKind ?? 'none')
  const [syrups, setSyrups] = useState<SyrupId[]>(savedCustom?.syrups ?? ['choco-drizzle', 'rainbow-sprinkles'])
  const [showcaseBoxMode, setShowcaseBoxMode] = useState<boolean>(false)
  const [biteVotes, setBiteVotes] = useState<number>(42)

  // 보존 상태
  const [strokes] = useState<PaintStroke[]>(savedCustom?.strokes ?? [])
  const [stamps] = useState<PaintStamp[]>(savedCustom?.stamps ?? [])

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
      towerStar: true,
      goldMane: false,
      bossScar: false,
      championCrown: false,
    },
  )
  const [saveToast, setSaveToast] = useState<string | null>(null)
  const [asmrBubble, setAsmrBubble] = useState<string | null>(null)
  const [activeSoundKind, setActiveSoundKind] = useState<DessertSoundKind>(() =>
    getSpeciesSoundKind(monster.species, savedCustom?.dessertBase),
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

  const info = SPECIES_INFO[monster.species]
  const speciesDef = SPECIES[monster.species]

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
  const currentBaseInfo = DESSERT_BASES.find((b) => b.id === dessertBase)
  const baseCharm = currentBaseInfo?.charm ?? 10
  const syrupCharm = syrups.reduce((sum, s) => sum + (SYRUP_CATALOG.find((c) => c.id === s)?.charm ?? 0), 0)
  const paintBonusCharm =
    baseCharm + syrupCharm + Math.min(30, strokes.length * 3 + stamps.length * 5 + (wingKind !== 'none' ? 10 : 0))
  const slotItems = DECO_ITEMS.filter((i) => i.slot === activeSlot)

  function toggleSyrup(id: SyrupId) {
    const next = syrups.includes(id) ? syrups.filter((s) => s !== id) : [...syrups, id]
    setSyrups(next)
    saveMallangCustom(monster.id, {
      morphForm,
      skinPalette,
      wingKind,
      strokes,
      stamps,
      dessertBase,
      syrups: next,
      decorations: deco,
      medals,
    })
    triggerAsmr('syrup-drizzle')
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
        ? '🧁 프로필 & 장신구 설정이 안전하게 저장되었어요!'
        : '⚠️ 저장 공간 접근에 실패했어요.',
    )
    setTimeout(() => setSaveToast(null), 3000)
  }

  return (
    <main className="screen" style={{ width: '100%', minWidth: '100%', height: '100dvh', padding: '10px 14px' }}>
      {/* 상단 바 */}
      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 17 }}>🧁 펫 상세 프로필</h1>
        <div className="row" style={{ gap: 4 }}>
          {onOpenBoutique && (
            <button
              className="chip honey"
              onClick={onOpenBoutique}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, padding: '3px 8px' }}
            >
              🛍️ 부티크
            </button>
          )}
          <button
            className="chip coral"
            onClick={handleSaveStudio}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, padding: '3px 8px' }}
          >
            💾 저장
          </button>
        </div>
      </div>

      {/* 상단 3D 쇼케이스 카드 */}
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
            {currentBaseInfo?.icon ?? '🍡'} {speciesDef?.postureLabel ?? info?.name}
          </span>
          <span className="chip honey" style={{ fontSize: 12, padding: '2px 8px', fontWeight: 800 }}>
            ✨ 매력 {monster.stats.cha + equippedCharm + paintBonusCharm} · ❤️ {biteVotes}
          </span>
        </div>

        <div
          className="stage"
          style={{ alignItems: 'center', position: 'relative', width: '100%', height: 168, minHeight: 168, padding: 2 }}
        >
          <SensoryBurst kind={activeSoundKind} triggerKey={burstKey} bubble={asmrBubble} combo={combo} />
          <div
            key={`studio-react-${burstKey}`}
            className={burstKey > 0 ? getSensoryReactionClass(activeSoundKind) : ''}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <MonsterView
              look={look}
              size={160}
              title={info?.name}
              animate
            />
          </div>
        </div>

        {/* 퀵 인터랙션 바 */}
        <div className="row wrap center" style={{ gap: 5 }}>
          <button
            className="chip coral"
            onClick={() => triggerAsmr(getSpeciesSoundKind(monster.species, dessertBase))}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 800, fontSize: 12, padding: '4px 10px' }}
          >
            🎧 식감 ASMR
          </button>
          <button
            className={muted ? 'chip' : 'chip honey'}
            onClick={handleToggleMute}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: 12, padding: '4px 10px' }}
          >
            {muted ? '🔇 음소거' : '🔊 소리켜짐'}
          </button>
          <button
            className={showcaseBoxMode ? 'chip coral' : 'chip'}
            onClick={() => setShowcaseBoxMode((v) => !v)}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: 12, padding: '4px 10px' }}
          >
            📦 {showcaseBoxMode ? '상자해제' : '케이크상자'}
          </button>
          <button
            className="chip honey"
            onClick={() => {
              setBiteVotes((v) => v + 1)
              triggerAsmr(getSpeciesSoundKind(monster.species, dessertBase))
            }}
            style={{ cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: 12, padding: '4px 10px' }}
          >
            🥄 쓰다듬기 +1
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

      {/* 하단 2대 탭 덱: 프로필 vs 장신구 */}
      <div className="card deck-card" style={{ padding: '10px 12px', gap: 8, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setStudioTab('profile')}
            style={{
              padding: '9px 4px',
              borderRadius: 11,
              border: studioTab === 'profile' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: studioTab === 'profile' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🧁 프로필 & 육성 기록
          </button>
          <button
            onClick={() => setStudioTab('parts')}
            style={{
              padding: '9px 4px',
              borderRadius: 11,
              border: studioTab === 'parts' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: studioTab === 'parts' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🎀 보유 장신구 & 날개
          </button>
        </div>

        {/* 탭 1: 상세 프로필 & 능력치 & 훈장 요약 */}
        {studioTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
            {/* 기본 제원 그리드 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 6,
                background: '#FFFBF5',
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid #F3E5D0',
              }}
            >
              <div style={{ fontSize: 12, color: '#6A4608' }}>
                <span style={{ fontWeight: 800 }}>종족:</span> {info?.name} ({speciesDef?.postureLabel})
              </div>
              <div style={{ fontSize: 12, color: '#6A4608' }}>
                <span style={{ fontWeight: 800 }}>식감:</span> {info?.textureLabel ?? '달콤'}
              </div>
              <div style={{ fontSize: 12, color: '#6A4608' }}>
                <span style={{ fontWeight: 800 }}>함께한 날:</span> {daysTogether(monster.hatched_at)}일째
              </div>
              <div style={{ fontSize: 12, color: '#6A4608' }}>
                <span style={{ fontWeight: 800 }}>능력치 총점:</span> {totalStats(monster.stats)} P
              </div>
            </div>

            {/* 현재 착용 받침대 정보 및 부티크 안내 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: 11,
                background: '#FFF2F2',
                border: '1px solid #FECDD3',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>{currentBaseInfo?.icon ?? '🧁'}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#9F1239' }}>
                    장착 받침대: {currentBaseInfo?.name ?? '기본 둥지'}
                  </div>
                  <div style={{ fontSize: 10, color: '#E11D48', fontWeight: 700 }}>
                    받침대는 부티크 상점에서 리본 코인으로 자유롭게 쇼핑할 수 있어요!
                  </div>
                </div>
              </div>
              {onOpenBoutique && (
                <button
                  onClick={onOpenBoutique}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#E11D48',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  상점 보기
                </button>
              )}
            </div>

            {/* 육성 훈장 4종 현황 */}
            <div
              style={{
                background: '#FAF5FF',
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid #E9D5FF',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#6B21A8' }}>
                  🏅 파티세리 명예 훈장
                </span>
                <button
                  className={medals.enabled ? 'chip coral' : 'chip'}
                  onClick={() => setMedals((m) => ({ ...m, enabled: !m.enabled }))}
                  style={{ cursor: 'pointer', border: 'none', fontSize: 11, padding: '2px 8px' }}
                >
                  {medals.enabled ? '훈장 노출 중' : '숨김'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 2 }}>
                {[
                  { key: 'towerStar' as const, icon: '⭐', name: '타워 정복', earned: medals.towerStar },
                  { key: 'goldMane' as const, icon: '🦁', name: '황금 갈기', earned: medals.goldMane },
                  { key: 'bossScar' as const, icon: '⚔️', name: '보스 토벌', earned: medals.bossScar },
                  { key: 'championCrown' as const, icon: '👑', name: '챔피언 관', earned: medals.championCrown },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setMedals((m) => ({ ...m, [item.key]: !m[item.key] }))}
                    style={{
                      padding: '5px 2px',
                      borderRadius: 9,
                      border: item.earned ? '1.5px solid #A855F7' : '1px dashed #D8B4FE',
                      background: item.earned ? '#F3E8FF' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      opacity: item.earned ? 1 : 0.6,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#4C1D95' }}>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 시럽 토핑 */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#5D4037', marginBottom: 4 }}>
                🍫 시럽 토핑 ({syrups.length}개 선택됨)
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
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#3B2F2F',
                        cursor: 'pointer',
                      }}
                    >
                      {s.icon} {s.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: 보유 장신구 7칸 & 날개 */}
        {studioTab === 'parts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto' }}>
            {/* 부티크 상점 바로가기 배너 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                borderRadius: 10,
                background: 'linear-gradient(90deg, #FDF2F8 0%, #FCE7F3 100%)',
                border: '1px solid #F472B6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14 }}>🎀</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#9D174D' }}>
                  보유 코인: 🎀 {getRibbonCoins()}
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
                  부티크 상점 바로가기
                </button>
              )}
            </div>

            {/* 날개 슬롯 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 3 }}>
              {WING_CATALOG.map((w) => {
                const selected = wingKind === w.id
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setWingKind(w.id)
                      saveMallangCustom(monster.id, {
                        morphForm,
                        skinPalette,
                        wingKind: w.id,
                        strokes,
                        stamps,
                        dessertBase,
                        syrups,
                        decorations: deco,
                        medals,
                      })
                      triggerAsmr('sugar-crack')
                    }}
                    style={{
                      padding: '4px 2px',
                      borderRadius: 9,
                      border: selected ? '2px solid #FF7A59' : '1px solid #F0DFB8',
                      background: selected ? '#FFF2EC' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{w.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{w.name.slice(0, 3)}</span>
                  </button>
                )
              })}
            </div>

            {/* 7개 장신구 부위 선택 슬롯 바 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 3 }}>
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
                    <span style={{ fontSize: 14 }}>{item?.icon ?? defaultIcon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
                  </button>
                )
              })}
            </div>

            {/* 선택된 슬롯의 아이템 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 4 }}>
              {slotItems.map((item) => {
                const isEquipped = deco[item.slot] === item.id
                const isOwned = getOwnedBoutiqueItems().has(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleDeco(item.slot, item.id)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 11,
                      border: isEquipped ? '2px solid #FF8A65' : '1px solid #F0DFB8',
                      background: isEquipped ? '#FFF3EE' : isOwned ? '#FFFFFF' : '#FFF9F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
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
          </div>
        )}
      </div>
    </main>
  )
}

