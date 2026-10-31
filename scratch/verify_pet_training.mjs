import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-verify-pet-training')

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
      '--remote-debugging-port=9288',
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
        const res = await fetch('http://127.0.0.1:9288/json/list')
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

    // 1. 메인 홈: 펫 짤림 없는지 확인
    console.log('1. Checking Main Home Pet Framing...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('몬스터 홈'),
    })
    await sleep(2200)
    await cdp.screenshot(path.join(outDir, 'after-79-home-pet-unclipped.png'))

    // 2. 파티세리 훈련: 코스 탭 (확장된 펫 스테이지 + 슬림 컨트롤)
    console.log('2. Checking Patisserie Training Courses...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('파티세리 훈련(M2)'),
    })
    await sleep(2200)
    await cdp.screenshot(path.join(outDir, 'after-80-training-expanded-pet-compact-controls.png'))

    // 3. 파티세리 훈련: 타워 탭
    console.log('3. Checking Patisserie Training Tower...')
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const towerBtn = btns.find(b => b.textContent && b.textContent.includes('디저트 타워'));
        if (towerBtn) towerBtn.click();
      })()
    `)
    await sleep(1200)
    await cdp.screenshot(path.join(outDir, 'after-81-training-tower-expanded-pet.png'))

    // 4. 파티세리 훈련: 능력치 탭
    console.log('4. Checking Patisserie Training Stats...')
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const statBtn = btns.find(b => b.textContent && b.textContent.includes('능력치'));
        if (statBtn) statBtn.click();
      })()
    `)
    await sleep(1200)
    await cdp.screenshot(path.join(outDir, 'after-82-training-stats-compact.png'))

  } finally {
    proc.kill()
  }
}

run().catch(console.error)

