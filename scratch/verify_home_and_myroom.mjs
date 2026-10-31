import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 / 최신 모바일 비율
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('1. 메인 홈 화면 이동...');
  await page.goto('http://localhost:5173/?screen=홈', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const homePath = path.resolve('C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/after-68-home-large-pet-plating-banner.png');
  await page.screenshot({ path: homePath });
  console.log('메인 홈 캡처 저장:', homePath);

  console.log('2. 나만의 미니룸 화면 이동...');
  await page.goto('http://localhost:5173/?screen=나만의 미니룸', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const myRoomPath = path.resolve('C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/after-69-myroom-perfect-mobile-fullscreen.png');
  await page.screenshot({ path: myRoomPath });
  console.log('미니룸 캡처 저장:', myRoomPath);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

