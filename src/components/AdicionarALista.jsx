import { useState, useEffect } from 'react'
import { useUserData } from '../context/UserDataContext.jsx'

/**
 * AdicionarALista — popover para adicionar uma Obra (qualquer tipo) a uma
 * lista existente do usuário. Habilita as Listas Mistas (req. 3.2.4): aceita
 * Filme, Série, Minissérie, Documentário e Episódio na mesma lista.
 */
export default function AdicionarALista({ obra }) {
  const { lists, adicionarItemNaLista, criarLista } = useUserData()
  const [aberto, setAberto] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  
  // Estado para gerenciar a caixa de aviso customizada no meio da tela
  const [notificacao, setNotificacao] = useState(null)

  // Timer para fechar o aviso automaticamente após 3 segundos
  useEffect(() => {
    if (notificacao) {
      const timer = setTimeout(() => setNotificacao(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notificacao])

  function adicionar(listId) {
    const listaAlvo = lists.find((l) => l.id === listId)
    
    adicionarItemNaLista(listId, obra)
    setAberto(false)

    // Ativa a caixa centralizada com o nome da lista
    if (listaAlvo) {
      setNotificacao(`📌 "${obra.titulo}" foi adicionado à lista "${listaAlvo.nome}" com sucesso!`)
    }
  }

  function criarECardicionar() {
    if (!novoNome.trim()) return
    const nomeFormatado = novoNome.trim()
    
    const lista = criarLista({ nome: nomeFormatado })
    adicionarItemNaLista(lista.id, obra)
    setNovoNome('')
    setAberto(false)

    // Ativa a caixa centralizada para nova lista criada
    setNotificacao(`🎉 A lista "${nomeFormatado}" foi criada e "${obra.titulo}" foi inserido nela!`)
  }

  return (
    <div className="lista-picker" style={{ position: 'relative' }}>
      
      {/* Caixa de aviso flutuante e centralizada no tema do site */}
      {notificacao && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--background-card, #1e1e24)',
            border: '2px solid var(--primary, #6366f1)',
            borderRadius: '8px',
            padding: '24px 32px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            zIndex: 9999,
            textAlign: 'center',
            maxWidth: '90%',
            width: '400px'
          }} 
          className="popover" // Reaproveita a estilização de caixas do seu tema
        >
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.4' }}>
            {notificacao}
          </p>
          <button 
            type="button"
            className="btn primary" 
            style={{ marginTop: '16px', padding: '6px 16px' }}
            onClick={() => setNotificacao(null)}
          >
            Entendido
          </button>
        </div>
      )}

      <button className="btn" onClick={() => setAberto((v) => !v)}>
        + Adicionar a lista
      </button>
      
      {aberto && (
        <div className="popover">
          <strong>Suas listas</strong>
          {lists.length === 0 ? (
            <p className="muted">Nenhuma lista ainda.</p>
          ) : (
            <ul>
              {lists.map((l) => {
                const jaTem = l.itens.includes(obra.getIdentificadorUnico())
                return (
                  <li key={l.id}>
                    <button
                      className="btn-link"
                      disabled={jaTem}
                      onClick={() => adicionar(l.id)}
                    >
                      {jaTem ? '✓ ' : ''}
                      {l.nome}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <hr />
          <div className="form-row">
            <input
              placeholder="Criar nova lista..."
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
            <button className="btn primary" onClick={criarECardicionar}>
              Criar e adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}