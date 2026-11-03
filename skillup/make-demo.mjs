/** Создание демо-аккаунта с богатым прогрессом. */
const B = 'https://full-emerald.vps.ktk-45.ru/api'
const j = async (r) => { try { return await r.json() } catch { return null } }
const key = (y) => {
  const x = new Date(Date.now() - y * 86400000)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}

const EMAIL = 'demo@eklimiks.ru'
const PASS = 'demo12345'

/* регистрация или вход */
let r = await fetch(B + '/auth/register', {
  method: 'POST',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Демо Аккаунт', email: EMAIL, password: PASS, password_confirmation: PASS, device_name: 'Demo' }),
})
let d = await j(r)
if (r.status === 422) {
  r = await fetch(B + '/auth/login', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS, device_name: 'Demo' }),
  })
  d = await j(r)
  console.log('аккаунт уже был — вошли')
} else {
  console.log('аккаунт создан')
}
const token = d.token
const H = { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }

/* богатый прогресс */
const ACH = ['a-first', 'a-ten', 'a-hundred', 'a-500', 'a-streak3', 'a-streak7', 'a-streak30',
  'a-lesson1', 'a-lesson10', 'a-skill', 'a-level5', 'a-level10', 'a-quests3', 'a-perfect',
  'a-master', 'a-focus', 'a-focus5', 'a-gems', 'a-night', 'a-early', 'a-perfect-day']
const ach = {}
ACH.forEach((id) => { ach[id] = Date.now() })

const days = {}
for (let i = 0; i < 42; i++) {
  if (i % 4 !== 1) days[key(i)] = 4 + Math.floor(Math.random() * 24)
}
days[key(0)] = 18

const cards = {}
;['en-1#0', 'en-1#1', 'en-1#2', 'en-1#3', 'en-2#0', 'js-1#0', 'fo-1#0', 'sc-1#0', 'sc-1#1', 'sc-2#0']
  .forEach((id, i) => {
    cards[id] = { ef: 2.5 + (i % 3) * 0.1, interval: 30 + i * 5, due: Date.now() + 86400000 * (i + 1), reps: 4 + (i % 3), lapses: i % 2 }
  })

const xpDays = {}
xpDays[key(0)] = 500
xpDays[key(1)] = 620
xpDays[key(2)] = 480

const progress = {
  xp: 5200, gems: 9999, streak: 12, bestStreak: 26, freezes: 5,
  hearts: 5, heartsAt: Date.now(),
  xpDays, chestDays: { [key(0)]: 1 },
  cards,
  lessons: { 'en-1': key(3), 'en-2': key(2), 'sc-1': key(1) },
  days, quests: {}, achievements: ach,
  stats: {
    totalAnswers: 1500, correct: 1380, wrong: 120, lessonsDone: 11,
    perfectLessons: 5, questsDone: 12, mastered: 8, focusCount: 6, focusMinutes: 150,
  },
  skillsTouched: ['english', 'code', 'focus', 'money', 'science'],
  minutes: { [key(0)]: 35, [key(1)]: 42, [key(2)]: 28 },
  perfectDays: { [key(0)]: 1 },
  touchDays: { [key(0)]: ['english', 'code'] },
  settings: { goal: 20, reminder: false, reminderTime: '19:00', sound: true, onboarded: true, picked: ['english', 'code', 'science'] },
  lastActive: key(0),
}

r = await fetch(B + '/skillup/merge', { method: 'POST', headers: H, body: JSON.stringify({ progress, client_updated_at: new Date().toISOString() }) })
const m = await j(r)
console.log('прогресс залит:', r.status, '| гемов:', m.progress?.gems, '| XP:', m.progress?.xp, '| достижений:', Object.keys(m.progress?.achievements || {}).length)

/* проверка лиги */
r = await fetch(B + '/skillup/league', { headers: H })
const lg = await j(r)
console.log('лига:', r.status, '| я на месте', lg.board?.findIndex((u) => u.me) + 1, 'с', lg.board?.find((u) => u.me)?.xp, 'XP')

console.log('\nГОТОВО. Аккаунт:', EMAIL, '/', PASS)
