import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { REPAIR_SERVICES, MASTERS } from '../data/catalog.js'
import { money, upcomingDates, weekdayRu, dayNum, monthRu } from '../lib/format.js'
import { Icon, Reveal, SectionHead, Field, Stars, Accordion } from '../components/ui.jsx'

const FAQ = [
  { q: 'Сколько стоит диагностика?', a: 'Бесплатно. Мастер разбирает устройство, находит причину и называет точную стоимость до начала работ. Если вы откажетесь от ремонта — ничего не платите.' },
  { q: 'Какие запчасти вы используете?', a: 'На iPhone и iPad ставим оригинальные дисплейные модули и аккумуляторы, на Mac — оригинальные либо сертифицированные комплектующие. Все детали с гарантией 6 месяцев.' },
  { q: 'Сохранится ли влагозащита?', a: 'Да, при замене дисплея и аккумулятора мы меняем клеевую рамку на новую заводскую и восстанавливаем герметичность корпуса.' },
  { q: 'Что если ремонт не помог?', a: 'Если неисправность не устранена — возвращаем деньги полностью. Такое случается редко: перед работами мы всегда делаем полную диагностику.' },
  { q: 'Можно ли сдать устройство курьеру?', a: 'Да, по Кургану работает курьерская доставка в сервис и обратно — 600 ₽ или бесплатно для постоянных клиентов.' },
]

