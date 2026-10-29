import { useState, type ReactNode } from 'react'
import { STAT_BAR_MAX, STAT_INFO } from '../config/species'
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

export function StatBars({ stats, compact = false }: { stats: Stats; compact?: boolean }) {
  return (
    <div className={compact ? 'stats-grid' : 'stack'} style={compact ? undefined : { gap: 14 }}>
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

// 둥지 및 디저트(케이크·쿠키·푸딩·마카롱·파르페) 플레이팅 받침대
// front=true면 알이 둥지 안에 들어앉은 것처럼 앞에 그리고, false면 몬스터가 받침대 위에 서도록 뒤에 그린다
export function Nest({
  children,
  width = 250,
  lift = 34,
  front = true,
  dessertBase = 'nest',
}: {
  children?: ReactNode
  width?: number
  lift?: number
  front?: boolean
  dessertBase?: DessertBaseId
}) {
  if (dessertBase && dessertBase !== 'nest') {
    return (
      <div
        style={{
          width,
          height: 76,
          flexShrink: 0,
          marginTop: -lift - 8,
          position: 'relative',
          zIndex: front ? 1 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 260 88" width={width} height={76} style={{ overflow: 'visible' }}>
          {/* 공통 파티세리 접시 그림자 */}
          <ellipse cx={130} cy={76} rx={116} ry={12} fill="rgba(89,62,34,0.16)" />

          {/* 1. 🎂 생딸기 홀케이크 받침대 */}
          {dessertBase === 'strawberry-cake' && (
            <g stroke="#3B2F2F" strokeWidth={2.8} strokeLinejoin="round">
              {/* 골드 테두리 케이크 접시 */}
              <ellipse cx={130} cy={68} rx={112} ry={16} fill="#FFFDF9" />
              <ellipse cx={130} cy={66} rx={102} ry={12} fill="none" stroke="#F7C04A" strokeWidth={2} />
              {/* 폭신한 스폰지 케이크 시트 */}
              <path d="M 34 32 L 34 62 C 34 74 226 74 226 62 L 226 32 Z" fill="#FFE4B5" />
              {/* 가운데 딸기잼 샌드 층 */}
              <path d="M 35 48 C 80 56 180 56 225 48" fill="none" stroke="#FF6B81" strokeWidth={5} />
              {/* 상단 생크림 아이싱 & 주르륵 흐르는 드리즐 */}
              <ellipse cx={130} cy={30} rx={96} ry={18} fill="#FFFFFF" />
              <path
                d="M 34 32 C 42 48 54 48 62 34 C 72 52 86 52 96 36 C 108 54 124 54 134 36 C 146 54 162 54 172 36 C 184 52 198 52 206 34 C 214 48 222 46 226 32 Z"
                fill="#FFFFFF"
              />
              {/* 가장자리 통딸기 장식 4알 */}
              <circle cx={58} cy={26} r={7.5} fill="#FF5252" />
              <circle cx={98} cy={32} r={7.5} fill="#FF5252" />
              <circle cx={162} cy={32} r={7.5} fill="#FF5252" />
              <circle cx={202} cy={26} r={7.5} fill="#FF5252" />
            </g>
          )}

          {/* 2. 🍪 오독오독 초코칩 쿠키 받침대 */}
          {dessertBase === 'choco-cookie' && (
            <g stroke="#3B2F2F" strokeWidth={2.8} strokeLinejoin="round">
              <ellipse cx={130} cy={52} rx={104} ry={26} fill="#D99B52" />
              <ellipse cx={130} cy={46} rx={98} ry={22} fill="#EAB36E" strokeWidth={0} />
              {/* 큼직한 다크 초코칩 조각들 */}
              <ellipse cx={68} cy={48} rx={11} ry={6} fill="#4E342E" />
              <ellipse cx={106} cy={58} rx={12} ry={6.5} fill="#4E342E" />
              <ellipse cx={158} cy={56} rx={13} ry={6.5} fill="#4E342E" />
              <ellipse cx={194} cy={46} rx={10} ry={5.5} fill="#4E342E" />
              <circle cx={88} cy={38} r={5} fill="#5D4037" />
              <circle cx={174} cy={38} r={5.5} fill="#5D4037" />
            </g>
          )}

          {/* 3. 🍮 탱글 커스터드 푸딩 받침대 */}
          {dessertBase === 'custard-pudding' && (
            <g stroke="#3B2F2F" strokeWidth={2.8} strokeLinejoin="round">
              <ellipse cx={130} cy={66} rx={110} ry={16} fill="#FFFFFF" />
              <ellipse cx={130} cy={64} rx={88} ry={11} fill="#8D5524" opacity={0.35} strokeWidth={0} />
              {/* 노란 커스터드 푸딩 몸체 */}
              <path d="M 48 62 L 62 24 C 68 14 192 14 198 24 L 212 62 C 200 74 60 74 48 62 Z" fill="#FFE066" />
              {/* 달콤쌉싸름한 카라멜 시럽 코팅 */}
              <ellipse cx={130} cy={24} rx={68} ry={12} fill="#6F3B17" />
              <path
                d="M 62 24 C 74 42 88 40 96 28 C 110 46 128 46 138 28 C 152 44 168 42 178 28 C 186 38 194 36 198 24 Z"
                fill="#6F3B17"
              />
            </g>
          )}

          {/* 4. 🧁 파스텔 마카롱 방석 받침대 */}
          {dessertBase === 'macaron-cushion' && (
            <g stroke="#3B2F2F" strokeWidth={2.8} strokeLinejoin="round">
              {/* 아래쪽 꼬끄 */}
              <ellipse cx={130} cy={62} rx={96} ry={16} fill="#F8BBD0" />
              {/* 가운데 두툼한 바닐라·산딸기 크림 필링 */}
              <rect x={36} y={40} width={188} height={18} rx={9} fill="#FFFDF9" />
              {/* 위쪽 꼬끄 + 삐에(프릴) */}
              <ellipse cx={130} cy={36} rx={98} ry={18} fill="#FF8A9E" />
              <ellipse cx={110} cy={30} rx={42} ry={6} fill="#FFFFFF" opacity={0.45} strokeWidth={0} />
              {/* 진주 구슬 스프링클 */}
              <circle cx={56} cy={49} r={4} fill="#FFD54F" />
              <circle cx={94} cy={51} r={4} fill="#80DEEA" />
              <circle cx={166} cy={51} r={4} fill="#FFD54F" />
              <circle cx={204} cy={49} r={4} fill="#80DEEA" />
            </g>
          )}

          {/* 5. 🍨 베리 파르페 유리컵 받침대 */}
          {dessertBase === 'parfait-cup' && (
            <g stroke="#3B2F2F" strokeWidth={2.8} strokeLinejoin="round">
              {/* 유리컵 받침 발 */}
              <ellipse cx={130} cy={76} rx={58} ry={9} fill="#E0F7FA" />
              <rect x={118} y={58} width={24} height={18} rx={4} fill="#E0F7FA" />
              {/* 유리컵 볼 + 베리 & 요거트 층 */}
              <path d="M 38 26 C 44 64 82 66 130 66 C 178 66 216 64 222 26 Z" fill="#FFF0F5" />
              <path d="M 48 44 C 90 54 170 54 212 44" fill="none" stroke="#FF6B81" strokeWidth={7} />
              {/* 유리컵 물결 테두리 & 웨하스 롤 */}
              <ellipse cx={130} cy={26} rx={94} ry={14} fill="#E0F7FA" fillOpacity={0.65} />
              <rect x={192} y={4} width={12} height={32} rx={4} transform="rotate(24 192 4)" fill="#F5CBA7" />
            </g>
          )}
        </svg>
        {children}
      </div>
    )
  }

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
      <span className="chip coral" style={{ fontSize: 11, padding: '2px 8px' }}>
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
