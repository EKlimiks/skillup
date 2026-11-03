/**
 * Диагностика: чистый localStorage → вход → кабинет/админка → отзывы товара.
 * Печатает ошибки консоли и состояние ключевых блоков.
 */
import { spawn } from 'node:child_process'
import { rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9411
const P = process.env.TEMP + '\\edge-diag'
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
let errors = []
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && waits.has(m.id)) { waits.get(m.id)(m.result); waits.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || '').split('\n').slice(0, 3).join(' | '))
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value || a.description).join(' ').split('\n')[0])
}
const send = (m, p = {}, s) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p, ...(s ? { sessionId: s } : {}) })) })
const t = await send('Target.createTarget', { url: 'about:blank' })
const a = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const S = (m, p) => send(m, p, a.sessionId)
await S('Page.enable'); await S('Runtime.enable')
await S('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1100, deviceScaleFactor: 1, mobile: false })

const evalIn = async (expr, awaitPromise = true) => {
  const r = await S('Runtime.evaluate', { expression: expr, awaitPromise, returnByValue: true })
  if (r.exceptionDetails) return 'ОШИБКА: ' + (r.exceptionDetails.exception?.description || '').split('\n')[0]
  return r.result.value
}
const shot = async (name, full = false) => {
  const png = await S('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full })
  writeFileSync(join(OUT, name + '.png'), Buffer.from(png.data, 'base64'))
}

/* 1. открываем демо и чистим хранилище */
await S('Page.navigate', { url: URL })
await sleep(3000)
console.log('чистка localStorage:', await evalIn(`localStorage.clear(); 'ok'`, false))
await S('Page.navigate', { url: URL + '?clean=1' })
await sleep(6500)

/* 2. данные в базе */
console.log('\n--- БАЗА ---')
console.log(await evalIn(`(()=>{const d=JSON.parse(localStorage.getItem('eklimiks.db.v1'));return JSON.stringify({version:d.v||'нет', products:d.products.length, reviews:d.reviews.length, clients:d.users.length, firstProduct:{slug:d.products[0].slug, rating:d.products[0].rating, reviews:d.products[0].reviews}})})()`))

/* 3. отзывы по первому товару */
console.log('\n--- ОТЗЫВЫ ТОВАРА ---')
console.log(await evalIn(`(async()=>{const d=JSON.parse(localStorage.getItem('eklimiks.db.v1'));const slug=d.products[0].slug;window.__slug=slug;const mod=document.querySelector('#root');return JSON.stringify({slug})})()`, false))

/* 4. вход клиентом и кабинет */
console.log('\n--- ВХОД КЛИЕНТОМ ---')
console.log(await evalIn(`(async()=>{
  location.hash = '#/login'; await new Promise(r=>setTimeout(r,2500));
  const btns=[...document.querySelectorAll('.ti__model')];
  const client=btns.find(b=>b.textContent.includes('Клиент'));
  if(!client) return 'кнопка входа не найдена';
  client.click(); await new Promise(r=>setTimeout(r,3000));
  return JSON.stringify({hash:location.hash, rootLen:document.getElementById('root').innerText.length, wipe:document.querySelector('.wipe')?.className||'нет'});
})()`))
await sleep(1200)
console.log('кабинет, видимый текст:', await evalIn(`document.getElementById('root').innerText.slice(0,180).replace(/\\n/g,' / ')`, false))
console.log('наложение-занавес:', await evalIn(`document.querySelector('.wipe')?.className || 'нет'`, false))
await shot('d-account')

/* 5. товар → вкладка отзывов */
const slug = await evalIn(`window.__slug || JSON.parse(localStorage.getItem('eklimiks.db.v1')).products[0].slug`, false)
console.log('\n--- СТРАНИЦА ТОВАРА', slug, '---')
await evalIn(`location.hash = '#/product/'+${JSON.stringify(slug)}; 'ok'`, false)
await sleep(4000)
console.log(await evalIn(`(async()=>{
  const t=[...document.querySelectorAll('.tab')].find(b=>b.textContent.includes('Отзывы'));
  if(!t) return 'вкладка не найдена';
  const label=t.textContent; t.click(); await new Promise(r=>setTimeout(r,1800));
  const rows=[...document.querySelectorAll('.revsum__row')].map(r=>r.innerText.replace(/\\n/g,' '));
  return JSON.stringify({label, rows, cards:document.querySelectorAll('.rev').length, empty:!!document.querySelector('.empty')});
})()`))
await evalIn(`document.querySelector('.revsum')?.scrollIntoView({block:'start'});'ok'`, false)
await sleep(1200)
await shot('d-product-reviews')

/* 6. админка */
console.log('\n--- АДМИНКА ---')
console.log(await evalIn(`(async()=>{const d=JSON.parse(localStorage.getItem('eklimiks.db.v1'));d.currentUserId=1;localStorage.setItem('eklimiks.db.v1',JSON.stringify(d));location.hash='#/admin';location.reload();return 'reload'})()`))
await sleep(6000)
console.log('админка, длина текста:', await evalIn(`document.getElementById('root').innerText.length`, false))
await shot('d-admin')

console.log('\n--- ОШИБКИ КОНСОЛИ ---')
console.log(errors.length ? [...new Set(errors)].slice(0, 8).join('\n') : 'нет')

edge.kill()
process.exit(0)
