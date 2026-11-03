/**
 * EKlimiks — слой данных.
 *
 * Реализует ровно тот же контракт, что и Laravel API из папки `eklimiks-laravel`
 * (см. README). По умолчанию данные хранятся в localStorage, поэтому демо
 * работает без сервера. Чтобы переключиться на реальный бэкенд, задайте
 *   localStorage.setItem('eklimiks.api', 'https://<ваш-IP>/api')
 * — методы начнут ходить по сети (fetch), см. функцию `remote()`.
 */
import { PRODUCTS, REPAIR_SERVICES, MASTERS, STORES, TRADEIN_FACTORS } from '../data/catalog.js'
import { buildReviews, ratingStats } from '../data/reviews.js'

const DB_KEY = 'eklimiks.db.v1'
/* Увеличивайте при изменении структуры данных — старая база будет пересоздана
   автоматически, иначе у пользователя останутся данные несовместимой версии. */
const DB_VERSION = 3
const API_KEY = 'eklimiks.api'
const TOKEN_KEY = 'eklimiks.token'

export const remoteBase = () => localStorage.getItem(API_KEY) || ''

/**
 * Приводит ответ Laravel к виду, которого ждёт витрина:
 *  • Laravel пагинирует списки → `{ data: [...], meta, links }`, разворачиваем в массив;
 *  • одиночные ресурсы завёрнуты в `{ data: {...} }`;
 *  • camelCase-алиасы (oldPrice, isActive…) уже отдаёт бэкенд.
 */
function unwrap(json) {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    if (Array.isArray(json.data)) return json.data
    if (json.data && typeof json.data === 'object') return { ...json.data, ...Object.fromEntries(Object.entries(json).filter(([k]) => k !== 'data')) }
  }
  return json
}

