// M5 장비·강화 화면: 내 펫이 낀 장비 3칸 + 장비 가방 + 장비 상점.
// 장비는 능력치만 바꾼다(외형 꾸미기와 별개). 사기·입기·강화는 모두 서버가 판정하고 화면은 결과만 보여 준다.

import { useEffect, useMemo, useState } from 'react'
import {
  GEAR_DEFS,
  GEAR_ENHANCE,
  GEAR_GRADES,
  GEAR_MAX_LEVEL,
  GEAR_SLOTS,
  STAT_LABEL,
  gearDefById,
  gearStatValue,
  type GearDef,
  type GearStat,
} from '../config/equipment'
import { monsterLook, type MonsterRow } from '../lib/api'
import { buyGear, enhanceGear, equipGear, refreshGear, useGear, type GearItem } from '../lib/gearApi'
import { playDessertAsmr } from '../lib/sound'
import MonsterView from '../monsters/MonsterView'
import { BackIcon } from '../ui/Icons'

interface Props {
  monster: MonsterRow
  coins: number
  onCoins: (n: number) => void
  onBack: () => void
}

type Tab = 'bag' | 'shop'

function statLine(def: GearDef, level: number): string {
  return (Object.keys(def.bonus) as GearStat[])
    .map((k) => `${STAT_LABEL[k]} +${gearStatValue(def.bonus[k] ?? 0, level)}`)
    .join(' · ')
}

