import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, STATUS, ORDER_FLOW, REPAIR_FLOW } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { CATEGORIES } from '../data/catalog.js'
import { productImg, money, num, dateShort, dateTimeRu } from '../lib/format.js'
import { Icon, Empty, Field, Modal, Spark, Reveal } from '../components/ui.jsx'

const stCls = (map, key) => 'st st--' + ((map[key] || {}).color || 'muted')

const SECTIONS = [
  ['dash', 'Дашборд', 'chart'],
  ['orders', 'Заказы', 'box'],
  ['products', 'Товары', 'tag'],
  ['repairs', 'Ремонты', 'tool'],
  ['tradeins', 'Trade-In', 'recycle'],
  ['bookings', 'Брони', 'calendar'],
  ['leads', 'Заявки', 'phone'],
  ['reviews', 'Отзывы', 'star'],
  ['users', 'Пользователи', 'user'],
  ['promos', 'Промокоды', 'gift'],
  ['content', 'Контент сайта', 'edit'],
]

export default function Admin() {
  const { user, ready, toast, setSettings } = useApp()
  const nav = useNavigate()
  const [sec, setSec] = useState('dash')
  const [dash, setDash] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState(null)
  const [settings, setLocal] = useState(null)
  const [search, setSearch] = useState('')

  const allowed = ready && user && (user.role === 'admin' || user.role === 'manager')

  /* ждём восстановления сессии, иначе авторизованного выбросит на /login */
  useEffect(() => { if (ready && !user) nav('/login') }, [ready, user, nav])

  useEffect(() => {
    if (!allowed) return
    setLoading(true)
    if (sec === 'dash') api.adminDashboard().then((d) => { setDash(d); setLoading(false) })
    else if (sec === 'content') api.settings().then((s) => { setLocal(s); setLoading(false) })
    else api.adminList(sec).then((r) => { setRows(r); setLoading(false) })
  }, [sec, allowed])

  const reload = () => {
    if (sec === 'dash') api.adminDashboard().then(setDash)
    else if (sec !== 'content') api.adminList(sec).then(setRows)
  }

  if (!allowed) {
    return (
      <div className="wrap section">
        <Empty icon="lock" title="Доступ запрещён" text="Раздел доступен только администратору и менеджеру."
          action={<Link className="btn btn--primary" to="/login">Войти как сотрудник</Link>} />
      </div>
    )
  }

  const setStatus = async (entity, id, status) => {
    await api.adminSetStatus(entity, id, status)
    toast('Статус обновлён'); reload()
  }

  return (
    <div className="page-enter">
      <section className="section section--tight">
        <div className="wrap">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><Link to="/account">Кабинет</Link>
            <span className="crumbs__sep">/</span><span className="accent">Админ-панель</span>
          </div>

          <div className="between" style={{ marginBottom: 26, flexWrap: 'wrap' }}>
            <div>
              <span className="mono-label accent">🔐 ADMIN · {user.role}</span>
              <h1 className="h2" style={{ marginTop: 10 }}>Панель управления</h1>
              <p className="muted small" style={{ marginTop: 8 }}>Заявки, товары, пользователи и контент сайта — в одном месте.</p>
            </div>
            <div className="btn-row">
              <Link className="btn btn--sm btn--outline" to="/"><Icon name="eye" size={14} /> Открыть сайт</Link>
              <button className="btn btn--sm btn--outline" onClick={reload}><Icon name="spark" size={14} /> Обновить</button>
            </div>
          </div>

          <div className="dash">
            <aside className="dash__side panel">
              {SECTIONS.map(([k, l, i]) => {
                const badge = dash && {
                  orders: dash.counts.newOrders, repairs: dash.counts.newRepairs,
                  reviews: dash.counts.pendingReviews, leads: dash.counts.leads,
                }[k]
                return (
                  <button key={k} className={`dash__link ${sec === k ? 'is-on' : ''}`} onClick={() => setSec(k)}>
                    <Icon name={i} size={15} />{l}{badge ? <i>{badge}</i> : null}
                  </button>
                )
              })}
            </aside>

            <div>
              {loading ? <div className="skel" style={{ height: 320 }} /> : (
                <>
                  {/* ══ дашборд ══ */}
                  {sec === 'dash' && dash && (
                    <div className="stack gap-20">
                      <div className="kpis">
                        <div className="kpi kpi--accent"><div className="kpi__l">Выручка</div><div className="kpi__v" style={{ fontSize: '1.2rem' }}>{money(dash.revenue)}</div><p className="tiny muted">средний чек {money(dash.avgOrder)}</p></div>
                        <div className="kpi"><div className="kpi__l">Заказы</div><div className="kpi__v">{dash.counts.orders}</div><p className="tiny muted">{dash.counts.newOrders} новых</p></div>
                        <div className="kpi"><div className="kpi__l">Ремонты</div><div className="kpi__v">{dash.counts.repairs}</div><p className="tiny muted">{dash.counts.newRepairs} новых</p></div>
                        <div className="kpi"><div className="kpi__l">Trade-In</div><div className="kpi__v">{dash.counts.tradeins}</div></div>
                        <div className="kpi"><div className="kpi__l">Брони</div><div className="kpi__v">{dash.counts.bookings}</div></div>
                        <div className="kpi"><div className="kpi__l">Клиенты</div><div className="kpi__v">{dash.counts.users}</div></div>
                        <div className="kpi"><div className="kpi__l">Отзывы</div><div className="kpi__v">{dash.counts.reviews}</div><p className="tiny muted">{dash.counts.pendingReviews} на модерации</p></div>
                        <div className="kpi"><div className="kpi__l">Мало на складе</div><div className="kpi__v warn">{dash.counts.lowStock}</div><p className="tiny muted">позиций ≤ 5 шт</p></div>
                      </div>

                      <div className="grid grid--2">
                        <div className="panel">
                          <p className="mono-label" style={{ marginBottom: 16 }}>Выручка за 14 дней</p>
                          <Spark data={dash.revenueByDay} label={`Всего: ${money(dash.revenue)}`} />
                        </div>
                        <div className="panel">
                          <p className="mono-label" style={{ marginBottom: 16 }}>Топ товаров</p>
                          {dash.topProducts.length === 0 ? <p className="muted small">Нет данных.</p> : dash.topProducts.map((p) => (
                            <div className="kv" key={p.slug}>
                              <span className="kv__k">{p.name}</span>
                              <span className="kv__v num">{money(p.sum)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid--2">
                        <div className="panel">
                          <p className="mono-label" style={{ marginBottom: 14 }}>Последние заказы</p>
                          {dash.recentOrders.length === 0 ? <p className="muted small">Пока нет.</p> : dash.recentOrders.map((o) => (
                            <div className="between" key={o.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                              <span><b className="num">{o.number}</b><span className="tiny muted" style={{ display: 'block' }}>{o.customerName}</span></span>
                              <span className="row gap-10"><span className="num">{money(o.total)}</span><span className={stCls(STATUS.order, o.status)}>{STATUS.order[o.status].label}</span></span>
                            </div>
                          ))}
                        </div>
                        <div className="panel">
                          <p className="mono-label" style={{ marginBottom: 14 }}>Новые заявки</p>
                          {dash.recentLeads.map((l) => (
                            <div className="between" key={l.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                              <span><b>{l.name}</b><span className="tiny muted" style={{ display: 'block' }}>{l.phone}</span></span>
                              <span className={stCls(STATUS.lead, l.status)}>{STATUS.lead[l.status].label}</span>
                            </div>
                          ))}
                          {dash.recentRepairs.map((r) => (
                            <div className="between" key={'r' + r.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                              <span><b className="num">{r.number}</b><span className="tiny muted" style={{ display: 'block' }}>{r.device}</span></span>
                              <span className={stCls(STATUS.repair, r.status)}>{STATUS.repair[r.status].label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ заказы ══ */}
                  {sec === 'orders' && (
                    <div className="stack gap-14">
                      {rows.length === 0 ? <Empty icon="box" title="Заказов нет" /> : rows.map((o) => (
                        <div className="panel" key={o.id}>
                          <div className="between" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                            <div>
                              <b className="num">{o.number}</b>
                              <p className="tiny muted">{o.customerName} · {o.customerPhone} · {dateTimeRu(o.createdAt)}</p>
                            </div>
                            <span className="num" style={{ fontSize: '1.1rem' }}>{money(o.total)}</span>
                          </div>
                          <p className="muted small" style={{ marginBottom: 14 }}>{o.items.map((i) => `${i.name} (${i.storage}) ×${i.qty}`).join(', ')}</p>
                          <div className="toolbar__row">
                            <span className="mono-label">Статус:</span>
                            <select className="select" style={{ width: 190 }} value={o.status} onChange={(e) => setStatus('orders', o.id, e.target.value)}>
                              {Object.entries(STATUS.order).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <span className={stCls(STATUS.order, o.status)}>{STATUS.order[o.status].label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ══ товары ══ */}
                  {sec === 'products' && (
                    <div className="stack gap-14">
                      <div className="between">
                        <input className="input" placeholder="Поиск по названию…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
                        <button className="btn btn--primary btn--sm" onClick={() => setEdit({
                          name: '', slug: '', subtitle: '', price: 0, category: 'iphone', stock: 0,
                          storages: ['—'], colors: [{ id: 'black', name: 'Чёрный', hex: '#1d1d1f' }], specs: [], description: '',
                        })}><Icon name="plus" size={14} /> Добавить товар</button>
                      </div>
                      <div className="table-wrap">
                        <table className="table">
                          <thead><tr><th>Товар</th><th>Категория</th><th>Цена</th><th>Склад</th><th>Рейтинг</th><th /></tr></thead>
                          <tbody>
                            {rows.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).map((p) => (
                              <tr key={p.id}>
                                <td>
                                  <span className="row gap-10">
                                    <img src={productImg(p.slug, p.colors[0].id)} alt="" width="38" height="38" style={{ objectFit: 'contain' }} />
                                    <span><b style={{ display: 'block' }}>{p.name}</b><span className="tiny muted">{p.slug}</span></span>
                                  </span>
                                </td>
                                <td className="muted">{p.category}</td>
                                <td className="table__num">{money(p.price)}</td>
                                <td><span className={`badge ${p.stock <= 5 ? 'badge--warn' : ''}`}>{p.stock} шт</span></td>
                                <td className="table__num">{p.rating} · {p.reviews}</td>
                                <td>
                                  <span className="row gap-6">
                                    <button className="btn btn--quiet btn--sm" onClick={() => setEdit({ ...p, specsText: (p.specs || []).map((s) => s.join(': ')).join('\n') })}>
                                      <Icon name="edit" size={13} />
                                    </button>
                                    <button className="btn btn--quiet btn--sm danger" onClick={async () => {
                                      await api.adminDeleteProduct(p.id); toast('Товар удалён', 'muted'); reload()
                                    }}><Icon name="trash" size={13} /></button>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ══ ремонты ══ */}
                  {sec === 'repairs' && (
                    <div className="stack gap-14">
                      {rows.length === 0 ? <Empty icon="tool" title="Заявок нет" /> : rows.map((r) => (
                        <div className="panel" key={r.id}>
                          <div className="between" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                            <div>
                              <b className="num">{r.number}</b>
                              <p className="tiny muted">{r.device} · {r.customerName} · {r.customerPhone}</p>
                            </div>
                            <span className={stCls(STATUS.repair, r.status)}>{STATUS.repair[r.status].label}</span>
                          </div>
                          <p className="muted small" style={{ marginBottom: 12 }}>{r.issue || '—'}</p>
                          <div className="toolbar__row">
                            <span className="mono-label">Визит:</span>
                            <span className="small">{r.slotDate} в {r.slotTime}</span>
                            <select className="select" style={{ width: 190 }} value={r.status} onChange={(e) => setStatus('repairs', r.id, e.target.value)}>
                              {Object.entries(STATUS.repair).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <span className="num accent">{r.price ? money(r.price) : '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ══ trade-in ══ */}
                  {sec === 'tradeins' && (
                    <div className="stack gap-14">
                      {rows.length === 0 ? <Empty icon="recycle" title="Заявок нет" /> : rows.map((t) => (
                        <div className="panel" key={t.id}>
                          <div className="between" style={{ flexWrap: 'wrap' }}>
                            <div>
                              <b>{t.model}</b>
                              <p className="tiny muted">{t.storage} · {t.condition} · АКБ {t.battery}% · {t.customerName} · {t.customerPhone}</p>
                            </div>
                            <div className="row gap-10">
                              <span className="num accent">{money(t.finalPrice ?? t.estimated)}</span>
                              <select className="select" style={{ width: 180 }} value={t.status} onChange={(e) => setStatus('tradeins', t.id, e.target.value)}>
                                {Object.entries(STATUS.tradein).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ══ брони ══ */}
                  {sec === 'bookings' && (
                    <div className="table-wrap">
                      <table className="table">
                        <thead><tr><th>#</th><th>Товар</th><th>Клиент</th><th>Визит</th><th>Статус</th></tr></thead>
                        <tbody>
                          {rows.map((b) => (
                            <tr key={b.id}>
                              <td className="table__num">{String(b.id).padStart(5, '0')}</td>
                              <td>{b.productSlug}</td>
                              <td>{b.customerName}<span className="tiny muted" style={{ display: 'block' }}>{b.customerPhone}</span></td>
                              <td className="table__num">{b.slotDate} {b.slotTime}</td>
                              <td>
                                <select className="select" value={b.status} onChange={(e) => setStatus('bookings', b.id, e.target.value)}>
                                  {Object.entries(STATUS.booking).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ══ заявки ══ */}
                  {sec === 'leads' && (
                    <div className="stack gap-14">
                      {rows.length === 0 ? <Empty icon="phone" title="Заявок нет" /> : rows.map((l) => (
                        <div className="panel between" key={l.id} style={{ flexWrap: 'wrap' }}>
                          <div>
                            <b>{l.name}</b>
                            <p className="tiny muted">{l.phone} · {l.type} · {dateTimeRu(l.createdAt)}</p>
                            {l.message && <p className="muted small" style={{ marginTop: 8 }}>{l.message}</p>}
                          </div>
                          <select className="select" style={{ width: 180 }} value={l.status} onChange={(e) => setStatus('leads', l.id, e.target.value)}>
                            {Object.entries(STATUS.lead).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ══ отзывы ══ */}
                  {sec === 'reviews' && (
                    <div className="stack gap-14">
                      <div className="panel" style={{ padding: '14px 18px' }}>
                        <p className="muted small" style={{ margin: 0 }}>
                          Сначала идут отзывы на модерации, затем 40 последних опубликованных.
                          Всего в базе <b className="accent num">{dash ? dash.counts.reviews : '—'}</b> отзывов —
                          остальные доступны покупателям на странице товара.
                        </p>
                      </div>
                      {rows.length === 0 ? <Empty icon="star" title="Отзывов нет" /> : rows.map((r) => (
                        <div className="panel" key={r.id}>
                          <div className="between" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
                            <div>
                              <b>{r.author}</b>
                              <p className="tiny muted">{r.productSlug} · {dateShort(r.createdAt)}</p>
                            </div>
                            <span className={`badge ${r.approved ? 'badge--ok' : 'badge--warn'}`}>{r.approved ? 'Опубликован' : 'На модерации'}</span>
                          </div>
                          <p className="muted small" style={{ marginBottom: 12 }}>«{r.text}»</p>
                          <div className="btn-row">
                            {!r.approved && <button className="btn btn--sm btn--primary" onClick={async () => { await api.adminApproveReview(r.id, true); toast('Отзыв опубликован'); reload() }}>
                              <Icon name="check" size={14} /> Опубликовать</button>}
                            {r.approved && <button className="btn btn--sm btn--outline" onClick={async () => { await api.adminApproveReview(r.id, false); toast('Отзыв скрыт', 'muted'); reload() }}>
                              Скрыть</button>}
                            <button className="btn btn--sm btn--danger" onClick={async () => { await api.adminDeleteReview(r.id); toast('Отзыв удалён', 'muted'); reload() }}>
                              <Icon name="trash" size={14} /> Удалить</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ══ пользователи ══ */}
                  {sec === 'users' && (
                    <div className="table-wrap">
                      <table className="table">
                        <thead><tr><th>Имя</th><th>E-mail</th><th>Телефон</th><th>Бонусы</th><th>Роль</th></tr></thead>
                        <tbody>
                          {rows.map((u) => (
                            <tr key={u.id}>
                              <td><b>{u.name}</b></td>
                              <td className="muted">{u.email}</td>
                              <td className="table__num">{u.phone || '—'}</td>
                              <td className="table__num">{num(u.bonus)}</td>
                              <td>
                                <select className="select" value={u.role} onChange={async (e) => {
                                  const list = await api.adminSetRole(u.id, e.target.value)
                                  setRows(list); toast('Роль обновлена')
                                }}>
                                  <option value="client">Клиент</option>
                                  <option value="manager">Менеджер</option>
                                  <option value="admin">Администратор</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ══ промокоды ══ */}
                  {sec === 'promos' && (
                    <div className="stack gap-14">
                      <button className="btn btn--primary btn--sm" style={{ alignSelf: 'flex-start' }}
                        onClick={() => setEdit({ kind: 'promo', code: '', discount: 5, note: '', active: true })}>
                        <Icon name="plus" size={14} /> Новый промокод
                      </button>
                      <div className="table-wrap">
                        <table className="table">
                          <thead><tr><th>Код</th><th>Скидка</th><th>Описание</th><th>Действует до</th><th>Статус</th><th /></tr></thead>
                          <tbody>
                            {rows.map((p) => (
                              <tr key={p.id}>
                                <td><b className="num">{p.code}</b></td>
                                <td className="table__num">{p.discount}%</td>
                                <td className="muted">{p.note}</td>
                                <td className="table__num">{p.expiresAt || '—'}</td>
                                <td><span className={`badge ${p.active ? 'badge--ok' : 'badge--danger'}`}>{p.active ? 'активен' : 'выключен'}</span></td>
                                <td>
                                  <span className="row gap-6">
                                    <button className="btn btn--quiet btn--sm" onClick={() => setEdit({ kind: 'promo', ...p })}><Icon name="edit" size={13} /></button>
                                    <button className="btn btn--quiet btn--sm danger" onClick={async () => { await api.adminDeletePromo(p.id); toast('Промокод удалён', 'muted'); reload() }}><Icon name="trash" size={13} /></button>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ══ контент сайта ══ */}
                  {sec === 'content' && settings && (
                    <form className="panel stack gap-16" onSubmit={async (e) => {
                      e.preventDefault()
                      const s = await api.adminSaveSettings(settings)
                      setLocal(s); setSettings(s)
                      toast('Контент сайта обновлён')
                    }}>
                      <p className="mono-label">Тексты и контакты — меняются на сайте сразу</p>
                      <div className="grid grid--2" style={{ gap: 14 }}>
                        <Field label="Название магазина"><input className="input" value={settings.siteName} onChange={(e) => setLocal({ ...settings, siteName: e.target.value })} /></Field>
                        <Field label="Слоган"><input className="input" value={settings.tagline} onChange={(e) => setLocal({ ...settings, tagline: e.target.value })} /></Field>
                        <Field label="Телефон"><input className="input" value={settings.phone} onChange={(e) => setLocal({ ...settings, phone: e.target.value })} /></Field>
                        <Field label="E-mail"><input className="input" value={settings.email} onChange={(e) => setLocal({ ...settings, email: e.target.value })} /></Field>
                        <Field label="Telegram-бот (без @)"><input className="input" value={settings.telegram} onChange={(e) => setLocal({ ...settings, telegram: e.target.value, telegramUrl: `https://t.me/${e.target.value}` })} /></Field>
                        <Field label="Адрес"><input className="input" value={settings.address} onChange={(e) => setLocal({ ...settings, address: e.target.value })} /></Field>
                      </div>
                      <Field label="Условия доставки"><textarea className="textarea" value={settings.deliveryText} onChange={(e) => setLocal({ ...settings, deliveryText: e.target.value })} /></Field>
                      <Field label="Условия гарантии"><textarea className="textarea" value={settings.warrantyText} onChange={(e) => setLocal({ ...settings, warrantyText: e.target.value })} /></Field>
                      <Field label="Текст про Trade-In"><textarea className="textarea" value={settings.tradeInText} onChange={(e) => setLocal({ ...settings, tradeInText: e.target.value })} /></Field>

                      <div className="panel panel--flat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                        <div>
                          <p className="mono-label" style={{ marginBottom: 6 }}>Анимация переходов</p>
                          <p className="tiny muted" style={{ margin: 0 }}>
                            Светящаяся линия при переходе между страницами. Выключите, если она мешает.
                          </p>
                        </div>
                        <label className="switch">
                          <input type="checkbox" checked={settings.pageTransition !== false}
                            onChange={(e) => setLocal({ ...settings, pageTransition: e.target.checked })} />
                          <span className="small">{settings.pageTransition !== false ? 'включена' : 'выключена'}</span>
                        </label>
                      </div>

                      <button className="btn btn--primary" style={{ alignSelf: 'flex-start' }}><Icon name="check" size={15} /> Сохранить контент</button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* модалка редактирования товара / промокода */}
      <Modal open={!!edit} onClose={() => setEdit(null)} wide
        title={edit?.kind === 'promo' ? 'Промокод' : edit?.id ? 'Редактирование товара' : 'Новый товар'}>
        {edit && edit.kind === 'promo' ? (
          <form className="stack gap-14" onSubmit={async (e) => {
            e.preventDefault()
            const list = await api.adminSavePromo(edit)
            setRows(list); setEdit(null); toast('Промокод сохранён')
          }}>
            <div className="grid grid--2" style={{ gap: 14 }}>
              <Field label="Код *"><input className="input" value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} required /></Field>
              <Field label="Скидка, % *"><input className="input" type="number" min="1" max="90" value={edit.discount} onChange={(e) => setEdit({ ...edit, discount: +e.target.value })} required /></Field>
            </div>
            <Field label="Описание"><input className="input" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
            <label className="switch"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /><span className="small">Активен</span></label>
            <button className="btn btn--primary">Сохранить</button>
          </form>
        ) : edit && (
          <form className="stack gap-14" onSubmit={async (e) => {
            e.preventDefault()
            const specs = (edit.specsText || '').split('\n').filter(Boolean).map((l) => {
              const i = l.indexOf(':')
              return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l.trim(), '']
            })
            await api.adminSaveProduct({
              ...edit, specs,
              slug: edit.slug || edit.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            })
            toast('Товар сохранён'); setEdit(null); reload()
          }}>
            <div className="grid grid--2" style={{ gap: 14 }}>
              <Field label="Название *"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} required /></Field>
              <Field label="Slug (URL)"><input className="input" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} placeholder="iphone-18-pro" /></Field>
              <Field label="Категория">
                <select className="select" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Цена, ₽ *"><input className="input" type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: +e.target.value })} required /></Field>
              <Field label="Старая цена, ₽"><input className="input" type="number" value={edit.oldPrice || ''} onChange={(e) => setEdit({ ...edit, oldPrice: +e.target.value || null })} /></Field>
              <Field label="Остаток, шт"><input className="input" type="number" value={edit.stock} onChange={(e) => setEdit({ ...edit, stock: +e.target.value })} /></Field>
            </div>
            <Field label="Подзаголовок"><input className="input" value={edit.subtitle} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} /></Field>
            <Field label="Описание"><textarea className="textarea" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <Field label="Конфигурации (через запятую)">
              <input className="input" value={(edit.storages || []).join(', ')}
                onChange={(e) => setEdit({ ...edit, storages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Характеристики — по одной в строке, формат «Название: значение»">
              <textarea className="textarea" value={edit.specsText || ''} onChange={(e) => setEdit({ ...edit, specsText: e.target.value })}
                placeholder={'Дисплей: 6.3″ Super Retina XDR\nЧип: Apple A20 Pro'} />
            </Field>
            <div className="btn-row">
              <button className="btn btn--primary"><Icon name="check" size={15} /> Сохранить товар</button>
              <button type="button" className="btn btn--quiet" onClick={() => setEdit(null)}>Отмена</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
