/**
 * Проверка миграции: кладём в localStorage «старую» базу (как из прошлой сборки)
 * и убеждаемся, что она пересоздаётся, а кабинет и отзывы работают.
 */
import { spawn } from 'node:child_process'
import { rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9422
const P = process.env.TEMP + '\\edge-migr'
const URL = process.argv[2]
const OUT = process.argv[3]
mkdirSync(OUT, { recursive: true })
try { rmSync(P, { recursive: true, force: true }) } catch {}

const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${P}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let v
for (let i = 0; i < 80; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { v = await r.json(); break } } catch {} await sleep(250) }
const ws = new WebSocket(v.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const waits = new Map()
const errors = []
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && waits.has(m.id)) { waits.get(m.id)(m.result); waits.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails?.exception?.description || '').split('\n')[0])
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value || a.description).join(' ').split('\n')[0])
}
const send = (m, p = {}, s) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p, ...(s ? { sessionId: s } : {}) })) })
const t = await send('Target.createTarget', { url: 'about:blank' })
const a = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const S = (m, p) => send(m, p, a.sessionId)
await S('Page.enable'); await S('Runtime.enable')
await S('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1100, deviceScaleFactor: 1, mobile: false })
const ev = async (expr, ap = true) => {
  const r = await S('Runtime.evaluate', { expression: expr, awaitPromise: ap, returnByValue: true })
  return r.exceptionDetails ? 'ОШИБКА: ' + (r.exceptionDetails.exception?.description || '').split('\n')[0] : r.result.value
}
const shot = async (n, full = false) => {
  const png = await S('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full })
  writeFileSync(join(OUT, n + '.png'), Buffer.from(png.data, 'base64'))
}

/* ── 1. чистая загрузка, чтобы получить базу текущей версии ── */
await S('Page.navigate', { url: URL })
await sleep(2500)
await ev(`localStorage.clear();'ok'`, false)
await S('Page.navigate', { url: URL + '?v=seed' })
await sleep(6500)
console.log('новая база:', await ev(`(()=>{const d=JSON.parse(localStorage.getItem('eklimiks.db.v1'));return JSON.stringify({v:d.v,reviews:d.reviews.length})})()`, false))

/* ── 2. подменяем её на «старую»: без поля v, 12 отзывов, старые счётчики ── */
console.log('\nподкладываем старую базу...')
console.log(await ev(`(()=>{
  const d = JSON.parse(localStorage.getItem('eklimiks.db.v1'));
  delete d.v;                                   // как в сборке до версионирования
  d.reviews = d.reviews.slice(0, 12).map(r => ({ id:r.id, productSlug:'airpods-4', author:r.author, rating:r.rating, text:r.text, approved:true, createdAt:r.createdAt }));
  d.products = d.products.map(p => ({ ...p, reviews: 276, rating: 4.8 }));   // старые захардкоженные цифры
  delete d.carts;
  localStorage.setItem('eklimiks.db.v1', JSON.stringify(d));
  return JSON.stringify({v:d.v||'нет', reviews:d.reviews.length, firstProductReviews:d.products[0].reviews});
})()`, false))

/* ── 3. перезагрузка: база должна пересоздаться ── */
await S('Page.navigate', { url: URL + '?v=migrated' })
await sleep(6500)
console.log('после перезагрузки:', await ev(`(()=>{const d=JSON.parse(localStorage.getItem('eklimiks.db.v1'));return JSON.stringify({v:d.v, reviews:d.reviews.length, airpods4:d.products.find(p=>p.slug==='airpods-4').reviews, carts: typeof d.carts})})()`, false))
await shot('m-admin')

/* ── 4. вход клиентом → кабинет ── */
console.log('\nвход клиентом:')
console.log(await ev(`(async()=>{
  location.hash='#/login'; await new Promise(r=>setTimeout(r,2200));
  const b=[...document.querySelectorAll('.ti__model')].find(x=>x.textContent.includes('Клиент'));
  if(!b) return 'кнопка не найдена'; b.click(); await new Promise(r=>setTimeout(r,3200));
  const root=document.getElementById('root');
  return JSON.stringify({hash:location.hash, len:root.innerText.length, wipe:document.querySelector('.wipe')?.className||'нет', skel:!!document.querySelector('.skel')});
})()`))
await shot('m-account')

/* ── 5. отзывы товара AirPods 4 ── */
console.log('\nAirPods 4:')
console.log(await ev(`(async()=>{
  location.hash='#/product/airpods-4'; await new Promise(r=>setTimeout(r,3600));
  const t=[...document.querySelectorAll('.tab')].find(b=>b.textContent.includes('Отзывы'));
  const label=t?t.textContent:'нет'; t&&t.click(); await new Promise(r=>setTimeout(r,1800));
  const p=JSON.parse(localStorage.getItem('eklimiks.db.v1')).products.find(x=>x.slug==='airpods-4');
  return JSON.stringify({tabLabel:label, cardReviews:p.reviews, rows:[...document.querySelectorAll('.revsum__row')].map(r=>r.innerText.replace(/\\n/g,' ')), shown:document.querySelectorAll('.rev').length, empty:!!document.querySelector('.empty')});
})()`))

console.log('\nошибки консоли:', errors.length ? [...new Set(errors)].slice(0, 5).join(' | ') : 'нет')
edge.kill()
process.exit(0)
