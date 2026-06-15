import Obra from './Obra.js'

/**
 * Episódio — herda de Obra. É uma unidade granular usada nas Listas Mistas
 * (req. 3.2.4) e no Sistema de Progresso Flexível (req. 3.2.2).
 */
export default class Episodio extends Obra {
  constructor(props) {
    super(props)
    this.serieId = props.serieId
    this.numeroTemporada = props.numeroTemporada
    this.numeroEpisodio = props.numeroEpisodio
    this.runtime = props.runtime || 0
    this.serieTitulo = props.serieTitulo || ''
  }

  getTipo() {
    return 'Episódio'
  }

  getDuracaoMinutos() {
    return this.runtime
  }

  getResumoMetadados() {
    const cod = `S${String(this.numeroTemporada).padStart(2, '0')}E${String(this.numeroEpisodio).padStart(2, '0')}`
    const dur = this.runtime ? ` · ${this.runtime} min` : ''
    return cod + dur
  }

  getIdentificadorUnico() {
    return `episodio:${this.serieId}:${this.numeroTemporada}:${this.numeroEpisodio}`
  }

  getRota() {
    return `/serie/${this.serieId}/temporada/${this.numeroTemporada}/episodio/${this.numeroEpisodio}`
  }

  getIconeSelo() {
    return '📼'
  }

  paraIndice() {
    return {
      ...super.paraIndice(),
      serieId: this.serieId,
      serieTitulo: this.serieTitulo,
      numeroTemporada: this.numeroTemporada,
      numeroEpisodio: this.numeroEpisodio,
      runtime: this.runtime,
    }
  }
}
