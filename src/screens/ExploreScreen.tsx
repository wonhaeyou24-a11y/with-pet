// M5 탐험 화면: 지역·구역·시간을 골라 펫을 보내 놓고, 시간이 지나면 돌아와 보상과 탐험 일지를 받는다.
// 출발·복귀·결과는 모두 서버(care 함수)가 서버 시각으로 판정한다.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { gearDefById, gearStatValue, GEAR_GRADES, type GearStat } from '../config/equipment'
import {
  EXPLORE,
  effectivePower,
  isRegionOpen,
  recommendedPower,
  REGIONS,
  regionById,
  tierOf,
  type Region,
  type TripTier,
} from '../config/explore'
import { serverNow, type MonsterRow, type Stats } from '../lib/api'
import { exploreFinish, exploreStart, exploreState, type ExploreFinish, type ExploreState } from '../lib/exploreApi'
import { refreshGear, useGear } from '../lib/gearApi'
import { playDessertAsmr } from '../lib/sound'
import { BackIcon } from '../ui/Icons'

interface Props {
  monster: MonsterRow
  coins: number
  onUpdate: (nextMonster: MonsterRow, nextCoins: number, nextBag: Record<string, number>) => void
  onGoRest: () => void
  onBack: () => void
}

const TIER_INFO: Record<TripTier, { label: string; color: string; emoji: string }> = {
  great: { label: '대성공', color: '#F57C00', emoji: '🌟' },
  success: { label: '성공', color: '#2E7D32', emoji: '🎉' },
  struggle: { label: '고전', color: '#6D4C41', emoji: '😅' },
  retreat: { label: '중도 귀환', color: '#8D6E63', emoji: '🏃' },
}

