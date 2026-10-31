import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-verify-6-fixes')

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
      '--remote-debugging-port=9299',
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
        const res = await fetch('http://127.0.0.1:9299/json/list')
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

    // 1. 메인 홈: 펫 아래로 내려 상단 짤림 완벽 해결 확인
    console.log('1. Checking Main Home Headroom...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('몬스터 홈'),
    })
    await sleep(2200)
    await cdp.screenshot(path.join(outDir, 'after-83-home-pet-headroom-adjusted.png'))

    // 2. 파티세리 훈련 코스: 박스 간격 축소 및 펫 스테이지 대폭 확장
    console.log('2. Checking Training Courses Expanded Pet...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('파티세리 훈련(M2)'),
    })
    await sleep(2200)
    await cdp.screenshot(path.join(outDir, 'after-84-training-pet-maximized-compact-boxes.png'))

    // 3. 디저트 타워: 가로 레일 지도 확대 및 여유 공간 최적화
    console.log('3. Checking Tower Spacious Rail Map...')
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const towerBtn = btns.find(b => b.textContent && b.textContent.includes('디저트 타워'));
        if (towerBtn) towerBtn.click();
      })()
    `)
    await sleep(1200)
    await cdp.screenshot(path.join(outDir, 'after-85-training-tower-spacious-map.png'))

    // 4. 광장: 현실 날짜/계절 자동 테마 반영 확인
    console.log('4. Checking Plaza Auto Season & Event Theme...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('지인 디저트 광장(M3)'),
    })
    await sleep(2200)
    await cdp.screenshot(path.join(outDir, 'after-86-plaza-auto-season-theme.png'))

    // 5. 친선 대전: 글박스 짤림 없는지 확인
    console.log('5. Checking Battle Arena Cutin...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('식감 ASMR 대전(M3)'),
    })
    await sleep(2000)
    await cdp.screenshot(path.join(outDir, 'after-87-battle-cutin-no-clip.png'))

  } finally {
    proc.kill()
  }
}

run().catch(console.error)

