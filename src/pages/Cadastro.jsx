import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Página de Cadastro — req. 3.1.1 Autenticação e Perfil.
 * Cria nova conta com username, displayName, biografia e visibilidade.
 */
export default function Cadastro() {
  const { cadastrar } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [privacidade, setPrivacidade] = useState('publico')
  const [erro, setErro] = useState(null)

  function onSubmit(e) {
    e.preventDefault()
    setErro(null)
    try {
      cadastrar({ username, displayName, bio, privacidade })
      navigate('/perfil')
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className="auth-container">
      <h1 className="page-title">Criar conta</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Nome de usuário (único)
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </label>
        <label>
          Nome de exibição
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          Biografia
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="3" />
        </label>
        <label>
          Visibilidade do perfil
          <select value={privacidade} onChange={(e) => setPrivacidade(e.target.value)}>
            <option value="publico">Público</option>
            <option value="privado">Privado</option>
          </select>
        </label>
        {erro && <div className="error">{erro}</div>}
        <button type="submit" className="btn primary">Criar conta</button>
      </form>
    </div>
  )
}
