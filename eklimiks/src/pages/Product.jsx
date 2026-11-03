import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { productImg, money, dateShort, plural } from '../lib/format.js'
import { Icon, Reveal, Stars, ProductCard, SectionHead, Modal, Field, Empty } from '../components/ui.jsx'

export default function Product() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { addToCart, favorites, toggleFavorite, compare, toggleCompare, user, toast } = useApp()
  const [p, setP] = useState(null)
  const [color, setColor] = useState(null)
  const [storage, setStorage] = useState(null)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('specs')
  const [related, setRelated] = useState([])
  const [revs, setRevs] = useState({ items: [], total: 0, avg: 0, dist: [0, 0, 0, 0, 0], page: 1, pages: 1 })
  const [rFilter, setRFilter] = useState(0)
  const [rSort, setRSort] = useState('new')
  const [rPage, setRPage] = useState(1)
  const [revOpen, setRevOpen] = useState(false)

  useEffect(() => {
    let alive = true
    setP(null); setTab('specs'); setQty(1); setRFilter(0); setRSort('new'); setRPage(1)
    api.product(slug).then((r) => {
      if (!alive) return
      setP(r); setColor(r.colors[0].id); setStorage(r.storages[0]); setColor(r.colors[0].id)
      api.products({ category: r.category }).then((list) => setRelated(list.filter((x) => x.slug !== r.slug).slice(0, 4)))
    }).catch(() => nav('/catalog', { replace: true }))
    return () => { alive = false }
  }, [slug, nav])

  /* отзывы подгружаются отдельно: зависят от фильтра, сортировки и страницы */
  useEffect(() => {
    if (!p) return
    let alive = true
    api.reviews({ product: p.slug, rating: rFilter, sort: rSort, page: rPage, perPage: 8 })
      .then((r) => { if (alive) setRevs(r) })
    return () => { alive = false }
  }, [p, rFilter, rSort, rPage])

  if (!p) {
    return (
      <div className="wrap section">
        <div className="pdp">
          <div className="skel" style={{ aspectRatio: '1/1' }} />
          <div className="stack gap-14"><div className="skel" style={{ height: 34, width: '70%' }} /><div className="skel" style={{ height: 18 }} /><div className="skel" style={{ height: 18, width: '50%' }} /><div className="skel" style={{ height: 52, marginTop: 20 }} /></div>
        </div>
      </div>
    )
  }

  const fav = favorites.includes(p.slug)
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
  const img = productImg(p.slug, color)
  const colorName = (p.colors.find((c) => c.id === color) || {}).name

  const submitReview = async (payload) => {
    await api.createReview({ productSlug: p.slug, ...payload })
    toast('Спасибо! Отзыв отправлен на модерацию', 'ok')
    setRevOpen(false)
  }

  return (
    <div className="page-enter">
      <section className="section section--tight">
        <div className="wrap">
          <div className="crumbs" style={{ marginBottom: 22 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span>
            <Link to="/catalog">Каталог</Link><span className="crumbs__sep">/</span>
            <Link to={`/catalog?category=${p.category}`}>{(p.category || '').toUpperCase()}</Link>
            <span className="crumbs__sep">/</span><span className="accent">{p.name}</span>
          </div>

          <div className="pdp">
            {/* ── изображение ── */}
            <div>
              <div className="pdp__stage brackets">
                <img src={img} alt={`${p.name} — ${colorName}`} width="820" height="820" />
                <div className="pdp__stage-tag">
                  {p.badge && <span className="badge badge--accent">{p.badge}</span>}
                  {off > 0 && <span className="badge badge--sale" style={{ marginLeft: 6 }}>−{off}%</span>}
                </div>
              </div>
              <div className="pdp__thumbs">
                {p.colors.map((c) => (
                  <button key={c.id} className={`pdp__thumb ${color === c.id ? 'is-on' : ''}`}
                    onClick={() => setColor(c.id)} title={c.name} aria-label={c.name}>
                    <img src={productImg(p.slug, c.id)} alt={c.name} />
                  </button>
                ))}
              </div>
            </div>

            {/* ── покупка ── */}
            <div className="stack gap-20">
              <div>
                <h1 className="h1">{p.name}</h1>
                <p className="lead" style={{ marginTop: 10 }}>{p.subtitle}</p>
              </div>

              <div className="row gap-14 wrapflex">
                <Stars value={p.rating} size={15} />
                <span className="muted small">{p.rating} · {p.reviews} {plural(p.reviews, 'отзыв', 'отзыва', 'отзывов')}</span>
                <span className={`badge ${p.stock > 5 ? 'badge--ok' : p.stock > 0 ? 'badge--warn' : 'badge--danger'}`}>
                  {p.stock > 0 ? `В наличии · ${p.stock} шт` : 'Нет в наличии'}
                </span>
              </div>

              <div className="pdp__price">
                <b className="num">{money(p.price)}</b>
                {p.oldPrice && <span className="pcard__old" style={{ fontSize: '1rem' }}>{money(p.oldPrice)}</span>}
              </div>
              <p className="tiny muted">Или {money(Math.round(p.price / 24))}/мес. в рассрочку 0% на 24 месяца</p>

              <div className="field">
                <span className="field__label">Цвет — {colorName}</span>
                <div className="opt">
                  {p.colors.map((c) => (
                    <button key={c.id} className={`opt__b ${color === c.id ? 'is-on' : ''}`} onClick={() => setColor(c.id)}>
                      <i className="swatch" style={{ background: c.hex, display: 'inline-block', marginRight: 8, verticalAlign: -2 }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {p.storages[0] !== '—' && (
                <div className="field">
                  <span className="field__label">Конфигурация</span>
                  <div className="opt">
                    {p.storages.map((s) => (
                      <button key={s} className={`opt__b ${storage === s ? 'is-on' : ''}`} onClick={() => setStorage(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* главное действие — отдельной широкой кнопкой, остальные делят строку поровну */}
              <div className="stack gap-12">
                <button className="btn btn--primary btn--lg btn--block" disabled={p.stock === 0}
                  onClick={() => addToCart(p, { color, storage, qty })}>
                  <Icon name="cart" size={17} /> В корзину
                </button>
                <div className="btn-row btn-row--fill">
                  <button className="btn btn--outline" onClick={() => toggleFavorite(p.slug)}>
                    <Icon name="heart" size={16} /> {fav ? 'В избранном' : 'В избранное'}
                  </button>
                  <button className="btn btn--outline" onClick={() => toggleCompare(p.slug)} title="Сравнить">
                    <Icon name="chart" size={16} /> {compare.includes(p.slug) ? 'В сравнении' : 'Сравнить'}
                  </button>
                </div>
              </div>

              <div className="btn-row btn-row--fill">
                <Link className="btn btn--outline" to={`/reserve?product=${p.slug}`}><Icon name="box" size={15} /> Забронировать</Link>
                <Link className="btn btn--outline" to={`/trade-in?trade=${encodeURIComponent(p.name)}`}><Icon name="recycle" size={15} /> Trade-In</Link>
              </div>

              <div className="panel" style={{ padding: 18 }}>
                <div className="kv"><span className="kv__k"><Icon name="shield" size={14} /> Гарантия</span><span className="kv__v">12 месяцев</span></div>
                <div className="kv"><span className="kv__k"><Icon name="truck" size={14} /> Доставка</span><span className="kv__v">Сегодня по Кургану</span></div>
                <div className="kv"><span className="kv__k"><Icon name="wallet" size={14} /> Бонусы</span><span className="kv__v accent">+{Math.round(p.price * 0.02).toLocaleString('ru-RU')} EK</span></div>
                <div className="kv"><span className="kv__k"><Icon name="box" size={14} /> Самовывоз</span><span className="kv__v">3 салона, бесплатно</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── характеристики / отзывы ── */}
      <section className="section section--tight">
        <div className="wrap">
          <div className="tabs" style={{ marginBottom: 26 }}>
            {[['specs', 'Характеристики'], ['desc', 'Описание'], ['revs', `Отзывы (${p.reviews})`], ['deliv', 'Доставка и оплата']].map(([k, l]) => (
              <button key={k} className={`tab ${tab === k ? 'is-on' : ''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === 'specs' && (
            <div className="panel" style={{ maxWidth: 760 }}>
              <dl className="spec">
                {p.specs.map(([k, v]) => (<React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>))}
                <dt>Цвета</dt><dd>{p.colors.map((c) => c.name).join(', ')}</dd>
                {p.storages[0] !== '—' && <><dt>Конфигурации</dt><dd>{p.storages.join(', ')}</dd></>}
              </dl>
            </div>
          )}

          {tab === 'desc' && (
            <div className="panel" style={{ maxWidth: 760 }}>
              <p className="lead" style={{ maxWidth: 'none' }}>{p.description}</p>
              <p className="muted" style={{ marginTop: 18 }}>
                Устройство новое, в заводской упаковке, активируется при вас. IMEI проверяется на сайте Apple,
                комплект полный. Возможен обмен или возврат в течение 14 дней при сохранении товарного вида.
              </p>
            </div>
          )}

          {tab === 'revs' && (
            <div className="stack gap-26">
              {/* сводка: средняя оценка, распределение, кнопка */}
              <div className="revsum">
                <div className="revsum__score">
                  <div className="revsum__num">{revs.avg || p.rating}</div>
                  <Stars value={revs.avg || p.rating} size={16} />
                  <p className="tiny muted">{p.reviews} {plural(p.reviews, 'отзыв', 'отзыва', 'отзывов')}</p>
                </div>

                <div className="revsum__bars">
                  {revs.dist.map((c, i) => {
                    const star = 5 - i
                    const pct = revs.dist.reduce((a, b) => a + b, 0) ? (c / revs.dist.reduce((a, b) => a + b, 0)) * 100 : 0
                    return (
                      <button key={star} className={`revsum__row ${rFilter === star ? 'is-on' : ''}`}
                        onClick={() => { setRFilter(rFilter === star ? 0 : star); setRPage(1) }}>
                        <span className="revsum__star">{star}<Icon name="star" size={11} /></span>
                        <span className="bar grow"><span className="bar__fill" style={{ display: 'block', height: '100%', width: `${pct}%` }} /></span>
                        <span className="num tiny muted" style={{ minWidth: 34, textAlign: 'right' }}>{c}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="revsum__act">
                  <button className="btn btn--outline btn--sm" onClick={() => setRevOpen(true)}>
                    <Icon name="edit" size={14} /> Написать отзыв
                  </button>
                  <Link className="btn btn--quiet btn--sm" to={`/reviews?product=${p.slug}`}>
                    Все отзывы об этой модели <Icon name="arrow" size={13} />
                  </Link>
                  <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                    {rFilter > 0 && <span className="badge badge--accent">{rFilter} <Icon name="star" size={10} /> <button onClick={() => { setRFilter(0); setRPage(1) }} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer' }}>×</button></span>}
                    <select className="select" style={{ maxWidth: 190 }} value={rSort}
                      onChange={(e) => { setRSort(e.target.value); setRPage(1) }}>
                      <option value="new">Сначала новые</option>
                      <option value="old">Сначала старые</option>
                      <option value="high">С высокой оценкой</option>
                      <option value="low">С низкой оценкой</option>
                      <option value="useful">Самые полезные</option>
                    </select>
                  </div>
                </div>
              </div>

              {revs.items.length === 0 ? (
                <Empty icon="star" title="Отзывов с такой оценкой нет"
                  text="Снимите фильтр по звёздам, чтобы увидеть все отзывы об этой модели."
                  action={<button className="btn btn--outline" onClick={() => { setRFilter(0); setRPage(1) }}>Показать все</button>} />
              ) : (
                <>
                  <div className="grid grid--2">
                    {revs.items.map((r) => (
                      <Reveal key={r.id} className="rev">
                        <div className="between">
                          <Stars value={r.rating} />
                          <span className="tiny muted">{dateShort(r.createdAt)}</span>
                        </div>
                        <p className="rev__t">«{r.text}»</p>
                        <div className="between" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                          <span className="rev__a">
                            <span className="rev__av">{r.author.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                            <span>
                              <b style={{ display: 'block', fontWeight: 600, fontSize: '.9rem' }}>{r.author}</b>
                              <span className="tiny muted">Покупка подтверждена</span>
                            </span>
                          </span>
                          <span className="tiny muted row gap-6"><Icon name="check" size={13} /> Полезно ({r.helpful || 0})</span>
                        </div>
                      </Reveal>
                    ))}
                  </div>

                  {revs.pages > 1 && (
                    <div className="pager">
                      <button className="btn btn--outline btn--sm" disabled={revs.page <= 1}
                        onClick={() => setRPage(revs.page - 1)}>← Назад</button>
                      <span className="tiny muted">
                        Страница <b className="accent num">{revs.page}</b> из <b className="num">{revs.pages}</b>
                        {' '}· показано {revs.items.length} из {revs.total}
                      </span>
                      <button className="btn btn--outline btn--sm" disabled={revs.page >= revs.pages}
                        onClick={() => setRPage(revs.page + 1)}>Дальше →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'deliv' && (
            <div className="grid grid--3">
              {[
                ['truck', 'Курьер по Кургану', '400 ₽, бесплатно при заказе от 50 000 ₽. Доставка в день заказа при оформлении до 16:00.'],
                ['box', 'Самовывоз', 'Бесплатно из трёх салонов. Заказ хранится 5 дней, можно забронировать удобное время.'],
                ['card', 'Оплата', 'Картой онлайн или в салоне, переводом, частями. Рассрочка 0% на 6–24 месяца без первого взноса.'],
              ].map(([i, t, d]) => (
                <div className="card" key={t}>
                  <span className="svc__ico" style={{ marginBottom: 14 }}><Icon name={i} size={19} /></span>
                  <h3 className="card__title" style={{ marginBottom: 8 }}>{t}</h3>
                  <p className="muted small">{d}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── похожие ── */}
      {related.length > 0 && (
        <section className="section section--tight">
          <div className="wrap">
            <SectionHead idx="ПОХОЖИЕ" title="С этой моделью смотрят" />
            <div className="grid grid--4">
              {related.map((x, i) => (
                <ProductCard key={x.slug} p={x} delay={i} onAdd={(y) => addToCart(y)}
                  fav={favorites.includes(x.slug)} onFav={toggleFavorite} />
              ))}
            </div>
          </div>
        </section>
      )}

      <ReviewModal open={revOpen} onClose={() => setRevOpen(false)} onSubmit={submitReview} product={p} />
    </div>
  )
}

function ReviewModal({ open, onClose, onSubmit, product }) {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <Modal open={open} onClose={onClose} title={`Отзыв о ${product.name}`}>
      <form className="stack gap-16" onSubmit={async (e) => {
        e.preventDefault()
        if (text.trim().length < 12) return
        setBusy(true); await onSubmit({ rating, text }); setBusy(false); setText('')
      }}>
        <div className="field">
          <span className="field__label">Оценка</span>
          <div className="row gap-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} className="icon-btn btn--outline"
                style={{ color: n <= rating ? 'var(--accent)' : '#2c2c3d' }} aria-label={`${n} звёзд`}>
                <Icon name="star" size={17} />
              </button>
            ))}
          </div>
        </div>
        <Field label="Ваш отзыв *" hint="Не менее 12 символов. Публикуется после проверки модератором.">
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Расскажите о покупке, работе магазина и доставке…" />
        </Field>
        <button className="btn btn--primary btn--block" disabled={busy || text.trim().length < 12}>
          {busy ? <span className="spinner" /> : <Icon name="check" size={16} />} Отправить отзыв
        </button>
      </form>
    </Modal>
  )
}
