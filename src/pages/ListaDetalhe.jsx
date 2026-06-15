import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserData } from '../context/UserDataContext.jsx'
import ObraCard from '../components/ObraCard.jsx'

/**
 * Detalhe da Lista — req. 3.1.3 + 3.2.4 (Listas Mistas).
 *
 * Exibe os itens (que podem misturar Filme/Série/Episódio/Documentário),
 * permite reordenar (com botões cima/baixo), remover itens, e suporta
 * comentários da Interação Social (req. 3.1.4).
 */
export default function ListaDetalhe() {
  const { autorId, listId } = useParams()
  const { obterUsuario, usuarioAtual } = useAuth()
  const {
    listarListasDoUsuario,
    obterObraDoIndice,
    removerItemDaLista,
    reordenarLista,
    listarComentariosDeLista,
    comentarEmLista,
    excluirComentarioLista,
  } = useUserData()

  const autor = obterUsuario(autorId)
  const todasListas = listarListasDoUsuario(autorId)
  const lista = todasListas.find((l) => l.id === listId)
  const ehDono = usuarioAtual && usuarioAtual.id === autorId
  const [novoComentario, setNovoComentario] = useState('')

  const itens = useMemo(() => {
    if (!lista) return []
    return lista.itens.map((chave) => ({
      chave,
      obra: obterObraDoIndice(chave),
    }))
  }, [lista, obterObraDoIndice])

  if (!autor) return <div className="empty-state">Autor não encontrado.</div>
  if (!lista) return <div className="empty-state">Lista não encontrada.</div>

  if (
    !ehDono &&
    (lista.visibilidade === 'privada' ||
      (lista.visibilidade !== 'publica' && lista.visibilidade !== 'naoListada'))
  ) {
    return <div className="empty-state">Esta lista é privada.</div>
  }

  const comentarios = listarComentariosDeLista(autorId, listId)

  function moverItem(chave, dir) {
    const idx = lista.itens.indexOf(chave)
    if (idx < 0) return
    const novoIdx = idx + dir
    if (novoIdx < 0 || novoIdx >= lista.itens.length) return
    const nova = [...lista.itens]
    ;[nova[idx], nova[novoIdx]] = [nova[novoIdx], nova[idx]]
    reordenarLista(listId, nova)
  }

  function enviarComentario() {
    if (!novoComentario.trim()) return
    comentarEmLista(autorId, listId, novoComentario.trim())
    setNovoComentario('')
  }

  return (
    <div>
      <div className="muted">
        Lista de <Link to={`/usuario/${autorId}`}>{autor.displayName}</Link> · {lista.visibilidade}
      </div>
      <h1 className="page-title">{lista.nome}</h1>
      {lista.descricao && <p>{lista.descricao}</p>}

      <h2 className="section-title">Itens ({itens.length})</h2>
      {itens.length === 0 ? (
        <div className="empty-state">Lista vazia.</div>
      ) : (
        <div className="grid">
          {itens.map(({ chave, obra }, idx) => (
            <div key={chave} className="lista-item-wrap">
              {obra ? (
                <ObraCard obra={obra} badge={`#${idx + 1}`} />
              ) : (
                <div className="card">
                  <div className="poster-placeholder">Item indisponível</div>
                  <div className="card-body">
                    <div className="muted">Obra não está mais no índice</div>
                  </div>
                </div>
              )}
              {ehDono && (
                <div className="actions-row">
                  <button className="btn" onClick={() => moverItem(chave, -1)}>↑</button>
                  <button className="btn" onClick={() => moverItem(chave, 1)}>↓</button>
                  <button
                    className="btn"
                    onClick={() => removerItemDaLista(listId, chave)}
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Comentários</h2>
      {usuarioAtual && (
        <div className="form-row">
          <input
            placeholder="Deixe um comentário..."
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn primary" onClick={enviarComentario}>Comentar</button>
        </div>
      )}
      {comentarios.length === 0 ? (
        <div className="muted">Nenhum comentário ainda.</div>
      ) : (
        <div className="diario-lista">
          {comentarios.map((c) => {
            const u = obterUsuario(c.autorId)
            const ehMeu = usuarioAtual && c.autorId === usuarioAtual.id
            return (
              <div key={c.id} className="diario-item">
                <div className="muted">
                  <strong>
                    <Link to={`/usuario/${c.autorId}`}>{u?.displayName || 'Usuário'}</Link>
                  </strong>{' '}
                  · {new Date(c.criadoEm).toLocaleString()}
                  {c.editadoEm && ' (editado)'}
                </div>
                <div>{c.texto}</div>
                {ehMeu && (
                  <div className="actions-row">
                    <button
                      className="btn"
                      onClick={() => excluirComentarioLista(autorId, listId, c.id)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
