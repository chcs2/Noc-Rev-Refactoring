import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tmdb, hasApiKey } from '../api/tmdb.js'
import { obraDeFilmeTmdb, obraDeSerieTmdb } from '../domain/factory.js'
import ObraCard from '../components/ObraCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useUserData } from '../context/UserDataContext.jsx'
import { calcularStreak } from '../utils/streak.js'

/**
 * Home — vitrine de descoberta. Carrega trendings de TMDB para SÉRIES e
 * FILMES e os converte em Obras polimórficas (Modelagem Universal — req.
 * 3.2.1). Quando o usuário está logado, exibe banner do streak (req. 3.2.6).
 */
export default function Home() {
  const { autenticado } = useAuth()
  const { diary } = useUserData()

  const [trendingTv, setTrendingTv] = useState([])
  const [trendingMovies, setTrendingMovies] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!hasApiKey()) {
      setError('VITE_TMDB_API_KEY ausente. Configure o .env (ver README).')
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([tmdb.trendingTv(), tmdb.trendingMovie()])
      .then(([tv, mv]) => {
        if (cancelled) return
        setTrendingTv((tv.results || []).map(obraDeSerieTmdb))
        setTrendingMovies((mv.results || []).map(obraDeFilmeTmdb))
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const streak = calcularStreak(diary)

  return (
    <div>
      <h1 className="page-title">Descobrir</h1>
      {autenticado && (
        <div className="streak-banner">
          {streak.ativo ? (
            <span>
              🔥 Streak de <strong>{streak.semanas}</strong> semana
              {streak.semanas > 1 ? 's' : ''}! Não perca o ritmo.
            </span>
          ) : (
            <span>
              Sem streak ativa. Registre algo no <Link to="/diario">diário</Link>{' '}
              esta semana para iniciar uma ofensiva.
            </span>
          )}
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {loading && !error && <div className="muted">Carregando…</div>}

      {trendingTv.length > 0 && (
        <>
          <h2 className="section-title">Séries em alta</h2>
          <div className="grid">
            {trendingTv.map((o) => (
              <ObraCard key={o.getIdentificadorUnico()} obra={o} />
            ))}
          </div>
        </>
      )}

      {trendingMovies.length > 0 && (
        <>
          <h2 className="section-title">Filmes em alta</h2>
          <div className="grid">
            {trendingMovies.map((o) => (
              <ObraCard key={o.getIdentificadorUnico()} obra={o} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
