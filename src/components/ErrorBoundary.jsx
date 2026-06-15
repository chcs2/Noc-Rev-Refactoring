import React from 'react'

/**
 * Error Boundary — captura erros do React em vez de gerar tela em branco.
 * Exibe a mensagem do erro e o stack trace para diagnóstico.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    // eslint-disable-next-line no-console
    console.error('NocRev — ErrorBoundary capturou:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', color: '#f44' }}>
          <h1 style={{ color: '#fff' }}>Erro ao iniciar o NocRev</h1>
          <p style={{ color: '#fff' }}>
            Cole esta mensagem para o desenvolvedor:
          </p>
          <pre
            style={{
              background: '#1c2228',
              padding: 16,
              borderRadius: 6,
              overflow: 'auto',
              color: '#ffb4b4',
            }}
          >
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          {this.state.info && (
            <pre
              style={{
                background: '#1c2228',
                padding: 16,
                borderRadius: 6,
                overflow: 'auto',
                color: '#9ab',
              }}
            >
              {this.state.info.componentStack}
            </pre>
          )}
          <p style={{ color: '#fff' }}>
            Você pode tentar limpar o localStorage do app: abra o DevTools
            (F12) → Application → Local Storage → http://localhost:5173 →
            Clear All. Depois recarregue a página.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
