import fs from 'node:fs';

let code = fs.readFileSync('src/screens/MonsterHome.tsx', 'utf8');

// 1. Replace Badges and Balloon
const oldPetInner = `          {/* 진화 가능 강조 뱃지 */}
          {evoEligibility.canEvolve && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onOpenEvolution?.()
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 12,
                padding: '3px 10px',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #FFD700, #FF6F00)',
                color: '#3E2723',
                fontSize: 11,
                fontWeight: 900,
                boxShadow: '0 3px 10px rgba(255,215,0,0.5)',
                cursor: 'pointer',
                animation: 'bounce 1.5s infinite ease-in-out',
                whiteSpace: 'nowrap',
              }}
            >
              ✨ {evoEligibility.targetStage}단계 각성 진화 가능!
            </div>
          )}

          {/* 백그라운드 훈련 / 타워 탐험 진행 뱃지 */}
          {trainSess && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onOpenTrain?.()
              }}
              style={{
                position: 'absolute',
                top: 2,
                left: 4,
                zIndex: 10,
                padding: '3px 8px',
                borderRadius: 999,
                background: trainLeftSec > 0 ? '#FF7A59' : '#4CAF50',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 900,
                boxShadow: '0 3px 8px rgba(255,122,89,0.3)',
              }}
            >
              {trainLeftSec > 0
                ? \`🏋️ [훈련] \${Math.floor(trainLeftSec / 60)}:\${String(trainLeftSec % 60).padStart(2, '0')}\`
                : '🎉 훈련 완료!'}
            </div>
          )}
          {towerSess && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onOpenTrain?.()
              }}
              style={{
                position: 'absolute',
                top: 2,
                right: 4,
                zIndex: 10,
                padding: '3px 8px',
                borderRadius: 999,
                background: '#7C4DFF',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 900,
                boxShadow: '0 3px 8px rgba(124,77,255,0.3)',
              }}
            >
              🏰 타워 {towerSess.currentFloor}층 등반 중
            </div>
          )}

          {/* 펫의 자율 생각 말풍선 */}
          {!asmrBubble && suggestion && (
            <div
              style={{
                position: 'absolute',
                top: 2,
                zIndex: 9,
                padding: '4px 11px',
                borderRadius: 14,
                background: 'rgba(255, 253, 245, 0.96)',
                border: '1.5px solid #FFB74D',
                color: '#4E342E',
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1.3,
                textAlign: 'center',
                boxShadow: '0 3px 10px rgba(78,52,46,0.15)',
                animation: 'bounce 2s infinite ease-in-out',
                maxWidth: '92%',
                // 한 줄에 다 안 들어가면 두 줄까지 보여 주고, 그래도 길면 말줄임
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              💭 {suggestion.balloon}
            </div>
          )}`;

