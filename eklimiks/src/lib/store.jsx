import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { api } from './api.js'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState([])
  const [favorites, setFavorites] = useState([])
  const [compare, setCompare] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eklimiks.compare') || '[]') } catch { return [] }
  })
  const [settings, setSettings] = useState({ siteName: 'EKlimiks' })
  const [toasts, setToasts] = useState([])
  const [ready, setReady] = useState(false)

  /* ── загрузка ── */
  useEffect(() => {
    (async () => {
      const s = await api.settings()
      setSettings(s)
      const u = await api.me()
      if (u) {
        setUser(u)
        await api.cartMerge()
        setFavorites(await api.favorites())
      }
      setCart(await api.cart())
      setReady(true)
    })()
  }, [])

  useEffect(() => {
    localStorage.setItem('eklimiks.compare', JSON.stringify(compare))
  }, [compare])

  /* ── уведомления ── */
  const toast = useCallback((text, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  /* ── авторизация ── */
  const login = useCallback(async (email, password) => {
    const u = await api.login(email, password)
    setUser(u)
    await api.cartMerge()
    setCart(await api.cart())
    setFavorites(await api.favorites())
    toast(`Добро пожаловать, ${u.name.split(' ')[0]}!`)
    return u
  }, [toast])

  const register = useCallback(async (payload) => {
    const u = await api.register(payload)
    setUser(u)
    await api.cartMerge()
    setCart(await api.cart())
    toast('Аккаунт создан. Начислено 1 000 приветственных бонусов')
    return u
  }, [toast])

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
    setFavorites([])
    setCart(await api.cart())
    toast('Вы вышли из аккаунта', 'muted')
  }, [toast])

  /* ── корзина ── */
  const addToCart = useCallback(async (product, { storage, color, qty = 1 } = {}) => {
    const item = {
      slug: product.slug, name: product.name,
      storage: storage || product.storages[0],
      color: color || product.colors[0].id,
      price: product.price, qty,
    }
    const next = await api.cartAdd(item)
    setCart([...next])
    toast(`${product.name} — в корзине`)
  }, [toast])

  const setQty = useCallback(async (i, q) => setCart([...(await api.cartSetQty(i, q))]), [])
  const removeFromCart = useCallback(async (i) => {
    setCart([...(await api.cartRemove(i))])
    toast('Товар удалён из корзины', 'muted')
  }, [toast])
  const clearCart = useCallback(async () => setCart([...(await api.cartClear())]), [])

  /* ── избранное ── */
  const toggleFavorite = useCallback(async (slug) => {
    try {
      const next = await api.toggleFavorite(slug)
      setFavorites(next)
      toast(next.includes(slug) ? 'Добавлено в избранное' : 'Удалено из избранного', 'muted')
    } catch (e) { toast(e.message, 'danger') }
  }, [toast])

  /* ── сравнение ── */
  const toggleCompare = useCallback((slug) => {
    setCompare((c) => {
      if (c.includes(slug)) return c.filter((x) => x !== slug)
      if (c.length >= 3) { toast('Можно сравнить не более трёх моделей', 'warn'); return c }
      toast('Добавлено к сравнению')
      return [...c, slug]
    })
  }, [toast])

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart])
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart])

  const value = {
    user, ready, login, register, logout,
    cart, cartCount, cartTotal, addToCart, setQty, removeFromCart, clearCart,
    favorites, toggleFavorite,
    compare, toggleCompare, setCompare,
    settings, setSettings, toast, toasts,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
