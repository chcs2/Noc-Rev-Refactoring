import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUserData } from '../context/UserDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import StarRating from '../components/StarRating.jsx'

/**
 * Diário — req. 3.1.2 Sistema de Avaliação e Diário (Log).
 *
 * Lista todos os registros do usuário, ordenados por data de visualização.
 * Permite editar nota/resenha, excluir registro e criar novas revisões (Prototype).
 */
export default function Diario() {
  const { usuarioAtual } = useAuth()
  const {
    diary,
    obraIndex,
    obterObraDoIndice,
    excluirLog,
    editarLog,
    registrarLog, // Usado para gravar o novo log clonado via Prototype
    contarLikesReview,
  } = useUserData()
  
  const [editandoId, setEditandoId] = useState(null)
  const [resenhaEdit, setResenhaEdit] = useState('')
  const [notaEdit, setNotaEdit] = useState(0)

  // Estados para as caixas de aviso customizadas no tema
  const [notificacao, setNotificacao] = useState(null)
  const [logParaExcluir, setLogParaExcluir] = useState(null)

  // 🧬 Estados para o controle do Protótipo (Nova Revisão)
  const [revisaoPrototipo, setRevisaoPrototipo] = useState(null)
  const [novaNota, setNovaNota] = useState(0)
  const [novaResenha, setNovaResenha] = useState('')
  const [novoCurtido, setNovoCurtido] = useState(false)
  const [novaData, setNovaData] = useState(new Date().toISOString().slice(0, 10))

  // Timer para sumir com o aviso de sucesso automaticamente após 3 segundos
  useEffect(() => {
    if (notificacao) {
      const timer = setTimeout(() => setNotificacao(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notificacao])

  const ordenado = useMemo(
    () => [...diary].sort((a, b) => (b.dataVisualizacao || '').localeCompare(a.dataVisualizacao || '')),
    [diary],
  )

  function comecarEdicao(entry) {
    setEditandoId(entry.id)
    setResenhaEdit(entry.resenha)
    setNotaEdit(entry.nota)
  }

  function salvarEdicao() {
    editarLog(editandoId, { resenha: resenhaEdit, nota: notaEdit })
    setEditandoId(null)
    setNotificacao("✏️ Registro atualizado com sucesso!")
  }

  function confirmarEExcluir() {
    if (!logParaExcluir) return

    const obra = obterObraDoIndice(logParaExcluir.obraIdUnique)
    const nomeObra = obra ? `"${obra.titulo}"` : 'A obra'

    excluirLog(logParaExcluir.id)
    setLogParaExcluir(null)

    setNotificacao(`🗑️ O registro de ${nomeObra} foi removido do seu diário.`)
  }

  /**
   * Padrão Prototype implementado na Prática
   * Clona o estado interno da avaliação antiga para servir de molde a uma nova linha do tempo
   */
  function prepararNovaRevisao(entry) {
    const obra = obterObraDoIndice(entry.obraIdUnique)
    if (!obra) return

    setRevisaoPrototipo({ obra, originalId: entry.id })
    
    // Clonagem profunda dos valores primitivos para o formulário (Xerox dos dados)
    setNovaNota(entry.nota)
    setNovaResenha(entry.resenha ? `[Re-view] ${entry.resenha}` : '[Re-view] ')
    setNovoCurtido(entry.curtido || false)
    setNovaData(new Date().toISOString().slice(0, 10)) // Sugere a data de hoje
  }

  function salvarNovaRevisao() {
    if (!revisaoPrototipo) return

    // Envia o clone customizado de volta para o diário do usuário
    registrarLog(revisaoPrototipo.obra, {
      dataVisualizacao: novaData,
      nota: novaNota,
      resenha: novaResenha.trim(),
      curtido: novoCurtido
    })

    const nomeObra = revisaoPrototipo.obra.titulo
    setRevisaoPrototipo(null) // Fecha a área de formulário do protótipo
    setNotificacao(`🔄 Nova revisão de "${nomeObra}" adicionada com sucesso!`)
  }

  return (
    <div style={{ position: 'relative' }}>
      
      {/* 🛑 1. CAIXA DE CONFIRMAÇÃO DE EXCLUSÃO CUSTOMIZADA */}
      {logParaExcluir && (
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
            Tem certeza que deseja excluir este registro do seu diário?
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
              onClick={() => setLogParaExcluir(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ✨ 2. CAIXA DE NOTIFICAÇÃO DE SUCESSO (EDITAR, EXCLUIR OU REASSISTIR) */}
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

      {/* 3. ÁREA DE FORMULÁRIO DE NOVA REVISÃO (PROTOTYPE) */}
      {revisaoPrototipo && (
        <div className="review-form" style={{ marginBottom: '24px', border: '1px dashed var(--primary)' }}>
          <div className="log-form-header">
            <strong>🔄 Nova Linha de Tempo</strong>
            <span className="muted"> — {revisaoPrototipo.obra.titulo}</span>
          </div>
          <div className="form-row" style={{ marginTop: '12px' }}>
            <label>
              Data de re-visualização
              <input type="date" value={novaData} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setNovaData(e.target.value)} />
            </label>
            <label>
              Nova Nota
              <StarRating value={novaNota} onChange={setNovaNota} size="large" />
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={novoCurtido} onChange={(e) => setNovoCurtido(e.target.checked)} />
              ❤ Curtir
            </label>
          </div>
          <textarea
            placeholder="Nova resenha..."
            value={novaResenha}
            onChange={(e) => setNovaResenha(e.target.value)}
            style={{ marginTop: '12px' }}
          />
          <div className="actions-row" style={{ marginTop: '12px' }}>
            <button className="btn primary" onClick={salvarNovaRevisao}>Salvar Revisão</button>
            <button className="btn" onClick={() => setRevisaoPrototipo(null)}>Cancelar</button>
          </div>
        </div>
      )}

      <h1 className="page-title">Diário</h1>
      <p className="muted">
        Registros de @{usuarioAtual?.username}. Ordenados por data de visualização.
      </p>
      {ordenado.length === 0 ? (
        <div className="empty-state">
          Você ainda não tem registros. Encontre uma obra e clique em
          “Registrar no diário”.
        </div>
      ) : (
        <div className="diario-lista">
          {ordenado.map((entry) => {
            const obra = obterObraDoIndice(entry.obraIdUnique)
            const editando = editandoId === entry.id
            const totalLikes = usuarioAtual ? contarLikesReview(usuarioAtual.id, entry.id) : 0
            return (
              <article key={entry.id} className="diario-item">
                <div className="diario-cabecalho">
                  <strong>
                    {obra ? (
                      <Link to={obra.getRota()}>
                        {obra.getIconeSelo()} {obra.titulo}
                      </Link>
                    ) : (
                      'Obra removida'
                    )}
                  </strong>
                  <span className="muted">
                    {entry.dataVisualizacao}
                    {obra && ` · ${obra.getTipo()}`}
                    {entry.curtido && ' · ❤'}
                  </span>
                </div>

                {editando ? (
                  <>
                    <StarRating value={notaEdit} onChange={setNotaEdit} size="large" />
                    <textarea
                      value={resenhaEdit}
                      onChange={(e) => setResenhaEdit(e.target.value)}
                      placeholder="Resenha..."
                    />
                    <div className="actions-row">
                      <button className="btn primary" onClick={salvarEdicao}>Salvar</button>
                      <button className="btn" onClick={() => setEditandoId(null)}>Cancelar</button>
                    </div>
                  </>
                ) : (
                  <>
                    {entry.nota > 0 && <StarRating value={entry.nota} />}
                    {entry.resenha && (
                      <p className="review-display">{entry.resenha}</p>
                    )}
                    <div className="actions-row">
                      <span className="muted">❤ {totalLikes} curtida{totalLikes === 1 ? '' : 's'}</span>
                      <button className="btn" onClick={() => comecarEdicao(entry)}>Editar</button>
                      
                      {/* BOTÃO INJETADO DO PROTOTYPE */}
                      <button 
                        className="btn" 
                        style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                        onClick={() => prepararNovaRevisao(entry)}
                        title="Usar dados desta avaliação antiga como protótipo para criar uma nova visualização"
                      >
                        🔄 Reassistir
                      </button>

                      <button
                        className="btn"
                        onClick={() => setLogParaExcluir(entry)}
                      >
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}