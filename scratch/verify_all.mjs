import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await page.goto('http://localhost:5173/#gallery', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.waitForSelector('select[aria-label="화면 전환"]');

  // 1. 미니룸
  await page.select('select[aria-label="화면 전환"]', '싸이월드 미니룸');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/after-111-miniroom-pet-scale.png' });
  console.log('Captured after-111');

  // 2. 뷰티크
  await page.select('select[aria-label="화면 전환"]', '부티크');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/after-112-boutique-3d-star-and-aura.png' });
  console.log('Captured after-112');

  // 3. 보스 레이드
  await page.select('select[aria-label="화면 전환"]', 'DESSERT MAX 월드 보스 레이드');
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/after-113-boss-raid-nonoverlapping-party.png' });
  console.log('Captured after-113');

  // 4. 광장
  await page.select('select[aria-label="화면 전환"]', '디저트 쇼케이스 광장');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/after-114-plaza-thumbs-up-likes.png' });
  console.log('Captured after-114');

  await browser.close();
  console.log('All 4 verification screenshots saved!');
}

run().catch(console.error);

