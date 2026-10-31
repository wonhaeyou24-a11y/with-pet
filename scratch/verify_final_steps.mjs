import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-verify-step-final')

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

class CdpSession {
  constructor(ws) {
    this.ws = ws
    this.id = 1
    this.pending = new Map()
    this.ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) reject(msg.error)
        else resolve(msg.result)
      }
    }
  }

  send(method, params = {}) {
    const id = this.id++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    })
    return res.result ? res.result.value : null
  }

  async screenshot(outPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'))
    console.log(`Saved screenshot: ${outPath}`)
  }
}

async function run() {
  const edgeProc = spawn(edge, [
    '--remote-debugging-port=9223',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    'about:blank',
  ])

  await sleep(1500)

  try {
    const listRes = await fetch('http://127.0.0.1:9223/json/list')
    const list = await listRes.json()
    const page = list.find((t) => t.type === 'page') || list[0]
    const ws = new WebSocket(page.webSocketDebuggerUrl)

    await new Promise((resolve) => {
      ws.onopen = resolve
    })

    const cdp = new CdpSession(ws)
    await cdp.send('Page.enable')
    await cdp.send('DOM.enable')

    // 모바일 뷰포트 설정: 412x915
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 915,
      deviceScaleFactor: 2.5,
      mobile: true,
    })

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' })
    await sleep(2500)

    // 로컬스토리지에 디저트 펫 생성 세팅 주입
    await cdp.eval(`
      (() => {
        const testMonster = {
          id: 'test-dubaidubai',
          name: '두바이쫀득이',
          species: 'dubaidubai',
          element: 'wood',
          level: 12,
          exp: 340,
          hunger: 85,
          mood: 90,
          cleanliness: 95,
          fatigue: 15,
          evo_stage: 2,
          stats: { hp: 130, atk: 48, def: 38, spd: 42, int: 35, cha: 50 },
          sp: 4
        };
        localStorage.setItem('pet_monster_active', JSON.stringify(testMonster));
      })()
    `)

    await cdp.send('Page.reload')
    await sleep(2500)

    // 1. 메인 홈 화면 8개 타일 & 확대된 말풍선
    await cdp.screenshot(path.join(outDir, 'after-92-home-8-tiles-and-balloon.png'))

    // 2. '성장 · 강화' 타일 클릭하여 모달 열기
    await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button, div'));
        const growthBtn = buttons.find(b => b.textContent && b.textContent.includes('성장 · 강화'));
        if (growthBtn) growthBtn.click();
      })()
    `)
    await sleep(600)
    await cdp.screenshot(path.join(outDir, 'after-93-home-growth-hub-modal.png'))

    // 모달 닫기
    await cdp.eval(`
      (() => {
        const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === '✕');
        if (closeBtn) closeBtn.click();
      })()
    `)
    await sleep(400)

    // 3. '파티세리 훈련' 클릭 후 '디저트 타워' 탭 선택 (타워 시작 전 대기 화면 확인)
    await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button, div'));
        const trainBtn = buttons.find(b => b.textContent && b.textContent.includes('파티세리 훈련'));
        if (trainBtn) trainBtn.click();
      })()
    `)
    await sleep(1000)

    // 타워 탭 누르기
    await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const towerTab = buttons.find(b => b.textContent && b.textContent.includes('디저트 타워'));
        if (towerTab) towerTab.click();
      })()
    `)
    await sleep(800)
    await cdp.screenshot(path.join(outDir, 'after-94-training-tower-standby-no-attack.png'))

    // 4. 뒤로가기 후 부티크 상점으로 이동하여 상향된 가격표 확인
    await cdp.eval(`
      (() => {
        const backBtn = document.querySelector('button[title*=\"뒤로\"], button');
        if (backBtn) backBtn.click();
      })()
    `)
    await sleep(800)

    await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button, div'));
        const boutiqueBtn = buttons.find(b => b.textContent && b.textContent.includes('부티크 상점'));
        if (boutiqueBtn) boutiqueBtn.click();
      })()
    `)
    await sleep(1200)
    await cdp.screenshot(path.join(outDir, 'after-95-boutique-updated-prices.png'))

    console.log('All verification screenshots captured successfully!')
  } catch (err) {
    console.error('Error during verification:', err)
  } finally {
    edgeProc.kill()
  }
}

run()

