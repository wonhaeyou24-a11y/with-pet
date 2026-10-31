import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-train-stats-2')

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
    const res = await this.send('Page.captureScreenshot', { format: 'png', quality: 90 })
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'))
    console.log(`Saved screenshot: ${outPath}`)
  }
}

async function main() {
  fs.mkdirSync(userDataDir, { recursive: true })
  const proc = spawn(
    edge,
    [
      '--headless=new',
      '--remote-debugging-port=9264',
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
        const res = await fetch('http://127.0.0.1:9264/json/list')
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

    // 1. 훈련 화면 (훈련 코스 탭 + 6대 능력치 펼치기 클릭)
    console.log('1. Testing Training Screen (Courses Tab with Stats Toggle)...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('파티세리 훈련(M2)'),
    })
    await sleep(2000)

    // '▼ 6대 능력치' 버튼 클릭
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const toggleBtn = btns.find(b => b.textContent && b.textContent.includes('6대 능력치'));
        if (toggleBtn) toggleBtn.click();
      })()
    `)
    await sleep(800)
    await cdp.screenshot(path.join(outDir, 'after-71-training-courses-stats-preview.png'))

    // 2. 능력치 탭 클릭
    console.log('2. Clicking Stats Tab...')
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const statBtn = btns.find(b => b.textContent && b.textContent.includes('능력치') && !b.textContent.includes('6대'));
        if (statBtn) statBtn.click();
      })()
    `)
    await sleep(1000)
    await cdp.screenshot(path.join(outDir, 'after-70-training-stats-main-style.png'))

    console.log('Verification finished successfully!')
    ws.close()
  } finally {
    proc.kill()
  }
}

main().catch((err) => {
  console.error('Test run failed:', err)
  process.exit(1)
})
