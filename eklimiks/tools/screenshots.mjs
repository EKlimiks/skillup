/**
 * Прогон страниц демо: одна сессия Edge, серия скриншотов.
 * node shots.mjs <spec.json>
 *
 * spec: { url, shots: [{ name, route, w, h, wait, full, setup, scroll }] }
 */
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9344
const PROFILE = process.env.TEMP + '\\edge-shots-profile'
const spec = JSON.parse(readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, ''))
const OUTDIR = spec.outdir

if (existsSync(PROFILE)) { try { rmSync(PROFILE, { recursive: true, force: true }) } catch {} }
mkdirSync(OUTDIR, { recursive: true })

const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--hide-scrollbars', '--force-device-scale-factor=1', '--mute-audio',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, 'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function version() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return await r.json() } catch {}
    await sleep(250)
  }
  throw new Error('CDP недоступен')
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.waits = new Map(); this.handlers = [] }
  static async connect(u) {
    const ws = new WebSocket(u)
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
    const c = new CDP(ws)
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.id && c.waits.has(m.id)) { const w = c.waits.get(m.id); c.waits.delete(m.id); m.error ? w.rej(new Error(JSON.stringify(m.error))) : w.res(m.result) }
      else c.handlers.forEach((h) => h(m))
    }
    return c
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id
    return new Promise((res, rej) => {
      this.waits.set(id, { res, rej })
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
      setTimeout(() => { if (this.waits.has(id)) { this.waits.delete(id); rej(new Error('timeout ' + method)) } }, 60000)
    })
  }
  on(fn) { this.handlers.push(fn) }
}

const v = await version()
const cdp = await CDP.connect(v.webSocketDebuggerUrl)
const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true })
const S = (m, p) => cdp.send(m, p, sessionId)
await S('Page.enable'); await S('Runtime.enable')

const log = []
let currentErrors = []
cdp.on((m) => {
  if (m.method === 'Runtime.exceptionThrown') currentErrors.push((m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || '').split('\n')[0])
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') currentErrors.push(m.params.args.map((a) => a.value || a.description).join(' ').split('\n')[0])
})

/* первичная загрузка, чтобы установить origin для localStorage */
await S('Page.navigate', { url: spec.url })
await sleep(4200)

for (const [i, shot] of spec.shots.entries()) {
  currentErrors = []
  const w = shot.w || 1600, h = shot.h || 1050
  await S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: !!shot.mobile })
  if (shot.setup) {
    const r = await S('Runtime.evaluate', { expression: shot.setup, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) currentErrors.push('SETUP: ' + (r.exceptionDetails.exception?.description || '').split('\n')[0])
  }
  /* параметр запроса заставляет браузер перезагрузить документ,
     иначе смена только hash не перечитывает состояние приложения */
  await S('Page.navigate', { url: spec.url + `?s=${i}` + (shot.route || '') })
  await sleep(shot.wait ?? 4200)
  if (shot.post) {
    /* действия после загрузки: клики по вкладкам и т.п. */
    const r = await S('Runtime.evaluate', { expression: shot.post, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) currentErrors.push('POST: ' + (r.exceptionDetails.exception?.description || '').split('\n')[0])
    await sleep(shot.postWait ?? 2200)
  }
  if (shot.scroll) {
    await S('Runtime.evaluate', { expression: `window.scrollTo({top:${shot.scroll},behavior:'instant'})` })
    await sleep(1400)
  }
  const png = await S('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!shot.full })
  writeFileSync(join(OUTDIR, shot.name + '.png'), Buffer.from(png.data, 'base64'))
  const info = await S('Runtime.evaluate', {
    expression: `JSON.stringify({t:document.title, len:document.body.innerText.length, imgs:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).length, h:document.body.scrollHeight})`,
    returnByValue: true,
  })
  const d = JSON.parse(info.result.value)
  log.push({ shot: shot.name, textLen: d.len, brokenImgs: d.imgs, pageHeight: d.h, errors: [...new Set(currentErrors)].slice(0, 4) })
  console.log(shot.name, JSON.stringify(log.at(-1)))
}

try { await cdp.send('Target.closeTarget', { targetId }) } catch {}
edge.kill()
writeFileSync(join(OUTDIR, '_report.json'), JSON.stringify(log, null, 1))
process.exit(0)
