import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-5fixes')

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
      '--remote-debugging-port=9298',
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
    const targetsRes = await fetch('http://127.0.0.1:9298/json/list')
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

    // 화면 1: DESSERT MAX 월드 보스 레이드
    console.log('2. DESSERT MAX 월드 보스 레이드 선택...')
    await cdp.selectScreen('DESSERT MAX 월드 보스 레이드')
    await sleep(2000)
    await cdp.screenshot(path.join(outDir, 'after-115-world-boss-dragon-and-bars.png'))

    // 화면 2: 지인 디저트 광장 (내 펫 클릭하여 방어전 기록 모달 오픈)
    console.log('3. 지인 디저트 광장 선택...')
    await cdp.selectScreen('지인 디저트 광장(M3)')
    await sleep(2000)
    // 내 파트너 클릭
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        // "⭐ 내 파트너" 뱃지를 포함한 요소 클릭
        const allSpans = Array.from(document.querySelectorAll('span, div'));
        const myBadge = allSpans.find(el => el.textContent && el.textContent.includes('⭐ 내 파트너'));
        if (myBadge) {
          myBadge.click();
        }
      })()`,
    })
    await sleep(1500)
    await cdp.screenshot(path.join(outDir, 'after-116-plaza-defense-history-modal.png'))

    // 화면 3: 디저트 돌보기 (포만감 & 밸런스)
    console.log('4. 디저트 돌보기 선택...')
    await cdp.selectScreen('돌보기·토핑 가방·베이커리')
    await sleep(2000)
    await cdp.screenshot(path.join(outDir, 'after-117-care-fullness-balance.png'))

    // 화면 4: 나만의 미니룸 (펫 터치 상호작용)
    console.log('5. 나만의 미니룸 선택...')
    await cdp.selectScreen('나만의 미니룸')
    await sleep(2000)
    // 펫 터치 시뮬레이션
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const petContainer = document.querySelector('div[title*="터치하여"]');
        if (petContainer) {
          petContainer.click();
        }
      })()`,
    })
    await sleep(1000)
    await cdp.screenshot(path.join(outDir, 'after-118-myroom-touch-asmr.png'))

    console.log('모든 캡처 완료!')
    ws.close()
  } catch (err) {
    console.error('에러 발생:', err)
  } finally {
    proc.kill()
  }
}

run()

