/** Форматирование цен, дат и склонений — единый стиль по всему сайту. */

/**
 * База для статических файлов.
 * На сервере это «/», а при открытии собранного демо по file:// — «./»,
 * иначе картинки искались бы в корне диска.
 */
export const ASSET_BASE =
  typeof window !== 'undefined' && window.location.protocol === 'file:' ? './' : '/'

/** Путь к фото товара: /img/products/<slug>--<color>.webp */
export const productImg = (slug, color) => `${ASSET_BASE}img/products/${slug}--${color}.webp`

/**
 * Цена в рублях. Перед знаком ₽ стоит тонкий пробел (U+2009):
 * в Orbitron глиф рубля узкий и без отбивки «липнет» к последней цифре.
 */
export const money = (n) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n || 0)) + '\u2009₽'

export const moneyShort = (n) => {
  const v = Math.round(n || 0)
  if (v >= 1000000) return (v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1).replace('.', ',') + ' млн ₽'
  if (v >= 1000) return Math.round(v / 1000) + ' тыс ₽'
  return v + ' ₽'
}

export const num = (n) => new Intl.NumberFormat('ru-RU').format(n || 0)

export function plural(n, one, few, many) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}

export const dateRu = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
}

export const dateShort = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const dateTimeRu = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export const weekdayRu = (iso) => new Date(iso).toLocaleDateString('ru-RU', { weekday: 'short' })

export const dayNum = (iso) => new Date(iso).getDate()

export const monthRu = (iso) => new Date(iso).toLocaleDateString('ru-RU', { month: 'short' })

/** Следующие N дат (ISO) начиная с завтрашнего дня, без воскресений */
export function upcomingDates(count = 12, skipSunday = true) {
  const out = []
  const d = new Date()
  while (out.length < count) {
    d.setDate(d.getDate() + 1)
    if (skipSunday && d.getDay() === 0) continue
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

/** Цвет-подпись для статуса -> CSS-класс */
export const statusClass = (map, key) => 'st st--' + ((map[key] || {}).color || 'muted')
