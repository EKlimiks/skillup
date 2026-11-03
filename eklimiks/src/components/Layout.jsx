import { productImg } from '../lib/format.js'
import React, { useEffect, useState, useCallback } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { api } from '../lib/api.js'
import { reducedMotion } from '../lib/motion.js'
import { ProgressRing, Cursor, PageWipe } from './motion.jsx'
import { Icon, Modal, Toasts, Decode, Field } from './ui.jsx'

/* ═══════════════════ прогресс чтения ═══════════════════ */
function ScrollProgress() {
  const [w, setW] = useState(0)
  useEffect(() => {
    const on = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setW(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
  return <div className="sprog"><i style={{ width: `${w}%` }} /></div>
}

/* ═══════════════════ прелоадер ═══════════════════ */
const BOOT = [
  'инициализация терминала',
  'подключение к складу Apple',
  'проверка слотов сервиса',
  'загрузка каталога 2026',
  'готово',
]

function Preloader() {
  const [pct, setPct] = useState(0)
  const [hidden, setHidden] = useState(false)
  const [log, setLog] = useState([])

  useEffect(() => {
    let v = 0, li = 0
    const id = setInterval(() => {
      v += Math.random() * 13 + 4
      if (v >= 100) { v = 100 }
      setPct(Math.floor(v))
      const target = Math.min(BOOT.length, Math.floor((v / 100) * BOOT.length) + 1)
      if (target > li) { li = target; setLog(BOOT.slice(0, li)) }
      if (v >= 100) {
        clearInterval(id)
        setTimeout(() => { setHidden(true); document.body.classList.remove('is-locked') }, 480)
      }
    }, 130)
    document.body.classList.add('is-locked')
    return () => { clearInterval(id); document.body.classList.remove('is-locked') }
  }, [])

  return (
    <div className={`pre ${hidden ? 'is-done' : ''}`} aria-hidden={hidden}>
      <div className="pre__grid" />
      <div className="pre__inner">
        <div className="pre__corners"><i /><i /><i /><i /></div>
        <div className="pre__brand">EKLIMIKS<span>.</span></div>
        <div className="pre__count">{String(pct).padStart(3, '0')}</div>
        <div className="pre__bar"><i style={{ width: `${pct}%` }} /></div>
        <div className="pre__log">
          {log.map((l, i) => <div key={i}><b>[ok]</b> {l}</div>)}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════ кнопка «наверх» с круговым прогрессом ═══════════════════ */
function ToTop() {
  return <ProgressRing onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })} />
}

/* ═══════════════════ форма «заказать звонок» ═══════════════════ */
export function CallbackModal({ open, onClose }) {
  const { toast } = useApp()
  const [f, setF] = useState({ name: '', phone: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!f.name.trim() || f.phone.replace(/\D/g, '').length < 10) {
      toast('Укажите имя и корректный телефон', 'danger'); return
    }
    setBusy(true)
    await api.createLead({ ...f, type: 'callback' })
    setBusy(false); setDone(true)
    toast('Заявка отправлена — перезвоним в течение 15 минут')
    setTimeout(() => { onClose(); setDone(false); setF({ name: '', phone: '', message: '' }) }, 1800)
  }

  return (
    <Modal open={open} onClose={onClose} title={done ? 'Заявка принята' : 'Заказать звонок'}>
      {done ? (
        <div className="center" style={{ padding: '18px 0' }}>
          <Icon name="check" size={40} className="ok" />
          <p style={{ marginTop: 14 }}>Менеджер EKlimiks свяжется с вами в течение 15 минут.</p>
        </div>
      ) : (
        <form className="stack gap-14" onSubmit={submit}>
          <p className="muted small">Перезвоним, подберём модель, посчитаем Trade-In и рассрочку.</p>
          <Field label="Как вас зовут *">
            <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Иван" />
          </Field>
          <Field label="Телефон *">
            <input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+7 (___) ___-__-__" inputMode="tel" />
          </Field>
          <Field label="Комментарий">
            <textarea className="textarea" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Что интересует?" />
          </Field>
          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="phone" size={16} />} Отправить заявку
          </button>
          <p className="tiny muted">Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.</p>
        </form>
      )}
    </Modal>
  )
}

/* ═══════════════════ поиск ═══════════════════ */
function SearchModal({ open, onClose }) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState([])
  const nav = useNavigate()

  useEffect(() => {
    if (!open) { setQ(''); setRes([]); return }
    let alive = true
    api.products({ search: q }).then((r) => { if (alive) setRes(q ? r.slice(0, 6) : []) })
    return () => { alive = false }
  }, [q, open])

  const go = (slug) => { onClose(); nav(`/product/${slug}`) }

  return (
    <Modal open={open} onClose={onClose} title="Поиск по каталогу">
      <div className="field">
        <input className="input" autoFocus value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="iPhone 18 Pro, MacBook Air, AirPods…" />
      </div>
      <div className="stack gap-6" style={{ marginTop: 16 }}>
        {res.map((p) => (
          <button key={p.slug} className="between" onClick={() => go(p.slug)}
            style={{ background: 'none', border: 0, borderBottom: '1px solid var(--line)', padding: '10px 0', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}>
            <span className="row gap-14">
              <img src={productImg(p.slug, p.colors[0].id)} alt="" width="46" height="46" style={{ objectFit: 'contain' }} />
              <span>
                <b style={{ display: 'block', fontWeight: 600 }}>{p.name}</b>
                <span className="tiny muted">{p.subtitle}</span>
              </span>
            </span>
            <span className="num accent">{p.price.toLocaleString('ru-RU')} ₽</span>
          </button>
        ))}
        {q && !res.length && <p className="muted small">Ничего не найдено. Попробуйте «iPhone» или «Air».</p>}
        {!q && <p className="muted small">Начните вводить название — покажем подходящие модели.</p>}
      </div>
    </Modal>
  )
}

/* ═══════════════════ шапка ═══════════════════ */
const NAV = [
  ['/catalog', 'Каталог'],
  ['/trade-in', 'Trade-In'],
  ['/repair', 'Ремонт'],
  ['/reserve', 'Бронирование'],
  ['/picker', 'Подбор'],
  ['/track', 'Статус заказа'],
  ['/about', 'О нас'],
]

function Clock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <span className="clock">
      {t.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} YEKT
    </span>
  )
}

