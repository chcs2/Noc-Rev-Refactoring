import Obra from './Obra.js'

/**
 * Série — herda de Obra.
 *
 * Padrão composite: Atua como o NÓ RAIZ (Root Composite).
 * Uma Série contém Obras menores (Temporadas). Delega os cálculos 
 * precisos de duração para a árvore, mas possui um fallback seguro 
 * caso a árvore completa ainda não tenha sido carregada da API.
 */
export default class Serie extends Obra {
  constructor(props) {
    super(props)
    this.numTemporadas = props.numTemporadas || 0
    this.numEpisodios = props.numEpisodios || 0
    this.duracaoMediaEpisodio = props.duracaoMediaEpisodio || 0 // minutos
    this.criadores = props.criadores || []

    // Propriedade de estado do Nó Raiz
    this.visto = !!props.visto

    // Composite: Estrutura que armazena os nós filhos (Temporadas)
    this.filhos = props.filhos || []
  }


  // Composite: Operações de Estado em Massa
  
  
  /**
   * COMPOSITE EM AÇÃO: O Gatilho Principal (Root).
   * Marca a série como vista e propaga a ordem para todas as Temporadas.
   */
  setVisto(status) {
    this.visto = !!status
    // Proteção de reidratação
    if (this.filhos) {
      this.filhos.forEach(temporada => temporada.setVisto(status))
    }
  }

  isVisto() {
    return this.visto
  }
  
  
  // Padrão Composite: Implementação do Composto Raiz (Root)
  

  adicionarFilho(obra) {
    if (!this.filhos) this.filhos = []
    if (obra.getTipo() !== 'Temporada') {
      throw new Error('Uma série estruturada só pode conter Temporadas.')
    }
    this.filhos.push(obra)
  }

  removerFilho(obraId) {
    if (!this.filhos) return
    this.filhos = this.filhos.filter(filho => filho.id !== obraId)
  }

  getFilhos() {
    return this.filhos || []
  }

  /**
   * Duração Total
   * Se a árvore está montada (tem filhos), delega para as temporadas o cálculo.
   * Se for apenas listagem (sem os filhos carregados), usa a estimativa matemática.
   */
  getDuracaoTotal() {
    // ✨ DEFESA CONTRA REIDRATAÇÃO APLICADA
    if (this.filhos && this.filhos.length > 0) {
      return this.filhos.reduce((total, filho) => total + filho.getDuracaoTotal(), 0)
    }
    return this.getDuracaoMinutos() 
  }

  /** Contagem Total de Episódios */
  getContagemEpisodios() {
    // ✨ DEFESA CONTRA REIDRATAÇÃO APLICADA
    if (this.filhos && this.filhos.length > 0) {
      return this.filhos.reduce((total, filho) => total + filho.getContagemEpisodios(), 0)
    }
    return this.numEpisodios 
  }

  
  // MÉTODOS ORIGINAIS POLIMÓRFICOS
  
  getTipo() {
    return 'Série'
  }

  getDuracaoMinutos() {
    return this.numEpisodios * this.duracaoMediaEpisodio
  }

  getResumoMetadados() {
    if (!this.numTemporadas) return ''
    const t = `${this.numTemporadas} temporada${this.numTemporadas > 1 ? 's' : ''}`
    const totalEp = this.getContagemEpisodios() 
    const e = totalEp ? ` · ${totalEp} episódios` : ''
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
    const base = super.paraIndice()
    // 🔥 MATA O ZUMBI: Garante que a árvore não vá para o localStorage
    delete base.filhos 

    return {
      ...base,
      numTemporadas: this.numTemporadas,
      numEpisodios: this.numEpisodios,
      duracaoMediaEpisodio: this.duracaoMediaEpisodio,
      criadores: this.criadores,
      visto: this.visto,
    }
  }
}