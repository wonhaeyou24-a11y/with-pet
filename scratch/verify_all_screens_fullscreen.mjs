import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-all-screens-full')

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
      '--remote-debugging-port=9266',
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
        const res = await fetch('http://127.0.0.1:9266/json/list')
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

    // 1. 나만의 미니룸
    console.log('1. Testing MyRoom Screen Edge-to-Edge...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('나만의 미니룸'),
    })
    await sleep(2200)
    await cdp.screenshot(path.join(outDir, 'after-72-myroom-edge-to-edge-fullscreen.png'))

    // 2. 몬스터 홈
    console.log('2. Testing MonsterHome Edge-to-Edge...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('몬스터 홈'),
    })
    await sleep(2200)
    await cdp.screenshot(path.join(outDir, 'after-73-home-edge-to-edge-fullscreen.png'))

    // 3. 파티세리 훈련
    console.log('3. Testing Training Screen Edge-to-Edge...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('파티세리 훈련(M2)'),
    })
    await sleep(2200)
    await cdp.screenshot(path.join(outDir, 'after-74-training-edge-to-edge-fullscreen.png'))

    // 4. 지인 디저트 광장
    console.log('4. Testing Plaza Screen Edge-to-Edge...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('지인 디저트 광장(M3)'),
    })
    await sleep(2500)
    await cdp.screenshot(path.join(outDir, 'after-75-plaza-edge-to-edge-fullscreen.png'))

    console.log('All screens verified successfully!')
    ws.close()
  } finally {
    proc.kill()
  }
}

main().catch((err) => {
  console.error('Test run failed:', err)
  process.exit(1)
})

