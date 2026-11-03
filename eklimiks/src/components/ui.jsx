import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { productImg, money, num } from '../lib/format.js'
import { useInView, useTilt, useSpotlight } from '../lib/motion.js'

/* ═════════════════════ иконки ═════════════════════ */
const P = {
  phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 16h4',
  laptop: 'M3 5h18v10H3zM2 19h20M9 19h6',
  tablet: 'M5 2h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm6 17h2',
  watch: 'M9 2h6v3H9zM9 19h6v3H9zM7 5h10v14H7z',
  audio: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1zm16 0h-3v5h2a1 1 0 0 0 1-1z',
  tv: 'M3 5h18v11H3zM8 20h8M12 16v4',
  vision: 'M2 9h20v6H2zM6 9v6M18 9v6',
  tag: 'M3 12 12 3h8v8l-9 9zM16 8h.01',
  cart: 'M3 4h2l2.5 11h11L21 7H6M9 20a1 1 0 1 0 2 0 1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0',
  heart: 'M12 20s-7-4.6-7-9.4A4 4 0 0 1 12 7.7a4 4 0 0 1 7 2.9C19 15.4 12 20 12 20Z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4',
  close: 'M6 6l12 12M18 6 6 18',
  menu: 'M3 6h18M3 12h18M3 18h18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M4 13l5 5L20 6',
  arrow: 'M4 12h15M13 6l6 6-6 6',
  tg: 'M21 4 2.5 11.2l5.2 1.7L10 20l3-4.2 5 3.7z',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z',
  trash: 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13',
  edit: 'M4 20h4L20 8l-4-4L4 16zM14 6l4 4',
  box: 'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9',
  tool: 'M14.7 6.3a4 4 0 1 0 5 5L21 21H3l7.5-7.5a4 4 0 0 1 4.2-7.2Z',
  recycle: 'M4 12a8 8 0 0 1 13.7-5.7M20 12a8 8 0 0 1-13.7 5.7M17.5 2.5v4h-4M6.5 21.5v-4h4',
  calendar: 'M3 6h18v15H3zM3 10h18M8 3v4M16 3v4',
  truck: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 7 19m10 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2',
  shield: 'M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
  logout: 'M10 20H5V4h5M15 8l4 4-4 4M19 12H9',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2',
  gift: 'M3 11h18v10H3zM3 7h18v4H3zM12 7v14M12 7S9.5 3 7.5 3.6 8.8 7 12 7m0 0s2.5-4 4.5-3.4S15.2 7 12 7',
  card: 'M3 6h18v12H3zM3 10h18',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6z',
  eye: 'M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Zm10 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  filter: 'M3 5h18l-7 8v6l-4-2v-4z',
  sort: 'M7 4v16M7 20l-3-3M17 20V4M17 4l3 3',
  wallet: 'M3 7h18v12H3zM3 7l3-3h12l3 3M16 13h2',
}

