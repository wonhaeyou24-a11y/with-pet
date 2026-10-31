import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-raid-plaza')

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

    // 방명록 데이터 심기
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const sampleGuestBook = [
          {
            id: 'gb-1',
            authorNickname: '몽실 님',
            petSpecies: 'mongsil',
            petName: '딸기몽실',
            message: '미니룸 너무 예뻐요! 디저트 향기 가득!',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'gb-2',
            authorNickname: '별비늘 님',
            petSpecies: 'byeolbineul',
            petName: '카멜레온',
            message: '방문 도장 쾅 찍고 갑니다~',
            createdAt: new Date().toISOString(),
          }
        ];
        localStorage.setItem('dessert_pet_miniroom_guestbook_v1', JSON.stringify(sampleGuestBook));
      })()`,
    })

    // 1. 메인 홈: 미니룸 버튼 배지 ('새 글 2')
    console.log('2. 몬스터 홈 선택...')
    await cdp.selectScreen('몬스터 홈')
    await sleep(2500)
    await cdp.screenshot(path.join(outDir, 'after-122-home-miniroom-badge.png'))

    // 2. 디저트 광장: 상단 헤더 보스버튼 삭제 + 광장 맵 중앙 상단에 3D 거대보스 직접 출현
    console.log('3. 지인 디저트 광장(M3) 선택...')
    await cdp.selectScreen('지인 디저트 광장(M3)')
    await sleep(3000)
    await cdp.screenshot(path.join(outDir, 'after-123-plaza-world-boss-3d.png'))

    // 3. DESSERT MAX 월드 보스 레이드: 8마리 지인 펫(24px prefer2D) + 공격하는 내 펫만 전면 돌격 + 우측 상단 플로팅 피해량 보드 박스
    console.log('4. DESSERT MAX 월드 보스 레이드 선택...')
    await cdp.selectScreen('DESSERT MAX 월드 보스 레이드')
    await sleep(3000)
    await cdp.screenshot(path.join(outDir, 'after-124-boss-raid-damage-board-and-allies.png'))

    console.log('모든 스크린샷 캡처 완료!')
    ws.close()
  } catch (err) {
    console.error('에러 발생:', err)
  } finally {
    proc.kill()
  }
}

run()
