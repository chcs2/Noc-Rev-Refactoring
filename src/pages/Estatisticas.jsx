import { useMemo, useState } from 'react'
import { useUserData } from '../context/UserDataContext.jsx'
import { calcularEstatisticas, anosDisponiveis } from '../utils/stats.js'

/**
 * Estatísticas Pessoais Avançadas — req. 3.2.5 (Dashboard de Consumo).
 *
 * Calcula totais e agregações sobre o diário do usuário e desenha gráficos
 * simples em barra (sem libs externas). Permite filtrar por ano ou
 * "Todos os tempos".
 *
 * Observação técnica: o cálculo das horas usa o método polimórfico
 * `obra.getDuracaoMinutos()` — cada subclasse de Obra retorna sua duração
 * conforme o seu tipo (req. 3.2.1).
 */
export default function Estatisticas() {
  const { diary, obraIndex } = useUserData()
  const anos = useMemo(() => anosDisponiveis(diary), [diary])
  const [anoFiltro, setAnoFiltro] = useState(null)

  const stats = useMemo(
    () => calcularEstatisticas({ diary, obraIndex, anoFiltro }),
    [diary, obraIndex, anoFiltro],
  )

  const tipos = Object.entries(stats.porTipo)
  const maxTipo = Math.max(0, ...tipos.map(([, v]) => v))

  return (
    <div>
      <h1 className="page-title">Estatísticas</h1>
      <div className="filter-row">
        <label>
          Período
          <select
            value={anoFiltro || ''}
            onChange={(e) => setAnoFiltro(e.target.value || null)}
          >
            <option value="">Todos os tempos</option>
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="resumo-grid">
        <div className="kpi"><strong>{stats.totalRegistros}</strong><span>Registros</span></div>
        <div className="kpi"><strong>{stats.totalHorasAssistidas}</strong><span>Horas assistidas</span></div>
        <div className="kpi">
          <strong>{stats.mediaNotas ? stats.mediaNotas.toFixed(1) : '—'}</strong>
          <span>Nota média</span>
        </div>
      </div>

      <h2 className="section-title">Por tipo de obra</h2>
      {tipos.length === 0 ? (
        <div className="muted">Sem dados.</div>
      ) : (
        <div className="bar-chart">
          {tipos.map(([tipo, valor]) => (
            <div key={tipo} className="bar-row">
              <span className="bar-label">{tipo}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(valor / maxTipo) * 100}%` }}
                />
              </div>
              <span className="bar-value">{valor}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Top gêneros</h2>
      {stats.topGeneros.length === 0 ? (
        <div className="muted">Sem dados.</div>
      ) : (
        <div className="bar-chart">
          {stats.topGeneros.map((g) => (
            <div key={g.nome} className="bar-row">
              <span className="bar-label">{g.nome}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(g.contagem / stats.topGeneros[0].contagem) * 100}%`,
                  }}
                />
              </div>
              <span className="bar-value">{g.contagem}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Top diretores e criadores</h2>
      {stats.topDiretores.length === 0 ? (
        <div className="muted">Sem dados.</div>
      ) : (
        <div className="bar-chart">
          {stats.topDiretores.map((d) => (
            <div key={d.nome} className="bar-row">
              <span className="bar-label">{d.nome}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(d.contagem / stats.topDiretores[0].contagem) * 100}%`,
                  }}
                />
              </div>
              <span className="bar-value">{d.contagem}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Por ano de visualização</h2>
      {Object.keys(stats.porAno).length === 0 ? (
        <div className="muted">Sem dados.</div>
      ) : (
        <div className="bar-chart">
          {Object.entries(stats.porAno)
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([ano, qt]) => (
              <div key={ano} className="bar-row">
                <span className="bar-label">{ano}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${
                        (qt / Math.max(...Object.values(stats.porAno))) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="bar-value">{qt}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
