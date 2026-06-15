import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserData } from '../context/UserDataContext.jsx'
import StarRating from '../components/StarRating.jsx'

/**
 * Página de visualização de outro usuário — req. 3.1.4.
 * Mostra perfil, listas públicas e diário (se o perfil for público
 * ou se o usuário for o próprio).
 */
export default function UsuarioPerfil() {
  const { userId } = useParams()
  const { obterUsuario, usuarioAtual } = useAuth()
  const {
    listarDiarioDoUsuario,
    listarListasDoUsuario,
    obterObraDoIndice,
    estaSeguindo,
    seguir,
    deixarDeSeguir,
    contarLikesReview,
    curtirReview,
    reviewCurtido,
  } = useUserData()

  const usuario = obterUsuario(userId)
  if (!usuario) {
    return <div className="empty-state">Usuário não encontrado.</div>
  }

  const ehProprio = usuarioAtual && usuarioAtual.id === userId
  const podeVerDados =
    ehProprio ||
    usuario.privacidade === 'publico' ||
    (usuarioAtual && estaSeguindo(userId))

  const listas = podeVerDados
    ? listarListasDoUsuario(userId).filter(
        (l) => ehProprio || l.visibilidade === 'publica',
      )
    : []
  const diary = podeVerDados ? listarDiarioDoUsuario(userId) : []
  const seguindo = usuarioAtual && estaSeguindo(userId)

  return (
    <div>
      <div className="perfil-hero">
        <div className="avatar">
          {usuario.photoUrl ? (
            <img src={usuario.photoUrl} alt={usuario.displayName} />
          ) : (
            <span>{usuario.displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1>{usuario.displayName}</h1>
          <div className="muted">
            @{usuario.username} ·{' '}
            {usuario.privacidade === 'publico' ? 'Perfil Público' : 'Perfil Privado'}
          </div>
          <p>{usuario.bio}</p>
          {usuarioAtual && !ehProprio && (
            <button
              className={'btn ' + (seguindo ? 'toggle-on' : 'primary')}
              onClick={() => (seguindo ? deixarDeSeguir(userId) : seguir(userId))}
            >
              {seguindo ? '✓ Seguindo' : '+ Seguir'}
            </button>
          )}
        </div>
      </div>

      {!podeVerDados ? (
        <div className="empty-state">
          Este perfil é privado. Siga este usuário para ver suas listas e diário.
        </div>
      ) : (
        <>
          <h2 className="section-title">Listas públicas</h2>
          {listas.length === 0 ? (
            <div className="muted">Sem listas para mostrar.</div>
          ) : (
            <div className="listas-grid">
              {listas.map((l) => (
                <Link
                  key={l.id}
                  to={`/listas/${userId}/${l.id}`}
                  className="lista-card"
                >
                  <h3>{l.nome}</h3>
                  <div className="muted">
                    {l.itens.length} item{l.itens.length === 1 ? '' : 's'} ·{' '}
                    {l.visibilidade}
                  </div>
                  <p>{l.descricao}</p>
                </Link>
              ))}
            </div>
          )}

          <h2 className="section-title">Últimos registros do diário</h2>
          {diary.length === 0 ? (
            <div className="muted">Sem registros.</div>
          ) : (
            <div className="diario-lista">
              {diary.slice(0, 10).map((entry) => {
                const obra = obterObraDoIndice(entry.obraIdUnique)
                const curtido = usuarioAtual ? reviewCurtido(userId, entry.id) : false
                const totalLikes = contarLikesReview(userId, entry.id)
                return (
                  <article key={entry.id} className="diario-item">
                    <div>
                      <strong>
                        {obra ? (
                          <Link to={obra.getRota()}>{obra.titulo}</Link>
                        ) : (
                          'Obra removida'
                        )}
                      </strong>{' '}
                      <span className="muted">
                        · {entry.dataVisualizacao}
                        {obra && ` · ${obra.getTipo()}`}
                      </span>
                    </div>
                    {entry.nota > 0 && <StarRating value={entry.nota} />}
                    {entry.resenha && (
                      <p className="review-display">{entry.resenha}</p>
                    )}
                    {usuarioAtual && (
                      <div className="actions-row">
                        <button
                          className={'btn ' + (curtido ? 'toggle-on' : '')}
                          onClick={() => curtirReview(userId, entry.id)}
                        >
                          ❤ {totalLikes}
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