async function remote(path, options = {}) {
  const base = remoteBase()
  const res = await fetch(base + path, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(localStorage.getItem(TOKEN_KEY) ? { Authorization: 'Bearer ' + localStorage.getItem(TOKEN_KEY) } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Ошибка запроса')
  return unwrap(await res.json())
}

/* ───────────────────────── служебное ───────────────────────── */

const iso = (d) => d.toISOString().slice(0, 10)
const today = () => new Date()
const addDays = (n) => { const d = today(); d.setDate(d.getDate() + n); return d }
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const uid = (arr) => (arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1)
const pad = (n, len = 6) => String(n).padStart(len, '0')

function slotsFor(masterId, date) {
  const out = []
  for (let h = 10; h <= 19; h++) out.push({ masterId, date, time: `${String(h).padStart(2, '0')}:00` })
  return out
}

function seed() {
  const now = new Date().toISOString()

  const users = [
    { id: 1, name: 'Администратор', email: 'admin@eklimiks.ru', password: 'admin123', phone: '+7 (3522) 45-67-89', role: 'admin', bonus: 0, createdAt: now },
    { id: 2, name: 'Марина Смирнова', email: 'manager@eklimiks.ru', password: 'manager123', phone: '+7 (912) 220-11-08', role: 'manager', bonus: 0, createdAt: now },
    { id: 3, name: 'Алексей Петров', email: 'client@eklimiks.ru', password: 'client123', phone: '+7 (912) 445-77-12', role: 'client', bonus: 4820, createdAt: now },
    { id: 4, name: 'Ольга Тихонова', email: 'olga@mail.ru', password: 'olga12345', phone: '+7 (922) 118-42-90', role: 'client', bonus: 1240, createdAt: now },
    { id: 5, name: 'Дмитрий Зайцев', email: 'dmitry@mail.ru', password: 'dmitry123', phone: '+7 (982) 552-19-77', role: 'client', bonus: 2960, createdAt: now },
    { id: 6, name: 'Анна Белова', email: 'anna@mail.ru', password: 'anna12345', phone: '+7 (963) 330-71-24', role: 'client', bonus: 780, createdAt: now },
  ]

  const products = PRODUCTS.map((p, i) => ({ ...p, id: i + 1, isActive: true, createdAt: now }))

  /* отзывы генерируются из набора фраз, а рейтинг и счётчик товара считаются
     из них — цифры в каталоге всегда совпадают с тем, что на странице товара */
  const reviews = buildReviews(products)
  for (const p of products) {
    const st = ratingStats(reviews, p.slug)
    p.rating = st.rating
    p.reviews = st.reviews
  }

  const promos = [
    { id: 1, code: 'EKLIMIKS10', discount: 10, active: true, expiresAt: iso(addDays(60)), note: 'На первую покупку' },
    { id: 2, code: 'STUDENT7', discount: 7, active: true, expiresAt: iso(addDays(120)), note: 'Студентам по студенческому' },
    { id: 3, code: 'TRADEIN5', discount: 5, active: true, expiresAt: iso(addDays(30)), note: 'Дополнительно к Trade-In' },
  ]

  const settings = {
    siteName: 'EKlimiks',
    tagline: 'Техника Apple, Trade-In и сервис',
    phone: '+7 (3522) 45-67-89',
    email: 'hello@eklimiks.ru',
    telegram: 'EKlimikS_shopbot',
    telegramUrl: 'https://t.me/EKlimikS_shopbot',
    address: 'Курган, ул. Гоголя, 55',
    deliveryText: 'Курьером по Кургану — 300 ₽, бесплатно от 50 000 ₽. Самовывоз из трёх салонов — бесплатно.',
    warrantyText: 'Гарантия 12 месяцев на всю технику, 24 месяца на технику Apple по программе производителя.',
    tradeInText: 'Оценим устройство за 5 минут и сразу зачтём стоимость в новый заказ.',
    /* анимация перехода между страницами — можно выключить в админке */
    pageTransition: true,
    heroTitle: 'ТЕХНИКА APPLE',
    heroSubtitle: 'БЕЗ КОМПРОМИССОВ',
  }

  /* слоты мастеров на 14 дней вперёд */
  const slots = []
  let sid = 1
  for (let d = 0; d < 14; d++) {
    const day = addDays(d)
    if (day.getDay() === 0) continue // воскресенье — выходной
    for (const m of MASTERS) {
      for (const s of slotsFor(m.id, iso(day))) slots.push({ id: sid++, ...s, booked: false })
    }
  }

  /* демо-заказы: несколько за последние две недели, чтобы график выручки был живым */
  const mkOrder = (id, userId, name, phone, days, items, deliveryType, status, promo = null, address = '') => {
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0)
    const disc = promo ? Math.round((sub * ({ EKLIMIKS10: 10, STUDENT7: 7, TRADEIN5: 5 }[promo] || 0)) / 100) : 0
    const del = deliveryType === 'courier' && sub - disc < 50000 ? 400 : 0
    return {
      id, userId, number: `EK-2026-${pad(137 + id)}`, status, total: sub - disc + del,
      subtotal: sub, discount: disc, delivery: del, deliveryType, address,
      storeId: 1, slotDate: iso(addDays(days + 2)), slotTime: ['12:00', '14:00', '16:00', '18:00'][id % 4],
      customerName: name, customerPhone: phone, comment: '', promo,
      bonusEarned: Math.round((sub - disc + del) * 0.02),
      items, createdAt: addDays(days).toISOString(),
    }
  }
  const it = (slug, name, storage, color, price, qty = 1) => ({ slug, name, storage, color, price, qty })

  const orders = [
    mkOrder(1, 3, 'Алексей Петров', '+7 (912) 445-77-12', -42, [it('macbook-air-13', 'MacBook Air 13″', '256 ГБ', 'midnight', 139990)], 'pickup', 'delivered'),
    mkOrder(2, 5, 'Дмитрий Зайцев', '+7 (982) 552-19-77', -13, [it('iphone-18-pro', 'iPhone 18 Pro', '256 ГБ', 'black', 139990)], 'pickup', 'delivered', null, ''),
    mkOrder(3, 4, 'Ольга Тихонова', '+7 (922) 118-42-90', -11, [it('airpods-pro-3', 'AirPods Pro 3', '—', 'white', 24990), it('airtag', 'AirTag', '4 шт', 'white', 3490, 2)], 'courier', 'delivered', 'EKLIMIKS10', 'Курган, ул. Куйбышева, 12, кв. 41'),
    mkOrder(4, 6, 'Анна Белова', '+7 (963) 330-71-24', -8, [it('ipad-air-11', 'iPad Air 11″', '128 ГБ', 'blue', 69990), it('pencil-pro', 'Apple Pencil Pro', '—', 'white', 14990)], 'pickup', 'delivered'),
    mkOrder(5, 5, 'Дмитрий Зайцев', '+7 (982) 552-19-77', -6, [it('watch-ultra', 'Apple Watch Ultra 4', '49 мм', 'natural', 89990)], 'courier', 'assembled', null, 'Курган, ул. Пролетарская, 19, кв. 5'),
    mkOrder(6, 3, 'Алексей Петров', '+7 (912) 445-77-12', -4, [it('airpods-pro-3', 'AirPods Pro 3', '—', 'white', 24990), it('airtag', 'AirTag', '1 шт', 'white', 3490)], 'courier', 'confirmed', 'EKLIMIKS10', 'Курган, ул. Куйбышева, 12, кв. 41'),
    mkOrder(7, 4, 'Ольга Тихонова', '+7 (922) 118-42-90', -2, [it('mac-mini', 'Mac mini', '512 ГБ', 'silver', 84990)], 'pickup', 'confirmed'),
    mkOrder(8, 6, 'Анна Белова', '+7 (963) 330-71-24', -1, [it('iphone-17e', 'iPhone 17e', '128 ГБ', 'softpink', 64990)], 'courier', 'new', null, 'Курган, ул. Гоголя, 55'),
  ]

  const repairs = [{
    id: 1, userId: 3, number: 'RM-2026-000071', serviceSlug: 'battery-iphone', masterId: 1,
    device: 'iPhone 13 Pro', issue: 'Быстро садится батарея, ёмкость 78%', status: 'ready',
    price: 4490, slotDate: iso(addDays(-3)), slotTime: '11:00', customerName: 'Алексей Петров',
    customerPhone: '+7 (912) 445-77-12', createdAt: addDays(-5).toISOString(),
  }]

  const tradeins = [{
    id: 1, userId: 3, model: 'iPhone 15 Pro', storage: '256 ГБ', condition: 'good', battery: 88,
    estimated: 62400, finalPrice: 61000, status: 'accepted', customerName: 'Алексей Петров',
    customerPhone: '+7 (912) 445-77-12', createdAt: addDays(-43).toISOString(),
  }]

  const bookings = [{
    id: 1, userId: 3, productSlug: 'iphone-18-pro-max', storeId: 1, slotDate: iso(addDays(2)),
    slotTime: '18:00', status: 'confirmed', customerName: 'Алексей Петров',
    customerPhone: '+7 (912) 445-77-12', createdAt: addDays(-1).toISOString(),
  }]

  const leads = [
    { id: 1, name: 'Кирилл Ефремов', phone: '+7 (912) 118-90-33', type: 'callback', message: 'Интересует MacBook Pro 16, нужна рассрочка', status: 'new', createdAt: addDays(-1).toISOString() },
    { id: 2, name: 'Светлана Гринь', phone: '+7 (982) 776-21-45', type: 'question', message: 'Есть ли iPhone Air в голубом цвете в наличии?', status: 'in_progress', createdAt: addDays(-2).toISOString() },
  ]

  return {
    v: DB_VERSION,
    users, products, orders, repairs, tradeins, bookings, reviews, promos,
    settings, slots, leads, favorites: [], carts: {}, currentUserId: null,
    counters: { order: 145, repair: 71, tradein: 1, booking: 1 },
  }
}

/* ───────────────────────── хранилище ───────────────────────── */

let db = null

function load() {
  if (db) return db
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      /* База из старой сборки: другой набор полей и отзывов. Если её не пересоздать,
         витрина показывает одни цифры, а страницы — другие (или падает). */
      if (saved && saved.v === DB_VERSION && Array.isArray(saved.products) && saved.products.length) {
        db = saved
        return db
      }
    }
  } catch (e) { /* повреждённое хранилище — пересоздаём */ }
  db = seed()
  save()
  return db
}

