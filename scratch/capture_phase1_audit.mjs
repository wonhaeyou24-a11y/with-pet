import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-phase1-dev-audit2')

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

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'))
    console.log(`Saved screenshot: ${filePath}`)
  }

  async selectScreen(screenName) {
    await this.send('Runtime.evaluate', {
      expression: `(() => {
        const sel = document.querySelector('select[aria-label="화면 전환"]');
        if (sel) {
          sel.value = ${JSON.stringify(screenName)};
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()`,
    })
    await sleep(2200)
  }
}

async function run() {
  const proc = spawn(
    edge,
    [
      '--headless=new',
      '--remote-debugging-port=9294',
      `--user-data-dir=${userDataDir}`,
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  )

  await sleep(1500)

  try {
    const targetsRes = await fetch('http://127.0.0.1:9294/json/list')
    const targets = await targetsRes.json()
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0]

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
    await new Promise((r) => (ws.onopen = r))
    const cdp = new CdpSession(ws)

    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    // 412x915 모바일 뷰포트
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 915,
      deviceScaleFactor: 2.2,
      mobile: true,
    })

    console.log('1. 갤러리 기본 접속...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens',
    })
    await sleep(2500)

    // 1. 몬스터 홈
    console.log('-> 몬스터 홈 전환...')
    await cdp.selectScreen('몬스터 홈')
    await cdp.screenshot(path.join(outDir, 'after-104-home-live-ready.png'))

    // 2. 나만의 미니룸
    console.log('-> 나만의 미니룸 전환...')
    await cdp.selectScreen('나만의 미니룸')
    // 가구 터치 액션 (낮잠 클릭)
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const actionBtn = btns.find(b => b.textContent && (b.textContent.includes('낮잠') || b.textContent.includes('점프') || b.textContent.includes('눕기')));
        if (actionBtn) actionBtn.click();
      })()`,
    })
    await sleep(1000)
    await cdp.screenshot(path.join(outDir, 'after-105-myroom-living-interaction.png'))

    // 3. 파티세리 부티크
    console.log('-> 파티세리 부티크 전환...')
    await cdp.selectScreen('파티세리 부티크')
    // 신규 아이템 클릭
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const itemBtn = btns.find(b => b.textContent && (b.textContent.includes('오라') || b.textContent.includes('크라운') || b.textContent.includes('발자국')));
        if (itemBtn) itemBtn.click();
      })()`,
    })
    await sleep(1000)
    await cdp.screenshot(path.join(outDir, 'after-106-boutique-new-fx-items.png'))

    // 4. 지인 디저트 광장(M3)
    console.log('-> 지인 디저트 광장(M3) 전환...')
    await cdp.selectScreen('지인 디저트 광장(M3)')
    // 보스 레이드 버튼 클릭
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const raidBtn = btns.find(b => b.textContent && (b.textContent.includes('보스 레이드') || b.textContent.includes('보스 침공')));
        if (raidBtn) raidBtn.click();
      })()`,
    })
    await sleep(1000)
    await cdp.screenshot(path.join(outDir, 'after-107-plaza-world-boss-scheduler.png'))

    // 5. 장비·강화(M5)
    console.log('-> 장비·강화(M5) 전환...')
    await cdp.selectScreen('장비·강화(M5)')
    await sleep(1500)
    await cdp.screenshot(path.join(outDir, 'after-108-gear-1percent-balance.png'))

    console.log('모든 브라우저 직접 검증 완료!')
    ws.close()
  } finally {
    proc.kill()
  }
}

run().catch(console.error)
