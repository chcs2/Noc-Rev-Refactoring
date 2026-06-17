/**
 * Cálculo das Estatísticas Pessoais Avançadas (req. 3.2.5).
 *
 * Recebe a lista de entradas do diário + o índice de obras e produz
 * agregações para o Dashboard de Consumo.
 */

import { obraDeIndice } from '../domain/factory.js'

export function calcularEstatisticas({ diary, obraIndex, anoFiltro = null }) {
  const total = {
    totalRegistros: 0,
    totalHorasAssistidas: 0,
    porTipo: {},
    porGenero: {},
    porDiretor: {},
    porAno: {},
    porGeneroBruto: {},
    somaNotas: 0,
    contagemNotas: 0,
  }

  // Descobre quais episódios individuais estão marcados como vistos no localStorage global
  // para podermos computar o tempo real caso o usuário registre a Série no Diário.
  const todosIdsVistos = Object.keys(obraIndex).filter(chave => {
    return chave.startsWith('episodio:') && obraIndex[chave]?.visto === true
  })

  const entradasFiltradas = diary.filter((e) => {
    if (!anoFiltro) return true
    const ano = (e.dataVisualizacao || '').slice(0, 4)
    return ano === String(anoFiltro)
  })

  for (const entry of entradasFiltradas) {
    const dadosCrus = obraIndex[entry.obraIdUnique]
    const obra = obraDeIndice(dadosCrus)
    if (!obra) continue
    total.totalRegistros++

    const tipo = obra.getTipo()

    // ⏱️ CÁLCULO DE HORAS BLINDADO E CORRIGIDO
    if (tipo === 'Série') {
      const idSeriePura = obra.id
      const minutosAssistidosDaSerie = todosIdsVistos
        .filter(chaveEp => chaveEp.startsWith(`episodio:${idSeriePura}:`))
        .reduce((soma, chaveEp) => {
          const epDado = obraIndex[chaveEp]
          return soma + (epDado?.runtime || dadosCrus?.duracaoMediaEpisodio || 0)
        }, 0)

      if (minutosAssistidosDaSerie > 0) {
        // 1. Somatório exato apenas dos episódios marcados como vistos
        total.totalHorasAssistidas += minutosAssistidosDaSerie / 60
      } else if (dadosCrus?.visto === true) {
        // 2. O usuário clicou explicitamente em "Marcar série inteira como vista"
        total.totalHorasAssistidas += (obra.getDuracaoMinutos() || 0) / 60
      } else {
        // 3. Apenas registrou um log (resenha/nota), mas não marcou que viu episódios.
        // Solução: Não adiciona nenhuma hora fantasma!
        total.totalHorasAssistidas += 0 
      }
    } else if (tipo === 'Episódio') {
      // Se for log de episódio granular, extrai o tempo direto do runtime salvo
      const minutosEp = dadosCrus?.runtime || obra.getDuracaoMinutos() || 0
      total.totalHorasAssistidas += minutosEp / 60
    } else {
      // Filmes e Documentários usam o padrão polimórfico original
      total.totalHorasAssistidas += (obra.getDuracaoMinutos() || 0) / 60
    }

    // Agrupamento por Tipo
    total.porTipo[tipo] = (total.porTipo[tipo] || 0) + 1

    // Gêneros
    for (const g of obra.generos || []) {
      total.porGenero[g] = (total.porGenero[g] || 0) + 1
    }

    // Diretores ou Criadores
    const responsaveis = obra.diretores || obra.criadores || []
    for (const r of responsaveis) {
      total.porDiretor[r] = (total.porDiretor[r] || 0) + 1
    }

    // Ano da visualização
    const ano = (entry.dataVisualizacao || '').slice(0, 4)
    if (ano) total.porAno[ano] = (total.porAno[ano] || 0) + 1

    // Nota média
    if (entry.nota > 0) {
      total.somaNotas += entry.nota
      total.contagemNotas++
    }
  }

  total.mediaNotas =
    total.contagemNotas > 0 ? total.somaNotas / total.contagemNotas : 0
  
  // Arredonda as horas assistidas de forma limpa para exibição (ex: 12.5 horas)
  total.totalHorasAssistidas = Math.round(total.totalHorasAssistidas * 10) / 10

  // Top-N para diretores e gêneros
  total.topGeneros = topN(total.porGenero, 8)
  total.topDiretores = topN(total.porDiretor, 8)

  return total
}

function topN(map, n) {
  return Object.entries(map)
    .map(([nome, contagem]) => ({ nome, contagem }))
    .sort((a, b) => b.contagem - a.contagem)
    .slice(0, n)
}

export function anosDisponiveis(diary) {
  const set = new Set()
  for (const e of diary) {
    const ano = (e.dataVisualizacao || '').slice(0, 4)
    if (ano) set.add(ano)
  }
  return Array.from(set).sort().reverse()
}