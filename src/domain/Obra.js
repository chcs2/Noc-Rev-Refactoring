/**
 * Obra — entidade matriz da Modelagem de Dados Universal (req. 3.2.1).
 *
 * Esta classe é a SUPERCLASSE da hierarquia. Filme, Série, Minissérie,
 * Documentário e Episódio HERDAM dela (HERANÇA) e SOBRESCREVEM seus métodos
 * (POLIMORFISMO). Toda a interface da aplicação trata essas instâncias de
 * forma uniforme — só os metadados expostos por cada subclasse mudam.
 */
export default class Obra {
  constructor({ id, titulo, posterPath, dataLancamento, generos = [], sinopse = '' }) {
    if (new.target === Obra) {
      throw new Error('Obra é abstrata — instancie Filme, Serie, Minisserie, Documentario ou Episodio.')
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
      // Clonagem profunda de arrays para evitar referências compartilhadas na memória 🧠
      generos: this.generos ? [...this.generos] : [],
      diretores: this.diretores ? [...this.diretores] : undefined,
      criadores: this.criadores ? [...this.criadores] : undefined
    })
  }

  /** Polimórfico — cada subclasse retorna o rótulo do seu tipo. */
  getTipo() {
    return 'Obra'
  }

  /** Polimórfico — duração total em minutos. Cada subclasse calcula do seu jeito. */
  getDuracaoMinutos() {
    return 0
  }

  /** Polimórfico — string corta para listagens (ex. "112 min", "5 temporadas"). */
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