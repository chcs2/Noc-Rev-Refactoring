import Obra from './Obra.js'

/**
 * Filme — herda de Obra. Sobrescreve métodos para a unidade "Filme".
 * Demonstra HERANÇA (extends Obra) e POLIMORFISMO (override).
 */
export default class Filme extends Obra {
  constructor(props) {
    super(props)
    this.runtime = props.runtime || 0 // em minutos
    this.diretores = props.diretores || []
  }

  getTipo() {
    return 'Filme'
  }

  getDuracaoMinutos() {
    return this.runtime
  }

  getResumoMetadados() {
    return this.runtime ? `${this.runtime} min` : ''
  }

  getIdentificadorUnico() {
    return `filme:${this.id}`
  }

  getRota() {
    return `/filme/${this.id}`
  }

  getIconeSelo() {
    return '🎬'
  }

  paraIndice() {
    return { ...super.paraIndice(), runtime: this.runtime, diretores: this.diretores }
  }
}
