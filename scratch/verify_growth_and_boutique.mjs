import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-verify-devscreens-2')

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
    return res?.result?.value
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'))
    console.log(`Saved screenshot: ${filePath}`)
  }
}

async function run() {
  const proc = spawn(
    edge,
    [
      '--headless=new',
      '--remote-debugging-port=9297',
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
    const res = await fetch('http://127.0.0.1:9297/json/list')
    const targets = await res.json()
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0]
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)

    await new Promise((resolve) => {
      ws.onopen = resolve
    })

    const cdp = new CdpSession(ws)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 915,
      deviceScaleFactor: 2.5,
      mobile: true,
    })

    // 1. 성장 · 강화 모달 오픈 캡처
    console.log('1. Opening Monster Home for Growth Modal...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('몬스터 홈'),
    })
    await sleep(2200)

    // 정확한 타일 찾아서 클릭
    await cdp.eval(`
      (() => {
        const tiles = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('성장 · 강화'));
        if (tiles.length > 0) {
          tiles[0].click();
        }
      })()
    `)
    await sleep(800)
    await cdp.screenshot(path.join(outDir, 'after-93-home-growth-hub-modal.png'))

    // 2. 파티세리 부티크: 상향된 리본 코인 가격표 캡처
    console.log('2. Navigating to Patisserie Boutique (Updated Prices)...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('파티세리 부티크'),
    })
    await sleep(2200)
    await cdp.screenshot(path.join(outDir, 'after-95-boutique-updated-prices.png'))

    console.log('Done capturing growth modal and boutique prices!')
  } catch (e) {
    console.error('Error:', e)
  } finally {
    proc.kill()
  }
}

run()

