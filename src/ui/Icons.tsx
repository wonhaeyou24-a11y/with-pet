import type { ReactNode } from 'react'
import { ELEMENT_INFO } from '../config/species'
import type { Element } from '../monsters/types'

type IconProps = { size?: number; color?: string }

function Svg({ size = 20, color = 'currentColor', children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export const PawIcon = ({ size = 22, color = 'var(--primary)' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <ellipse cx="6" cy="10" rx="2.2" ry="2.8" />
    <ellipse cx="10" cy="5.8" rx="2.2" ry="2.8" />
    <ellipse cx="14.5" cy="5.8" rx="2.2" ry="2.8" />
    <ellipse cx="18.4" cy="10" rx="2.2" ry="2.8" />
    <path d="M12 11c-3.2 0-6 3.6-6 6 0 2 1.7 3 3.4 3 1 0 1.8-.5 2.6-.5s1.6.5 2.6.5c1.7 0 3.4-1 3.4-3 0-2.4-2.8-6-6-6z" />
  </svg>
)

export const BackIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
)

export const ArrowIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)

export const ChevronIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
)

export const MailIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7l8 6 8-6" />
  </Svg>
)

export const TicketIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1a2 2 0 0 1 0-4v0a2 2 0 0 0 0-4V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1z" />
    <path d="M10 9v6" strokeDasharray="1.5 2.5" />
  </Svg>
)

export const HourglassIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9" />
  </Svg>
)

export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
  </Svg>
)

export const HeartIcon = ({ size = 20, color = 'var(--primary)' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" />
  </svg>
)

export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="10" rx="3" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
)

export const SparkleIcon = ({ size = 20, color = '#f5b82e' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 2l2.2 6.3L21 10l-6.8 1.7L12 18l-2.2-6.3L3 10l6.8-1.7z" />
  </svg>
)

// 속성 아이콘: 둥근 색 원 안에 흰 그림
export function ElementIcon({ element, size = 22 }: { element: Element; size?: number }) {
  const glyph: Record<Element, ReactNode> = {
    fire: <path d="M12 4c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.6.7-2.7 1.6-3.7.1 1 .6 1.7 1.2 2C10.5 8 11 6 12 4z" fill="#fff" stroke="none" />,
    water: <path d="M12 4c3 4 5 6.6 5 9.4a5 5 0 0 1-10 0C7 10.600 9 8 12 4z" fill="#fff" stroke="none" />,
    grass: <path d="M6 18c0-8 5-12 12-12 0 8-4 12-12 12zM6 18l7-7" stroke="#fff" fill="none" strokeWidth={2} />,
    electric: <path d="M13 3L6 13h5l-1 8 8-11h-5z" fill="#fff" stroke="none" />,
    wind: <path d="M4 9h10a2.500 2.500 0 1 0-2.500-2.500M4 13h14a2.500 2.500 0 1 1-2.500 2.500M4 17h7" stroke="#fff" fill="none" strokeWidth={2} />,
    earth: <path d="M3 19l6-10 4 6 2-3 6 7z" fill="#fff" stroke="none" />,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill={ELEMENT_INFO[element].color} />
      <g transform="translate(12 12) scale(0.62) translate(-12 -12)" strokeLinecap="round" strokeLinejoin="round">
        {glyph[element]}
      </g>
    </svg>
  )
}

export function ElementChip({ element }: { element: Element }) {
  return (
    <span className="chip" style={{ paddingLeft: 6 }}>
      <ElementIcon element={element} size={20} />
      {ELEMENT_INFO[element].label}
    </span>
  )
}
