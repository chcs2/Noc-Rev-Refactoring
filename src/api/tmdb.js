// Cliente TMDB — chave em VITE_TMDB_API_KEY (.env).
// Este módulo é o ÚNICO ponto que conhece o formato bruto do TMDB.
// As respostas são convertidas em Obras (subclasses polimórficas) pelo
// `src/domain/factory.js`.

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p'

export const posterUrl = (path, size = 'w342') =>
  path ? `${IMG}/${size}${path}` : null

export const stillUrl = (path, size = 'w300') =>
  path ? `${IMG}/${size}${path}` : null

async function get(path, params = {}) {
  if (!API_KEY) {
    throw new Error(
      'VITE_TMDB_API_KEY ausente. Configure o arquivo .env (veja README).',
    )
  }
  const url = new URL(BASE + path)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', 'pt-BR')
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  }
  const res = await fetch(url)
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`TMDB ${res.status}: ${txt || res.statusText}`)
  }
  return res.json()
}

export const tmdb = {
  // Séries
  trendingTv: () => get('/trending/tv/week'),
  popularTv: (page = 1) => get('/tv/popular', { page }),
  searchTv: (query, page = 1) => get('/search/tv', { query, page }),
  serie: (id) => get(`/tv/${id}`, { append_to_response: 'credits' }),
  temporada: (id, sn) => get(`/tv/${id}/season/${sn}`),
  episodio: (id, sn, en) => get(`/tv/${id}/season/${sn}/episode/${en}`),

  // Filmes
  trendingMovie: () => get('/trending/movie/week'),
  popularMovie: (page = 1) => get('/movie/popular', { page }),
  searchMovie: (query, page = 1) => get('/search/movie', { query, page }),
  filme: (id) => get(`/movie/${id}`, { append_to_response: 'credits' }),

  // Multi (busca cruzada — usada nos Filtros Híbridos req. 3.2.3)
  searchMulti: (query, page = 1) => get('/search/multi', { query, page }),
}

export const hasApiKey = () => Boolean(API_KEY)