function save() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch (e) { /* переполнение — игнорируем */ }
}

export function resetDB() {
  db = seed(); save()
}

/* ───────────────────────── публичный API ───────────────────────── */

export const api = {
  /* — каталог — */
  async categories() { return load().products.length ? (await import('../data/catalog.js')).CATEGORIES : [] },

  async products(params = {}) {
    if (remoteBase()) return remote('/products?' + new URLSearchParams(params))
    await wait(80)
    const d = load()
    let list = d.products.filter((p) => p.isActive)
    if (params.category && params.category !== 'all') list = list.filter((p) => p.category === params.category)
    if (params.search) {
      const q = params.search.toLowerCase()
      list = list.filter((p) => (p.name + ' ' + p.subtitle).toLowerCase().includes(q))
    }
    if (params.minPrice) list = list.filter((p) => p.price >= +params.minPrice)
    if (params.maxPrice) list = list.filter((p) => p.price <= +params.maxPrice)
    if (params.condition) list = list.filter((p) => p.condition === params.condition)
    if (params.featured) list = list.filter((p) => p.featured)
    const sort = params.sort || 'popular'
    const by = {
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      new: (a, b) => b.id - a.id,
      popular: (a, b) => b.reviews - a.reviews,
    }[sort]
    if (by) list = [...list].sort(by)
    return list
  },

  async product(slug) {
    if (remoteBase()) return remote('/products/' + slug)
    await wait(60)
    const p = load().products.find((x) => x.slug === slug)
    if (!p) throw new Error('Товар не найден')
    return p
  },

  /* — авторизация — */
  async login(email, password) {
    if (remoteBase()) {
      const r = await remote('/auth/login', { method: 'POST', body: { email, password } })
      localStorage.setItem(TOKEN_KEY, r.token); return r.user
    }
    await wait(260)
    const d = load()
    const u = d.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password)
    if (!u) throw new Error('Неверный e-mail или пароль')
    d.currentUserId = u.id; save()
    return publicUser(u)
  },

  async register({ name, email, password, phone }) {
    if (remoteBase()) {
      const r = await remote('/auth/register', { method: 'POST', body: { name, email, password, phone } })
      localStorage.setItem(TOKEN_KEY, r.token); return r.user
    }
    await wait(260)
    const d = load()
    if (d.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('Такой e-mail уже зарегистрирован')
    const u = { id: uid(d.users), name, email: email.trim(), password, phone: phone || '', role: 'client', bonus: 1000, createdAt: new Date().toISOString() }
    d.users.push(u); d.currentUserId = u.id; save()
    return publicUser(u)
  },

  async logout() {
    const d = load(); d.currentUserId = null; save()
    localStorage.removeItem(TOKEN_KEY)
  },

  async me() {
    if (remoteBase()) { try { return (await remote('/auth/me')).user } catch { return null } }
    const d = load()
    const u = d.users.find((x) => x.id === d.currentUserId)
    return u ? publicUser(u) : null
  },

  /* — корзина (гостевая и пользовательская) — */
  async cart() {
    const d = load()
    const key = d.currentUserId ? 'u' + d.currentUserId : 'guest'
    return d.carts[key] || []
  },

  async cartAdd(item) {
    await wait(90)
    const d = load()
    const key = d.currentUserId ? 'u' + d.currentUserId : 'guest'
    const cart = d.carts[key] || []
    const same = cart.find((i) => i.slug === item.slug && i.storage === item.storage && i.color === item.color)
    if (same) same.qty += item.qty || 1
    else cart.push({ ...item, qty: item.qty || 1 })
    d.carts[key] = cart; save()
    return cart
  },

  async cartSetQty(index, qty) {
    const d = load()
    const key = d.currentUserId ? 'u' + d.currentUserId : 'guest'
    const cart = d.carts[key] || []
    if (cart[index]) { cart[index].qty = Math.max(1, qty); save() }
    return cart
  },

  async cartRemove(index) {
    const d = load()
    const key = d.currentUserId ? 'u' + d.currentUserId : 'guest'
    const cart = d.carts[key] || []
    cart.splice(index, 1); save()
    return cart
  },

  async cartClear() {
    const d = load()
    const key = d.currentUserId ? 'u' + d.currentUserId : 'guest'
    d.carts[key] = []; save()
    return []
  },

  /** Переносит гостевую корзину в аккаунт после входа */
  async cartMerge() {
    const d = load()
    if (!d.currentUserId) return []
    const guest = d.carts.guest || []
    const own = d.carts['u' + d.currentUserId] || []
    if (guest.length) {
      for (const g of guest) {
        const same = own.find((i) => i.slug === g.slug && i.storage === g.storage && i.color === g.color)
        if (same) same.qty += g.qty; else own.push(g)
      }
      d.carts.guest = []
      d.carts['u' + d.currentUserId] = own
      save()
    }
    return own
  },

  /* — заказы — */
  async createOrder(payload) {
    if (remoteBase()) return remote('/orders', { method: 'POST', body: payload })
    await wait(520)
    const d = load()
    const items = payload.items.map((i) => {
      const p = d.products.find((x) => x.slug === i.slug)
      return { slug: i.slug, name: p.name, storage: i.storage, color: i.color, qty: i.qty, price: p.price }
    })
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
    const promo = d.promos.find((p) => p.code === payload.promo && p.active)
    const discount = promo ? Math.round((subtotal * promo.discount) / 100) : 0
    const delivery = payload.deliveryType === 'courier' && subtotal - discount < 50000 ? 400 : 0
    const total = subtotal - discount + delivery
    const counter = ++d.counters.order
    const order = {
      id: uid(d.orders), userId: d.currentUserId, number: `EK-2026-${pad(counter)}`,
      status: 'new', total, subtotal, discount, delivery, deliveryType: payload.deliveryType,
      address: payload.address || '', storeId: payload.storeId || 1, slotDate: payload.slotDate || '',
      slotTime: payload.slotTime || '', customerName: payload.customerName, customerPhone: payload.customerPhone,
      comment: payload.comment || '', promo: promo ? promo.code : null, bonusEarned: Math.round(total * 0.02),
      items, createdAt: new Date().toISOString(),
    }
    d.orders.unshift(order)
    for (const i of items) {
      const p = d.products.find((x) => x.slug === i.slug)
      if (p) p.stock = Math.max(0, p.stock - i.qty)
    }
    const u = d.users.find((x) => x.id === d.currentUserId)
    if (u) u.bonus += order.bonusEarned
    d.carts[d.currentUserId ? 'u' + d.currentUserId : 'guest'] = []
    save()
    return order
  },

  async promoCheck(code) {
    const d = load()
    const p = d.promos.find((x) => x.code.toLowerCase() === String(code).toLowerCase().trim() && x.active)
    return p || null
  },

  /* — бронирование (самовывоз) — */
  async createBooking(payload) {
    if (remoteBase()) return remote('/bookings', { method: 'POST', body: payload })
    await wait(320)
    const d = load()
    const b = {
      id: uid(d.bookings), userId: d.currentUserId, productSlug: payload.productSlug, storeId: payload.storeId,
      slotDate: payload.slotDate, slotTime: payload.slotTime, status: 'new',
      customerName: payload.customerName, customerPhone: payload.customerPhone,
      createdAt: new Date().toISOString(),
    }
    d.bookings.unshift(b); save()
    return b
  },

  /* — ремонт — */
  async repairServices() { return REPAIR_SERVICES },
  async masters() { return MASTERS },
  async stores() { return STORES },

  async masterSlots(masterId, date) {
    if (remoteBase()) return remote(`/masters/${masterId}/slots?date=${date}`)
    await wait(140)
    const d = load()
    return d.slots.filter((s) => s.masterId === +masterId && s.date === date && !s.booked).map((s) => s.time)
  },

  async busySlots(date) {
    const d = load()
    return d.slots.filter((s) => s.date === date && s.booked).map((s) => ({ masterId: s.masterId, time: s.time }))
  },

  async createRepair(payload) {
    if (remoteBase()) return remote('/repair-requests', { method: 'POST', body: payload })
    await wait(420)
    const d = load()
    const slot = d.slots.find((s) => s.masterId === +payload.masterId && s.date === payload.slotDate && s.time === payload.slotTime)
    if (slot) slot.booked = true
    const counter = ++d.counters.repair
    const r = {
      id: uid(d.repairs), userId: d.currentUserId, number: `RM-2026-${pad(counter)}`,
      serviceSlug: payload.serviceSlug, masterId: +payload.masterId, device: payload.device,
      issue: payload.issue, status: 'new', price: payload.price || null,
      slotDate: payload.slotDate, slotTime: payload.slotTime,
      customerName: payload.customerName, customerPhone: payload.customerPhone,
      createdAt: new Date().toISOString(),
    }
    d.repairs.unshift(r); save()
    return r
  },

  /* — Trade-In — */
  async tradeInEstimate({ model, storage, condition, battery }) {
    if (remoteBase()) return remote('/trade-in/estimate', { method: 'POST', body: { model, storage, condition, battery } })
    await wait(360)
    const base = TRADEIN_FACTORS.base[model] || 20000
    const fStore = TRADEIN_FACTORS.storage[storage] ?? 1
    const fCond = TRADEIN_FACTORS.condition[condition]?.k ?? 1
    const fBat = (TRADEIN_FACTORS.battery.find((b) => battery >= b.min) || { k: 0.88 }).k
    const estimated = Math.round((base * fStore * fCond * fBat) / 100) * 100
    return { estimated, factors: { base, fStore, fCond, fBat } }
  },

  async createTradeIn(payload) {
    if (remoteBase()) return remote('/trade-in', { method: 'POST', body: payload })
    await wait(380)
    const d = load()
    const t = {
      id: uid(d.tradeins), userId: d.currentUserId, ...payload, status: 'new',
      createdAt: new Date().toISOString(),
    }
    d.tradeins.unshift(t); save()
    return t
  },

  /* — отзывы и заявки — */
  /**
   * Отзывы с фильтрами и постраничной выдачей.
   * @returns {{items:Array, total:number, avg:number, dist:number[], page:number, pages:number, byRating:Object}}
   */
  async reviews(opts = {}) {
    await wait(120)
    const d = load()
    const { product = null, rating = 0, sort = 'new', page = 1, perPage = 8 } = opts

    let list = d.reviews.filter((r) => r.approved)
    if (product) list = list.filter((r) => r.productSlug === product)

    /* распределение и средняя оценка считаются ДО фильтра по звёздам */
    const dist = [0, 0, 0, 0, 0]
    let sum = 0
    for (const r of list) { dist[5 - r.rating]++; sum += r.rating }
    const avg = list.length ? Math.round((sum / list.length) * 10) / 10 : 0

    if (rating) list = list.filter((r) => r.rating === rating)

    const by = {
      new: (a, b) => (a.createdAt < b.createdAt ? 1 : -1),
      old: (a, b) => (a.createdAt > b.createdAt ? 1 : -1),
      high: (a, b) => b.rating - a.rating || (a.createdAt < b.createdAt ? 1 : -1),
      low: (a, b) => a.rating - b.rating || (a.createdAt < b.createdAt ? 1 : -1),
      useful: (a, b) => (b.helpful || 0) - (a.helpful || 0),
    }[sort]
    if (by) list = [...list].sort(by)

    const total = list.length
    const pages = Math.max(1, Math.ceil(total / perPage))
    const p = Math.min(Math.max(1, page), pages)
    return { items: list.slice((p - 1) * perPage, p * perPage), total, avg, dist, page: p, pages }
  },

  async createReview(payload) {
    await wait(300)
    const d = load()
    const u = d.users.find((x) => x.id === d.currentUserId)
    const r = { id: uid(d.reviews), approved: false, author: u ? u.name : 'Гость', userId: d.currentUserId, createdAt: new Date().toISOString(), helpful: 0, ...payload }
    d.reviews.unshift(r); save()
    return r
  },

  async createLead(payload) {
    if (remoteBase()) return remote('/leads', { method: 'POST', body: payload })
    await wait(320)
    const d = load()
    const l = { id: uid(d.leads), status: 'new', createdAt: new Date().toISOString(), ...payload }
    d.leads.unshift(l); save()
    return l
  },

  /* — личный кабинет — */
  async profile() {
    const d = load()
    const u = d.users.find((x) => x.id === d.currentUserId)
    if (!u) return null
    return {
      user: publicUser(u),
      orders: d.orders.filter((o) => o.userId === u.id),
      repairs: d.repairs.filter((r) => r.userId === u.id),
      tradeins: d.tradeins.filter((t) => t.userId === u.id),
      bookings: d.bookings.filter((b) => b.userId === u.id),
      favorites: d.favorites.filter((f) => f.userId === u.id).map((f) => f.slug),
    }
  },

  async updateProfile(patch) {
    await wait(220)
    const d = load()
    const u = d.users.find((x) => x.id === d.currentUserId)
    if (!u) throw new Error('Не авторизован')
    Object.assign(u, patch); save()
    return publicUser(u)
  },

  async toggleFavorite(slug) {
    const d = load()
    if (!d.currentUserId) throw new Error('Войдите, чтобы добавлять в избранное')
    const i = d.favorites.findIndex((f) => f.userId === d.currentUserId && f.slug === slug)
    if (i >= 0) d.favorites.splice(i, 1); else d.favorites.push({ userId: d.currentUserId, slug })
    save()
    return d.favorites.filter((f) => f.userId === d.currentUserId).map((f) => f.slug)
  },

  async favorites() {
    const d = load()
    if (!d.currentUserId) return []
    return d.favorites.filter((f) => f.userId === d.currentUserId).map((f) => f.slug)
  },

  /* — трекинг заказа/ремонта по номеру — */
  async track(number) {
    await wait(400)
    const d = load()
    const n = String(number).trim().toUpperCase()
    return d.orders.find((o) => o.number.toUpperCase() === n) ||
           d.repairs.find((r) => r.number.toUpperCase() === n) || null
  },

  /* — настройки — */
  async settings() { return load().settings },

  /* ═════════════════════ админ-панель ═════════════════════ */

  async adminDashboard() {
    const d = load()
    const revenue = d.orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
    return {
      counts: {
        products: d.products.length, orders: d.orders.length, repairs: d.repairs.length,
        tradeins: d.tradeins.length, bookings: d.bookings.length, users: d.users.length,
        reviews: d.reviews.length, leads: d.leads.length,
        newOrders: d.orders.filter((o) => o.status === 'new').length,
        newRepairs: d.repairs.filter((r) => r.status === 'new').length,
        pendingReviews: d.reviews.filter((r) => !r.approved).length,
        lowStock: d.products.filter((p) => p.stock <= 5).length,
      },
      revenue,
      avgOrder: d.orders.length ? Math.round(revenue / d.orders.length) : 0,
      topProducts: topProducts(d),
      revenueByDay: revenueByDay(d),
      recentOrders: d.orders.slice(0, 6),
      recentRepairs: d.repairs.slice(0, 6),
      recentLeads: d.leads.slice(0, 5),
    }
  },

  async adminList(entity) {
    const d = load()
    const map = {
      products: () => d.products, orders: () => d.orders, repairs: () => d.repairs,
      tradeins: () => d.tradeins, bookings: () => d.bookings, users: () => d.users.map(publicUser),
      reviews: () => adminReviewList(d), leads: () => d.leads, promos: () => d.promos, slots: () => d.slots,
    }
    return map[entity] ? map[entity]() : []
  },

  async adminSaveProduct(patch) {
    await wait(200)
    const d = load()
    if (patch.id) {
      const i = d.products.findIndex((p) => p.id === patch.id)
      d.products[i] = { ...d.products[i], ...patch }
    } else {
      d.products.push({
        id: uid(d.products), colors: [{ id: 'black', name: 'Чёрный', hex: '#1d1d1f' }],
        storages: ['—'], specs: [], rating: 5, reviews: 0, condition: 'new', stock: 0,
        category: 'iphone', description: '', subtitle: '', isActive: true,
        createdAt: new Date().toISOString(), ...patch,
      })
    }
    save()
    return d.products
  },

  async adminDeleteProduct(id) {
    const d = load()
    d.products = d.products.filter((p) => p.id !== id); save()
    return d.products
  },

  async adminSetStatus(entity, id, status) {
    await wait(160)
    const d = load()
    const list = { orders: d.orders, repairs: d.repairs, tradeins: d.tradeins, bookings: d.bookings, leads: d.leads }[entity]
    const item = list && list.find((x) => x.id === id)
    if (item) {
      item.status = status
      if (entity === 'tradeins' && status === 'accepted' && item.finalPrice == null) item.finalPrice = item.estimated
    }
    save()
    return list || []
  },

  async adminSetRole(id, role) {
    const d = load()
    const u = d.users.find((x) => x.id === id)
    if (u) u.role = role
    save()
    return d.users.map(publicUser)
  },

  async adminApproveReview(id, approved) {
    const d = load()
    const r = d.reviews.find((x) => x.id === id)
    if (r) {
      r.approved = approved
      const p = d.products.find((x) => x.slug === r.productSlug)
      if (p) {
        const st = ratingStats(d.reviews, r.productSlug)
        p.rating = st.rating
        p.reviews = st.reviews
      }
    }
    save()
    return adminReviewList(d)
  },

  async adminDeleteReview(id) {
    const d = load()
    const gone = d.reviews.find((r) => r.id === id)
    d.reviews = d.reviews.filter((r) => r.id !== id)
    if (gone) {
      const p = d.products.find((x) => x.slug === gone.productSlug)
      if (p) {
        const st = ratingStats(d.reviews, gone.productSlug)
        p.rating = st.rating
        p.reviews = st.reviews
      }
    }
    save()
    return adminReviewList(d)
  },

  async adminSaveSettings(patch) {
    await wait(220)
    const d = load()
    d.settings = { ...d.settings, ...patch }; save()
    return d.settings
  },

  async adminSavePromo(promo) {
    const d = load()
    if (promo.id) {
      const i = d.promos.findIndex((p) => p.id === promo.id)
      d.promos[i] = { ...d.promos[i], ...promo }
    } else {
      d.promos.push({ id: uid(d.promos), active: true, ...promo })
    }
    save()
    return d.promos
  },

  async adminDeletePromo(id) {
    const d = load()
    d.promos = d.promos.filter((p) => p.id !== id); save()
    return d.promos
  },

  async adminToggleSlot(id) {
    const d = load()
    const s = d.slots.find((x) => x.id === id)
    if (s) s.booked = !s.booked
    save()
    return d.slots
  },
}

