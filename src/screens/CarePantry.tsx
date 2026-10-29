// M2 화면 1: 🍓 디저트 돌보기 & 토핑 가방·베이커리 상점
// 당충전(배고픔)·달콤함(기분)·노곤함(피로)·슈가윤기(청결) 4대 상태를 관리하고,
// 가방의 디저트 토핑을 먹이거나 베이커리 상점에서 코인으로 토핑을 구매합니다.

import { useRef, useState } from 'react'
import { CARE_ACTIONS, CARE_STATUS_INFO, DESSERT_FOODS, expForNextLevel } from '../config/care'
import { personalityLabel, SPECIES_INFO } from '../config/species'
import { monsterLook, type MonsterRow } from '../lib/api'
import { callCare } from '../lib/careApi'
import { getSpeciesSoundKind, playDessertAsmr, type DessertSoundKind } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { BackIcon } from '../ui/Icons'
import { Nest } from '../ui/parts'
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
    setTimeout(() => setToast(null), 3400)
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
      <div className="row between">
        <button className="btn-round" onClick={onBack} aria-label="뒤로">
          <BackIcon />
        </button>
        <h1 className="title">🍓 디저트 돌보기 & 토핑 가방</h1>
        <span className="chip honey" style={{ fontWeight: 800 }}>
          🪙 {coins} 코인
        </span>
      </div>

      {/* 레벨업 축하 배너 */}
      {levelUpBanner && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 18,
            background: 'linear-gradient(90deg, #FF8A65 0%, #FFB74D 100%)',
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: 13,
            textAlign: 'center',
            boxShadow: '0 6px 18px rgba(255, 138, 101, 0.35)',
          }}
        >
          🎉 레벨 업! [{monster.name}] 친구가 Lv.{monster.level} 디저트로 성장했어요! (전 능력치 상승 & SP +1)
        </div>
      )}

      {/* 상단 캐릭터 스테이지 & 4대 상태 게이지 카드 */}
      <div className="card" style={{ paddingBottom: 14 }}>
        <div className="row wrap between" style={{ gap: 6 }}>
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="chip coral">Lv.{monster.level} {monster.name}</span>
            <span className="chip">{personalityLabel(monster.personality_active, monster.personality_bond)}</span>
          </div>
          <span className="small" style={{ fontWeight: 800, color: '#8D5524' }}>
            경험치 {curExp}/{nextExp} ({expPct}%)
          </span>
        </div>

        <div
          className="stage"
          style={{ alignItems: 'center', position: 'relative', cursor: 'pointer', minHeight: 165 }}
          onClick={() => triggerAsmr(getSpeciesSoundKind(activeSpecies, look.mallang?.dessertBase))}
        >
          <SensoryBurst kind={activeSoundKind} triggerKey={burstKey} bubble={asmrBubble} combo={combo} />
          <div
            key={`care-react-${burstKey}`}
            className={burstKey > 0 ? getSensoryReactionClass(activeSoundKind) : ''}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <MonsterView look={look} size={160} title={info?.name} />
          </div>
          <Nest width={190} lift={32} front={false} dessertBase={look.mallang?.dessertBase} />
        </div>

        {/* 4대 디저트 컨디션 막대 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 4 }}>
          {CARE_STATUS_INFO.map((st) => {
            const val = Number(monster[st.key] ?? (st.key === 'fatigue' ? 0 : 80))
            const isWarn = st.invertWarning ? val >= 80 : val <= 25
            return (
              <div
                key={st.key}
                style={{
                  padding: '8px 10px',
                  borderRadius: 16,
                  background: isWarn ? '#FFF0EE' : '#FFFBF2',
                  border: isWarn ? '1.5px solid #FF8A65' : '1.5px solid #F0DFB8',
                }}
              >
                <div className="row between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#3B2F2F' }}>
                    {st.icon} {st.label} <span style={{ fontSize: 10, color: '#7A6A60' }}>({st.subLabel})</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: isWarn ? '#D9534F' : '#3B2F2F' }}>
                    {val}/100
                  </span>
                </div>
                <div style={{ height: 9, borderRadius: 999, background: '#F5E8C9', overflow: 'hidden' }}>
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

        {/* 입맛(최애/기피 토핑) & 골고루 먹기 보너스 안내 칩 */}
        <div className="row wrap between" style={{ marginTop: 6, gap: 6 }}>
          <span className="chip" style={{ fontSize: 11, background: '#FFF2EC', color: '#D85A3A', fontWeight: 800 }}>
            💖 최애 토핑: {monster.discovered_fav ? monster.fav_food : '??? (먹여보면 발견!)'}
          </span>
          <span
            className="chip"
            style={{
              fontSize: 11,
              background: hasVarietyBonus ? '#E8F8F0' : '#F6F2EA',
              color: hasVarietyBonus ? '#177051' : '#7A6A60',
              fontWeight: 800,
            }}
          >
            🌈 골고루 보너스: {hasVarietyBonus ? '발동 중! (훈련 +1)' : `${uniqueRecentCount}/3종`}
          </span>
        </div>

        {toast && (
          <div
            style={{
              marginTop: 6,
              padding: '9px 12px',
              borderRadius: 14,
              background: '#FFF5EB',
              border: '1.5px solid #FF8A65',
              color: '#3B2F2F',
              fontSize: 12,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {toast}
          </div>
        )}
      </div>

      {/* 하단 3대 탭: 내 토핑 가방 / 돌보기 3종 / 베이커리 상점 */}
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <button
            onClick={() => setTab('bag')}
            style={{
              padding: '10px 6px',
              borderRadius: 14,
              border: tab === 'bag' ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
              background: tab === 'bag' ? '#FFF2EC' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              color: '#3B2F2F',
              cursor: 'pointer',
            }}
          >
            🍓 내 토핑 가방
          </button>
          <button
            onClick={() => setTab('care')}
            style={{
              padding: '10px 6px',
              borderRadius: 14,
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
              padding: '10px 6px',
              borderRadius: 14,
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

        {/* 탭 1: 내 토핑 가방 */}
        {tab === 'bag' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="small">
              가방에 있는 달콤한 토핑을 골라 먹여 주세요. <strong>최애 토핑</strong>을 맞히면 회복 효과가 <strong>1.5배</strong>가 돼요!
            </p>
            {DESSERT_FOODS.map((food) => {
              const count = foodBag[food.id] ?? 0
              const isFav = monster.discovered_fav && monster.fav_food === food.id
              return (
                <div
                  key={food.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 18,
                    border: isFav ? '2px solid #FF7A59' : '1.5px solid #F0DFB8',
                    background: count > 0 ? '#FFFFFF' : '#FAF6EE',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    opacity: count > 0 ? 1 : 0.72,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{food.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="row wrap" style={{ gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#3B2F2F' }}>{food.name}</span>
                      <span className="chip" style={{ fontSize: 10, padding: '2px 7px' }}>
                        보유 {count}개
                      </span>
                      {isFav && (
                        <span className="chip coral" style={{ fontSize: 10, padding: '2px 7px' }}>
                          💖 최애 토핑!
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#D85A3A', fontWeight: 700, marginTop: 2 }}>
                      당충전 +{food.hunger} · 달콤함 +{food.mood} · {food.tag}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#7A6A60', marginTop: 2 }}>{food.desc}</div>
                  </div>
                  {count > 0 ? (
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={() => handleFeed(food.id, food.asmr)}
                      style={{ padding: '8px 12px', fontSize: 12 }}
                    >
                      🥄 먹이기
                    </button>
                  ) : (
                    <button
                      className="btn mint"
                      disabled={busy}
                      onClick={() => setTab('shop')}
                      style={{ padding: '8px 10px', fontSize: 11 }}
                    >
                      상점 가기
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 탭 2: 돌보기 3종 (놀아주기 / 윤기내기 / 휴식) */}
        {tab === 'care' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p className="small">
              디저트 친구와 놀아주거나 슈가 코팅 윤기를 내주면 달콤함과 청결이 오르고 <strong>베이커리 코인</strong>도 얻어요!
            </p>
            {CARE_ACTIONS.map((act) => (
              <div
                key={act.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 18,
                  border: '1.5px solid #F0DFB8',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 30 }}>{act.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#3B2F2F' }}>{act.name}</div>
                  <div style={{ fontSize: 11, color: '#D85A3A', fontWeight: 800, marginTop: 2 }}>
                    {act.effectLabel} · +{act.coinReward} 코인
                  </div>
                  <div style={{ fontSize: 11, color: '#7A6A60', marginTop: 2 }}>{act.desc}</div>
                </div>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => handleCareAction(act.id, act.asmr)}
                  style={{ padding: '9px 14px', fontSize: 12 }}
                >
                  실행하기
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 탭 3: 베이커리 토핑 상점 */}
        {tab === 'shop' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="row between">
              <span className="small" style={{ fontWeight: 700 }}>
                🍰 파티세리 베이커리 상점 (매일 무료 슈가파우더 2개 자동 지급!)
              </span>
              <span className="chip honey" style={{ fontSize: 11, fontWeight: 800 }}>
                보유 🪙 {coins}
              </span>
            </div>
            {DESSERT_FOODS.map((food) => {
              const count = foodBag[food.id] ?? 0
              const canAfford = coins >= food.price
              return (
                <div
                  key={food.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 18,
                    border: '1.5px solid #F0DFB8',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 26 }}>{food.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="row wrap" style={{ gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#3B2F2F' }}>{food.name}</span>
                      <span className="chip" style={{ fontSize: 10, padding: '2px 7px' }}>
                        가방 {count}개
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#177051', fontWeight: 700, marginTop: 2 }}>
                      당충전 +{food.hunger} · 달콤함 +{food.mood} · {food.tag}
                    </div>
                  </div>
                  <button
                    className="btn"
                    disabled={busy || !canAfford}
                    onClick={() => handleBuyFood(food.id, food.asmr)}
                    style={{ padding: '8px 12px', fontSize: 12 }}
                  >
                    🪙 {food.price} 구매
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

