/** Проверка обновлённого SkillUp: знакомство, карта, авторизация, синхронизация. */
import { spawn } from 'node:child_process'
import { rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 10203
const PROFILE = process.env.TEMP + '\\edge-v2'
const BASE = 'https://full-emerald.vps.ktk-45.ru'
const OUT = process.env.TEMP + '\\v2'
mkdirSync(OUT, { recursive: true })
try { rmSync(PROFILE, { recursive: true, force: true }) } catch {}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ─── 1. бэкенд напрямую ─── */
console.log('══ БЭКЕНД ══')
const email = 'skill_test_' + Date.now() + '@example.com'
const post = (p, body, token) => fetch(BASE + '/api' + p, {
  method: 'POST',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  body: JSON.stringify(body),
}).then(async (r) => ({ s: r.status, d: await r.json().catch(() => null) }))

let r = await post('/auth/register', { name: 'Тест Тестов', email, password: 'secret12345', password_confirmation: 'secret12345', device_name: 'Test' })
console.log('  регистрация:', r.s, r.d?.token ? 'токен получен' : JSON.stringify(r.d).slice(0, 120))
const token = r.d?.token

if (token) {
  const H = { Accept: 'application/json', Authorization: 'Bearer ' + token }
  const put = (p, body, method = 'PUT') => fetch(BASE + '/api' + p, {
    method, headers: { ...H, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  }).then(async (x) => ({ s: x.status, d: await x.json().catch(() => null) }))

  let g = await put('/skillup/progress', null, 'GET')
  console.log('  чтение пустого:', g.s, JSON.stringify(g.d).slice(0, 90))

  const prog = { xp: 250, streak: 4, bestStreak: 4, cards: { 'en-1#0': { ef: 2.5, interval: 6, due: 0, reps: 2, lapses: 0 } }, achievements: { 'a-first': 1 }, stats: { totalAnswers: 20 }, updated_at: new Date().toISOString() }
  let w = await put('/skillup/progress', prog)
  console.log('  запись:', w.s, JSON.stringify(w.d).slice(0, 90))

  let b = await put('/skillup/progress', null, 'GET')
  const got = b.d?.progress || b.d
  console.log('  чтение обратно:', b.s, '| xp =', got?.xp, '| карточек =', Object.keys(got?.cards || {}).length)

  /* merge: локальный прогресс должен объединиться, а не затереть */
  const merge = { xp: 400, streak: 1, cards: { 'js-1#0': { ef: 2.3, interval: 1, due: 0, reps: 1, lapses: 0 } }, achievements: { 'a-ten': 1 }, stats: { totalAnswers: 35 }, updated_at: new Date().toISOString() }
  const m = await post('/skillup/merge', merge, token)
  const mp = m.d?.progress || m.d
  console.log('  объединение:', m.s, '| xp =', mp?.xp, '| карточек =', Object.keys(mp?.cards || {}).length,
    '| достижений =', Object.keys(mp?.achievements || {}).length)

  /* без токена должно быть 401 */
  const noAuth = await fetch(BASE + '/api/skillup/progress', { headers: { Accept: 'application/json' } })
  console.log('  без токена:', noAuth.status)

  /* повторная регистрация */
  const dup = await post('/auth/register', { name: 'Тест', email, password: 'secret12345', password_confirmation: 'secret12345' })
  console.log('  повторный email:', dup.s, JSON.stringify(dup.d?.errors || dup.d?.message || {}).slice(0, 110))

  /* удаление аккаунта */
  const del = await put('/skillup/account', null, 'DELETE')
  console.log('  удаление аккаунта:', del.s)
}

/* ─── 2. фронтенд в браузере ─── */
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' })
let ver
for (let i = 0; i < 80; i++) { try { const x = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (x.ok) { ver = await x.json(); break } } catch {} await sleep(250) }
const ws = new WebSocket(ver.webSocketDebuggerUrl)
await new Promise((x) => (ws.onopen = x))
let id = 0
const waits = new Map()
const errors = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && waits.has(m.id)) { waits.get(m.id)(m.result); waits.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').split('\n')[0])
}
const send = (m, p = {}, s) => new Promise((x) => { const i = ++id; waits.set(i, x); ws.send(JSON.stringify({ id: i, method: m, params: p, ...(s ? { sessionId: s } : {}) })) })
const t = await send('Target.createTarget', { url: 'about:blank' })
const a = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const S = (m, p) => send(m, p, a.sessionId)
await S('Page.enable'); await S('Runtime.enable')
await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await S('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {})
const ev = async (expr, ap = true) => {
  const x = await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: ap, userGesture: true })
  return x.exceptionDetails ? 'ИСКЛ: ' + (x.exceptionDetails.exception?.description || '').split('\n')[0] : x.result.value
}
const shot = async (n) => { const p = await S('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, n + '.png'), Buffer.from(p.data, 'base64')) }
const click = (sel) => ev(`(function(){const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 'нет';e.click();return 'ок'})()`, false)

console.log('\n══ ЗНАКОМСТВО ══')
await S('Page.navigate', { url: BASE + '/skillup/' }); await sleep(6500)
console.log('  шаг 1:', await ev(`(function(){const t=document.body.innerText.replace(/\\s+/g,' ');
  return JSON.stringify({логотип:/SkillUp/.test(t), кнопка:!!document.querySelector('#ob-next'), меню_скрыто:document.querySelector('.nav').hidden})})()`, false))
await shot('01-welcome')

await click('#ob-next'); await sleep(900)
console.log('  шаг 2:', await ev(`document.body.innerText.replace(/\\s+/g,' ').slice(0,80)`, false))
await shot('02-how')

await click('#ob-next'); await sleep(900)
console.log('  шаг 3 (цель):', await ev(`document.querySelectorAll('[data-goal]').length + ' вариантов'`, false))
await click('[data-goal="10"]'); await sleep(700)
await shot('03-goal')

await click('#ob-next'); await sleep(900)
console.log('  шаг 4 (навыки):', await ev(`document.querySelectorAll('[data-pick]').length + ' навыков'`, false))
await click('[data-pick="english"]'); await sleep(400)
await click('[data-pick="code"]'); await sleep(700)
await shot('04-skills-pick')

await click('#ob-done'); await sleep(1600)
console.log('  после «Поехали»:', await ev(`(function(){
  const raw=JSON.parse(localStorage.getItem('skillup.v1')||'{}');
  return JSON.stringify({онбординг:raw.settings?.onboarded, цель:raw.settings?.goal, выбрано:raw.settings?.picked, меню:!document.querySelector('.nav').hidden})})()`, false))
await shot('05-today')

console.log('\n══ КАРТА РАЗВИТИЯ ══')
await click('.nav__b[data-tab="map"]'); await sleep(1600)
console.log('  ', await ev(`(function(){
  const nodes=[...document.querySelectorAll('.mnode')];
  const path=document.querySelector('.map__svg path');
  return JSON.stringify({
    узлов:nodes.length,
    пройдено:nodes.filter(n=>n.classList.contains('is-done')).length,
    текущий:nodes.filter(n=>n.classList.contains('is-target')).length,
    заблокировано:nodes.filter(n=>n.classList.contains('is-locked')).length,
    линия:path?(path.getAttribute('d')||'').slice(0,28):'нет',
    звание:(document.querySelector('.rank__title')||{}).textContent
  })})()`, false))
await shot('06-map')

/* открываем текущий урок с карты */
await ev(`(function(){const n=document.querySelector('.mnode.is-target');if(n)n.click()})()`, false); await sleep(1300)
console.log('  урок с карты:', await ev(`document.body.innerText.replace(/\\s+/g,' ').slice(0,90)`, false))
await shot('07-lesson')

console.log('\n══ АККАУНТ ══')
await ev(`(function(){const b=document.querySelector('#back');if(b)b.click()})()`, false); await sleep(900)
await click('.nav__b[data-tab="me"]'); await sleep(1300)
console.log('  профиль без входа:', await ev(`(function(){const t=document.body.innerText;
  return JSON.stringify({вход:/Войти или создать/.test(t), настройки:/Настройки/.test(t)})})()`, false))
await shot('08-me')

await click('#to-auth'); await sleep(1300)
console.log('  экран входа:', await ev(`!!document.querySelector('#au-email') ? 'поля есть' : 'нет полей'`, false))
await shot('09-auth')

/* регистрируемся через реальный бэкенд */
const liveEmail = 'skill_live_' + Date.now() + '@example.com'
await ev(`(function(){
  const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(el.constructor.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))};
  document.querySelector('#au-switch').click();
  return 1})()`, false)
await sleep(1000)
await ev(`(function(){
  const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(el.constructor.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))};
  set(document.querySelector('#au-name'),'Живой Тест');
  set(document.querySelector('#au-email'),${JSON.stringify(liveEmail)});
  set(document.querySelector('#au-pass'),'secret12345');
  set(document.querySelector('#au-pass2'),'secret12345');
  return 1})()`, false)
await sleep(600)
await shot('10-register-filled')
await click('#au-go'); await sleep(5000)
console.log('  после регистрации:', await ev(`(function(){
  const auth=JSON.parse(localStorage.getItem('skillup.auth')||'null');
  const t=document.body.innerText.replace(/\\s+/g,' ');
  return JSON.stringify({токен:!!auth?.token, имя:auth?.user?.name, экран_профиля:/Профиль/.test(t), сохраняется:/Сохранено|Сохранение/.test(t)})})()`, false))
await shot('11-me-logged')

console.log('\n══ АДАПТАЦИЯ ══')
for (const [name, w, h, mob] of [['iphone-se', 320, 568, true], ['iphone-15', 393, 852, true], ['ipad', 820, 1180, true], ['desktop', 1440, 900, false]]) {
  await S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: mob })
  await sleep(1200)
  const info = await ev(`(function(){
    const nav=document.querySelector('.nav');
    const app=document.getElementById('app');
    return JSON.stringify({переполнение: document.documentElement.scrollWidth > window.innerWidth + 2,
      меню: nav ? Math.round(nav.getBoundingClientRect().height) : 0,
      ширина: Math.round(app.getBoundingClientRect().width)})})()`, false)
  console.log(`  ${name} (${w}x${h}): ${info}`)
  if (name === 'iphone-se' || name === 'ipad') await shot('12-' + name)
}
await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })

console.log('\nошибки консоли:', errors.length ? [...new Set(errors)].slice(0, 4).join('\n  ') : 'нет')
edge.kill()
process.exit(0)
