import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { usuarioAtual, autenticado, logout } = useAuth()

  function onSubmit(e) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    navigate(`/buscar?q=${encodeURIComponent(term)}`)
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          Noc<span className="brand-accent">Rev</span>
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" end>Início</NavLink>
          <NavLink to="/buscar">Buscar</NavLink>
          {autenticado && <NavLink to="/diario">Diário</NavLink>}
          {autenticado && <NavLink to="/listas">Listas</NavLink>}
          {autenticado && <NavLink to="/watchlist">Watchlist</NavLink>}
          {autenticado && <NavLink to="/estatisticas">Estatísticas</NavLink>}
          <NavLink to="/usuarios">Usuários</NavLink>
        </div>
        <form className="search-bar" onSubmit={onSubmit}>
          <input
            type="search"
            placeholder="Buscar obras..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>
        <div className="auth-corner">
          {autenticado ? (
            <>
              <NavLink to="/perfil" title="Meu perfil">
                @{usuarioAtual.username}
              </NavLink>
              <button className="btn-link" onClick={() => { logout(); navigate('/') }}>
                Sair
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Entrar</NavLink>
              <NavLink to="/cadastro">Cadastrar</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
