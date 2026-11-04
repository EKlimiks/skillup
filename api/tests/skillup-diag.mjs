/** Точечная диагностика: merge на пустом сервере и порог размера тела. */

const BASE = (process.argv[2] || 'https://full-emerald.vps.ktk-45.ru') + '/api'
const EMAIL = `diag.${Date.now()}@example.com`
const PASS = 'DiagPass123'

const call = async (method, path, { token, body, raw } = {}) => {
  const headers = { Accept: 'application/json' }
  if (body || raw) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch(BASE + path, {
    method, headers, body: raw ?? (body ? JSON.stringify(body) : undefined),
  })
  let json = null
  const text = await res.text()
  try { json = JSON.parse(text) } catch { /* не JSON */ }
  return { status: res.status, json, text: text.slice(0, 300) }
}

const run = async () => {
  const reg = await call('POST', '/auth/register', {
    body: { name: 'Диагностика', email: EMAIL, password: PASS, password_confirmation: PASS },
  })
  console.log('регистрация:', reg.status, reg.json?.user?.email ?? reg.text)
  const token = reg.json?.token
  if (!token) return

  console.log('\n══════ A. MERGE НА ПУСТОМ СЕРВЕРЕ ══════')
  const local = {
    version: 1, xp: 910, streak: 7, bestStreak: 7, lastActive: '2026-10-16', freezes: 1,
    cards: { 'en-1#0': { ef: 2.6, interval: 15, due: 1795000000000, reps: 3, lapses: 0 } },
    lessons: { 'js-1': '2026-10-16' }, days: { '2026-10-16': 12 }, quests: {},
    combo: 9, bestCombo: 9, achievements: { 'a-ten': 1789050000000 },
    settings: { goal: 20, reminder: false, reminderTime: '19:00' },
    stats: { totalAnswers: 150, correct: 140, wrong: 10, lessonsDone: 3, perfectLessons: 1, questsDone: 4, mastered: 1 },
    skillsTouched: ['code'],
  }
  const m = await call('POST', '/skillup/merge', { token, body: { progress: local } })
  console.log('  статус:', m.status)
  console.log('  тело:', m.text)

  /* повторим — теперь на сервере уже что-то есть */
  const m2 = await call('POST', '/skillup/merge', { token, body: { progress: local } })
  console.log('  повторный merge:', m2.status, m2.json ? JSON.stringify(m2.json.merged) : m2.text)

  console.log('\n══════ B. ПОРОГ РАЗМЕРА ТЕЛА ══════')
  const make = (cardsCount) => {
    const cards = {}
    for (let i = 0; i < cardsCount; i++) {
      cards['card' + i] = { ef: 2.5, interval: 3, due: 1790000000000 + i, reps: 1, lapses: 0 }
    }
    return { version: 1, xp: 1, streak: 1, bestStreak: 1, lastActive: '2026-10-16', freezes: 0, cards }
  }

  for (const n of [1000, 3000, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000]) {
    const payload = { progress: make(n) }
    const raw = JSON.stringify(payload)
    const kb = Math.round(raw.length / 1024)
    const r = await call('PUT', '/skillup/progress', { token, raw })
    const label = r.status === 422 ? '422 ' + JSON.stringify(r.json?.errors ?? {}).slice(0, 90)
      : r.status === 200 ? '200 ок'
      : r.status + ' ' + r.text.slice(0, 90)
    console.log(`  ${String(n).padStart(6)} карточек (${String(kb).padStart(5)} КБ) → ${label}`)
  }

  /* уборка */
  const del = await call('DELETE', '/skillup/account', { token, body: { password: PASS, confirm: true } })
  console.log('\nудаление аккаунта:', del.status, JSON.stringify(del.json?.deleted ?? {}))
}

run().catch((e) => { console.error('СБОЙ:', e.message); process.exit(1) })
