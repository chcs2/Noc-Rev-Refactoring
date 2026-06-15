import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tmdb, posterUrl } from '../api/tmdb.js'
import { obraDeSerieTmdb, obraDeEpisodioTmdb } from '../domain/factory.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserData } from '../context/UserDataContext.jsx'
import LogEntryForm from '../components/LogEntryForm.jsx'
import AdicionarALista from '../components/AdicionarALista.jsx'

/**
 * Página de detalhe de Série/Minissérie — implementa o Sistema de Progresso
 * Flexível (req. 3.2.2):
 *  - Marcar a série inteira como vista de uma vez
 *  - Marcar episódios individualmente
 *  - Mostrar barra de % concluído
 */
export default function SerieDetail() {
  const { id } = useParams()
  const serieId = Number(id)
  const [obra, setObra] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openSeason, setOpenSeason] = useState(null)
  const [seasonCache, setSeasonCache] = useState({})
  const [seasonsRaw, setSeasonsRaw] = useState([])
  const [mostrandoLog, setMostrandoLog] = useState(false)

  // ✨ Estado para controlar a caixa de aviso customizada no meio da tela
  const [notificacao, setNotificacao] = useState(null)

  const { autenticado } = useAuth()
  const {
    registrarLog,
    estaNaWatchlist,
    alternarWatchlist,
    episodioVisto,
    alternarEpisodioVisto,
    contarEpisodiosVistosDaSerie,
    marcarSerieInteiraVista,
    registrarObraNoIndice,
  } = useUserData()

  // Timer para sumir com o aviso automaticamente após 3 segundos
  useEffect(() => {
    if (notificacao) {
      const timer = setTimeout(() => setNotificacao(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notificacao])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    tmdb
      .serie(serieId)
      .then((data) => {
        if (cancelled) return
        const o = obraDeSerieTmdb(data)
        setObra(o)
        registrarObraNoIndice(o)
        setSeasonsRaw(data.seasons || [])
        const primeira = (data.seasons || []).find(
          (s) => s.episode_count > 0 && s.season_number > 0,
        )
        if (primeira) setOpenSeason(primeira.season_number)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serieId])

  useEffect(() => {
    if (openSeason == null) return
    if (seasonCache[openSeason]) return
    let cancelled = false
    tmdb
      .temporada(serieId, openSeason)
      .then((data) => {
        if (cancelled) return
        setSeasonCache((prev) => ({ ...prev, [openSeason]: data }))
        // Registra cada episódio no índice para reconstrução em listas/diário.
        for (const ep of data.episodes || []) {
          registrarObraNoIndice(
            obraDeEpisodioTmdb(ep, { serieId, serieTitulo: obra?.titulo }),
          )
        }
      })
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serieId, openSeason])

  const totalEp = obra?.numEpisodios || 0
  const vistos = obra ? contarEpisodiosVistosDaSerie(serieId) : 0
  const progresso = totalEp ? Math.round((vistos / totalEp) * 100) : 0

  const seasons = useMemo(
    () => seasonsRaw.filter((s) => s.season_number >= 0),
    [seasonsRaw],
  )

  if (loading) return <div className="muted">Carregando…</div>
  if (error) return <div className="error">{error}</div>
  if (!obra) return null

  const naWatchlist = estaNaWatchlist(obra)

  function marcarTudoVisto() {
    // Carrega todas as temporadas e marca todos episódios.
    Promise.all(
      seasons
        .filter((s) => s.season_number > 0)
        .map((s) => tmdb.temporada(serieId, s.season_number)),
    ).then((temporadas) => {
      const todosEpisodios = []
      for (const t of temporadas) {
        for (const ep of t.episodes || []) {
          todosEpisodios.push(
            obraDeEpisodioTmdb(ep, { serieId, serieTitulo: obra.titulo }),
          )
        }
      }
      marcarSerieInteiraVista(todosEpisodios)
      setNotificacao(`🎉 Toda a série "${obra.titulo}" foi marcada como vista!`)
    })
  }

  return (
    <div style={{ position: 'relative' }}>
      
      {/* ✨ CAIXA DE AVISO CENTRALIZADA NO TEMA DO SITE */}
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
            zIndex: 10000, // zIndex alto para ficar acima de qualquer elemento/modal
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
            {totalEp > 0 && ` · ${vistos}/${totalEp} vistos`}
          </div>
          {obra.generos.length > 0 && (
            <div className="tag-row">
              {obra.generos.map((g) => (
                <span className="tag" key={g}>{g}</span>
              ))}
            </div>
          )}
          {obra.criadores.length > 0 && (
            <div className="muted">
              Criação: {obra.criadores.join(', ')}
            </div>
          )}
          <p className="overview">{obra.sinopse}</p>
          {totalEp > 0 && (
            <div className="progresso-barra" title={`${progresso}% concluído`}>
              <div style={{ width: `${progresso}%` }} />
            </div>
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
                className={'btn ' + (naWatchlist ? 'toggle-on' : '')}
                onClick={() => alternarWatchlist(obra)}
              >
                {naWatchlist ? '✓ Na watchlist' : '+ Watchlist'}
              </button>
              <button className="btn" onClick={marcarTudoVisto}>
                ✓ Marcar série inteira como vista
              </button>
              <AdicionarALista obra={obra} />
            </div>
          )}
        </div>
      </div>

      {mostrandoLog && autenticado && (
        <div className="review-form" style={{ marginTop: '24px' }}>
          <LogEntryForm
            obra={obra}
            onSubmit={(dados) => {
              registrarLog(obra, dados)
              setMostrandoLog(false) // Fecha o formulário
              // Aciona a mensagem na raiz do componente pai, sobrevivendo ao unmount!
              setNotificacao(`🎉 "${obra.titulo}" foi registrada no seu diário com sucesso!`)
            }}
            onCancel={() => setMostrandoLog(false)}
          />
        </div>
      )}

      <h2 className="section-title">Temporadas</h2>
      {seasons.length === 0 && (
        <div className="empty-state">Sem dados de temporada.</div>
      )}
      {seasons.map((s) => (
        <SeasonBlock
          key={s.id}
          serieObra={obra}
          season={s}
          open={openSeason === s.season_number}
          onToggle={() =>
            setOpenSeason(openSeason === s.season_number ? null : s.season_number)
          }
          data={seasonCache[s.season_number]}
        />
      ))}
    </div>
  )
}

function SeasonBlock({ serieObra, season, open, onToggle, data }) {
  const { episodioVisto, alternarEpisodioVisto } = useUserData()
  return (
    <div className="season-section">
      <button className="season-toggle" onClick={onToggle}>
        <span>
          {season.name || `Temporada ${season.season_number}`}
          {season.episode_count ? ` · ${season.episode_count} episódios` : ''}
          {season.air_date ? ` · ${season.air_date.slice(0, 4)}` : ''}
        </span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="episode-list">
          {!data && <div className="muted">Carregando episódios…</div>}
          {data?.episodes?.map((ep) => {
            const epObra = obraDeEpisodioTmdb(ep, {
              serieId: serieObra.id,
              serieTitulo: serieObra.titulo,
            })
            const visto = episodioVisto(epObra)
            return (
              <div className="episode-row" key={ep.id}>
                <span className="episode-num">
                  S{String(ep.season_number).padStart(2, '0')}E
                  {String(ep.episode_number).padStart(2, '0')}
                </span>
                <Link to={epObra.getRota()} className="episode-title">
                  {ep.name || `Episódio ${ep.episode_number}`}
                </Link>
                <span className="episode-air">{ep.air_date || ''}</span>
                <button
                  className={'btn ' + (visto ? 'toggle-on' : '')}
                  onClick={() => alternarEpisodioVisto(epObra)}
                >
                  {visto ? '✓ Visto' : 'Marcar'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}