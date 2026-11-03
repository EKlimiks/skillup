import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, STATUS, ORDER_FLOW, REPAIR_FLOW } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { productImg, money, dateShort, dateTimeRu, num } from '../lib/format.js'
import { Icon, Empty, SectionHead, Field, ProductCard, Reveal } from '../components/ui.jsx'

const TABS = [
  ['overview', 'Обзор', 'chart'],
  ['orders', 'Мои заказы', 'box'],
  ['repairs', 'Ремонты', 'tool'],
  ['tradeins', 'Trade-In', 'recycle'],
  ['bookings', 'Брони', 'calendar'],
  ['bonus', 'Бонусы', 'gift'],
  ['favorites', 'Избранное', 'heart'],
  ['profile', 'Профиль', 'user'],
]

const stCls = (map, key) => 'st st--' + ((map[key] || {}).color || 'muted')

function Flow({ flow, status, map }) {
  const idx = flow.indexOf(status)
  return (
    <div className="steps">
      {flow.map((s, i) => (
        <span key={s} className={`step ${i < idx ? 'is-done' : i === idx ? 'is-now' : ''}`}>
          <i className="step__n">{String(i + 1).padStart(2, '0')}</i>{map[s].label}
        </span>
      ))}
    </div>
  )
}

export default function Account() {
  const { user, ready, favorites, toggleFavorite, addToCart, logout } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(null)
  const [all, setAll] = useState([])
  const [form, setForm] = useState({ name: '', phone: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    /* ждём восстановления сессии, иначе авторизованного выбросит на /login */
    if (!ready) return
    if (!user) { nav('/login'); return }
    api.profile().then((d) => {
      setData(d)
      setForm({ name: d.user.name, phone: d.user.phone })
    })
    api.products({}).then(setAll)
  }, [user, ready, nav])

  if (!user) return <div className="wrap section"><div className="skel" style={{ height: 320 }} /></div>
  if (!data) return <div className="wrap section"><div className="skel" style={{ height: 320 }} /></div>

  const favProducts = all.filter((p) => favorites.includes(p.slug))
  const totalSpent = data.orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const activeOrders = data.orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length

  const saveProfile = async (e) => {
    e.preventDefault()
    const u = await api.updateProfile(form)
    setData({ ...data, user: u })
    setSaved(true); setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="page-enter">
      <section className="section section--tight">
        <div className="wrap">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Личный кабинет</span>
          </div>

          <div className="between" style={{ marginBottom: 26, flexWrap: 'wrap' }}>
            <div className="row gap-20">
              <span className="master__av" style={{ width: 62, height: 62, fontSize: '1.2rem' }}>
                {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </span>
              <div>
                <h1 className="h2" style={{ fontSize: 'clamp(1.3rem,2.4vw,1.9rem)' }}>{user.name}</h1>
                <p className="muted small">{user.email} · роль: <b className="accent">{user.role}</b></p>
              </div>
            </div>
            <div className="btn-row">
              {user.role !== 'client' && <Link className="btn btn--sm btn--outline" to="/admin"><Icon name="lock" size={14} /> Админ-панель</Link>}
              <button className="btn btn--sm btn--quiet" onClick={() => { logout(); nav('/') }}><Icon name="logout" size={14} /> Выйти</button>
            </div>
          </div>

          <div className="dash">
            <aside className="dash__side panel">
              {TABS.map(([k, l, i]) => {
                const counts = { orders: data.orders.length, repairs: data.repairs.length, tradeins: data.tradeins.length, bookings: data.bookings.length, favorites: favProducts.length }
                return (
                  <button key={k} className={`dash__link ${tab === k ? 'is-on' : ''}`} onClick={() => setTab(k)}>
                    <Icon name={i} size={15} />{l}
                    {counts[k] ? <i>{counts[k]}</i> : null}
                  </button>
                )
              })}
            </aside>

            <div>
              {/* ── обзор ── */}
              {tab === 'overview' && (
                <div className="stack gap-20">
                  <div className="kpis">
                    <div className="kpi kpi--accent"><div className="kpi__l">Бонусы EK</div><div className="kpi__v">{num(user.bonus)}</div><p className="tiny muted">1 EK = 1 ₽</p></div>
                    <div className="kpi"><div className="kpi__l">Заказов</div><div className="kpi__v">{data.orders.length}</div><p className="tiny muted">{activeOrders} активных</p></div>
                    <div className="kpi"><div className="kpi__l">Куплено на</div><div className="kpi__v" style={{ fontSize: '1.15rem' }}>{money(totalSpent)}</div></div>
                    <div className="kpi"><div className="kpi__l">Заявок в сервис</div><div className="kpi__v">{data.repairs.length + data.tradeins.length}</div></div>
                  </div>

                  <div className="grid grid--2">
                    <div className="panel">
                      <p className="mono-label" style={{ marginBottom: 14 }}>Последний заказ</p>
                      {data.orders[0] ? (
                        <>
                          <div className="between" style={{ marginBottom: 12 }}>
                            <b className="num">{data.orders[0].number}</b>
                            <span className={stCls(STATUS.order, data.orders[0].status)}>{STATUS.order[data.orders[0].status].label}</span>
                          </div>
                          <p className="muted small">{data.orders[0].items.map((i) => i.name).join(', ')}</p>
                          <p className="num accent" style={{ marginTop: 10, fontSize: '1.15rem' }}>{money(data.orders[0].total)}</p>
                          <button className="btn btn--sm btn--outline" style={{ marginTop: 14 }} onClick={() => setTab('orders')}>Все заказы</button>
                        </>
                      ) : <p className="muted small">Заказов пока нет.</p>}
                    </div>

                    <div className="panel">
                      <p className="mono-label" style={{ marginBottom: 14 }}>Ближайшая запись</p>
                      {[...data.repairs, ...data.bookings].filter((x) => x.slotDate >= new Date().toISOString().slice(0, 10))[0] ? (
                        (() => {
                          const n = [...data.repairs, ...data.bookings].filter((x) => x.slotDate >= new Date().toISOString().slice(0, 10))[0]
                          return (
                            <>
                              <b>{n.number || `Бронь #${n.id}`}</b>
                              <p className="muted small" style={{ marginTop: 8 }}>
                                {new Date(n.slotDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {n.slotTime}
                              </p>
                              {n.device && <p className="tiny muted">{n.device}</p>}
                              {n.productSlug && <p className="tiny muted">{all.find((p) => p.slug === n.productSlug)?.name}</p>}
                            </>
                          )
                        })()
                      ) : <p className="muted small">Нет предстоящих визитов.</p>}
                    </div>
                  </div>

                  <div className="panel">
                    <p className="mono-label" style={{ marginBottom: 14 }}>Быстрые действия</p>
                    <div className="btn-row">
                      <Link className="btn btn--sm btn--outline" to="/trade-in"><Icon name="recycle" size={14} /> Оценить Trade-In</Link>
                      <Link className="btn btn--sm btn--outline" to="/repair"><Icon name="tool" size={14} /> Записаться в сервис</Link>
                      <Link className="btn btn--sm btn--outline" to="/reserve"><Icon name="box" size={14} /> Забронировать товар</Link>
                      <Link className="btn btn--sm btn--outline" to="/track"><Icon name="search" size={14} /> Отследить заказ</Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ── заказы ── */}
              {tab === 'orders' && (
                data.orders.length === 0 ? <Empty icon="box" title="Заказов пока нет" text="Оформите первый заказ — он появится здесь вместе со статусом." action={<Link className="btn btn--outline" to="/catalog">В каталог</Link>} /> : (
                  <div className="stack gap-14">
                    {data.orders.map((o) => (
                      <div className="panel" key={o.id}>
                        <div className="between" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                          <div>
                            <b className="num" style={{ fontSize: '1.05rem' }}>{o.number}</b>
                            <p className="tiny muted">{dateTimeRu(o.createdAt)} · {o.deliveryType === 'pickup' ? 'самовывоз' : 'курьер'}</p>
                          </div>
                          <span className={stCls(STATUS.order, o.status)}>{STATUS.order[o.status].label}</span>
                        </div>
                        <Flow flow={ORDER_FLOW} status={o.status} map={STATUS.order} />
                        <div className="hr" style={{ margin: '18px 0' }} />
                        {o.items.map((i) => (
                          <div className="between" key={i.slug + i.storage} style={{ padding: '7px 0' }}>
                            <span className="row gap-14">
                              <img src={productImg(i.slug, i.color)} alt="" width="42" height="42" style={{ objectFit: 'contain' }} />
                              <span>
                                <Link to={`/product/${i.slug}`} style={{ fontWeight: 600 }}>{i.name}</Link>
                                <span className="tiny muted" style={{ display: 'block' }}>{i.storage} × {i.qty}</span>
                              </span>
                            </span>
                            <span className="num">{money(i.price * i.qty)}</span>
                          </div>
                        ))}
                        <div className="kv kv--total"><span className="kv__k">Итого</span><span className="kv__v">{money(o.total)}</span></div>
                        <p className="tiny muted" style={{ marginTop: 10 }}>
                          {o.deliveryType === 'pickup'
                            ? <>Самовывоз: {new Date(o.slotDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {o.slotTime}</>
                            : <>Доставка: {o.address}</>}
                          {' '}· начислено +{o.bonusEarned} EK
                        </p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ── ремонты ── */}
              {tab === 'repairs' && (
                data.repairs.length === 0 ? <Empty icon="tool" title="Заявок на ремонт нет" text="Запишитесь в мастерскую — выберете мастера и свободное время." action={<Link className="btn btn--outline" to="/repair">Записаться</Link>} /> : (
                  <div className="stack gap-14">
                    {data.repairs.map((r) => (
                      <div className="panel" key={r.id}>
                        <div className="between" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                          <div>
                            <b className="num">{r.number}</b>
                            <p className="tiny muted">{r.device} · {dateTimeRu(r.createdAt)}</p>
                          </div>
                          <span className={stCls(STATUS.repair, r.status)}>{STATUS.repair[r.status].label}</span>
                        </div>
                        <Flow flow={REPAIR_FLOW} status={r.status} map={STATUS.repair} />
                        <div className="hr" style={{ margin: '18px 0' }} />
                        <p className="muted small"><b>Неисправность:</b> {r.issue || '—'}</p>
                        <div className="kv"><span className="kv__k">Визит</span><span className="kv__v">{new Date(r.slotDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {r.slotTime}</span></div>
                        <div className="kv"><span className="kv__k">Стоимость</span><span className="kv__v num">{r.price ? money(r.price) : 'уточняется'}</span></div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ── trade-in ── */}
              {tab === 'tradeins' && (
                data.tradeins.length === 0 ? <Empty icon="recycle" title="Заявок Trade-In нет" text="Оцените устройство онлайн — это займёт минуту." action={<Link className="btn btn--outline" to="/trade-in">Оценить</Link>} /> : (
                  <div className="stack gap-14">
                    {data.tradeins.map((t) => (
                      <div className="panel" key={t.id}>
                        <div className="between" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
                          <div>
                            <b>{t.model}</b>
                            <p className="tiny muted">{t.storage} · состояние: {t.condition} · АКБ {t.battery}%</p>
                          </div>
                          <span className={stCls(STATUS.tradein, t.status)}>{STATUS.tradein[t.status].label}</span>
                        </div>
                        <div className="kv"><span className="kv__k">Предварительная оценка</span><span className="kv__v num">{money(t.estimated)}</span></div>
                        {t.finalPrice != null && <div className="kv"><span className="kv__k">Подтверждённая сумма</span><span className="kv__v num accent">{money(t.finalPrice)}</span></div>}
                        <p className="tiny muted" style={{ marginTop: 10 }}>Заявка от {dateShort(t.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* ── брони ── */}
              {tab === 'bookings' && (
                data.bookings.length === 0 ? <Empty icon="calendar" title="Броней нет" text="Забронируйте товар в салоне — держим 48 часов бесплатно." action={<Link className="btn btn--outline" to="/reserve">Забронировать</Link>} /> : (
                  <div className="stack gap-14">
                    {data.bookings.map((b) => {
                      const p = all.find((x) => x.slug === b.productSlug)
                      return (
                        <div className="panel row gap-20 wrapflex" key={b.id}>
                          {p && <img src={productImg(p.slug, p.colors[0].id)} alt="" width="96" height="96" style={{ objectFit: 'contain' }} />}
                          <div className="grow">
                            <div className="between" style={{ flexWrap: 'wrap' }}>
                              <b>{p ? p.name : b.productSlug}</b>
                              <span className={stCls(STATUS.booking, b.status)}>{STATUS.booking[b.status].label}</span>
                            </div>
                            <p className="muted small" style={{ marginTop: 8 }}>
                              <Icon name="pin" size={13} /> {new Date(b.slotDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {b.slotTime}
                            </p>
                            <p className="tiny muted">Бронь #{String(b.id).padStart(5, '0')} · создана {dateShort(b.createdAt)}</p>
                          </div>
                          {p && <button className="btn btn--sm btn--outline" onClick={() => addToCart(p)}><Icon name="cart" size={14} /> В корзину</button>}
                        </div>
                      )
                    })}
                  </div>
                )
              )}

              {/* ── бонусы ── */}
              {tab === 'bonus' && (
                <div className="stack gap-18">
                  <div className="panel panel--accent">
                    <p className="mono-label">Бонусный счёт EKlimiks</p>
                    <div className="ti__val" style={{ marginTop: 12 }}>{num(user.bonus)} <span style={{ fontSize: '1.1rem' }}>EK</span></div>
                    <p className="muted small" style={{ marginTop: 10 }}>1 EK = 1 ₽. Начисляем 2% от суммы каждого заказа, списываем до 30% стоимости покупки.</p>
                    <div className="bar" style={{ marginTop: 18 }}><div className="bar__fill" style={{ width: `${Math.min(100, (user.bonus / 10000) * 100)}%` }} /></div>
                    <p className="tiny muted" style={{ marginTop: 8 }}>До статуса «Золото» осталось {Math.max(0, 10000 - user.bonus).toLocaleString('ru-RU')} EK — это +5% к бонусам.</p>
                  </div>

                  <div className="grid grid--3">
                    {[
                      ['Приветственные', '+1 000 EK', 'За регистрацию в личном кабинете'],
                      ['За покупки', '+2%', 'От суммы каждого заказа'],
                      ['За Trade-In', '+5%', 'Дополнительно при зачёте в новый заказ'],
                    ].map(([t, v, d]) => (
                      <div className="kpi" key={t}>
                        <div className="kpi__l">{t}</div>
                        <div className="kpi__v accent">{v}</div>
                        <p className="tiny muted">{d}</p>
                      </div>
                    ))}
                  </div>

                  <div className="panel">
                    <p className="mono-label" style={{ marginBottom: 12 }}>История начислений</p>
                    {data.orders.length === 0 ? <p className="muted small">Пока пусто.</p> : data.orders.map((o) => (
                      <div className="kv" key={o.id}>
                        <span className="kv__k">{o.number} · {dateShort(o.createdAt)}</span>
                        <span className="kv__v num ok">+{o.bonusEarned} EK</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── избранное ── */}
              {tab === 'favorites' && (
                favProducts.length === 0 ? <Empty icon="heart" title="Избранное пусто" text="Нажимайте на сердечко в карточке товара, чтобы сохранить модель." action={<Link className="btn btn--outline" to="/catalog">В каталог</Link>} /> : (
                  <div className="grid grid--3">
                    {favProducts.map((p, i) => (
                      <ProductCard key={p.slug} p={p} delay={i} onAdd={addToCart} fav onFav={toggleFavorite} />
                    ))}
                  </div>
                )
              )}

              {/* ── профиль ── */}
              {tab === 'profile' && (
                <div className="grid grid--2">
                  <form className="panel stack gap-14" onSubmit={saveProfile}>
                    <p className="mono-label">Личные данные</p>
                    <Field label="Имя и фамилия">
                      <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                    <Field label="Телефон">
                      <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" />
                    </Field>
                    <Field label="E-mail" hint="E-mail менять нельзя — он используется для входа">
                      <input className="input" value={data.user.email} disabled />
                    </Field>
                    <button className="btn btn--primary">{saved ? <><Icon name="check" size={15} /> Сохранено</> : 'Сохранить изменения'}</button>
                  </form>

                  <div className="panel">
                    <p className="mono-label" style={{ marginBottom: 14 }}>Сводка аккаунта</p>
                    <div className="kv"><span className="kv__k">Клиент с</span><span className="kv__v">{dateShort(data.user.createdAt)}</span></div>
                    <div className="kv"><span className="kv__k">Роль</span><span className="kv__v accent">{data.user.role}</span></div>
                    <div className="kv"><span className="kv__k">Всего заказов</span><span className="kv__v num">{data.orders.length}</span></div>
                    <div className="kv"><span className="kv__k">Сумма покупок</span><span className="kv__v num">{money(totalSpent)}</span></div>
                    <div className="kv"><span className="kv__k">Бонусы</span><span className="kv__v num accent">{num(user.bonus)} EK</span></div>
                    <div className="kv"><span className="kv__k">Заявок в сервис</span><span className="kv__v num">{data.repairs.length}</span></div>
                    <div className="kv"><span className="kv__k">Trade-In заявок</span><span className="kv__v num">{data.tradeins.length}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
