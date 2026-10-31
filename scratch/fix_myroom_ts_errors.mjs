import fs from 'node:fs';

// 1. MyRoomScreen.tsx 수정
let roomCode = fs.readFileSync('src/screens/MyRoomScreen.tsx', 'utf8');

const targetToggle = `  const handleToggleBgm = () => {
    const nextState = miniRoomBgm.toggle()
    setBgmPlaying(nextState)
    if (nextState) {
      showToast('🎵 달콤 파티세리의 오후 햇살 왈츠 BGM을 재생합니다!')
    } else {
      showToast('⏸️ BGM을 일시 정지했습니다.')
    }
  }`;

const replacementToggle = `  const handleToggleBgm = () => {
    const nextState = miniRoomBgm.toggle()
    setBgmPlaying(nextState)
    if (nextState) {
      const info = BGM_TRACKS.find(t => t.id === currentTrack) ?? BGM_TRACKS[0]
      showToast(\`\${info.icon} [\${info.name}] 사운드를 재생합니다!\`)
    } else {
      showToast('⏸️ BGM을 일시 정지했습니다.')
    }
  }

  const handleSelectTrack = (track: BgmTrack) => {
    miniRoomBgm.setTrack(track)
    setCurrentTrack(track)
    setBgmPlaying(true)
    setShowBgmPicker(false)
    const info = BGM_TRACKS.find(t => t.id === track) ?? BGM_TRACKS[0]
    showToast(\`✨ BGM이 [\${info.icon} \${info.name}]으로 변경되었습니다!\`)
  }`;

roomCode = roomCode.replace(targetToggle, replacementToggle);

const bgmModalCode = `      {/* 🎵 미니룸 감성 사운드 & 자연의 소리 선택 모달 */}
      {showBgmPicker && (
        <div
          onClick={() => setShowBgmPicker(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(20, 10, 15, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 12,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 400,
              background: '#FFFDF9',
              borderRadius: 22,
              padding: '18px 16px',
              border: '2px solid #FBCFE8',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 20 }}>🎵</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#831843' }}>미니룸 감성 사운드 선택</h3>
                  <p style={{ margin: 0, fontSize: 11, color: '#9D174D' }}>자연의 소리 및 클래식 오르골로 공간을 채워보세요</p>
                </div>
              </div>
              <button
                onClick={() => setShowBgmPicker(false)}
                style={{
                  border: 'none',
                  background: '#FCE7F3',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  cursor: 'pointer',
                  fontWeight: 900,
                  color: '#831843',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {BGM_TRACKS.map((t) => {
                const isSelected = currentTrack === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTrack(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: isSelected ? '2px solid #DB2777' : '1.5px solid #FCE7F3',
                      background: isSelected ? 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isSelected ? '0 3px 10px rgba(219,39,119,0.2)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: isSelected ? '#9D174D' : '#3E2723' }}>
                          {t.name}
                        </span>
                        {isSelected && (
                          <span style={{ fontSize: 11, color: '#DB2777', fontWeight: 900 }}>재생 중 ♬</span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: '#8D6E63' }}>{t.sub}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
`;

roomCode = roomCode.replace(
  '{/* 상단 알림창 박스 (Notification Banner) */}',
  bgmModalCode + '\n      {/* 상단 알림창 박스 (Notification Banner) */}'
);

fs.writeFileSync('src/screens/MyRoomScreen.tsx', roomCode, 'utf8');
console.log('Fixed MyRoomScreen.tsx: BGM picker modal wired');

// 2. parts.tsx 수정
let partsCode = fs.readFileSync('src/ui/parts.tsx', 'utf8');
partsCode = partsCode.replace(
  "import { STAT_BAR_MAX, STAT_INFO } from '../config/species'",
  "import { STAT_INFO } from '../config/species'"
);
fs.writeFileSync('src/ui/parts.tsx', partsCode, 'utf8');
console.log('Fixed parts.tsx: unused STAT_BAR_MAX removed');

