import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { money } from '../lib/format.js'
import { Icon, Reveal, SectionHead, ProductCard } from '../components/ui.jsx'

const QUESTIONS = [
  {
    q: 'Что для вас важнее всего?',
    hint: 'Определим приоритет в характеристиках',
    opts: [
      { v: 'power', l: 'Максимальная мощность', d: 'Камера, чип, профессиональные задачи', ico: 'bolt' },
      { v: 'compact', l: 'Компактность и вес', d: 'Чтобы помещалось в карман или маленькую сумку', ico: 'vision' },
      { v: 'battery', l: 'Автономность и экран', d: 'Большой дисплей, долго держит заряд', ico: 'shield' },
      { v: 'price', l: 'Разумная цена', d: 'Лучшее соотношение возможностей и стоимости', ico: 'tag' },
    ],
  },
  {
    q: 'Для каких задач берёте?',
    hint: 'Подберём класс устройства',
    opts: [
      { v: 'work', l: 'Работа и творчество', d: 'Монтаж, код, дизайн, музыка', ico: 'laptop' },
      { v: 'study', l: 'Учёба и заметки', d: 'Лекции, конспекты, чтение', ico: 'edit' },
      { v: 'travel', l: 'Путешествия и спорт', d: 'Навигация, тренировки, фото', ico: 'pin' },
      { v: 'home', l: 'Дом и развлечения', d: 'Фильмы, музыка, умный дом', ico: 'tv' },
    ],
  },
  {
    q: 'Какой бюджет комфортен?',
    hint: 'Покажем варианты в этом диапазоне',
    opts: [
      { v: 'low', l: 'до 60 000 ₽', d: 'Доступные модели', ico: 'wallet' },
      { v: 'mid', l: '60 000 – 130 000 ₽', d: 'Оптимальный диапазон', ico: 'wallet' },
      { v: 'high', l: '130 000 – 250 000 ₽', d: 'Продвинутые конфигурации', ico: 'wallet' },
      { v: 'any', l: 'Без ограничений', d: 'Покажите лучшее', ico: 'spark' },
    ],
  },
  {
    q: 'Что именно нужно?',
    hint: 'Основная категория',
    opts: [
      { v: 'iphone', l: 'Смартфон', d: 'iPhone', ico: 'phone' },
      { v: 'mac', l: 'Компьютер', d: 'MacBook, iMac, Mac mini', ico: 'laptop' },
      { v: 'ipad', l: 'Планшет', d: 'iPad Pro, Air, mini', ico: 'tablet' },
      { v: 'other', l: 'Часы или аудио', d: 'Apple Watch, AirPods, HomePod', ico: 'watch' },
    ],
  },
]

const BUDGET = { low: [0, 60000], mid: [60000, 130000], high: [130000, 250000], any: [0, Infinity] }
const CATS = { iphone: ['iphone'], mac: ['mac'], ipad: ['ipad'], other: ['watch', 'audio', 'tv', 'vision'] }

function score(p, a) {
  let s = p.rating * 2
  const [lo, hi] = BUDGET[a.budget]
  if (p.price >= lo && p.price <= hi) s += 6
  else s -= Math.min(6, Math.abs(p.price < lo ? lo - p.price : p.price - hi) / 25000)

  if (CATS[a.what] && CATS[a.what].includes(p.category)) s += 7
  else s -= 5

  const name = (p.name + p.subtitle).toLowerCase()
  if (a.priority === 'power' && /(pro|max|m5|m4|ultra)/.test(name)) s += 3
  if (a.priority === 'compact' && /(air|mini|se)/.test(name)) s += 3
  if (a.priority === 'battery' && /(plus|max|pro|ultra)/.test(name)) s += 3
  if (a.priority === 'price' && (p.oldPrice || p.price < 70000)) s += 3

  if (a.task === 'work' && /(mac|pro|studio)/.test(name)) s += 3
  if (a.task === 'study' && /(ipad|air|macbook air)/.test(name)) s += 3
  if (a.task === 'travel' && /(watch|airpods|ultra|air)/.test(name)) s += 3
  if (a.task === 'home' && /(homepod|apple tv|ipad|vision)/.test(name)) s += 3

  return s
}

