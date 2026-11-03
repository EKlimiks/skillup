import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { Icon, Empty, SectionHead, ProductCard } from '../components/ui.jsx'

export default function Favorites() {
  const { favorites, toggleFavorite, addToCart, user } = useApp()
  const [all, setAll] = useState([])

  useEffect(() => { api.products({}).then(setAll) }, [])

  const items = all.filter((p) => favorites.includes(p.slug))

  return (
    <div className="page-enter">
      <section className="section section--tight">
        <div className="wrap">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Избранное</span>
          </div>
          <SectionHead idx="ИЗБРАННОЕ" title="Сохранённые модели"
            sub={user ? 'Список привязан к вашему аккаунту.' : 'Войдите, чтобы список сохранился на всех устройствах.'} />

          {items.length === 0 ? (
            <Empty icon="heart" title="Избранное пусто"
              text="Нажимайте на сердечко в карточке товара — модель сохранится здесь."
              action={<Link className="btn btn--primary" to="/catalog">Открыть каталог</Link>} />
          ) : (
            <div className="grid grid--auto">
              {items.map((p, i) => (
                <ProductCard key={p.slug} p={p} delay={i} onAdd={addToCart} fav onFav={toggleFavorite} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
