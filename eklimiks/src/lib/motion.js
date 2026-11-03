/**
 * Хуки движения: появление блоков, параллакс, счётчики, наклон карточек,
 * «магнитные» кнопки и подсветка под курсором.
 *
 * Все эффекты уважают `prefers-reduced-motion` — при отключённой анимации
 * элементы просто показываются сразу.
 */
import { useEffect, useRef, useState, useCallback } from 'react'

export const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Появление при попадании в кадр. Возвращает ref и признак «уже видно». */
export function useInView({ threshold = 0.12, rootMargin = '0px 0px -8% 0px', once = true } = {}) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reducedMotion()) { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true)
        el.classList.add('is-in')
        if (once) io.disconnect()
      } else if (!once) {
        setSeen(false)
        el.classList.remove('is-in')
      }
    }, { threshold, rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin, once])

  return [ref, seen]
}

/** Параллакс: элемент смещается по Y пропорционально прокрутке. */
export function useParallax(speed = 0.15, { axis = 'y' } = {}) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    let raf = 0
    let visible = false

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '120px' })
    io.observe(el)

    const apply = () => {
      raf = 0
      if (!visible) return
      const r = el.getBoundingClientRect()
      /* −1 … 1: от центра внизу экрана к центру вверху */
      const progress = (window.innerHeight / 2 - (r.top + r.height / 2)) / window.innerHeight
      const shift = progress * speed * 100
      el.style.transform = axis === 'y' ? `translate3d(0, ${shift.toFixed(2)}px, 0)` : `translate3d(${shift.toFixed(2)}px, 0, 0)`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply) }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [speed, axis])
  return ref
}

/** Число «набегает» от нуля до значения, когда блок показался. */
export function useCountUp(target, { duration = 1600, decimals = 0 } = {}) {
  const [ref, seen] = useInView({ threshold: 0.4 })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!seen) return
    if (reducedMotion()) { setValue(target); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      /* easeOutExpo — резко в начале, мягко в конце */
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setValue(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, target, duration])

  const formatted = decimals
    ? value.toFixed(decimals).replace('.', ',')
    : Math.round(value).toLocaleString('ru-RU')

  return [ref, formatted]
}

/** Наклон карточки за курсором. */
export function useTilt(max = 7, scale = 1.015) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    if (window.matchMedia('(hover: none)').matches) return

    let raf = 0
    const move = (e) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        el.style.transform = `perspective(900px) rotateY(${(px * max).toFixed(2)}deg) rotateX(${(-py * max).toFixed(2)}deg) scale(${scale})`
        el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
        el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
      })
    }
    const leave = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0 }
      el.style.transform = ''
    }
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseleave', leave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [max, scale])
  return ref
}

/** «Магнитная» кнопка: слегка тянется к курсору. */
export function useMagnetic(strength = 0.28, max = 10) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    if (window.matchMedia('(hover: none)').matches) return

    let raf = 0
    const move = (e) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const r = el.getBoundingClientRect()
        const dx = Math.max(-max, Math.min(max, (e.clientX - (r.left + r.width / 2)) * strength))
        const dy = Math.max(-max, Math.min(max, (e.clientY - (r.top + r.height / 2)) * strength))
        el.style.setProperty('--tx', `${dx.toFixed(1)}px`)
        el.style.setProperty('--ty', `${dy.toFixed(1)}px`)
      })
    }
    const leave = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0 }
      el.style.setProperty('--tx', '0px')
      el.style.setProperty('--ty', '0px')
    }
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    return () => {
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseleave', leave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [strength, max])
  return ref
}

/** Подсветка карточки под курсором: пишет --mx/--my в процентах. */
export function useSpotlight() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    if (window.matchMedia('(hover: none)').matches) return
    let raf = 0
    const move = (e) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
        el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
      })
    }
    el.addEventListener('mousemove', move)
    return () => { el.removeEventListener('mousemove', move); if (raf) cancelAnimationFrame(raf) }
  }, [])
  return ref
}

/** Прогресс прокрутки страницы: 0…1. */
export function useScrollProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const calc = () => {
      raf = 0
      const h = document.documentElement.scrollHeight - window.innerHeight
      setP(h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(calc) }
    calc()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return p
}

/** Текст по словам: возвращает массив слов с задержкой для «проявления». */
export function useWordReveal(text, { step = 70 } = {}) {
  const words = String(text).split(' ')
  return words.map((w, i) => ({ w, delay: i * step }))
}

/** Плавная прокрутка к якорю (с учётом высоты шапки). */
export function useSmoothScrollTo() {
  return useCallback((target) => {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }, [])
}
