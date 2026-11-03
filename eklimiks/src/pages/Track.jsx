import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, STATUS, ORDER_FLOW, REPAIR_FLOW } from '../lib/api.js'
import { productImg, money, dateTimeRu } from '../lib/format.js'
import { Icon, Field, SectionHead, Empty } from '../components/ui.jsx'

const stCls = (map, key) => 'st st--' + ((map[key] || {}).color || 'muted')

function Flow({ flow, status, map }) {
  const idx = flow.indexOf(status)
  return (
    <div className="steps">
      {flow.map((s, i) => (
        <span key={s} className={`step ${i < idx ? 'is-done' : i === idx ? 'is-now' : ''}`}>
          <i className="step__n">{String(i + 1).padStart(2, '0')}</i>{map[s].label}
        </span>
      ))}
    </div>
  )
}

export default function Track() {
  const [num, setNum] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const search = async (e) => {
    e?.preventDefault()
    if (!num.trim()) return
    setBusy(true); setErr(''); setRes(null)
    const r = await api.track(num)
    setBusy(false)
    if (!r) setErr('Заказ или заявка с таким номером не найдены. Проверьте номер — например, EK-2026-000143 или RM-2026-000071.')
    else setRes(r)
  }

  const isOrder = res && 'items' in res

  return (
    <div className="page-enter">
      <section className="section">
        <div className="wrap wrap--narrow">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Статус заказа</span>
          </div>
          <SectionHead idx="ОТСЛЕЖИВАНИЕ" title="Где мой заказ?"
            sub="Введите номер заказа (EK-2026-000143) или заявки на ремонт (RM-2026-000071) — покажем текущий статус." />

          <form className="panel stack gap-14" onSubmit={search}>
            <Field label="Номер заказа или заявки" hint="Номер указан в чеке и в личном кабинете">
              <div className="row gap-10">
                <input className="input" value={num} onChange={(e) => setNum(e.target.value.toUpperCase())} placeholder="EK-2026-000143" />
                <button className="btn btn--primary" disabled={busy}>
                  {busy ? <span className="spinner" /> : <Icon name="search" size={16} />}
                </button>
              </div>
            </Field>
            <div className="row gap-10 wrapflex">
              <span className="tiny muted">Попробовать:</span>
              <button type="button" className="chip" onClick={() => setNum('EK-2026-000143')}>EK-2026-000143</button>
              <button type="button" className="chip" onClick={() => setNum('RM-2026-000071')}>RM-2026-000071</button>
            </div>
          </form>

          {err && <p className="field__err" style={{ marginTop: 20 }}><Icon name="close" size={13} /> {err}</p>}

          {res && (
            <div className="panel panel--accent" style={{ marginTop: 22 }}>
              <div className="between" style={{ flexWrap: 'wrap', marginBottom: 18 }}>
                <div>
                  <span className="mono-label">{isOrder ? 'Заказ' : 'Заявка на ремонт'}</span>
                  <h3 className="h3" style={{ marginTop: 8 }}>{res.number || `#${res.id}`}</h3>
                  <p className="tiny muted">{dateTimeRu(res.createdAt)}</p>
                </div>
                <span className={stCls(isOrder ? STATUS.order : STATUS.repair, res.status)}>
                  {(isOrder ? STATUS.order : STATUS.repair)[res.status].label}
                </span>
              </div>

              <Flow flow={isOrder ? ORDER_FLOW : REPAIR_FLOW} status={res.status} map={isOrder ? STATUS.order : STATUS.repair} />

              <div className="hr" style={{ margin: '20px 0' }} />

              {isOrder ? (
                <>
                  {res.items.map((i) => (
                    <div className="between" key={i.slug + i.storage} style={{ padding: '8px 0' }}>
                      <span className="row gap-12">
                        <img src={productImg(i.slug, i.color)} alt="" width="42" height="42" style={{ objectFit: 'contain' }} />
                        <span>{i.name}<span className="tiny muted" style={{ display: 'block' }}>{i.storage} × {i.qty}</span></span>
                      </span>
                      <span className="num">{money(i.price * i.qty)}</span>
                    </div>
                  ))}
                  <div className="kv kv--total"><span className="kv__k">Итого</span><span className="kv__v">{money(res.total)}</span></div>
                  <p className="tiny muted" style={{ marginTop: 12 }}>
                    {res.deliveryType === 'pickup'
                      ? `Самовывоз: ${res.slotDate} в ${res.slotTime}, ${res.address}`
                      : `Доставка: ${res.address}`}
                  </p>
                </>
              ) : (
                <>
                  <div className="kv"><span className="kv__k">Устройство</span><span className="kv__v">{res.device}</span></div>
                  <div className="kv"><span className="kv__k">Неисправность</span><span className="kv__v" style={{ maxWidth: 320 }}>{res.issue || '—'}</span></div>
                  <div className="kv"><span className="kv__k">Визит</span><span className="kv__v">{res.slotDate} в {res.slotTime}</span></div>
                  <div className="kv"><span className="kv__k">Стоимость</span><span className="kv__v num accent">{res.price ? money(res.price) : 'уточняется'}</span></div>
                </>
              )}
            </div>
          )}

          {!res && !err && (
            <div className="grid grid--3" style={{ marginTop: 30 }}>
              {[
                ['box', 'Новый', 'Заказ принят и проверяется складом'],
                ['truck', 'Собран', 'Готов к выдаче или передан курьеру'],
                ['check', 'Выдан', 'Заказ получен, гарантия активна'],
              ].map(([i, t, d]) => (
                <div className="card" key={t}>
                  <span className="svc__ico" style={{ marginBottom: 14 }}><Icon name={i} size={18} /></span>
                  <h3 className="card__title" style={{ marginBottom: 8 }}>{t}</h3>
                  <p className="muted small">{d}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
