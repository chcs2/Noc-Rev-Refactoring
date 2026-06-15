import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserData } from '../context/UserDataContext.jsx'
import { calcularStreak, selosConquistados } from '../utils/streak.js'

/**
 * Página do Perfil do usuário logado — req. 3.1.1 Autenticação e Perfil.
 * Permite editar biografia, foto (URL), nome de exibição e alternar
 * visibilidade. Também exibe selos da gamificação (req. 3.2.6).
 */
export default function Perfil() {
  const { usuarioAtual, atualizarPerfil, alternarPrivacidade } = useAuth()
  const { diary, lists, follows } = useUserData()
  const [editando, setEditando] = useState(false)
  const [displayName, setDisplayName] = useState(usuarioAtual.displayName)
  const [bio, setBio] = useState(usuarioAtual.bio)
  const [photoUrl, setPhotoUrl] = useState(usuarioAtual.photoUrl)

  function salvar() {
    atualizarPerfil({ displayName, bio, photoUrl })
    setEditando(false)
  }

  const streak = calcularStreak(diary)
  const selos = selosConquistados(diary, streak)

  return (
    <div>
      <div className="perfil-hero">
        <div className="avatar">
          {usuarioAtual.photoUrl ? (
            <img src={usuarioAtual.photoUrl} alt={usuarioAtual.displayName} />
          ) : (
            <span>{usuarioAtual.displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1>{usuarioAtual.displayName}</h1>
          <div className="muted">@{usuarioAtual.username} · {usuarioAtual.privacidade === 'publico' ? 'Perfil Público' : 'Perfil Privado'}</div>
          {!editando && <p>{usuarioAtual.bio}</p>}
          <div className="actions-row">
            <button className="btn" onClick={() => setEditando((v) => !v)}>
              {editando ? 'Cancelar' : 'Editar perfil'}
            </button>
            <button className="btn" onClick={alternarPrivacidade}>
              Tornar {usuarioAtual.privacidade === 'publico' ? 'Privado' : 'Público'}
            </button>
          </div>
        </div>
      </div>

      {editando && (
        <div className="review-form">
          <label>
            Nome de exibição
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label>
            Biografia
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
          </label>
          <label>
            URL da foto de perfil
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>
          <button className="btn primary" onClick={salvar}>Salvar</button>
        </div>
      )}

      <h2 className="section-title">Streak (Gamificação)</h2>
      <div className="streak-banner">
        {streak.ativo ? (
          <span>🔥 <strong>{streak.semanas}</strong> semana{streak.semanas > 1 ? 's' : ''} consecutiva{streak.semanas > 1 ? 's' : ''} de logs!</span>
        ) : (
          <span>Sem streak ativa. Registre algo no diário esta semana para começar!</span>
        )}
      </div>

      <h2 className="section-title">Selos conquistados</h2>
      {selos.length === 0 ? (
        <div className="muted">Nenhum selo ainda — registre obras no diário para desbloquear conquistas.</div>
      ) : (
        <div className="selos-grid">
          {selos.map((s) => (
            <div key={s.id} className="selo">
              <div className="selo-emoji">{s.emoji}</div>
              <div>{s.nome}</div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Resumo</h2>
      <div className="resumo-grid">
        <div className="kpi"><strong>{diary.length}</strong><span>Logs no diário</span></div>
        <div className="kpi"><strong>{lists.length}</strong><span>Listas</span></div>
        <div className="kpi"><strong>{follows.length}</strong><span>Seguindo</span></div>
      </div>

      <p style={{ marginTop: 16 }}>
        Veja seus <Link to="/diario">registros completos</Link>,{' '}
        <Link to="/listas">listas</Link>, ou{' '}
        <Link to="/estatisticas">estatísticas</Link>.
      </p>
    </div>
  )
}
