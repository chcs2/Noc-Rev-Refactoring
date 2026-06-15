import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Página de Login — req. 3.1.1 Autenticação e Perfil.
 * Mock: aceita apenas username (sem senha) — protótipo local.
 */
export default function Login() {
  const { login, listarTodosUsuarios } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [erro, setErro] = useState(null)

  function onSubmit(e) {
    e.preventDefault()
    setErro(null)
    try {
      login(username)
      navigate('/perfil')
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className="auth-container">
      <h1 className="page-title">Entrar</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Nome de usuário
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </label>
        {erro && <div className="error">{erro}</div>}
        <button type="submit" className="btn primary">Entrar</button>
        <p className="muted">
          Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </form>
      <div className="muted" style={{ marginTop: 24 }}>
        <strong>Usuários demo (clique para entrar rapidamente):</strong>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {listarTodosUsuarios().map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  login(u.username)
                  navigate('/perfil')
                }}
              >
                @{u.username} — {u.displayName}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
