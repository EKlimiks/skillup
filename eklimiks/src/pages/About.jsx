import React from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { Icon, Reveal, SectionHead, Marquee } from '../components/ui.jsx'

const TEAM = [
  ['Алексей Екимов', 'Основатель, 12 лет в retail', 'AE'],
  ['Марина Соколова', 'Руководитель сервиса', 'МС'],
  ['Артём Соколов', 'Ведущий мастер по iPhone', 'АС'],
  ['Дмитрий Ковалёв', 'Инженер по Mac', 'ДК'],
]

const VALUES = [
  ['shield', 'Только оригинал', 'Работаем с официальными поставками. Каждый IMEI проверяется на сайте Apple при вас.'],
  ['tool', 'Свой сервис', 'Не отдаём ремонт на сторону: собственная мастерская и аттестованные мастера.'],
  ['eye', 'Прозрачные цены', 'Стоимость фиксируем до начала работ и не меняем в процессе.'],
  ['recycle', 'Осознанное потребление', 'Trade-In и восстановленная техника — меньше электронного мусора.'],
]

export default function About() {
  const { settings } = useApp()
  return (
    <div className="page-enter">
      <section className="hero" style={{ paddingBottom: 0 }}>
        <div className="hero__grid-bg" />
        <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero__meta">
            <span className="mono-label">О компании</span><i className="hero__cl" />
            <span className="mono-label accent">Курган · с 2016</span>
          </div>
          <h1 className="h-display">МАГАЗИН,<br /><span className="accent">КОТОРЫЙ ЧИНИТ</span></h1>
          <p className="lead" style={{ marginTop: 24 }}>
            EKlimiks начинался как одна мастерская по ремонту iPhone на Тверской. Сегодня это три салона,
            собственный сервисный центр и интернет-магазин, через который прошло более 12 000 устройств Apple.
          </p>
        </div>
        <div className="hero__marq">
          <Marquee items={['12 480 проданных устройств', '3 812 Trade-In сделок', '9 400 ремонтов', '4.9 из 5 по 1 240 отзывам', '3 салона в Кургане']} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead idx="01 / ПРИНЦИПЫ" title="Почему нам доверяют" />
          <div className="grid grid--4">
            {VALUES.map(([i, t, d], k) => (
              <Reveal key={t} delay={k}>
                <div className="card card--hover brackets" style={{ height: '100%' }}>
                  <span className="svc__ico" style={{ marginBottom: 16 }}><Icon name={i} size={19} /></span>
                  <h3 className="card__title" style={{ marginBottom: 10 }}>{t}</h3>
                  <p className="muted small">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="grid grid--2" style={{ alignItems: 'center', gap: 'clamp(24px,4vw,60px)' }}>
            <div>
              <SectionHead idx="02 / СЕРВИС" title="Мастерская внутри магазина" />
              <p className="lead" style={{ marginBottom: 20 }}>
                Покупка и обслуживание в одном месте: не нужно искать сервис, если что-то случится.
                Диагностика бесплатная, а запись к конкретному мастеру открыта онлайн.
              </p>
              <div className="stack gap-14">
                {[['Диагностика', '20 минут, бесплатно, с письменным заключением'],
                  ['Замена дисплея iPhone', '40 минут, оригинальный модуль'],
                  ['Замена аккумулятора MacBook', '1.5 часа, с калибровкой контроллера'],
                  ['Восстановление после воды', '2–3 дня, ультразвуковая чистка платы']].map(([t, d]) => (
                  <div className="kv" key={t}><span className="kv__k">{t}</span><span className="kv__v small">{d}</span></div>
                ))}
              </div>
              <div className="btn-row" style={{ marginTop: 24 }}>
                <Link className="btn btn--primary" to="/repair">Записаться в сервис <Icon name="arrow" size={15} /></Link>
                <Link className="btn btn--outline" to="/trade-in">Оценить Trade-In</Link>
              </div>
            </div>

            <Reveal>
              <div className="panel panel--accent">
                <p className="mono-label" style={{ marginBottom: 16 }}>В цифрах</p>
                <div className="grid grid--2" style={{ gap: 18 }}>
                  {[['12 480', 'проданных устройств'], ['9 400', 'выполненных ремонтов'],
                    ['3 812', 'Trade-In сделок'], ['4.9', 'средняя оценка']].map(([v, l]) => (
                    <div key={l}><div className="stat__v num">{v}</div><div className="stat__l">{l}</div></div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <SectionHead idx="03 / КОМАНДА" title="Кто работает в салонах" />
          <div className="grid grid--4">
            {TEAM.map(([n, r, ini], i) => (
              <Reveal key={n} delay={i}>
                <div className="card card--hover center">
                  <span className="master__av" style={{ margin: '0 auto 16px', width: 58, height: 58, fontSize: '1.05rem' }}>{ini}</span>
                  <h3 className="card__title">{n}</h3>
                  <p className="muted small" style={{ marginTop: 8 }}>{r}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="cta">
            <div className="cta__grid">
              <div className="stack gap-14">
                <h2 className="h2">Приходите в салон</h2>
                <p className="lead">Посмотрите технику вживую, проверьте IMEI и получите консультацию мастера — без записи.</p>
                <div className="btn-row">
                  <Link className="btn btn--primary" to="/contacts">Адреса салонов</Link>
                  <a className="btn btn--outline" href={settings.telegramUrl} target="_blank" rel="noreferrer"><Icon name="tg" size={15} /> @{settings.telegram}</a>
                </div>
              </div>
              <div className="panel">
                <p className="mono-label" style={{ marginBottom: 12 }}>Реквизиты</p>
                <div className="kv"><span className="kv__k">ООО</span><span className="kv__v">«Эклимикс»</span></div>
                <div className="kv"><span className="kv__k">ИНН</span><span className="kv__v num">7701234567</span></div>
                <div className="kv"><span className="kv__k">ОГРН</span><span className="kv__v num">1167746112233</span></div>
                <div className="kv"><span className="kv__k">Юр. адрес</span><span className="kv__v small" style={{ maxWidth: 200 }}>{settings.address}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
