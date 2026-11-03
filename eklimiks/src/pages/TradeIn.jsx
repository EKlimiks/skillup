import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { TRADEIN_FACTORS } from '../data/catalog.js'
import { money, statusClass } from '../lib/format.js'
import { STATUS } from '../lib/api.js'
import { Icon, Reveal, SectionHead, Field, Stars, Accordion } from '../components/ui.jsx'

const MODELS = Object.keys(TRADEIN_FACTORS.base)
const STORAGES = ['64 ГБ', '128 ГБ', '256 ГБ', '512 ГБ', '1 ТБ', '2 ТБ']

const FAQ = [
  { q: 'Как вы оцениваете устройство?', a: 'Онлайн-калькулятор считает предварительную стоимость по модели, объёму памяти, состоянию корпуса и ёмкости аккумулятора. Финальную цену мастер подтверждает при осмотре — обычно она совпадает с расчётом.' },
  { q: 'Что принимаете?', a: 'iPhone, iPad, Mac, MacBook, Apple Watch, AirPods и HomePod. Устройства с iCloud-блокировкой не принимаем — обязательно отвяжите аккаунт перед сдачей.' },
  { q: 'Как получить деньги?', a: 'Двумя способами: зачесть стоимость в новый заказ (тогда добавим +5% бонусами) или получить перевод на карту в течение одного рабочего дня.' },
  { q: 'Нужна ли коробка?', a: 'Нет, комплект не обязателен. Но с оригинальной коробкой и зарядкой оценка обычно выше на 3–5%.' },
]