const newPetInner = `          {/* 상단 액티브 상태 뱃지 (진화 가능 / 훈련 / 타워 / 탐험) */}
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: 0,
              right: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 4px',
              zIndex: 14,
              pointerEvents: 'none',
            }}
          >
            {/* 좌측: 탐험 중 뱃지 or 훈련 뱃지 */}
            <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
              {isExploring && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenExplore?.()
                  }}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #10B981, #059669)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title="터치하면 탐험 화면으로 이동합니다"
                >
                  <span>🧭 [{exploreTrip?.region} {exploreTrip?.zone}구역] 탐험 중</span>
                  <span style={{ background: 'rgba(0,0,0,0.22)', padding: '1px 5px', borderRadius: 6 }}>
                    {Math.floor(exploreLeftSec / 60)}:{String(exploreLeftSec % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              {trainSess && !isExploring && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenTrain?.()
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: trainLeftSec > 0 ? '#FF7A59' : '#4CAF50',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(255,122,89,0.3)',
                    cursor: 'pointer',
                  }}
                >
                  {trainLeftSec > 0
                    ? \`🏋️ [훈련] \${Math.floor(trainLeftSec / 60)}:\${String(trainLeftSec % 60).padStart(2, '0')}\`
                    : '🎉 훈련 완료!'}
                </div>
              )}
            </div>

            {/* 우측: 타워 등반 뱃지 or 진화 가능 뱃지 */}
            <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
              {towerSess && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenTrain?.()
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: '#7C4DFF',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(124,77,255,0.3)',
                    cursor: 'pointer',
                  }}
                >
                  🏰 타워 {towerSess.currentFloor}층 등반 중
                </div>
              )}
              {evoEligibility.canEvolve && (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenEvolution?.()
                  }}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #FFD700, #FF6F00)',
                    color: '#3E2723',
                    fontSize: 10,
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(255,215,0,0.5)',
                    cursor: 'pointer',
                    animation: 'bounce 1.5s infinite ease-in-out',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✨ 각성 진화 가능!
                </div>
              )}
            </div>
          </div>

          {/* 펫의 자율 생각 말풍선 (크기 확대, 또렷한 굵은 폰트, 말풍선 꼬리표 부착, 펫과 겹치지 않는 헤드룸 위치) */}
          {!asmrBubble && suggestion && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                handleAcceptSuggestion()
              }}
              style={{
                position: 'absolute',
                top: isExploring || trainSess || towerSess || evoEligibility.canEvolve ? 30 : 6,
                zIndex: 13,
                maxWidth: '88%',
                padding: '6px 14px',
                borderRadius: 16,
                background: '#FFFDF5',
                border: '2px solid #FF9800',
                color: '#3E2723',
                fontSize: 13,
                fontWeight: 900,
                lineHeight: 1.35,
                textAlign: 'center',
                boxShadow: '0 4px 14px rgba(78,52,46,0.18)',
                animation: 'bounce 2s infinite ease-in-out',
                cursor: 'pointer',
              }}
              title="터치하면 펫의 생각대로 바로 이동합니다!"
            >
              <span>💭 {suggestion.balloon}</span>
              {/* 말풍선 아래 꼬리표 (포인터 화살표) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -7,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderTop: '7px solid #FF9800',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -5,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid #FFFDF5',
                }}
              />
            </div>
          )}`;

if (code.includes(oldPetInner)) {
  code = code.replace(oldPetInner, newPetInner);
  console.log('Pet inner updated');
} else {
  console.log('oldPetInner not found, check lines');
}

// 2. Replace Menu Tiles
const oldMenuTiles = `      {/* 4. 하단 메뉴 8개: 모두 같은 입체 타일 (아이콘 원 + 제목 + 보조 글) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, flexShrink: 0 }}>
        <MenuTile icon="🍓" title="토핑 · 돌보기" sub="밥·놀기·씻기" from="#FF8A65" to="#E64A19" rim="#BF360C" onClick={onOpenCare} />
        <MenuTile icon="🧁" title="파티세리 훈련" sub="능력치 UP·타워" from="#4DB6AC" to="#00897B" rim="#00695C" onClick={onOpenTrain} />
        <MenuTile icon="🌈" title="식감 스킬트리" sub="스킬 배우기" from="#9575CD" to="#673AB7" rim="#4527A0" onClick={onOpenSkills} />
        <MenuTile icon="🏆" title="광장 · 대전" sub="지인 구경·친선전" from="#FFB74D" to="#F57C00" rim="#E65100" onClick={onOpenPlaza} />
        <MenuTile icon="🏰" title="나만의 미니룸" sub="방명록·꾸미기" from="#F472B6" to="#DB2777" rim="#9D174D" onClick={onOpenMyRoom} />
        <MenuTile icon="🛍️" title="부티크 상점" sub="3D 피팅룸" from="#FB7185" to="#E11D48" rim="#9F1239" onClick={onOpenBoutique} />
        <MenuTile
          icon="✨"
          title={evoEligibility.canEvolve ? '진화 가능!' : '진화의 전당'}
          sub={\`\${monster.evo_stage ?? 1}단계\`}
          badge={evoEligibility.canEvolve ? 'UP!' : undefined}
          from="#FBBF24"
          to="#F59E0B"
          rim="#B45309"
          onClick={onOpenEvolution}
        />
        <MenuTile icon="📖" title="디저트 도감" sub="모아보기" from="#34D399" to="#059669" rim="#047857" onClick={onOpenDex} />
        <MenuTile icon="🥄" title="장비 · 강화" sub="능력치 UP" from="#64B5F6" to="#1976D2" rim="#0D47A1" onClick={onOpenGear} />
        <div style={{ gridColumn: '1 / -1', display: 'grid' }}>
          <MenuTile icon="🧭" title="탐험" sub="보내 놓고 기다리면 보상이 가득" from="#81C784" to="#388E3C" rim="#1B5E20" onClick={onOpenExplore} />
        </div>
      </div>`;

