import React, { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { STORES } from '../data/catalog.js'
import { productImg, money, upcomingDates, dayNum, monthRu, weekdayRu } from '../lib/format.js'
import { Icon, Reveal, SectionHead, Field, Accordion } from '../components/ui.jsx'

const HOURS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

const FAQ = [
  { q: 'Сколько держится бронь?', a: '48 часов с момента подтверждения. Если не успеваете — напишите в Telegram-бот, продлим ещё на сутки.' },
  { q: 'Бронь платная?', a: 'Нет, бронирование бесплатное и ни к чему не обязывает. Оплата — только при получении в салоне.' },
  { q: 'Товар точно будет ждать?', a: 'Да, забронированная единица снимается с продажи и хранится с вашим номером заявки. Если товар закончится по ошибке склада — предложим аналог со скидкой.' },
  { q: 'Можно ли посмотреть товар перед оплатой?', a: 'Конечно. В салоне вы распаковываете устройство, проверяете IMEI, комплектацию и работоспособность, и только потом оплачиваете.' },
]

export default function Reserve() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { user, toast } = useApp()
  const [list, setList] = useState([])
  const [slug, setSlug] = useState(params.get('product') || '')
  const [storeId, setStoreId] = useState(STORES[0].id)
  const [date, setDate] = useState(upcomingDates(10)[0])
  const [time, setTime] = useState('')
  const [contact, setContact] = useState({ name: '', phone: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  const dates = upcomingDates(10)
  const datesShort = dates.slice(0, 7)

  useEffect(() => { api.products({ sort: 'popular' }).then(setList) }, [])
  useEffect(() => { if (user) setContact({ name: user.name, phone: user.phone }) }, [user])

  const product = list.find((p) => p.slug === slug)
  const store = STORES.find((s) => s.id === storeId)

  const submit = async (e) => {
    e.preventDefault()
    if (!product) { toast('Выберите товар', 'danger'); return }
    if (!time) { toast('Выберите время визита', 'danger'); return }
    if (!contact.name.trim() || contact.phone.replace(/\D/g, '').length < 10) { toast('Заполните имя и телефон', 'danger'); return }
    setBusy(true)
    const b = await api.createBooking({
      productSlug: product.slug, storeId, slotDate: date, slotTime: time,
      customerName: contact.name, customerPhone: contact.phone,
    })
    setBusy(false); setDone(b)
    toast('Товар забронирован на 48 часов')
  }

  if (done) {
    return (
      <div className="page-enter">
        <section className="section">
          <div className="wrap wrap--narrow">
            <div className="panel panel--accent brackets center" style={{ padding: 'clamp(28px,5vw,56px)' }}>
              <Icon name="box" size={44} className="accent" />
              <h1 className="h2" style={{ margin: '18px 0 12px' }}>Товар забронирован</h1>
              <p className="lead" style={{ margin: '0 auto' }}>
                Заявка <b className="accent num">BR-{String(done.id).padStart(5, '0')}</b>. Ждём вас
                {' '}{new Date(done.slotDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {done.slotTime}
                {' '}по адресу {store.address}.
              </p>
              <div className="btn-row" style={{ justifyContent: 'center', marginTop: 24 }}>
                <Link className="btn btn--primary" to="/account">В личный кабинет</Link>
                <Link className="btn btn--outline" to="/catalog">Продолжить покупки</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <section className="section section--tight">
        <div className="wrap">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Бронирование</span>
          </div>
          <SectionHead idx="📦 БРОНИРОВАНИЕ" title="Отложить товар в салоне"
            sub="Бесплатно держим товар 48 часов. Выбираете салон и удобное время — заберёте без ожидания и очереди." />

          <form onSubmit={submit}>
            <div className="ti">
              <div className="stack gap-22">
                {/* товар */}
                <Reveal className="panel">
                  <h3 className="h3" style={{ marginBottom: 18 }}>01 · Товар</h3>
                  {product ? (
                    <div className="row gap-20 wrapflex">
                      <img src={productImg(product.slug, product.colors[0].id)} alt={product.name}
                        width="150" height="150" style={{ objectFit: 'contain' }} />
                      <div className="grow">
                        <h4 className="card__title">{product.name}</h4>
                        <p className="muted small" style={{ marginTop: 6 }}>{product.subtitle}</p>
                        <p className="num accent" style={{ marginTop: 8, fontSize: '1.1rem' }}>{money(product.price)}</p>
                        <button type="button" className="btn btn--quiet btn--sm" style={{ marginTop: 8 }} onClick={() => setSlug('')}>
                          Выбрать другой товар
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="field">
                      <span className="field__label">Выберите модель</span>
                      <select className="select" value={slug} onChange={(e) => setSlug(e.target.value)} required>
                        <option value="">— выберите из каталога —</option>
                        {list.map((p) => <option key={p.slug} value={p.slug}>{p.name} · {money(p.price)}</option>)}
                      </select>
                      <span className="field__hint">Показаны позиции с наибольшим спросом.</span>
                    </div>
                  )}
                </Reveal>

                {/* салон */}
                <Reveal delay={1} className="panel">
                  <h3 className="h3" style={{ marginBottom: 18 }}>02 · Салон</h3>
                  <div className="stack gap-10">
                    {STORES.map((s) => (
                      <button type="button" key={s.id} className={`store ${storeId === s.id ? 'is-on' : ''}`} onClick={() => setStoreId(s.id)}>
                        <span className="svc__ico" style={{ width: 40, height: 40, flex: 'none' }}><Icon name="pin" size={17} /></span>
                        <span className="grow">
                          <b style={{ display: 'block', fontWeight: 600 }}>{s.name}</b>
                          <span className="tiny muted" style={{ display: 'block' }}>{s.address} · м. {s.metro}</span>
                          <span className="tiny muted">{s.hours} · {s.phone}</span>
                        </span>
                        {storeId === s.id && <Icon name="check" size={18} className="accent" />}
                      </button>
                    ))}
                  </div>
                </Reveal>

                {/* время */}
                <Reveal delay={2} className="panel">
                  <h3 className="h3" style={{ marginBottom: 18 }}>03 · Дата и время</h3>
                  <div className="dates" style={{ marginBottom: 20 }}>
                    {datesShort.map((d) => (
                      <button type="button" key={d} className={`date ${date === d ? 'is-on' : ''}`} onClick={() => { setDate(d); setTime('') }}>
                        <div className="date__d">{dayNum(d)}</div>
                        <div className="date__m">{monthRu(d)}</div>
                        <div className="date__m" style={{ color: 'var(--muted-2)' }}>{weekdayRu(d)}</div>
                      </button>
                    ))}
                  </div>
                  <span className="field__label">Свободное время</span>
                  <div className="slots" style={{ marginTop: 10 }}>
                    {HOURS.map((t) => (
                      <button type="button" key={t} className={`slot ${time === t ? 'is-on' : ''}`} onClick={() => setTime(t)}>{t}</button>
                    ))}
                  </div>
                </Reveal>

                {/* контакты */}
                <Reveal delay={3} className="panel">
                  <h3 className="h3" style={{ marginBottom: 18 }}>04 · Контакты</h3>
                  <div className="grid grid--2" style={{ gap: 14 }}>
                    <Field label="Имя *">
                      <input className="input" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Иван" />
                    </Field>
                    <Field label="Телефон *">
                      <input className="input" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+7 (___) ___-__-__" inputMode="tel" />
                    </Field>
                  </div>
                  <button className="btn btn--primary btn--block" style={{ marginTop: 16 }} disabled={busy}>
                    {busy ? <span className="spinner" /> : <Icon name="box" size={16} />} Забронировать бесплатно
                  </button>
                  <p className="tiny muted" style={{ marginTop: 10 }}>Оплата — только при получении в салоне. Бронь держится 48 часов.</p>
                </Reveal>
              </div>

              {/* итог */}
              <aside className="ti__sum">
                <div className="panel panel--accent brackets">
                  <span className="mono-label">Бронь</span>
                  <h4 className="h4" style={{ margin: '12px 0 16px' }}>{product ? product.name : 'товар не выбран'}</h4>
                  <div className="kv"><span className="kv__k">Салон</span><span className="kv__v" style={{ maxWidth: 180 }}>{store.name}</span></div>
                  <div className="kv"><span className="kv__k">Адрес</span><span className="kv__v small" style={{ maxWidth: 180 }}>{store.address}</span></div>
                  <div className="kv"><span className="kv__k">Дата</span><span className="kv__v">{dayNum(date)} {monthRu(date)}</span></div>
                  <div className="kv"><span className="kv__k">Время</span><span className="kv__v">{time || '— не выбрано'}</span></div>
                  <div className="kv kv--total"><span className="kv__k">К оплате в салоне</span><span className="kv__v">{product ? money(product.price) : '0 ₽'}</span></div>
                  <p className="tiny muted" style={{ marginTop: 14 }}>Сейчас платить ничего не нужно.</p>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap wrap--narrow">
          <SectionHead idx="ВОПРОСЫ" title="О бронировании" />
          <Accordion items={FAQ} />
        </div>
      </section>
    </div>
  )
}
