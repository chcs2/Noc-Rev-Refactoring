import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { tmdb, posterUrl } from '../api/tmdb.js'
import { obraDeFilmeTmdb } from '../domain/factory.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserData } from '../context/UserDataContext.jsx'
import LogEntryForm from '../components/LogEntryForm.jsx'
import AdicionarALista from '../components/AdicionarALista.jsx'

/**
 * Página de detalhe de Filme/Documentário — usa POLIMORFISMO via Obra.
 * Permite registrar log no diário (req. 3.1.2), adicionar à watchlist
 * e adicionar a listas mistas (req. 3.2.4).
 */
export default function FilmeDetail() {
  const { id } = useParams()
  const filmeId = Number(id)
  const [obra, setObra] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mostrandoLog, setMostrandoLog] = useState(false)

  const { autenticado } = useAuth()
  const {
    registrarLog,
    estaNaWatchlist,
    alternarWatchlist,
    registrarObraNoIndice,
  } = useUserData()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    tmdb
      .filme(filmeId)
      .then((data) => {
        if (cancelled) return
        const o = obraDeFilmeTmdb(data)
        setObra(o)
        registrarObraNoIndice(o)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filmeId])

  if (loading) return <div className="muted">Carregando…</div>
  if (error) return <div className="error">{error}</div>
  if (!obra) return null

  const naWatchlist = estaNaWatchlist(obra)

  return (
    <div>
      <div className="series-hero">
        {posterUrl(obra.posterPath, 'w342') ? (
          <img
            className="poster"
            src={posterUrl(obra.posterPath, 'w342')}
            alt={obra.titulo}
          />
        ) : (
          <div className="poster-placeholder" style={{ width: 200 }}>
            Sem pôster
          </div>
        )}
        <div>
          <div className="muted">
            {obra.getIconeSelo()} {obra.getTipo()}
          </div>
          <h1>{obra.titulo}</h1>
          <div className="meta">
            {obra.getAno()} · {obra.getResumoMetadados()}
          </div>
          {obra.generos.length > 0 && (
            <div className="tag-row">
              {obra.generos.map((g) => (
                <span className="tag" key={g}>{g}</span>
              ))}
            </div>
          )}
          {obra.diretores.length > 0 && (
            <div className="muted">
              Direção: {obra.diretores.join(', ')}
            </div>
          )}
          <p className="overview">{obra.sinopse}</p>
          {autenticado && (
            <div className="actions-row">
              <button
                className="btn primary"
                onClick={() => setMostrandoLog((v) => !v)}
              >
                + Registrar no diário
              </button>
              <button
                className={'btn ' + (naWatchlist ? 'toggle-on' : '')}
                onClick={() => alternarWatchlist(obra)}
              >
                {naWatchlist ? '✓ Na watchlist' : '+ Watchlist'}
              </button>
              <AdicionarALista obra={obra} />
            </div>
          )}
        </div>
      </div>

      {mostrandoLog && autenticado && (
        <LogEntryForm
          obra={obra}
          onSubmit={(dados) => {
            registrarLog(obra, dados)
            setMostrandoLog(false)
          }}
          onCancel={() => setMostrandoLog(false)}
        />
      )}
    </div>
  )
}
