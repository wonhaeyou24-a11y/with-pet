import { RARITY_INFO } from '../config/species'
import type { EggRow } from '../lib/api'
import { HeartBurst, PetHand, WarmSun } from '../ui/CareFx'
import { EggArt } from '../ui/EggArt'
import { HeartIcon, HourglassIcon, PawIcon, SparkleIcon, SunIcon } from '../ui/Icons'
import { formatRemaining, Nest, TopBar } from '../ui/parts'

// 방금 한 돌봄 연출. key가 바뀔 때마다 연출이 처음부터 다시 재생된다.
export interface CareFx {
  kind: 'pet' | 'warm'
  key: number
  minutes: number
}

export interface EggHomeProps {
  nickname: string
  egg: EggRow
  remainingMs: number
  limits: { pet: number; warm: number }
  usedPet: number
  usedWarm: number
  busy: boolean
  toast: string
  bubble: string
  fx: CareFx | null
  onPet: () => void
  onWarm: () => void
  onHatch: () => void
  onLogout?: () => void
}

export default function EggHome(p: EggHomeProps) {
  const ready = p.remainingMs <= 0
  const fx = p.fx
  const mood = fx?.kind === 'pet' ? 'happy' : fx?.kind === 'warm' ? 'cozy' : ready ? 'ready' : 'sleep'
  const eggClass = fx?.kind === 'pet' ? 'egg-happy' : fx?.kind === 'warm' ? 'egg-cozy' : ready ? 'egg-ready' : 'egg-sway'

  return (
    <main className="screen fit">
      <TopBar nickname={p.nickname} onLogout={p.onLogout} />

      <div className="card fill">
        <span className={`chip ${ready ? 'coral' : p.egg.rarity}`}>
          <span className="dot" style={{ background: ready ? 'var(--primary)' : 'var(--mint)' }} />
          {ready ? '부화 준비 완료' : RARITY_INFO[p.egg.rarity].label}
          {ready && <SparkleIcon size={14} />}
        </span>

        <div className="stage fill">
          {(ready || fx?.kind === 'warm') && <div className={`halo${fx?.kind === 'warm' ? ' warm' : ''}`} />}
          {fx?.kind === 'warm' && <WarmSun key={`s${fx.key}`} />}
          <div className="fit-fill">
            <div className={eggClass} key={`${fx?.key ?? 0}-${ready}`}>
              <EggArt rarity={p.egg.rarity} mood={mood} fluid />
            </div>
          </div>
          <Nest>
            <SparkleIcon size={14} color="#d9c18a" />
            <SparkleIcon size={14} color="#d9c18a" />
            <SparkleIcon size={14} color="#d9c18a" />
          </Nest>
          {fx?.kind === 'pet' && (
            <div key={`p${fx.key}`}>
              <PetHand />
              <HeartBurst />
            </div>
          )}
          {fx && fx.minutes > 0 && (
            <span className="fx-dmg" key={`d${fx.key}`}>
              -{fx.minutes}분
            </span>
          )}
          {p.bubble && (
            <div className="bubble egg-bubble" key={p.bubble + (fx?.key ?? 0)}>
              {p.bubble}
            </div>
          )}
        </div>

        {ready ? (
          <div className="stack" style={{ gap: 2 }}>
            <p className="title" style={{ fontSize: 20 }}>알이 곧 깨어날 것 같아요</p>
            <p className="sub">두근두근… 안에서 무언가 움직여요</p>
          </div>
        ) : (
          <div className="row center wrap">
            <span className="chip coral">
              <HeartIcon size={14} /> 애정 {p.egg.pet_count}
            </span>
            <span className="chip mint">
              <SunIcon size={14} color="#1d7a55" /> 포근함 {p.egg.warm_count}
            </span>
          </div>
        )}
        {!ready && <p className="small">돌봐 준 마음이 아이의 첫 성격에 살짝 영향을 줘요</p>}
      </div>

      {p.toast && <div className="toast" role="status">{p.toast}</div>}

      {ready ? (
        <>
          <button className="btn block big" onClick={p.onHatch} disabled={p.busy}>
            <SparkleIcon size={22} color="#fff" />
            {p.busy ? '알이 깨어나는 중…' : '부화시키기!'}
          </button>
          <p className="small center-text">어떤 귀여운 친구가 태어날까요?</p>
        </>
      ) : (
        <>
          <div className="card tight row" style={{ gap: 12 }}>
            <span className="chip coral" style={{ padding: 10, borderRadius: '50%' }}>
              <HourglassIcon size={22} color="var(--primary-rim)" />
            </span>
            <div>
              <p className="small">부화 예정</p>
              <p className={`timer${fx ? ' timer-pop' : ''}`} key={`t${fx?.key ?? 0}`} style={{ fontSize: 24 }}>
                부화까지 {formatRemaining(p.remainingMs)}
              </p>
            </div>
          </div>

          <div className="grid-2">
            <button className="btn" data-silent onClick={p.onPet} disabled={p.busy || p.usedPet >= p.limits.pet}>
              <PawIcon size={22} color="#fff" />
              <span>
                쓰다듬기
                <span className="sub-label">
                  오늘 {p.usedPet}/{p.limits.pet}회
                </span>
              </span>
            </button>
            <button className="btn mint" data-silent onClick={p.onWarm} disabled={p.busy || p.usedWarm >= p.limits.warm}>
              <SunIcon size={22} color="#fff" />
              <span>
                따뜻하게 하기
                <span className="sub-label">
                  오늘 {p.usedWarm}/{p.limits.warm}회
                </span>
              </span>
            </button>
          </div>
        </>
      )}
    </main>
  )
}
