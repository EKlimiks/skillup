import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { STORES } from '../data/catalog.js'
import { useApp } from '../lib/store.jsx'
import { api } from '../lib/api.js'
import { Icon, SectionHead, Field, Reveal, Accordion } from '../components/ui.jsx'

const FAQ = [
  { q: 'Как добраться и есть ли парковка?', a: 'Салон на Гоголя — в центре Кургана, рядом с ТРЦ «Пушкинский», есть городская парковка. В Заозёрном — бесплатная парковка у входа, салон в двух шагах от остановки «Коли Мяготина». На Машиностроителей — своя парковка перед входом.' },
  { q: 'Можно ли приехать без записи?', a: 'Да, консультация и покупка — без записи. Запись нужна только в сервис, чтобы мастер ждал именно вас и не было очереди.' },
  { q: 'Работаете ли с юридическими лицами?', a: 'Да, выставляем счёт и закрывающие документы, оплата по безналу. Для организаций действуют отдельные условия на партии техники.' },
]

export default function Contacts() {
  const { settings, toast } = useApp()
  const [f, setF] = useState({ name: '', phone: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(STORES[0].id)

  const submit = async (e) => {
    e.preventDefault()
    if (!f.name.trim() || f.phone.replace(/\D/g, '').length < 10) { toast('Укажите имя и телефон', 'danger'); return }
    setBusy(true)
    await api.createLead({ ...f, type: 'question' })
    setBusy(false); setF({ name: '', phone: '', message: '' })
    toast('Сообщение отправлено — ответим в течение 15 минут')
  }

  return (
    <div className="page-enter">
      <section className="section section--tight">
        <div className="wrap">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Контакты</span>
          </div>
          <SectionHead idx="КОНТАКТЫ" title="Три салона в Кургане"
            sub="Приезжайте посмотреть технику, сдать устройство по Trade-In или записаться в сервис." />

          <div className="grid grid--3" style={{ marginBottom: 30 }}>
            {[
              ['phone', 'Телефон', settings.phone, `tel:${(settings.phone || '').replace(/\D/g, '')}`],
              ['tg', 'Telegram-бот', `@${settings.telegram}`, settings.telegramUrl],
              ['edit', 'E-mail', settings.email, `mailto:${settings.email}`],
            ].map(([i, t, v, href]) => (
              <Reveal key={t}>
                <a className="card card--hover brackets" href={href || '#'}
                  target={String(href || '').startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{ display: 'block' }}>
                  <span className="svc__ico" style={{ marginBottom: 16 }}><Icon name={i} size={19} /></span>
                  <p className="mono-label">{t}</p>
                  <p style={{ marginTop: 8, fontWeight: 600, fontSize: '1.05rem' }}>{v}</p>
                </a>
              </Reveal>
            ))}
          </div>

          <div className="grid grid--2" style={{ alignItems: 'start', gap: 'clamp(20px,3vw,40px)' }}>
            <div className="stack gap-12">
              {STORES.map((s) => (
                <button key={s.id} className={`store ${active === s.id ? 'is-on' : ''}`} onClick={() => setActive(s.id)} style={{ textAlign: 'left' }}>
                  <span className="svc__ico" style={{ width: 42, height: 42, flex: 'none' }}><Icon name="pin" size={18} /></span>
                  <span className="grow">
                    <b style={{ display: 'block', fontWeight: 600, fontSize: '1rem' }}>{s.name}</b>
                    <span className="muted small" style={{ display: 'block', marginTop: 4 }}>{s.address}</span>
                    <span className="tiny muted">м. {s.metro} · {s.hours}</span>
                    <span className="tiny accent num" style={{ display: 'block', marginTop: 6 }}>{s.phone}</span>
                  </span>
                </button>
              ))}

              <div className="panel" style={{ marginTop: 10 }}>
                <p className="mono-label" style={{ marginBottom: 12 }}>Реквизиты и документы</p>
                <div className="kv"><span className="kv__k">ООО «Эклимикс»</span><span className="kv__v num">ИНН 7701234567</span></div>
                <div className="kv"><span className="kv__k">Гарантия</span><span className="kv__v small" style={{ maxWidth: 240 }}>{settings.warrantyText}</span></div>
                <div className="kv"><span className="kv__k">Доставка</span><span className="kv__v small" style={{ maxWidth: 240 }}>{settings.deliveryText}</span></div>
              </div>
            </div>

            <div className="stack gap-20">
              <form className="panel stack gap-14" onSubmit={submit}>
                <p className="mono-label">Написать нам</p>
                <p className="muted small">Ответим в течение 15 минут в рабочее время. Или напишите в Telegram-бот.</p>
                <Field label="Имя *">
                  <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Иван" />
                </Field>
                <Field label="Телефон *">
                  <input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+7 (___) ___-__-__" inputMode="tel" />
                </Field>
                <Field label="Сообщение">
                  <textarea className="textarea" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Что вас интересует?" />
                </Field>
                <button className="btn btn--primary" disabled={busy}>
                  {busy ? <span className="spinner" /> : <Icon name="arrow" size={16} />} Отправить
                </button>
              </form>

              <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  height: 240, position: 'relative',
                  background: 'linear-gradient(135deg, #0b0b14, #131324)',
                  backgroundImage: 'linear-gradient(rgba(216,180,254,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(216,180,254,.12) 1px, transparent 1px)',
                  backgroundSize: '34px 34px',
                }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 20 }}>
                    <div>
                      <Icon name="pin" size={30} className="accent" />
                      <p style={{ marginTop: 12, fontWeight: 600 }}>{STORES.find((s) => s.id === active).name}</p>
                      <p className="muted small" style={{ marginTop: 6 }}>{STORES.find((s) => s.id === active).address}</p>
                      <p className="tiny muted" style={{ marginTop: 10 }}>Схема проезда выдаётся в Telegram-боте</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap wrap--narrow">
          <SectionHead idx="ВОПРОСЫ" title="О салонах" />
          <Accordion items={FAQ} />
        </div>
      </section>
    </div>
  )
}
