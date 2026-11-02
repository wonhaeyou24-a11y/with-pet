// 🗺️ 랜드마크 & 자연풍경 감성 벡터 일러스트 백드롭
// 펫창(홈화면) 및 미니룸 뒷배경 전용: 100% SVG, 가볍고 선명하며 제로 크래시 무결성 보장
// 100% 한글 주석, 반응형 벡터 렌더링

import React from 'react'

export interface ScenicBackdropProps {
  themeId: string
  mode?: 'pet-card' | 'room'
  className?: string
  style?: React.CSSProperties
}

export default function ScenicBackdrop({
  themeId,
  mode = 'pet-card',
  className,
  style,
}: ScenicBackdropProps) {
  // 모드별 투명도 및 레이아웃 조절
  const isRoom = mode === 'room'
  const containerOpacity = isRoom ? 0.92 : 0.88

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: containerOpacity,
        ...style,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {/* 파리 에펠탑 센강 노을 그라데이션 */}
          <linearGradient id="paris-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#F472B6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="paris-water" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.6" />
          </linearGradient>

          {/* 후지산 벚꽃 일출 그라데이션 */}
          <linearGradient id="fuji-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#FDA4AF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F472B6" stopOpacity="0.3" />
          </linearGradient>

          {/* 뉴욕 브루클린 야경 그라데이션 */}
          <linearGradient id="ny-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#1E1B4B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#312E81" stopOpacity="0.7" />
          </linearGradient>

          {/* 런던 빅벤 템스강 안개 그라데이션 */}
          <linearGradient id="london-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#475569" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.5" />
          </linearGradient>

          {/* 하와이 와이키키 핑크 선셋 그라데이션 */}
          <linearGradient id="hawaii-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
            <stop offset="45%" stopColor="#FB7185" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="hawaii-sea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0.75" />
          </linearGradient>

          {/* 스위스 알프스 청정 하늘 */}
          <linearGradient id="swiss-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#BAE6FD" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F0FDF4" stopOpacity="0.6" />
          </linearGradient>

          {/* 로마 콜로세움 황금빛 석양 */}
          <linearGradient id="rome-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.4" />
          </linearGradient>

          {/* 북극 오로라 밤하늘 */}
          <linearGradient id="aurora-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#1C2541" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0A1128" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="aurora-ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.65" />
          </linearGradient>

          {/* 제주 유채꽃 푸른 하늘 */}
          <linearGradient id="jeju-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#BFDBFE" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FEF08A" stopOpacity="0.45" />
          </linearGradient>

          {/* 벚꽃 호숫가 봄빛 */}
          <linearGradient id="cherry-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBCFE8" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#FFF1F2" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#CCFBF1" stopOpacity="0.5" />
          </linearGradient>

          {/* 대나무숲 달빛 밤하늘 */}
          <linearGradient id="bamboo-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#022C22" stopOpacity="0.92" />
            <stop offset="65%" stopColor="#064E3B" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0.75" />
          </linearGradient>

          {/* 트로피컬 에메랄드 해변 */}
          <linearGradient id="tropical-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#A5F3FC" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FED7AA" stopOpacity="0.45" />
          </linearGradient>

          {/* 공통 필터: 부드러운 빛무리 글로우 */}
          <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ============================================================== */}
        {/* 1. 🗼 랜드마크: 파리 에펠탑 센강 카페 (room-paris-eiffel) */}
        {/* ============================================================== */}
        {themeId === 'room-paris-eiffel' && (
          <g>
            <rect width="400" height="300" fill="url(#paris-sky)" />
            {/* 센강 수면 */}
            <rect y="210" width="400" height="90" fill="url(#paris-water)" />
            {/* 센강 물결 라인 */}
            <path d="M 0 225 Q 100 220 200 225 T 400 225" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.3" fill="none" />
            <path d="M 0 245 Q 100 240 200 245 T 400 245" stroke="#FBCFE8" strokeWidth="1" opacity="0.4" fill="none" />
            <path d="M 0 270 Q 100 265 200 270 T 400 270" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.25" fill="none" />

            {/* 센강 돌다리 난간 */}
            <rect y="196" width="400" height="15" fill="#E2E8F0" opacity="0.75" />
            <line x1="0" y1="196" x2="400" y2="196" stroke="#CBD5E1" strokeWidth="2" />
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={i} x={20 + i * 32} y="198" width="6" height="11" rx="2" fill="#94A3B8" opacity="0.6" />
            ))}

            {/* 원경 파리 건물 실루엣 */}
            <path
              d="M 10 196 L 10 155 L 35 155 L 45 140 L 55 155 L 80 155 L 90 148 L 105 148 L 105 196 Z"
              fill="#E0E7FF"
              opacity="0.55"
            />
            <path
              d="M 280 196 L 280 150 L 305 150 L 315 138 L 330 150 L 360 150 L 375 142 L 390 150 L 390 196 Z"
              fill="#E0E7FF"
              opacity="0.55"
            />

            {/* 🗼 중앙 우측 웅장한 에펠탑 실루엣 */}
            <g transform="translate(190, 20) scale(0.95)" opacity="0.88">
              {/* 꼭대기 첨탑 & 서치라이트 빛무리 */}
              <ellipse cx="60" cy="8" rx="14" ry="4" fill="#FEF08A" opacity="0.7" filter="url(#soft-glow)" />
              <line x1="60" y1="0" x2="60" y2="25" stroke="#64748B" strokeWidth="2.5" />
              {/* 상단 돔 */}
              <path d="M 52 25 L 68 25 L 64 60 L 56 60 Z" fill="#475569" />
              <rect x="50" y="60" width="20" height="4" rx="1" fill="#334155" />
              {/* 중단 트러스 기둥 */}
              <path d="M 54 64 L 66 64 L 74 110 L 46 110 Z" fill="#64748B" />
              {/* 중단 플랫폼 테라스 */}
              <rect x="40" y="110" width="40" height="7" rx="2" fill="#334155" />
              <line x1="38" y1="117" x2="82" y2="117" stroke="#94A3B8" strokeWidth="1.5" />
              {/* 하단 아치 기둥 다리 */}
              <path d="M 44 117 L 30 185 L 14 185 L 36 117 Z" fill="#475569" />
              <path d="M 76 117 L 90 185 L 106 185 L 84 117 Z" fill="#475569" />
              {/* 하단 연결 아치 곡선 */}
              <path d="M 32 185 Q 60 145 88 185 Q 60 155 32 185 Z" fill="#334155" />
              {/* 철골 격자 X 패턴 */}
              <line x1="48" y1="70" x2="72" y2="105" stroke="#CBD5E1" strokeWidth="1" opacity="0.6" />
              <line x1="72" y1="70" x2="48" y2="105" stroke="#CBD5E1" strokeWidth="1" opacity="0.6" />
            </g>

            {/* 좌측 클래식 가로등 */}
            <g transform="translate(42, 130)" opacity="0.9">
              <ellipse cx="6" cy="6" rx="12" ry="12" fill="#FEF08A" opacity="0.6" filter="url(#soft-glow)" />
              <circle cx="6" cy="6" r="4" fill="#FFFFFF" />
              <path d="M 2 0 L 10 0 L 8 12 L 4 12 Z" fill="#334155" />
              <line x1="6" y1="12" x2="6" y2="68" stroke="#1E293B" strokeWidth="2.5" />
              <rect x="2" y="66" width="8" height="5" rx="1" fill="#0F172A" />
            </g>
          </g>
        )}

        {/* ============================================================== */}
        {/* 2. ⛩️ 랜드마크: 도쿄 후지산 벚꽃 신사 (room-fuji-cherry) */}
        {/* ============================================================== */}
        {themeId === 'room-fuji-cherry' && (
          <g>
            <rect width="400" height="300" fill="url(#fuji-sky)" />
            {/* 아침 해 (붉은 일출 태양) */}
            <circle cx="200" cy="115" r="55" fill="#F43F5E" opacity="0.45" filter="url(#soft-glow)" />

            {/* 웅장한 후지산 (만년설 모자) */}
            <path d="M 80 230 Q 150 170 175 90 L 225 90 Q 250 170 320 230 Z" fill="#818CF8" opacity="0.75" />
            {/* 만년설 하얀 눈부채 */}
            <path
              d="M 175 90 L 225 90 Q 235 125 245 135 L 235 145 L 220 135 L 210 148 L 195 135 L 180 145 L 165 135 Q 170 120 175 90 Z"
              fill="#FFFFFF"
              opacity="0.95"
            />
            {/* 잔잔한 호수 (가와구치코) */}
            <rect y="225" width="400" height="75" fill="#E0E7FF" opacity="0.8" />
            <path d="M 0 240 Q 100 235 200 240 T 400 240" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.5" fill="none" />

            {/* 좌측 붉은 토리이 신사 문 */}
            <g transform="translate(35, 145) scale(0.85)" opacity="0.92">
              <rect x="0" y="8" width="80" height="7" rx="2" fill="#DC2626" />
              <rect x="6" y="18" width="68" height="5" rx="1" fill="#DC2626" />
              <rect x="15" y="18" width="8" height="70" fill="#B91C1C" />
              <rect x="57" y="18" width="8" height="70" fill="#B91C1C" />
              <rect x="13" y="84" width="12" height="6" fill="#1E293B" />
              <rect x="55" y="84" width="12" height="6" fill="#1E293B" />
            </g>

            {/* 우측 상단 벚꽃 가지 & 흩날리는 벚꽃잎 */}
            <path d="M 400 0 Q 320 20 280 60 Q 250 90 220 95" stroke="#78350F" strokeWidth="4" fill="none" opacity="0.8" />
            <path d="M 330 25 Q 300 45 270 40" stroke="#78350F" strokeWidth="2.5" fill="none" opacity="0.7" />
            {/* 분홍 벚꽃송이들 */}
            {[
              [280, 58], [295, 48], [320, 30], [255, 75], [235, 92], [345, 15], [268, 42]
            ].map(([cx, cy], i) => (
              <g key={i} transform={`translate(${cx}, ${cy})`}>
                <circle cx="-4" cy="-4" r="5" fill="#F472B6" opacity="0.9" />
                <circle cx="4" cy="-4" r="5" fill="#FBCFE8" opacity="0.9" />
                <circle cx="-4" cy="4" r="5" fill="#FBCFE8" opacity="0.9" />
                <circle cx="4" cy="4" r="5" fill="#F472B6" opacity="0.9" />
                <circle cx="0" cy="0" r="3" fill="#FDE047" />
              </g>
            ))}
            {/* 허공에 날리는 벚꽃잎 */}
            <ellipse cx="140" cy="80" rx="5" ry="3" fill="#F472B6" opacity="0.8" transform="rotate(25 140 80)" />
            <ellipse cx="110" cy="130" rx="6" ry="3.5" fill="#FBCFE8" opacity="0.85" transform="rotate(-35 110 130)" />
            <ellipse cx="320" cy="180" rx="5.5" ry="3" fill="#F472B6" opacity="0.75" transform="rotate(45 320 180)" />
          </g>
        )}

        {/* ============================================================== */}
        {/* 3. 🗽 랜드마크: 뉴욕 브루클린 스카이라인 야경 (room-ny-brooklyn) */}
        {/* ============================================================== */}
        {themeId === 'room-ny-brooklyn' && (
          <g>
            <rect width="400" height="300" fill="url(#ny-sky)" />
            {/* 밤하늘 별빛 */}
            {[[40, 30], [120, 20], [220, 35], [310, 15], [370, 45]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.5" fill="#FEF08A" opacity="0.8" />
            ))}
            <circle cx="340" cy="40" r="16" fill="#FEF08A" opacity="0.9" filter="url(#soft-glow)" />

            {/* 맨해튼 마천루 빌딩 실루엣 (창문 불빛) */}
            <path
              d="M 15 220 L 15 90 L 45 90 L 45 220 L 50 220 L 50 120 L 75 120 L 75 60 L 80 40 L 85 60 L 85 220 L 110 220 L 110 100 L 140 100 L 140 220 L 145 220 L 145 130 L 175 130 L 175 220 Z"
              fill="#1E293B"
              opacity="0.9"
            />
            {/* 빌딩 속 노란 창문 불빛 점들 */}
            {[
              [25, 110], [35, 110], [25, 130], [35, 130], [25, 160], [35, 160],
              [60, 90], [70, 90], [60, 120], [70, 120], [60, 150], [70, 150],
              [120, 120], [130, 120], [120, 150], [130, 150]
            ].map(([x, y], i) => (
              <rect key={i} x={x} y={y} width="4" height="6" fill="#FDE047" opacity="0.75" />
            ))}

            {/* 이스트 리버 강물 & 조명 반영 */}
            <rect y="220" width="400" height="80" fill="#0A0F1D" opacity="0.95" />
            <path d="M 0 235 Q 100 230 200 235 T 400 235" stroke="#FDE047" strokeWidth="1" opacity="0.3" fill="none" />
            <path d="M 0 255 Q 100 250 200 255 T 400 255" stroke="#38BDF8" strokeWidth="1.2" opacity="0.3" fill="none" />

            {/* 🌉 브루클린 브릿지 고딕 석조 탑 & 서스펜션 케이블 */}
            <g transform="translate(230, 80) scale(0.9)" opacity="0.95">
              {/* 석조 타워 2개 아치 */}
              <rect x="30" y="30" width="60" height="135" fill="#334155" />
              {/* 고딕 첨두 아치 창 */}
              <path d="M 40 100 L 40 65 Q 48 50 50 45 Q 52 50 60 65 L 60 100 Z" fill="#0F172A" />
              <path d="M 68 100 L 68 65 Q 76 50 78 45 Q 80 50 88 65 L 88 100 Z" fill="#0F172A" />
              {/* 다리 상판 도로 */}
              <rect x="-60" y="125" width="200" height="12" fill="#475569" />
              {/* 메인 케이블 포물선 */}
              <path d="M -60 50 Q 60 120 140 70" stroke="#FDE047" strokeWidth="2" fill="none" opacity="0.8" />
              {/* 수직 서스펜더 줄들 */}
              {[-40, -20, 0, 15, 100, 115, 130].map((x, i) => (
                <line key={i} x1={x} y1="75" x2={x} y2="125" stroke="#E2E8F0" strokeWidth="0.8" opacity="0.6" />
              ))}
            </g>
          </g>
        )}

        {/* ============================================================== */}
        {/* 4. 🎡 랜드마크: 런던 빅벤 & 템스강 런던아이 (room-london-bigben) */}
        {/* ============================================================== */}
        {themeId === 'room-london-bigben' && (
          <g>
            <rect width="400" height="300" fill="url(#london-sky)" />
            {/* 템스강 수면 */}
            <rect y="215" width="400" height="85" fill="#1E293B" opacity="0.9" />
            <path d="M 0 230 Q 100 225 200 230 T 400 230" stroke="#94A3B8" strokeWidth="1" opacity="0.4" fill="none" />

            {/* 좌측 런던아이 대관람차 */}
            <g transform="translate(65, 80) scale(0.85)" opacity="0.8">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#60A5FA" strokeWidth="2.5" opacity="0.8" />
              <circle cx="60" cy="60" r="46" fill="none" stroke="#93C5FD" strokeWidth="1" strokeDasharray="3 3" />
              {/* 스포크 바퀴살 */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * Math.PI) / 4
                return (
                  <line
                    key={i}
                    x1={60 - Math.cos(angle) * 50}
                    y1={60 - Math.sin(angle) * 50}
                    x2={60 + Math.cos(angle) * 50}
                    y2={60 + Math.sin(angle) * 50}
                    stroke="#CBD5E1"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                )
              })}
              {/* 관람차 캡슐들 */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 2 * Math.PI) / 12
                const cx = 60 + Math.cos(angle) * 50
                const cy = 60 + Math.sin(angle) * 50
                return <ellipse key={i} cx={cx} cy={cy} rx="4" ry="3" fill="#FEF08A" opacity="0.9" />
              })}
              {/* 관람차 A형 지지대 */}
              <line x1="60" y1="60" x2="30" y2="150" stroke="#334155" strokeWidth="3.5" />
              <line x1="60" y1="60" x2="90" y2="150" stroke="#334155" strokeWidth="3.5" />
            </g>

            {/* 우측 웅장한 엘리자베스 타워(빅벤) */}
            <g transform="translate(250, 20) scale(0.92)" opacity="0.92">
              {/* 뾰족한 첨탑 */}
              <polygon points="60,0 55,45 65,45" fill="#334155" />
              {/* 4방 모서리 미니 피나클 타워 */}
              <polygon points="42,30 40,55 45,55" fill="#475569" />
              <polygon points="78,30 75,55 80,55" fill="#475569" />
              {/* 시계 지붕 하우징 */}
              <rect x="42" y="45" width="36" height="15" fill="#475569" />
              {/* 🌟 황금빛 시계 다이얼 판 */}
              <rect x="40" y="60" width="40" height="40" fill="#334155" />
              <circle cx="60" cy="80" r="14" fill="#FEF08A" opacity="0.95" filter="url(#soft-glow)" />
              <circle cx="60" cy="80" r="14" fill="none" stroke="#1E293B" strokeWidth="1.8" />
              {/* 시계 바늘 */}
              <line x1="60" y1="80" x2="60" y2="70" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
              <line x1="60" y1="80" x2="67" y2="80" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
              {/* 본체 고딕 벽돌 기둥 */}
              <rect x="44" y="100" width="32" height="110" fill="#475569" />
              {/* 수직 창살 리브 */}
              <line x1="50" y1="105" x2="50" y2="200" stroke="#64748B" strokeWidth="1.5" />
              <line x1="60" y1="105" x2="60" y2="200" stroke="#64748B" strokeWidth="1.5" />
              <line x1="70" y1="105" x2="70" y2="200" stroke="#64748B" strokeWidth="1.5" />
              {/* 웨스트민스터 의사당 지붕 라인 */}
              <path d="M 0 160 L 44 160 L 44 210 L 0 210 Z" fill="#334155" opacity="0.9" />
              <path d="M 76 160 L 130 160 L 130 210 L 76 210 Z" fill="#334155" opacity="0.9" />
            </g>
          </g>
        )}

        {/* ============================================================== */}
        {/* 5. 🌴 랜드마크: 하와이 와이키키 핑크 선셋 (room-hawaii-sunset) */}
        {/* ============================================================== */}
        {themeId === 'room-hawaii-sunset' && (
          <g>
            <rect width="400" height="300" fill="url(#hawaii-sky)" />
            {/* 거대한 석양 태양 */}
            <circle cx="200" cy="140" r="45" fill="#FEF08A" opacity="0.8" filter="url(#soft-glow)" />

            {/* 에메랄드 와이키키 바다 */}
            <rect y="180" width="400" height="120" fill="url(#hawaii-sea)" />
            {/* 일렁이는 황금빛 파도 */}
            <path d="M 0 195 Q 100 188 200 195 T 400 195" stroke="#FEF08A" strokeWidth="2.5" opacity="0.65" fill="none" />
            <path d="M 0 220 Q 100 212 200 220 T 400 220" stroke="#FFFFFF" strokeWidth="2" opacity="0.75" fill="none" />
            <path d="M 0 250 Q 100 242 200 250 T 400 250" stroke="#FFFFFF" strokeWidth="2.8" opacity="0.9" fill="none" />

            {/* 먼바다 다이아몬드 헤드 화산 봉우리 실루엣 */}
            <path d="M 260 180 Q 300 150 340 155 Q 370 165 400 180 Z" fill="#581C87" opacity="0.6" />

            {/* 좌측 야자수 실루엣 */}
            <g transform="translate(15, 60)" opacity="0.92">
              {/* 곡선 줄기 */}
              <path d="M 30 210 Q 55 130 45 60" stroke="#3730A3" strokeWidth="9" fill="none" strokeLinecap="round" />
              {/* 야자수 잎사귀들 */}
              {[
                "M 45 60 Q 15 45 -5 65",
                "M 45 60 Q 25 25 10 10",
                "M 45 60 Q 65 20 85 30",
                "M 45 60 Q 80 55 95 80",
                "M 45 60 Q 40 85 20 105",
              ].map((d, i) => (
                <path key={i} d={d} stroke="#1E1B4B" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              ))}
              <circle cx="43" cy="65" r="4.5" fill="#78350F" />
              <circle cx="50" cy="68" r="4.5" fill="#78350F" />
            </g>

            {/* 우측 보조 야자수 */}
            <g transform="translate(340, 80) scale(0.85)" opacity="0.88">
              <path d="M 30 190 Q 10 120 20 50" stroke="#3730A3" strokeWidth="8" fill="none" strokeLinecap="round" />
              {[
                "M 20 50 Q -10 35 -30 50",
                "M 20 50 Q 5 15 -10 5",
                "M 20 50 Q 40 15 65 30",
                "M 20 50 Q 55 50 65 75",
              ].map((d, i) => (
                <path key={i} d={d} stroke="#1E1B4B" strokeWidth="4" fill="none" strokeLinecap="round" />
              ))}
            </g>
          </g>
        )}

        {/* ============================================================== */}
        {/* 6. 🏔️ 랜드마크: 스위스 알프스 만년설 퐁듀 (room-swiss-alps) */}
        {/* ============================================================== */}
        {themeId === 'room-swiss-alps' && (
          <g>
            <rect width="400" height="300" fill="url(#swiss-sky)" />
            {/* 뭉게구름 */}
            <ellipse cx="90" cy="55" rx="35" ry="14" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="120" cy="50" rx="25" ry="16" fill="#FFFFFF" opacity="0.85" />
            <ellipse cx="310" cy="65" rx="30" ry="12" fill="#FFFFFF" opacity="0.75" />

            {/* 원경 마테호른 설산 봉우리 */}
            <polygon points="200,45 280,185 120,185" fill="#93C5FD" opacity="0.8" />
            {/* 만년설 하얀 빙하 */}
            <polygon points="200,45 235,110 215,100 200,120 185,100 165,110" fill="#FFFFFF" opacity="0.95" />

            {/* 좌측 보조 설산 */}
            <polygon points="80,95 160,200 0,200" fill="#BFDBFE" opacity="0.7" />
            <polygon points="80,95 110,140 95,135 80,145 65,135 50,140" fill="#FFFFFF" opacity="0.9" />

            {/* 우측 보조 설산 */}
            <polygon points="320,85 400,200 240,200" fill="#BFDBFE" opacity="0.7" />
            <polygon points="320,85 350,135 335,130 320,140 305,130 290,135" fill="#FFFFFF" opacity="0.9" />

            {/* 푸른 알프스 초원 언덕 */}
            <path d="M 0 175 Q 120 150 240 185 T 400 175 L 400 300 L 0 300 Z" fill="#86EFAC" opacity="0.8" />
            <path d="M 0 210 Q 180 180 400 215 L 400 300 L 0 300 Z" fill="#4ADE80" opacity="0.85" />

            {/* 스위스 전통 목조 샬레 오두막 */}
            <g transform="translate(45, 185)" opacity="0.92">
              <polygon points="25,0 0,16 50,16" fill="#78350F" />
              <rect x="6" y="16" width="38" height="22" fill="#92400E" />
              <rect x="18" y="24" width="10" height="14" fill="#FEF3C7" />
              <rect x="28" y="18" width="8" height="8" fill="#FDE047" />
            </g>
          </g>
        )}

        {/* ============================================================== */}
        {/* 7. 🏛️ 랜드마크: 로마 콜로세움 젤라또 광장 (room-rome-colosseum) */}
        {/* ============================================================== */}
        {themeId === 'room-rome-colosseum' && (
          <g>
            <rect width="400" height="300" fill="url(#rome-sky)" />
            {/* 지중해 태양 */}
            <circle cx="310" cy="60" r="30" fill="#FEF08A" opacity="0.7" filter="url(#soft-glow)" />

            {/* 🏛️ 웅장한 로마 콜로세움 원형 경기장 */}
            <g transform="translate(60, 95) scale(0.9)" opacity="0.9">
              {/* 외벽 실루엣 */}
              <path
                d="M 10 130 L 10 50 Q 60 20 150 20 Q 240 20 290 50 L 290 130 Z"
                fill="#D97706"
              />
              {/* 3층 아치 회랑 */}
              {Array.from({ length: 8 }).map((_, i) => (
                <rect key={i} x={35 + i * 30} y="35" width="16" height="22" rx="8" fill="#78350F" />
              ))}
              {/* 2층 아치 회랑 */}
              {Array.from({ length: 8 }).map((_, i) => (
                <rect key={i} x={35 + i * 30} y="65" width="16" height="26" rx="8" fill="#78350F" />
              ))}
              {/* 1층 하단 입구 아치들 */}
              {Array.from({ length: 8 }).map((_, i) => (
                <rect key={i} x={35 + i * 30} y="98" width="16" height="30" rx="8" fill="#451A03" />
              ))}
              {/* 무너진 유적 단층 디테일 */}
              <path d="M 10 50 L 40 40 L 40 25 L 10 50 Z" fill="#B45309" />
            </g>

            {/* 이탈리아 솔나무(우산소나무) */}
            <g transform="translate(325, 90)" opacity="0.85">
              <line x1="20" y1="50" x2="20" y2="120" stroke="#78350F" strokeWidth="4" />
              <ellipse cx="20" cy="45" rx="32" ry="16" fill="#15803D" />
            </g>

            {/* 광장 돌바닥 */}
            <rect y="210" width="400" height="90" fill="#FDE68A" opacity="0.85" />
            <path d="M 0 225 L 400 225" stroke="#D97706" strokeWidth="1" strokeDasharray="6 6" opacity="0.4" />
            <path d="M 0 250 L 400 250" stroke="#D97706" strokeWidth="1" strokeDasharray="6 6" opacity="0.4" />
          </g>
        )}

        {/* ============================================================== */}
        {/* 8. 🌌 자연풍경: 신비로운 북극 에메랄드 오로라 (room-arctic-aurora) */}
        {/* ============================================================== */}
        {themeId === 'room-arctic-aurora' && (
          <g>
            <rect width="400" height="300" fill="url(#aurora-sky)" />
            {/* 별무리 */}
            {[
              [30, 40], [70, 20], [130, 50], [180, 25], [230, 40],
              [290, 15], [330, 45], [380, 30], [90, 80], [270, 75]
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.4" fill="#FFFFFF" opacity="0.85" />
            ))}

            {/* 🌌 너울거리는 환상 오로라 리본 커튼 3겹 */}
            <path
              d="M -20 110 Q 80 40 180 80 T 420 50 L 420 140 Q 280 90 180 130 T -20 170 Z"
              fill="url(#aurora-ribbon)"
              opacity="0.6"
              filter="url(#soft-glow)"
            />
            <path
              d="M -10 80 Q 90 120 220 70 T 410 100 L 410 160 Q 220 110 90 150 T -10 120 Z"
              fill="#A78BFA"
              opacity="0.45"
              filter="url(#soft-glow)"
            />
            <path
              d="M 10 50 Q 140 10 260 60 T 410 40 L 410 100 Q 260 80 140 40 T 10 80 Z"
              fill="#34D399"
              opacity="0.55"
              filter="url(#soft-glow)"
            />

            {/* 북극 빙하 설원 */}
            <polygon points="0,220 80,180 160,220" fill="#38BDF8" opacity="0.6" />
            <polygon points="120,220 200,165 280,220" fill="#E0F2FE" opacity="0.75" />
            <polygon points="260,220 330,175 400,220" fill="#38BDF8" opacity="0.6" />
            <rect y="215" width="400" height="85" fill="#E0F2FE" opacity="0.9" />
          </g>
        )}

        {/* ============================================================== */}
        {/* 9. 🌼 자연풍경: 제주 성산 유채꽃 & 돌담길 (room-jeju-canola) */}
        {/* ============================================================== */}
        {themeId === 'room-jeju-canola' && (
          <g>
            <rect width="400" height="300" fill="url(#jeju-sky)" />
            {/* 푸른 제주 바다 수평선 */}
            <rect y="130" width="400" height="50" fill="#0284C7" opacity="0.65" />

            {/* 성산 일출봉 분화구 실루엣 */}
            <path
              d="M 230 145 Q 260 90 310 95 Q 350 95 385 145 Z"
              fill="#065F46"
              opacity="0.8"
            />
            {/* 성산 분화구 톱니 절벽 */}
            <path
              d="M 280 95 L 290 102 L 300 95 L 310 102 L 320 95 L 330 102 L 340 95"
              stroke="#047857"
              strokeWidth="2"
              fill="none"
            />

            {/* 제주 현무암 돌담길 */}
            <g transform="translate(0, 160)" opacity="0.9">
              <path d="M 0 25 Q 150 15 400 25 L 400 45 Q 150 35 0 45 Z" fill="#334155" />
              {/* 불규칙한 현무암 돌멩이들 */}
              {Array.from({ length: 16 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx={15 + i * 25}
                  cy={30 + (i % 2 === 0 ? -3 : 3)}
                  rx="11"
                  ry="7"
                  fill="#1E293B"
                  stroke="#475569"
                  strokeWidth="1"
                />
              ))}
            </g>

            {/* 🌼 황금빛 유채꽃밭 만발 */}
            <rect y="195" width="400" height="105" fill="#FACC15" opacity="0.9" />
            {/* 수많은 노란 유채꽃 송이들 */}
            {Array.from({ length: 28 }).map((_, i) => {
              const x = 12 + ((i * 37) % 380)
              const y = 205 + ((i * 23) % 80)
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <circle cx="0" cy="-3" r="3.5" fill="#FEF08A" />
                  <circle cx="-3" cy="1" r="3.5" fill="#FDE047" />
                  <circle cx="3" cy="1" r="3.5" fill="#FACC15" />
                  <circle cx="0" cy="0" r="1.5" fill="#CA8A04" />
                </g>
              )
            })}
          </g>
        )}

        {/* ============================================================== */}
        {/* 10. 🌸 자연풍경: 낭만 벚꽃 호숫가 (room-cherry-blossom-lake) */}
        {/* ============================================================== */}
        {themeId === 'room-cherry-blossom-lake' && (
          <g>
            <rect width="400" height="300" fill="url(#cherry-sky)" />
            {/* 잔잔한 벚꽃 호수 */}
            <rect y="160" width="400" height="140" fill="#CCFBF1" opacity="0.8" />
            <path d="M 0 180 Q 100 175 200 180 T 400 180" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" fill="none" />
            <path d="M 0 215 Q 100 210 200 215 T 400 215" stroke="#F472B6" strokeWidth="1" opacity="0.3" fill="none" />

            {/* 호숫가 아치형 목조 다리 */}
            <g transform="translate(140, 140)" opacity="0.9">
              <path d="M 0 40 Q 60 10 120 40" stroke="#78350F" strokeWidth="5" fill="none" />
              <path d="M 0 48 Q 60 18 120 48" stroke="#92400E" strokeWidth="3" fill="none" />
              {/* 난간 기둥 */}
              {[15, 35, 60, 85, 105].map((x, i) => (
                <line key={i} x1={x} y1="25" x2={x} y2="45" stroke="#78350F" strokeWidth="2" />
              ))}
            </g>

            {/* 좌우 벚꽃 나무 가지 드리움 */}
            <g transform="translate(-10, -10)" opacity="0.92">
              <path d="M 0 0 Q 70 30 110 80" stroke="#78350F" strokeWidth="4" fill="none" />
              {[
                [40, 20], [60, 35], [80, 50], [95, 70], [110, 85], [30, 35]
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="10" fill="#F472B6" opacity="0.85" />
              ))}
            </g>
            <g transform="translate(320, -10)" opacity="0.92">
              <path d="M 80 0 Q 20 40 -10 90" stroke="#78350F" strokeWidth="4" fill="none" />
              {[
                [60, 25], [35, 45], [15, 65], [-5, 85], [45, 15]
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="10" fill="#FBCFE8" opacity="0.9" />
              ))}
            </g>

            {/* 물 위에 뜬 벚꽃잎들 */}
            {[
              [80, 210], [140, 240], [210, 220], [290, 250], [350, 230], [50, 260]
            ].map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx="5" ry="2.5" fill="#FB7185" opacity="0.8" />
            ))}
          </g>
        )}

        {/* ============================================================== */}
        {/* 11. 🎋 자연풍경: 달빛 반딧불이 대나무 숲 (room-moonlight-bamboo) */}
        {/* ============================================================== */}
        {themeId === 'room-moonlight-bamboo' && (
          <g>
            <rect width="400" height="300" fill="url(#bamboo-sky)" />
            {/* 거대한 밝은 보름달 */}
            <circle cx="280" cy="65" r="38" fill="#FEF08A" opacity="0.9" filter="url(#soft-glow)" />

            {/* 곧게 뻗은 대나무 기둥들 */}
            {[30, 65, 110, 160, 210, 320, 360, 385].map((x, i) => (
              <g key={i} opacity="0.85">
                <rect x={x} y="0" width="10" height="300" fill="#047857" />
                {/* 대나무 마디 */}
                {[50, 110, 170, 230].map((y, j) => (
                  <line key={j} x1={x - 2} y1={y} x2={x + 12} y2={y} stroke="#064E3B" strokeWidth="3" />
                ))}
              </g>
            ))}

            {/* 🎋 대나무 잎사귀 다발들 */}
            {[
              [35, 60], [70, 120], [115, 90], [165, 150], [215, 80], [325, 110]
            ].map(([x, y], i) => (
              <g key={i} transform={`translate(${x}, ${y})`}>
                <path d="M 0 0 Q 20 -15 35 -5 Q 20 5 0 0" fill="#10B981" opacity="0.9" />
                <path d="M 0 0 Q -20 -15 -35 -5 Q -20 5 0 0" fill="#059669" opacity="0.9" />
                <path d="M 0 0 Q 15 15 25 30 Q 10 20 0 0" fill="#34D399" opacity="0.85" />
              </g>
            ))}

            {/* ✨ 반짝이는 노란 반딧불이 불빛 구체들 */}
            {[
              [50, 180], [90, 220], [140, 160], [190, 240], [250, 190],
              [300, 230], [340, 170], [370, 210], [120, 260], [220, 140]
            ].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="7" fill="#FEF08A" opacity="0.45" filter="url(#soft-glow)" />
                <circle cx={x} cy={y} r="2.5" fill="#FFFFFF" opacity="0.95" />
              </g>
            ))}
          </g>
        )}

        {/* ============================================================== */}
        {/* 12. 🌊 자연풍경: 트로피컬 에메랄드 해변 (room-tropical-ocean) */}
        {/* ============================================================== */}
        {themeId === 'room-tropical-ocean' && (
          <g>
            <rect width="400" height="300" fill="url(#tropical-sky)" />
            {/* 햇살 태양 */}
            <circle cx="80" cy="50" r="28" fill="#FEF08A" opacity="0.85" filter="url(#soft-glow)" />

            {/* 청록빛 에메랄드 산호초 바다 */}
            <rect y="120" width="400" height="90" fill="#06B6D4" opacity="0.75" />
            <path d="M 0 140 Q 100 132 200 140 T 400 140" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" fill="none" />
            <path d="M 0 170 Q 100 162 200 170 T 400 170" stroke="#A5F3FC" strokeWidth="2" opacity="0.7" fill="none" />

            {/* 하얀 산호 백사장 */}
            <path d="M 0 200 Q 180 185 400 205 L 400 300 L 0 300 Z" fill="#FEF3C7" opacity="0.95" />
            {/* 밀려오는 하얀 파도 거품 */}
            <path d="M 0 200 Q 180 185 400 205" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.9" fill="none" />

            {/* 불가사리와 조개껍질 */}
            <g transform="translate(60, 240)">
              <polygon points="0,-7 2,-2 7,-2 3,1 5,6 0,3 -5,6 -3,1 -7,-2 -2,-2" fill="#F43F5E" opacity="0.9" />
            </g>
            <g transform="translate(320, 250)">
              <ellipse cx="0" cy="0" rx="8" ry="5" fill="#FB923C" opacity="0.85" />
            </g>
          </g>
        )}

        {/* ============================================================== */}
        {/* 13. 🍰 클래식: 달콤 파티세리 룸 (기본값) */}
        {/* ============================================================== */}
        {(themeId === 'room-patisserie' || !themeId) && (
          <g opacity="0.8">
            <rect width="400" height="300" fill="#FFF1F2" />
            {/* 상단 삼각 가랜드 플래그 */}
            {Array.from({ length: 9 }).map((_, i) => (
              <polygon
                key={i}
                points={`${15 + i * 44},0 ${35 + i * 44},0 ${25 + i * 44},28`}
                fill={i % 3 === 0 ? '#FB7185' : i % 3 === 1 ? '#FDE047' : '#6EE7B7'}
                opacity="0.8"
              />
            ))}
            {/* 베이커리 선반 실루엣 */}
            <rect x="30" y="75" width="340" height="8" rx="3" fill="#FED7AA" />
            <rect x="50" y="55" width="22" height="20" rx="4" fill="#FDA4AF" opacity="0.7" />
            <rect x="85" y="50" width="26" height="25" rx="5" fill="#FDE047" opacity="0.7" />
            <rect x="290" y="52" width="24" height="23" rx="4" fill="#A7F3D0" opacity="0.7" />
            {/* 하단 체크 바닥 */}
            <rect y="210" width="400" height="90" fill="#FED7AA" opacity="0.45" />
          </g>
        )}

        {/* ============================================================== */}
        {/* 14. 🌌 클래식: 별빛 은하수 룸 */}
        {/* ============================================================== */}
        {themeId === 'room-galaxy' && (
          <g opacity="0.9">
            <rect width="400" height="300" fill="#1E1B4B" />
            <circle cx="320" cy="60" r="28" fill="#FDE047" opacity="0.8" filter="url(#soft-glow)" />
            {/* 초승달 모양 */}
            <circle cx="332" cy="54" r="25" fill="#1E1B4B" />
            {/* 별자리 라인 */}
            <path d="M 50 80 L 90 60 L 130 90 L 180 70" stroke="#FDE047" strokeWidth="1.2" strokeDasharray="3 3" fill="none" opacity="0.7" />
            {[[50, 80], [90, 60], [130, 90], [180, 70]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2.5" fill="#FEF08A" />
            ))}
            <rect y="210" width="400" height="90" fill="#312E81" opacity="0.7" />
          </g>
        )}

        {/* ============================================================== */}
        {/* 15. 🍓 클래식: 생딸기 정원 룸 */}
        {/* ============================================================== */}
        {themeId === 'room-berry' && (
          <g opacity="0.85">
            <rect width="400" height="300" fill="#DCFCE7" />
            <circle cx="80" cy="50" r="26" fill="#FDE047" opacity="0.7" filter="url(#soft-glow)" />
            {/* 딸기 덩굴 아치 */}
            <path d="M 0 100 Q 200 40 400 100" stroke="#16A34A" strokeWidth="3" fill="none" opacity="0.7" />
            {[60, 140, 220, 300, 360].map((x, i) => (
              <g key={i} transform={`translate(${x}, ${90 + (i % 2 === 0 ? -10 : 10)})`}>
                <path d="M 0 -2 L 5 8 L -5 8 Z" fill="#EF4444" />
                <circle cx="0" cy="-2" r="3" fill="#22C55E" />
              </g>
            ))}
            <rect y="210" width="400" height="90" fill="#86EFAC" opacity="0.6" />
          </g>
        )}

        {/* ============================================================== */}
        {/* 16. ☕ 클래식: 빈티지 초코 카페 룸 */}
        {/* ============================================================== */}
        {themeId === 'room-vintage' && (
          <g opacity="0.85">
            <rect width="400" height="300" fill="#EFEBE9" />
            {/* 따스한 벽돌 패턴 */}
            {Array.from({ length: 6 }).map((_, row) => (
              <g key={row} opacity="0.25">
                {Array.from({ length: 10 }).map((_, col) => (
                  <rect
                    key={col}
                    x={(row % 2 === 0 ? 0 : 20) + col * 42}
                    y={20 + row * 25}
                    width="38"
                    height="18"
                    rx="2"
                    fill="#795548"
                  />
                ))}
              </g>
            ))}
            {/* 원목 카페 선반 */}
            <rect x="40" y="160" width="320" height="12" rx="3" fill="#8D6E63" />
            <rect y="210" width="400" height="90" fill="#795548" opacity="0.65" />
          </g>
        )}
      </svg>
    </div>
  )
}

