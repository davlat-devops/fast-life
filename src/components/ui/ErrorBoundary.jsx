import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
          padding: 24,
        }}>
          <div style={{
            maxWidth: 440,
            textAlign: 'center',
            padding: '40px 32px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(204,0,0,0.12)',
              border: '1px solid rgba(204,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f1f1', margin: '0 0 8px' }}>
              Something went wrong.
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px', lineHeight: 1.6 }}>
              Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px', borderRadius: 12,
                background: '#CC0000', color: '#fff',
                border: 'none', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
