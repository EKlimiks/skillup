/** Проверка SkillUp: экраны, занятие, прогресс, офлайн. */
import { spawn } from 'node:child_process'
import { rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 10170
const PROFILE = process.env.TEMP + '\\edge-skillup'
const BASE = process.argv[2] || 'https://full-emerald.vps.ktk-45.ru/skillup/'
const OUT = process.env.TEMP + '\\skillup'
mkdirSync(OUT, { recursive: true })
try { rmSync(PROFILE, { recursive: true, force: true }) } catch {}

const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ver
for (let i = 0; i < 80; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { ver = await r.json(); break } } catch {} await sleep(250) }
const ws = new WebSocket(ver.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const waits = new Map()
const errors = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && waits.has(m.id)) { waits.get(m.id)(m.result); waits.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').split('\n')[0])
}
const send = (m, p = {}, s) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p, ...(s ? { sessionId: s } : {}) })) })
const t = await send('Target.createTarget', { url: 'about:blank' })
const a = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const S = (m, p) => send(m, p, a.sessionId)
await S('Page.enable'); await S('Runtime.enable')
await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await S('Emulation.setTouchEmulationEnabled', { enabled: true })
await S('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {})
const ev = async (expr, ap = true) => {
  const r = await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: ap, userGesture: true })
  return r.exceptionDetails ? 'ИСКЛЮЧЕНИЕ: ' + (r.exceptionDetails.exception?.description || '').split('\n')[0] : r.result.value
}
const shot = async (n) => { const png = await S('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, n + '.png'), Buffer.from(png.data, 'base64')) }
const click = (sel) => ev(`(function(){const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 'нет '+${JSON.stringify(sel)};e.click();return 'ок'})()`, false)

console.log('══ ЗАГРУЗКА ══')
await S('Page.navigate', { url: BASE })
await sleep(6000)
console.log('  заголовок:', await ev('document.title', false))
console.log('  вьюпорт:', await ev('innerWidth + "x" + innerHeight', false))
console.log('  манифест:', await ev(`(function(){const l=document.querySelector('link[rel=manifest]');return l?l.getAttribute('href'):'нет'})()`, false))
console.log('  service worker:', await ev(`navigator.serviceWorker.controller ? 'активен' : 'ещё не управляет'`, false))
await shot('01-today')

console.log('\n══ ЭКРАН «СЕГОДНЯ» ══')
console.log('  ', await ev(`(function(){
  const t=document.body.innerText;
  return JSON.stringify({
    серия: /подряд/.test(t),
    цель: /Цель на сегодня/.test(t),
    задания: (t.match(/Задание|Повторить|Пройти|Ответить|Позаниматься/g)||[]).length,
    кнопка: !!document.querySelector('#start')
  })})()`, false))

console.log('\n══ ЗАНЯТИЕ КАРТОЧКАМИ ══')
await click('#start'); await sleep(1500)
console.log('  открылось:', await ev(`(function(){
  const q=document.querySelector('.flip__q');
  return q ? 'вопрос: ' + q.textContent.slice(0,60) : 'карточки нет';
})()`, false))
await shot('02-card')

await click('#reveal'); await sleep(900)
console.log('  ответ:', await ev(`(function(){
  const a=document.querySelector('.flip__a');
  const h=document.querySelector('.flip__hint');
  return a ? a.textContent + ' | подсказка: ' + (h?h.textContent.slice(0,40):'—') : 'ответ не показан';
})()`, false))
console.log('  кнопок оценки:', await ev(`document.querySelectorAll('[data-q]').length`, false))
await shot('03-answer')

/* отвечаем 14 раз «хорошо», чтобы набрать прогресс */
console.log('\n  отвечаю 14 карточек…')
for (let i = 0; i < 16; i++) {
  const hasRate = await ev(`!!document.querySelector('[data-q="4"]')`, false)
  if (!hasRate) { await click('#reveal'); await sleep(400) }
  const r = await ev(`(function(){const b=document.querySelector('[data-q="4"]');if(!b)return 'нет';b.click();return 'ок'})()`, false)
  if (r !== 'ок') break
  await sleep(500)
  const done = await ev(`!!document.querySelector('#done')`, false)
  if (done === true) break
  const rev = await ev(`!!document.querySelector('#reveal')`, false)
  if (rev) await click('#reveal')
  await sleep(300)
}
console.log('  экран итога:', await ev(`(function(){
  const d=document.querySelector('.done');
  return d ? d.innerText.replace(/\\n+/g,' | ').slice(0,120) : 'занятие не завершено';
})()`, false))
await shot('04-done')
await click('#done'); await sleep(1200)

console.log('\n══ ПРОГРЕСС ══')
console.log('  ', await ev(`(function(){
  const raw=localStorage.getItem('skillup.v1');
  if(!raw) return 'нет данных';
  const s=JSON.parse(raw);
  return JSON.stringify({
    ответов: s.stats.totalAnswers, верных: s.stats.correct,
    опыт: s.xp, серия: s.streak, карточек_в_колоде: Object.keys(s.cards).length,
    достижений: Object.keys(s.achievements).length,
    уроков: s.stats.lessonsDone
  })})()`, false))
await shot('05-today-after')

console.log('\n══ ЭКРАНЫ ══')
for (const [name, tab] of [['skills', 'Навыки'], ['stats', 'Статистика'], ['awards', 'Награды']]) {
  await click(`.nav__b[data-tab="${name}"]`); await sleep(1400)
  const info = await ev(`(function(){
    const t=document.body.innerText.replace(/\\s+/g,' ');
    return t.slice(0,110);
  })()`, false)
  console.log(`  ${tab}: ${info}`)
  await shot('06-' + name)
}

console.log('\n══ ОФЛАЙН ══')
await S('Network.enable')
await S('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
await S('Page.reload', { ignoreCache: false })
await sleep(5000)
console.log('  после перезагрузки без сети:', await ev(`(function(){
  const has=!!document.querySelector('.nav__b');
  const raw=localStorage.getItem('skillup.v1');
  return has ? 'приложение открылось, прогресс на месте: ' + (raw?JSON.parse(raw).stats.totalAnswers+' ответов':'нет') : 'пусто';
})()`, false))
await shot('07-offline')
await S('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })

console.log('\nошибки консоли:', errors.length ? [...new Set(errors)].slice(0, 4).join('\n  ') : 'нет')
edge.kill()
process.exit(0)
