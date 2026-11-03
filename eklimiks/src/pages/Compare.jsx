import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { api } from '../lib/api.js'
import { productImg, money } from '../lib/format.js'
import { Icon, Empty, SectionHead, Stars } from '../components/ui.jsx'

export default function Compare() {
  const { compare, toggleCompare, addToCart, setCompare } = useApp()
  const [all, setAll] = useState([])

  useEffect(() => { api.products({}).then(setAll) }, [])

  const items = all.filter((p) => compare.includes(p.slug))

  const rows = [
    ['Цена', (p) => money(p.price)],
    ['Было', (p) => (p.oldPrice ? money(p.oldPrice) : '—')],
    ['Категория', (p) => p.category],
    ['Рейтинг', (p) => `${p.rating} / 5`],
    ['Отзывов', (p) => p.reviews],
    ['В наличии', (p) => (p.stock > 0 ? `${p.stock} шт` : 'нет')],
    ['Цвета', (p) => p.colors.map((c) => c.name).join(', ')],
    ['Конфигурации', (p) => p.storages.join(', ')],
    ['Бонусы', (p) => `+${Math.round(p.price * 0.02).toLocaleString('ru-RU')} EK`],
  ]

  const specKeys = [...new Set(items.flatMap((p) => p.specs.map(([k]) => k)))]

  return (
    <div className="page-enter">
      <section className="section section--tight">
        <div className="wrap">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Сравнение</span>
          </div>
          <SectionHead idx="СРАВНЕНИЕ" title="Сравните до трёх моделей"
            sub="Добавляйте товары к сравнению из каталога или карточки — до трёх моделей одновременно."
            right={items.length > 0 ? <button className="btn btn--sm btn--quiet" onClick={() => setCompare([])}><Icon name="trash" size={14} /> Очистить</button> : null} />

          {items.length === 0 ? (
            <Empty icon="chart" title="Пока нечего сравнивать"
              text="Откройте каталог и нажмите «Сравнить» в карточке товара — здесь появится подробная таблица."
              action={<Link className="btn btn--primary" to="/catalog">В каталог</Link>} />
          ) : (
            <div className="cmp">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 180 }}>Параметр</th>
                    {items.map((p) => (
                      <th key={p.slug}>
                        <img className="cmp__img" src={productImg(p.slug, p.colors[0].id)} alt={p.name} />
                        <Link to={`/product/${p.slug}`}><b>{p.name}</b></Link>
                        <div style={{ marginTop: 6 }}><Stars value={p.rating} /></div>
                        <div className="btn-row" style={{ marginTop: 10 }}>
                          <button className="btn btn--sm btn--primary" onClick={() => addToCart(p)}><Icon name="cart" size={13} /> В корзину</button>
                          <button className="btn btn--sm btn--quiet" onClick={() => toggleCompare(p.slug)}><Icon name="close" size={13} /></button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, fn]) => (
                    <tr key={label}>
                      <td className="muted">{label}</td>
                      {items.map((p) => <td key={p.slug} className={label === 'Цена' ? 'num accent' : ''}>{fn(p)}</td>)}
                    </tr>
                  ))}
                  {specKeys.map((k) => (
                    <tr key={k}>
                      <td className="muted">{k}</td>
                      {items.map((p) => {
                        const s = p.specs.find(([sk]) => sk === k)
                        return <td key={p.slug}>{s ? s[1] : '—'}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
