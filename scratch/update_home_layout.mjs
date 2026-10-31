import fs from 'node:fs';

let code = fs.readFileSync('src/screens/MonsterHome.tsx', 'utf8');

// 1. 펫 머리 겹침 방지를 위해 펫 컨테이너를 아래로 내림 (paddingTop: 34px)
code = code.replace(
  "style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}",
  "style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 34 }}"
);

// 2. 말풍선 위치 최상단 헤드룸(top: 0 또는 top: 24)으로 분리
code = code.replace(
  "top: isExploring || trainSess || towerSess || evoEligibility.canEvolve ? 30 : 6,",
  "top: isExploring || trainSess || towerSess || evoEligibility.canEvolve ? 26 : 2,"
);

// 3. 펫창 아래 레벨 뱃지 1줄 일렬 배치 (flexWrap: nowrap, 칩 패딩 미세조정)
const oldChips = `          <div className="row wrap center" style={{ gap: 4 }}>
            <span className="chip" style={{ fontSize: 11, padding: '2px 7px' }}>{info?.name ?? monster.species}</span>
            {info?.textureLabel && <span className="chip honey" style={{ fontSize: 11, padding: '2px 7px' }}>{info.textureLabel}</span>}
            <span className="chip" style={{ fontSize: 11, padding: '2px 7px' }}>
              <ElementIcon element={monster.element} size={13} />
              {ELEMENT_INFO[monster.element].label}
            </span>
            <span className="chip coral" style={{ fontSize: 11, padding: '2px 7px' }}>Lv.{monster.level}</span>
          </div>`;

const newChips = `          {/* 🌟 1줄 일렬 정렬: 종족 · 식감 · 속성 · 레벨 뱃지 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'nowrap',
              gap: 4,
              width: '100%',
              maxWidth: 380,
              padding: '0 4px',
              boxSizing: 'border-box',
            }}
          >
            <span className="chip" style={{ fontSize: 10.5, padding: '2px 6px', whiteSpace: 'nowrap' }}>
              {info?.name ?? monster.species}
            </span>
            {info?.textureLabel && (
              <span className="chip honey" style={{ fontSize: 10.5, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                {info.textureLabel}
              </span>
            )}
            <span className="chip" style={{ fontSize: 10.5, padding: '2px 6px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <ElementIcon element={monster.element} size={12} />
              <span>{ELEMENT_INFO[monster.element].label}</span>
            </span>
            <span className="chip coral" style={{ fontSize: 10.5, padding: '2px 6px', whiteSpace: 'nowrap', fontWeight: 900 }}>
              Lv.{monster.level}
            </span>
          </div>`;

if (code.includes(oldChips)) {
  code = code.replace(oldChips, newChips);
  console.log('MonsterHome: Single-line badges applied');
} else {
  console.log('oldChips not found');
}

fs.writeFileSync('src/screens/MonsterHome.tsx', code, 'utf8');
console.log('MonsterHome: Pet lowered and headroom expanded successfully');

