import { useState, type ReactNode } from 'react'
import { STAT_BAR_MAX, STAT_INFO } from '../config/species'
import type { Stats } from '../lib/api'
import { PawIcon } from './Icons'

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

export function StatBars({ stats }: { stats: Stats }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      {STAT_INFO.map(({ key, label, color }) => {
        const v = stats[key]
        return (
          <div className="stat-row" key={key}>
            <div className="stat-head">
              <span className="stat-name">
                <i style={{ background: color }} />
                {label}
              </span>
              <span className="stat-num" style={{ color }}>
                {v} <small>/ {STAT_BAR_MAX}</small>
              </span>
            </div>
            <div className="bar" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemax={STAT_BAR_MAX}>
              <span style={{ width: `${Math.min(100, (v / STAT_BAR_MAX) * 100)}%`, backgroundColor: color }} />
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

// 둥지·구름 받침대
// front=true면 알이 둥지 안에 들어앉은 것처럼 앞에 그리고, false면 몬스터가 받침대 위에 서도록 뒤에 그린다
export function Nest({ children, width = 250, lift = 34, front = true }: { children?: ReactNode; width?: number; lift?: number; front?: boolean }) {
  return (
    <div
      style={{
        width,
        height: 56,
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

export function LockedCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="locked-card">
      <span className="chip coral" style={{ fontSize: 11, padding: '2px 8px' }}>
        곧 만나요
      </span>
      {icon}
      <strong>{title}</strong>
      <span className="small">{desc}</span>
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
