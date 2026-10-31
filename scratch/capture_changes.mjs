import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function capture() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    defaultViewport: { width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 1. Boutique Plating Tab
  await page.goto('http://localhost:5173/#boutique', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  
  // Click plating tab if available
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('받침대')) {
      await b.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }
  
  const destBoutique = 'C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/after-76-boutique-plating-bases.png';
  await page.screenshot({ path: destBoutique });
  console.log('Saved boutique plating screenshot:', destBoutique);

  // 2. Monster Detail Profile
  await page.goto('http://localhost:5173/#detail', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const destDetail = 'C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d/after-77-monster-detail-profile-clean.png';
  await page.screenshot({ path: destDetail });
  console.log('Saved detail profile screenshot:', destDetail);

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});

