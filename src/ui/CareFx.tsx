// 알을 돌볼 때 알 위에 겹쳐 나오는 연출 부품
import { HeartIcon } from './Icons'

const INK = '#4A3330'

// 쓰다듬는 손: 알 위를 좌우로 쓸어 준다
export function PetHand() {
  return (
    <div className="fx-hand" aria-hidden="true">
      <svg width="72" height="84" viewBox="0 0 80 92" style={{ overflow: 'visible' }}>
        <g fill="#FFE0C2" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="22" cy="68" rx="8" ry="13" transform="rotate(8 22 68)" />
          <ellipse cx="38" cy="74" rx="8" ry="14" />
          <ellipse cx="54" cy="70" rx="8" ry="13" transform="rotate(-8 54 70)" />
          <path d="M 12 38 C 12 24 24 16 40 16 C 56 16 68 24 68 38 L 68 56 C 68 66 58 72 40 72 C 22 72 12 66 12 56 Z" />
          <ellipse cx="68" cy="40" rx="8" ry="12" transform="rotate(-24 68 40)" />
        </g>
        <g fill="#FF9C9C" opacity="0.7">
          <ellipse cx="28" cy="52" rx="6" ry="4" />
          <ellipse cx="52" cy="52" rx="6" ry="4" />
        </g>
        <path d="M 30 42 Q 34 46 38 42 M 42 42 Q 46 46 50 42" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// 따뜻하게 해 주는 해님과 아지랑이
export function WarmSun() {
  return (
    <>
      <div className="fx-glow" aria-hidden="true" />
      <div className="fx-sun" aria-hidden="true">
        <svg width="68" height="68" viewBox="0 0 68 68" style={{ overflow: 'visible' }}>
          <g className="rays" stroke="#F5B82E" strokeWidth="5" strokeLinecap="round">
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d="M 34 4 L 34 12" transform={`rotate(${i * 45} 34 34)`} />
            ))}
          </g>
          <circle cx="34" cy="34" r="17" fill="#FFD25E" stroke={INK} strokeWidth="3.4" />
          <ellipse cx="26" cy="38" rx="4" ry="2.6" fill="#FF9C8A" opacity="0.85" />
          <ellipse cx="42" cy="38" rx="4" ry="2.6" fill="#FF9C8A" opacity="0.85" />
          <path d="M 25 32 Q 28 29 31 32 M 37 32 Q 40 29 43 32 M 30 40 Q 34 44 38 40" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
      {[28, 50, 72].map((left, i) => (
        <svg key={left} className="fx-heat" style={{ left: `${left}%`, top: '34%', animationDelay: `${0.25 + i * 0.2}s` }} width="18" height="46" viewBox="0 0 18 46" aria-hidden="true">
          <path d="M 9 2 C 1 10 17 16 9 24 C 1 32 17 38 9 44" fill="none" stroke="#FF9A62" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
        </svg>
      ))}
    </>
  )
}

// 쓰다듬을 때 솟아오르는 하트
export function HeartBurst() {
  return (
    <>
      {[
        { left: '30%', delay: 0.15, size: 26 },
        { left: '52%', delay: 0.4, size: 32 },
        { left: '70%', delay: 0.7, size: 24 },
      ].map((h, i) => (
        <span key={i} className="floaty" style={{ top: '30%', left: h.left, animationDelay: `${h.delay}s`, animationDuration: '1.3s', opacity: 0 }}>
          <HeartIcon size={h.size} />
        </span>
      ))}
    </>
  )
}
