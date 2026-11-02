import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const profileDir = path.join(outDir, 'scratch', 'edge-profile-jenga-v2')

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
    const res = await cdp.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'))
    console.log(`Saved screenshot: ${filePath}`)
  }
}

let viteProc = null
let edgeProc = null
let cdp = null

async function run() {
  console.log('Starting vite preview server...')
  viteProc = spawn('npx', ['vite', '--port', '5173'], { shell: true })
  await sleep(3500)

  console.log('Launching Edge headless...')
  edgeProc = spawn(
    edge,
    [
      '--headless=new',
      '--remote-debugging-port=9463',
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

  const targetsRes = await fetch('http://127.0.0.1:9463/json/list')
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

  // 1. 지인 디저트 광장 (셀렉트 박스로 이동)
  console.log('1. 지인 디저트 광장 랜드마크 확인...')
  await cdp.send('Page.navigate', {
    url: 'http://localhost:5173/#/dev/screens',
  })
  await sleep(2500)
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const select = document.querySelector('select');
      if (select) {
        const opt = Array.from(select.options).find(o => o.text.includes('지인 디저트 광장'));
        if (opt) {
          select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    })()`,
  })
  await sleep(2500)
  await cdp.screenshot(path.join(outDir, 'after-254-plaza-stone-tower-landmark.png'))

  // 2. 위태위태 펫 젠가 드래그 조준 상태
  console.log('2. 위태위태 펫 젠가(돌탑)...')
  await cdp.send('Page.navigate', {
    url: 'http://localhost:5173/#/dev/screens/%EC%9C%84%ED%83%9C%EC%9C%84%ED%83%9C%20%ED%8E%AB%20%EC%A0%A0%EA%B0%80(%EB%8F%8C%ED%83%91)',
  })
  await sleep(2000)
  // 시작 버튼 클릭
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent?.includes('도전'));
      if (startBtn) startBtn.click();
    })()`,
  })
  await sleep(1000)
  await cdp.screenshot(path.join(outDir, 'after-255-pet-jenga-drag-aim.png'))

  console.log('All screenshots captured successfully!')
}

run()
  .catch((err) => {
    console.error('Error in capture:', err)
  })
  .finally(() => {
    if (edgeProc) edgeProc.kill()
    if (viteProc) viteProc.kill()
    process.exit(0)
  })
