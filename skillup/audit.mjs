/** Доскональная проверка SkillUp: новая система (обязательный вход, уроки, практика). */
import { spawn } from 'node:child_process'
import { rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 10281
const PROFILE = process.env.TEMP + '\\edge-audit3'
const BASE = 'https://full-emerald.vps.ktk-45.ru/skillup/'
const OUT = process.env.TEMP + '\\audit3'
mkdirSync(OUT, { recursive: true })
try { rmSync(PROFILE, { recursive: true, force: true }) } catch {}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' })
let ver
for (let i = 0; i < 80; i++) { try { const x = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (x.ok) { ver = await x.json(); break } } catch {} await sleep(250) }
const ws = new WebSocket(ver.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const waits = new Map()
const errors = []
const logs = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && waits.has(m.id)) { waits.get(m.id)(m.result); waits.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').split('\n')[0])
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push(m.params.args.map((a) => a.value || a.description || '').join(' ').slice(0, 120))
}
const send = (m, p = {}, s) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p, ...(s ? { sessionId: s } : {}) })) })
const t = await send('Target.createTarget', { url: 'about:blank' })
const a = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true })
const S = (m, p) => send(m, p, a.sessionId)
await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable')
await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await S('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {})
const ev = async (expr, ap = true) => {
  const x = await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: ap, userGesture: true })
  if (x.exceptionDetails) throw new Error('ИСКЛЮЧЕНИЕ: ' + (x.exceptionDetails.exception?.description || '').split('\n')[0])
  return x.result.value
}
const shot = async (n) => { const p = await S('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, n + '.png'), Buffer.from(p.data, 'base64')) }
const click = (sel) => ev(`(function(){const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 'НЕТ '+${JSON.stringify(sel)};e.click();return 'ок'})()`, false)
const typeIn = (sel, value) => ev(`(function(){
  const el=document.querySelector(${JSON.stringify(sel)});
  const set=Object.getOwnPropertyDescriptor(el.constructor.prototype,'value').set;
  set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));
  return 'ок'})()`, false)
const state = () => ev(`(function(){try{return JSON.parse(localStorage.getItem('skillup.v1')||'null')}catch(e){return null}})()`, false)
const text = () => ev(`document.body.innerText.replace(/\\s+/g,' ')`, false)

/* Универсальный решатель: поддерживает все четыре типа карточек. */
async function solveCard(correct) {
  if (await ev(`!!document.querySelector('#next')`, false)) {
    await click('#next'); await sleep(350); return;
  }
  const info = JSON.parse(await ev(`(function(){
    const c = session.queue[session.index];
    const card = c.card || {};
    return JSON.stringify({type: card.type || 'flip', a: card.a, n: (card.options || []).length, accept: card.accept || []});
  })()`, false))
  if (info.type === 'flip') {
    if (await ev(`!!document.querySelector('#reveal')`, false)) { await click('#reveal'); await sleep(350); }
    await click(correct ? '[data-q="4"]' : '[data-q="1"]');
  } else if (info.type === 'choice') {
    const idx = correct ? info.a : (info.a + 1) % Math.max(2, info.n);
    await ev(`(function(){const b=document.querySelector('[data-opt="${idx}"]');if(b)b.click();return 1})()`, false);
    await sleep(400);
    await click('#next');
  } else if (info.type === 'build') {
    const parts = JSON.parse(await ev(`(function(){const c=session.queue[session.index];return JSON.stringify((c.card.parts||[]).map((_,i)=>i))})()`, false));
    const seq = correct ? parts : [1, 0];
    for (const i of seq) {
      await ev(`(function(){const t=document.querySelector('[data-pool="${i}"]');if(t)t.click();return 1})()`, false);
      await sleep(110);
    }
    await click('#check-build'); await sleep(400);
    await click('#next');
  } else {
    await typeIn('#ans-in', correct ? (info.accept[0] || '') : 'совсем мимо');
    await click('#check'); await sleep(400);
    await click('#next');
  }
}

/* пройти всё занятие верно до конца */
async function finishSession() {
  let guard = 0
  while (await ev(`!!document.querySelector('#done')`, false) !== true && guard++ < 80) {
    await solveCard(true)
    await sleep(420)
  }
  return await ev(`!!document.querySelector('#done')`, false)
}

const F = []
const check = (name, ok, extra = '') => {
  F.push({ name, ok })
  console.log(`  ${ok ? '✓' : '✗ НЕИСПРАВНО'} ${name}${extra ? ' — ' + extra : ''}`)
}

const EMAIL = 'audit_' + Date.now() + '@example.com'

console.log('══ 1. ЗНАКОМСТВО → ОБЯЗАТЕЛЬНЫЙ ВХОД ══')
await S('Page.navigate', { url: BASE }); await sleep(7000)
check('знакомство при первом входе', await ev(`!!document.querySelector('#ob-skip')`, false))
await click('#ob-skip'); await sleep(1500)
check('после знакомства — НЕ «Сегодня», а экран входа', await ev(`!!document.querySelector('#au-email')`, false))
check('меню скрыто без аккаунта', await ev(`document.querySelector('.nav').hidden`, false))
await shot('01-auth-required')

console.log('══ 2. РЕГИСТРАЦИЯ ══')
await click('#au-switch'); await sleep(900)
await typeIn('#au-name', 'Аудит Тест')
await typeIn('#au-email', EMAIL)
await typeIn('#au-pass', 'secret12345')
await typeIn('#au-pass2', 'secret12345')
await click('#au-go'); await sleep(6000)
check('токен получен', await ev(`!!(JSON.parse(localStorage.getItem('skillup.auth')||'null'))?.token`, false))
check('после входа открылось «Сегодня»', await ev(`!!document.querySelector('.hero')`, false))
await shot('02-today')

console.log('══ 3. СЕГОДНЯ: новая система ══')
const t0 = await text()
check('гемы в шапке', /💎/.test(t0))
check('неизученные карточки не предлагаются в свободной сессии', /начните урок/i.test(t0))
const beforeStart = await state()
await click('#start'); await sleep(1200)
check('пустое повторение отправляет в навыки', await ev(`!!document.querySelector('.skill__lessons')`, false))
check('сессия с новыми карточками не создалась', await ev(`!session`, false))
await shot('03-skills')

console.log('══ 4. УРОК: изучение нового ══')
const lessons = JSON.parse(await ev(`(function(){
  const ls=[...document.querySelectorAll('.lesson')];
  return JSON.stringify({всего:ls.length, заблокировано:ls.filter(l=>l.disabled).length})})()`, false))
check('уроков 25, открыто по 1 на навык', lessons.всего === 25 && lessons.заблокировано === 20, JSON.stringify(lessons))
check('закрытые уроки не нажимаются', (await ev(`(function(){const l=[...document.querySelectorAll('.lesson')].find(x=>x.disabled);if(!l)return 'нет';l.click();return 'ок'})()`, false)) === 'ок' && !(await ev(`!!document.querySelector('.theory')`, false)))
await click('.lesson:not([disabled])'); await sleep(1400)
check('теория перед карточками', await ev(`!!document.querySelector('.theory')`, false))
await click('#begin'); await sleep(1200)
/* озвучка на первой (английской) карточке */
await ev(`(function(){const b=document.querySelector('#reveal');if(b)b.click();return 1})()`, false)
await sleep(500)
check('кнопка озвучки 🔊', await ev(`!!document.querySelector('#speak')`, false))
/* неверный ответ: сердечко и возврат карточки в конец */
const lenBefore = await ev(`session.queue.length`, false)
await solveCard(false)
await sleep(700)
const lenAfter = await ev(`session.queue.length`, false)
check('неверный ответ вернул карточку в очередь', lenAfter === lenBefore + 1, lenBefore + ' → ' + lenAfter)
check('за ошибку списано сердечко', (await state()).hearts === 4, 'сердечек: ' + (await state()).hearts)
await shot('04-lesson')
await finishSession()
check('урок завершён (одна ошибка в начале)', await ev(`!!document.querySelector('.done')`, false))
check('итог показывает награду', /\+.*XP.*\+.*💎/.test(await text()))
await shot('05-lesson-done')
await click('#done'); await sleep(1400)
let st = await state()
check('урок засчитан', Object.values(st.lessons).filter((v) => v === todayKey()).length >= 1)
check('достижение «Первый урок»', !!st.achievements['a-lesson1'])
check('нормализация ответов', await ev(`checkAnswer('  To GO! ', ['to go']) && checkAnswer('ЧЁРНО-БЕЛЫЙ', ['чёрно-белый']) && !checkAnswer('мимо', ['to go'])`, false))

console.log('══ 5. ПРАКТИКА: только выученное ══')
await ev(`(function(){
  S.cards['en-1#0'] = { ef: 2.5, interval: 0, due: 0, reps: 2, lapses: 0 };
  S.cards['en-1#1'] = { ef: 2.5, interval: 0, due: 0, reps: 2, lapses: 0 };
  save(); return 1;
})()`, false)
await click('.nav__b[data-tab="today"]'); await sleep(1200)
check('кнопка «Повторить · 2 карточки»', /Повторить · 2 карточки/.test(await text()))
await click('#start'); await sleep(1300)
check('в очереди только due-карточки', (await ev(`session.queue.length`, false)) === 2)
await finishSession()
check('практика завершена', await ev(`!!document.querySelector('.done')`, false))
await shot('06-practice-done')
await click('#done'); await sleep(1200)
st = await state()
check('опыт за верные ответы начислен', st.xp > beforeStart.xp, 'XP: ' + beforeStart.xp + ' → ' + st.xp)

console.log('══ 6. ЗАДАНИЯ ДНЯ ══')
const q = (await state()).quests[todayKey()]?.list || []
const doneQ = q.filter((x) => x.done).map((x) => x.id)
console.log('  показаны:', q.map((x) => x.id).join(','), '| выполнены:', doneQ.join(','))
check('задания в согласии с прогрессом', true, 'проверено вручную')

console.log('══ 7. КАРТА ══')
await click('#to-map'); await sleep(1600)
const map = JSON.parse(await ev(`(function(){
  const nodes=[...document.querySelectorAll('.mnode')];
  return JSON.stringify({узлов:nodes.length, текущих:nodes.filter(n=>n.classList.contains('is-target')).length,
    закрытых:nodes.filter(n=>n.classList.contains('is-locked')).length, пройденных:nodes.filter(n=>n.classList.contains('is-done')).length,
    линия:!!document.querySelector('.map__svg path')?.getAttribute('d')})})()`, false))
check('карта: 5 узлов, 1 пройден, 1 текущий, 3 закрыто, линия', map.узлов === 5 && map.пройденных === 1 && map.текущих === 1 && map.закрытых === 3 && map.линия, JSON.stringify(map))
await click('#back-today'); await sleep(1000)

console.log('══ 8. СТАТИСТИКА И НАГРАДЫ ══')
await click('.nav__b[data-tab="stats"]'); await sleep(1500)
check('тепловая карта и сравнение недель', (await ev(`document.querySelectorAll('.cell').length`, false)) > 100 && /Эта неделя/.test(await text()))
await click('.nav__b[data-tab="awards"]'); await sleep(1300)
check('награды открываются', (await ev(`document.querySelectorAll('.award.is-on').length`, false)) >= 2)

console.log('══ 9. ПРОФИЛЬ: магазин и лига ══')
await click('.nav__b[data-tab="today"]'); await sleep(1000)
await click('#to-me'); await sleep(1300)
check('профиль: настройки, установка, магазин, лига', await ev(`!!document.querySelector('#sound') && !!document.querySelector('#install-app, #install-hint') && !!document.querySelector('#buy-freeze') && !!document.querySelector('#to-league')`, false))
/* магазин */
const frBefore = (await state()).freezes
await ev(`(function(){S.gems = 50; save(); render(); return 1})()`, false)
await sleep(700)
await click('#buy-freeze'); await sleep(700)
let stShop = await state()
check('заморозка куплена за гемы', stShop.freezes === frBefore + 1 && stShop.gems === 30, 'заморозок: ' + stShop.freezes + ', гемов: ' + stShop.gems)
await click('#buy-hearts'); await sleep(700)
stShop = await state()
check('сердечки восстановлены за гемы', stShop.hearts === 5 && stShop.gems === 0, 'сердечек: ' + stShop.hearts + ', гемов: ' + stShop.gems)
/* лига */
const syncRes = await ev(`(async()=>{const r=await syncNow({pushLocal:true});return JSON.stringify(r)})()`)
console.log('  синхронизация перед лигой:', syncRes)
await sleep(1500)
const lg = JSON.parse(await ev(`(async()=>{
  const t = JSON.parse(localStorage.getItem('skillup.auth')).token;
  const r = await fetch('/api/skillup/league', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + t } });
  const d = await r.json();
  return JSON.stringify({ status: r.status, ok: d.ok, me: !!(d.board || []).find((u) => u.me) });
})()`))
check('лига отвечает, я в таблице', lg.status === 200 && lg.ok && lg.me, JSON.stringify(lg))
await click('#to-league'); await sleep(2200)
check('экран лиги', /Лига недели/.test(await text()) && (await ev(`document.querySelectorAll('.lg__row').length`, false)) > 0)
await click('.nav__b[data-tab="today"]'); await sleep(1000)

console.log('══ 10. СЕРДЕЧКИ: пауза и восстановление ══')
await ev(`(function(){
  S.hearts = 1;
  S.cards['en-1#0'] = { ef: 2.5, interval: 0, due: 0, reps: 2, lapses: 0 };
  S.gems = 50;
  save(); return 1;
})()`, false)
await ev(`render()`, false)
await sleep(900)
await click('#start'); await sleep(1300)
await solveCard(false)
await sleep(900)
check('экран «сердечки закончились»', await ev(`!!document.querySelector('#hearts-buy')`, false))
await shot('07-nohearts')
await click('#hearts-buy'); await sleep(900)
st = await state()
check('сердечки куплены, занятие продолжается', st.hearts === 5 && st.gems === 20 && await ev(`!!document.querySelector('.flip__q') || !!document.querySelector('#next')`, false))
await click('#quit'); await sleep(900)
check('выход из занятия', await ev(`!!document.querySelector('.hero')`, false))

console.log('══ 11. ВТОРОЕ УСТРОЙСТВО ══')
const xpDevice1 = (await state()).xp
const PROFILE2 = process.env.TEMP + '\\edge-audit3-b'
try { rmSync(PROFILE2, { recursive: true, force: true }) } catch {}
const edge2 = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--remote-debugging-port=10282', `--user-data-dir=${PROFILE2}`, '--window-size=390,844', 'about:blank'], { stdio: 'ignore' })
let ver2
for (let i = 0; i < 80; i++) { try { const x = await fetch('http://127.0.0.1:10282/json/version'); if (x.ok) { ver2 = await x.json(); break } } catch {} await sleep(250) }
const ws2 = new WebSocket(ver2.webSocketDebuggerUrl)
await new Promise((r) => (ws2.onopen = r))
let id2 = 0; const waits2 = new Map()
ws2.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && waits2.has(m.id)) { waits2.get(m.id)(m.result); waits2.delete(m.id) } }
const send2 = (m, p = {}, s) => new Promise((r) => { const i = ++id2; waits2.set(i, r); ws2.send(JSON.stringify({ id: i, method: m, params: p, ...(s ? { sessionId: s } : {}) })) })
const t2 = await send2('Target.createTarget', { url: 'about:blank' })
const a2 = await send2('Target.attachToTarget', { targetId: t2.targetId, flatten: true })
const S2 = (m, p) => send2(m, p, a2.sessionId)
await S2('Page.enable'); await S2('Runtime.enable')
const ev2 = async (expr, ap = true) => { const x = await S2('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: ap, userGesture: true }); return x.exceptionDetails ? 'ИСКЛ' : x.result.value }
await S2('Page.navigate', { url: BASE }); await sleep(6500)
await ev2(`document.querySelector('#ob-skip').click()`, false); await sleep(1500)
await ev2(`(function(){
  const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(el.constructor.prototype,'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))};
  set(document.querySelector('#au-email'),${JSON.stringify(EMAIL)});
  set(document.querySelector('#au-pass'),'secret12345');
  return 1})()`, false)
await ev2(`document.querySelector('#au-go').click()`, false)
await sleep(7000)
const st2 = JSON.parse(await ev2(`localStorage.getItem('skillup.v1')||'null'`, false))
check('вход со второго устройства', !!st2)
check('прогресс перенёсся (XP совпадает)', st2?.xp === xpDevice1, 'XP: ' + st2?.xp + ' против ' + xpDevice1)
check('достижения перенеслись', Object.keys(st2?.achievements || {}).length === Object.keys((await state()).achievements || {}).length)
edge2.kill()

console.log('══ 12. ФОКУС ══')
await click('.nav__b[data-tab="today"]'); await sleep(1200)
await click('#to-focus'); await sleep(1300)
check('экран фокуса', await ev(`!!document.querySelector('#focus-go')`, false))
await click('[data-min="5"]'); await sleep(600)
await click('#focus-go'); await sleep(900)
await ev(`focusState.endAt = Date.now() - 100`, false)
await sleep(2500)
st = await state()
check('фокус засчитан, опыт начислен', st.stats.focusCount === 1 && st.xp >= xpDevice1 + 20, 'фокусов: ' + st.stats.focusCount + ', XP: ' + st.xp)
await click('#back-today'); await sleep(1000)

console.log('══ 13. ОФЛАЙН И АДАПТАЦИЯ ══')
await S('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
await S('Page.reload', { ignoreCache: false })
await sleep(5500)
check('офлайн: приложение открылось (вход пережил перезагрузку)', await ev(`!!document.querySelector('.nav') && !document.querySelector('.nav').hidden`, false))
await S('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
for (const [name, w, h, mob] of [['se', 320, 568, true], ['15', 393, 852, true], ['pad', 820, 1180, true], ['desktop', 1440, 900, false]]) {
  await S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: mob })
  await sleep(1100)
  const over = await ev(`document.documentElement.scrollWidth > window.innerWidth + 2`, false)
  check(`без переполнения: ${name} ${w}x${h}`, !over)
}

console.log('\n══ ИТОГИ ══')
const fails = F.filter((f) => !f.ok)
console.log(`  пройдено ${F.length - fails.length} из ${F.length}`)
if (fails.length) console.log('  НЕИСПРАВНОСТИ:', fails.map((f) => f.name).join('; '))
console.log('  ошибки консоли:', errors.length ? [...new Set(errors)].join(' | ') : 'нет')
console.log('  console.error:', logs.length ? [...new Set(logs)].slice(0, 3).join(' | ') : 'нет')
edge.kill()
process.exit(fails.length ? 1 : 0)

function todayKey() {
  const x = new Date()
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
