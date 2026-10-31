import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-home-badge')

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

  await sleep(2500)

  try {
    const targetsRes = await fetch('http://127.0.0.1:9296/json/list')
    const targets = await targetsRes.json()
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0]

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
    await new Promise((r) => (ws.onopen = r))
    const cdp = new CdpSession(ws)

    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

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
    await sleep(2000)

    // 방명록 3건 등록
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const sampleGuestBook = [
          { id: 'gb-1', authorNickname: '몽실 님', petSpecies: 'mongsil', petName: '딸기몽실', message: '방문 도장!', createdAt: new Date().toISOString() },
          { id: 'gb-2', authorNickname: '별비늘 님', petSpecies: 'byeolbineul', petName: '카멜레온', message: '너무 아늑해요~', createdAt: new Date().toISOString() },
          { id: 'gb-3', authorNickname: '마포 님', petSpecies: 'dubai-cookie', petName: '두바이쿠키', message: '초코향이 솔솔!', createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('dessert_pet_miniroom_guestbook_v1', JSON.stringify(sampleGuestBook));
      })()`,
    })

    console.log('2. 몬스터 홈 선택...')
    await cdp.selectScreen('몬스터 홈')
    await sleep(3000)

    // 미니룸 버튼 배지 캡처
    await cdp.screenshot(path.join(outDir, 'after-122-home-miniroom-badge.png'))
    console.log('캡처 완료!')

    ws.close()
  } catch (err) {
    console.error('에러:', err)
  } finally {
    proc.kill()
  }
}

run()
