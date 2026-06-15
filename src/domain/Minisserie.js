import Serie from './Serie.js'

/**
 * Minissérie — herda de Série (HERANÇA EM CADEIA: Obra → Serie → Minisserie).
 * Comporta-se como série mas tem rótulo e selo distintos.
 */
export default class Minisserie extends Serie {
  getTipo() {
    return 'Minissérie'
  }

  getIdentificadorUnico() {
    return `minisserie:${this.id}`
  }

  getRota() {
    return `/serie/${this.id}` // mesmas telas da série
  }

  getIconeSelo() {
    return '🎞️'
  }
}
