import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserData } from '../context/UserDataContext.jsx'

/**
 * Página de descoberta de usuários — req. 3.1.4 Interação Social.
 * Lista todos os usuários, permite buscar por nome/username e seguir.
 */
export default function Usuarios() {
  const { listarTodosUsuarios, usuarioAtual } = useAuth()
  const { estaSeguindo, seguir, deixarDeSeguir } = useUserData()
  const [termo, setTermo] = useState('')

  const t = termo.trim().toLowerCase()
  const usuarios = listarTodosUsuarios()
    .filter((u) => !usuarioAtual || u.id !== usuarioAtual.id)
    .filter(
      (u) =>
        !t ||
        u.username.toLowerCase().includes(t) ||
        (u.displayName || '').toLowerCase().includes(t),
    )

  return (
    <div>
      <h1 className="page-title">Usuários</h1>
      <input
        placeholder="Buscar por nome ou @username..."
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}
      />
      <div className="usuarios-grid">
        {usuarios.map((u) => {
          const seguindo = estaSeguindo(u.id)
          return (
            <div key={u.id} className="usuario-card">
              <Link to={`/usuario/${u.id}`} className="usuario-link">
                <div className="avatar small">
                  {u.photoUrl ? (
                    <img src={u.photoUrl} alt={u.displayName} />
                  ) : (
                    <span>{u.displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <strong>{u.displayName}</strong>
                  <div className="muted">@{u.username}</div>
                  <div className="muted">
                    {u.privacidade === 'publico' ? 'Público' : 'Privado'}
                  </div>
                </div>
              </Link>
              {usuarioAtual && (
                <button
                  className={'btn ' + (seguindo ? 'toggle-on' : '')}
                  onClick={() =>
                    seguindo ? deixarDeSeguir(u.id) : seguir(u.id)
                  }
                >
                  {seguindo ? '✓ Seguindo' : '+ Seguir'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
