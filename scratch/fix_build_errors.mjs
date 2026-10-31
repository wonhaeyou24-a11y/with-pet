import fs from 'node:fs';

// 1. MonsterHome.tsx 수정
let homeCode = fs.readFileSync('src/screens/MonsterHome.tsx', 'utf8');
homeCode = homeCode.replace(
  "sug.bannerText || sug.balloon || '주인님! 디저트 펫이 새로운 활동을 하고 싶어해요!'",
  "sug.message || sug.balloon || '주인님! 디저트 펫이 새로운 활동을 하고 싶어해요!'"
);
fs.writeFileSync('src/screens/MonsterHome.tsx', homeCode, 'utf8');
console.log('Fixed MonsterHome.tsx sug.message');

// 2. GearScreen.tsx 수정
let gearCode = fs.readFileSync('src/screens/GearScreen.tsx', 'utf8');
gearCode = gearCode.replace(
  'const [maxEnhanceItem, setMaxEnhanceItem] = useState<{ item: GearItem; def: GearDef; level: number } | null>(null)\n  const [sparkleAnim, setSparkleAnim] = useState(false)',
  'const [maxEnhanceItem, setMaxEnhanceItem] = useState<{ item: GearItem; def: GearDef; level: number } | null>(null)'
);
gearCode = gearCode.replace(
  'setSparkleAnim(true)\n        setTimeout(() => setSparkleAnim(false), 1200)',
  '// 기본 성공 임팩트 발동'
);
fs.writeFileSync('src/screens/GearScreen.tsx', gearCode, 'utf8');
console.log('Fixed GearScreen.tsx sparkleAnim');

