import React from 'react'

/**
 * Ловит ошибки отрисовки, чтобы вместо чёрного экрана показать понятное сообщение.
 * Без него любое исключение в компоненте размонтирует всё приложение React.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('EKlimiks: ошибка отрисовки', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="wrap section" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <div className="panel panel--accent center" style={{ maxWidth: 560, padding: 'clamp(24px,4vw,44px)' }}>
          <h1 className="h2" style={{ marginBottom: 14 }}>Что-то пошло не так</h1>
          <p className="muted" style={{ marginBottom: 20 }}>
            Страница не смогла отрисоваться. Обычно помогает перезагрузка —
            данные магазина хранятся в браузере и не потеряются.
          </p>
          <pre style={{
            textAlign: 'left', fontSize: '.72rem', color: 'var(--muted-2)', whiteSpace: 'pre-wrap',
            maxHeight: 160, overflow: 'auto', padding: 12, marginBottom: 20,
            border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', background: 'rgba(0,0,0,.3)',
          }}>{String(error && (error.message || error))}</pre>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>Перезагрузить</button>
            <button className="btn btn--outline" onClick={() => {
              try { localStorage.removeItem('eklimiks.db.v1') } catch (e) { /* ignore */ }
              window.location.reload()
            }}>Сбросить данные</button>
          </div>
        </div>
      </div>
    )
  }
}
