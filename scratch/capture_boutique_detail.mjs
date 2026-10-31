import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-boutique-detail')

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
      '--remote-debugging-port=9277',
      `--user-data-dir=${userDataDir}`,
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  )

  try {
    let pageTarget = null
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9277/json/list')
        const targets = await res.json()
        pageTarget =
          targets.find((t) => t.type === 'page' && t.url.includes('blank')) ||
          targets.find((t) => t.type === 'page')
        if (pageTarget && pageTarget.webSocketDebuggerUrl) break
      } catch {}
      await sleep(250)
    }

    if (!pageTarget) throw new Error('Edge CDP target not found')

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
    await new Promise((res, rej) => {
      ws.onopen = res
      ws.onerror = rej
    })

    const cdp = new CdpSession(ws)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 892,
      deviceScaleFactor: 2,
      mobile: true,
    })

    // 1. 파티세리 부티크 (받침대 탭)
    console.log('1. Boutique Shop Plating Tab...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('파티세리 부티크'),
    })
    await sleep(2000)
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const platingBtn = btns.find(b => b.textContent && b.textContent.includes('받침대'));
        if (platingBtn) platingBtn.click();
      })()
    `)
    await sleep(1000)
    await cdp.screenshot(path.join(outDir, 'after-76-boutique-plating-bases.png'))

    // 2. 몬스터 상세 프로필
    console.log('2. Monster Detail Clean Profile...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('몬스터 상세'),
    })
    await sleep(2000)
    await cdp.screenshot(path.join(outDir, 'after-77-monster-detail-profile-clean.png'))

    // 3. 몬스터 홈 (새 배너)
    console.log('3. Monster Home Banner...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('몬스터 홈'),
    })
    await sleep(2000)
    await cdp.screenshot(path.join(outDir, 'after-78-home-clean-banner.png'))

  } finally {
    proc.kill()
  }
}

run().catch(console.error)
