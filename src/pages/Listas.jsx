import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserData } from '../context/UserDataContext.jsx'

/**
 * Listas — req. 3.1.3 Criação de Listas.
 * Lista as listas do usuário, permite criar nova, editar nome/descrição,
 * alternar visibilidade e duplicar através do padrão Prototype.
 * Agora com modais e notificações centralizadas no tema do site.
 */
export default function Listas() {
  const { usuarioAtual } = useAuth()
  const { lists, criarLista, atualizarLista, excluirLista } = useUserData()
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [visibilidade, setVisibilidade] = useState('publica')

  // Estados para as caixas de aviso customizadas
  const [notificacao, setNotificacao] = useState(null)
  const [listaParaExcluir, setListaParaExcluir] = useState(null)

  // Auto-fechamento do aviso de sucesso após 3 segundos
  useEffect(() => {
    if (notificacao) {
      const timer = setTimeout(() => setNotificacao(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notificacao])

  function criar() {
    if (!nome.trim()) return
    criarLista({ nome: nome.trim(), descricao: descricao.trim(), visibilidade })
    setNome('')
    setDescricao('')
    setCriando(false)
  }

  /**
   * Implementação do Padrão Prototype
   * Recebe um protótipo de lista existente e gera uma cópia idêntica e isolada.
   */
  function duplicarLista(listaPrototipo) {
    // Clonagem profunda das propriedades e do array de itens para quebrar a referência de memória 🧠
    const listaClonada = {
      nome: `${listaPrototipo.nome} (Cópia)`,
      descricao: listaPrototipo.descricao || '',
      visibilidade: listaPrototipo.visibilidade,
      // Garante que novos itens adicionados ao clone não alterem a lista original
      itens: listaPrototipo.itens ? [...listaPrototipo.itens] : [] 
    }

    criarLista(listaClonada)
    setNotificacao(`🎉 Lista "${listaPrototipo.nome}" duplicada com sucesso!`)
  }

  function confirmarEExcluir() {
    if (!listaParaExcluir) return
    
    excluirLista(listaParaExcluir.id)
    const nomeExcluido = listaParaExcluir.nome
    setListaParaExcluir(null) // Fecha a caixa de pergunta
    
    // Mostra o aviso de sucesso
    setNotificacao(`🗑️ A lista "${nomeExcluido}" foi excluída com sucesso!`)
  }

  return (
    <div style={{ position: 'relative' }}>
      
      {/* 🛑 1. CAIXA DE CONFIRMAÇÃO DE EXCLUSÃO CUSTOMIZADA */}
      {listaParaExcluir && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--background-card, #1e1e24)',
            border: '2px solid var(--danger, #ff4d4f)',
            borderRadius: '8px',
            padding: '24px 32px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            zIndex: 9999,
            textAlign: 'center',
            maxWidth: '90%',
            width: '400px'
          }} 
          className="review-form"
        >
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.4' }}>
            Tem certeza que deseja excluir a lista "{listaParaExcluir.nome}"?
          </p>
          <div className="actions-row" style={{ marginTop: '20px', justifyContent: 'center', gap: '12px' }}>
            <button 
              type="button"
              className="btn primary" 
              style={{ backgroundColor: 'var(--danger, #ff4d4f)', borderColor: 'var(--danger, #ff4d4f)' }}
              onClick={confirmarEExcluir}
            >
              Sim, excluir
            </button>
            <button 
              type="button"
              className="btn" 
              onClick={() => setListaParaExcluir(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ✨ 2. CAIXA DE NOTIFICAÇÃO DE SUCESSO FLUTUANTE */}
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
          className="review-form"
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

      <h1 className="page-title">Minhas listas</h1>
      <button className="btn primary" onClick={() => setCriando((v) => !v)}>
        {criando ? 'Cancelar' : '+ Nova lista'}
      </button>

      {criando && (
        <div className="review-form">
          <label>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </label>
          <label>
            Descrição
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </label>
          <label>
            Visibilidade
            <select value={visibilidade} onChange={(e) => setVisibilidade(e.target.value)}>
              <option value="publica">Pública</option>
              <option value="privada">Privada</option>
              <option value="naoListada">Não listada (apenas por link)</option>
            </select>
          </label>
          <button className="btn primary" onClick={criar}>Criar</button>
        </div>
      )}

      {lists.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 16 }}>
          Você ainda não tem listas.
        </div>
      ) : (
        <div className="listas-grid" style={{ marginTop: 16 }}>
          {lists.map((l) => (
            <div key={l.id} className="lista-card">
              <Link to={`/listas/${usuarioAtual.id}/${l.id}`}>
                <h3>{l.nome}</h3>
              </Link>
              <div className="muted">
                {l.itens.length} item{l.itens.length === 1 ? '' : 's'} · {l.visibilidade}
              </div>
              <p>{l.descricao}</p>
              <div className="actions-row">
                <button
                  className="btn"
                  onClick={() => {
                    const novaVis =
                      l.visibilidade === 'publica' ? 'privada' :
                      l.visibilidade === 'privada' ? 'naoListada' : 'publica'
                    atualizarLista(l.id, { visibilidade: novaVis })
                  }}
                >
                  Alternar visibilidade
                </button>
                <button
                  className="btn"
                  onClick={() => duplicarLista(l)}
                  title="Gera um clone exato desta lista usando o padrão Prototype"
                >
                  👥 Duplicar
                </button>
                <button
                  className="btn"
                  style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                  onClick={() => setListaParaExcluir(l)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}