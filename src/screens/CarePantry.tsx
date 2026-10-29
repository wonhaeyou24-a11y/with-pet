// M2 화면 1: 🍓 디저트 돌보기 & 토핑 가방·베이커리 상점 (원스크린 100dvh 무스크롤 덱 레이아웃)
// 당충전(배고픔)·달콤함(기분)·노곤함(피로)·슈가윤기(청결) 4대 상태를 한눈에 관리하고,
// 3×3 그리드 토핑 가방과 베이커리 상점을 스크롤 없이 한 화면에서 조작합니다.

import { useRef, useState } from 'react'
import { CARE_ACTIONS, CARE_STATUS_INFO, DESSERT_FOODS, expForNextLevel } from '../config/care'
import { personalityLabel, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { callCare } from '../lib/careApi'
import { getSpeciesSoundKind, playDessertAsmr, type DessertSoundKind } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { BackIcon } from '../ui/Icons'
import { getSensoryReactionClass, SensoryBurst } from '../ui/SensoryFx'

interface Props {
  monster: MonsterRow
  coins: number
  foodBag: Record<string, number>
  onUpdate: (nextMonster: MonsterRow, nextCoins: number, nextBag: Record<string, number>) => void
  onBack: () => void
}

type PantryTab = 'bag' | 'care' | 'shop'

export default function CarePantry({ monster, coins, foodBag, onUpdate, onBack }: Props) {
  const [tab, setTab] = useState<PantryTab>('bag')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [asmrBubble, setAsmrBubble] = useState<string | null>(null)
  const [activeSoundKind, setActiveSoundKind] = useState<DessertSoundKind>(() =>
    getSpeciesSoundKind(monsterLook(monster).mallang?.morphForm ?? monster.species, monsterLook(monster).mallang?.dessertBase),
  )
  const [burstKey, setBurstKey] = useState<number>(0)
  const [combo, setCombo] = useState<number>(1)
  const lastTouchRef = useRef<number>(0)
  const [levelUpBanner, setLevelUpBanner] = useState(false)

  const look = monsterLook(monster)
  const activeSpecies = look.mallang?.morphForm ?? monster.species
  const info = SPECIES_INFO[activeSpecies] ?? SPECIES_INFO[monster.species]

  const recentFoods = monster.recent_foods ?? []
  const uniqueRecentCount = new Set(recentFoods.slice(-3)).size
  const hasVarietyBonus = uniqueRecentCount >= 3

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

  function showMessage(msg: string, leveledUp?: boolean) {
    setToast(msg)
    if (leveledUp) {
      setLevelUpBanner(true)
      setTimeout(() => setLevelUpBanner(false), 3800)
    }
    setTimeout(() => setToast(null), 3200)
  }

  async function handleFeed(foodId: string, asmr: DessertSoundKind) {
    if (busy) return
    setBusy(true)
    triggerAsmr(asmr)
    const res = await callCare(monster, coins, 'feed', { foodId })
    setBusy(false)
    if (res.ok && res.monster && res.foodBag !== undefined && res.coins !== undefined) {
      onUpdate(res.monster, res.coins, res.foodBag)
    }
    if (res.message) showMessage(res.message, res.leveledUp)
  }

  async function handleCareAction(kind: 'play' | 'clean' | 'rest', asmr: DessertSoundKind) {
    if (busy) return
    setBusy(true)
    triggerAsmr(asmr)
    const res = await callCare(monster, coins, 'care_action', { kind })
    setBusy(false)
    if (res.ok && res.monster && res.foodBag !== undefined && res.coins !== undefined) {
      onUpdate(res.monster, res.coins, res.foodBag)
    }
    if (res.message) showMessage(res.message, res.leveledUp)
  }

  async function handleBuyFood(foodId: string, asmr: DessertSoundKind) {
    if (busy) return
    setBusy(true)
    triggerAsmr(asmr)
    const res = await callCare(monster, coins, 'buy_food', { foodId })
    setBusy(false)
    if (res.ok && res.foodBag !== undefined && res.coins !== undefined) {
      onUpdate(res.monster ?? monster, res.coins, res.foodBag)
    }
    if (res.message) showMessage(res.message)
  }

  const nextExp = expForNextLevel(monster.level)
  const curExp = monster.exp ?? 0
  const expPct = Math.min(100, Math.round((curExp / nextExp) * 100))

  return (
    <main className="screen">
      {/* 상단 헤더 */}
      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 17 }}>🍓 디저트 돌보기 & 토핑 가방</h1>
        <span className="chip honey" style={{ fontWeight: 800, fontSize: 12 }}>
          🪙 {coins} 코인
        </span>
      </div>

      {/* 상단 3D 캐릭터 스테이지 & 4대 상태 요약 카드 */}
      <div className="card" style={{ padding: '10px 12px', gap: 6, flexShrink: 0 }}>
        <div className="row wrap between" style={{ gap: 4 }}>
          <div className="row wrap" style={{ gap: 4 }}>
            <span className="chip coral" style={{ fontSize: 12, padding: '3px 8px' }}>
              Lv.{monster.level} {monster.name}
            </span>
            <span className="chip" style={{ fontSize: 12, padding: '3px 8px' }}>
              {personalityLabel(monster.personality_active, monster.personality_bond)}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#8D5524' }}>
            EXP {curExp}/{nextExp} ({expPct}%)
          </span>
        </div>

        {/* 3D 인터랙티브 스테이지 */}
        <div
          className="stage"
          style={{ alignItems: 'center', position: 'relative', cursor: 'pointer', height: 152, minHeight: 152, padding: 2 }}
          onClick={() => triggerAsmr(getSpeciesSoundKind(activeSpecies, look.mallang?.dessertBase))}
        >
          <SensoryBurst kind={activeSoundKind} triggerKey={burstKey} bubble={asmrBubble} combo={combo} />
          <div
            key={`care-react-${burstKey}`}
            className={burstKey > 0 ? getSensoryReactionClass(activeSoundKind) : ''}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <MonsterView look={look} size={146} title={info?.name} />
          </div>
        </div>

        {/* 4대 디저트 컨디션 4열 컴팩트 게이지 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 5 }}>
          {CARE_STATUS_INFO.map((st) => {
            const val = Number(monster[st.key] ?? (st.key === 'fatigue' ? 0 : 80))
            const isWarn = st.invertWarning ? val >= 80 : val <= 25
            return (
              <div
                key={st.key}
                style={{
                  padding: '5px 4px',
                  borderRadius: 12,
                  background: isWarn ? '#FFF0EE' : '#FFFBF2',
                  border: isWarn ? '1.5px solid #FF8A65' : '1px solid #F0DFB8',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: isWarn ? '#D9534F' : '#3B2F2F', marginBottom: 3, whiteSpace: 'nowrap' }}>
                  {st.icon} {st.label.slice(0, 3)} {val}
                </div>
                <div style={{ height: 6, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, val))}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: st.color,
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* 입맛 & 토스트 배너 한 줄 */}
        {levelUpBanner || toast ? (
          <div
            style={{
              padding: '5px 10px',
              borderRadius: 10,
              background: levelUpBanner ? 'linear-gradient(90deg, #FF8A65 0%, #FFB74D 100%)' : '#FFF5EB',
              border: levelUpBanner ? 'none' : '1.5px solid #FF8A65',
              color: levelUpBanner ? '#FFFFFF' : '#3B2F2F',
              fontSize: 12,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {levelUpBanner
              ? `🎉 레벨 업! Lv.${monster.level} 성장! (전 능력치 +1 & SP +1)`
              : toast}
          </div>
        ) : (
          <div className="row wrap between" style={{ gap: 4 }}>
            <span className="chip" style={{ fontSize: 12, padding: '2px 8px', background: '#FFF2EC', color: '#D85A3A', fontWeight: 800 }}>
              💖 최애: {monster.discovered_fav ? monster.fav_food : '??? (먹여보면 발견!)'}
            </span>
            <span
              className="chip"
              style={{
                fontSize: 12,
                padding: '2px 8px',
                background: hasVarietyBonus ? '#E8F8F0' : '#F6F2EA',
                color: hasVarietyBonus ? '#177051' : '#7A6A60',
                fontWeight: 800,
              }}
            >
              🌈 골고루 보너스: {hasVarietyBonus ? '발동 중! (+1)' : `${uniqueRecentCount}/3종`}
            </span>
          </div>
        )}
      </div>

      {/* 하단 원스크린 탭 덱: 내 토핑 가방(3×3) / 돌보기 3종 / 베이커리 상점(3×3) */}
      <div className="card deck-card" style={{ padding: '10px 12px', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setTab('bag')}
            style={{
              padding: '8px 6px',
              borderRadius: 12,
              border: tab === 'bag' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: tab === 'bag' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🍓 토핑 가방
          </button>
          <button
            onClick={() => setTab('care')}
            style={{
              padding: '8px 6px',
              borderRadius: 12,
              border: tab === 'care' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: tab === 'care' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🎈 돌보기 3종
          </button>
          <button
            onClick={() => setTab('shop')}
            style={{
              padding: '8px 6px',
              borderRadius: 12,
              border: tab === 'shop' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: tab === 'shop' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🏪 베이커리 상점
          </button>
        </div>

        {/* 탭 1: 내 토핑 가방 (10종 2×5 한눈에 보기) */}
        {tab === 'bag' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, flex: 1, alignContent: 'space-between' }}>
            {DESSERT_FOODS.map((food) => {
              const count = foodBag[food.id] ?? 0
              const isFav = monster.discovered_fav && monster.fav_food === food.id
              return (
                <button
                  key={food.id}
                  disabled={busy}
                  onClick={() => (count > 0 ? handleFeed(food.id, food.asmr) : setTab('shop'))}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 12,
                    border: isFav ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                    background: count > 0 ? '#FFFFFF' : '#FAF6EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    opacity: count > 0 ? 1 : 0.72,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{food.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {food.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#177051', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      +{food.hunger}당 · ×{count}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 7px',
                      borderRadius: 8,
                      background: count > 0 ? '#FF7A59' : '#6ED6B2',
                      color: count > 0 ? '#FFFFFF' : '#133A2B',
                      fontSize: 12,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {count > 0 ? '먹이기' : '상점'}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* 탭 2: 돌보기 3종 (놀아주기 / 윤기내기 / 휴식) */}
        {tab === 'care' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, justifyContent: 'space-between' }}>
            {CARE_ACTIONS.map((act) => (
              <div
                key={act.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 16,
                  border: '1.5px solid #F0DFB8',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flex: 1,
                }}
              >
                <span style={{ fontSize: 28 }}>{act.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#3B2F2F' }}>{act.name}</div>
                  <div style={{ fontSize: 12, color: '#D85A3A', fontWeight: 800, marginTop: 1 }}>
                    {act.effectLabel} · +{act.coinReward} 코인
                  </div>
                  <div style={{ fontSize: 12, color: '#7A6A60', marginTop: 1 }}>{act.desc}</div>
                </div>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => handleCareAction(act.id, act.asmr)}
                  style={{ padding: '8px 12px', fontSize: 12, flexShrink: 0 }}
                >
                  실행
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 탭 3: 베이커리 토핑 상점 (10종 2×5 그리드) */}
        {tab === 'shop' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, flex: 1, alignContent: 'space-between' }}>
            {DESSERT_FOODS.map((food) => {
              const count = foodBag[food.id] ?? 0
              const canAfford = coins >= food.price
              return (
                <button
                  key={food.id}
                  disabled={busy || !canAfford}
                  onClick={() => handleBuyFood(food.id, food.asmr)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 12,
                    border: '1.5px solid #F0DFB8',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    opacity: canAfford ? 1 : 0.55,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{food.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {food.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#7A6A60', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      보유 ×{count}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 7px',
                      borderRadius: 8,
                      background: canAfford ? '#FFE3A0' : '#EFE9DC',
                      color: '#3B2F2F',
                      fontSize: 12,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    🪙{food.price}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