export default function GearScreen({ monster, coins, onCoins, onBack }: Props) {
  const gear = useGear()
  const [tab, setTab] = useState<Tab>('bag')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ text: string; kind: 'ok' | 'bad' | 'win' | 'fail' } | null>(null)
  const [fxKey, setFxKey] = useState(0)
  const [maxEnhanceItem, setMaxEnhanceItem] = useState<{ item: GearItem; def: GearDef; level: number } | null>(null)

  useEffect(() => {
    let alive = true
    refreshGear().then((c) => {
      if (alive && c !== undefined) onCoins(c)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function say(text: string, kind: 'ok' | 'bad' | 'win' | 'fail' = 'ok') {
    setToast({ text, kind })
    window.setTimeout(() => setToast(null), 2200)
  }

  const items = gear.items
  const mine = useMemo(() => items.filter((i) => i.monster === monster.id), [items, monster.id])
  const selected = items.find((i) => i.id === selectedId) ?? null
  const selDef = selected ? gearDefById(selected.def) : undefined

  // 이 펫이 장비로 얻는 능력치 합계
  const total = useMemo(() => {
    const sum: Partial<Record<GearStat, number>> = {}
    for (const it of mine) {
      const d = gearDefById(it.def)
      if (!d) continue
      for (const k of Object.keys(d.bonus) as GearStat[]) sum[k] = (sum[k] ?? 0) + gearStatValue(d.bonus[k] ?? 0, it.level)
    }
    return sum
  }, [mine])

  async function run(task: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    try {
      await task()
    } finally {
      setBusy(false)
    }
  }

  const onBuy = (def: GearDef) =>
    run(async () => {
      const r = await buyGear(def.id)
      if (r.coins !== undefined) onCoins(r.coins)
      say(r.message, r.ok ? 'ok' : 'bad')
      if (r.ok) {
        playDessertAsmr('sugar-crack', 1)
        setTab('bag')
      }
    })

  const onEquip = (it: GearItem, on: boolean) =>
    run(async () => {
      const r = await equipGear(it.id, on ? monster.id : null)
      say(r.message, r.ok ? 'ok' : 'bad')
      if (r.ok) playDessertAsmr('mochi-squish', 0)
    })

  const onEnhance = (it: GearItem) =>
    run(async () => {
      const r = await enhanceGear(it.id)
      if (r.coins !== undefined) onCoins(r.coins)
      if (!r.ok) return say(r.message, 'bad')
      setFxKey((k) => k + 1)
      const nextLvl = r.level ?? (it.level + 1)
      if (r.success) {
        // 기본 성공 임팩트 발동
        if (nextLvl >= 10) {
          // 🌟 10강(MAX) 달성 시 화면 중앙 부유 & 시네마틱 황금 광선 임팩트
          const d = gearDefById(it.def)
          if (d) {
            setMaxEnhanceItem({ item: it, def: d, level: nextLvl })
            playDessertAsmr('kataifi-crunch', 4)
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([100, 50, 150, 50, 300])
            }
          }
        } else {
          playDessertAsmr('starlight-ting', 3)
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([60, 40, 90])
          }
        }
      } else {
        playDessertAsmr('jelly-gummy', 0)
      }
      say(r.message, r.success ? 'win' : 'fail')
    })

  const look = monsterLook(monster)
  const shopDefs = GEAR_DEFS.filter((d) => d.price !== null)
  const nextRule = selected && selected.level < GEAR_MAX_LEVEL ? GEAR_ENHANCE[selected.level] : null

  return (
    <main
      className="screen"
      style={{
        padding: '8px 12px calc(8px + env(safe-area-inset-bottom, 0px))',
        gap: 8,
        background: '#FAF6EE',
        position: 'relative',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        
        @keyframes godRaysRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes maxPulse { 0% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.7)); } 50% { transform: scale(1.08); filter: drop-shadow(0 0 35px rgba(255, 179, 0, 1)); } 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.7)); } }
        @keyframes sparkleFloat { 0% { opacity: 0; transform: translateY(10px) scale(0.5); } 50% { opacity: 1; transform: translateY(-10px) scale(1.2); } 100% { opacity: 0; transform: translateY(-25px) scale(0.8); } }
        @keyframes gearWin { 0% { transform: scale(0.6); opacity: 0; } 40% { transform: scale(1.25); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes gearFail { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
        @keyframes gearSpark { 0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .gear-fx { animation: none !important; } }
      `}</style>

      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로" style={{ width: 34, height: 34 }}>
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 15, margin: 0 }}>🥄 장비 · 강화</h1>
        <span className="chip" style={{ fontSize: 12, fontWeight: 900, padding: '3px 9px' }}>🪙 {coins.toLocaleString()}</span>
      </div>

      {/* 내 펫과 장비 3칸 */}
      <div className="card" style={{ padding: '8px 10px', flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 84, flexShrink: 0, textAlign: 'center' }}>
          <MonsterView look={look} size={110} title={monster.name ?? ''} />
          <div style={{ fontSize: 11, fontWeight: 900, color: '#5D4037', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{monster.name}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {GEAR_SLOTS.map((s) => {
              const it = mine.find((i) => gearDefById(i.def)?.slot === s.id)
              const d = it ? gearDefById(it.def) : undefined
              const g = d ? GEAR_GRADES[d.grade] : null
              return (
                <button
                  key={s.id}
                  onClick={() => it && setSelectedId(it.id)}
                  aria-label={`${s.label} 칸`}
                  style={{
                    minHeight: 62,
                    borderRadius: 12,
                    border: `1.5px ${d ? 'solid' : 'dashed'} ${g?.color ?? '#D7CCC8'}`,
                    background: g?.bg ?? '#FFFDF9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    padding: 3,
                    cursor: it ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ fontSize: 22, opacity: d ? 1 : 0.35 }}>{d?.icon ?? s.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 900, color: g?.color ?? '#A1887F' }}>
                    {d ? `${d.name}${it && it.level > 0 ? ` +${it.level}` : ''}` : s.label}
                  </span>
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: '#6D4C41', lineHeight: 1.4 }}>
            {Object.keys(total).length === 0
              ? '장비를 끼면 능력치가 올라가요'
              : (Object.keys(total) as GearStat[]).map((k) => `${STAT_LABEL[k]} +${total[k]}`).join(' · ')}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {(['bag', 'shop'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: 12,
              border: 'none',
              fontSize: 13,
              fontWeight: 900,
              cursor: 'pointer',
              color: tab === t ? '#FFFFFF' : '#6D4C41',
              background: tab === t ? 'linear-gradient(180deg, #FF8A65, #E64A19)' : '#F1E7D8',
              boxShadow: tab === t ? '0 3px 0 #BF360C' : 'none',
            }}
          >
            {t === 'bag' ? `🎒 장비 가방 (${items.length})` : '🛒 장비 상점'}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignContent: 'start', paddingBottom: selected && tab === 'bag' ? 150 : 4 }}>
        {tab === 'bag' && items.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '26px 8px', fontSize: 13, fontWeight: 800, color: '#8D6E63', lineHeight: 1.6 }}>
            아직 장비가 없어요.<br />상점에서 사거나, 디저트 타워 5층마다 있는 보스 층에서 얻을 수 있어요.
          </div>
        )}
        {tab === 'bag' &&
          items.map((it) => {
            const d = gearDefById(it.def)
            if (!d) return null
            const g = GEAR_GRADES[d.grade]
            const onMe = it.monster === monster.id
            const other = it.monster && !onMe
            return (
              <button
                key={it.id}
                onClick={() => setSelectedId(it.id)}
                style={{
                  textAlign: 'left',
                  padding: '8px 9px',
                  borderRadius: 14,
                  border: `2px solid ${selectedId === it.id ? '#FF7A59' : g.color}`,
                  background: g.bg,
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: 26, flexShrink: 0 }}>{d.icon}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 900, color: '#3E2723', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.name}{it.level > 0 ? ` +${it.level}` : ''}
                  </span>
                  <span style={{ display: 'block', fontSize: 10, fontWeight: 800, color: g.color }}>
                    {g.label}{onMe ? ' · 착용 중' : other ? ' · 다른 펫' : ''}
                  </span>
                </span>
              </button>
            )
          })}
        {tab === 'shop' &&
          shopDefs.map((d) => {
            const g = GEAR_GRADES[d.grade]
            const afford = coins >= (d.price ?? 0)
            return (
              <div key={d.id} style={{ padding: 9, borderRadius: 14, border: `2px solid ${g.color}`, background: g.bg, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <span style={{ fontSize: 26 }}>{d.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#3E2723' }}>{d.name}</span>
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#6D4C41' }}>{statLine(d, 0)}</div>
                <div style={{ fontSize: 10, color: '#8D6E63', lineHeight: 1.35 }}>{d.desc}</div>
                <button
                  onClick={() => onBuy(d)}
                  disabled={busy || !afford}
                  style={{
                    minHeight: 40,
                    borderRadius: 11,
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 900,
                    color: '#FFFFFF',
                    cursor: afford ? 'pointer' : 'not-allowed',
                    background: afford ? 'linear-gradient(180deg, #FFB74D, #F57C00)' : '#BCAAA4',
                    boxShadow: afford ? '0 3px 0 #E65100' : 'none',
                  }}
                >
                  🪙 {d.price} 사기
                </button>
              </div>
            )
          })}
        {tab === 'shop' && (
          <div style={{ gridColumn: '1 / -1', fontSize: 11, fontWeight: 800, color: '#8D6E63', textAlign: 'center', padding: '6px 4px' }}>
            고급 이상 장비는 디저트 타워 보스 층(5층마다)에서만 나와요.
          </div>
        )}
      </div>

      
      {/* 🌟 10강(MAX) 극한 돌파 시네마틱 중앙 부유 임팩트 오버레이 */}
      {maxEnhanceItem && (
        <div
          onClick={() => setMaxEnhanceItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 10, 8, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {/* 뒤쪽 회전하는 황금 신의 광선 (God-rays) */}
          <div
            style={{
              position: 'absolute',
              width: 460,
              height: 460,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.45) 0%, rgba(255, 160, 0, 0.18) 45%, transparent 70%)',
              animation: 'godRaysRotate 12s linear infinite',
              pointerEvents: 'none',
            }}
          />

          {/* 중앙 부유하는 10강 장비 카드 */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              animation: 'maxPulse 2.4s ease-in-out infinite',
            }}
          >
            {/* 타이틀 배너 */}
            <div
              style={{
                background: 'linear-gradient(90deg, #FFD700, #FF6F00, #FFD700)',
                backgroundSize: '200% auto',
                color: '#3E2723',
                padding: '6px 20px',
                borderRadius: 999,
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: '0.5px',
                boxShadow: '0 4px 20px rgba(255, 215, 0, 0.8)',
                textAlign: 'center',
              }}
            >
              🌟 MAX +10강 극한 돌파 성공! 🌟
            </div>

            {/* 거대 장비 아이콘 및 오라 서클 */}
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 36,
                background: 'linear-gradient(135deg, #FFF8E1 0%, #FFE082 50%, #FFB300 100%)',
                border: '4px solid #FFFFFF',
                boxShadow: '0 10px 40px rgba(255, 179, 0, 0.9), inset 0 0 20px rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 68,
              }}
            >
              {maxEnhanceItem.def.icon}
            </div>

            {/* 장비 명칭 및 강화 수치 */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#FFFFFF', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                {maxEnhanceItem.def.name} <span style={{ color: '#FFD700' }}>+10</span>
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#FFE082', fontWeight: 800 }}>
                {statLine(maxEnhanceItem.def, 10)}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                디저트 펫에게 장착하면 궁극의 파티세리 능력을 발휘합니다!
              </p>
            </div>

            {/* 확인 닫기 버튼 */}
            <button
              onClick={() => setMaxEnhanceItem(null)}
              style={{
                marginTop: 10,
                padding: '12px 36px',
                borderRadius: 16,
                border: 'none',
                background: 'linear-gradient(180deg, #FFB300, #F57C00)',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 124, 0, 0.6)',
                transition: 'transform 0.1s',
              }}
            >
              ✨ 완벽해요! 확인
            </button>
          </div>
        </div>
      )}

      {/* 선택한 장비 상세 + 착용·강화 */}
      {selected && selDef && tab === 'bag' && (
        <div
          key={`${selected.id}-${fxKey}`}
          className="card gear-fx"
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
            padding: '10px 12px',
            zIndex: 20,
            border: `2px solid ${GEAR_GRADES[selDef.grade].color}`,
            background: '#FFFFFF',
            boxShadow: '0 -6px 18px rgba(0,0,0,0.12)',
            animation: toast?.kind === 'fail' ? 'gearFail 0.4s ease-out' : toast?.kind === 'win' ? 'gearWin 0.5s ease-out' : undefined,
          }}
        >
          {toast?.kind === 'win' && (
            <span className="gear-fx" style={{ position: 'absolute', left: '50%', top: '30%', fontSize: 44, animation: 'gearSpark 0.7s ease-out both', pointerEvents: 'none' }}>✨</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32 }}>{selDef.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#3E2723' }}>
                {selDef.name} {selected.level > 0 ? `+${selected.level}` : ''}
                <span style={{ marginLeft: 6, fontSize: 11, color: GEAR_GRADES[selDef.grade].color }}>{GEAR_GRADES[selDef.grade].label}</span>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#6D4C41' }}>{statLine(selDef, selected.level)}</div>
              {nextRule && (
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#8D6E63' }}>
                  다음 +{selected.level + 1}: 성공 {nextRule.chance}% · 🪙 {nextRule.cost} (실패해도 단계 유지)
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => onEquip(selected, selected.monster !== monster.id)}
              disabled={busy}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: 13,
                border: 'none',
                fontSize: 14,
                fontWeight: 900,
                color: '#FFFFFF',
                cursor: 'pointer',
                background: selected.monster === monster.id ? 'linear-gradient(180deg, #A1887F, #6D4C41)' : 'linear-gradient(180deg, #4DB6AC, #00897B)',
                boxShadow: selected.monster === monster.id ? '0 4px 0 #4E342E' : '0 4px 0 #00695C',
              }}
            >
              {selected.monster === monster.id ? '벗기' : '착용하기'}
            </button>
            <button
              onClick={() => onEnhance(selected)}
              disabled={busy || !nextRule || coins < (nextRule?.cost ?? 0)}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: 13,
                border: 'none',
                fontSize: 14,
                fontWeight: 900,
                color: '#FFFFFF',
                cursor: nextRule && coins >= nextRule.cost ? 'pointer' : 'not-allowed',
                background: nextRule && coins >= nextRule.cost ? 'linear-gradient(180deg, #FF8A65, #E64A19)' : '#BCAAA4',
                boxShadow: nextRule && coins >= nextRule.cost ? '0 4px 0 #BF360C' : 'none',
              }}
            >
              {nextRule ? '⚒️ 강화하기' : '최대 단계'}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: 56,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            maxWidth: '90%',
            padding: '8px 14px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 900,
            color: '#FFFFFF',
            background: toast.kind === 'bad' ? '#C62828' : toast.kind === 'fail' ? '#6D4C41' : toast.kind === 'win' ? '#F57C00' : '#2E7D32',
            boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
          }}
        >
          {toast.text}
        </div>
      )}
    </main>
  )
}
