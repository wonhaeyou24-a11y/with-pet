import { useState, type ReactNode } from 'react'
import { STAT_INFO } from '../config/species'
import type { Stats } from '../lib/api'
import type { DessertBaseId } from '../monsters/MallangChameleon'
import { LockIcon, PawIcon } from './Icons'

export function TopBar({ nickname, onLogout }: { nickname: string; onLogout?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="topbar">
      <div className="brand">
        <PawIcon size={24} />
        펫과함께
      </div>
      <button className="nick-pill" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="dot" style={{ background: 'var(--mint)' }} />
        {nickname}
      </button>
      {open && onLogout && (
        <div className="menu">
          <button onClick={onLogout}>로그아웃</button>
        </div>
      )}
    </div>
  )
}

export function StatBars({ stats, compact = false, evoStage = 1 }: { stats: Stats; compact?: boolean; evoStage?: number }) {
  // 🌟 진화 및 장비 성장에 따른 동적 한계 확장 (1단계: 100, 2단계: 180, 3단계: 300, 스탯 초과 시 자동 확장)
  const baseLimit = evoStage === 3 ? 300 : evoStage === 2 ? 180 : 100
  const maxVal = Math.max(...Object.values(stats))
  const dynamicMax = Math.max(baseLimit, Math.ceil(maxVal / 20) * 20)

  return (
    <div className={compact ? 'stats-grid' : 'stack'} style={compact ? undefined : { gap: 14 }}>
      {STAT_INFO.map(({ key, label, color }) => {
        const v = stats[key]
        const pct = Math.min(100, Math.round((v / dynamicMax) * 100))
        return (
          <div className="stat-row" key={key}>
            <div className="stat-head">
              <span className="stat-name">
                <i style={{ background: color }} />
                {label}
              </span>
              <span className="stat-num" style={{ color }}>
                {v} <small>/ {dynamicMax}</small>
              </span>
            </div>
            <div className="bar" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemax={dynamicMax}>
              <span style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function totalStats(stats: Stats) {
  return stats.hp + stats.atk + stats.def + stats.spd + stats.int + stats.cha
}

// 둥지 및 디저트(케이크·쿠키·푸딩·마카롱·파르페) 플레이팅 받침대
// front=true면 알이 둥지 안에 들어앉은 것처럼 앞에 그리고, false면 몬스터가 받침대 위에 서도록 뒤에 그린다
export function Nest({
  children,
  width = 250,
  lift = 34,
  front = true,
}: {
  children?: ReactNode
  width?: number
  lift?: number
  front?: boolean
  dessertBase?: DessertBaseId
}) {
  // 3D 캐릭터 뷰(Monster3DView)가 이미 입체 3D 케이크·쿠키·푸딩 받침대를 함께 렌더링하므로,
  // 알 화면처럼 내부 자식(애정/포근함 칩)이 있는 경우에만 둥지 바를 표시하여 한 화면(무스크롤) 공간을 확보한다.
  if (!children) return null

  return (
    <div
      style={{
        width,
        height: 56,
        flexShrink: 0,
        borderRadius: 28,
        background: 'linear-gradient(180deg, #fff3d6, #f7e4b4)',
        border: '2px solid var(--border)',
        boxShadow: '0 8px 14px rgba(186,142,75,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginTop: -lift,
        position: 'relative',
        zIndex: front ? 1 : 0,
      }}
    >
      {children}
    </div>
  )
}

export function LockedCard({ icon, title, desc, compact = false }: { icon: ReactNode; title: string; desc?: string; compact?: boolean }) {
  if (compact) {
    return (
      <div className="locked-card compact">
        {icon}
        <strong>{title}</strong>
        <LockIcon size={16} color="var(--placeholder)" />
      </div>
    )
  }
  return (
    <div className="locked-card">
      <span className="chip coral" style={{ fontSize: 12, padding: '2px 8px' }}>
        곧 만나요
      </span>
      {icon}
      <strong>{title}</strong>
      {desc && <span className="small">{desc}</span>}
    </div>
  )
}

export function formatRemaining(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(sec)}`
}
