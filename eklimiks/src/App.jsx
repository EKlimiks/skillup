import React from 'react'
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider } from './lib/store.jsx'
import { Layout } from './components/Layout.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import Product from './pages/Product.jsx'
import TradeIn from './pages/TradeIn.jsx'
import Repair from './pages/Repair.jsx'
import Reserve from './pages/Reserve.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Account from './pages/Account.jsx'
import Admin from './pages/Admin.jsx'
import Login from './pages/Login.jsx'
import Compare from './pages/Compare.jsx'
import Favorites from './pages/Favorites.jsx'
import Picker from './pages/Picker.jsx'
import Track from './pages/Track.jsx'
import Reviews from './pages/Reviews.jsx'
import About from './pages/About.jsx'
import Contacts from './pages/Contacts.jsx'
import NotFound from './pages/NotFound.jsx'

/* На file:// работает только hash-роутинг; на сервере — обычные URL.
   Это позволяет и открыть демо двойным щелчком, и развернуть проект на VPS. */
const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:'
const Router = isFile ? HashRouter : BrowserRouter

/** Обёртка, которая сбрасывает состояние ошибки при переходе на другую страницу,
 *  чтобы один упавший раздел не гасил весь сайт навсегда. */
function RouteBoundary({ children }) {
  const { pathname } = useLocation()
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <Layout>
          <RouteBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:slug" element={<Product />} />
              <Route path="/trade-in" element={<TradeIn />} />
              <Route path="/repair" element={<Repair />} />
              <Route path="/reserve" element={<Reserve />} />
              <Route path="/booking" element={<Navigate to="/reserve" replace />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/account" element={<Account />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Navigate to="/login" replace />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/picker" element={<Picker />} />
              <Route path="/track" element={<Track />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/about" element={<About />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouteBoundary>
        </Layout>
      </AppProvider>
    </Router>
  )
}