export default function TradeIn() {
  const [params] = useSearchParams()
  const { user, toast } = useApp()
  const [step, setStep] = useState(1)
  const [family, setFamily] = useState('iPhone')
  const [model, setModel] = useState('iPhone 18 Pro Max')
  const [storage, setStorage] = useState('256 ГБ')
  const [condition, setCondition] = useState('good')
  const [battery, setBattery] = useState(90)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(null)
  const [contact, setContact] = useState({ name: user ? user.name : '', phone: user ? user.phone : '' })

  useEffect(() => {
    const t = params.get('trade')
    if (t && MODELS.some((m) => t.startsWith(m))) setModel(MODELS.find((m) => t.startsWith(m)))
  }, [params])

  useEffect(() => { if (user) setContact({ name: user.name, phone: user.phone }) }, [user])

  const grouped = useMemo(() => {
    const g = {}
    for (const m of MODELS) {
      const k = m.split(' ')[0] === 'Apple' ? m.split(' ')[1] : m.split(' ')[0]
      ;(g[k] = g[k] || []).push(m)
    }
    return g
  }, [])

  /* пересчёт при любом изменении */
  useEffect(() => {
    let alive = true
    setBusy(true)
    api.tradeInEstimate({ model, storage, condition, battery }).then((r) => {
      if (alive) { setResult(r); setBusy(false) }
    })
    return () => { alive = false }
  }, [model, storage, condition, battery])

  const submit = async (e) => {
    e.preventDefault()
    if (!contact.name.trim() || contact.phone.replace(/\D/g, '').length < 10) {
      toast('Укажите имя и телефон', 'danger'); return
    }
    setBusy(true)
    const t = await api.createTradeIn({
      model, storage, condition, battery, estimated: result.estimated,
      customerName: contact.name, customerPhone: contact.phone,
    })
    setSent(t); setBusy(false)
    toast('Заявка на Trade-In принята')
  }

  const steps = ['Устройство', 'Состояние', 'Оценка']

  return (
    <div className="page-enter">
      <section className="section section--tight">
        <div className="wrap">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Trade-In</span>
          </div>
          <SectionHead idx="♻️ TRADE-IN" title="Обменяйте старое на новое"
            sub="Оцените устройство онлайн — расчёт обновляется мгновенно. Финальную стоимость мастер подтверждает при осмотре за 5 минут." />

          <div className="steps" style={{ marginBottom: 28 }}>
            {steps.map((s, i) => (
              <span key={s} className={`step ${step > i + 1 ? 'is-done' : step === i + 1 ? 'is-now' : ''}`}>
                <i className="step__n">{String(i + 1).padStart(2, '0')}</i>{s}
              </span>
            ))}
          </div>

          <div className="ti">
            {/* ── шаги выбора ── */}
            <div className="stack gap-26">
              {/* 1. устройство */}
              <Reveal className="panel">
                <div className="between" style={{ marginBottom: 18 }}>
                  <h3 className="h3">01 · Что сдаёте</h3>
                  {step !== 1 && <button className="btn btn--quiet btn--sm" onClick={() => setStep(1)}>Изменить</button>}
                </div>

                {step === 1 ? (
                  <div className="stack gap-20">
                    <div className="field">
                      <span className="field__label">Модель</span>
                      <div className="stack gap-16" style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 6 }}>
                        {Object.entries(grouped).map(([g, list]) => (
                          <div key={g}>
                            <p className="mono-label" style={{ marginBottom: 8 }}>{g}</p>
                            <div className="stack gap-6">
                              {list.map((m) => (
                                <button key={m} className={`ti__model ${model === m ? 'is-on' : ''}`}
                                  onClick={() => { setModel(m); setStep(2) }}>
                                  <span>{m}</span>
                                  <span className="num tiny muted">{money(TRADEIN_FACTORS.base[m])}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="field">
                      <span className="field__label">Объём памяти</span>
                      <div className="opt">
                        {STORAGES.map((s) => (
                          <button key={s} className={`opt__b ${storage === s ? 'is-on' : ''}`} onClick={() => setStorage(s)}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="muted"><b className="accent">{model}</b> · {storage}</p>
                )}
              </Reveal>

              {/* 2. состояние */}
              <Reveal delay={1} className="panel">
                <div className="between" style={{ marginBottom: 18 }}>
                  <h3 className="h3">02 · Состояние</h3>
                  {step > 2 && <button className="btn btn--quiet btn--sm" onClick={() => setStep(2)}>Изменить</button>}
                </div>

                {step === 2 ? (
                  <div className="stack gap-22">
                    <div className="field">
                      <span className="field__label">Внешнее состояние</span>
                      <div className="grid grid--2" style={{ gap: 10 }}>
                        {Object.entries(TRADEIN_FACTORS.condition).map(([k, v]) => (
                          <button key={k} className={`ti__model ${condition === k ? 'is-on' : ''}`}
                            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}
                            onClick={() => setCondition(k)}>
                            <span style={{ fontWeight: 600 }}>{v.label}</span>
                            <span className="tiny muted">{v.hint}</span>
                            <span className="tiny accent num">×{v.k}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="field">
                      <span className="field__label">Ёмкость аккумулятора — {battery}%</span>
                      <input type="range" min="60" max="100" value={battery} onChange={(e) => setBattery(+e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--accent)' }} />
                      <div className="between tiny muted"><span>60%</span><span>80%</span><span>100%</span></div>
                    </div>

                    <button className="btn btn--primary" onClick={() => setStep(3)}>
                      Показать оценку <Icon name="arrow" size={15} />
                    </button>
                  </div>
                ) : (
                  <p className="muted">
                    {TRADEIN_FACTORS.condition[condition].label} · аккумулятор {battery}%
                    {step < 2 && <button className="btn btn--quiet btn--sm" onClick={() => setStep(2)} style={{ marginLeft: 10 }}>Настроить</button>}
                  </p>
                )}
              </Reveal>

              {/* 3. заявка */}
              <Reveal delay={2} className="panel">
                <h3 className="h3" style={{ marginBottom: 18 }}>03 · Оформление заявки</h3>
                {sent ? (
                  <div className="stack gap-14">
                    <div className="row gap-10"><Icon name="check" size={20} className="ok" /><b>Заявка {sent.id ? `№${sent.id}` : ''} принята</b></div>
                    <p className="muted small">
                      Оценка: <b className="accent num">{money(sent.estimated)}</b>. Мастер EKlimiks свяжется с вами
                      по номеру {sent.customerPhone} и подтвердит стоимость. Заявку можно отследить в личном кабинете.
                    </p>
                    <div className="btn-row">
                      <Link className="btn btn--primary" to="/account">В личный кабинет</Link>
                      <Link className="btn btn--outline" to="/catalog">Выбрать новое устройство</Link>
                    </div>
                  </div>
                ) : (
                  <form className="stack gap-14" onSubmit={submit}>
                    <div className="grid grid--2" style={{ gap: 14 }}>
                      <Field label="Имя *">
                        <input className="input" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Иван" />
                      </Field>
                      <Field label="Телефон *">
                        <input className="input" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+7 (___) ___-__-__" inputMode="tel" />
                      </Field>
                    </div>
                    <label className="check">
                      <input type="checkbox" defaultChecked />
                      <span className="small muted">Зачесть стоимость в новый заказ и получить +5% бонусами</span>
                    </label>
                    <button className="btn btn--primary" disabled={busy}>
                      {busy ? <span className="spinner" /> : <Icon name="recycle" size={16} />} Отправить заявку
                    </button>
                  </form>
                )}
              </Reveal>
            </div>

            {/* ── панель оценки ── */}
            <aside className="ti__sum">
              <div className="panel panel--accent brackets" style={{ position: 'relative' }}>
                <span className="mono-label">Предварительная оценка</span>
                <div className="ti__val" style={{ marginTop: 12 }}>
                  {busy && !result ? '…' : money(result ? result.estimated : 0)}
                </div>
                <p className="tiny muted" style={{ marginTop: 10 }}>
                  {model} · {storage} · {TRADEIN_FACTORS.condition[condition].label.toLowerCase()}
                </p>

                <div className="hr" style={{ margin: '18px 0' }} />

                <p className="mono-label" style={{ marginBottom: 10 }}>Из чего складывается</p>
                {result && (
                  <>
                    <div className="kv"><span className="kv__k">База модели</span><span className="kv__v num">{money(result.factors.base)}</span></div>
                    <div className="kv"><span className="kv__k">Память {storage}</span><span className="kv__v num">×{result.factors.fStore}</span></div>
                    <div className="kv"><span className="kv__k">Состояние</span><span className="kv__v num">×{result.factors.fCond}</span></div>
                    <div className="kv"><span className="kv__k">Аккумулятор</span><span className="kv__v num">×{result.factors.fBat}</span></div>
                  </>
                )}

                <div className="hr" style={{ margin: '18px 0' }} />
                <div className="stack gap-10">
                  <div className="row gap-10"><Icon name="clock" size={15} className="accent" /><span className="small">Оценка в салоне — 5 минут</span></div>
                  <div className="row gap-10"><Icon name="wallet" size={15} className="accent" /><span className="small">Деньги или зачёт в заказ</span></div>
                  <div className="row gap-10"><Icon name="shield" size={15} className="accent" /><span className="small">Данные стираем при вас</span></div>
                </div>
              </div>

              <div className="panel" style={{ marginTop: 16 }}>
                <p className="mono-label" style={{ marginBottom: 10 }}>Уже оценили</p>
                <div className="kpi__v num" style={{ fontSize: '1.4rem' }}>3 812</div>
                <p className="tiny muted">устройства принято по Trade-In с 2016 года</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap wrap--narrow">
          <SectionHead idx="ВОПРОСЫ" title="О Trade-In" />
          <Accordion items={FAQ} />
        </div>
      </section>
    </div>
  )
}
