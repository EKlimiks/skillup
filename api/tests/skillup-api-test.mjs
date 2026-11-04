/**
 * Сквозная проверка авторизации и синхронизации прогресса SkillUp.
 * Всё делается по-настоящему: регистрация, вход, запись, чтение, объединение,
 * удаление аккаунта. Ничего не подделывается.
 */

const BASE = (process.argv[2] || 'https://full-emerald.vps.ktk-45.ru') + '/api'
const EMAIL = `skillup.test.${Date.now()}@example.com`
const PASS = 'TestPass123'
const NAME = 'Тест Тестов'

let pass = 0
let fail = 0
const problems = []

function check(name, ok, detail) {
  if (ok) { pass++; console.log(`  ✅ ${name}`) }
  else { fail++; problems.push(name); console.log(`  ❌ ${name}${detail ? ' → ' + detail : ''}`) }
}

async function call(method, path, { token, body } = {}) {
  const headers = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = 'Bearer ' + token

  /* На auth-маршрутах стоит throttle:10,1 — лимит общий для регистрации и
     входа. Тест делает больше десяти таких запросов, поэтому на 429 ждём
     и повторяем: иначе проверка падает не из-за кода, а из-за лимита. */
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(BASE + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status !== 429) {
      let json = null
      try { json = await res.json() } catch { /* тело может быть пустым */ }
      return { status: res.status, json }
    }
    if (attempt < 3) {
      process.stdout.write('    (лимит запросов, жду 25 с…)\n')
      await new Promise((r) => setTimeout(r, 25000))
    }
  }
  return { status: 429, json: null }
}

/* ─────────── прогресс, похожий на настоящий ─────────── */

const progressA = {
  version: 1, xp: 640, streak: 4, bestStreak: 9, lastActive: '2026-10-14', freezes: 2,
  cards: {
    'en-1#0': { ef: 2.5, interval: 6, due: 1790000000000, reps: 2, lapses: 0 },
    'en-1#1': { ef: 2.36, interval: 1, due: 1789000000000, reps: 1, lapses: 1 },
  },
  lessons: { 'en-1': '2026-10-12' },
  days: { '2026-10-12': 14, '2026-10-13': 8, '2026-10-14': 5 },
  quests: { '2026-10-14': { list: [{ id: 'q-cards', done: true, progress: 12, need: 12 }] } },
  combo: 3, bestCombo: 11,
  achievements: { 'a-first': 1789000000000, 'a-ten': 1789100000000 },
  settings: { goal: 30, reminder: true, reminderTime: '20:30' },
  stats: { totalAnswers: 82, correct: 74, wrong: 8, lessonsDone: 1, perfectLessons: 0, questsDone: 2, mastered: 0 },
  skillsTouched: ['english'],
  /* это поле сервер хранить не должен — проверяем, что он его отбросит */
  somethingWeird: { injected: 'мусор' },
}

/* Второй набор — как будто занимались с другого устройства */
const progressB = {
  version: 1, xp: 910, streak: 7, bestStreak: 7, lastActive: '2026-10-16', freezes: 1,
  cards: {
    'en-1#0': { ef: 2.6, interval: 15, due: 1795000000000, reps: 3, lapses: 0 },
    'js-1#0': { ef: 2.5, interval: 1, due: 1791000000000, reps: 1, lapses: 0 },
  },
  lessons: { 'js-1': '2026-10-16' },
  days: { '2026-10-15': 20, '2026-10-16': 12 },
  quests: {},
  combo: 9, bestCombo: 9,
  achievements: { 'a-ten': 1789050000000, 'a-hundred': 1790000000000 },
  settings: { goal: 20, reminder: false, reminderTime: '19:00' },
  stats: { totalAnswers: 150, correct: 140, wrong: 10, lessonsDone: 3, perfectLessons: 1, questsDone: 4, mastered: 1 },
  skillsTouched: ['code'],
}

