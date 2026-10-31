import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-4fixes')

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
    const targetsRes = await fetch('http://127.0.0.1:9297/json/list')
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

    // 1. 미니룸 펫 스케일 검증 ('나만의 미니룸')
    console.log('2. 미니룸 스케일 검증...')
    await cdp.selectScreen('나만의 미니룸')
    await cdp.screenshot(path.join(outDir, 'after-111-miniroom-pet-scale.png'))

    // 2. 뷰티크 상점 검증 ('파티세리 부티크')
    console.log('3. 부티크 상점 검증...')
    await cdp.selectScreen('파티세리 부티크')
    await cdp.screenshot(path.join(outDir, 'after-112-boutique-3d-star-and-aura.png'))

    // 3. 거대 보스 레이드 옹기종기 파티 검증 ('DESSERT MAX 월드 보스 레이드')
    console.log('4. DESSERT MAX 월드 보스 레이드 검증...')
    await cdp.selectScreen('DESSERT MAX 월드 보스 레이드')
    await cdp.screenshot(path.join(outDir, 'after-113-boss-raid-nonoverlapping-party.png'))

    // 4. 광장 따뜻한 좋아요(👍) 배지 검증 ('지인 디저트 광장(M3)')
    console.log('5. 디저트 쇼케이스 광장 검증...')
    await cdp.selectScreen('지인 디저트 광장(M3)')
    await cdp.screenshot(path.join(outDir, 'after-114-plaza-thumbs-up-likes.png'))

    console.log('모든 4대 항목 검증 완료!')
    ws.close()
  } finally {
    proc.kill()
  }
}

run().catch(console.error)
