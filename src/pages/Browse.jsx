import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { tmdb, hasApiKey } from '../api/tmdb.js'
import { obraDeFilmeTmdb, obraDeSerieTmdb } from '../domain/factory.js'
import ObraCard from '../components/ObraCard.jsx'
import FiltrosHibridos, { TIPOS_DISPONIVEIS } from '../components/FiltrosHibridos.jsx'
import { useUserData } from '../context/UserDataContext.jsx'

/**
 * Browse — Filtros Híbridos de Busca (req. 3.2.3).
 *
 * Faz busca cruzada (search/multi do TMDB) e aplica filtros do lado cliente:
 *  - tipos de mídia (Filme, Série, Minissérie, Documentário, Episódio)
 *  - nota mínima (cruzando com nota do usuário no diário, se houver)
 *
 * Demonstra Listas Mistas implicitamente: a grade de resultados pode conter
 * obras de tipos diferentes na mesma renderização.
 */
export default function Browse() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const tiposParam = params.get('tipos') || ''
  const notaMinParam = Number(params.get('notaMin') || 0)

  const [tiposSelecionados, setTiposSelecionados] = useState(
    tiposParam ? tiposParam.split(',') : TIPOS_DISPONIVEIS.map((t) => t.id),
  )
  const [notaMin, setNotaMin] = useState(notaMinParam)
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { diary } = useUserData()

  // Sincroniza filtros na URL
  useEffect(() => {
    const novo = new URLSearchParams(params)
    if (tiposSelecionados.length === TIPOS_DISPONIVEIS.length) {
      novo.delete('tipos')
    } else {
      novo.set('tipos', tiposSelecionados.join(','))
    }
    if (notaMin > 0) novo.set('notaMin', String(notaMin))
    else novo.delete('notaMin')
    setParams(novo, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiposSelecionados, notaMin])

  // Faz a busca quando `q` muda (ou inicia sem busca = mostra populares mistos)
  useEffect(() => {
    if (!hasApiKey()) {
      setError('VITE_TMDB_API_KEY ausente.')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    const promise = q.trim()
      ? tmdb.searchMulti(q.trim()).then((r) =>
          (r.results || [])
            .filter((it) => it.media_type === 'movie' || it.media_type === 'tv')
            .map((it) =>
              it.media_type === 'movie' ? obraDeFilmeTmdb(it) : obraDeSerieTmdb(it),
            ),
        )
      : Promise.all([tmdb.popularTv(), tmdb.popularMovie()]).then(([tv, mv]) => [
          ...(tv.results || []).map(obraDeSerieTmdb),
          ...(mv.results || []).map(obraDeFilmeTmdb),
        ])

    promise
      .then((obras) => !cancelled && setResultados(obras))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [q])

  // Mapa nota máxima do usuário por obraIdUnique (para filtrar pela nota)
  const notaPorObra = useMemo(() => {
    const m = {}
    for (const e of diary) {
      const cur = m[e.obraIdUnique] || 0
      if (e.nota > cur) m[e.obraIdUnique] = e.nota
    }
    return m
  }, [diary])

  const filtrados = useMemo(() => {
    return resultados.filter((o) => {
      if (!tiposSelecionados.includes(o.getTipo())) return false
      if (notaMin > 0) {
        const nota = notaPorObra[o.getIdentificadorUnico()] || 0
        if (nota < notaMin) return false
      }
      return true
    })
  }, [resultados, tiposSelecionados, notaMin, notaPorObra])

  function limpar() {
    setTiposSelecionados(TIPOS_DISPONIVEIS.map((t) => t.id))
    setNotaMin(0)
  }

  return (
    <div>
      <h1 className="page-title">
        {q ? `Resultados para "${q}"` : 'Explorar'}
      </h1>
      <FiltrosHibridos
        tiposSelecionados={tiposSelecionados}
        setTiposSelecionados={setTiposSelecionados}
        notaMin={notaMin}
        setNotaMin={setNotaMin}
        onLimpar={limpar}
      />
      {error && <div className="error">{error}</div>}
      {loading && <div className="muted">Buscando…</div>}
      {!loading && filtrados.length === 0 && !error && (
        <div className="empty-state">
          Nenhuma obra corresponde aos filtros.
        </div>
      )}
      <div className="grid">
        {filtrados.map((o) => (
          <ObraCard key={o.getIdentificadorUnico()} obra={o} />
        ))}
      </div>
    </div>
  )
}
