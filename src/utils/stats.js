/**
 * Cálculo das Estatísticas Pessoais Avançadas (req. 3.2.5).
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
    somaNotas: 0,
    contagemNotas: 0,
  }

  const idsContabilizadosTempo = new Set()

  // --- PARTE 1: CÁLCULO DAS HORAS (Sem filtro de ano) ---
  // Só varremos os botões "visto" avulsos se o usuário estiver vendo "Todos os tempos".
  // Se ele filtrou por um ano específico, não podemos usar os botões, pois eles não têm data.
  if (!anoFiltro) {
    Object.keys(obraIndex).forEach(chave => {
      const item = obraIndex[chave]
      // Checagem ESTRITA para evitar falsos positivos de strings no cache
      if (item?.visto === true) {
        const obra = obraDeIndice(item)
        if (obra) {
          let minutos = 0
          if (obra.getTipo() === 'Episódio') {
            minutos = item.runtime || obra.getDuracaoMinutos() || 0
          } else {
            minutos = obra.getDuracaoMinutos() || 0
          }
          total.totalHorasAssistidas += minutos / 60
          idsContabilizadosTempo.add(chave)
        }
      }
    })
  }

  // --- PARTE 2: CÁLCULO DOS GRÁFICOS E LOGS (Diário) ---
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

    // Se ainda não somamos o tempo desta obra na Parte 1, avaliamos agora
    if (!idsContabilizadosTempo.has(entry.obraIdUnique)) {
      if (tipo === 'Série' || tipo === 'Minissérie') {
        // Fechou a brecha: Séries E Minisséries precisam do `visto: true` explícito
        if (dadosCrus?.visto === true) {
          total.totalHorasAssistidas += (obra.getDuracaoMinutos() || 0) / 60
        } else {
          total.totalHorasAssistidas += 0
        }
      } else if (tipo === 'Filme' || tipo === 'Documentário') {
        total.totalHorasAssistidas += (obra.getDuracaoMinutos() || 0) / 60
      } else if (tipo === 'Episódio') {
        const minutosEp = dadosCrus?.runtime || obra.getDuracaoMinutos() || 0
        total.totalHorasAssistidas += minutosEp / 60
      }
      idsContabilizadosTempo.add(entry.obraIdUnique)
    }

    // Agrupamentos
    total.porTipo[tipo] = (total.porTipo[tipo] || 0) + 1

    for (const g of obra.generos || []) {
      total.porGenero[g] = (total.porGenero[g] || 0) + 1
    }

    const responsaveis = obra.diretores || obra.criadores || []
    for (const r of responsaveis) {
      total.porDiretor[r] = (total.porDiretor[r] || 0) + 1
    }

    const ano = (entry.dataVisualizacao || '').slice(0, 4)
    if (ano) total.porAno[ano] = (total.porAno[ano] || 0) + 1

    if (entry.nota > 0) {
      total.somaNotas += entry.nota
      total.contagemNotas++
    }
  }

  total.mediaNotas = total.contagemNotas > 0 ? total.somaNotas / total.contagemNotas : 0
  total.totalHorasAssistidas = Math.round(total.totalHorasAssistidas * 10) / 10

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