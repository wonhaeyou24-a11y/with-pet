import fs from 'node:fs';

const priceMap = {
  // 받침대
  'base-nest': 0,
  'base-strawberry-cake': 480,
  'base-choco-cookie': 350,
  'base-custard-pudding': 350,
  'base-macaron-cushion': 520,
  'base-parfait-cup': 750,

  // 패션 장식
  'cream-cherry': 350,
  'wizard-hat': 650,
  'birthday-candle': 380,
  'star-crown': 850,
  'berry-beret': 180,
  'alchemy-glasses': 280,
  'sleep-mask': 150,
  'star-patch': 220,
  'pretzel-ribbon': 320,
  'rune-scarf': 280,
  'bell-ribbon': 180,
  'meteor-wings': 1200,
  'explorer-pack': 250,
  'lantern-staff': 950,
  'lollipop-wand': 400,
  'star-wand': 450,
  'golden-recipe-grimoire': 1100,
  'crystal-sugar-shield': 780,
  'syrup-glider-blades': 1250,
  'constellation-aura': 1500,
  'blossom-breeze': 580,

  // 미니룸 테마
  'room-patisserie': 0,
  'room-galaxy': 880,
  'room-berry': 550,
  'room-vintage': 600,

  // 미니룸 가구
  'sofa-macaron': 0,
  'table-pretzel': 300,
  'trampoline-jelly': 550,
  'showcase-dessert': 680,
  'lamp-starlight': 250,
  'fountain-choco': 850,
  'sofa-parfait': 920,
  'lamp-fondue': 400,
  'stool-macaron': 350,
  'clock-pretzel': 300,
  'rug-waffle': 450,
};

let code = fs.readFileSync('src/config/boutique.ts', 'utf8');

for (const [id, price] of Object.entries(priceMap)) {
  const re = new RegExp(`(id:\\s*'${id}',[\\s\\S]*?price:\\s*)\\d+`);
  if (re.test(code)) {
    code = code.replace(re, `$1${price}`);
  } else {
    console.warn(`Item ${id} not matched`);
  }
}

fs.writeFileSync('src/config/boutique.ts', code, 'utf8');
console.log('Boutique prices updated successfully');