export default function Repair() {
  const { user, toast } = useApp()
  const [step, setStep] = useState(1)
  const [service, setService] = useState(REPAIR_SERVICES[0].slug)
  const [device, setDevice] = useState('')
  const [issue, setIssue] = useState('')
  const [masterId, setMasterId] = useState(MASTERS[0].id)
  const [date, setDate] = useState(upcomingDates(12)[0])
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState(null)
  const [contact, setContact] = useState({ name: '', phone: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  const dates = upcomingDates(12)
  const svc = REPAIR_SERVICES.find((s) => s.slug === service)
  const master = MASTERS.find((m) => m.id === masterId)

  useEffect(() => { if (user) setContact({ name: user.name, phone: user.phone }) }, [user])

  /* свободные слоты выбранного мастера на выбранную дату — из «БД» */
  useEffect(() => {
    let alive = true
    setSlots(null); setTime('')
    api.masterSlots(masterId, date).then((s) => { if (alive) setSlots(s) })
    return () => { alive = false }
  }, [masterId, date])

  useEffect(() => {
    const m = device || issue
    if (m && step === 1) setStep(2)
  }, [device, issue])

  const submit = async (e) => {
    e.preventDefault()
    if (!device.trim()) { toast('Укажите модель устройства', 'danger'); return }
    if (!time) { toast('Выберите свободное время визита', 'danger'); return }
    if (!contact.name.trim() || contact.phone.replace(/\D/g, '').length < 10) { toast('Заполните имя и телефон', 'danger'); return }
    setBusy(true)
    const r = await api.createRepair({
      serviceSlug: service, masterId, slotDate: date, slotTime: time,
      device, issue, price: svc.priceFrom, customerName: contact.name, customerPhone: contact.phone,
    })
    setBusy(false); setDone(r)
    toast(`Запись оформлена: ${date} в ${time}`)
  }

  if (done) {
    return (
      <div className="page-enter">
        <section className="section">
          <div className="wrap wrap--narrow">
            <div className="panel panel--accent brackets center" style={{ padding: 'clamp(28px,5vw,56px)' }}>
              <Icon name="check" size={44} className="ok" />
              <h1 className="h2" style={{ margin: '18px 0 12px' }}>Вы записаны на ремонт</h1>
              <p className="lead" style={{ margin: '0 auto' }}>
                Номер заявки <b className="accent num">{done.number}</b>. Мастер {master.name} ждёт вас
                {' '}{new Date(done.slotDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {done.slotTime}.
              </p>
              <div className="panel" style={{ textAlign: 'left', marginTop: 26, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
                <div className="kv"><span className="kv__k">Услуга</span><span className="kv__v">{svc.name}</span></div>
                <div className="kv"><span className="kv__k">Устройство</span><span className="kv__v">{done.device}</span></div>
                <div className="kv"><span className="kv__k">Мастер</span><span className="kv__v">{master.name}</span></div>
                <div className="kv"><span className="kv__k">Стоимость от</span><span className="kv__v num">{svc.priceFrom ? money(svc.priceFrom) : 'бесплатно'}</span></div>
                <div className="kv"><span className="kv__k">Длительность</span><span className="kv__v">{svc.duration}</span></div>
              </div>
              <div className="btn-row" style={{ justifyContent: 'center', marginTop: 24 }}>
                <Link className="btn btn--primary" to="/account">Отслеживать в кабинете</Link>
                <Link className="btn btn--outline" to="/track">Проверить по номеру</Link>
              </div>
            </div>
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
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Ремонт</span>
          </div>
          <SectionHead idx="🛠️ СЕРВИС" title="Запись в мастерскую"
            sub="Выберите услугу, мастера и удобное время — система покажет только свободные слоты. Диагностика бесплатная." />

          <div className="steps" style={{ marginBottom: 28 }}>
            {['Услуга', 'Мастер и время', 'Контакты'].map((s, i) => (
              <span key={s} className={`step ${step > i + 1 ? 'is-done' : step === i + 1 ? 'is-now' : ''}`}>
                <i className="step__n">{String(i + 1).padStart(2, '0')}</i>{s}
              </span>
            ))}
          </div>

          <div className="ti">
            <div className="stack gap-22">
              {/* 1. услуга и устройство */}
              <Reveal className="panel">
                <h3 className="h3" style={{ marginBottom: 18 }}>01 · Услуга и устройство</h3>
                <div className="grid grid--2" style={{ gap: 10, marginBottom: 22 }}>
                  {REPAIR_SERVICES.map((s) => (
                    <button key={s.slug} className={`ti__model ${service === s.slug ? 'is-on' : ''}`}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}
                      onClick={() => { setService(s.slug); setStep(2) }}>
                      <span style={{ fontWeight: 600, textAlign: 'left' }}>{s.name}</span>
                      <span className="tiny muted">{s.category} · {s.duration}</span>
                      <span className="tiny accent num">{s.priceFrom ? `от ${money(s.priceFrom)}` : 'бесплатно'}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid--2" style={{ gap: 14 }}>
                  <Field label="Модель устройства *">
                    <input className="input" value={device} onChange={(e) => setDevice(e.target.value)} placeholder="iPhone 15 Pro, MacBook Air M2…" />
                  </Field>
                  <Field label="Что случилось">
                    <input className="input" value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Разбит экран, не держит батарею…" />
                  </Field>
                </div>
              </Reveal>

              {/* 2. мастер и время */}
              <Reveal delay={1} className="panel">
                <h3 className="h3" style={{ marginBottom: 18 }}>02 · Мастер, дата и время</h3>

                <span className="field__label">Мастер</span>
                <div className="grid grid--2" style={{ gap: 10, margin: '10px 0 24px' }}>
                  {MASTERS.map((m) => (
                    <button key={m.id} className={`master ${masterId === m.id ? 'is-on' : ''}`} onClick={() => setMasterId(m.id)}>
                      <span className="master__av">{m.name.split(' ').map((w) => w[0]).join('')}</span>
                      <span>
                        <b style={{ display: 'block', fontWeight: 600 }}>{m.name}</b>
                        <span className="tiny muted">{m.specialization}</span>
                        <span className="tiny muted" style={{ display: 'block', marginTop: 3 }}>
                          <Stars value={m.rating} size={10} /> {m.rating} · опыт {m.experience} лет
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                <span className="field__label">Дата визита</span>
                <div className="dates" style={{ margin: '10px 0 22px' }}>
                  {dates.map((d) => (
                    <button key={d} className={`date ${date === d ? 'is-on' : ''}`} onClick={() => setDate(d)}>
                      <div className="date__d">{dayNum(d)}</div>
                      <div className="date__m">{monthRu(d)}</div>
                      <div className="date__m" style={{ color: 'var(--muted-2)' }}>{weekdayRu(d)}</div>
                    </button>
                  ))}
                </div>

                <span className="field__label">
                  Свободное время {slots && <span className="muted">— {slots.length} из 10 слотов свободно</span>}
                </span>
                <div style={{ marginTop: 10 }}>
                  {slots === null ? (
                    <div className="slots">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="skel" style={{ height: 40 }} />)}</div>
                  ) : slots.length === 0 ? (
                    <p className="muted small">На эту дату у мастера всё занято. Выберите другую дату или мастера.</p>
                  ) : (
                    <div className="slots">
                      {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((t) => (
                        <button key={t} className={`slot ${time === t ? 'is-on' : ''}`} disabled={!slots.includes(t)}
                          onClick={() => setTime(t)}>{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>

              {/* 3. контакты */}
              <Reveal delay={2} className="panel">
                <h3 className="h3" style={{ marginBottom: 18 }}>03 · Контакты</h3>
                <form className="stack gap-14" onSubmit={submit}>
                  <div className="grid grid--2" style={{ gap: 14 }}>
                    <Field label="Имя *">
                      <input className="input" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Иван" />
                    </Field>
                    <Field label="Телефон *">
                      <input className="input" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+7 (___) ___-__-__" inputMode="tel" />
                    </Field>
                  </div>
                  <button className="btn btn--primary btn--block" disabled={busy}>
                    {busy ? <span className="spinner" /> : <Icon name="calendar" size={16} />} Записаться на ремонт
                  </button>
                  <p className="tiny muted">Диагностика бесплатная. Стоимость работ согласуем до начала ремонта.</p>
                </form>
              </Reveal>
            </div>

            {/* ── итог ── */}
            <aside className="ti__sum">
              <div className="panel panel--accent brackets">
                <span className="mono-label">Ваша запись</span>
                <h4 className="h4" style={{ margin: '12px 0 16px' }}>{svc.name}</h4>

                <div className="kv"><span className="kv__k">Категория</span><span className="kv__v">{svc.category}</span></div>
                <div className="kv"><span className="kv__k">Длительность</span><span className="kv__v">{svc.duration}</span></div>
                <div className="kv"><span className="kv__k">Мастер</span><span className="kv__v">{master.name}</span></div>
                <div className="kv"><span className="kv__k">Дата</span><span className="kv__v">{dayNum(date)} {monthRu(date)}, {weekdayRu(date)}</span></div>
                <div className="kv"><span className="kv__k">Время</span><span className="kv__v">{time || '— не выбрано'}</span></div>
                <div className="kv kv--total"><span className="kv__k">Стоимость от</span><span className="kv__v">{svc.priceFrom ? money(svc.priceFrom) : '0 ₽'}</span></div>

                <p className="tiny muted" style={{ marginTop: 14 }}>{svc.note}</p>
              </div>

              <div className="panel" style={{ marginTop: 16 }}>
                <p className="mono-label" style={{ marginBottom: 12 }}>Почему нам доверяют</p>
                <div className="stack gap-10">
                  <div className="row gap-10"><Icon name="shield" size={15} className="accent" /><span className="small">Гарантия 6 мес. на работы</span></div>
                  <div className="row gap-10"><Icon name="clock" size={15} className="accent" /><span className="small">40 минут — замена дисплея</span></div>
                  <div className="row gap-10"><Icon name="tool" size={15} className="accent" /><span className="small">Своя мастерская, без посредников</span></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap wrap--narrow">
          <SectionHead idx="ВОПРОСЫ" title="О ремонте" />
          <Accordion items={FAQ} />
        </div>
      </section>
    </div>
  )
}
