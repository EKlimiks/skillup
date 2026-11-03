/** Отладка состояния экрана сразу после регистрации. */
import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 10241
const PROFILE = process.env.TEMP + '\\edge-dbg2'
try { rmSync(PROFILE, { recursive: true, force: true }) } catch {}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' })
let ver
for (let i = 0; i < 80; i++) { try { const x = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (x.ok) { ver = await x.json(); break } } catch {} await sleep(250) }
const ws = new WebSocket(ver.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0; const waits = new Map(); const errors = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && waits.has(m.id)) { waits.get(m.id)(m.result); waits.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception?.description || '').split('\n')[0])
}
const send = (m, p = {}, s) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p, ...(s ? { sessionId: s } : {}) })) })
const t = await send('Target.createTarget', { url: 'about:blank' })
const a = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const S = (m, p) => send(m, p, a.sessionId)
await S('Page.enable'); await S('Runtime.enable')
await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
const ev = async (expr, ap = true) => {
  const x = await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: ap, userGesture: true })
  if (x.exceptionDetails) return 'ИСКЛ: ' + (x.exceptionDetails.exception?.description || '').split('\n')[0]
  return x.result.value
}
await S('Page.navigate', { url: 'https://full-emerald.vps.ktk-45.ru/skillup/' }); await sleep(6500)
await ev(`document.querySelector('#ob-skip').click()`, false); await sleep(1000)
await ev(`document.querySelector('#to-me').click()`, false); await sleep(1000)
await ev(`document.querySelector('#to-auth').click()`, false); await sleep(1000)
await ev(`document.querySelector('#au-switch').click()`, false); await sleep(800)
const em = 'dbg2_' + Date.now() + '@example.com'
await ev(`(function(){
  const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(el.constructor.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))};
  set(document.querySelector('#au-name'),'Дбг2');
  set(document.querySelector('#au-email'),'${em}');
  set(document.querySelector('#au-pass'),'secret12345');
  set(document.querySelector('#au-pass2'),'secret12345');
  return 1})()`, false)
await ev(`document.querySelector('#au-go').click()`, false)
await sleep(9000)
console.log('экраны и состояние:')
console.log('  первый заголовок:', await ev(`(document.querySelector('#app h1')||{}).textContent`, false))
console.log('  tab:', await ev(`tab`, false))
console.log('  screen:', await ev(`String(screen)`, false))
console.log('  authError:', await ev(`authError`, false))
console.log('  токен:', await ev(`!!(JSON.parse(localStorage.getItem('skillup.auth')||'null'))?.token`, false))
console.log('  .synced текст:', await ev(`(document.querySelector('.synced')||{}).textContent`, false))
console.log('  .fld__err:', await ev(`(document.querySelector('.fld__err')||{}).textContent`, false))
console.log('  текст экрана:', await ev(`document.body.innerText.replace(/\\s+/g,' ').slice(0,150)`, false))
console.log('  исключения:', errors.length ? errors.join(' | ') : 'нет')
edge.kill()
process.exit(0)
