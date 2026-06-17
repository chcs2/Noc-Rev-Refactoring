import Obra from './Obra.js'

/**
 * Episódio — herda de Obra. É uma unidade granular usada nas Listas Mistas
 * (req. 3.2.4) e no Sistema de Progresso Flexível (req. 3.2.2).
 *
 * Padrão Composite: Atua como a FOLHA (Leaf) da árvore de Séries.
 * Sendo a menor unidade, não suporta filhos. Sua estrutura de dados
 * resolve a ponta final dos cálculos de recursão (duração e contagem).
 */
export default class Episodio extends Obra {
  constructor(props) {
    super(props)
    this.serieId = props.serieId
    this.numeroTemporada = props.numeroTemporada
    this.numeroEpisodio = props.numeroEpisodio
    this.runtime = props.runtime || 0
    this.serieTitulo = props.serieTitulo || ''
    
    // ✨ NOVO: Propriedade de estado da Folha
    this.visto = !!props.visto
  }

  
  // Composite: Operações de Estado em Massa
  

  /**
   * Define o status de "visto" desta folha.
   * @param {boolean} status 
   */
  setVisto(status) {
    this.visto = !!status
  }

  /**
   * Retorna se este episódio já foi visto.
   */
  isVisto() {
    return this.visto
  }

  
  // Composite : Implementação da Folha (Leaf)
  

  /** * Composite: Na recursão da árvore, a folha responde que vale exatamente 1. */
  getContagemEpisodios() {
    return 1
  }

  /** 
   * ✨ NOVO / BLINDAGEM: Garante que a folha retorne sua própria duração 
   * em qualquer cálculo do padrão Composite, ignorando comportamentos do Obra.js
   */
  getDuracaoTotal() {
    return this.runtime || 0
  }


  // Métodos Originais polimórficos
  
  
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
      // Garante que o estado seja salvo no localStorage
      visto: this.visto,
    }
  }
}