/**
 * 🎨 M5 꾸미기 스튜디오 (DessertStudioScreen.tsx)
 * 
 * 7칸 장식(머리·얼굴·목·등·손·배경·이펙트) 및 플레이팅 받침대 한 화면 비교·장착,
 * 선택 전/후 대형 실시간 비교 뷰,
 * 코디 프리셋 3종(달콤 큐트, 별빛 마법사, 전투 파티시에) 및 나만의 8개 프리셋 저장/적용,
 * 미구매 아이템 장착 차단(Zero-Trust Security) 지원.
 */

import { useState, useEffect } from 'react'
import {
  DECO_ITEMS,
  DYE_THEMES,
  type DecoSlot,
  type DecoItemDef,
} from '../monsters/Decorations'
import {
  BOUTIQUE_FASHION_ITEMS,
  BOUTIQUE_PLATING_ITEMS,
  getOwnedBoutiqueItems,
  getRibbonCoins,
} from '../config/boutique'
import {
  loadMallangCustom,
  saveMallangCustom,
  type DessertBaseId,
  type MallangCustom,
} from '../monsters/MallangChameleon'
import { monsterLook, type MonsterRow } from '../lib/api'
import Monster3DView from '../monsters/Monster3DView'
import type { MonsterDecorations } from '../monsters/types'
import { BackIcon } from '../ui/Icons'
import { playDessertAsmr } from '../lib/sound'
import {
  listLookPresets,
  saveLookPreset,
  deleteLookPreset,
  RECOMMENDED_PRESETS,
  type LookPreset,
  type LookPresetTemplate,
} from '../lib/lookPresetApi'

interface Props {
  monster: MonsterRow
  onBack: () => void
  onOpenBoutique?: () => void
  onUpdate?: (updatedMonster: MonsterRow) => void
}

// 7칸 슬롯 탭 정의
const SLOTS_META: { slot: DecoSlot; name: string; icon: string }[] = [
  { slot: 'head', name: '머리', icon: '🍒' },
  { slot: 'face', name: '얼굴', icon: '👓' },
  { slot: 'neck', name: '목', icon: '🥨' },
  { slot: 'back', name: '등/날개', icon: '🪽' },
  { slot: 'hand', name: '손 소품', icon: '🪄' },
  { slot: 'bg', name: '배경', icon: '🌌' },
  { slot: 'effect', name: '오라/이펙트', icon: '✨' },
]

