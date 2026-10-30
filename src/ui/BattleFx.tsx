// 대전 타격 연출 겹: 돌진 속도선·발밑 먼지(공격할 때), 충격 링·폭발·슬래시 선·화면 번쩍임·집중선(맞을 때)
// 키프레임(fxRing 등)은 AsmrBattleArena 의 <style> 에 있다.

import type { CSSProperties } from 'react'

export type FxPhase = 'idle' | 'windup' | 'strike' | 'reaction'

interface Props {
  stepKey: number
  phase: FxPhase
  actor?: 'challenger' | 'defender'
  isCrit?: boolean
  isDodge?: boolean
  isBlock?: boolean
  damage?: number
  multiHit?: boolean
  // 식감 종류별 색 (바삭=황금, 쫀득=분홍, 탱글=노랑, 사르르=갈색)
  tint: string
}

const SLASHES = [0, 45, 90, 135, 180, 225, 270, 315]

export default function BattleFx({ stepKey, phase, actor, isCrit, isDodge, isBlock, damage = 0, multiHit, tint }: Props) {
  if (!actor || phase === 'idle' || phase === 'windup') return null

  const attackerLeft = actor === 'challenger'
  // 맞는 쪽의 가운데 (왼쪽 25% / 오른쪽 75%)
  const hitX = attackerLeft ? '75%' : '25%'
  const attackX = attackerLeft ? '25%' : '75%'

  if (phase === 'strike') {
    const dir = attackerLeft ? 1 : -1
    return (
      <div key={`s-${stepKey}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8, overflow: 'hidden' }}>
        {/* 돌진 속도선 */}
        {[0, 1, 2, 3, 4].map((i) => {
          const s = {
            position: 'absolute',
            top: `${40 + i * 7}%`,
            left: attackX,
            width: isCrit ? 120 : 84,
            height: i % 2 ? 2 : 3,
            borderRadius: 4,
            background: `linear-gradient(${dir > 0 ? 90 : 270}deg, transparent, ${tint}, #FFFFFF)`,
            animation: `fxSpeed 0.24s ease-out ${i * 0.018}s both`,
            '--from': `${-20 * dir}px`,
            '--to': `${92 * dir}px`,
          }
          return <span key={i} style={s as CSSProperties} />
        })}
        {/* 발밑 먼지 */}
        {[0, 1, 2, 3].map((i) => {
          const s = {
            position: 'absolute',
            left: attackX,
            top: '78%',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 0 6px rgba(255,224,178,0.9)',
            animation: `fxDust 0.42s ease-out ${i * 0.02}s both`,
            '--dx': `${(i % 2 ? 1 : -1) * (14 + i * 9) - dir * 14}px`,
            '--dy': `${-6 - i * 4}px`,
          }
          return <span key={i} style={s as CSSProperties} />
        })}
      </div>
    )
  }

  // reaction: 맞는 순간
  if (isDodge) {
    return (
      <div key={`r-${stepKey}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8 }}>
        <span style={{ position: 'absolute', left: hitX, top: '52%', fontSize: 34, animation: 'fxRing 0.45s ease-out both' }}>💨</span>
      </div>
    )
  }
  if (isBlock) {
    return (
      <div key={`r-${stepKey}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8 }}>
        <span
          style={{
            position: 'absolute',
            left: hitX,
            top: '55%',
            width: 92,
            height: 92,
            borderRadius: '50%',
            border: '5px solid #64B5F6',
            boxShadow: '0 0 18px #90CAF9, inset 0 0 18px rgba(144,202,249,0.7)',
            animation: 'fxRing 0.5s ease-out both',
          }}
        />
        <span style={{ position: 'absolute', left: hitX, top: '55%', fontSize: 36, animation: 'fxBurst 0.5s ease-out both' }}>🛡️</span>
      </div>
    )
  }
  if (damage <= 0) return null

  const big = isCrit ? 1.55 : damage >= 24 ? 1.2 : 1
  return (
    <div key={`r-${stepKey}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9, overflow: 'hidden' }}>
      {/* 충격 링 */}
      <span
        style={{
          position: 'absolute',
          left: hitX,
          top: '55%',
          width: 96 * big,
          height: 96 * big,
          borderRadius: '50%',
          border: `${isCrit ? 7 : 4}px solid ${isCrit ? '#FFEA00' : tint}`,
          boxShadow: `0 0 ${isCrit ? 28 : 14}px ${tint}`,
          animation: 'fxRing 0.5s cubic-bezier(0.1, 0.8, 0.3, 1) both',
        }}
      />
      {/* 폭발 */}
      <span
        style={{
          position: 'absolute',
          left: hitX,
          top: '52%',
          fontSize: 54 * big,
          lineHeight: 1,
          filter: `drop-shadow(0 0 10px ${tint})`,
          animation: 'fxBurst 0.46s ease-out both',
        }}
      >
        {isCrit ? '💥' : '✨'}
      </span>
      {/* 사방으로 뻗는 슬래시 선 */}
      {SLASHES.slice(0, isCrit || multiHit ? 8 : 6).map((a, i) => {
        const s = {
          position: 'absolute',
          left: hitX,
          top: '55%',
          width: 34 * big,
          height: isCrit ? 4 : 3,
          borderRadius: 4,
          background: `linear-gradient(90deg, transparent, ${isCrit ? '#FFF176' : '#FFFFFF'}, ${tint})`,
          animation: `fxSlash 0.4s ease-out ${i * 0.012}s both`,
          '--a': `${a + (i % 2 ? 9 : -6)}deg`,
          '--d': `${(isCrit ? 74 : 54) * 1}px`,
        }
        return <span key={i} style={s as CSSProperties} />
      })}
      {/* 치명타: 화면 번쩍 + 집중선 */}
      {isCrit && (
        <>
          <span style={{ position: 'absolute', inset: 0, background: '#FFFFFF', animation: 'fxFlash 0.28s ease-out both' }} />
          <span
            style={{
              position: 'absolute',
              inset: -20,
              background: `repeating-conic-gradient(from 0deg at ${hitX} 54%, rgba(255,255,255,0) 0deg 5deg, rgba(255,214,0,0.55) 5deg 7deg)`,
              animation: 'fxRays 0.55s ease-out both',
            }}
          />
        </>
      )}
    </div>
  )
}
