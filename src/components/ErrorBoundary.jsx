import { Component } from 'react'

/**
 * ErrorBoundary — catches render/lifecycle errors in its subtree and shows a
 * fallback instead of letting the error unmount the whole React tree (the
 * dreaded "white screen of death").
 *
 * Props:
 *   children  — the subtree to protect
 *   fallback  — either a React node, or a function ({ error, reset }) => node.
 *               If omitted, a sensible default full-screen message is shown.
 *   onReset   — optional callback fired when the user dismisses the error.
 *   label     — optional string used in the console log to identify which
 *               boundary tripped (e.g. "MapView", "App").
 *
 * NOTE: error boundaries only catch errors thrown during render, in
 * lifecycle methods, and in constructors of the components below them. They do
 * NOT catch errors in async code or event handlers — those are guarded
 * separately at the call site.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}] caught:`, error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { fallback } = this.props
    if (typeof fallback === 'function') {
      return fallback({ error: this.state.error, reset: this.reset })
    }
    if (fallback !== undefined) return fallback

    // Default full-screen fallback with a reload escape hatch.
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
          background: '#041a3d',
          color: '#e2e8f0',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: '40px' }}>🧭</div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Something went off-course</h1>
        <p style={{ fontSize: '14px', opacity: 0.75, maxWidth: '320px', margin: 0 }}>
          The app hit an unexpected error. Your progress is saved — reloading usually fixes it.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '8px',
            padding: '10px 24px',
            borderRadius: '10px',
            border: 'none',
            background: '#38bdf8',
            color: '#041a3d',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    )
  }
}
