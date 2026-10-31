import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-verify-step28')

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
      '--remote-debugging-port=9296',
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
    const res = await fetch('http://127.0.0.1:9296/json/list')
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

    // 1. 장비 강화 화면: 3D 캐릭터 렌더링 복원 확인
    console.log('1. Checking GearScreen 3D MonsterView...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('장비·강화'),
    })
    await sleep(2500)
    await cdp.screenshot(path.join(outDir, 'after-96-gear-3d-monster-restored.png'))

    // 2. 광장 화면: 사계절 테마 수동 선택창 숨김 및 계절 뱃지 확인
    console.log('2. Checking Plaza Theme Selector Hidden...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('광장(가을테마)'),
    })
    await sleep(2500)
    await cdp.screenshot(path.join(outDir, 'after-97-plaza-theme-selector-hidden.png'))

    // 3. 로그인 화면: 로그인 시 알 무지개 충전 애니메이션 확인
    console.log('3. Checking Login Egg Rainbow Animation...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/',
    })
    await sleep(2000)

    // 이메일 입력 후 '인증 코드 받기' 클릭하여 busy=true (무지개 로딩) 트리거
    await cdp.eval(`
      (() => {
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) {
          emailInput.value = 'test@dessert.pet';
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const submitBtn = document.querySelector('button[type="submit"], form button');
        if (submitBtn) submitBtn.click();
      })()
    `)
    await sleep(600)
    await cdp.screenshot(path.join(outDir, 'after-98-login-egg-rainbow-loading.png'))

    console.log('All verification screenshots captured successfully!')
  } catch (e) {
    console.error('Error during verification:', e)
  } finally {
    proc.kill()
  }
}

run()