/* ───────────────────────── помощники ───────────────────────── */

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, bonus: u.bonus, createdAt: u.createdAt }
}

/** Для админки: сначала отзывы на модерации, потом свежие опубликованные.
 *  Отзывов в базе больше 1600 — целиком не отдаём, иначе страница вырастает на десятки тысяч пикселей. */
function adminReviewList(d) {
  const pending = d.reviews.filter((r) => !r.approved)
  const done = d.reviews.filter((r) => r.approved).slice(0, 40)
  return [...pending, ...done]
}

function topProducts(d) {
  const acc = {}
  for (const o of d.orders) {
    if (o.status === 'cancelled') continue
    for (const i of o.items) acc[i.slug] = (acc[i.slug] || 0) + i.qty * i.price
  }
  return Object.entries(acc)
    .map(([slug, sum]) => ({ slug, sum, name: (d.products.find((p) => p.slug === slug) || {}).name || slug }))
    .sort((a, b) => b.sum - a.sum).slice(0, 5)
}

function revenueByDay(d) {
  const out = []
  for (let i = 13; i >= 0; i--) {
    const day = iso(addDays(-i))
    const sum = d.orders
      .filter((o) => o.status !== 'cancelled' && o.createdAt.slice(0, 10) === day)
      .reduce((s, o) => s + o.total, 0)
    out.push({ day, sum })
  }
  return out
}

