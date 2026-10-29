import { useId } from 'react'
import type { Rarity } from '../lib/api'

const INK = '#4A3330'
const EGG_D = 'M 100 24 C 144 24 172 84 172 140 C 172 190 140 218 100 218 C 60 218 28 190 28 140 C 28 84 56 24 100 24 Z'

// sleep: 쿨쿨 / happy: 쓰다듬을 때의 방긋 / cozy: 따뜻할 때의 사르르 / ready: 부화 직전 / plain: 얼굴 없음
type Mood = 'sleep' | 'happy' | 'cozy' | 'ready' | 'plain'

function Shell({ rarity, clip }: { rarity: Rarity; clip: string }) {
  if (rarity === 'common') {
    return (
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="200" height="240" fill="#FBE9CC" />
        <ellipse cx="86" cy="96" rx="52" ry="64" fill="#FFF5E2" />
        <g fill="#BFE6D2" opacity="0.9">
          <ellipse cx="62" cy="76" rx="16" ry="20" />
          <ellipse cx="124" cy="104" rx="14" ry="19" />
          <ellipse cx="76" cy="168" rx="12" ry="15" />
          <ellipse cx="150" cy="170" rx="8" ry="10" />
        </g>
        <g fill="#FF9F8E" opacity="0.9">
          <circle cx="104" cy="60" r="7" />
          <circle cx="58" cy="124" r="6" />
          <circle cx="132" cy="146" r="9" />
          <circle cx="104" cy="196" r="8" />
          <circle cx="150" cy="82" r="5" />
        </g>
      </g>
    )
  }
  if (rarity === 'rare') {
    return (
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="200" height="240" fill="#EAC070" />
        <path d="M 0 150 C 40 128 70 170 110 150 C 150 130 170 150 200 140 V 240 H 0 Z" fill="#BCDDEE" />
        <path d="M 0 164 C 40 142 70 184 110 164 C 150 144 170 164 200 154" fill="none" stroke="#E4F3FA" strokeWidth="4" />
        <g fill="#FFE59A" stroke="#C8962E" strokeWidth="2" strokeLinejoin="round">
          <path d="M 76 70 l 5 11 l 11 4 l -11 4 l -5 11 l -5 -11 l -11 -4 l 11 -4 Z" />
          <path d="M 126 102 l 4 9 l 9 3 l -9 3 l -4 9 l -4 -9 l -9 -3 l 9 -3 Z" />
          <path d="M 98 184 l 4 9 l 9 3 l -9 3 l -4 9 l -4 -9 l -9 -3 l 9 -3 Z" />
        </g>
      </g>
    )
  }
  return (
    <g clipPath={`url(#${clip})`}>
      <rect x="0" y="0" width="200" height="240" fill="#C9B2F0" />
      <ellipse cx="82" cy="90" rx="48" ry="58" fill="#DCCBF7" opacity="0.8" />
      <g fill="none" stroke="#F2C95E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 100 24 L 92 74 L 120 104 L 108 150 L 130 190" />
        <path d="M 92 74 L 64 96 L 70 132" />
        <path d="M 120 104 L 150 112" />
        <path d="M 40 150 C 60 170 80 196 100 218 M 160 150 C 140 170 120 196 100 218" />
      </g>
    </g>
  )
}

export function EggArt({ rarity = 'common', mood = 'sleep', size = 200, fluid = false }: { rarity?: Rarity; mood?: Mood; size?: number; fluid?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const clip = `${uid}-egg`
  // fluid: 화면 높이에 맞춰 크기가 줄어든다 (한 화면에 들어오게)
  const sizing = fluid ? {} : { width: size, height: (size * 240) / 200 }
  return (
    <svg viewBox="0 0 200 240" role="img" aria-label={`${rarity} egg`} style={{ overflow: 'visible', ...sizing }}>
      <defs>
        <clipPath id={clip}>
          <path d={EGG_D} />
        </clipPath>
      </defs>
      <ellipse cx="100" cy="226" rx="62" ry="9" fill="rgba(89,62,34,0.14)" />
      <Shell rarity={rarity} clip={clip} />
      <ellipse cx="74" cy="64" rx="14" ry="22" transform="rotate(24 74 64)" fill="#fff" opacity="0.32" clipPath={`url(#${clip})`} />
      <path d={EGG_D} fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />

      {/* 새싹 */}
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M 100 26 C 92 10 78 10 74 16 C 82 26 92 28 100 26 Z" fill="#7CC08E" />
        <path d="M 100 26 C 108 8 122 8 126 14 C 118 26 108 29 100 26 Z" fill="#7CC08E" />
      </g>

      {mood !== 'plain' && (
        <g>
          <ellipse cx="62" cy="150" rx="11" ry="7" fill="#FF9C9C" opacity={mood === 'sleep' ? 0.8 : 1} />
          <ellipse cx="138" cy="150" rx="11" ry="7" fill="#FF9C9C" opacity={mood === 'sleep' ? 0.8 : 1} />
          {mood === 'sleep' || mood === 'cozy' ? (
            <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
              <path d="M 70 138 Q 80 146 90 138" />
              <path d="M 110 138 Q 120 146 130 138" />
              <path d={mood === 'cozy' ? 'M 90 152 Q 100 164 110 152' : 'M 94 152 Q 100 158 106 152'} strokeWidth="3" />
            </g>
          ) : (
            <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
              <path d="M 70 142 Q 80 132 90 142" />
              <path d="M 110 142 Q 120 132 130 142" />
              <path d="M 92 152 Q 100 162 108 152" strokeWidth="3" />
            </g>
          )}
        </g>
      )}

      {mood === 'ready' && (
        <path d="M 100 30 L 92 52 L 106 62 L 94 84" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

// 알이 깨진 뒤 몬스터 발밑에 남는 아랫쪽 껍질
export function EggShellCup({ rarity = 'common', width = 190 }: { rarity?: Rarity; width?: number }) {
  const fill = rarity === 'common' ? '#FBE9CC' : rarity === 'rare' ? '#EAC070' : '#C9B2F0'
  return (
    <svg width={width} height={(width * 90) / 190} viewBox="0 0 190 90" aria-hidden="true">
      <path
        d="M 6 20 L 26 34 L 42 14 L 62 32 L 80 12 L 98 32 L 116 12 L 134 32 L 152 14 L 166 34 L 184 20 C 184 62 146 86 95 86 C 44 86 6 62 6 20 Z"
        fill={fill}
        stroke={INK}
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
