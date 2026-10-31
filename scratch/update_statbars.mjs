import fs from 'node:fs';

let code = fs.readFileSync('src/ui/parts.tsx', 'utf8');

const oldStatBars = `export function StatBars({ stats, compact = false }: { stats: Stats; compact?: boolean }) {
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
              <span style={{ width: \`\${Math.min(100, (v / STAT_BAR_MAX) * 100)}%\`, backgroundColor: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}`;

const newStatBars = `export function StatBars({ stats, compact = false, evoStage = 1 }: { stats: Stats; compact?: boolean; evoStage?: number }) {
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
              <span style={{ width: \`\${pct}%\`, backgroundColor: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}`;

code = code.replace(oldStatBars, newStatBars);

fs.writeFileSync('src/ui/parts.tsx', code, 'utf8');
console.log('parts.tsx: Dynamic stat bar expansion applied (100 -> 180 -> 300+)');

