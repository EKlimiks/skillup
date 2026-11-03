import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useCountUp, useScrollProgress, useMagnetic, useParallax, reducedMotion } from '../lib/motion.js'

/* ═════════════════════ параллакс-обёртка ═════════════════════ */
export function Parallax({ children, speed = 0.12, className = '' }) {
  const ref = useParallax(speed)
  return <div ref={ref} className={className} style={{ willChange: 'transform' }}>{children}</div>
}

/* ═════════════════════ число, которое «набегает» ═════════════════════ */
export function CountUp({ value, suffix = '', decimals = 0, className = '' }) {
  const [ref, text] = useCountUp(value, { decimals })
  return <span ref={ref} className={className}>{text}{suffix}</span>
}

/* ═════════════════════ «магнитная» обёртка для кнопки ═════════════════════ */
export function Magnetic({ children, strength = 0.22, max = 8, className = '' }) {
  const ref = useMagnetic(strength, max)
  return (
    <span ref={ref} className={`magnetic ${className}`}>{children}</span>
  )
}

/* ═════════════════════ кастомный курсор ═════════════════════
   Точка идёт за мышью почти мгновенно, кольцо — с задержкой.
   На тач-устройствах и при отключённой анимации не включается.        */
export function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const [on, setOn] = useState(false)
  const [hot, setHot] = useState(false)
  const [moved, setMoved] = useState(false)

  useEffect(() => {
    if (reducedMotion()) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    setOn(true)

    const target = { x: innerWidth / 2, y: innerHeight / 2 }
    const pos = { x: target.x, y: target.y }
    let raf = 0

    const move = (e) => {
      target.x = e.clientX
      target.y = e.clientY
      if (dot.current) dot.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      const el = e.target
      setHot(!!(el.closest && el.closest('a, button, .pcard, .bento__i, select, input, textarea, .chip, .tab')))
      setMoved(true)
    }
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.16
      pos.y += (target.y - pos.y) * 0.16
      if (ring.current) ring.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', move, { passive: true })
    raf = requestAnimationFrame(loop)
    document.body.classList.add('has-cursor')

    return () => {
      window.removeEventListener('mousemove', move)
      cancelAnimationFrame(raf)
      document.body.classList.remove('has-cursor')
    }
  }, [])

  if (!on) return null
  /* пока курсор не двинулся, кольцо не показываем — иначе оно висит в центре экрана */
  return (
    <>
      <span ref={ring} className={`cursor cursor--ring ${moved ? 'is-on' : ''} ${hot ? 'is-hot' : ''}`} aria-hidden="true" />
      <span ref={dot} className={`cursor cursor--dot ${moved ? 'is-on' : ''} ${hot ? 'is-hot' : ''}`} aria-hidden="true" />
    </>
  )
}

/* ═════════════════════ переход между страницами ═════════════════════
   Раньше здесь был чёрный занавес на весь экран — читалось как «сайт погас».
   Теперь это тонкая светящаяся линия, которая пробегает сверху вниз:
   переход заметен, но экран не закрывает.                                        */
export function PageWipe({ enabled = true }) {
  const { pathname, search } = useLocation()
  const first = useRef(true)
  const [run, setRun] = useState(false)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (!enabled || reducedMotion()) return
    setRun(true)
    const t = setTimeout(() => setRun(false), 640)
    return () => clearTimeout(t)
  }, [pathname, search, enabled])

  if (!run) return null
  return <span className="scanwipe" aria-hidden="true" />
}

/* ═════════════════════ круговой индикатор прокрутки ═════════════════════ */
export function ProgressRing({ onClick }) {
  const p = useScrollProgress()
  const R = 20
  const C = 2 * Math.PI * R
  return (
    <button className={`totop ${p > 0.04 ? 'is-on' : ''}`} onClick={onClick} aria-label="Наверх" title="Наверх">
      <svg className="totop__ring" viewBox="0 0 46 46" aria-hidden="true">
        <circle className="totop__track" cx="23" cy="23" r={R} />
        <circle className="totop__fill" cx="23" cy="23" r={R}
          strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
      </svg>
      <svg className="totop__arrow" width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </button>
  )
}
