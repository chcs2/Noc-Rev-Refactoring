import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tmdb, stillUrl } from '../api/tmdb.js'
import { obraDeEpisodioTmdb } from '../domain/factory.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserData } from '../context/UserDataContext.jsx'
import LogEntryForm from '../components/LogEntryForm.jsx'
import AdicionarALista from '../components/AdicionarALista.jsx'

/**
 * Detalhe de Episódio — Sistema de Progresso Flexível em granularidade
 * máxima (req. 3.2.2). Permite logar e adicionar a Listas Mistas (req. 3.2.4).
 */
export default function EpisodioDetail() {
  const { id, seasonNumber, episodeNumber } = useParams()
  const serieId = Number(id)
  const sNum = Number(seasonNumber)
  const eNum = Number(episodeNumber)

  const [obra, setObra] = useState(null)
  const [serieTitulo, setSerieTitulo] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mostrandoLog, setMostrandoLog] = useState(false)

  const { autenticado } = useAuth()
  const {
    registrarLog,
    episodioVisto,
    alternarEpisodioVisto,
    registrarObraNoIndice,
    obraIndex,
  } = useUserData()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    // Tenta usar nome cacheado da série
    const indexedSerie = obraIndex[`serie:${serieId}`] || obraIndex[`minisserie:${serieId}`]
    if (indexedSerie?.titulo) setSerieTitulo(indexedSerie.titulo)

    Promise.all([
      tmdb.episodio(serieId, sNum, eNum),
      indexedSerie ? Promise.resolve(null) : tmdb.serie(serieId).catch(() => null),
    ])
      .then(([ep, ser]) => {
        if (cancelled) return
        const titulo = ser?.name || indexedSerie?.titulo || `Série #${serieId}`
        setSerieTitulo(titulo)
        const epObra = obraDeEpisodioTmdb(ep, {
          serieId,
          serieTitulo: titulo,
        })
        setObra(epObra)
        registrarObraNoIndice(epObra)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serieId, sNum, eNum])

  if (loading) return <div className="muted">Carregando…</div>
  if (error) return <div className="error">{error}</div>
  if (!obra) return null

  const visto = episodioVisto(obra)

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Link to={`/serie/${serieId}`}>← {serieTitulo || 'Série'}</Link>
      </div>
      <h1 className="page-title">
        {obra.getResumoMetadados().split(' ·')[0]} · {obra.titulo}
      </h1>
      <div className="meta muted" style={{ marginBottom: 12 }}>
        {obra.dataLancamento || '—'}
        {obra.runtime ? ` · ${obra.runtime} min` : ''}
        {' · '}
        {obra.getIconeSelo()} {obra.getTipo()}
      </div>
      {stillUrl(obra.posterPath, 'w780') && (
        <img
          src={stillUrl(obra.posterPath, 'w780')}
          alt={obra.titulo}
          style={{ width: '100%', maxWidth: 780, borderRadius: 6, marginBottom: 16 }}
        />
      )}
      {obra.sinopse && (
        <p style={{ maxWidth: 780, color: 'var(--text-dim)' }}>{obra.sinopse}</p>
      )}

      {autenticado && (
        <div className="actions-row">
          <button
            className="btn primary"
            onClick={() => setMostrandoLog((v) => !v)}
          >
            + Registrar no diário
          </button>
          <button
            className={'btn ' + (visto ? 'toggle-on' : '')}
            onClick={() => alternarEpisodioVisto(obra)}
          >
            {visto ? '✓ Visto' : 'Marcar como visto'}
          </button>
          <AdicionarALista obra={obra} />
        </div>
      )}

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
