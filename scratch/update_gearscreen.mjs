import fs from 'node:fs';

let code = fs.readFileSync('src/screens/GearScreen.tsx', 'utf8');

// 1. maxEnhanceItem state 추가
if (!code.includes('maxEnhanceItem')) {
  code = code.replace(
    'const [fxKey, setFxKey] = useState(0)',
    'const [fxKey, setFxKey] = useState(0)\n  const [maxEnhanceItem, setMaxEnhanceItem] = useState<{ item: GearItem; def: GearDef; level: number } | null>(null)\n  const [sparkleAnim, setSparkleAnim] = useState(false)'
  );
}

// 2. onEnhance 핸들러 강화
const oldEnhance = `  const onEnhance = (it: GearItem) =>
    run(async () => {
      const r = await enhanceGear(it.id)
      if (r.coins !== undefined) onCoins(r.coins)
      if (!r.ok) return say(r.message, 'bad')
      setFxKey((k) => k + 1)
      playDessertAsmr(r.success ? 'starlight-ting' : 'jelly-gummy', r.success ? 3 : 0)
      say(r.message, r.success ? 'win' : 'fail')
    })`;

const newEnhance = `  const onEnhance = (it: GearItem) =>
    run(async () => {
      const r = await enhanceGear(it.id)
      if (r.coins !== undefined) onCoins(r.coins)
      if (!r.ok) return say(r.message, 'bad')
      setFxKey((k) => k + 1)
      const nextLvl = r.level ?? (it.level + 1)
      if (r.success) {
        setSparkleAnim(true)
        setTimeout(() => setSparkleAnim(false), 1200)
        if (nextLvl >= 10) {
          // 🌟 10강(MAX) 달성 시 화면 중앙 부유 & 시네마틱 황금 광선 임팩트
          const d = gearDefById(it.def)
          if (d) {
            setMaxEnhanceItem({ item: it, def: d, level: nextLvl })
            playDessertAsmr('kataifi-crunch', 4)
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([100, 50, 150, 50, 300])
            }
          }
        } else {
          playDessertAsmr('starlight-ting', 3)
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([60, 40, 90])
          }
        }
      } else {
        playDessertAsmr('jelly-gummy', 0)
      }
      say(r.message, r.success ? 'win' : 'fail')
    })`;

code = code.replace(oldEnhance, newEnhance);

// 3. 키프레임 애니메이션 추가
const keyframes = `
        @keyframes godRaysRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes maxPulse { 0% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.7)); } 50% { transform: scale(1.08); filter: drop-shadow(0 0 35px rgba(255, 179, 0, 1)); } 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.7)); } }
        @keyframes sparkleFloat { 0% { opacity: 0; transform: translateY(10px) scale(0.5); } 50% { opacity: 1; transform: translateY(-10px) scale(1.2); } 100% { opacity: 0; transform: translateY(-25px) scale(0.8); } }
`;

code = code.replace('@keyframes gearWin {', keyframes + '        @keyframes gearWin {');

// 4. 모달 오버레이 렌더링 추가
const overlayRender = `
      {/* 🌟 10강(MAX) 극한 돌파 시네마틱 중앙 부유 임팩트 오버레이 */}
      {maxEnhanceItem && (
        <div
          onClick={() => setMaxEnhanceItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 10, 8, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {/* 뒤쪽 회전하는 황금 신의 광선 (God-rays) */}
          <div
            style={{
              position: 'absolute',
              width: 460,
              height: 460,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.45) 0%, rgba(255, 160, 0, 0.18) 45%, transparent 70%)',
              animation: 'godRaysRotate 12s linear infinite',
              pointerEvents: 'none',
            }}
          />

          {/* 중앙 부유하는 10강 장비 카드 */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              animation: 'maxPulse 2.4s ease-in-out infinite',
            }}
          >
            {/* 타이틀 배너 */}
            <div
              style={{
                background: 'linear-gradient(90deg, #FFD700, #FF6F00, #FFD700)',
                backgroundSize: '200% auto',
                color: '#3E2723',
                padding: '6px 20px',
                borderRadius: 999,
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: '0.5px',
                boxShadow: '0 4px 20px rgba(255, 215, 0, 0.8)',
                textAlign: 'center',
              }}
            >
              🌟 MAX +10강 극한 돌파 성공! 🌟
            </div>

            {/* 거대 장비 아이콘 및 오라 서클 */}
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 36,
                background: 'linear-gradient(135deg, #FFF8E1 0%, #FFE082 50%, #FFB300 100%)',
                border: '4px solid #FFFFFF',
                boxShadow: '0 10px 40px rgba(255, 179, 0, 0.9), inset 0 0 20px rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 68,
              }}
            >
              {maxEnhanceItem.def.icon}
            </div>

            {/* 장비 명칭 및 강화 수치 */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#FFFFFF', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                {maxEnhanceItem.def.name} <span style={{ color: '#FFD700' }}>+10</span>
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#FFE082', fontWeight: 800 }}>
                {statLine(maxEnhanceItem.def, 10)}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                디저트 펫에게 장착하면 궁극의 파티세리 능력을 발휘합니다!
              </p>
            </div>

            {/* 확인 닫기 버튼 */}
            <button
              onClick={() => setMaxEnhanceItem(null)}
              style={{
                marginTop: 10,
                padding: '12px 36px',
                borderRadius: 16,
                border: 'none',
                background: 'linear-gradient(180deg, #FFB300, #F57C00)',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 124, 0, 0.6)',
                transition: 'transform 0.1s',
              }}
            >
              ✨ 완벽해요! 확인
            </button>
          </div>
        </div>
      )}
`;

code = code.replace('{/* 선택한 장비 상세 + 착용·강화 */}', overlayRender + '\n      {/* 선택한 장비 상세 + 착용·강화 */}');

fs.writeFileSync('src/screens/GearScreen.tsx', code, 'utf8');
console.log('GearScreen: Enhancement impacts and +10 MAX overlay applied');