const newMenuTiles = `      {/* 4. 하단 메뉴 8개: 정확히 4행 2열 (8개 타일 컴팩트 복원) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, flexShrink: 0 }}>
        {/* (1) 돌보기 */}
        <MenuTile icon="🍓" title="토핑 · 돌보기" sub="밥·놀기·씻기" from="#FF8A65" to="#E64A19" rim="#BF360C" onClick={onOpenCare} />
        {/* (2) 훈련 */}
        <MenuTile icon="🧁" title="파티세리 훈련" sub="능력치 UP·타워" from="#4DB6AC" to="#00897B" rim="#00695C" onClick={onOpenTrain} />
        {/* (3) 성장 · 강화 (스킬트리 + 장비강화 + 진화의전당 통합 허브) */}
        <MenuTile
          icon="✨"
          title="성장 · 강화"
          sub="스킬·장비·진화"
          badge={evoEligibility.canEvolve ? 'UP!' : undefined}
          from="#F59E0B"
          to="#D97706"
          rim="#92400E"
          onClick={() => setShowGrowthModal(true)}
        />
        {/* (4) 탐험 (M5 장기 탐험) */}
        <MenuTile
          icon="🧭"
          title="탐험"
          sub="방치 보상·일지"
          badge={isExploring ? '진행중' : undefined}
          from="#10B981"
          to="#059669"
          rim="#047857"
          onClick={onOpenExplore}
        />
        {/* (5) 광장 · 대전 */}
        <MenuTile icon="🏆" title="광장 · 대전" sub="지인 구경·친선전" from="#FFB74D" to="#F57C00" rim="#E65100" onClick={onOpenPlaza} />
        {/* (6) 나만의 미니룸 */}
        <MenuTile icon="🏰" title="나만의 미니룸" sub="방명록·꾸미기" from="#F472B6" to="#DB2777" rim="#9D174D" onClick={onOpenMyRoom} />
        {/* (7) 부티크 상점 */}
        <MenuTile icon="🛍️" title="부티크 상점" sub="3D 피팅룸" from="#FB7185" to="#E11D48" rim="#9F1239" onClick={onOpenBoutique} />
        {/* (8) 디저트 도감 */}
        <MenuTile icon="📖" title="디저트 도감" sub="모아보기" from="#34D399" to="#059669" rim="#047857" onClick={onOpenDex} />
      </div>`;

if (code.includes(oldMenuTiles)) {
  code = code.replace(oldMenuTiles, newMenuTiles);
  console.log('Menu tiles updated');
} else {
  console.log('oldMenuTiles not found, check lines');
}

