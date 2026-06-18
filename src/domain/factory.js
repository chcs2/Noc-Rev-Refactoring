/**
 * Fábrica de Obras — converte respostas brutas do TMDB nas subclasses
 * apropriadas (Filme, Documentario, Serie, Minisserie, Temporada, Episodio).
 *
 * Ponto-chave da Modelagem Universal (req. 3.2.1): a interface da aplicação
 * trabalha com `Obra` (polimorficamente). Esta fábrica é o único lugar que
 * "sabe" os formatos do TMDB.
 */

import Obra from './Obra.js'
import Filme from './Filme.js'
import Documentario from './Documentario.js'
import Serie from './Serie.js'
import Minisserie from './Minisserie.js'
import Temporada from './Temporada.js' // 🌳 Novo Import do Composite
import Episodio from './Episodio.js'

const TMDB_GENERO_DOCUMENTARIO = 99

/**
 * REPOSITÓRIO DE PROTÓTIPOS (Prototype Cache / Registry)
 * Criamos instâncias vazias de cada classe para servirem de "molde de métodos" (Protótipos).
 */
const moldesPrototipo = {
  'Filme': new Filme({ id: 0, titulo: '', generos: [] }),
  'Documentário': new Documentario({ id: 0, titulo: '', generos: [] }),
  'Série': new Serie({ id: 0, titulo: '', generos: [] }),
  'Minissérie': new Minisserie({ id: 0, titulo: '', generos: [] }),
  'Temporada': new Temporada({ id: 0, titulo: '', generos: [] }), // 🌳 Novo molde
  'Episódio': new Episodio({ id: 0, titulo: '', generos: [] })
}

export function obraDeFilmeTmdb(data) {
  const generos = (data.genres || []).map((g) => g.name)
  const props = {
    id: data.id,
    titulo: data.title || data.original_title,
    posterPath: data.poster_path,
    dataLancamento: data.release_date,
    generos,
    sinopse: data.overview,
    runtime: data.runtime || 0,
    diretores: extrairDiretoresDeCredits(data),
  }
  const ehDoc =
    (data.genres || []).some((g) => g.id === TMDB_GENERO_DOCUMENTARIO) ||
    (data.genre_ids || []).includes(TMDB_GENERO_DOCUMENTARIO)
  return ehDoc ? new Documentario(props) : new Filme(props)
}

export function obraDeSerieTmdb(data) {
  const generos = (data.genres || []).map((g) => g.name)
  const numEp = data.number_of_episodes || 0
  const tempRuntime = (data.episode_run_time || [])[0] || 0
  const props = {
    id: data.id,
    titulo: data.name || data.original_name,
    posterPath: data.poster_path,
    dataLancamento: data.first_air_date,
    generos,
    sinopse: data.overview,
    numTemporadas: data.number_of_seasons || 0,
    numEpisodios: numEp,
    duracaoMediaEpisodio: tempRuntime,
    criadores: (data.created_by || []).map((c) => c.name),
  }
  if (data.type === 'Miniseries') return new Minisserie(props)
  return new Serie(props)
}

/** Nova Fábrica para o Nó Intermediário do Composite */
export function obraDeTemporadaTmdb(data, contexto = {}) {
  return new Temporada({
    id: data.id,
    titulo: data.name || `Temporada ${data.season_number}`,
    posterPath: data.poster_path,
    dataLancamento: data.air_date,
    sinopse: data.overview,
    serieId: contexto.serieId,
    numeroTemporada: data.season_number
  })
}

export function obraDeEpisodioTmdb(data, contexto = {}) {
  return new Episodio({
    id: data.id,
    titulo: data.name || `Episódio ${data.episode_number}`,
    posterPath: data.still_path,
    dataLancamento: data.air_date,
    sinopse: data.overview,
    serieId: contexto.serieId,
    serieTitulo: contexto.serieTitulo,
    numeroTemporada: data.season_number,
    numeroEpisodio: data.episode_number,
    runtime: data.runtime || 0,
  })
}

/**
 * PADRÃO COMPOSITE: O Mestre de Obras (Tree Builder)
 * Monta a hierarquia completa de instâncias: Série -> Temporadas -> Episódios.
 * * @param {Object} serieBruta - JSON da resposta `/tv/{id}` do TMDB.
 * @param {Array} temporadasComEpisodios - Array de respostas `/tv/{id}/season/{num}` do TMDB.
 */
export function montarArvoreCompositeSerie(serieBruta, temporadasComEpisodios = []) {
  // 1. Cria o Nó Raiz (Série)
  const serie = obraDeSerieTmdb(serieBruta)

  // 2. Itera sobre as temporadas completas que vieram da API
  temporadasComEpisodios.forEach(tempData => {
    // Cria o Nó Intermediário (Temporada)
    const temporada = obraDeTemporadaTmdb(tempData, { serieId: serie.id })

    // 3. Verifica se existem episódios dentro desta temporada
    if (tempData.episodes && Array.isArray(tempData.episodes)) {
      tempData.episodes.forEach(epData => {
        // Cria a Folha (Episódio)
        const episodio = obraDeEpisodioTmdb(epData, {
          serieId: serie.id,
          serieTitulo: serie.titulo,
        })
        // COMPOSITE EM AÇÃO: Liga a folha no nó intermediário
        temporada.adicionarFilho(episodio)
      })
    }

    // COMPOSITE EM AÇÃO: Liga o nó intermediário na raiz
    serie.adicionarFilho(temporada)
  })

  // Retorna a árvore pronta e calculada!
  return serie
}

function extrairDiretoresDeCredits(data) {
  const crew = data.credits?.crew || []
  return crew.filter((c) => c.job === 'Director').map((c) => c.name)
}

/**
 * Recria uma Obra a partir do índice serializado em localStorage.
 * O campo `tipo` (string) é o discriminador.
 * * CRITICAL UPDATE (Prototype Pattern):
 * Eliminamos o switch/case massivo. Usamos a herança de protótipo nativa do JS.
 */
export function obraDeIndice(item) {
  if (!item || !item.tipo) return null

  const prototipoMolde = moldesPrototipo[item.tipo]
  
  if (!prototipoMolde) return null

  const novaInstanciaObra = Object.create(Object.getPrototypeOf(prototipoMolde))

  Object.assign(novaInstanciaObra, item)

  // Opcional/Futuro: Se o localStorage começar a salvar árvores compostas,
  // você chamaria a recursão aqui para recriar os filhos também. 
  // Por enquanto, listas e diários lidam com obras de forma plana.

  return novaInstanciaObra
}

export { Obra, Filme, Documentario, Serie, Minisserie, Temporada, Episodio }