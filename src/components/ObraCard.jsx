import { Link } from 'react-router-dom'
import { posterUrl } from '../api/tmdb.js'

/**
 * ObraCard — exibe um card POLIMÓRFICO para qualquer subclasse de Obra
 * (Filme, Série, Minissérie, Documentário, Episódio).
 *
 * O componente não sabe qual é o tipo concreto: ele apenas chama os métodos
 * polimórficos `obra.getTipo()`, `obra.getRota()`, `obra.getIconeSelo()`,
 * `obra.getResumoMetadados()` e `obra.getAno()`. Isso é a Modelagem
 * Universal (req. 3.2.1) em ação.
 */
export default function ObraCard({ obra, badge }) {
  if (!obra) return null
  const url = posterUrl(obra.posterPath)
  return (
    <article className="card">
      <Link to={obra.getRota()}>
        {url ? (
          <img className="poster" src={url} alt={obra.titulo} loading="lazy" />
        ) : (
          <div className="poster-placeholder">Sem pôster</div>
        )}
        <div className="card-body">
          <div className="card-tipo">
            <span className="card-selo" title={obra.getTipo()}>
              {obra.getIconeSelo()}
            </span>
            <span>{obra.getTipo()}</span>
            {badge && <span className="card-badge">{badge}</span>}
          </div>
          <h3 className="card-title">{obra.titulo}</h3>
          <div className="card-meta">
            {obra.getAno() || '—'}
            {obra.getResumoMetadados() && (
              <>
                {' · '}
                {obra.getResumoMetadados()}
              </>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