export function Icon({ name, size = 18, className = '', stroke = 1.5 }) {
  const d = P[name] || P.box
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

/* ═════════════════════ звёзды ═════════════════════ */
export function Stars({ value = 5, size = 13 }) {
  return (
    <span className="stars" aria-label={`Рейтинг ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i <= Math.round(value) ? 'on' : 'off'} fill="currentColor" aria-hidden="true">
          <path d={P.star} />
        </svg>
      ))}
    </span>
  )
}

/* ═════════════════════ появление при скролле ═════════════════════
   variant: up | clip | blur | scale | left | right | mask
   Задержку задаём через data-d, шаг — в CSS.
   Важно: класс is-in ставим через состояние, а не через classList —
   иначе ре-рендер после срабатывания observer’а сбрасывает его.            */
export function Reveal({ children, delay = 0, variant = 'up', as: Tag = 'div', className = '', once = true, ...rest }) {
  const [ref, seen] = useInView({ once })
  /* у варианта mask клип уводит площадь в ноль, и observer перестаёт видеть элемент.
     Поэтому клипуем внутренний слой, а наблюдаем за внешним. */
  const inner = variant === 'mask'
  return (
    <Tag ref={ref} data-d={delay}
      className={`reveal reveal--${variant} ${seen ? 'is-in' : ''} ${className}`} {...rest}>
      {inner ? <span className="reveal__in">{children}</span> : children}
    </Tag>
  )
}

/* ═════════════════════ «декодирующийся» заголовок ═════════════════════ */
const GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ0123456789#@$%&*/\\|<>'
export function Decode({ text, speed = 34, className = '' }) {
  const [out, setOut] = useState(() => text.replace(/\S/g, ' '))
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setOut(text.split('').map((ch, k) => {
        if (ch === ' ') return ' '
        if (k < i) return ch
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }).join(''))
      if (i > text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return <span className={`decode ${className}`}>{out}</span>
}

/* ═════════════════════ бегущая строка ═════════════════════ */
export function Marquee({ items, repeat = 2 }) {
  const line = [...items, ...items].slice(0, items.length * repeat)
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {[...line, ...line].map((t, i) => (
          <span className="marquee__item" key={i}><i className="marquee__dot" />{t}</span>
        ))}
      </div>
    </div>
  )
}

/* ═════════════════════ заголовок секции ═════════════════════
   Заголовок «проявляется» слева направо маской, действие справа — с задержкой */
export function SectionHead({ idx, title, sub, right, id }) {
  return (
    <div className="sec-head" id={id}>
      <Reveal variant="mask">
        {idx && <span className="sec-head__idx">{idx}</span>}
        <h2 className="h2">{title}</h2>
        {sub && <p className="lead" style={{ marginTop: 14 }}>{sub}</p>}
      </Reveal>
      {right && <Reveal variant="right" delay={2}>{right}</Reveal>}
    </div>
  )
}

/* ═════════════════════ модальное окно ═════════════════════ */
export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('is-locked')
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('is-locked') }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal brackets ${wide ? 'modal--wide' : ''}`}>
        <button className="icon-btn modal__close btn--outline" onClick={onClose} aria-label="Закрыть"><Icon name="close" size={16} /></button>
        {title && <div className="modal__head"><h3 className="h3">{title}</h3></div>}
        {children}
      </div>
    </div>
  )
}

/* ═════════════════════ уведомления ═════════════════════ */
export function Toasts({ items }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div className={`toast toast--${t.kind}`} key={t.id}>
          <Icon name={t.kind === 'danger' ? 'close' : t.kind === 'warn' ? 'bolt' : 'check'} size={16} className={t.kind === 'danger' ? 'danger' : 'accent'} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}

/* ═════════════════════ карточка товара ═════════════════════
   Карточка слегка наклоняется за курсором, а внутри едет подсветка.
   Наклон считается в useTilt и пишет --mx/--my для градиента. */
export function ProductCard({ p, onAdd, fav, onFav, delay = 0 }) {
  const img = productImg(p.slug, p.colors[0].id)
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
  const tilt = useTilt(6, 1.02)
  return (
    <Reveal delay={delay % 7} className="pcard-wrap">
      <article ref={tilt} className="pcard">
        <span className="pcard__glow" aria-hidden="true" />
        <div className="pcard__media">
          <div className="pcard__badges">
            {p.badge && <span className="badge badge--accent">{p.badge}</span>}
            {off > 0 && <span className="badge badge--sale">−{off}%</span>}
            {p.stock <= 5 && p.stock > 0 && <span className="badge badge--warn">Осталось {p.stock}</span>}
            {p.stock === 0 && <span className="badge badge--danger">Нет в наличии</span>}
          </div>
          <button className={`pcard__fav ${fav ? 'is-on' : ''}`} onClick={() => onFav && onFav(p.slug)}
            aria-label={fav ? 'Убрать из избранного' : 'В избранное'} title="В избранное">
            <Icon name="heart" size={16} />
          </button>
          <Link to={`/product/${p.slug}`} aria-label={p.name}>
            <img src={img} alt={p.name} loading="lazy" width="820" height="820" />
          </Link>
        </div>
        <div className="pcard__body">
        <Link to={`/product/${p.slug}`}><h3 className="pcard__name">{p.name}</h3></Link>
        <p className="pcard__sub">{p.subtitle}</p>
        <div className="between">
          <span className="pcard__colors">
            {p.colors.slice(0, 5).map((c) => (
              <i key={c.id} className="swatch" style={{ background: c.hex }} title={c.name} />
            ))}
          </span>
          <span className="pcard__rating"><Stars value={p.rating} size={11} />{p.rating} · {p.reviews}</span>
        </div>
        <div className="pcard__foot">
          <span>
            <span className="pcard__price num">{money(p.price)}</span>
            {p.oldPrice && <><br /><span className="pcard__old">{money(p.oldPrice)}</span></>}
          </span>
          <button className="pcard__add" onClick={() => onAdd && onAdd(p)} disabled={p.stock === 0}
            aria-label="Добавить в корзину" title="В корзину">
            <Icon name="plus" size={17} />
          </button>
        </div>
        </div>
      </article>
    </Reveal>
  )
}

/* ═════════════════════ мини-график ═════════════════════ */
export function Spark({ data, label }) {
  const max = Math.max(1, ...data.map((d) => d.sum))
  return (
    <div>
      <div className="spark">
        {data.map((d) => (
          <i key={d.day} className="spark__b" style={{ height: `${Math.max(3, (d.sum / max) * 100)}%` }}
            title={`${d.day}: ${money(d.sum)}`} />
        ))}
      </div>
      {label && <p className="tiny muted" style={{ marginTop: 8 }}>{label}</p>}
    </div>
  )
}

/* ═════════════════════ пустое состояние ═════════════════════ */
export function Empty({ icon = 'box', title, text, action }) {
  return (
    <div className="empty">
      <div className="empty__ico"><Icon name={icon} size={40} /></div>
      <p className="empty__t">{title}</p>
      {text && <p className="muted" style={{ maxWidth: 460, margin: '0 auto 20px' }}>{text}</p>}
      {action}
    </div>
  )
}

/* ═════════════════════ поле формы ═════════════════════ */
export function Field({ label, hint, error, children }) {
  return (
    <label className="field">
      {label && <span className="field__label">{label}</span>}
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__err">{error}</span>}
    </label>
  )
}

/* ═════════════════════ аккордеон ═════════════════════ */
export function Accordion({ items }) {
  const [open, setOpen] = useState(0)
  const ref = useRef(null)

  /* разделители выезжают слева при появлении блока (приём с референса) */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      el.querySelectorAll('.acc__item').forEach((n, i) => {
        n.style.setProperty('--d', i)
        n.classList.add('is-in')
      })
      io.disconnect()
    }, { threshold: 0.06 })
    io.observe(el)
    return () => io.disconnect()
  }, [items.length])

  return (
    <div className="acc" ref={ref}>
      {items.map((it, i) => (
        <div className={`acc__item ${open === i ? 'is-open' : ''}`} key={i}>
          <button className="acc__q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            <span>{it.q}</span><i className="acc__sign" />
          </button>
          <div className="acc__a"><div className="acc__a-inner">{it.a}</div></div>
        </div>
      ))}
    </div>
  )
}

/* ═════════════════════ переключатель счетчика ═════════════════════ */
export function Qty({ value, onChange, max = 99 }) {
  return (
    <div className="row gap-6">
      <button className="icon-btn btn--outline" style={{ width: 32, height: 32 }} onClick={() => onChange(Math.max(1, value - 1))} aria-label="Меньше"><Icon name="minus" size={13} /></button>
      <span className="num" style={{ minWidth: 26, textAlign: 'center', fontWeight: 600 }}>{value}</span>
      <button className="icon-btn btn--outline" style={{ width: 32, height: 32 }} onClick={() => onChange(Math.min(max, value + 1))} aria-label="Больше"><Icon name="plus" size={13} /></button>
    </div>
  )
}

export { num }
