import fs from 'node:fs';

// 1. EggArt.tsx 업데이트
let eggCode = fs.readFileSync('src/ui/EggArt.tsx', 'utf8');

eggCode = eggCode.replace(
  'export function EggArt({ rarity = \'common\', mood = \'sleep\', size = 200, fluid = false }: { rarity?: Rarity; mood?: Mood; size?: number; fluid?: boolean }) {',
  'export function EggArt({ rarity = \'common\', mood = \'sleep\', size = 200, fluid = false, rainbowLoading = false }: { rarity?: Rarity; mood?: Mood; size?: number; fluid?: boolean; rainbowLoading?: boolean }) {'
);

const oldSvgDefs = `      <defs>
        <clipPath id={clip}>
          <path d={EGG_D} />
        </clipPath>
      </defs>`;

const newSvgDefs = `      <defs>
        <clipPath id={clip}>
          <path d={EGG_D} />
        </clipPath>
        <linearGradient id={\`\${clip}-rainbow\`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8A80">
            <animate attributeName="stop-color" values="#FF8A80;#FFD180;#FFFF8D;#B9F6CA;#80D8FF;#EA80FC;#FF8A80" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="25%" stopColor="#FFD180">
            <animate attributeName="stop-color" values="#FFD180;#FFFF8D;#B9F6CA;#80D8FF;#EA80FC;#FF8A80;#FFD180" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#FFFF8D">
            <animate attributeName="stop-color" values="#FFFF8D;#B9F6CA;#80D8FF;#EA80FC;#FF8A80;#FFD180;#FFFF8D" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="75%" stopColor="#B9F6CA">
            <animate attributeName="stop-color" values="#B9F6CA;#80D8FF;#EA80FC;#FF8A80;#FFD180;#FFFF8D;#B9F6CA" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#80D8FF">
            <animate attributeName="stop-color" values="#80D8FF;#EA80FC;#FF8A80;#FFD180;#FFFF8D;#B9F6CA;#80D8FF" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>`;

eggCode = eggCode.replace(oldSvgDefs, newSvgDefs);

const oldShellRender = `      <Shell rarity={rarity} clip={clip} />`;

const newShellRender = `      <Shell rarity={rarity} clip={clip} />
      {rainbowLoading && (
        <g clipPath={\`url(#\${clip})\`}>
          <rect
            x="0"
            y="0"
            width="200"
            height="240"
            fill={\`url(#\${clip}-rainbow)\`}
            opacity="0.85"
            style={{ mixBlendMode: 'color' }}
          />
          <circle cx="100" cy="120" r="80" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="8" opacity="0.5">
            <animate attributeName="r" values="20;90" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>
      )}`;

eggCode = eggCode.replace(oldShellRender, newShellRender);

// 스타일 애니메이션 속성 주입
eggCode = eggCode.replace(
  'style={{ overflow: \'visible\', ...sizing }}',
  'style={{ overflow: \'visible\', ...sizing, ...(rainbowLoading ? { animation: \'eggRainbowDance 2s ease-in-out infinite\' } : {}) }}'
);

// 스타일 키프레임 추가
if (!eggCode.includes('eggRainbowDance')) {
  const eggStyle = `
<style>{'\\
@keyframes eggRainbowDance {\\
  0%, 100% { filter: drop-shadow(0 4px 14px rgba(255,140,160,0.45)); transform: scale(1) rotate(-1.5deg); }\\
  50% { filter: drop-shadow(0 6px 26px rgba(120,200,255,0.75)); transform: scale(1.05) rotate(1.5deg); }\\
}'}</style>
`;
  eggCode = eggCode.replace(
    'return (',
    'return (\n    <>\n      ' + eggStyle
  );
  eggCode = eggCode.replace(
    '</svg>\n  )',
    '</svg>\n    </>\n  )'
  );
}

fs.writeFileSync('src/ui/EggArt.tsx', eggCode, 'utf8');
console.log('EggArt: rainbowLoading support added');

// 2. Login.tsx 업데이트
let loginCode = fs.readFileSync('src/screens/Login.tsx', 'utf8');

loginCode = loginCode.replace(
  '<EggArt rarity="common" mood="sleep" size={130} />',
  '<EggArt rarity="common" mood={busy ? "happy" : "sleep"} size={130} rainbowLoading={busy} />'
);

fs.writeFileSync('src/screens/Login.tsx', loginCode, 'utf8');
console.log('Login.tsx: rainbowLoading connected to busy state');