export function Header({ onCallback }) {
  const { user, cartCount, favorites, compare, settings, logout } = useApp()
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [umenu, setUmenu] = useState(false)
  const loc = useLocation()

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => { setMenu(false); setUmenu(false) }, [loc.pathname])
  useEffect(() => { document.body.classList.toggle('is-locked', menu) }, [menu])

  return (
    <>
      <header className={`hdr ${scrolled ? '' : 'hdr--top'}`}>
        <div className="wrap">
          <div className="hdr__top">
            <div className="hdr__strip">
              <span className="row gap-6"><Icon name="pin" size={13} />{settings.address}</span>
              <a href={`tel:${(settings.phone || '').replace(/\D/g, '')}`} className="row gap-6"><Icon name="phone" size={13} />{settings.phone}</a>
              <span className="row gap-6"><Icon name="truck" size={13} />Доставка по Кургану сегодня</span>
            </div>
            <div className="hdr__strip">
              <a href={settings.telegramUrl} target="_blank" rel="noreferrer" className="row gap-6">
                <Icon name="tg" size={13} />@{settings.telegram}
              </a>
              <Clock />
            </div>
          </div>

          <div className="hdr__main">
            <Link to="/" className="logo" aria-label="EKlimiks — на главную">
              <span className="logo__mark">EK</span>
              <span>
                <span className="logo__t">Eklimiks</span>
                <span className="logo__s">Apple store · trade-in · service</span>
              </span>
            </Link>

            <nav className="nav" aria-label="Основная навигация">
              {NAV.map(([to, label]) => (
                <NavLink key={to} to={to} className={({ isActive }) => `nav__link ${isActive ? 'is-on' : ''}`}>{label}</NavLink>
              ))}
            </nav>

            <div className="hdr__act">
              <button className="icon-btn btn--outline" onClick={() => setSearch(true)} aria-label="Поиск"><Icon name="search" size={17} /></button>
              <Link to="/favorites" className="icon-btn btn--outline" aria-label="Избранное">
                <Icon name="heart" size={17} />
                {favorites.length > 0 && <span className="icon-btn__n">{favorites.length}</span>}
              </Link>
              <Link to="/compare" className="icon-btn btn--outline" aria-label="Сравнение" title="Сравнение">
                <Icon name="chart" size={17} />
                {compare.length > 0 && <span className="icon-btn__n">{compare.length}</span>}
              </Link>
              <Link to="/cart" className="icon-btn btn--outline" aria-label="Корзина">
                <Icon name="cart" size={17} />
                {cartCount > 0 && <span className="icon-btn__n">{cartCount}</span>}
              </Link>

              {user ? (
                <div style={{ position: 'relative' }}>
                  <button className="icon-btn btn--outline" onClick={() => setUmenu((v) => !v)} aria-label="Личный кабинет" title={user.name}>
                    <Icon name={user.role === 'client' ? 'user' : 'shield'} size={17} />
                  </button>
                  {umenu && (
                    <div className="usermenu brackets">
                      <p className="usermenu__who">
                        <b>{user.name}</b>
                        <span>{user.email}</span>
                      </p>
                      <Link to="/account" className="usermenu__item" onClick={() => setUmenu(false)}>
                        <Icon name="user" size={15} />Личный кабинет
                      </Link>
                      {user.role !== 'client' && (
                        <Link to="/admin" className="usermenu__item" onClick={() => setUmenu(false)}>
                          <Icon name="lock" size={15} />Админ-панель
                        </Link>
                      )}
                      <button className="usermenu__item usermenu__item--out" onClick={() => { logout(); setUmenu(false) }}>
                        <Icon name="logout" size={15} />Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="icon-btn btn--outline" aria-label="Войти" title="Войти"><Icon name="user" size={17} /></Link>
              )}

              <button className="btn btn--sm hdr__cta btn--outline" onClick={onCallback} style={{ marginLeft: 4 }}>Заказать звонок</button>
              <button className="icon-btn burger btn--outline" onClick={() => setMenu(true)} aria-label="Меню"><Icon name="menu" size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      {menu && (
        <div className="mmenu">
          <div className="mmenu__head">
            <span className="logo">
              <span className="logo__mark">EK</span>
              <span className="logo__t">Eklimiks</span>
            </span>
            <button className="icon-btn btn--outline" onClick={() => setMenu(false)} aria-label="Закрыть"><Icon name="close" size={18} /></button>
          </div>
          <nav className="mmenu__links">
            {[['/', 'Главная'], ...NAV, ['/account', 'Личный кабинет']].map(([to, label], i) => (
              <NavLink key={to} to={to} className={({ isActive }) => `mmenu__link ${isActive ? 'is-on' : ''}`}>
                <i>{String(i + 1).padStart(2, '0')}</i>{label}
              </NavLink>
            ))}
          </nav>
          <div className="mmenu__foot">
            <a className="btn btn--tg btn--block" href={settings.telegramUrl} target="_blank" rel="noreferrer"><Icon name="tg" size={16} />Telegram-бот</a>
            <a className="btn btn--block btn--outline" href={`tel:${(settings.phone || '').replace(/\D/g, '')}`}><Icon name="phone" size={16} />{settings.phone}</a>
          </div>
        </div>
      )}

      <SearchModal open={search} onClose={() => setSearch(false)} />
    </>
  )
}

/* ═══════════════════ подвал ═══════════════════ */
export function Footer({ onCallback }) {
  const { settings } = useApp()
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr__grid">
          <div>
            <span className="logo" style={{ marginBottom: 16 }}>
              <span className="logo__mark">EK</span>
              <span>
                <span className="logo__t">Eklimiks</span>
                <span className="logo__s">с 2016 года</span>
              </span>
            </span>
            <p className="muted small" style={{ maxWidth: 320 }}>
              Магазин техники Apple с собственной сервисной зоной. Продаём, меняем по Trade-In,
              ремонтируем и бронируем технику онлайн.
            </p>
            <div className="btn-row" style={{ marginTop: 18 }}>
              <a className="btn btn--sm btn--tg" href={settings.telegramUrl} target="_blank" rel="noreferrer">
                <Icon name="tg" size={15} />@{settings.telegram}
              </a>
              <button className="btn btn--sm btn--outline" onClick={onCallback}>Перезвоните мне</button>
            </div>
          </div>

          <div>
            <p className="ftr__t">Каталог</p>
            <div className="ftr__l">
              <Link to="/catalog?category=iphone">iPhone</Link>
              <Link to="/catalog?category=mac">Mac</Link>
              <Link to="/catalog?category=ipad">iPad</Link>
              <Link to="/catalog?category=watch">Apple Watch</Link>
              <Link to="/catalog?category=audio">Аудио</Link>
              <Link to="/catalog?category=accessories">Аксессуары</Link>
            </div>
          </div>

          <div>
            <p className="ftr__t">Сервисы</p>
            <div className="ftr__l">
              <Link to="/trade-in">Trade-In — оценка онлайн</Link>
              <Link to="/repair">Ремонт и запись к мастеру</Link>
              <Link to="/reserve">Бронирование в салоне</Link>
              <Link to="/track">Проверить статус заказа</Link>
              <Link to="/picker">Подбор модели</Link>
              <Link to="/reviews">Отзывы клиентов</Link>
            </div>
          </div>

          <div>
            <p className="ftr__t">Контакты</p>
            <div className="ftr__l">
              <a href={`tel:${(settings.phone || '').replace(/\D/g, '')}`}>{settings.phone}</a>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
              <span>{settings.address}</span>
              <span>Пн–Вс 10:00–21:00</span>
              <Link to="/contacts">Все салоны на карте</Link>
              <Link to="/login">Вход для сотрудников</Link>
            </div>
          </div>
        </div>

        <div className="ftr__bot">
          <span>© {new Date().getFullYear()} EKlimiks. Учебный проект. Apple, iPhone, Mac, iPad, AirPods — товарные знаки Apple Inc.</span>
          <span className="row gap-14">
            <Link to="/about">О магазине</Link>
            <Link to="/contacts">Контакты</Link>
            <span>ИНН 7701234567</span>
          </span>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════ каркас ═══════════════════ */
export function Layout({ children }) {
  const [cb, setCb] = useState(false)
  const open = useCallback(() => setCb(true), [])
  const { toasts, settings } = useApp()
  const loc = useLocation()

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [loc.pathname])

  return (
    <>
      <span className="skip" tabIndex={0} />
      <Preloader />
      <div className="grain" aria-hidden="true" />
      <div className="rails" aria-hidden="true" />
      <ScrollProgress />
      <div className="app">
        <Header onCallback={open} />
        <main className="app__main" id="main">{children}</main>
        <Footer onCallback={open} />
      </div>
      <CallbackModal open={cb} onClose={() => setCb(false)} />
      <ToTop />
      <Cursor />
      <PageWipe enabled={settings.pageTransition !== false} />
      <Toasts items={toasts} />
    </>
  )
}

export { Decode }
