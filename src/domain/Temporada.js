import Obra from './Obra.js'

/**
 * Temporada — herda de Obra.
 *
 * Padrão Composite: Atua como um NÓ INTERMEDIÁRIO (Composite).
 * Uma Temporada é uma Obra que contém múltiplas outras Obras menores (Episódios).
 * Ela delega cálculos complexos (como duração) e operações de estado para 
 * os seus componentes internos.
 */
export default class Temporada extends Obra {
  constructor(props) {
    super(props)
    this.serieId = props.serieId
    this.numeroTemporada = props.numeroTemporada
    
    // ✨ NOVO: Propriedade de estado do Nó Intermediário
    this.visto = !!props.visto
    
    // Composite: Estrutura que armazena os nós filhos
    // Modificado para aceitar filhos do props ou iniciar vazio na reidratação
    this.filhos = props.filhos || [] 
  }


  // Padrão Composite: Operações de Estado em Massa
  

  /**
   * COMPOSITE EM AÇÃO: Propaga a alteração de estado para todos os filhos.
   * Marca a si mesma como vista e repassa a ordem para os Episódios.
   * @param {boolean} status 
   */
  setVisto(status) {
    this.visto = !!status
    // Defesa contra reidratação (garante que filhos exista antes de iterar)
    if (this.filhos) {
      this.filhos.forEach(episodio => episodio.setVisto(status))
    }
  }

  /**
   * Retorna se a temporada inteira foi marcada como vista.
   */
  isVisto() {
    return this.visto
  }

  // Padrão Composite: Implementação do Composto


  /** Composite: Adiciona um episódio a esta temporada. */
  adicionarFilho(obra) {
    if (!this.filhos) this.filhos = []
    if (obra.getTipo() !== 'Episódio') {
      throw new Error('Uma temporada só pode conter Episódios.')
    }
    this.filhos.push(obra)
  }

  /** Composite: Remove um episódio pelo ID. */
  removerFilho(obraId) {
    if (!this.filhos) return
    this.filhos = this.filhos.filter(filho => filho.id !== obraId)
  }

  /** Composite: Retorna todos os episódios contidos nela. */
  getFilhos() {
    return this.filhos || []
  }

  /** * * Composite: A Mágica da Árvore!
   * A temporada não tem uma duração fixa. Ela repassa a pergunta para
   * cada um de seus episódios e soma o total dinamicamente.
   */
  getDuracaoTotal() {
    // ✨ DEFESA CONTRA REIDRATAÇÃO APLICADA
    if (!this.filhos || this.filhos.length === 0) return 0
    return this.filhos.reduce((total, filho) => total + filho.getDuracaoTotal(), 0)
  }

  /** * Composite: Conta quantos episódios existem lá dentro. */
  getContagemEpisodios() {
    // ✨ DEFESA CONTRA REIDRATAÇÃO APLICADA
    if (!this.filhos || this.filhos.length === 0) return 0
    return this.filhos.reduce((total, filho) => total + filho.getContagemEpisodios(), 0)
  }


  // MÉTODOS ORIGINAIS POLIMÓRFICOS


  getTipo() {
    return 'Temporada'
  }

  getResumoMetadados() {
    const contagem = this.getContagemEpisodios()
    const duracao = this.getDuracaoTotal()
    
    return `${contagem} Episódios · Total: ${duracao} min`
  }

  getIdentificadorUnico() {
    return `temporada:${this.serieId}:${this.numeroTemporada}`
  }

  getRota() {
    return `/serie/${this.serieId}/temporada/${this.numeroTemporada}`
  }

  getIconeSelo() {
    return '📁'
  }

  paraIndice() {
    const base = super.paraIndice()
    delete base.filhos // 🔥 MATA O ZUMBI: Protege a serialização

    return {
      ...base,
      serieId: this.serieId,
      numeroTemporada: this.numeroTemporada,
      visto: this.visto,
    }
  }
}