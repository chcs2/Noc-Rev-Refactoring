/**
 * Cálculo das Estatísticas Pessoais Avançadas (req. 3.2.5).
 *
 * Recebe a lista de entradas do diário + o índice de obras e produz
 * agregações para o Dashboard de Consumo.
 *
 * Retornos:
 *  - totalRegistros
 *  - totalHorasAssistidas (soma de obra.getDuracaoMinutos() / 60)
 *  - porTipo: { Filme: 12, Série: 3, ... }
 *  - porGenero: [{ nome, contagem }]
 *  - porDiretor: [{ nome, contagem }]
 *  - porAno: { 2024: 12, 2025: 4 }
 *  - mediaNotas
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

  const entradasFiltradas = diary.filter((e) => {
    if (!anoFiltro) return true
    const ano = (e.dataVisualizacao || '').slice(0, 4)
    return ano === String(anoFiltro)
  })

  for (const entry of entradasFiltradas) {
    const obra = obraDeIndice(obraIndex[entry.obraIdUnique])
    if (!obra) continue
    total.totalRegistros++

    // Horas (POLIMORFISMO em ação: cada subclasse calcula a sua duração)
    total.totalHorasAssistidas += (obra.getDuracaoMinutos() || 0) / 60

    // Tipo
    const tipo = obra.getTipo()
    total.porTipo[tipo] = (total.porTipo[tipo] || 0) + 1

    // Gêneros
    for (const g of obra.generos || []) {
      total.porGenero[g] = (total.porGenero[g] || 0) + 1
    }

    // Diretores (Filme/Documentário) ou Criadores (Série/Minissérie)
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
