import Filme from './Filme.js'

/**
 * Documentário — herda de Filme (HERANÇA EM CADEIA: Obra → Filme → Documentario).
 * É um filme com selo distinto, usado quando o gênero "Documentary" (TMDB id 99)
 * está presente. Demonstra que a hierarquia pode ter mais de um nível.
 */
export default class Documentario extends Filme {
  getTipo() {
    return 'Documentário'
  }

  getIdentificadorUnico() {
    return `documentario:${this.id}`
  }

  getRota() {
    return `/filme/${this.id}` // mesmas telas do filme
  }

  getIconeSelo() {
    return '🎥'
  }
}
