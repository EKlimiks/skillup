import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { STORES } from '../data/catalog.js'
import { money, upcomingDates, dayNum, monthRu } from '../lib/format.js'
import { Icon, Field, SectionHead } from '../components/ui.jsx'

const HOURS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

export default function Checkout() {
  const { cart, cartTotal, user, clearCart, toast } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const promo = loc.state?.promo || null

  const [deliveryType, setDeliveryType] = useState('pickup')
  const [storeId, setStoreId] = useState(STORES[0].id)
  const [date, setDate] = useState(upcomingDates(7)[0])
  const [time, setTime] = useState('')
  const [address, setAddress] = useState('')
  const [contact, setContact] = useState({ name: user ? user.name : '', phone: user ? user.phone : '' })
  const [comment, setComment] = useState('')
  const [pay, setPay] = useState('card')
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState(null)

  const dates = upcomingDates(7).slice(0, 7)
  const items = cart.map((i) => ({ ...i }))

  const discount = promo ? (() => { const d = { EKLIMIKS10: 10, STUDENT7: 7, TRADEIN5: 5 }[promo] || 0; return Math.round((cartTotal * d) / 100) })() : 0
  const deliveryFee = deliveryType === 'courier' && cartTotal - discount < 50000 ? 400 : 0
  const total = cartTotal - discount + deliveryFee

  const submit = async (e) => {
    e.preventDefault()
    if (!items.length) { toast('Корзина пуста', 'danger'); return }
    if (!contact.name.trim() || contact.phone.replace(/\D/g, '').length < 10) { toast('Заполните имя и телефон', 'danger'); return }
    if (deliveryType === 'courier' && address.trim().length < 6) { toast('Укажите адрес доставки', 'danger'); return }
    if (deliveryType === 'pickup' && !time) { toast('Выберите время самовывоза', 'danger'); return }
    setBusy(true)
    try {
      const o = await api.createOrder({
        items, promo, deliveryType, address,
        storeId, slotDate: deliveryType === 'pickup' ? date : '', slotTime: deliveryType === 'pickup' ? time : '',
        customerName: contact.name, customerPhone: contact.phone, comment,
      })
      setOrder(o); clearCart()
      toast(`Заказ ${o.number} оформлен`)
    } catch (err) { toast(err.message || 'Не удалось оформить заказ', 'danger') }
    setBusy(false)
  }

  if (order) {
    return (
      <div className="page-enter">
        <section className="section">
          <div className="wrap wrap--narrow">
            <div className="panel panel--accent brackets center" style={{ padding: 'clamp(28px,5vw,58px)' }}>
              <Icon name="check" size={46} className="ok" />
              <h1 className="h2" style={{ margin: '18px 0 12px' }}>Заказ {order.number} оформлен</h1>
              <p className="lead" style={{ margin: '0 auto' }}>
                {order.deliveryType === 'pickup'
                  ? <>Заберите {new Date(order.slotDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {order.slotTime} по адресу {STORES.find((s) => s.id === order.storeId)?.address}.</>
                  : <>Курьер привезёт заказ по адресу {order.address} в течение дня.</>}
              </p>

              <div className="panel" style={{ textAlign: 'left', marginTop: 26, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
                {order.items.map((i) => (
                  <div className="kv" key={i.slug + i.storage}>
                    <span className="kv__k">{i.name} · {i.storage} × {i.qty}</span>
                    <span className="kv__v num">{money(i.price * i.qty)}</span>
                  </div>
                ))}
                {order.discount > 0 && <div className="kv"><span className="kv__k">Скидка по промокоду</span><span className="kv__v num ok">−{money(order.discount)}</span></div>}
                {order.delivery > 0 && <div className="kv"><span className="kv__k">Доставка</span><span className="kv__v num">{money(order.delivery)}</span></div>}
                <div className="kv kv--total"><span className="kv__k">Итого</span><span className="kv__v">{money(order.total)}</span></div>
                <p className="tiny muted" style={{ marginTop: 14 }}>
                  Начислено <b className="accent">+{order.bonusEarned.toLocaleString('ru-RU')} EK</b> бонусов.
                </p>
              </div>

              <div className="btn-row" style={{ justifyContent: 'center', marginTop: 24 }}>
                <Link className="btn btn--primary" to="/account">Мои заказы</Link>
                <Link className="btn btn--outline" to="/track">Отследить заказ</Link>
                <Link className="btn btn--outline" to="/catalog">В каталог</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="page-enter">
        <section className="section">
          <div className="wrap wrap--narrow center" style={{ padding: '70px 0' }}>
            <h1 className="h2">Корзина пуста</h1>
            <p className="muted" style={{ margin: '14px 0 22px' }}>Добавьте товары, чтобы оформить заказ.</p>
            <Link className="btn btn--primary" to="/catalog">В каталог</Link>
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
            <Link to="/cart">Корзина</Link><span className="crumbs__sep">/</span><span className="accent">Оформление</span>
          </div>
          <SectionHead idx="ОФОРМЛЕНИЕ" title="Завершите заказ"
            sub="Проверьте состав, выберите способ получения и оплаты. Данные защищены." />

          <form onSubmit={submit}>
            <div className="ti">
              <div className="stack gap-22">
                {/* получение */}
                <div className="panel">
                  <h3 className="h3" style={{ marginBottom: 18 }}>01 · Способ получения</h3>
                  <div className="grid grid--2" style={{ gap: 10, marginBottom: 22 }}>
                    <button type="button" className={`ti__model ${deliveryType === 'pickup' ? 'is-on' : ''}`}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }} onClick={() => setDeliveryType('pickup')}>
                      <span style={{ fontWeight: 600 }}><Icon name="box" size={15} /> Самовывоз из салона</span>
                      <span className="tiny muted">Бесплатно, сегодня или в удобное время</span>
                    </button>
                    <button type="button" className={`ti__model ${deliveryType === 'courier' ? 'is-on' : ''}`}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }} onClick={() => setDeliveryType('courier')}>
                      <span style={{ fontWeight: 600 }}><Icon name="truck" size={15} /> Курьер по Кургану</span>
                      <span className="tiny muted">400 ₽, бесплатно от 50 000 ₽</span>
                    </button>
                  </div>

                  {deliveryType === 'pickup' ? (
                    <div className="stack gap-20">
                      <div className="field">
                        <span className="field__label">Салон</span>
                        <div className="stack gap-8">
                          {STORES.map((s) => (
                            <button type="button" key={s.id} className={`store ${storeId === s.id ? 'is-on' : ''}`} onClick={() => setStoreId(s.id)}>
                              <span className="svc__ico" style={{ width: 38, height: 38, flex: 'none' }}><Icon name="pin" size={16} /></span>
                              <span className="grow">
                                <b style={{ display: 'block', fontWeight: 600 }}>{s.name}</b>
                                <span className="tiny muted">{s.address}</span>
                              </span>
                              {storeId === s.id && <Icon name="check" size={17} className="accent" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="field">
                        <span className="field__label">Дата</span>
                        <div className="dates">
                          {dates.map((d) => (
                            <button type="button" key={d} className={`date ${date === d ? 'is-on' : ''}`} onClick={() => { setDate(d); setTime('') }}>
                              <div className="date__d">{dayNum(d)}</div>
                              <div className="date__m">{monthRu(d)}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="field">
                        <span className="field__label">Время самовывоза</span>
                        <div className="slots">
                          {HOURS.map((t) => (
                            <button type="button" key={t} className={`slot ${time === t ? 'is-on' : ''}`} onClick={() => setTime(t)}>{t}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Field label="Адрес доставки *" hint="Улица, дом, квартира, подъезд и этаж">
                      <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Курган, ул. Куйбышева, 12, кв. 41" />
                    </Field>
                  )}
                </div>

                {/* контакты */}
                <div className="panel">
                  <h3 className="h3" style={{ marginBottom: 18 }}>02 · Получатель</h3>
                  <div className="grid grid--2" style={{ gap: 14 }}>
                    <Field label="Имя и фамилия *">
                      <input className="input" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Иван Петров" />
                    </Field>
                    <Field label="Телефон *">
                      <input className="input" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+7 (___) ___-__-__" inputMode="tel" />
                    </Field>
                  </div>
                  <Field label="Комментарий к заказу">
                    <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Позвонить за час, нужен чек на организацию…" />
                  </Field>
                </div>

                {/* оплата */}
                <div className="panel">
                  <h3 className="h3" style={{ marginBottom: 18 }}>03 · Оплата</h3>
                  <div className="stack gap-10">
                    {[
                      ['card', 'Картой онлайн', 'Visa, Mastercard, МИР. Безопасный платёж'],
                      ['cash', 'При получении', 'Наличными или картой курьеру либо в салоне'],
                      ['installment', 'Рассрочка 0%', '6, 12 или 24 месяца без первого взноса'],
                    ].map(([v, t, d]) => (
                      <button type="button" key={v} className={`ti__model ${pay === v ? 'is-on' : ''}`} style={{ alignItems: 'flex-start' }} onClick={() => setPay(v)}>
                        <span className="grow">
                          <b style={{ display: 'block', fontWeight: 600 }}>{t}</b>
                          <span className="tiny muted">{d}</span>
                        </span>
                        {pay === v && <Icon name="check" size={17} className="accent" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* итог */}
              <aside className="ti__sum">
                <div className="panel panel--accent brackets">
                  <span className="mono-label">Ваш заказ</span>
                  <div style={{ margin: '16px 0' }}>
                    {items.map((i) => (
                      <div className="kv" key={i.slug + i.storage + i.color}>
                        <span className="kv__k">{i.name} × {i.qty}</span>
                        <span className="kv__v num">{money(i.price * i.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="kv"><span className="kv__k">Товары</span><span className="kv__v num">{money(cartTotal)}</span></div>
                  {discount > 0 && <div className="kv"><span className="kv__k">Промокод {promo}</span><span className="kv__v num ok">−{money(discount)}</span></div>}
                  <div className="kv"><span className="kv__k">Доставка</span><span className="kv__v num">{deliveryFee ? money(deliveryFee) : 'бесплатно'}</span></div>
                  <div className="kv kv--total"><span className="kv__k">Итого</span><span className="kv__v">{money(total)}</span></div>

                  <button className="btn btn--primary btn--block" style={{ marginTop: 18 }} disabled={busy}>
                    {busy ? <span className="spinner" /> : <Icon name="check" size={16} />} Подтвердить заказ
                  </button>
                  <p className="tiny muted" style={{ marginTop: 12 }}>
                    Бонусами вернётся <b className="accent">+{Math.round(total * 0.02).toLocaleString('ru-RU')} EK</b>.
                  </p>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
