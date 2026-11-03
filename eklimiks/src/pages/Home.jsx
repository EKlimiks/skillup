import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { CATEGORIES } from '../data/catalog.js'
import { productImg, money, num, plural } from '../lib/format.js'
import { Icon, Reveal, SectionHead, ProductCard, Decode, Marquee, Stars, Accordion } from '../components/ui.jsx'
import { CountUp, Magnetic, Parallax } from '../components/motion.jsx'

/* ── услуги: первая карточка крупная (bento-сетка как на референсе) ── */
const SERVICES = [
  {
    size: 'big', ico: 'recycle', t: 'Trade-In', to: '/trade-in', go: 'Оценить устройство',
    d: 'Сдайте старое устройство и получите скидку на новое. Онлайн-оценка занимает минуту: калькулятор учитывает модель, объём памяти, состояние корпуса и ёмкость аккумулятора, а мастер подтверждает сумму за 5 минут в салоне.',
    extra: ['до 186 000 ₽ за MacBook Pro', 'деньги или зачёт в заказ', '+5% бонусами сверху'],
  },
  { ico: 'tool', t: 'Ремонт', to: '/repair', go: 'Записаться', d: 'Своя мастерская: дисплеи, аккумуляторы, платы. Выбираете мастера и свободное время — система покажет только незанятые слоты.' },
  { ico: 'box', t: 'Бронирование', to: '/reserve', go: 'Забронировать', d: 'Отложите товар в салоне на удобное время. Держим 48 часов бесплатно, оплата на месте.' },
  { ico: 'truck', t: 'Доставка и рассрочка', to: '/catalog', go: 'В каталог', d: 'Курьер по Кургану в день заказа. Рассрочка 0% на 6–24 месяца без первого взноса.' },
  { ico: 'gift', t: 'Бонусы EKlimiks', to: '/account', go: 'О программе', d: '2% от каждого заказа возвращаем бонусами. 1 EK = 1 ₽, списывается до 30% покупки.' },
]

const PROCESS = [
  { t: 'Выбор', d: 'Подбираете модель в каталоге или через квиз — покажем только то, что есть в наличии.' },
  { t: 'Заявка', d: 'Оформляете заказ, бронь или запись на ремонт. Всё сохраняется в личном кабинете.' },
  { t: 'Согласование', d: 'Менеджер подтверждает наличие и оценку Trade-In в течение 15 минут.' },
  { t: 'Оплата', d: 'Картой, частями или переводом. Бонусы EKlimiks начисляются сразу.' },
  { t: 'Выдача', d: 'Самовывоз из салона или курьер. На технику — гарантия 12 месяцев.' },
]

const FAQ = [
  { q: 'Вся техника оригинальная?', a: 'Да. Мы работаем только с официальными поставками: устройства новые, активируются при вас, IMEI пробивается на сайте Apple. На всю технику даём гарантию 12 месяцев, на устройства Apple действует и гарантия производителя.' },
  { q: 'Как работает Trade-In?', a: 'Вы оцениваете устройство в калькуляторе, оставляете заявку, мастер подтверждает состояние за 5 минут и мы зачитываем сумму в новый заказ или выплачиваем деньгами. Принимаем iPhone, iPad, Mac, Apple Watch и AirPods.' },
  { q: 'Сколько ждать ремонта?', a: 'Замена дисплея или аккумулятора iPhone — 30–40 минут, ремонт MacBook — от 1,5 часов. Диагностика бесплатная, точную стоимость называем до начала работ и согласовываем с вами.' },
  { q: 'Можно ли забронировать товар?', a: 'Да, бронь бесплатная и держится 48 часов. Выбираете салон и удобное время — товар ждёт вас, оплата на месте.' },
  { q: 'Есть ли рассрочка?', a: 'Да, рассрочка 0% на 6, 12 или 24 месяца без первоначального взноса. Оформление занимает около 10 минут, нужен только паспорт.' },
  { q: 'Что с гарантией на ремонт?', a: 'На выполненные работы и установленные детали даём гарантию 6 месяцев. Если что-то пойдёт не так — переделаем бесплатно.' },
]

