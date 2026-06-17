import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tmdb, posterUrl } from '../api/tmdb.js'
import { montarArvoreCompositeSerie } from '../domain/factory.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserData } from '../context/UserDataContext.jsx'
import LogEntryForm from '../components/LogEntryForm.jsx'
import AdicionarALista from '../components/AdicionarALista.jsx'

/**
 * Página de detalhe de Série/Minissérie — implementa o Sistema de Progresso
 * Flexível (req. 3.2.2).
 * * 🌳 REFATORAÇÃO COMPOSITE: Este componente agora é 100% dependente da árvore de
 * domínio. Em vez de lidar com JSONs brutos do TMDB para cada temporada, ele 
 * delega as responsabilidades estruturais e de estado para a hierarquia Serie -> Temporada -> Episodio.
 */
export default function SerieDetail() {
  const { id } = useParams()
  const serieId = Number(id)
  
  // O estado 'obra' agora guardará o Nó Raiz (Composite) com a árvore completa
  const [obra, setObra] = useState(null) 
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openSeason, setOpenSeason] = useState(null)
  const [mostrandoLog, setMostrandoLog] = useState(false)
  const [notificacao, setNotificacao] = useState(null)

  const { autenticado } = useAuth()
  const {
    registrarLog,
    estaNaWatchlist,
    alternarWatchlist,
    contarEpisodiosVistosDaSerie,
    marcarSerieInteiraVista,
    registrarObraNoIndice,
  } = useUserData()

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

    // 1. Busca os dados base da Série
    tmdb.serie(serieId)
      .then(async (serieBruta) => {
        if (cancelled) return

        // 2. Extrai quais temporadas existem para podermos buscar os episódios
        const temporadasParaBuscar = (serieBruta.seasons || []).filter(s => s.season_number >= 0)

        try {
          // 3. Busca todas as temporadas paralelamente para construir a árvore
          const temporadasComEpisodios = await Promise.all(
            temporadasParaBuscar.map(s => tmdb.temporada(serieId, s.season_number))
          )

          if (cancelled) return

          // 🌳 A MÁGICA DO COMPOSITE: Montamos a árvore de uma vez só
          const serieArvore = montarArvoreCompositeSerie(serieBruta, temporadasComEpisodios)

          setObra(serieArvore)
          registrarObraNoIndice(serieArvore)
          
          // Registra os episódios no índice (via recursão plana) para o diário funcionar solto
          serieArvore.getFilhos().forEach(temporada => {
            temporada.getFilhos().forEach(ep => registrarObraNoIndice(ep))
          })

          const primeira = temporadasParaBuscar.find(s => s.episode_count > 0 && s.season_number > 0)
          if (primeira) setOpenSeason(primeira.season_number)

        } catch (err) {
          if (!cancelled) setError("Erro ao carregar os dados das temporadas.")
        } finally {
          if (!cancelled) setLoading(false)
        }
      })
      .catch((e) => !cancelled && setError(e.message))

    return () => { cancelled = true }
  }, [serieId, registrarObraNoIndice])

  if (loading) return <div className="muted">Carregando a estrutura da série…</div>
  if (error) return <div className="error">{error}</div>
  if (!obra) return null

  // Usando os métodos polimórficos do Nó Raiz
  const totalEp = obra.getContagemEpisodios()
  const vistos = contarEpisodiosVistosDaSerie(serieId)
  const progresso = totalEp ? Math.round((vistos / totalEp) * 100) : 0
  const naWatchlist = estaNaWatchlist(obra)

  function marcarTudoVisto() {
    // 🌳 COMPOSITE EM AÇÃO: Passamos apenas a raiz da árvore! 
    // O contexto e as classes resolvem o resto recursivamente.
    marcarSerieInteiraVista(obra)
    setNotificacao(`🎉 Toda a série "${obra.titulo}" foi marcada como vista!`)
  }

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Caixa de Notificação */}
      {notificacao && (
        <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--background-card, #1e1e24)', border: '2px solid var(--primary, #6366f1)',
            borderRadius: '8px', padding: '24px 32px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            zIndex: 10000, textAlign: 'center', maxWidth: '90%', width: '400px'
          }} className="review-form">
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.4' }}>{notificacao}</p>
          <button type="button" className="btn primary" style={{ marginTop: '16px', padding: '6px 16px' }} onClick={() => setNotificacao(null)}>
            Entendido
          </button>
        </div>
      )}

      <div className="series-hero">
        {posterUrl(obra.posterPath, 'w342') ? (
          <img className="poster" src={posterUrl(obra.posterPath, 'w342')} alt={obra.titulo} />
        ) : (
          <div className="poster-placeholder" style={{ width: 200 }}>Sem pôster</div>
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
          
          {/* 🌳 COMPOSITE: O cálculo total exato processado em cascata pelos filhos! */}
          {totalEp > 0 && (
            <div className="meta" style={{ color: 'var(--primary, #6366f1)', fontWeight: 'bold', marginTop: '4px' }}>
              ⏱️ Tempo de vida exigido: {obra.getDuracaoTotal()} minutos
            </div>
          )}

          {obra.generos.length > 0 && (
            <div className="tag-row">
              {obra.generos.map((g) => <span className="tag" key={g}>{g}</span>)}
            </div>
          )}
          {obra.criadores.length > 0 && (
            <div className="muted">Criação: {obra.criadores.join(', ')}</div>
          )}
          <p className="overview">{obra.sinopse}</p>
          
          {totalEp > 0 && (
            <div className="progresso-barra" title={`${progresso}% concluído`}>
              <div style={{ width: `${progresso}%` }} />
            </div>
          )}

          {autenticado && (
            <div className="actions-row">
              <button className="btn primary" onClick={() => setMostrandoLog((v) => !v)}>
                + Registrar no diário
              </button>
              <button className={'btn ' + (naWatchlist ? 'toggle-on' : '')} onClick={() => alternarWatchlist(obra)}>
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
              setMostrandoLog(false)
              setNotificacao(`🎉 "${obra.titulo}" foi registrada no seu diário com sucesso!`)
            }}
            onCancel={() => setMostrandoLog(false)}
          />
        </div>
      )}

      <h2 className="section-title">Temporadas</h2>
      {obra.getFilhos().length === 0 && (
        <div className="empty-state">Nenhuma temporada encontrada.</div>
      )}
      
      {/* Renderizando as temporadas a partir dos NÓS INTERMEDIÁRIOS da árvore */}
      {obra.getFilhos().map((temporadaObra) => (
        <SeasonBlock
          key={temporadaObra.id}
          temporada={temporadaObra}
          open={openSeason === temporadaObra.numeroTemporada}
          onToggle={() => setOpenSeason(openSeason === temporadaObra.numeroTemporada ? null : temporadaObra.numeroTemporada)}
        />
      ))}
    </div>
  )
}

