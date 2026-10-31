import fs from 'node:fs';

let code = fs.readFileSync('src/screens/MyRoomScreen.tsx', 'utf8');

// 1. BGM_TRACKS import 추가
code = code.replace(
  "import { miniRoomBgm } from '../lib/bgmPlayer'",
  "import { miniRoomBgm, BGM_TRACKS, type BgmTrack } from '../lib/bgmPlayer'"
);

// 2. 상태 추가 (currentTrack, showBgmPicker)
code = code.replace(
  'const [bgmPlaying, setBgmPlaying] = useState<boolean>(() => miniRoomBgm.getStatus())',
  `const [bgmPlaying, setBgmPlaying] = useState<boolean>(() => miniRoomBgm.getStatus())
  const [currentTrack, setCurrentTrack] = useState<BgmTrack>(() => miniRoomBgm.getTrack())
  const [showBgmPicker, setShowBgmPicker] = useState<boolean>(false)`
);

// 3. handleToggleBgm 및 handleSelectTrack 구현
const oldBgmToggle = `  const handleToggleBgm = () => {
    const nextState = miniRoomBgm.toggle()
    setBgmPlaying(nextState)
    if (nextState) {
      showToast('🎵 달콤 파티세리의 오후 햇살 왈츠 BGM을 재생합니다!')
    }
  }`;

const newBgmToggle = `  const handleToggleBgm = () => {
    const nextState = miniRoomBgm.toggle()
    setBgmPlaying(nextState)
    if (nextState) {
      const info = BGM_TRACKS.find(t => t.id === currentTrack) ?? BGM_TRACKS[0]
      showToast(\`\${info.icon} [\${info.name}] 사운드를 재생합니다!\`)
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

code = code.replace(oldBgmToggle, newBgmToggle);

// 4. BGM 버튼 렌더링 교체 (재생 토글 버튼 + 사운드 선택 드롭다운 뱃지)
const oldBgmBar = `        <button
          onClick={handleToggleBgm}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: bgmPlaying ? '#FCE7F3' : '#FFFFFF',
            border: '1px solid #F472B6',
            borderRadius: 8,
            padding: '2px 8px',
            color: '#831843',
            fontWeight: 800,
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          <span>{bgmPlaying ? '🔊 BGM ON' : '🔈 BGM OFF'}</span>
          <span style={{ color: '#BE185D' }}>오후 햇살 왈츠 ♬</span>
        </button>`;

const newBgmBar = `        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={handleToggleBgm}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: bgmPlaying ? '#FCE7F3' : '#FFFFFF',
              border: '1px solid #F472B6',
              borderRadius: 8,
              padding: '2px 7px',
              color: '#831843',
              fontWeight: 800,
              fontSize: 10,
              cursor: 'pointer',
            }}
            title="BGM 켜기/끄기"
          >
            <span>{bgmPlaying ? '🔊' : '🔈'}</span>
            <span style={{ color: '#BE185D' }}>
              {(BGM_TRACKS.find(t => t.id === currentTrack) ?? BGM_TRACKS[0]).name}
            </span>
          </button>
          <button
            onClick={() => setShowBgmPicker(true)}
            style={{
              padding: '2px 6px',
              borderRadius: 8,
              border: '1px solid #F472B6',
              background: '#FFF0F5',
              color: '#9D174D',
              fontWeight: 800,
              fontSize: 10,
              cursor: 'pointer',
            }}
            title="자연의 소리 및 클래식 음악 선택"
          >
            음악 선택 ▾
          </button>
        </div>`;

code = code.replace(oldBgmBar, newBgmBar);

// 5. BGM 선택 모달 팝오버 렌더링 추가
const bgmModal = `
      {/* 🎵 미니룸 감성 사운드 & 자연의 소리 선택 모달 */}
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

code = code.replace('{/* 하단 미니룸 바닥판 */}', bgmModal + '\n      {/* 하단 미니룸 바닥판 */}');

fs.writeFileSync('src/screens/MyRoomScreen.tsx', code, 'utf8');
console.log('MyRoomScreen: 4 BGM track selector integrated successfully');