const run = async () => {
  console.log('══════ 1. РЕГИСТРАЦИЯ ══════')
  const reg = await call('POST', '/auth/register', {
    body: { name: NAME, email: EMAIL, password: PASS, password_confirmation: PASS, phone: '+79990001122' },
  })
  check('регистрация → 201', reg.status === 201, `получено ${reg.status}`)
  check('вернулся токен', typeof reg.json?.token === 'string' && reg.json.token.length > 20)
  check('вернулся пользователь', reg.json?.user?.email === EMAIL)
  check('пароль не утёк', !JSON.stringify(reg.json ?? {}).includes(PASS))
  const token = reg.json?.token
  if (!token) { console.log('\nдальше идти нельзя — нет токена'); return }

  console.log('\n══════ 2. ОШИБКИ РЕГИСТРАЦИИ ══════')
  const dup = await call('POST', '/auth/register', {
    body: { name: NAME, email: EMAIL, password: PASS, password_confirmation: PASS },
  })
  check('занятый e-mail → 422', dup.status === 422, `получено ${dup.status}`)
  check('понятный текст про занятый e-mail',
    /уже зарегистрирован/i.test(JSON.stringify(dup.json?.errors?.email ?? [])),
    JSON.stringify(dup.json?.errors))

  const weak = await call('POST', '/auth/register', {
    body: { name: NAME, email: `weak.${Date.now()}@example.com`, password: '123', password_confirmation: '123' },
  })
  check('слабый пароль → 422', weak.status === 422, `получено ${weak.status}`)
  check('текст про длину пароля',
    /минимум 6/i.test(JSON.stringify(weak.json?.errors ?? {})), JSON.stringify(weak.json?.errors))

  const mismatch = await call('POST', '/auth/register', {
    body: { name: NAME, email: `mm.${Date.now()}@example.com`, password: PASS, password_confirmation: 'Другой123' },
  })
  check('пароли не совпали → 422', mismatch.status === 422, `получено ${mismatch.status}`)
  check('текст про несовпадение',
    /не совпадают/i.test(JSON.stringify(mismatch.json?.errors ?? {})), JSON.stringify(mismatch.json?.errors))

  console.log('\n══════ 3. ВХОД ══════')
  const login = await call('POST', '/auth/login', { body: { email: EMAIL, password: PASS } })
  check('вход → 200', login.status === 200, `получено ${login.status}`)
  check('вернулся токен входа', typeof login.json?.token === 'string')
  const token2 = login.json?.token

  const badLogin = await call('POST', '/auth/login', { body: { email: EMAIL, password: 'НеверныйПароль' } })
  check('неверный пароль → 422', badLogin.status === 422, `получено ${badLogin.status}`)

  console.log('\n══════ 4. БЕЗ ТОКЕНА → 401 ══════')
  for (const [m, p] of [
    ['GET', '/skillup/progress'],
    ['PUT', '/skillup/progress'],
    ['POST', '/skillup/merge'],
    ['DELETE', '/skillup/account'],
  ]) {
    const r = await call(m, p, { body: m === 'GET' || m === 'DELETE' ? undefined : { progress: {} } })
    check(`${m} ${p} без токена → 401`, r.status === 401, `получено ${r.status}`)
  }
  /* заголовок может содержать только латиницу — кириллица тут недопустима */
  const bad = await call('GET', '/skillup/progress', { token: 'garbage-token-123' })
  check('мусорный токен → 401', bad.status === 401, `получено ${bad.status}`)

  console.log('\n══════ 5. ПРОГРЕССА ЕЩЁ НЕТ ══════')
  const empty = await call('GET', '/skillup/progress', { token })
  check('GET → 200', empty.status === 200, `получено ${empty.status}`)
  check('progress = null', empty.json?.progress === null, JSON.stringify(empty.json?.progress))
  check('revision = 0', empty.json?.revision === 0)
  check('есть server_time', typeof empty.json?.server_time === 'string')

  console.log('\n══════ 6. СОХРАНЕНИЕ ══════')
  const put1 = await call('PUT', '/skillup/progress', {
    token, body: { progress: progressA, client_updated_at: '2026-10-14T18:00:00+05:00' },
  })
  check('PUT → 200', put1.status === 200, `получено ${put1.status} ${JSON.stringify(put1.json)?.slice(0, 200)}`)
  check('revision = 1', put1.json?.revision === 1, String(put1.json?.revision))
  check('created = true', put1.json?.created === true)
  check('конфликта нет', put1.json?.conflict === false)
  check('xp сохранился', put1.json?.progress?.xp === 640, String(put1.json?.progress?.xp))
  check('карточек 2', Object.keys(put1.json?.progress?.cards ?? {}).length === 2)
  check('лишнее поле отброшено', put1.json?.progress?.somethingWeird === undefined)
  check('настройки сохранились', put1.json?.progress?.settings?.goal === 30)
  check('achievements на месте', Object.keys(put1.json?.progress?.achievements ?? {}).length === 2)

  console.log('\n══════ 7. ЧТЕНИЕ ОБРАТНО ══════')
  const get1 = await call('GET', '/skillup/progress', { token: token2 })
  check('GET → 200 (другим токеном)', get1.status === 200)
  check('xp совпадает', get1.json?.progress?.xp === 640, String(get1.json?.progress?.xp))
  check('серия совпадает', get1.json?.progress?.streak === 4)
  check('карточка en-1#0 совпадает',
    get1.json?.progress?.cards?.['en-1#0']?.interval === 6,
    JSON.stringify(get1.json?.progress?.cards?.['en-1#0']))
  check('достижения совпадают', Object.keys(get1.json?.progress?.achievements ?? {}).length === 2)
  check('дни совпадают', Object.keys(get1.json?.progress?.days ?? {}).length === 3)
  check('revision = 1', get1.json?.revision === 1)

  console.log('\n══════ 8. КОНФЛИКТ ПРИ ПЕРЕЗАПИСИ ══════')
  /* пишем более старую по времени правку — сервер должен сказать про конфликт */
  const old = JSON.parse(JSON.stringify(progressA))
  old.xp = 100
  const putOld = await call('PUT', '/skillup/progress', {
    token, body: { progress: old, client_updated_at: '2026-10-10T10:00:00+05:00' },
  })
  check('PUT со старой правкой → 200', putOld.status === 200)
  check('conflict = true', putOld.json?.conflict === true, String(putOld.json?.conflict))
  check('есть подсказка про объединение', typeof putOld.json?.conflict_hint === 'string' && putOld.json.conflict_hint.length > 20)
  check('revision вырос до 2', putOld.json?.revision === 2, String(putOld.json?.revision))

  console.log('\n══════ 9. ОБЪЕДИНЕНИЕ ══════')
  /* на сервере сейчас лежит progressA (с xp 100), устройство приносит progressB */
  const merge = await call('POST', '/skillup/merge', {
    token, body: { progress: progressB, client_updated_at: '2026-10-16T12:00:00+05:00' },
  })
  check('merge → 200', merge.status === 200, `получено ${merge.status} ${JSON.stringify(merge.json)?.slice(0, 200)}`)
  const m = merge.json?.progress
  check('опыт взят максимумом (910)', m?.xp === 910, String(m?.xp))
  check('рекорд серии — максимум (9)', m?.bestStreak === 9, String(m?.bestStreak))
  check('серия с более свежего устройства (7)', m?.streak === 7, String(m?.streak))
  check('lastActive — более поздняя дата', m?.lastActive === '2026-10-16', String(m?.lastActive))
  check('счётчик ответов — максимум (150)', m?.stats?.totalAnswers === 150, String(m?.stats?.totalAnswers))
  check('уроков пройдено — максимум (3)', m?.stats?.lessonsDone === 3, String(m?.stats?.lessonsDone))

  const cards = Object.keys(m?.cards ?? {})
  check('карточки объединены (3 штуки)', cards.length === 3, cards.join(','))
  check('карточка en-1#0 взята более выученная (интервал 15)',
    m?.cards?.['en-1#0']?.interval === 15, JSON.stringify(m?.cards?.['en-1#0']))
  check('карточка из второго устройства добавлена', !!m?.cards?.['js-1#0'])

  const ach = Object.keys(m?.achievements ?? {})
  check('достижения объединены (3 штуки)', ach.length === 3, ach.join(','))
  check('общее достижение a-ten сохранено', !!m?.achievements?.['a-ten'])

  check('уроки объединены', Object.keys(m?.lessons ?? {}).length === 2, JSON.stringify(Object.keys(m?.lessons ?? {})))
  check('навыки объединены', (m?.skillsTouched ?? []).length === 2, JSON.stringify(m?.skillsTouched))
  check('дни объединены (5 дней)', Object.keys(m?.days ?? {}).length === 5, JSON.stringify(Object.keys(m?.days ?? {})))
  check('день 2026-10-14 сохранён', m?.days?.['2026-10-14'] === 5)

  console.log('  сводка объединения:', JSON.stringify(merge.json?.merged))

  console.log('\n══════ 10. ОБЪЕДИНЕНИЕ БЕЗ СЕРВЕРНОГО ПРОГРЕССА ══════')
  /* свежий пользователь: сервер пуст, объединение должно просто вернуть локальный */
  const email2 = `skillup.empty.${Date.now()}@example.com`
  const reg2 = await call('POST', '/auth/register', {
    body: { name: 'Пустой Тест', email: email2, password: PASS, password_confirmation: PASS },
  })
  check('второй пользователь создан', reg2.status === 201, `получено ${reg2.status}`)
  const t2 = reg2.json?.token
  const mergeEmpty = await call('POST', '/skillup/merge', { token: t2, body: { progress: progressB } })
  check('merge на пустом сервере → 200', mergeEmpty.status === 200)
  check('прогресс вернулся целиком', mergeEmpty.json?.progress?.xp === 910)
  check('had_server_progress = false', mergeEmpty.json?.merged?.had_server_progress === false)

  console.log('\n══════ 11. ИЗОЛЯЦИЯ ПОЛЬЗОВАТЕЛЕЙ ══════')
  /* второй пользователь пишет свой прогресс и не должен увидеть чужой */
  const ownProgress = {
    version: 1, xp: 5, streak: 1, bestStreak: 1, lastActive: '2026-10-16', freezes: 2,
    cards: {}, lessons: {}, days: {}, quests: {}, combo: 0, bestCombo: 0,
    achievements: {}, settings: { goal: 5, reminder: false, reminderTime: '09:00' },
    stats: { totalAnswers: 1, correct: 1, wrong: 0, lessonsDone: 0, perfectLessons: 0, questsDone: 0, mastered: 0 },
    skillsTouched: [],
  }
  const putOwn = await call('PUT', '/skillup/progress', { token: t2, body: { progress: ownProgress } })
  check('второй пользователь сохранил свой прогресс', putOwn.status === 200, `получено ${putOwn.status}`)

  const second = await call('GET', '/skillup/progress', { token: t2 })
  check('второй видит только свой прогресс (xp=5)', second.json?.progress?.xp === 5, String(second.json?.progress?.xp))

  const first = await call('GET', '/skillup/progress', { token })
  check('первый сохранил свой прогресс (xp=910)', first.json?.progress?.xp === 910, String(first.json?.progress?.xp))
  check('прогрессы не пересеклись', second.json?.progress?.xp !== first.json?.progress?.xp)

  console.log('\n══════ 12. ОШИБКИ ВАЛИДАЦИИ ══════')
  const noProgress = await call('PUT', '/skillup/progress', { token })
  check('PUT без progress → 422', noProgress.status === 422, `получено ${noProgress.status}`)
  const wrongType = await call('PUT', '/skillup/progress', { token, body: { progress: 'строка' } })
  check('PUT со строкой вместо объекта → 422', wrongType.status === 422, `получено ${wrongType.status}`)
  const asList = await call('PUT', '/skillup/progress', { token, body: { progress: [1, 2, 3] } })
  check('PUT со списком вместо объекта → 422', asList.status === 422, `получено ${asList.status}`)

  /* Слишком большой прогресс. Размер подбираем так, чтобы упереться именно
     в наш предохранитель (512 КБ), а не во внешний прокси хостинга: он
     рубит тела больше ~1 МБ и отдаёт свою страницу 413 ещё до Laravel.
     9000 карточек с настоящими метками времени ≈ 650 КБ — заведомо выше
     предела и с запасом ниже порога прокси. */
  const huge = { version: 1, xp: 1, cards: {} }
  for (let i = 0; i < 9000; i++) {
    huge.cards['card' + i] = { ef: 2.5, interval: 3, due: 1790000000000 + i, reps: 1, lapses: 0 }
  }
  const sizeKb = Math.round(JSON.stringify(huge).length / 1024)
  const big = await call('PUT', '/skillup/progress', { token, body: { progress: huge } })
  check(`слишком большой прогресс (${sizeKb} КБ) → 422`, big.status === 422, `получено ${big.status}`)
  check('текст про размер понятный', /слишком большой/i.test(JSON.stringify(big.json?.errors ?? {})),
    JSON.stringify(big.json?.errors)?.slice(0, 160))

  console.log('\n══════ 13. УДАЛЕНИЕ АККАУНТА ══════')
  /* без confirm: сервер обязан отказать и не удалить ничего */
  const noConfirm = await call('DELETE', '/skillup/account', { token, body: {} })
  check('без confirm → 422', noConfirm.status === 422, `получено ${noConfirm.status}`)
  check('текст про подтверждение', /подтвердите удаление/i.test(JSON.stringify(noConfirm.json?.errors ?? {})),
    JSON.stringify(noConfirm.json?.errors))

  const wrongPass = await call('DELETE', '/skillup/account', { token, body: { password: 'WrongPass123', confirm: true } })
  check('неверный пароль при удалении → 422', wrongPass.status === 422, `получено ${wrongPass.status}`)
  check('текст про неверный пароль', /неверный пароль/i.test(JSON.stringify(wrongPass.json?.errors ?? {})),
    JSON.stringify(wrongPass.json?.errors))

  /* после двух отказов прогресс должен остаться на месте */
  const stillThere = await call('GET', '/skillup/progress', { token })
  check('после отказов прогресс не тронут', stillThere.status === 200 && stillThere.json?.progress !== null,
    `статус ${stillThere.status}, прогресс ${stillThere.json?.progress === null ? 'null' : 'есть'}`)

  const del = await call('DELETE', '/skillup/account', { token, body: { password: PASS, confirm: true } })
  check('удаление → 200', del.status === 200, `получено ${del.status} ${JSON.stringify(del.json)?.slice(0, 200)}`)
  check('вернулась сводка удалённого', typeof del.json?.deleted === 'object')
  console.log('  удалено:', JSON.stringify(del.json?.deleted))

  const afterDel = await call('GET', '/skillup/progress', { token })
  check('старый токен больше не работает → 401', afterDel.status === 401, `получено ${afterDel.status}`)

  const loginAfter = await call('POST', '/auth/login', { body: { email: EMAIL, password: PASS } })
  check('вход удалённым аккаунтом невозможен → 422', loginAfter.status === 422, `получено ${loginAfter.status}`)

  const regAgain = await call('POST', '/auth/register', {
    body: { name: NAME, email: EMAIL, password: PASS, password_confirmation: PASS },
  })
  check('e-mail освободился — можно зарегистрироваться снова', regAgain.status === 201, `получено ${regAgain.status}`)
  /* убираем за собой второй аккаунт */
  if (regAgain.json?.token) {
    await call('DELETE', '/skillup/account', { token: regAgain.json.token, body: { confirm: true } })
  }
  if (t2) await call('DELETE', '/skillup/account', { token: t2, body: { confirm: true } })

  console.log('\n══════ ИТОГ ══════')
  console.log(`  пройдено: ${pass}, провалено: ${fail}`)
  if (problems.length) console.log('  не прошли:', problems.join('; '))
  console.log(`  тестовый пользователь: ${EMAIL} — удалён`)
}

run().catch((e) => { console.error('СБОЙ ТЕСТА:', e.message); process.exit(1) })