const STATS = [
  { v: 12480, s: '+', l: 'проданных устройств' },
  { v: 3812, s: '', l: 'сделок Trade-In' },
  { v: 9400, s: '', l: 'выполненных ремонтов' },
  { v: 4.9, s: '/5', dec: 1, l: 'средняя оценка' },
]

/* ───────────────────────── герой ───────────────────────── */
function Hero({ feat }) {
  const [t, setT] = useState(0)
  /* фразы короткие — каждая держится в одну строку и заголовок не «прыгает» */
  const words = ['БЕЗ КОМПРОМИССОВ', 'С ГАРАНТИЕЙ', 'С TRADE-IN', 'С ДОСТАВКОЙ']
  useEffect(() => { const id = setInterval(() => setT((v) => (v + 1) % words.length), 4200); return () => clearInterval(id) }, [])

  return (
    <section className="hero">
      <div className="hero__grid-bg" />
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div className="hero__meta">
          <span className="mono-label">EKlimiks · Курган · с 2016</span>
          <i className="hero__cl" />
          <span className="mono-label" style={{ color: 'var(--accent)' }}>Линейка 2026</span>
        </div>

        <h1 className="h-display hero__title">
          <span className="ln">ТЕХНИКА APPLE</span>
          <span className="ln ln--accent"><Decode text={words[t]} speed={46} /></span>
        </h1>

        <div className="hero__bottom">
          <div className="stack gap-20">
            <p className="lead">
              Оригинальные iPhone, Mac, iPad, Apple Watch и AirPods с наличием в Кургане.
              Trade-In с оценкой онлайн, собственный сервис и бронирование в салоне — всё в одном месте.
            </p>
            <div className="btn-row">
              <Magnetic>
                <Link className="btn btn--primary btn--lg" to="/catalog">Смотреть каталог <Icon name="arrow" size={16} /></Link>
              </Magnetic>
              <Magnetic>
                <Link className="btn btn--outline btn--lg" to="/trade-in"><Icon name="recycle" size={16} /> Оценить Trade-In</Link>
              </Magnetic>
            </div>
          </div>

          <div className="hero__devices">
            {feat.slice(0, 3).map((p, i) => (
              <Parallax key={p.slug} speed={i === 1 ? -0.12 : 0.08 + i * 0.04}>
                <Link to={`/product/${p.slug}`} className="hero__dev" aria-label={p.name}>
                  <img src={productImg(p.slug, p.colors[0].id)} alt={p.name} width="400" height="533" />
                </Link>
              </Parallax>
            ))}
          </div>
        </div>
      </div>

      <div className="hero__marq">
        <Marquee items={[
          'Trade-In за 5 минут', 'Гарантия 12 месяцев', 'Рассрочка 0%', 'Своя мастерская',
          'Бесплатная диагностика', 'Доставка в день заказа', 'Бонусы EKlimiks', 'Самовывоз из 3 салонов',
        ]} />
      </div>
    </section>
  )
}