/* ───────────── статусы (единый словарь для всего UI) ───────────── */

export const STATUS = {
  order: {
    new: { label: 'Новый', color: 'accent' },
    confirmed: { label: 'Подтверждён', color: 'accent' },
    assembled: { label: 'Собран', color: 'warn' },
    delivered: { label: 'Выдан', color: 'ok' },
    cancelled: { label: 'Отменён', color: 'danger' },
  },
  repair: {
    new: { label: 'Принят', color: 'accent' },
    diagnostics: { label: 'Диагностика', color: 'accent' },
    approved: { label: 'Согласован', color: 'warn' },
    in_progress: { label: 'В работе', color: 'warn' },
    ready: { label: 'Готов к выдаче', color: 'ok' },
    done: { label: 'Выдан', color: 'ok' },
    cancelled: { label: 'Отменён', color: 'danger' },
  },
  tradein: {
    new: { label: 'Заявка принята', color: 'accent' },
    evaluated: { label: 'Оценено', color: 'accent' },
    accepted: { label: 'Принято', color: 'ok' },
    rejected: { label: 'Отклонено', color: 'danger' },
    completed: { label: 'Выплачено', color: 'ok' },
  },
  booking: {
    new: { label: 'Ожидает', color: 'accent' },
    confirmed: { label: 'Подтверждено', color: 'accent' },
    completed: { label: 'Выдано', color: 'ok' },
    cancelled: { label: 'Отменено', color: 'danger' },
  },
  lead: {
    new: { label: 'Новая', color: 'accent' },
    in_progress: { label: 'В работе', color: 'warn' },
    done: { label: 'Обработана', color: 'ok' },
  },
}

export const ORDER_FLOW = ['new', 'confirmed', 'assembled', 'delivered']
export const REPAIR_FLOW = ['new', 'diagnostics', 'approved', 'in_progress', 'ready', 'done']
