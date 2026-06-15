import { useState, useEffect } from 'react'
import StarRating from './StarRating.jsx'

/**
 * LogEntryForm — formulário do Sistema de Avaliação e Diário (req. 3.1.2).
 * Captura: data de visualização, nota (0.5–5), curtir, resenha textual.
 * Exibe um aviso customizado no centro da tela para adições ou alterações.
 */
export default function LogEntryForm({ obra, onSubmit, onCancel, onExcluir }) {
  const hoje = new Date().toISOString().slice(0, 10)
  const [data, setData] = useState(hoje)
  const [nota, setNota] = useState(0)
  const [resenha, setResenha] = useState('')
  const [curtido, setCurtido] = useState(false)
  
  // Estado para controlar a visibilidade e o texto da caixa de aviso customizada
  const [notificacao, setNotificacao] = useState(null)
  const [mostrarConfirmacaoExclusao, setMostrarConfirmacaoExclusao] = useState(false)

  // Timer para sumir com o aviso de sucesso automaticamente após 3 segundos
  useEffect(() => {
    if (notificacao) {
      const timer = setTimeout(() => {
        setNotificacao(null)
        // Se houver uma função de cancelamento/fechamento do modal pai, dispara após o aviso sumir
        if (onCancel && !mostrarConfirmacaoExclusao) {
          // Opcional: descomente a linha abaixo se quiser fechar o formulário sozinho após o sucesso
          // onCancel()
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notificacao, onCancel, mostrarConfirmacaoExclusao])

  function handleSubmit(e) {
    e.preventDefault()
    
    // Envia os dados para a função de callback fornecida pelo componente pai
    onSubmit({
      dataVisualizacao: data,
      nota,
      resenha: resenha.trim(),
      curtido,
    })

    // Dispara a caixa de aviso customizada no meio da tela
    const nomeObra = obra ? `"${obra.titulo}"` : 'A obra'
    setNotificacao(`🎉 ${nomeObra} foi registrada no seu diário com sucesso!`)
  }

  function handleExcluirRegistro() {
    if (onExcluir) {
      onExcluir()
      setMostrarConfirmacaoExclusao(false)
      // Dispara o feedback visual de remoção
      const nomeObra = obra ? `"${obra.titulo}"` : 'A obra'
      setNotificacao(`🗑️ Registro de ${nomeObra} foi removido do seu diário.`)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      
      {/* 🛑 1. CAIXA DE CONFIRMAÇÃO DE EXCLUSÃO (CASO EXISTA A AÇÃO DE EXCLUIR) */}
      {mostrarConfirmacaoExclusao && (
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
            zIndex: 10000,
            textAlign: 'center',
            maxWidth: '90%',
            width: '400px'
          }} 
          className="log-form"
        >
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.4' }}>
            Deseja remover o registro de {obra ? `"${obra.titulo}"` : 'esta obra'} do seu diário?
          </p>
          <div className="actions-row" style={{ marginTop: '20px', justifyContent: 'center', gap: '12px' }}>
            <button 
              type="button"
              className="btn primary" 
              style={{ backgroundColor: 'var(--danger, #ff4d4f)', borderColor: 'var(--danger, #ff4d4f)' }}
              onClick={handleExcluirRegistro}
            >
              Sim, remover
            </button>
            <button 
              type="button"
              className="btn" 
              onClick={() => setMostrarConfirmacaoExclusao(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ✨ 2. CAIXA DE NOTIFICAÇÃO DE SUCESSO (ADICIONAR OU EXCLUIR) */}
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
          className="log-form"
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

      {/* FORMULÁRIO PADRÃO */}
      <form className="log-form" onSubmit={handleSubmit}>
        <div className="log-form-header">
          <strong>Registrar no diário</strong>
          {obra && <span className="muted"> — {obra.titulo}</span>}
        </div>
        <div className="form-row">
          <label>
            Data de visualização
            <input
              type="date"
              value={data}
              max={hoje}
              onChange={(e) => setData(e.target.value)}
            />
          </label>
          <label>
            Nota
            <StarRating value={nota} onChange={setNota} size="large" />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={curtido}
              onChange={(e) => setCurtido(e.target.checked)}
            />
            ❤ Curtir
          </label>
        </div>
        <textarea
          placeholder="Escreva sua resenha (opcional)..."
          value={resenha}
          onChange={(e) => setResenha(e.target.value)}
        />
        <div className="actions-row">
          <button type="submit" className="btn primary">Salvar registro</button>
          
          {/* Adiciona o botão de remoção caso a propriedade onExcluir tenha sido injetada */}
          {onExcluir && (
            <button 
              type="button" 
              className="btn"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              onClick={() => setMostrarConfirmacaoExclusao(true)}
            >
              Remover Registro
            </button>
          )}

          {onCancel && (
            <button type="button" className="btn" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}