export default function DessertStudioScreen({ monster, onBack, onOpenBoutique, onUpdate }: Props) {
  // 원래 저장되어 있던 초기 코디
  const initialCustom: MallangCustom = loadMallangCustom(monster.id) ?? {}
  const initialDeco: MonsterDecorations = initialCustom.decorations ?? {
    head: null,
    face: null,
    neck: null,
    back: null,
    hand: null,
    bg: null,
    effect: null,
    dye: 0,
  }
  const initialBase: DessertBaseId = initialCustom.dessertBase ?? 'nest'

  // 현재 스튜디오 피팅 상태
  const [currentDeco, setCurrentDeco] = useState<MonsterDecorations>({ ...initialDeco })
  const [currentBase, setCurrentBase] = useState<DessertBaseId>(initialBase)
  const [activeTab, setActiveTab] = useState<'slots' | 'plating' | 'presets'>('slots')
  const [activeSlot, setActiveSlot] = useState<DecoSlot>('head')

  // 전/후 비교 모드 토글 (false: 현재 피팅 대형 뷰, true: 착용 전 vs 착용 후 분할 비교 뷰)
  const [compareMode, setCompareMode] = useState<boolean>(false)

  // 보유 아이템 목록
  const [ownedItems, setOwnedItems] = useState<Set<string>>(() => getOwnedBoutiqueItems())
  const [ribbonCoins, setCoinsState] = useState<number>(() => getRibbonCoins())

  // 코디 프리셋 목록 & 모달
  const [presets, setPresets] = useState<LookPreset[]>([])
  const [presetModalOpen, setPresetModalOpen] = useState<boolean>(false)
  const [presetNameInput, setPresetNameInput] = useState<string>('')
  const [toast, setToast] = useState<string | null>(null)

  // 알림 토스트 헬퍼
  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }

  // 프리셋 목록 불러오기
  const loadUserPresets = async () => {
    try {
      const res = await listLookPresets()
      if (res.ok && res.presets) {
        setPresets(res.presets)
      }
    } catch (e) {
      console.error('[Studio] Failed to load presets:', e)
    }
  }

  useEffect(() => {
    void loadUserPresets()
    setOwnedItems(new Set(getOwnedBoutiqueItems()))
    setCoinsState(getRibbonCoins())
  }, [])

  // 장식 슬롯 선택/착용 토글
  const handleToggleDecoItem = (item: DecoItemDef) => {
    playDessertAsmr('wax-pop')
    setCurrentDeco((prev) => {
      const isAlready = prev[item.slot] === item.id
      return {
        ...prev,
        [item.slot]: isAlready ? null : item.id,
      }
    })
  }

  // 염색 테마 변경
  const handleSelectDye = (dyeId: number) => {
    playDessertAsmr('wax-pop')
    setCurrentDeco((prev) => ({
      ...prev,
      dye: dyeId,
    }))
  }

  // 플레이팅 받침대 선택
  const handleSelectBase = (baseId: DessertBaseId) => {
    playDessertAsmr('wax-pop')
    setCurrentBase(baseId)
  }

  // 추천 프리셋 적용
  const handleApplyTemplate = (tmpl: LookPresetTemplate) => {
    playDessertAsmr('sugar-crack')
    if (tmpl.custom.decorations) {
      setCurrentDeco({ ...tmpl.custom.decorations })
    }
    if (tmpl.custom.dessertBase) {
      setCurrentBase(tmpl.custom.dessertBase)
    }
    showToast(`✨ 추천 코디 [${tmpl.name}] 룩을 피팅했습니다!`)
  }

  // 유저 저장 프리셋 적용
  const handleApplyUserPreset = (preset: LookPreset) => {
    playDessertAsmr('sugar-crack')
    if (preset.custom.decorations) {
      setCurrentDeco({ ...preset.custom.decorations })
    }
    if (preset.custom.dessertBase) {
      setCurrentBase(preset.custom.dessertBase)
    }
    showToast(`👗 코디 프리셋 [${preset.name}]을(를) 피팅했습니다!`)
  }

  // 프리셋 저장
  const handleSavePreset = async () => {
    const trimmed = presetNameInput.trim()
    if (!trimmed) {
      showToast('⚠️ 프리셋 이름을 입력해 주세요.')
      return
    }
    if (trimmed.length > 24) {
      showToast('⚠️ 프리셋 이름은 최대 24자까지 가능합니다.')
      return
    }

    const payloadCustom: MallangCustom = {
      ...initialCustom,
      decorations: currentDeco,
      dessertBase: currentBase,
    }

    const res = await saveLookPreset(trimmed, payloadCustom)
    if (res.ok) {
      playDessertAsmr('wax-pop')
      setPresetModalOpen(false)
      setPresetNameInput('')
      showToast(`💾 [${trimmed}] 코디 프리셋을 저장했습니다!`)
      await loadUserPresets()
    } else {
      showToast(res.message ?? '프리셋 저장에 실패했습니다.')
    }
  }

  // 프리셋 삭제
  const handleDeletePreset = async (id: string, name: string) => {
    const res = await deleteLookPreset(id)
    if (res.ok) {
      playDessertAsmr('wax-pop')
      showToast(`🗑️ [${name}] 프리셋을 삭제했습니다.`)
      await loadUserPresets()
    } else {
      showToast('삭제 중 오류가 발생했습니다.')
    }
  }

  // 초기 상태로 되돌리기
  const handleResetToInitial = () => {
    playDessertAsmr('wax-pop')
    setCurrentDeco({ ...initialDeco })
    setCurrentBase(initialBase)
    showToast('🔄 원래 착용 중이던 코디로 되돌렸습니다.')
  }

  // 🔒 Zero-Trust: 미구매 아이템 장착 차단 및 최종 저장
  const handleApplyToPet = () => {
    // 1. 착용하려는 패션 아이템 중 미구매 검사
    const decoSlots: DecoSlot[] = ['head', 'face', 'neck', 'back', 'hand', 'bg', 'effect']
    for (const slot of decoSlots) {
      const itemId = currentDeco[slot]
      if (itemId) {
        // 부티크 아이템 카탈로그에서 가격 및 보유 여부 확인
        const itemDef = BOUTIQUE_FASHION_ITEMS.find((b) => b.id === itemId)
        const isFreeOrOwned = itemDef?.price === 0 || ownedItems.has(itemId)
        if (!isFreeOrOwned) {
          playDessertAsmr('wax-pop')
          showToast(`🔒 [${itemDef?.name ?? itemId}]은(는) 아직 구매하지 않은 장식입니다! 부티크 상점에서 먼저 구매해 주세요.`)
          return
        }
      }
    }

    // 2. 착용하려는 플레이팅 받침대 검사
    if (currentBase && currentBase !== 'nest') {
      const platingDef = BOUTIQUE_PLATING_ITEMS.find((p) => p.baseId === currentBase)
      const isPlatingOwned = platingDef?.price === 0 || (platingDef && ownedItems.has(platingDef.id))
      if (!isPlatingOwned) {
        playDessertAsmr('wax-pop')
        showToast(`🔒 [${platingDef?.name ?? currentBase}] 받침대는 아직 구매하지 않았습니다! 부티크 상점에서 먼저 구매해 주세요.`)
        return
      }
    }

    // 3. 모두 검증 통과 ➔ 안전 저장
    const currentCustom = loadMallangCustom(monster.id) ?? {}
    const nextCustom: MallangCustom = {
      ...currentCustom,
      decorations: currentDeco,
      dessertBase: currentBase,
    }
    saveMallangCustom(monster.id, nextCustom)

    const updatedMonster: MonsterRow = {
      ...monster,
      parts: {
        ...monster.parts,
        decorations: currentDeco,
        mallang: nextCustom,
      },
      look_custom: nextCustom,
    }

    if (onUpdate) {
      onUpdate(updatedMonster)
    }

    playDessertAsmr('sugar-crack')
    showToast('🎉 나만의 시그니처 코디가 펫에게 완벽히 적용되었습니다!')
  }

  const baseLook = monsterLook(monster)

  // 착용 전(Before) 룩
  const beforeLook = {
    ...baseLook,
    decorations: initialDeco,
    mallang: {
      ...baseLook.mallang,
      decorations: initialDeco,
      dessertBase: initialBase,
    },
  }

  // 피팅 후(After) 룩
  const afterLook = {
    ...baseLook,
    decorations: currentDeco,
    mallang: {
      ...baseLook.mallang,
      decorations: currentDeco,
      dessertBase: currentBase,
    },
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'linear-gradient(180deg, #FFF1F2 0%, #FCE7F3 40%, #F5F3FF 100%)',
        color: '#1E293B',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* 1. 상단 바 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1.5px solid #FBCFE8',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#831843',
              padding: 4,
            }}
            aria-label="뒤로가기"
          >
            <BackIcon />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#831843', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🎨</span> 꾸미기 스튜디오
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: '#9D174D', fontWeight: 600 }}>
              7칸 장식 피팅 & 코디 프리셋
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 전/후 비교 모드 버튼 */}
          <button
            onClick={() => {
              playDessertAsmr('wax-pop')
              setCompareMode(!compareMode)
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 14,
              border: compareMode ? '1.5px solid #E11D48' : '1.5px solid #FBCFE8',
              background: compareMode ? '#FFE4E6' : '#FFFFFF',
              color: compareMode ? '#BE123C' : '#831843',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>⚖️</span> {compareMode ? '단일 뷰' : '전/후 비교'}
          </button>

          {/* 리본 코인 잔액 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 14,
              background: '#FDF2F8',
              border: '1px solid #F472B6',
              fontSize: 11,
              fontWeight: 900,
              color: '#BE185D',
            }}
          >
            <span>🎀</span>
            <span>{ribbonCoins}</span>
          </div>

          {/* 부티크 샵 바로가기 */}
          {onOpenBoutique && (
            <button
              onClick={onOpenBoutique}
              style={{
                padding: '6px 12px',
                borderRadius: 14,
                border: '1.5px solid #F472B6',
                background: 'linear-gradient(135deg, #FFF1F2, #FCE7F3)',
                color: '#9D174D',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>🛍️</span> 상점
            </button>
          )}
        </div>
      </header>

      {/* 2. 대형 3D 미리보기 뷰포트 (전/후 비교 지원) */}
      <div
        style={{
          flex: '0 0 42%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 0%, rgba(254, 242, 242, 0.6) 70%, transparent 100%)',
          borderBottom: '1px solid #FBCFE8',
          overflow: 'hidden',
        }}
      >
        {compareMode ? (
          // ⚖️ 전/후 나란히 비교 모드
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* 왼쪽: 착용 전 */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1.5px dashed #F472B6' }}>
              <div style={{ position: 'absolute', top: 10, left: 12, padding: '3px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', color: '#FFF', fontSize: 10, fontWeight: 800 }}>
                착용 전
              </div>
              <div style={{ width: 140, height: 140 }}>
                <Monster3DView look={beforeLook} size={140} interactive={false} />
              </div>
            </div>
            {/* 오른쪽: 피팅 후 */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', top: 10, right: 12, padding: '3px 8px', borderRadius: 8, background: '#E11D48', color: '#FFF', fontSize: 10, fontWeight: 800 }}>
                피팅 후 ✨
              </div>
              <div style={{ width: 140, height: 140 }}>
                <Monster3DView look={afterLook} size={140} interactive={true} />
              </div>
            </div>
          </div>
        ) : (
          // 🌟 단일 대형 3D 뷰
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 10, left: 16, fontSize: 11, fontWeight: 700, color: '#9D174D', background: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: 10 }}>
              🎀 실시간 3D 피팅룸
            </div>
            <div style={{ width: 220, height: 220 }}>
              <Monster3DView look={afterLook} size={220} interactive={true} />
            </div>
          </div>
        )}
      </div>

      {/* 3. 메인 네비게이션 탭 (7칸 장식 / 플레이팅 / 코디 프리셋) */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 12px',
          background: '#FFFFFF',
          borderBottom: '1px solid #FBCFE8',
        }}
      >
        <button
          onClick={() => { playDessertAsmr('wax-pop'); setActiveTab('slots'); }}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 10,
            border: activeTab === 'slots' ? '1.5px solid #E11D48' : '1px solid #FBCFE8',
            background: activeTab === 'slots' ? '#FFF1F2' : '#F8FAFC',
            color: activeTab === 'slots' ? '#BE123C' : '#64748B',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          ✨ 7칸 장식
        </button>

        <button
          onClick={() => { playDessertAsmr('wax-pop'); setActiveTab('plating'); }}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 10,
            border: activeTab === 'plating' ? '1.5px solid #E11D48' : '1px solid #FBCFE8',
            background: activeTab === 'plating' ? '#FFF1F2' : '#F8FAFC',
            color: activeTab === 'plating' ? '#BE123C' : '#64748B',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          🍽️ 플레이팅 받침대
        </button>

        <button
          onClick={() => { playDessertAsmr('wax-pop'); setActiveTab('presets'); }}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 10,
            border: activeTab === 'presets' ? '1.5px solid #E11D48' : '1px solid #FBCFE8',
            background: activeTab === 'presets' ? '#FFF1F2' : '#F8FAFC',
            color: activeTab === 'presets' ? '#BE123C' : '#64748B',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          👗 코디 프리셋
        </button>
      </div>

      {/* 4. 컨텐츠 바디 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', paddingBottom: 80 }}>
        {/* A. 7칸 장식 슬롯 탭 */}
        {activeTab === 'slots' && (
          <div>
            {/* 슬롯 칩 가로 스크롤 */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {SLOTS_META.map((s) => {
                const isSelected = activeSlot === s.slot
                const isEquipped = !!currentDeco[s.slot]
                return (
                  <button
                    key={s.slot}
                    onClick={() => { playDessertAsmr('wax-pop'); setActiveSlot(s.slot); }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 12,
                      border: isSelected ? '1.5px solid #E11D48' : '1px solid #E2E8F0',
                      background: isSelected ? '#FFE4E6' : '#FFFFFF',
                      color: isSelected ? '#BE123C' : '#475569',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                    {isEquipped && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E11D48' }} />}
                  </button>
                )
              })}
            </div>

            {/* 별조각 염색 테마 선택 바 */}
            <div style={{ margin: '8px 0 12px 0', padding: '8px 10px', background: '#FFFFFF', borderRadius: 12, border: '1px solid #FBCFE8' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9D174D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>🎨</span> 별조각 염색 테마
              </div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {DYE_THEMES.map((dye) => {
                  const isDyeActive = (currentDeco.dye ?? 0) === dye.id
                  return (
                    <button
                      key={dye.id}
                      onClick={() => handleSelectDye(dye.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        border: isDyeActive ? '1.5px solid #E11D48' : '1px solid #E2E8F0',
                        background: isDyeActive ? '#FFF1F2' : '#F8FAFC',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: dye.main, border: '1px solid rgba(0,0,0,0.1)' }} />
                      <span>{dye.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 현재 선택된 슬롯의 아이템 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: 8 }}>
              {/* 착용 해제 카드 */}
              <div
                onClick={() => {
                  playDessertAsmr('wax-pop')
                  setCurrentDeco((prev) => ({ ...prev, [activeSlot]: null }))
                }}
                style={{
                  padding: 8,
                  borderRadius: 12,
                  border: currentDeco[activeSlot] === null ? '2px solid #64748B' : '1px solid #E2E8F0',
                  background: currentDeco[activeSlot] === null ? '#F1F5F9' : '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  minHeight: 110,
                }}
              >
                <span style={{ fontSize: 24, marginBottom: 4 }}>🚫</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>장착 안 함</span>
              </div>

              {/* 해당 슬롯의 아이템들 */}
              {DECO_ITEMS.filter((item) => item.slot === activeSlot).map((item) => {
                const isEquipped = currentDeco[activeSlot] === item.id
                const boutiqueItem = BOUTIQUE_FASHION_ITEMS.find((b) => b.id === item.id)
                const isOwned = boutiqueItem?.price === 0 || ownedItems.has(item.id)

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleDecoItem(item)}
                    style={{
                      padding: 8,
                      borderRadius: 12,
                      border: isEquipped
                        ? '2px solid #E11D48'
                        : item.rarity === 'legendary'
                        ? '1.5px solid #F59E0B'
                        : item.rarity === 'rare'
                        ? '1.5px solid #C084FC'
                        : '1px solid #E2E8F0',
                      background: isEquipped
                        ? '#FFF1F2'
                        : item.rarity === 'legendary'
                        ? 'linear-gradient(135deg, #FFFBEB, #FEF3C7)'
                        : item.rarity === 'rare'
                        ? 'linear-gradient(135deg, #FAF5FF, #F3E8FF)'
                        : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      minHeight: 110,
                      position: 'relative',
                      boxShadow: isEquipped ? '0 3px 10px rgba(225, 29, 72, 0.2)' : 'none',
                    }}
                  >
                    {/* 상단 뱃지: 보유/미보유 및 희귀도 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 2 }}>
                      <span
                        className={`rarity-badge-${item.rarity}`}
                        style={{ fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 4 }}
                      >
                        {item.rarity.toUpperCase()}
                      </span>
                      {!isOwned && (
                        <span title="미보유 (피팅 전용)" style={{ fontSize: 9, color: '#94A3B8' }}>🔒</span>
                      )}
                    </div>

                    {/* 아이템 아이콘 */}
                    <div style={{ fontSize: 26, margin: '2px 0' }}>
                      {item.icon}
                    </div>

                    {/* 아이템 이름 */}
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#1E293B', textAlign: 'center', lineHeight: 1.2 }}>
                      {item.name}
                    </div>

                    {/* 상태 라벨 */}
                    <div style={{ fontSize: 9, fontWeight: 700, color: isEquipped ? '#E11D48' : '#64748B', marginTop: 4 }}>
                      {isEquipped ? '착용 중' : isOwned ? '보유 중' : '피팅 전용'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* B. 플레이팅 받침대 탭 */}
        {activeTab === 'plating' && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#831843', marginBottom: 10 }}>
              🍰 시그니처 플레이팅 받침대 선택
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {BOUTIQUE_PLATING_ITEMS.map((item) => {
                const baseId = item.baseId ?? 'nest'
                const isSelected = currentBase === baseId
                const isOwned = item.price === 0 || ownedItems.has(item.id)

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectBase(baseId)}
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      border: isSelected ? '2px solid #E11D48' : '1px solid #E2E8F0',
                      background: isSelected ? '#FFF1F2' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      boxShadow: isSelected ? '0 4px 12px rgba(225, 29, 72, 0.2)' : 'none',
                    }}
                  >
                    {!isOwned && (
                      <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 10 }}>🔒</span>
                    )}
                    <span style={{ fontSize: 32, marginBottom: 6 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#1E293B', textAlign: 'center' }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 10, color: '#64748B', marginTop: 2, textAlign: 'center' }}>
                      {item.desc}
                    </span>
                    <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: isSelected ? '#E11D48' : '#94A3B8' }}>
                      {isSelected ? '선택됨 ✨' : isOwned ? '보유 중' : '미보유'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* C. 코디 프리셋 탭 */}
        {activeTab === 'presets' && (
          <div>
            {/* 추천 프리셋 섹션 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#831843', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>👑</span> 시그니처 추천 코디 (원클릭 피팅)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {RECOMMENDED_PRESETS.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    style={{
                      padding: 10,
                      borderRadius: 14,
                      background: '#FFFFFF',
                      border: '1.5px solid #FBCFE8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(244, 114, 182, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 28 }}>{tmpl.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#831843' }}>{tmpl.name}</div>
                        <div style={{ fontSize: 11, color: '#9D174D', marginTop: 2 }}>{tmpl.desc}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyTemplate(tmpl)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(135deg, #F43F5E, #FB7185)',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      피팅 적용
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 나만의 저장된 프리셋 섹션 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#831843', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>💾</span> 나의 코디 프리셋 ({presets.length}/8)
                </div>
                <button
                  onClick={() => { playDessertAsmr('wax-pop'); setPresetModalOpen(true); }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: '1px solid #E11D48',
                    background: '#FFF1F2',
                    color: '#BE123C',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  + 현재 코디 저장
                </button>
              </div>

              {presets.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', background: '#FFFFFF', borderRadius: 12, border: '1px dashed #FBCFE8', color: '#9D174D', fontSize: 12 }}>
                  아직 저장된 프리셋이 없어요.<br />마음에 드는 코디를 구성한 후 저장해 보세요!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {presets.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: 10,
                        borderRadius: 14,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                          {p.custom.dessertBase ?? '기본 받침'} · 장식 {Object.values(p.custom.decorations ?? {}).filter(Boolean).length}개
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleApplyUserPreset(p)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 8,
                            border: '1px solid #E11D48',
                            background: '#FFF1F2',
                            color: '#BE123C',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          입히기
                        </button>
                        <button
                          onClick={() => handleDeletePreset(p.id, p.name)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 8,
                            border: '1px solid #CBD5E1',
                            background: '#F8FAFC',
                            color: '#64748B',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. 하단 고정 액션 바 */}
      <footer
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1.5px solid #FBCFE8',
          display: 'flex',
          gap: 10,
          zIndex: 20,
        }}
      >
        <button
          onClick={handleResetToInitial}
          style={{
            flex: '0 0 35%',
            padding: '12px 0',
            borderRadius: 14,
            border: '1.5px solid #CBD5E1',
            background: '#F8FAFC',
            color: '#475569',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          원래대로
        </button>

        <button
          onClick={handleApplyToPet}
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>✨</span> 코디 확정 적용
        </button>
      </footer>

      {/* 6. 프리셋 저장 모달 */}
      {presetModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 20,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: 16, fontWeight: 900, color: '#831843' }}>
              💾 코디 프리셋 저장
            </h3>
            <p style={{ margin: '0 0 14px 0', fontSize: 12, color: '#64748B' }}>
              현재 피팅된 장식과 받침대를 프리셋으로 저장합니다. (최대 24자)
            </p>
            <input
              type="text"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              placeholder="예: 발렌타인 러블리 룩"
              maxLength={24}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #FBCFE8',
                fontSize: 13,
                boxSizing: 'border-box',
                outline: 'none',
                marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPresetModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#64748B',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleSavePreset}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: '#E11D48',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. 토스트 알림 */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: 24,
            fontSize: 12,
            fontWeight: 800,
            zIndex: 110,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
            maxWidth: '90%',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
