// 오감 자극(눈·손·귀) 디저트 식감 이펙트 & 파티클 버스트 컴포넌트
// 캐릭터를 터치하거나 대전에서 스킬을 주고받을 때 식감별 파편(카다이프 크런치, 설탕 유리조각, 모찌 파우더, 푸딩 물방울 등)과
// 중독성 있는 연속 손맛 콤보 배지를 화면에 터뜨립니다.

import type { CSSProperties } from 'react'
import { getSensoryCategory, type DessertSoundKind } from '../lib/sound'

const PARTICLE_ICONS: Record<DessertSoundKind, string[]> = {
  'kataifi-crunch': ['🌾', '💚', '✨', '🥜', '🌾', '✨', '🍫', '💚'],
  'wax-pop': ['🫧', '💥', '✨', '🍬', '🫧', '🌸', '✨', '🫧'],
  'wax-tap': ['🫧', '✨', '💥', '🫧', '✨', '🍬', '🫧', '✨'],
  'sugar-crack': ['💎', '🍓', '✨', '🫧', '💎', '🍒', '✨', '🍓'],
  'cookie-crisp': ['🍪', '🍫', '✨', '🥨', '🍪', '✨', '🌰', '🍫'],
  'mochi-squish': ['🍡', '🤍', '💕', '✨', '🍡', '🌸', '🤍', '💖'],
  'pudding-jiggle': ['🍮', '🐻', '💧', '✨', '🍯', '🍮', '🫧', '💛'],
  'choco-melt': ['🍫', '🍩', '✨', '🤎', '🍫', '🍯', '✨', '💛'],
  'smore-sizzle': ['🔥', '🐾', '🍪', '✨', '🔥', '🍫', '🏕️', '✨'],
  'syrup-drizzle': ['🌈', '🍒', '⭐', '💖', '🍬', '✨', '🍓', '🌈'],
  'jelly-gummy': ['🍇', '🍓', '✨', '🍬', '🍇', '✨', '💧', '🍬'],
  'cotton-puff': ['☁️', '🌸', '✨', '🍡', '☁️', '💖', '✨', '🤍'],
  'acorn-snap': ['🌰', '🍪', '✨', '🥜', '🌰', '🍂', '✨', '🍪'],
  'soda-fizz': ['🫧', '⚡', '✨', '🍋', '🫧', '💙', '⚡', '✨'],
  'biscuit-armor': ['🍪', '🛡️', '✨', '🌾', '🍪', '⚙️', '✨', '🌾'],
  'flambe-crackle': ['🔥', '🍫', '✨', '💥', '🔥', '🤎', '✨', '🍫'],
  'starlight-ting': ['⭐', '✨', '🌌', '💫', '⭐', '💎', '✨', '🔮'],
  'chameleon-morph': ['🌈', '🦎', '✨', '🎨', '🌈', '🌸', '✨', '💫'],
}

const PARTICLE_VECTORS: { tx: string; ty: string; rot: string; left: string; top: string; delay: string }[] = [
  { tx: '-58px', ty: '-52px', rot: '-35deg', left: '34%', top: '42%', delay: '0s' },
  { tx: '60px', ty: '-48px', rot: '40deg', left: '64%', top: '40%', delay: '0.03s' },
  { tx: '-72px', ty: '-12px', rot: '-55deg', left: '28%', top: '56%', delay: '0.05s' },
  { tx: '74px', ty: '-10px', rot: '50deg', left: '70%', top: '55%', delay: '0.02s' },
  { tx: '-40px', ty: '-74px', rot: '-20deg', left: '44%', top: '32%', delay: '0.04s' },
  { tx: '42px', ty: '-72px', rot: '28deg', left: '56%', top: '32%', delay: '0.06s' },
  { tx: '-48px', ty: '26px', rot: '-42deg', left: '36%', top: '68%', delay: '0.03s' },
  { tx: '50px', ty: '24px', rot: '38deg', left: '62%', top: '68%', delay: '0.05s' },
]

export function getSensoryReactionClass(kind: DessertSoundKind): string {
  const cat = getSensoryCategory(kind)
  if (cat === 'crispy') return 'mon-react-crispy'
  if (cat === 'jiggly') return 'mon-react-jiggly'
  if (cat === 'melty') return 'mon-react-melty'
  return 'mon-react-chewy'
}

export interface SensoryBurstProps {
  kind: DessertSoundKind
  triggerKey: number
  bubble: string | null
  combo?: number
}

export function SensoryBurst({ kind, triggerKey, bubble, combo = 0 }: SensoryBurstProps) {
  if (!bubble || triggerKey <= 0) return null
  const icons = PARTICLE_ICONS[kind] ?? PARTICLE_ICONS['mochi-squish']

  return (
    <div
      key={triggerKey}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 15,
        overflow: 'visible',
      }}
    >
      {/* 상단 ASMR 의성어 말풍선 + 연속 손맛 콤보 배지 */}
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 999,
          background: 'linear-gradient(90deg, #3B2F2F 0%, #5D4037 100%)',
          color: '#FFFDF9',
          fontSize: 12.5,
          fontWeight: 900,
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 18px rgba(59, 47, 47, 0.28)',
          border: '2px solid #FFE082',
        }}
      >
        <span>🔊 {bubble}</span>
        {combo >= 2 && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 999,
              background: '#FF7A59',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            손맛 x{combo}!
          </span>
        )}
      </div>

      {/* 식감별 시각 파편(카다이프/설탕코팅/모찌파우더/시럽) 8방향 버스트 */}
      {PARTICLE_VECTORS.map((vec, i) => {
        const style: CSSProperties & Record<string, string | number> = {
          position: 'absolute',
          left: vec.left,
          top: vec.top,
          fontSize: i % 2 === 0 ? 20 : 16,
          animation: `sensory-particle-pop 0.68s cubic-bezier(0.16, 1, 0.3, 1) ${vec.delay} forwards`,
          '--tx': vec.tx,
          '--ty': vec.ty,
          '--rot': vec.rot,
        }
        return (
          <span key={i} style={style}>
            {icons[i % icons.length]}
          </span>
        )
      })}
    </div>
  )
}
