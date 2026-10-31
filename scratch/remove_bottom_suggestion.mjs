import fs from 'node:fs';

let code = fs.readFileSync('src/screens/MonsterHome.tsx', 'utf8');

// 하부 중복 제안 카드 제거
const oldCard = `      {/* 3-1. 펫의 능동적 자율 제안 소통 카드 (컴팩트 독립 슬롯) */}
      {suggestion && (
        <div
          style={{
            padding: '6px 10px',
            borderRadius: 12,
            background: 'linear-gradient(90deg, #FFF8E1 0%, #FFECB3 100%)',
            border: '1.5px solid #FFC107',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(255,193,7,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#4E342E',
                lineHeight: 1.25,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {suggestion.message}
            </span>
          </div>
          <div className="row" style={{ gap: 4, flexShrink: 0 }}>
            <button
              className="chip honey"
              onClick={handleAcceptSuggestion}
              style={{ cursor: 'pointer', border: 'none', fontWeight: 900, fontSize: 11, padding: '2px 7px', maxWidth: 104, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
            >
              {suggestion.actionLabel}
            </button>
            <button
              className="chip"
              onClick={() => {
                dismissPetSuggestion(monster.id)
                setSuggestion(null)
              }}
              style={{ cursor: 'pointer', border: 'none', fontSize: 11, padding: '2px 5px' }}
              title="닫기"
            >
              ✕
            </button>
          </div>
        </div>
      )}`;

if (code.includes(oldCard)) {
  code = code.replace(oldCard, '');
  console.log('MonsterHome: Redundant bottom suggestion card removed successfully');
} else {
  console.log('oldCard not found in MonsterHome.tsx');
}

fs.writeFileSync('src/screens/MonsterHome.tsx', code, 'utf8');

