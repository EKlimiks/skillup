import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { dateShort, plural, num, productImg } from '../lib/format.js'
import { Icon, SectionHead, Stars, Reveal, Modal, Field, Empty } from '../components/ui.jsx'

const SORTS = [
  ['new', 'Сначала новые'],
  ['old', 'Сначала старые'],
  ['high', 'С высокой оценкой'],
  ['low', 'С низкой оценкой'],
  ['useful', 'Самые полезные'],
]

/** компактный список страниц: 1 … 4 5 6 … 20 */
function pageList(cur, total) {
  const out = []
  const push = (v) => { if (out[out.length - 1] !== v) out.push(v) }
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - cur) <= 1) push(i)
    else if (Math.abs(i - cur) === 2) push('…')
  }
  return out
}

export default function Reviews() {
  const { toast, user } = useApp()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [data, setData] = useState({ items: [], total: 0, avg: 0, dist: [0, 0, 0, 0, 0], page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const product = params.get('product') || ''
  const rating = Number(params.get('rating') || 0)
  const sort = params.get('sort') || 'new'
  const page = Number(params.get('page') || 1)

  const set = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === 'all' || v === 0) next.delete(k); else next.set(k, v)
    })
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
    if (patch.page) window.scrollTo({ top: 320, behavior: 'smooth' })
  }

  useEffect(() => { api.products({}).then(setProducts) }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    api.reviews({ product: product || null, rating, sort, page, perPage: 9 })
      .then((r) => { if (alive) { setData(r); setLoading(false) } })
    return () => { alive = false }
  }, [product, rating, sort, page])

  const total = data.dist.reduce((a, b) => a + b, 0)
  const sel = useMemo(() => products.find((p) => p.slug === product), [products, product])
  const pct = (c) => (total ? (c / total) * 100 : 0)

  return (
    <div className="page-enter">
      <section className="section section--tight">
        <div className="wrap">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Отзывы</span>
            {sel && <><span className="crumbs__sep">/</span><span>{sel.name}</span></>}
          </div>

          <SectionHead idx="ОТЗЫВЫ" title={sel ? `Отзывы о ${sel.name}` : 'Мнения наших клиентов'}
            sub="Публикуем только отзывы с подтверждённой покупкой. Каждый проходит модерацию в админ-панели."
            right={<button className="btn btn--primary" onClick={() => setOpen(true)}><Icon name="edit" size={15} /> Написать отзыв</button>} />

          {/* ── сводка ── */}
          <div className="revsum" style={{ marginBottom: 26 }}>
            <div className="revsum__score">
              <div className="revsum__num">{data.avg || '—'}</div>
              <Stars value={data.avg || 0} size={16} />
              <p className="tiny muted">{num(total)} {plural(total, 'отзыв', 'отзыва', 'отзывов')}</p>
            </div>

            <div className="revsum__bars">
              {data.dist.map((c, i) => {
                const star = 5 - i
                return (
                  <button key={star} className={`revsum__row ${rating === star ? 'is-on' : ''}`}
                    onClick={() => set({ rating: rating === star ? 0 : star })}>
                    <span className="revsum__star">{star}<Icon name="star" size={11} /></span>
                    <span className="bar grow"><span className="bar__fill" style={{ display: 'block', height: '100%', width: `${pct(c)}%` }} /></span>
                    <span className="num tiny muted" style={{ minWidth: 62, flex: 'none', textAlign: 'right' }}>{num(c)}</span>
                  </button>
                )
              })}
            </div>

            <div className="revsum__act">
              <Field label="Товар">
                <select className="select" value={product} onChange={(e) => set({ product: e.target.value })}>
                  <option value="">Все товары</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name} ({p.reviews})</option>
                  ))}
                </select>
              </Field>
              <Field label="Сортировка">
                <select className="select" value={sort} onChange={(e) => set({ sort: e.target.value })}>
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              {/* тернарник, а не &&: при rating = 0 React вывел бы «0» на страницу */}
              {(product || rating > 0) ? (
                <button className="btn btn--outline btn--sm" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  <Icon name="close" size={14} /> Сбросить фильтры
                </button>
              ) : null}
            </div>
          </div>

          {/* ── список ── */}
          {loading ? (
            <div className="grid grid--3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel" style={{ height: 210 }} />)}
            </div>
          ) : data.items.length === 0 ? (
            <Empty icon="star" title="Отзывов не найдено"
              text="Попробуйте снять фильтры — под это условие ничего не подошло."
              action={<button className="btn btn--outline" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Сбросить фильтры</button>} />
          ) : (
            <>
              <div className="grid grid--3">
                {data.items.map((r, i) => {
                  const p = products.find((x) => x.slug === r.productSlug)
                  return (
                    <Reveal key={r.id} delay={i % 3}>
                      <div className="rev brackets" style={{ height: '100%' }}>
                        <div className="between">
                          <Stars value={r.rating} />
                          <span className="tiny muted">{dateShort(r.createdAt)}</span>
                        </div>
                        <p className="rev__t">«{r.text}»</p>
                        {p && (
                          <Link to={`/product/${p.slug}`} className="row gap-10" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                            <img src={productImg(p.slug, p.colors[0].id)} alt="" width="40" height="40" style={{ objectFit: 'contain' }} />
                            <span className="tiny muted">{p.name}</span>
                          </Link>
                        )}
                        <div className="rev__a">
                          <span className="rev__av">{r.author.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                          <span>
                            <b style={{ display: 'block', fontWeight: 600, fontSize: '.9rem' }}>{r.author}</b>
                            <span className="tiny muted">Покупка подтверждена · полезно {r.helpful || 0}</span>
                          </span>
                        </div>
                      </div>
                    </Reveal>
                  )
                })}
              </div>

              {data.pages > 1 && (
                <div className="pager">
                  <button className="btn btn--outline btn--sm" disabled={data.page <= 1} onClick={() => set({ page: data.page - 1 })}>
                    ← Назад
                  </button>
                  <div className="pager__nums">
                    {pageList(data.page, data.pages).map((n, k) => (
                      n === '…'
                        ? <span key={'g' + k} className="muted">…</span>
                        : <button key={n} className={`pager__n ${n === data.page ? 'is-on' : ''}`} onClick={() => set({ page: n })}>{n}</button>
                    ))}
                  </div>
                  <button className="btn btn--outline btn--sm" disabled={data.page >= data.pages} onClick={() => set({ page: data.page + 1 })}>
                    Дальше →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <WriteModal open={open} onClose={() => setOpen(false)} products={products} user={user}
        onDone={async (payload) => {
          await api.createReview(payload)
          toast('Спасибо! Отзыв отправлен на модерацию')
          setOpen(false)
        }} />
    </div>
  )
}

function WriteModal({ open, onClose, products, user, onDone }) {
  const [f, setF] = useState({ productSlug: '', rating: 5, text: '' })
  const [busy, setBusy] = useState(false)
  return (
    <Modal open={open} onClose={onClose} title="Оставить отзыв">
      <form className="stack gap-14" onSubmit={async (e) => {
        e.preventDefault()
        if (!f.productSlug || f.text.trim().length < 12) return
        setBusy(true)
        await onDone({ ...f, author: user ? user.name : 'Гость' })
        setBusy(false); setF({ productSlug: '', rating: 5, text: '' })
      }}>
        <Field label="Товар *">
          <select className="select" value={f.productSlug} onChange={(e) => setF({ ...f, productSlug: e.target.value })} required>
            <option value="">— выберите модель —</option>
            {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </select>
        </Field>
        <div className="field">
          <span className="field__label">Оценка</span>
          <div className="row gap-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setF({ ...f, rating: n })} className="icon-btn"
                style={{ color: n <= f.rating ? 'var(--accent)' : '#2c2c3d' }} aria-label={`${n}`}>
                <Icon name="star" size={17} />
              </button>
            ))}
          </div>
        </div>
        <Field label="Текст отзыва *" hint="Минимум 12 символов. Отзыв появится после проверки модератором.">
          <textarea className="textarea" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })}
            placeholder="Как прошла покупка, довольны ли устройством?" required />
        </Field>
        <button className="btn btn--primary btn--block" disabled={busy || f.text.trim().length < 12}>
          {busy ? <span className="spinner" /> : <Icon name="check" size={16} />} Отправить
        </button>
      </form>
    </Modal>
  )
}