export default function Picker() {
  const { addToCart, favorites, toggleFavorite } = useApp()
  const [all, setAll] = useState([])
  const [step, setStep] = useState(0)
  const [ans, setAns] = useState({})
  const [done, setDone] = useState(false)

  useEffect(() => { api.products({}).then(setAll) }, [])

  const results = useMemo(() => {
    if (!done) return []
    return [...all].map((p) => ({ p, s: score(p, ans) })).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.p)
  }, [all, ans, done])

  const pick = (v) => {
    const key = ['priority', 'task', 'budget', 'what'][step]
    const next = { ...ans, [key]: v }
    setAns(next)
    if (step === QUESTIONS.length - 1) { setDone(true); setStep(step + 1) }
    else setStep(step + 1)
  }

  const restart = () => { setAns({}); setStep(0); setDone(false) }

  return (
    <div className="page-enter">
      <section className="section">
        <div className="wrap wrap--narrow">
          <div className="crumbs" style={{ marginBottom: 18 }}>
            <Link to="/">Главная</Link><span className="crumbs__sep">/</span><span className="accent">Подбор модели</span>
          </div>
          <SectionHead idx="ПОДБОР" title="Какое устройство ваше?"
            sub="Четыре вопроса — и покажем три модели, которые подходят лучше всего." />

          {!done ? (
            <div className="panel panel--accent brackets" style={{ padding: 'clamp(24px,4vw,44px)' }}>
              <div className="quiz__bar">
                {QUESTIONS.map((_, i) => <i key={i} className={i <= step ? 'is-on' : ''} />)}
              </div>
              <span className="mono-label accent">Вопрос {step + 1} из {QUESTIONS.length}</span>
              <h2 className="h2" style={{ margin: '14px 0 8px' }}>{QUESTIONS[step].q}</h2>
              <p className="muted small" style={{ marginBottom: 26 }}>{QUESTIONS[step].hint}</p>

              <div className="stack gap-10">
                {QUESTIONS[step].opts.map((o) => (
                  <button key={o.v} className="quiz__opt" onClick={() => pick(o.v)}>
                    <span className="row gap-14">
                      <span className="svc__ico" style={{ width: 40, height: 40, flex: 'none' }}><Icon name={o.ico} size={17} /></span>
                      <span>
                        <b style={{ display: 'block', fontWeight: 600 }}>{o.l}</b>
                        <span className="tiny muted">{o.d}</span>
                      </span>
                    </span>
                    <Icon name="arrow" size={17} className="accent" />
                  </button>
                ))}
              </div>

              {step > 0 && (
                <button className="btn btn--quiet btn--sm" style={{ marginTop: 20 }} onClick={() => setStep(step - 1)}>
                  ← Назад
                </button>
              )}
            </div>
          ) : (
            <div className="stack gap-24">
              <div className="panel panel--accent between" style={{ flexWrap: 'wrap' }}>
                <div>
                  <span className="mono-label accent">Готово</span>
                  <h2 className="h2" style={{ marginTop: 10 }}>Мы подобрали три модели</h2>
                  <p className="muted small" style={{ marginTop: 8 }}>
                    Приоритет: <b>{QUESTIONS[0].opts.find((o) => o.v === ans.priority)?.l}</b> ·
                    задачи: <b>{QUESTIONS[1].opts.find((o) => o.v === ans.task)?.l}</b> ·
                    бюджет: <b>{QUESTIONS[2].opts.find((o) => o.v === ans.budget)?.l}</b>
                  </p>
                </div>
                <button className="btn btn--sm btn--outline" onClick={restart}><Icon name="spark" size={14} /> Пройти заново</button>
              </div>

              <div className="grid grid--3">
                {results.map((p, i) => (
                  <ProductCard key={p.slug} p={p} delay={i} onAdd={(x) => addToCart(x)}
                    fav={favorites.includes(p.slug)} onFav={toggleFavorite} />
                ))}
              </div>

              <div className="btn-row" style={{ justifyContent: 'center' }}>
                <Link className="btn btn--primary" to="/catalog">Показать весь каталог</Link>
                <Link className="btn btn--outline" to="/trade-in">Снизить цену через Trade-In</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
