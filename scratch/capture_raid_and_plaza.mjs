import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/dashl/.gemini/antigravity/brain/63bed995-1a0b-49e0-ac0d-37eaf980bc7d'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  // 1. 방명록 글 하나 등록하여 홈 화면 미니룸 배지 활성화 확인
  await page.goto('http://localhost:5173')
  await page.waitForTimeout(2000)

  // 방명록 로컬스토리지에 글 등록
  await page.evaluate(() => {
    const sampleGuestBook = [
      {
        id: 'gb-1',
        authorNickname: '몽실 님',
        petSpecies: 'mongsil',
        petName: '딸기몽실',
        message: '미니룸 너무 예뻐요! 디저트 향기 가득!',
        createdAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem('dessert_pet_miniroom_guestbook_v1', JSON.stringify(sampleGuestBook))
  })
  await page.reload()
  await page.waitForTimeout(1500)

  // 홈 화면 캡처: 미니룸 버튼 배지 ("새 글 1")
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'after-122-home-miniroom-badge.png'),
  })
  console.log('✅ after-122-home-miniroom-badge.png captured')

  // 2. 광장 화면 이동: 광장 필드에 출현한 3D 월드 보스 확인
  await page.evaluate(() => {
    // Plaza 탭 클릭 or 네비게이션
    const buttons = Array.from(document.querySelectorAll('button'))
    const plazaBtn = buttons.find((b) => b.textContent?.includes('광장'))
    if (plazaBtn) plazaBtn.click()
  })
  await page.waitForTimeout(2000)

  // 광장 3D 보스 스크린샷
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'after-123-plaza-world-boss-3d.png'),
  })
  console.log('✅ after-123-plaza-world-boss-3d.png captured')

  // 3. 3D 보스 클릭하여 레이드 출격 모달 열고 즉시 레이드 시작
  await page.evaluate(() => {
    // 3D 보스 클릭
    const bossArea = document.querySelector('[title="거대 보스 터치 시 레이드 토벌 시작"]')
    if (bossArea) {
      bossArea.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }
  })
  await page.waitForTimeout(1000)

  // 모달 내 '협동 토벌 출격' 또는 '모의 레이드 훈련' 버튼 클릭
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const raidGoBtn = buttons.find((b) => b.textContent?.includes('토벌') || b.textContent?.includes('레이드'))
    if (raidGoBtn) raidGoBtn.click()
  })
  await page.waitForTimeout(2500)

  // 보스 레이드 아레나 스크린샷 (참전 펫 피해량 보드 + 8마리 24px 지인 펫 + 전면 공격 펫)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'after-124-boss-raid-damage-board-and-allies.png'),
  })
  console.log('✅ after-124-boss-raid-damage-board-and-allies.png captured')

  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