const fmt = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}시간 ${m}분` : m > 0 ? `${m}분 ${s % 60}초` : `${s}초`
}

export default function ExploreScreen({ monster, coins, onUpdate, onGoRest, onBack }: Props) {
  const gear = useGear()
  const [st, setSt] = useState<ExploreState | null>(null)
  const [regionId, setRegionId] = useState<string>(REGIONS[0].id)
  const [zone, setZone] = useState(1)
  const [hours, setHours] = useState<number>(EXPLORE.hours[1])
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [done, setDone] = useState<ExploreFinish | null>(null)
  const [now, setNow] = useState(() => serverNow())

  const load = useCallback(async () => {
    setSt(await exploreState(monster.id))
  }, [monster.id])

  useEffect(() => {
    void load()
    void refreshGear()
  }, [load])

  useEffect(() => {
    const id = window.setInterval(() => setNow(serverNow()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const say = (t: string) => {
    setToast(t)
    window.setTimeout(() => setToast(null), 2400)
  }

  const progress = st?.progress ?? {}
  const region = regionById(regionId) as Region
  const open = isRegionOpen(region, { level: monster.level, evoStage: monster.evo_stage ?? 1 })
  const cleared = progress[regionId] ?? 0

  // 장착한 장비가 더해 주는 능력치까지 넣은 내 전투력
  const myPower = useMemo(() => {
    const sum: Stats = { ...monster.stats }
    for (const it of gear.items) {
      if (it.monster !== monster.id) continue
      const d = gearDefById(it.def)
      if (!d) continue
      for (const k of Object.keys(d.bonus) as GearStat[]) sum[k] = (sum[k] ?? 0) + gearStatValue(d.bonus[k] ?? 0, it.level)
    }
    return effectivePower(region, sum, monster.element)
  }, [gear.items, monster, region])

  const need = recommendedPower(region, zone)
  const forecast = tierOf(myPower / need)
  const trip = st?.trip ?? null
  const tripRegion = trip ? regionById(trip.region) : undefined
  const left = trip ? Math.max(0, (Date.parse(trip.finishAt) - now) / 1000) : 0
  const total = trip ? Math.max(1, (Date.parse(trip.finishAt) - Date.parse(trip.startedAt)) / 1000) : 1
  const fatigue = monster.fatigue ?? 0

  async function start() {
    if (busy) return
    setBusy(true)
    const r = await exploreStart(monster, regionId, zone, hours)
    setBusy(false)
    if (!r.ok) return say(r.message ?? '잠시 후 다시 해 주세요.')
    playDessertAsmr('mochi-squish', 0)
    say(`${region.icon} ${region.name} ${zone}구역으로 출발!`)
    await load()
  }

  async function finish() {
    if (busy) return
    setBusy(true)
    const r = await exploreFinish(monster)
    setBusy(false)
    if (!r.ok) {
      say(r.message ?? '잠시 후 다시 해 주세요.')
      return load()
    }
    if (r.monster) onUpdate(r.monster, r.coins ?? coins, r.foodBag ?? {})
    playDessertAsmr(r.result && (r.result.tier === 'great' || r.result.tier === 'success') ? 'starlight-ting' : 'jelly-gummy', 2)
    setDone(r)
    await Promise.all([load(), refreshGear()])
  }

  return (
    <main
      className="screen"
      style={{
        position: 'relative',
        padding: '8px 12px calc(8px + env(safe-area-inset-bottom, 0px))',
        gap: 8,
        background: '#FAF6EE',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="row between" style={{ flexShrink: 0 }}>
        <button className="btn-round" onClick={onBack} aria-label="뒤로" style={{ width: 34, height: 34 }}>
          <BackIcon />
        </button>
        <h1 className="title" style={{ fontSize: 15, margin: 0 }}>🧭 탐험</h1>
        <span className="chip" style={{ fontSize: 11, fontWeight: 900, padding: '3px 9px' }}>💤 {fatigue}</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 4 }}>
        {st && !st.ok && (
          <div className="card" style={{ padding: 12, fontSize: 13, fontWeight: 800, color: '#C62828' }}>{st.message ?? '탐험 정보를 불러오지 못했어요.'}</div>
        )}

        {trip && tripRegion ? (
          <div className="card" style={{ padding: 14, textAlign: 'center', border: '2px solid #FFB74D', background: '#FFF8E1' }}>
            <div style={{ fontSize: 44 }}>{tripRegion.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#3E2723' }}>{tripRegion.name} {trip.zone}구역 탐험 중</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#8D6E63', marginTop: 2 }}>{monster.name}이(가) 씩씩하게 다녀오는 중이에요 ({trip.hours}시간 코스)</div>
            <div style={{ height: 12, borderRadius: 999, background: '#F1E7D8', overflow: 'hidden', margin: '12px 0 6px' }}>
              <div style={{ width: `${Math.min(100, (1 - left / total) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #FFB74D, #F57C00)', transition: 'width 1s linear' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#E65100' }}>{left > 0 ? `돌아오기까지 ${fmt(left)}` : '다녀왔어요! 맞이해 주세요'}</div>
            <button
              onClick={finish}
              disabled={busy || left > 0}
              style={{
                marginTop: 10,
                width: '100%',
                minHeight: 50,
                borderRadius: 14,
                border: 'none',
                fontSize: 15,
                fontWeight: 900,
                color: '#FFFFFF',
                cursor: left > 0 ? 'not-allowed' : 'pointer',
                background: left > 0 ? '#BCAAA4' : 'linear-gradient(180deg, #FF8A65, #E64A19)',
                boxShadow: left > 0 ? 'none' : '0 4px 0 #BF360C',
              }}
            >
              {left > 0 ? '아직 탐험 중…' : '🎒 돌아온 펫 맞이하기'}
            </button>
          </div>
        ) : (
          <>
            {/* 지역 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {REGIONS.map((r) => {
                const ok = isRegionOpen(r, { level: monster.level, evoStage: monster.evo_stage ?? 1 })
                const sel = r.id === regionId
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setRegionId(r.id)
                      setZone(Math.min((progress[r.id] ?? 0) + 1, EXPLORE.zonesPerRegion))
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 14,
                      border: `2px solid ${sel ? '#FF7A59' : '#E7D9C3'}`,
                      background: sel ? '#FFF2EC' : '#FFFFFF',
                      opacity: ok ? 1 : 0.6,
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      minHeight: 54,
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{ok ? r.icon : '🔒'}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 900, color: '#3E2723' }}>{r.name}</span>
                      <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#8D6E63' }}>
                        {ok ? `돌파 ${progress[r.id] ?? 0}/${EXPLORE.zonesPerRegion}구역` : r.unlockText}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 구역 */}
            {open && (
              <div className="card" style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#6D4C41', marginBottom: 6 }}>구역 (돌파한 구역 다음까지)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {Array.from({ length: EXPLORE.zonesPerRegion }, (_, i) => i + 1).map((z) => {
                    const lock = z > cleared + 1
                    return (
                      <button
                        key={z}
                        onClick={() => !lock && setZone(z)}
                        disabled={lock}
                        style={{
                          minHeight: 40,
                          borderRadius: 10,
                          border: `2px solid ${zone === z ? '#FF7A59' : '#E7D9C3'}`,
                          background: zone === z ? '#FFF2EC' : z <= cleared ? '#E8F5E9' : '#FFFFFF',
                          color: lock ? '#BCAAA4' : '#3E2723',
                          fontSize: 13,
                          fontWeight: 900,
                          cursor: lock ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {lock ? '🔒' : z}
                      </button>
                    )
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: '#6D4C41', lineHeight: 1.5 }}>
                  권장 전투력 {need} · 내 전투력 {myPower}
                  <span style={{ marginLeft: 6, color: TIER_INFO[forecast].color }}>
                    {TIER_INFO[forecast].emoji} {TIER_INFO[forecast].label} 예상
                  </span>
                </div>
              </div>
            )}

            {/* 시간 */}
            {open && (
              <div className="card" style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#6D4C41', marginBottom: 6 }}>보낼 시간 (오래 보낼수록 보상↑, 피로↑)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {EXPLORE.hours.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHours(h)}
                      style={{
                        minHeight: 46,
                        borderRadius: 10,
                        border: `2px solid ${hours === h ? '#FF7A59' : '#E7D9C3'}`,
                        background: hours === h ? '#FFF2EC' : '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 900,
                        color: '#3E2723',
                        cursor: 'pointer',
                        lineHeight: 1.2,
                      }}
                    >
                      {h}시간
                      <span style={{ display: 'block', fontSize: 10, color: '#8D6E63' }}>×{EXPLORE.hourMult[h]}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={fatigue >= EXPLORE.fatigueBlock ? onGoRest : start}
                  disabled={busy}
                  style={{
                    marginTop: 10,
                    width: '100%',
                    minHeight: 52,
                    borderRadius: 14,
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 900,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    background: fatigue >= EXPLORE.fatigueBlock ? 'linear-gradient(180deg, #A1887F, #6D4C41)' : 'linear-gradient(180deg, #4DB6AC, #00897B)',
                    boxShadow: fatigue >= EXPLORE.fatigueBlock ? '0 4px 0 #4E342E' : '0 4px 0 #00695C',
                  }}
                >
                  {fatigue >= EXPLORE.fatigueBlock ? '💤 너무 노곤해요 · 쉬러 가기' : `${region.icon} ${region.name} ${zone}구역으로 보내기`}
                </button>
              </div>
            )}
          </>
        )}

        {/* 탐험 일지 */}
        <div className="card" style={{ padding: '10px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#3E2723', marginBottom: 6 }}>📖 탐험 일지</div>
          {(st?.journal ?? []).length === 0 && <div style={{ fontSize: 12, fontWeight: 800, color: '#A1887F' }}>아직 다녀온 기록이 없어요.</div>}
          {(st?.journal ?? []).map((j) => {
            const rg = regionById(j.region)
            const t = j.result ? TIER_INFO[j.result.tier] : null
            return (
              <div key={j.id} style={{ padding: '6px 0', borderTop: '1px dashed #E7D9C3' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#5D4037' }}>
                  {rg?.icon} {rg?.name} {j.zone}구역 · {j.hours}시간 {t && <span style={{ color: t.color }}>· {t.label}</span>}
                </div>
                {j.result && <div style={{ fontSize: 11.5, fontWeight: 700, color: '#6D4C41', lineHeight: 1.45 }}>{j.result.journal}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* 복귀 결과 */}
      {done?.result && (
        <div
          role="dialog"
          aria-label="탐험 결과"
          style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(40,24,16,0.55)', display: 'grid', placeItems: 'center', padding: 18 }}
          onClick={() => setDone(null)}
        >
          <div className="card" style={{ width: '100%', maxWidth: 340, padding: 16, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 40 }}>{TIER_INFO[done.result.tier].emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: TIER_INFO[done.result.tier].color }}>{TIER_INFO[done.result.tier].label}!</div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#6D4C41', lineHeight: 1.55, margin: '6px 0 10px' }}>{done.result.journal}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', fontSize: 12.5, fontWeight: 900, color: '#3E2723' }}>
              <span className="chip">EXP +{done.result.exp}</span>
              {done.result.coins > 0 && <span className="chip">🪙 +{done.result.coins}</span>}
              {done.result.shards > 0 && <span className="chip">⭐ 별조각 +{done.result.shards}</span>}
              {done.result.foods.map((f, i) => (
                <span key={`${f}-${i}`} className="chip">🍓 {f}</span>
              ))}
              {done.result.gearDef && gearDefById(done.result.gearDef) && (
                <span className="chip" style={{ color: GEAR_GRADES[gearDefById(done.result.gearDef)!.grade].color }}>
                  {gearDefById(done.result.gearDef)!.icon} {gearDefById(done.result.gearDef)!.name}
                </span>
              )}
            </div>
            {done.result.event && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: '#E65100' }}>{done.result.event}</div>}
            {done.result.firstClear && done.result.cleared && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: '#2E7D32' }}>✨ 새 구역을 돌파했어요! 다음 구역이 열려요.</div>}
            {done.leveledUp && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: '#C2410C' }}>🎉 레벨 업!</div>}
            <button
              onClick={() => setDone(null)}
              style={{ marginTop: 12, width: '100%', minHeight: 46, borderRadius: 13, border: 'none', fontSize: 14, fontWeight: 900, color: '#FFFFFF', background: 'linear-gradient(180deg, #FF8A65, #E64A19)', boxShadow: '0 4px 0 #BF360C', cursor: 'pointer' }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 60, maxWidth: '90%', padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 900, color: '#FFFFFF', background: '#6D4C41', boxShadow: '0 6px 16px rgba(0,0,0,0.25)' }}
        >
          {toast}
        </div>
      )}
    </main>
  )
}
