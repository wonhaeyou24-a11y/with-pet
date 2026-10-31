import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

const outDir = 'C:\\Users\\dashl\\.gemini\\antigravity\\brain\\63bed995-1a0b-49e0-ac0d-37eaf980bc7d'
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const userDataDir = path.join(outDir, 'scratch', 'edge-profile-home-direct')

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function run() {
  const proc = spawn(
    edge,
    [
      '--headless=new',
      '--remote-debugging-port=9295',
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
    const targetsRes = await fetch('http://127.0.0.1:9295/json/list')
    const targets = await targetsRes.json()
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0]

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
    await new Promise((r) => (ws.onopen = r))

    let id = 1
    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const msgId = id++
        const handler = (evt) => {
          const msg = JSON.parse(evt.data)
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler)
            if (msg.error) rej(msg.error)
            else res(msg.result)
          }
        }
        ws.addEventListener('message', handler)
        ws.send(JSON.stringify({ id: msgId, method, params }))
      })

    await send('Page.enable')
    await send('Runtime.enable')

    await send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 915,
      deviceScaleFactor: 2.2,
      mobile: true,
    })

    console.log('1. 홈 이동...')
    await send('Page.navigate', {
      url: 'http://localhost:5173/#/dev/screens/%EB%AA%AC%EC%8A%A4%ED%84%B0%20%ED%99%88',
    })
    await sleep(3500)

    const res = await send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(outDir, 'after-122-home-miniroom-badge.png'), Buffer.from(res.data, 'base64'))
    console.log('캡처 완료!')

    ws.close()
  } catch (err) {
    console.error('에러:', err)
  } finally {
    proc.kill()
  }
}

run()
