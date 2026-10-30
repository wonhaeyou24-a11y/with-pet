import { EggArt } from './EggArt'

// 🥚 앱 입장 로딩 화면: 귀엽게 콩닥콩닥 움직이며 알 안에 달콤한 색이 칠해지는 애니메이션
export default function Loading({ text = '달콤한 디저트 알을 깨우는 중…' }: { text?: string }) {
  return (
    <main
      className="screen center center-text"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #FFFDF8 0%, #FFF5EB 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-busy="true"
    >
      <style>{`
        @keyframes eggPlayfulMove {
          0% { transform: translateY(0) rotate(0deg) scale(1); }
          15% { transform: translateY(-16px) rotate(-6deg) scale(0.98, 1.05); }
          30% { transform: translateY(0) rotate(4deg) scale(1.04, 0.96); }
          45% { transform: translateY(-10px) rotate(-3deg) scale(0.99, 1.03); }
          60% { transform: translateY(0) rotate(2deg) scale(1.02, 0.98); }
          100% { transform: translateY(0) rotate(0deg) scale(1); }
        }
        @keyframes eggColorPaint {
          0% {
            clip-path: inset(100% 0 0 0);
            filter: saturate(1.8) brightness(1.1);
          }
          50% {
            clip-path: inset(0 0 0 0);
            filter: saturate(1.2) brightness(1.05);
          }
          85% {
            clip-path: inset(0 0 0 0);
            filter: saturate(1) brightness(1);
          }
          100% {
            clip-path: inset(100% 0 0 0);
            filter: saturate(1.8) brightness(1.1);
          }
        }
        @keyframes sparklePop {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(45deg); opacity: 1; }
        }
      `}</style>

      {/* 알 주변에 피어나는 마법의 반짝이 가루 */}
      <div style={{ position: 'relative', width: 140, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ position: 'absolute', top: 10, left: 15, fontSize: 18, animation: 'sparklePop 2.2s infinite ease-in-out 0.2s', pointerEvents: 'none' }}>✨</span>
        <span style={{ position: 'absolute', top: 25, right: 12, fontSize: 16, animation: 'sparklePop 2.2s infinite ease-in-out 0.8s', pointerEvents: 'none' }}>💖</span>
        <span style={{ position: 'absolute', bottom: 25, left: 10, fontSize: 14, animation: 'sparklePop 2.2s infinite ease-in-out 1.4s', pointerEvents: 'none' }}>⭐</span>
        <span style={{ position: 'absolute', bottom: 30, right: 15, fontSize: 16, animation: 'sparklePop 2.2s infinite ease-in-out 0.5s', pointerEvents: 'none' }}>🌸</span>

        {/* 1. 움직이는 알 컨테이너 */}
        <div
          style={{
            position: 'relative',
            animation: 'eggPlayfulMove 2.4s infinite cubic-bezier(0.28, 0.84, 0.42, 1)',
            filter: 'drop-shadow(0 12px 20px rgba(255, 138, 101, 0.25))',
          }}
        >
          {/* 베이스 흑백/단색 밑그림 알 */}
          <div style={{ filter: 'grayscale(0.9) opacity(0.35)' }}>
            <EggArt rarity="common" mood="cozy" size={125} />
          </div>

          {/* 2. 아래에서 위로 달콤한 색칠이 차오르는 컬러 레이어 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              animation: 'eggColorPaint 3.2s infinite cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <EggArt rarity="rare" mood="happy" size={125} />
          </div>
        </div>
      </div>

      <p
        className="sub"
        role="status"
        style={{
          marginTop: 18,
          fontSize: 13,
          fontWeight: 800,
          color: '#8D6E63',
          background: 'rgba(255, 255, 255, 0.85)',
          padding: '6px 16px',
          borderRadius: 999,
          border: '1px solid #FFE0B2',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        {text}
      </p>
    </main>
  )
}