/* ───────────── отзывы: центрированный слайдер ───────────── */
function Quotes({ items }) {
  const [i, setI] = useState(0)
  const n = items.length
  useEffect(() => {
    if (n < 2) return
    const id = setInterval(() => setI((v) => (v + 1) % n), 6000)
    return () => clearInterval(id)
  }, [n])
  if (!n) return null
  return (
    <div>
      <div className="quotes">
        {items.map((r, k) => (
          <figure className={`quote ${k === i ? 'is-on' : ''}`} key={r.id} aria-hidden={k !== i}>
            <Stars value={r.rating} size={15} />
            <blockquote className="quote__t">{r.text}</blockquote>
            <figcaption className="quote__a">
              <b>{r.author}</b>
              Проверенная покупка
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="quote__dots">
        {items.map((r, k) => (
          <button key={r.id} className={`quote__dot ${k === i ? 'is-on' : ''}`} onClick={() => setI(k)}
            aria-label={`Отзыв ${k + 1}`} />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const { addToCart, favorites, toggleFavorite, settings } = useApp()
  const [feat, setFeat] = useState([])
  const [fresh, setFresh] = useState([])
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    api.products({ featured: true }).then((r) => setFeat(r.length >= 3 ? r : []))
    api.products({ sort: 'popular' }).then((r) => { setFresh(r.slice(0, 8)); setFeat((f) => (f.length ? f : r.slice(0, 3))) })
    api.reviews({ sort: 'useful', perPage: 6 }).then((r) => setReviews(r.items))
  }, [])

  const counts = { iphone: 9, mac: 8, ipad: 6, watch: 3, audio: 6, tv: 1, vision: 1, accessories: 3 }
  const quotes = useMemo(() => reviews.slice(0, 5), [reviews])
  /* для крупной bento-карточки берём узнаваемый флагман, а не случайный товар */
  const bentoShot = useMemo(
    () => fresh.find((p) => p.slug === 'iphone-18-pro-max') || fresh.find((p) => p.category === 'iphone') || fresh[0],
    [fresh],
  )

  return (
    <div className="page-enter">
      <Hero feat={feat} />

      {/* ─── полоса статистики ─── */}
      <section className="statsband">
        <div className="wrap">
          <div className="statsband__grid">
            {STATS.map((s, i) => (
              <Reveal key={s.l} delay={i} variant="up" className="statsband__i">
                <span className="statsband__v">
                  <span className="statsband__n"><CountUp value={s.v} decimals={s.dec || 0} /></span>
                  {s.s && <span className="statsband__s">{s.s}</span>}
                </span>
                <span className="statsband__l">{s.l}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── категории ─── */}
      <section className="section">
        <div className="wrap">
          <SectionHead idx="01 / КАТАЛОГ" title="Восемь категорий Apple"
            sub="От флагманского iPhone 18 Pro Max до AirTag — всё, что выпускает Apple, в наличии на складе в Кургане."
            right={<Link className="btn btn--outline" to="/catalog">Весь каталог <Icon name="arrow" size={15} /></Link>} />
          <div className="grid grid--4">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.id} delay={i % 4} variant="scale">
                <Link className="card card--hover brackets" to={`/catalog?category=${c.id}`} style={{ display: 'block', height: '100%' }}>
                  <div className="between" style={{ marginBottom: 18 }}>
                    <span className="svc__ico" style={{ width: 42, height: 42 }}><Icon name={c.icon} size={19} /></span>
                    <span className="num tiny muted">{String(counts[c.id] || 0).padStart(2, '0')}</span>
                  </div>
                  <h3 className="card__title">{c.name}</h3>
                  <p className="muted small" style={{ marginTop: 8 }}>{c.tagline}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── популярное ─── */}
      <section className="section section--tight">
        <div className="wrap">
          <SectionHead idx="02 / ХИТЫ" title="Берут чаще всего"
            sub="Позиции с наибольшим числом заказов и отзывов за последние месяцы."
            right={<Link className="btn btn--outline" to="/catalog?sort=popular">Все хиты <Icon name="arrow" size={15} /></Link>} />
          <div className="grid grid--auto">
            {fresh.map((p, i) => (
              <ProductCard key={p.slug} p={p} delay={i} onAdd={(x) => addToCart(x)}
                fav={favorites.includes(p.slug)} onFav={toggleFavorite} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── услуги: bento ─── */}
      <section className="section">
        <div className="wrap">
          <SectionHead idx="03 / СЕРВИСЫ" title="Больше, чем магазин"
            sub="Пять сервисов, которые закрывают весь цикл: покупка, обмен, ремонт, доставка и бонусы." />
          <div className="bento">
            {SERVICES.map((s, i) => (
              <Reveal key={s.t} delay={i % 5}
                variant="clip" className={`bento__i ${s.size === 'big' ? 'bento__i--big' : ''} ${s.size === 'wide' ? 'bento__i--wide' : ''}`}>
                <span className="bento__n">{String(i + 1).padStart(2, '0')}</span>
                {s.size === 'big' && bentoShot && (
                  <img className="bento__img" src={productImg(bentoShot.slug, bentoShot.colors[0].id)} alt="" aria-hidden="true" />
                )}
                <span className="bento__ico"><Icon name={s.ico} size={s.size === 'big' ? 24 : 20} /></span>
                <h3 className="bento__t">{s.t}</h3>
                <p className="bento__d">{s.d}</p>
                {s.extra && (
                  <ul className="stack gap-8" style={{ position: 'relative', zIndex: 2, marginTop: 18 }}>
                    {s.extra.map((x) => (
                      <li key={x} className="row gap-10 small" style={{ color: 'var(--text-2)' }}>
                        <Icon name="check" size={15} className="accent" />{x}
                      </li>
                    ))}
                  </ul>
                )}
                <Link className="bento__go" to={s.to}>{s.go} <Icon name="arrow" size={14} /></Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── процесс ─── */}
      <section className="section section--tight">
        <div className="wrap">
          <SectionHead idx="04 / ПРОЦЕСС" title="Пять шагов до нового устройства" />
          <div className="proc">
            {PROCESS.map((p, i) => (
              <Reveal className="proc__i" key={p.t} variant="left" delay={i}>
                <span className="proc__n">Шаг {String(i + 1).padStart(2, '0')}</span>
                <h3 className="proc__t">{p.t}</h3>
                <p className="proc__d">{p.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trade-In: полноэкранная полоса ─── */}
      <section className="reel">
        <div className="reel__glow" />
        <div className="reel__vignette" />
        <div className="reel__scan" />
        <div className="wrap wrap--narrow reel__in">
          <Reveal className="stack gap-14" style={{ alignItems: 'center' }}>
            <span className="mono-label" style={{ color: 'var(--accent)' }}>05 / TRADE-IN</span>
            <h2 className="h-display" style={{ fontSize: 'clamp(1.9rem, 5vw, 4.4rem)' }}>
              СТАРОЕ —<br /><span className="accent">В СЧЁТ НОВОГО</span>
            </h2>
            <div className="reel__divider" />
            <p className="reel__sub">Оценка за минуту · подтверждение за 5 минут</p>
            <p className="lead" style={{ textAlign: 'center', marginTop: 22 }}>
              Принимаем iPhone, iPad, Mac, Apple Watch и AirPods. Расчёт учитывает модель, объём памяти,
              состояние корпуса и ёмкость аккумулятора. Деньгами или зачётом в заказ — как удобнее.
            </p>
            <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12 }}>
              <Link className="btn btn--primary btn--lg" to="/trade-in">Рассчитать стоимость <Icon name="arrow" size={16} /></Link>
              <Link className="btn btn--outline btn--lg" to="/repair">Услуги сервиса</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── отзывы ─── */}
      <section className="section section--tight">
        <div className="wrap wrap--narrow">
          <SectionHead idx="06 / ОТЗЫВЫ" title="Что говорят клиенты"
            right={<Link className="btn btn--outline btn--sm" to="/reviews">Все отзывы <Icon name="arrow" size={14} /></Link>} />
          <Reveal variant="scale"><Quotes items={quotes} /></Reveal>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="section">
        <div className="wrap wrap--narrow">
          <SectionHead idx="07 / ВОПРОСЫ" title="Частые вопросы" />
          <Accordion items={FAQ} />
        </div>
      </section>

      {/* ─── финальный CTA ─── */}
      <section className="section section--tight">
        <div className="wrap">
          <Reveal variant="blur" className="cta">
            <div className="cta__grid">
              <div className="stack gap-14">
                <h2 className="h2">Нужна консультация?</h2>
                <p className="lead">Напишите в Telegram-бот — ответим по наличию, Trade-In и ремонту в течение пары минут.</p>
                <div className="btn-row">
                  <a className="btn btn--tg btn--lg" href={settings.telegramUrl} target="_blank" rel="noreferrer">
                    <Icon name="tg" size={17} /> @{settings.telegram}
                  </a>
                  <a className="btn btn--outline btn--lg" href={`tel:${(settings.phone || '').replace(/\D/g, '')}`}>
                    <Icon name="phone" size={16} /> {settings.phone}
                  </a>
                </div>
              </div>
              <div className="panel">
                <p className="mono-label" style={{ marginBottom: 12 }}>Быстрые ссылки</p>
                <div className="ftr__l">
                  <Link to="/picker">Подобрать модель за 4 вопроса</Link>
                  <Link to="/track">Проверить статус заказа или ремонта</Link>
                  <Link to="/compare">Сравнить до трёх моделей</Link>
                  <Link to="/account">Личный кабинет и бонусы</Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
