import React from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui.jsx'

export default function NotFound() {
  return (
    <div className="page-enter">
      <section className="section">
        <div className="wrap center" style={{ padding: 'clamp(50px,10vw,120px) 0' }}>
          <span className="mono-label accent">Ошибка 404</span>
          <h1 className="h-display" style={{ margin: '18px 0' }}>СТРАНИЦА<br />НЕ НАЙДЕНА</h1>
          <p className="lead" style={{ margin: '0 auto 28px' }}>
            Возможно, товар закончился или ссылка устарела. Вернитесь в каталог — там 37 моделей Apple в наличии.
          </p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <Link className="btn btn--primary btn--lg" to="/catalog"><Icon name="arrow" size={16} /> В каталог</Link>
            <Link className="btn btn--lg btn--outline" to="/">На главную</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
