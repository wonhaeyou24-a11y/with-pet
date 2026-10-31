import fs from 'node:fs';

let code = fs.readFileSync('src/screens/DessertPlaza.tsx', 'utf8');

// 상단 계절/이벤트 테마 선택 버튼을 깔끔한 사계절 뱃지로 전환 (지인 및 외부인은 선택창 미노출)
const oldThemeButton = `          {/* 계절/이벤트 테마 변경 버튼 */}
          <button
            onClick={() => setShowThemeModal(true)}
            style={{
              padding: '4px 8px',
              borderRadius: 10,
              border: '1.5px solid #FFB74D',
              background: '#FFF8E1',
              color: '#E65100',
              fontSize: 11,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {themeObj.seasonLabel} ▾
          </button>`;

const newThemeBadge = `          {/* 🍁 현실 사계절 및 이벤트 자동 동기화 뱃지 (지인/방문자는 선택창이 보이지 않고 계절 뱃지만 표시) */}
          <div
            style={{
              padding: '4px 9px',
              borderRadius: 10,
              border: '1.5px solid #FFB74D',
              background: '#FFF8E1',
              color: '#E65100',
              fontSize: 11,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              userSelect: 'none',
            }}
            title="실제 현실 계절 및 기념일 일정에 맞춰 자동으로 광장 테마가 변화합니다"
          >
            <span>{themeObj.seasonLabel}</span>
          </div>`;

if (code.includes(oldThemeButton)) {
  code = code.replace(oldThemeButton, newThemeBadge);
  fs.writeFileSync('src/screens/DessertPlaza.tsx', code, 'utf8');
  console.log('DessertPlaza: Theme selector hidden from guests and locked to auto season badge');
} else {
  console.log('oldThemeButton not found in DessertPlaza.tsx');
}

