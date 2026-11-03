import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { Icon, Field, SectionHead } from '../components/ui.jsx'

const DEMO = [
  ['client@eklimiks.ru', 'client123', 'Клиент', 'заказы, бонусы, заявки'],
  ['manager@eklimiks.ru', 'manager123', 'Менеджер', 'админка: заявки, ремонты'],
  ['admin@eklimiks.ru', 'admin123', 'Администратор', 'полный доступ'],
]

export default function Login() {
  const { login, register, user, logout } = useApp()
  const nav = useNavigate()
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [f, setF] = useState({ email: '', password: '', name: '', phone: '' })

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      if (mode === 'login') {
        const u = await login(f.email, f.password)
        nav(u.role === 'client' ? '/account' : '/admin')
      } else {
        if (f.name.trim().length < 2) throw new Error('Укажите имя')
        if (f.password.length < 6) throw new Error('Пароль — минимум 6 символов')
        await register(f)
        nav('/account')
      }
    } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }

  const quick = async (email, password) => {
    setBusy(true); setErr('')
    try {
      const u = await login(email, password)
      nav(u.role === 'client' ? '/account' : '/admin')
    } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }

  if (user) {
    return (
      <div className="page-enter">
        <section className="section">
          <div className="wrap wrap--narrow">
            <div className="panel panel--accent center" style={{ padding: 'clamp(28px,5vw,52px)' }}>
              <span className="master__av" style={{ margin: '0 auto 16px', width: 62, height: 62, fontSize: '1.2rem' }}>
                {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </span>
              <h1 className="h2">Вы вошли как {user.name}</h1>
              <p className="muted" style={{ marginTop: 10 }}>{user.email} · роль: <b className="accent">{user.role}</b></p>
              <div className="btn-row" style={{ justifyContent: 'center', marginTop: 24 }}>
                <Link className="btn btn--primary" to="/account">Личный кабинет</Link>
                {user.role !== 'client' && <Link className="btn btn--outline" to="/admin">Админ-панель</Link>}
                <button className="btn btn--quiet" onClick={logout}>Выйти</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <section className="section">
        <div className="wrap">
          <div className="ti" style={{ gridTemplateColumns: '1fr 420px' }}>
            <div>
              <SectionHead idx="👤 АККАУНТ" title={mode === 'login' ? 'Вход в личный кабинет' : 'Регистрация'}
                sub="В кабинете хранятся заказы, брони, заявки на ремонт и Trade-In, бонусы EKlimiks и избранное." />

              <form className="panel stack gap-16" onSubmit={submit} style={{ maxWidth: 560 }}>
                <div className="tabs" style={{ marginBottom: 6 }}>
                  <button type="button" className={`tab ${mode === 'login' ? 'is-on' : ''}`} onClick={() => { setMode('login'); setErr('') }}>Вход</button>
                  <button type="button" className={`tab ${mode === 'register' ? 'is-on' : ''}`} onClick={() => { setMode('register'); setErr('') }}>Регистрация</button>
                </div>

                {mode === 'register' && (
                  <Field label="Имя и фамилия *">
                    <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Иван Петров" />
                  </Field>
                )}

                <Field label="E-mail *">
                  <input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@mail.ru" autoComplete="email" />
                </Field>

                <Field label="Пароль *" hint={mode === 'register' ? 'Минимум 6 символов' : undefined}>
                  <input className="input" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })}
                    placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                </Field>

                {mode === 'register' && (
                  <Field label="Телефон">
                    <input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+7 (___) ___-__-__" inputMode="tel" />
                  </Field>
                )}

                {err && <p className="field__err"><Icon name="close" size={13} /> {err}</p>}

                <button className="btn btn--primary btn--block" disabled={busy}>
                  {busy ? <span className="spinner" /> : <Icon name={mode === 'login' ? 'lock' : 'user'} size={16} />}
                  {mode === 'login' ? ' Войти' : ' Создать аккаунт'}
                </button>
                {mode === 'register' && <p className="tiny muted">При регистрации начислим 1 000 приветственных бонусов EK.</p>}
              </form>
            </div>

            <aside className="ti__sum">
              <div className="panel brackets">
                <p className="mono-label" style={{ marginBottom: 14 }}>Демо-доступы</p>
                <p className="tiny muted" style={{ marginBottom: 14 }}>
                  Это учебный проект — войдите под готовой ролью, чтобы посмотреть кабинет или админ-панель.
                </p>
                <div className="stack gap-10">
                  {DEMO.map(([email, pass, role, note]) => (
                    <button key={email} className="ti__model" style={{ alignItems: 'flex-start' }} onClick={() => quick(email, pass)} disabled={busy}>
                      <span className="grow">
                        <b style={{ display: 'block', fontWeight: 600 }}>{role}</b>
                        <span className="tiny muted" style={{ display: 'block' }}>{email}</span>
                        <span className="tiny" style={{ color: 'var(--muted-2)' }}>пароль: {pass} · {note}</span>
                      </span>
                      <Icon name="arrow" size={15} className="accent" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel" style={{ marginTop: 16 }}>
                <p className="mono-label" style={{ marginBottom: 12 }}>Роли в системе</p>
                <div className="stack gap-10">
                  <div className="row gap-10"><Icon name="user" size={15} className="accent" /><span className="small">Клиент — заказы, брони, заявки</span></div>
                  <div className="row gap-10"><Icon name="tool" size={15} className="accent" /><span className="small">Менеджер — обработка заявок</span></div>
                  <div className="row gap-10"><Icon name="lock" size={15} className="accent" /><span className="small">Администратор — полный доступ</span></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}