// 3. Add Growth Hub Modal before </main>
const growthModalCode = `      {/* ✨ 디저트 펫 성장 · 강화 허브 모달 (식감 스킬트리 / 장비 강화 / 진화의 전당) */}
      {showGrowthModal && (
        <div
          onClick={() => setShowGrowthModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(30, 20, 15, 0.65)',
            backdropFilter: 'blur(4px)',
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
              maxWidth: 420,
              background: '#FFFDF9',
              borderRadius: 24,
              padding: '20px 18px',
              border: '2px solid #FFE082',
              boxShadow: '0 -8px 28px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>✨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#3E2723' }}>디저트 펫 성장 · 강화</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#8D6E63' }}>스킬, 장비, 각성 진화로 펫을 강력하게 키워보세요!</p>
                </div>
              </div>
              <button
                onClick={() => setShowGrowthModal(false)}
                style={{
                  border: 'none',
                  background: '#F5EBE1',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 900,
                  color: '#6D4C41',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {/* 1. 식감 스킬트리 */}
              <button
                onClick={() => {
                  setShowGrowthModal(false)
                  onOpenSkills?.()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  borderRadius: 16,
                  border: '1.5px solid #D1C4E9',
                  background: 'linear-gradient(135deg, #F3E5F5 0%, #EDE7F6 100%)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #9575CD, #673AB7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    boxShadow: '0 3px 8px rgba(103,58,183,0.3)',
                    flexShrink: 0,
                  }}
                >
                  🌈
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#4527A0' }}>식감 스킬트리</span>
                    <span style={{ fontSize: 11, color: '#7E57C2', fontWeight: 800 }}>오감 식감 시너지 →</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#5E35B1' }}>
                    바삭·쫀득·사르르 고유 스킬을 습득하고 스킬 슬롯에 장착합니다.
                  </p>
                </div>
              </button>

              {/* 2. 장비 · 강화 */}
              <button
                onClick={() => {
                  setShowGrowthModal(false)
                  onOpenGear?.()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  borderRadius: 16,
                  border: '1.5px solid #BBDEFB',
                  background: 'linear-gradient(135deg, #E3F2FD 0%, #E1F5FE 100%)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #64B5F6, #1976D2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    boxShadow: '0 3px 8px rgba(25,118,210,0.3)',
                    flexShrink: 0,
                  }}
                >
                  🥄
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#0D47A1' }}>장비 · 강화</span>
                    <span style={{ fontSize: 11, color: '#1976D2', fontWeight: 800 }}>최대 10강 돌파 →</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#1565C0' }}>
                    디저트 포크·스푼·접시를 장착하여 공격력과 방어력을 극대화합니다.
                  </p>
                </div>
              </button>

              {/* 3. 진화의 전당 */}
              <button
                onClick={() => {
                  setShowGrowthModal(false)
                  onOpenEvolution?.()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  borderRadius: 16,
                  border: evoEligibility.canEvolve ? '2px solid #FFB300' : '1.5px solid #FFE082',
                  background: evoEligibility.canEvolve
                    ? 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)'
                    : 'linear-gradient(135deg, #FFFDE7 0%, #FFF9C4 100%)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: evoEligibility.canEvolve ? '0 4px 12px rgba(255,179,0,0.35)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    boxShadow: '0 3px 8px rgba(245,158,11,0.35)',
                    flexShrink: 0,
                  }}
                >
                  ✨
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#B45309' }}>진화의 전당</span>
                      {evoEligibility.canEvolve && (
                        <span
                          style={{
                            background: '#D97706',
                            color: '#FFFFFF',
                            fontSize: 10,
                            fontWeight: 900,
                            padding: '1px 6px',
                            borderRadius: 999,
                          }}
                        >
                          UP!
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#B45309', fontWeight: 800 }}>{monster.evo_stage ?? 1}단계 각성 →</span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#92400E' }}>
                    {evoEligibility.canEvolve
                      ? \`🎉 축하합니다! \${evoEligibility.targetStage}단계 각성 진화가 준비되었습니다.\`
                      : '레벨과 애정도를 채워 시네마틱 각성 진화와 브랜치 분기를 해금하세요.'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}`;

if (!code.includes('showGrowthModal && (')) {
  code = code.replace(
    '{/* 케이크 상자 포장 카드 자랑 모달 */}',
    `${growthModalCode}\n\n      {/* 케이크 상자 포장 카드 자랑 모달 */}`
  );
  console.log('Growth modal added');
}

fs.writeFileSync('src/screens/MonsterHome.tsx', code, 'utf8');
console.log('MonsterHome update finished');

