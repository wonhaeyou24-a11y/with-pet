import { RARITY_INFO } from '../config/species'
import type { EggRow } from '../lib/api'
import { EggArt } from '../ui/EggArt'
import { HeartIcon, HourglassIcon, PawIcon, SparkleIcon, SunIcon } from '../ui/Icons'
import { formatRemaining, Nest, TopBar } from '../ui/parts'

export interface EggHomeProps {
  nickname: string
  egg: EggRow
  remainingMs: number
  limits: { pet: number; warm: number }
  usedPet: number
  usedWarm: number
  busy: boolean
  toast: string
  burst: number
  onPet: () => void
  onWarm: () => void
  onHatch: () => void
  onLogout?: () => void
}

export default function EggHome(p: EggHomeProps) {
  const ready = p.remainingMs <= 0
  const sleepText = '포근한 둥지에서 쿨쿨 자고 있어요'

  return (
    <main className="screen">
      <TopBar nickname={p.nickname} onLogout={p.onLogout} />

      <div className="card center-text" style={{ marginTop: 10, alignItems: 'center', paddingBottom: 24 }}>
        <span className={`chip ${ready ? 'coral' : p.egg.rarity}`}>
          <span className="dot" style={{ background: ready ? 'var(--primary)' : 'var(--mint)' }} />
          {ready ? '부화 준비 완료' : RARITY_INFO[p.egg.rarity].label}
          {ready && <SparkleIcon size={14} />}
        </span>

        <div className="stage" style={{ marginTop: 6 }}>
          {ready && <div className="halo" />}
          <div className={ready ? 'egg-ready' : 'egg-sway'} key={ready ? 'r' : 'z'}>
            <EggArt rarity={p.egg.rarity} mood={ready ? 'ready' : 'sleep'} size={190} />
          </div>
          <Nest>
            <SparkleIcon size={14} color="#d9c18a" />
            <SparkleIcon size={14} color="#d9c18a" />
            <SparkleIcon size={14} color="#d9c18a" />
          </Nest>
          {p.burst > 0 && (
            <span key={p.burst} className="floaty" style={{ top: 40, left: '55%' }}>
              <HeartIcon size={30} />
            </span>
          )}
        </div>

        {ready ? (
          <div className="stack" style={{ gap: 4 }}>
            <p className="title">알이 곧 깨어날 것 같아요</p>
            <p className="sub">두근두근… 안에서 무언가 움직여요</p>
          </div>
        ) : (
          <p className="sub">{sleepText}</p>
        )}
      </div>

      {p.toast && <div className="toast" role="status">{p.toast}</div>}

      {ready ? (
        <>
          <div className="grow" />
          <button className="btn block big" onClick={p.onHatch} disabled={p.busy}>
            <SparkleIcon size={22} color="#fff" />
            {p.busy ? '알이 깨어나는 중…' : '부화시키기!'}
          </button>
          <p className="small center-text">어떤 귀여운 친구가 태어날까요?</p>
        </>
      ) : (
        <>
          <div className="card tight row" style={{ gap: 14 }}>
            <span className="chip coral" style={{ padding: 12, borderRadius: '50%' }}>
              <HourglassIcon size={24} color="var(--primary-rim)" />
            </span>
            <div>
              <p className="small">부화 예정</p>
              <p className="timer">부화까지 {formatRemaining(p.remainingMs)}</p>
            </div>
          </div>

          <div className="grid-2">
            <button className="btn" onClick={p.onPet} disabled={p.busy || p.usedPet >= p.limits.pet}>
              <PawIcon size={22} color="#fff" />
              <span>
                쓰다듬기
                <span className="sub-label">
                  오늘 {p.usedPet}/{p.limits.pet}회
                </span>
              </span>
            </button>
            <button className="btn mint" onClick={p.onWarm} disabled={p.busy || p.usedWarm >= p.limits.warm}>
              <SunIcon size={22} color="#fff" />
              <span>
                따뜻하게 하기
                <span className="sub-label">
                  오늘 {p.usedWarm}/{p.limits.warm}회
                </span>
              </span>
            </button>
          </div>
          <p className="small center-text">
            <HeartIcon size={14} /> 자주 돌봐 주면 더 빨리 만날 수 있어요
          </p>
        </>
      )}
    </main>
  )
}