/**
 * REFATORAÇÃO COMPOSITE: 
 * O bloco de temporada não recebe mais dados brutos do TMDB. 
 * Ele recebe a instância da classe `Temporada` e usa seus métodos.
 */
function SeasonBlock({ temporada, open, onToggle }) {
  const { episodioVisto, alternarEpisodioVisto } = useUserData()
  
  // Pegando as FOLHAS (Episódios) da árvore
  const episodios = temporada.getFilhos()

  return (
    <div className="season-section">
      <button className="season-toggle" onClick={onToggle}>
        <span>
          {temporada.titulo} · {temporada.getContagemEpisodios()} episódios
          {temporada.dataLancamento ? ` · ${temporada.dataLancamento.slice(0, 4)}` : ''}
        </span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="episode-list">
          {episodios.length === 0 && <div className="muted">Nenhum episódio listado.</div>}
          
          {episodios.map((ep) => {
            const visto = episodioVisto(ep)
            return (
              <div className="episode-row" key={ep.id}>
                <span className="episode-num">
                  S{String(ep.numeroTemporada).padStart(2, '0')}E{String(ep.numeroEpisodio).padStart(2, '0')}
                </span>
                <Link to={ep.getRota()} className="episode-title">
                  {ep.titulo}
                </Link>
                <span className="episode-air">{ep.dataLancamento || 'TBA'}</span>
                <button
                  className={'btn ' + (visto ? 'toggle-on' : '')}
                  onClick={() => alternarEpisodioVisto(ep)}
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