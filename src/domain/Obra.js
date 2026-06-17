/**
 * Obra — entidade matriz da Modelagem de Dados Universal (req. 3.2.1).
 *
 * Esta classe é a SUPERCLASSE da hierarquia e o COMPONENT do padrão Composite.
 * Filme, Série, Minissérie, Documentário, Temporada e Episódio HERDAM dela
 * e SOBRESCREVEM seus métodos. Toda a interface trata essas instâncias de
 * forma uniforme.
 */
export default class Obra {
  constructor({ id, titulo, posterPath, dataLancamento, generos = [], sinopse = '' }) {
    if (new.target === Obra) {
      throw new Error('Obra é abstrata — instancie Filme, Serie, Minisserie, Documentario, Temporada ou Episodio.')
    }
    this.id = id
    this.titulo = titulo
    this.posterPath = posterPath || null
    this.dataLancamento = dataLancamento || null
    this.generos = generos
    this.sinopse = sinopse
  }

  /**
   * Implementação do Padrão Prototype 🧬
   * Retorna uma cópia idêntica da instância atual de forma polimórfica.
   */
  clone() {
    return new this.constructor({
      ...this,
      // Clonagem profunda de arrays para evitar referências compartilhadas na memória
      generos: this.generos ? [...this.generos] : [],
      diretores: this.diretores ? [...this.diretores] : undefined,
      criadores: this.criadores ? [...this.criadores] : undefined
    })
  }

  // ========================================================================
  // PADRÃO COMPOSITE: Interface de Árvore (Component)
  // ========================================================================

  /** * Composite: Adiciona um componente filho (ex: Episódio dentro de Temporada).
   * Por padrão, folhas não suportam filhos e lançam erro (Transparência do Padrão).
   */
  adicionarFilho(obra) {
    throw new Error(`A classe ${this.constructor.name} é uma folha e não pode conter outras obras.`);
  }

  /** Composite: Remove um componente filho. */
  removerFilho(obraId) {
    throw new Error(`A classe ${this.constructor.name} não suporta a remoção de filhos.`);
  }

  /** Composite: Retorna os itens internos. Folhas retornam vazio. */
  getFilhos() {
    return []
  }

  /** * Composite: Duração total acumulada. 
   * O padrão (para folhas) é apenas retornar a própria duração. 
   */
  getDuracaoTotal() {
    return this.getDuracaoMinutos()
  }

  /** * Composite: Contagem total de itens/episódios internos. 
   */
  getContagemEpisodios() {
    return 0
  }

  // ========================================================================
  // MÉTODOS ORIGINAIS POLIMÓRFICOS
  // ========================================================================

  /** Polimórfico — cada subclasse retorna o rótulo do seu tipo. */
  getTipo() {
    return 'Obra'
  }

  /** Polimórfico — duração em minutos do item atual (não da árvore). */
  getDuracaoMinutos() {
    return 0
  }

  /** Polimórfico — string curta para listagens (ex. "112 min", "5 temporadas"). */
  getResumoMetadados() {
    return ''
  }

  /** Identificador único global usado nas chaves de localStorage. */
  getIdentificadorUnico() {
    return `obra:${this.id}`
  }

  /** Ano de lançamento (ou string vazia). */
  getAno() {
    return (this.dataLancamento || '').slice(0, 4)
  }

  /** URL do detalhe — sobrescrito por subclasses para apontar para a rota correta. */
  getRota() {
    return `/obra/${this.id}`
  }

  /** Ícone de selo visual usado em Listas Mistas (req. 3.2.4). */
  getIconeSelo() {
    return '·'
  }

  /** Serialização compacta usada no índice de obras em localStorage. */
  paraIndice() {
    return {
      tipo: this.getTipo(),
      id: this.id,
      titulo: this.titulo,
      posterPath: this.posterPath,
      dataLancamento: this.dataLancamento,
      generos: this.generos,
    }
  }
}