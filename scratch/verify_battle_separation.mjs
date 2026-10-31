import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-battle-sep')

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
    await sleep(2500)
  }
}

async function run() {
  const proc = spawn(
    edge,
    [
      '--headless=new',
      '--remote-debugging-port=9295',
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
    const targetsRes = await fetch('http://127.0.0.1:9295/json/list')
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

    console.log('1. 갤러리 접속...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens',
    })
    await sleep(2500)

    // 1. 친선 대전 (1:1 클래식 구도) 검증
    console.log('2. 1:1 지인 친선 대전 전환...')
    await cdp.selectScreen('1:1 지인 친선 대전')
    await cdp.screenshot(path.join(outDir, 'after-109-friendly-pvp-classic-battle.png'))

    // 2. 보스 대전 (DESSERT MAX 레이드 구도) 검증
    console.log('3. DESSERT MAX 월드 보스 레이드 전환...')
    await cdp.selectScreen('DESSERT MAX 월드 보스 레이드')
    await cdp.screenshot(path.join(outDir, 'after-110-world-boss-max-raid-battle.png'))

    console.log('모든 대전 모드 분리 검증 완료!')
    ws.close()
  } finally {
    proc.kill()
  }
}

run().catch(console.error)

