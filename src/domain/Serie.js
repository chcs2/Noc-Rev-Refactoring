import Obra from './Obra.js'

/**
 * Série — herda de Obra. Calcula duração agregando episódios.
 * Demonstra HERANÇA e POLIMORFISMO (override).
 */
export default class Serie extends Obra {
  constructor(props) {
    super(props)
    this.numTemporadas = props.numTemporadas || 0
    this.numEpisodios = props.numEpisodios || 0
    this.duracaoMediaEpisodio = props.duracaoMediaEpisodio || 0 // minutos
    this.criadores = props.criadores || []
  }

  getTipo() {
    return 'Série'
  }

  getDuracaoMinutos() {
    return this.numEpisodios * this.duracaoMediaEpisodio
  }

  getResumoMetadados() {
    if (!this.numTemporadas) return ''
    const t = `${this.numTemporadas} temporada${this.numTemporadas > 1 ? 's' : ''}`
    const e = this.numEpisodios ? ` · ${this.numEpisodios} episódios` : ''
    return t + e
  }

  getIdentificadorUnico() {
    return `serie:${this.id}`
  }

  getRota() {
    return `/serie/${this.id}`
  }

  getIconeSelo() {
    return '📺'
  }

  paraIndice() {
    return {
      ...super.paraIndice(),
      numTemporadas: this.numTemporadas,
      numEpisodios: this.numEpisodios,
      duracaoMediaEpisodio: this.duracaoMediaEpisodio,
      criadores: this.criadores,
    }
  }
}
