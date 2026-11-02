// M1~M3 통합 프로필: 🧁 디저트 펫 상세 프로필 & 장신구 덱
// 유저 피드백 반영: 조건 없는 무제한 종족 변신 및 중복 사운드보드를 제거하고,
// 디저트 펫 고유의 정체성과 애착을 높이는 상세 프로필 및 보유 장신구 관리 화면으로 정돈.
// 받침대 6종은 부티크 상점에서 정식 구매·장착하도록 이전됨.

import { useEffect, useRef, useState } from 'react'
import { useAccount, refreshAccount } from '../lib/shopApi'
import { IS_DEV_MOCK } from '../lib/devMode'
import { defaultDessertBase, SPECIES_INFO } from '../config/species'
import { monsterLook, serverNow, type MonsterRow } from '../lib/api'
import {
  getSpeciesSoundKind,
  playDessertAsmr,
  type DessertSoundKind,
} from '../lib/sound'
import { DECO_ITEMS } from '../monsters/Decorations'
import {
  DESSERT_BASES,
  loadMallangCustom,
  saveMallangCustom,
  SYRUP_CATALOG,
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
import { getPetPromotedRarity, getPetSecretSkill, type SecretSkillDef } from '../lib/eggResonance'

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



  useEffect(() => {
    if (!IS_DEV_MOCK) void refreshAccount()
  }, [])

  // 무조건 변신 방지: 종족은 펫 고유 종족 유지
  const morphForm = (monster.species as MorphFormId) ?? 'mochi'
  const skinPalette = savedCustom?.skinPalette ?? monster.parts.palette ?? 0
  const dessertBase: DessertBaseId = savedCustom?.dessertBase ?? defaultDessertBase(monster.species)
  const wingKind: WingKind = savedCustom?.wingKind ?? 'none'
  const syrups: SyrupId[] = savedCustom?.syrups ?? ['choco-drizzle', 'rainbow-sprinkles']
  const biteVotes = 42

  // 보존 상태
  const [strokes] = useState<PaintStroke[]>(savedCustom?.strokes ?? [])
  const [stamps] = useState<PaintStamp[]>(savedCustom?.stamps ?? [])

  // 장식 7칸 & 육성 훈장 상태 (기존 보존)
  const deco: MonsterDecorations = savedCustom?.decorations ?? {
    head: null,
    face: null,
    neck: null,
    back: null,
    hand: null,
    bg: null,
    effect: null,
    dye: 0,
  }
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

  // 🥚 에그 온기 숙성(블렌딩) 비기 스킬 & 승급 등급 조회 (대표님 피드백 반영)
  const secretSkill: SecretSkillDef | null = getPetSecretSkill(monster.id)
  const petRarity = getPetPromotedRarity(monster.id, (monster as any).rarity ?? 'common')

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
        }}
      >
        <div className="row wrap between" style={{ width: '100%', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="chip coral" style={{ fontSize: 12, padding: '2px 8px' }}>
              {currentBaseInfo?.icon ?? '🍡'} {speciesDef?.postureLabel ?? info?.name}
            </span>
            {/* 🥚 에그 승급 등급 럭셔리 뱃지 */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                padding: '2px 7px',
                borderRadius: 999,
                color: petRarity === 'legendary' ? '#B45309' : petRarity === 'epic' ? '#6D28D9' : petRarity === 'rare' ? '#1E40AF' : '#4B5563',
                background: petRarity === 'legendary' ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' : petRarity === 'epic' ? '#EDE9FE' : petRarity === 'rare' ? '#DBEAFE' : '#F3F4F6',
                border: `1.5px solid ${petRarity === 'legendary' ? '#F59E0B' : petRarity === 'epic' ? '#8B5CF6' : petRarity === 'rare' ? '#3B82F6' : '#9CA3AF'}`,
                boxShadow: petRarity === 'legendary' ? '0 1px 4px rgba(245,158,11,0.3)' : 'none',
              }}
            >
              {petRarity === 'legendary' ? '👑 LEGENDARY' : petRarity === 'epic' ? '✨ EPIC' : petRarity === 'rare' ? '🌟 RARE' : 'COMMON'}
            </span>
          </div>
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

      {/* 하단 덱: 프로필 기록 & 훈장 요약 */}
      <div className="card deck-card" style={{ padding: '12px 14px', gap: 10, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #F0DFB8', paddingBottom: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>🧁</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#3B2F2F' }}>프로필 기록 & 훈장</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#FF7A59' }}>
            ⚔️ 종합 전투력 {totalStats(monster.stats)}
          </span>
        </div>

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
              <div style={{ fontSize: 12, color: '#6A4608', gridColumn: 'span 2', borderTop: '1px dashed #E0D3C5', paddingTop: 4 }}>
                <span style={{ fontWeight: 800 }}>에그 승급 등급:</span>{' '}
                <span style={{ fontWeight: 900, color: petRarity === 'legendary' ? '#D97706' : petRarity === 'epic' ? '#7C3AED' : petRarity === 'rare' ? '#2563EB' : '#4B5563' }}>
                  {petRarity === 'legendary' ? '👑 LEGENDARY (전설 승급)' : petRarity === 'epic' ? '✨ EPIC (영웅 승급)' : petRarity === 'rare' ? '🌟 RARE (희귀 승급)' : 'COMMON (일반)'}
                </span>
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

            {/* 🥚 신비한 에그 전수 비기 (SECRET SKILL) - 대표님 피드백 반영 */}
            <div
              style={{
                background: secretSkill
                  ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                  : '#F9FAFB',
                padding: '9px 12px',
                borderRadius: 12,
                border: secretSkill ? '1.5px solid #F59E0B' : '1px dashed #D1D5DB',
                boxShadow: secretSkill ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: secretSkill ? '#B45309' : '#6B7280' }}>
                  🥚 신비한 에그 전수 비기 (SECRET SKILL)
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: secretSkill ? '#F59E0B' : '#E5E7EB',
                    color: secretSkill ? '#FFFFFF' : '#9CA3AF',
                  }}
                >
                  {secretSkill ? '각인 완료 ✨' : '미각인'}
                </span>
              </div>
              {secretSkill ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 15 }}>{secretSkill.icon}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 900, color: '#92400E' }}>
                      {secretSkill.name}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: '#FEF08A',
                        color: '#854D0E',
                        fontWeight: 800,
                      }}
                    >
                      {secretSkill.battleEffect || '특수 비기'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#78350F', fontWeight: 700, lineHeight: 1.35 }}>
                    {secretSkill.desc}
                  </div>
                  <div style={{ fontSize: 9.5, color: '#D97706', fontWeight: 800, marginTop: 1 }}>
                    ✨ 탐험 알 온기 숙성(에그 블렌딩)으로 계승된 영구 스페셜 비기입니다.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, lineHeight: 1.35 }}>
                  아직 전수받은 에그 비기가 없어요. 탐험에서 획득한 알을 [에그 온기 숙성]하면 강력한 비기를 계승받을 수 있어요!
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    )
}

