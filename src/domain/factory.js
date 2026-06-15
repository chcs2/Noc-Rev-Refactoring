/**
 * Fábrica de Obras — converte respostas brutas do TMDB nas subclasses
 * apropriadas (Filme, Documentario, Serie, Minisserie, Episodio).
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
import Episodio from './Episodio.js'

const TMDB_GENERO_DOCUMENTARIO = 99

/**
 * 🧬 REPOSITÓRIO DE PROTÓTIPOS (Prototype Cache / Registry)
 * Criamos instâncias vazias de cada classe para servirem de "molde de métodos" (Protótipos).
 * O JavaScript usará essas instâncias para herança de comportamento via cadeia de protótipos.
 */
const moldesPrototipo = {
  'Filme': new Filme({ id: 0, titulo: '', generos: [] }),
  'Documentário': new Documentario({ id: 0, titulo: '', generos: [] }),
  'Série': new Serie({ id: 0, titulo: '', generos: [] }),
  'Minissérie': new Minisserie({ id: 0, titulo: '', generos: [] }),
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

function extrairDiretoresDeCredits(data) {
  const crew = data.credits?.crew || []
  return crew.filter((c) => c.job === 'Director').map((c) => c.name)
}

/**
 * Recria uma Obra a partir do índice serializado em localStorage.
 * O campo `tipo` (string) é o discriminador.
 * * 🧬 CRITICAL UPDATE (Prototype Pattern):
 * Eliminamos o switch/case massivo. Usamos a herança de protótipo nativa do JS
 * para acoplar os métodos polimórficos de forma instantânea e leve.
 */
export function obraDeIndice(item) {
  if (!item || !item.tipo) return null

  // 1. Busca o protótipo correspondente no repositório
  const prototipoMolde = moldesPrototipo[item.tipo]
  
  if (!prototipoMolde) return null

  /**
   * 2. 🧬 Object.create() em ação:
   * Cria um objeto totalmente novo e limpo, cujo PAI (__proto__) aponta diretamente 
   * para o nosso protótipo de classe mapeado. Ele herda métodos polimórficos como
   * getRota(), getIconeSelo() e paraIndice() sem passar por um construtor "new" custoso.
   */
  const novaInstanciaObra = Object.create(Object.getPrototypeOf(prototipoMolde))

  /**
   * 3. Object.assign() preenche o clone:
   * Mesclamos os dados puros extraídos do JSON do localStorage para dentro da cópia,
   * isolando o escopo deste item específico na memória.
   */
  Object.assign(novaInstanciaObra, item)

  return novaInstanciaObra
}

export { Obra, Filme, Documentario, Serie, Minisserie, Episodio }