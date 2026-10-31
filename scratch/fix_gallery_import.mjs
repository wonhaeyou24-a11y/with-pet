import fs from 'node:fs';

let code = fs.readFileSync('src/dev/ScreenGallery.tsx', 'utf8');

if (!code.includes("import { EggArt } from '../ui/EggArt'")) {
  code = "import { EggArt } from '../ui/EggArt'\n" + code;
  fs.writeFileSync('src/dev/ScreenGallery.tsx', code, 'utf8');
  console.log('ScreenGallery: EggArt import added');
}

