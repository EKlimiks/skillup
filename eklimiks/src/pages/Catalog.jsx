import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { CATEGORIES } from '../data/catalog.js'
import { money } from '../lib/format.js'
import { Icon, Reveal, ProductCard, Empty, SectionHead } from '../components/ui.jsx'

const SORTS = [
  ['popular', 'По популярности'],
  ['price-asc', 'Сначала дешёвые'],
  ['price-desc', 'Сначала дорогие'],
  ['rating', 'По рейтингу'],
  ['new', 'Новинки'],
]

const PRICE_STEPS = [0, 20000, 40000, 60000, 90000, 130000, 200000, 400000]

export default function Catalog() {
  const [params, setParams] = useSearchParams()
  const { addToCart, favorites, toggleFavorite } = useApp()
  const [items, setItems] = useState(null)
  const [openFilters, setOpenFilters] = useState(false)

  const category = params.get('category') || 'all'
  const search = params.get('q') || ''
  const sort = params.get('sort') || 'popular'
  const maxPrice = Number(params.get('max') || 0)
  const condition = params.get('condition') || ''

  const set = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => { if (v === '' || v == null || v === 'all' || v === 0) next.delete(k); else next.set(k, v) })
    setParams(next, { replace: true })
  }

  useEffect(() => {
    let alive = true
    setItems(null)
    api.products({ category, search, sort, maxPrice, condition }).then((r) => { if (alive) setItems(r) })
    return () => { alive = false }
  }, [category, search, sort, maxPrice, condition])

  const cat = CATEGORIES.find((c) => c.id === category)
  const activeCount = [category !== 'all', !!search, maxPrice > 0, !!condition].filter(Boolean).length

  const chips = useMemo(() => (
    <div className="row gap-10 wrapflex">
      <button className={`chip ${category === 'all' ? 'is-on' : ''}`} onClick={() => set({ category: 'all' })}>Все</button>
      {CATEGORIES.map((c) => (
        <button key={c.id} className={`chip ${category === c.id ? 'is-on' : ''}`} onClick={() => set({ category: c.id })}>{c.name}</button>
      ))}
    </div>
  ), [category])

  const filters = (
    <div className="stack gap-20">
      <div className="filters__grp">
        <span className="filters__t">Категория</span>
        <div className="stack gap-6">
          <button className={`dash__link ${category === 'all' ? 'is-on' : ''}`} onClick={() => set({ category: 'all' })}>Все категории</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`dash__link ${category === c.id ? 'is-on' : ''}`} onClick={() => set({ category: c.id })}>
              <Icon name={c.icon} size={15} />{c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="filters__grp">
        <span className="filters__t">Цена до</span>
        <div className="range">
          <input type="range" min="0" max="400000" step="5000" value={maxPrice || 400000}
            onChange={(e) => set({ max: e.target.value === '400000' ? '' : e.target.value })} />
        </div>
        <span className="num small accent">{maxPrice ? `до ${money(maxPrice)}` : 'без ограничений'}</span>
      </div>

      <div className="filters__grp">
        <span className="filters__t">Состояние</span>
        {[['', 'Любое'], ['new', 'Новое'], ['refurbished', 'Восстановленное']].map(([v, l]) => (
          <label className="check" key={v || 'any'}>
            <input type="radio" name="cond" checked={condition === v} onChange={() => set({ condition: v })} />{l}
          </label>
        ))}
      </div>

      {activeCount > 0 && (
        <button className="btn btn--sm btn--block btn--outline" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
          <Icon name="close" size={14} /> Сбросить фильтры
        </button>
      )}
    </div>
  )

  return (
    <div className="page-enter">
      <section className="section section--tight">
        <div className="wrap">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span>
            <span>Каталог</span>
            {cat && <><span className="crumbs__sep">/</span><span className="accent">{cat.name}</span></>}
          </div>
          <SectionHead idx="КАТАЛОГ 2026" title={cat ? cat.name : 'Вся техника Apple'}
            sub={cat ? cat.tagline : 'Только оригинальные устройства с гарантией. Наличие на складе обновляется каждый час.'} />

          <div style={{ marginBottom: 22 }}>{chips}</div>

          <div className="fbar">
            <button className="btn btn--sm btn--outline" onClick={() => setOpenFilters((v) => !v)}>
              <Icon name="filter" size={14} /> Фильтры {activeCount > 0 && `(${activeCount})`}
            </button>
            <select className="select" style={{ maxWidth: 210 }} value={sort} onChange={(e) => set({ sort: e.target.value })}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div className="cat">
            <aside className={`filters ${openFilters ? 'is-open' : ''}`}>
              <div className="panel">{filters}</div>
            </aside>

            <div>
              <div className="toolbar">
                <p className="muted small">
                  {items === null ? 'Загрузка…' : <>Найдено <b className="accent num">{items.length}</b> моделей{search && <> по запросу «{search}»</>}</>}
                </p>
                <div className="toolbar__row">
                  {search && <span className="badge badge--accent">поиск: {search} <button onClick={() => set({ q: '' })} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer' }}>×</button></span>}
                  <select className="select" style={{ width: 210 }} value={sort} onChange={(e) => set({ sort: e.target.value })}>
                    {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {items === null ? (
                <div className="grid grid--auto">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skel" style={{ aspectRatio: '3/4' }} />)}
                </div>
              ) : items.length === 0 ? (
                <Empty icon="search" title="Ничего не найдено"
                  text="Попробуйте изменить фильтры или сбросить их — в каталоге 37 моделей Apple."
                  action={<button className="btn btn--outline" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Сбросить фильтры</button>} />
              ) : (
                <div className="grid grid--auto">
                  {items.map((p, i) => (
                    <ProductCard key={p.slug} p={p} delay={i} onAdd={(x) => addToCart(x)}
                      fav={favorites.includes(p.slug)} onFav={toggleFavorite} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
