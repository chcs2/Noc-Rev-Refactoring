/**
 * Cálculo do Sistema de Streaks (req. 3.2.6).
 *
 * Regra: o usuário mantém uma "ofensiva" enquanto registra ao menos um
 * item no diário por SEMANA. Se uma semana inteira passa sem nenhum log,
 * o contador zera.
 *
 * Definimos "semana" como sequência contínua iniciando na segunda-feira.
 */

const MS_DIA = 24 * 60 * 60 * 1000
const MS_SEMANA = 7 * MS_DIA

/** Retorna o início da semana (segunda) que contém a data fornecida. */
function inicioDaSemana(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // getDay(): 0=domingo, 1=segunda, ... 6=sábado
  const diff = (d.getDay() + 6) % 7 // segunda = 0
  d.setDate(d.getDate() - diff)
  return d.getTime()
}

/**
 * Calcula o streak atual a partir do diário.
 *  - diary: lista de entradas { dataVisualizacao: 'YYYY-MM-DD', criadoEm: ms }
 *  - hoje: timestamp opcional para testes
 */
export function calcularStreak(diary, hoje = Date.now()) {
  if (!diary || diary.length === 0) {
    return { ativo: false, semanas: 0, ultimaSemana: null, proximoVencimento: null }
  }

  // Conjunto de semanas (em ms do início) com pelo menos um log.
  const semanasComLog = new Set()
  for (const e of diary) {
    const ts = e.dataVisualizacao
      ? new Date(e.dataVisualizacao + 'T12:00:00').getTime()
      : e.criadoEm
    if (Number.isFinite(ts)) semanasComLog.add(inicioDaSemana(ts))
  }

  const semanaAtual = inicioDaSemana(hoje)
  let cursor = semanaAtual
  let semanas = 0

  // Se a semana atual ainda não tem log, o streak pode estar "em risco":
  // contamos a partir da semana anterior. Se a anterior também não tiver,
  // é zero.
  if (!semanasComLog.has(cursor)) {
    cursor = cursor - MS_SEMANA
    if (!semanasComLog.has(cursor)) {
      return {
        ativo: false,
        semanas: 0,
        ultimaSemana: null,
        proximoVencimento: semanaAtual + MS_SEMANA,
      }
    }
  }

  while (semanasComLog.has(cursor)) {
    semanas++
    cursor -= MS_SEMANA
  }

  return {
    ativo: true,
    semanas,
    ultimaSemana: cursor + MS_SEMANA, // a primeira semana válida (mais antiga)
    proximoVencimento: semanaAtual + MS_SEMANA, // até quando precisa logar de novo
  }
}

/** Selos/conquistas — gamificação leve. */
export function selosConquistados(diary, streak) {
  const selos = []
  if (diary.length >= 1) selos.push({ id: 'primeiro_log', nome: 'Primeiro registro', emoji: '🎟️' })
  if (diary.length >= 10) selos.push({ id: 'cinefilo_iniciante', nome: 'Cinéfilo Iniciante', emoji: '🍿' })
  if (diary.length >= 50) selos.push({ id: 'maratonista', nome: 'Maratonista', emoji: '🏃' })
  if (streak.semanas >= 4) selos.push({ id: 'streak_mes', nome: 'Streak de um mês', emoji: '🔥' })
  if (streak.semanas >= 12) selos.push({ id: 'streak_trimestre', nome: 'Streak de trimestre', emoji: '🌟' })
  return selos
}
