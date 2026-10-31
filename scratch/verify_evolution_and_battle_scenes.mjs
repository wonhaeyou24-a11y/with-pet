import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-verify-evo-battle-v2')

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
      '--use-gl=angle',
      '--window-size=430,932',
    ],
    { stdio: 'ignore' }
  )

  try {
    let wsUrl = null
    for (let i = 0; i < 20; i++) {
      await sleep(400)
      try {
        const res = await fetch('http://127.0.0.1:9296/json')
        const list = await res.json()
        const target = list.find((t) => t.type === 'page')
        if (target && target.webSocketDebuggerUrl) {
          wsUrl = target.webSocketDebuggerUrl
          break
        }
      } catch {}
    }

    if (!wsUrl) throw new Error('Edge CDP 연결 실패')
    console.log('Connected to Edge CDP')

    const ws = new WebSocket(wsUrl)
    await new Promise((r) => (ws.onopen = r))

    const cdp = new CdpSession(ws)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 915,
      deviceScaleFactor: 2.5,
      mobile: true,
    })

    // 1. [진화 업그레이드] 포켓몬고 1번 씬 스타일: 아기 펫과 거대 각성 디저트 듀얼 스테이지
    console.log('1. Checking Evolution Dual Stage Screen...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('각성 진화(M4)'),
    })
    await sleep(2600)
    await cdp.screenshot(path.join(outDir, 'after-88-evolution-cinematic-dual-stage.png'))

    // 2. 분기 실시간 전환: '바삭 크런치' 선택
    console.log('2. Switching branch to 바삭 크런치...')
    await cdp.eval(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const crunchBtn = buttons.find(b => b.textContent && b.textContent.includes('바삭 크런치'));
        if (crunchBtn) crunchBtn.click();
      })()
    `)
    await sleep(1500)
    await cdp.screenshot(path.join(outDir, 'after-89-evolution-branch-switch-crunch.png'))

    // 3. [전투 씬 업그레이드] 포켓몬고 2·3번 씬 스타일: 거대 보스 3D 로우앵글 & 4인 협력 레이드 파티
    console.log('3. Checking Dynamax Low-Angle Battle Screen...')
    await cdp.send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/' + encodeURIComponent('식감 ASMR 대전(M3)'),
    })
    await sleep(2600)
    await cdp.screenshot(path.join(outDir, 'after-90-battle-dynamax-low-angle-raid.png'))

    // 4. MAX 게이지 100% 충전 및 MAX 스트라이크 버튼 발동 준비
    console.log('4. Cheering to charge MAX gauge to 100%...')
    for (let c = 0; c < 7; c++) {
      await cdp.eval(`
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const cheerBtn = buttons.find(b => b.textContent && b.textContent.includes('파티 응원'));
          if (cheerBtn) cheerBtn.click();
        })()
      `)
      await sleep(200)
    }
    await sleep(800)
    await cdp.screenshot(path.join(outDir, 'after-91-battle-max-strike-ready.png'))

    console.log('All 4 visual verifications completed successfully!')
  } catch (err) {
    console.error('Error during verification:', err)
  } finally {
    proc.kill()
  }
}

run()
