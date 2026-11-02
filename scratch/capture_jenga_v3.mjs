import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const profileDir = path.join(outDir, 'scratch', 'edge-profile-jenga-v3')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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
}

let edgeProc = null
let cdp = null

async function run() {
  console.log('Launching Edge headless...')
  edgeProc = spawn(
    edge,
    [
      '--headless=new',
      '--remote-debugging-port=9473',
      `--user-data-dir=${profileDir}`,
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  )

  await sleep(2500)

  const targetsRes = await fetch('http://127.0.0.1:9473/json/list')
  const targets = await targetsRes.json()
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0]

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  cdp = new CdpSession(ws)

  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 412,
    height: 915,
    deviceScaleFactor: 2.2,
    mobile: true,
  })

  console.log('Navigating to Pet Jenga Screen...')
  await cdp.send('Page.navigate', {
    url: 'http://localhost:5173/#/dev/screens/%EC%9C%84%ED%83%9C%EC%9C%84%ED%83%9C%20%ED%8E%AB%20%EC%A0%A0%EA%B0%80(%EB%8F%8C%ED%83%91)',
  })
  await sleep(2500)

  // Capture tower screen before starting drop
  await cdp.screenshot(path.join(outDir, 'after-258-pet-jenga-pyramid-tiers.png'))

  // Click start challenge
  console.log('Clicking challenge button...')
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent?.includes('도전'));
      if (startBtn) startBtn.click();
    })()`,
  })
  await sleep(1500)

  // Capture aiming pet and aiming line in action
  await cdp.screenshot(path.join(outDir, 'after-257-pet-jenga-3d-no-2d.png'))

  console.log('All screenshots captured successfully!')
}

run()
  .catch((err) => {
    console.error('Error in capture:', err)
  })
  .finally(() => {
    if (edgeProc) edgeProc.kill()
    process.exit(0)
  })
