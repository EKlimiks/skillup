/** Проверка, что фиолетовая стилистика реально применилась. */
import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 10251
const PROFILE = process.env.TEMP + '\\edge-style'
try { rmSync(PROFILE, { recursive: true, force: true }) } catch {}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' })
let ver
for (let i = 0; i < 80; i++) { try { const x = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (x.ok) { ver = await x.json(); break } } catch {} await sleep(250) }
const ws = new WebSocket(ver.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0; const waits = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && waits.has(m.id)) { waits.get(m.id)(m.result); waits.delete(m.id) } }
const send = (m, p = {}, s) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p, ...(s ? { sessionId: s } : {}) })) })
const t = await send('Target.createTarget', { url: 'about:blank' })
const a = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const S = (m, p) => send(m, p, a.sessionId)
await S('Page.enable'); await S('Runtime.enable')
await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
const ev = async (expr, ap = true) => {
  const x = await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: ap, userGesture: true })
  return x.exceptionDetails ? 'ИСКЛ' : x.result.value
}
await S('Page.navigate', { url: 'https://full-emerald.vps.ktk-45.ru/skillup/' }); await sleep(6500)
const check = async (name, expr) => {
  const v = await ev(expr, false)
  console.log('  ' + (v ? '✓' : '✗') + ' ' + name + (typeof v === 'string' ? ' — ' + v.slice(0, 110) : ''))
}
console.log('вычисленные стили:')
await check('фон с фиолетовым сиянием', `getComputedStyle(document.body).backgroundImage.includes('radial-gradient')`)
await check('кнопка — фиолетовый градиент', `(function(){const b=document.querySelector('.btn--primary');return b?getComputedStyle(b).backgroundImage.includes('linear-gradient'):'нет кнопки'})()`)
await check('кнопка белым текстом', `(function(){const b=document.querySelector('.btn--primary');return b?getComputedStyle(b).color==='rgb(255, 255, 255)':'—'})()`)
await check('карточки со свечением (тень)', `(function(){const c=document.querySelector('.card');return c?getComputedStyle(c).boxShadow!=='none':'нет'})()`)
await check('заголовок с градиентным текстом', `(function(){const h=document.querySelector('.h1');if(!h)return 'нет h1';const s=getComputedStyle(h);return s.webkitBackgroundClip==='text'||s.backgroundClip==='text'})()`)
await check('кольца светятся (drop-shadow)', `(function(){const r=document.querySelector('.ring');return r?getComputedStyle(r).filter.includes('drop-shadow'):'нет кольца'})()`)
await check('меню — фиолетовое стекло', `(function(){const n=document.querySelector('.nav');const s=getComputedStyle(n);return s.backgroundColor.includes('rgba(22, 11, 42)')})()`)
await check('акцент фиолетовый', `getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()==='#b794ff'`)
await check('нет светлой темы', `![...document.styleSheets].some(s=>{try{return [...s.cssRules].some(r=>r.media&&/prefers-color-scheme/i.test(r.media.mediaText))}catch(e){return false}})`)
/* пройдём знакомство, чтобы посмотреть главный экран в новом стиле */
await ev(`document.querySelector('#ob-skip').click()`, false); await sleep(1200)
await check('экран «Сегодня» в новом стиле: карточка-герой со свечением', `(function(){const h=document.querySelector('.hero');return h?getComputedStyle(h).boxShadow!=='none':'нет'})()`)
await check('топбар с градиентным брендом', `(function(){const b=document.querySelector('.topbar__brand span');if(!b)return 'нет';const s=getComputedStyle(b);return s.webkitBackgroundClip==='text'&&s.color==='rgba(0, 0, 0, 0)'})()`)
edge.kill()
process.exit(0)
