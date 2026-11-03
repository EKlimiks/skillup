import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { productImg, money } from '../lib/format.js'
import { Icon, Empty, SectionHead, Qty, Reveal } from '../components/ui.jsx'

export default function Cart() {
  const { cart, setQty, removeFromCart, cartTotal, clearCart, toast, user } = useApp()
  const nav = useNavigate()
  const [promo, setPromo] = useState('')
  const [applied, setApplied] = useState(null)

  const checkPromo = async () => {
    const p = await api.promoCheck(promo)
    if (!p) { toast('Промокод не найден или истёк', 'danger'); setApplied(null); return }
    setApplied(p); toast(`Промокод ${p.code} применён: −${p.discount}%`)
  }

  const discount = applied ? Math.round((cartTotal * applied.discount) / 100) : 0
  const delivery = cartTotal - discount >= 50000 ? 0 : 400
  const total = cartTotal - discount

  if (!cart.length) {
    return (
      <div className="page-enter">
        <section className="section">
          <div className="wrap">
            <SectionHead idx="🛒 КОРЗИНА" title="Корзина пуста" />
            <Empty icon="cart" title="Здесь пока ничего нет"
              text="Загляните в каталог — 37 моделей Apple в наличии, доставка сегодня."
              action={<Link className="btn btn--primary" to="/catalog">Перейти в каталог</Link>} />
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
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Корзина</span>
          </div>
          <SectionHead idx="🛒 КОРЗИНА" title={`${cart.length} ${cart.length === 1 ? 'позиция' : 'позиции'} в корзине`}
            right={<button className="btn btn--sm btn--danger" onClick={clearCart}><Icon name="trash" size={14} /> Очистить</button>} />

          <div className="ti">
            <div className="stack gap-12">
              {cart.map((i, idx) => (
                <Reveal key={`${i.slug}-${i.storage}-${i.color}`} className="panel" delay={idx % 3}>
                  <div className="row gap-20 wrapflex">
                    <Link to={`/product/${i.slug}`} style={{ flex: 'none' }}>
                      <img src={productImg(i.slug, i.color)} alt={i.name} width="110" height="110" style={{ objectFit: 'contain' }} />
                    </Link>
                    <div className="grow" style={{ minWidth: 190 }}>
                      <Link to={`/product/${i.slug}`}><h4 className="card__title">{i.name}</h4></Link>
                      <p className="tiny muted" style={{ marginTop: 5 }}>{i.storage} · {i.color}</p>
                      <p className="num accent" style={{ marginTop: 8 }}>{money(i.price)}</p>
                    </div>
                    <div className="stack gap-10" style={{ alignItems: 'flex-end' }}>
                      <Qty value={i.qty} onChange={(q) => setQty(idx, q)} />
                      <button className="btn btn--quiet btn--sm" onClick={() => removeFromCart(idx)}>
                        <Icon name="trash" size={13} /> Удалить
                      </button>
                    </div>
                    <div className="num" style={{ fontWeight: 700, minWidth: 110, textAlign: 'right' }}>{money(i.price * i.qty)}</div>
                  </div>
                </Reveal>
              ))}
            </div>

            <aside className="ti__sum">
              <div className="panel panel--accent brackets">
                <span className="mono-label">Итого</span>

                <div className="field" style={{ margin: '18px 0' }}>
                  <span className="field__label">Промокод</span>
                  <div className="row gap-6">
                    <input className="input" value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())}
                      placeholder="EKLIMIKS10" style={{ textTransform: 'uppercase' }} />
                    <button className="btn btn--sm btn--outline" onClick={checkPromo} type="button">ОК</button>
                  </div>
                  {applied && <span className="field__hint ok">Применён: {applied.note} (−{applied.discount}%)</span>}
                </div>

                <div className="kv"><span className="kv__k">Товары</span><span className="kv__v num">{money(cartTotal)}</span></div>
                {discount > 0 && <div className="kv"><span className="kv__k">Скидка</span><span className="kv__v num ok">−{money(discount)}</span></div>}
                <div className="kv"><span className="kv__k">Доставка по Кургану</span><span className="kv__v num">{delivery === 0 ? 'бесплатно' : money(delivery)}</span></div>
                <div className="kv kv--total"><span className="kv__k">К оплате</span><span className="kv__v">{money(total + delivery)}</span></div>

                <button className="btn btn--primary btn--block" style={{ marginTop: 18 }}
                  onClick={() => nav('/checkout', { state: { promo: applied ? applied.code : null, discount } })}>
                  <Icon name="card" size={16} /> Оформить заказ
                </button>

                <p className="tiny muted" style={{ marginTop: 12 }}>
                  Бонусами вернётся <b className="accent">+{Math.round((total + delivery) * 0.02).toLocaleString('ru-RU')} EK</b> — 1 EK = 1 ₽ на следующий заказ.
                </p>
                {!user && <p className="tiny muted" style={{ marginTop: 8 }}>Войдите, чтобы копить бонусы и видеть историю заказов.</p>}
              </div>

              <div className="panel" style={{ marginTop: 16 }}>
                <div className="stack gap-10">
                  <div className="row gap-10"><Icon name="shield" size={15} className="accent" /><span className="small">Гарантия 12 месяцев</span></div>
                  <div className="row gap-10"><Icon name="truck" size={15} className="accent" /><span className="small">Доставка сегодня по Кургану</span></div>
                  <div className="row gap-10"><Icon name="box" size={15} className="accent" /><span className="small">Бесплатный самовывоз</span></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}
