/**
 * FiltrosHibridos — UI dos Filtros Híbridos de Busca (req. 3.2.3).
 * Permite combinar tipos de mídia + intervalo de notas (slider).
 */

const TIPOS = [
  { id: 'Filme', label: 'Filmes' },
  { id: 'Série', label: 'Séries' },
  { id: 'Minissérie', label: 'Minisséries' },
  { id: 'Documentário', label: 'Documentários' },
  { id: 'Episódio', label: 'Episódios' },
]

export default function FiltrosHibridos({
  tiposSelecionados,
  setTiposSelecionados,
  notaMin,
  setNotaMin,
  onLimpar,
}) {
  function toggle(tipo) {
    setTiposSelecionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
    )
  }

  return (
    <div className="filtros-hibridos">
      <div className="filtros-secao">
        <span className="filtros-label">Tipos de mídia</span>
        <div className="checkbox-row">
          {TIPOS.map((t) => (
            <label key={t.id} className="checkbox">
              <input
                type="checkbox"
                checked={tiposSelecionados.includes(t.id)}
                onChange={() => toggle(t.id)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>
      <div className="filtros-secao">
        <span className="filtros-label">
          Nota mínima: {notaMin === 0 ? 'Qualquer' : `${notaMin} estrelas`}
        </span>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={notaMin}
          onChange={(e) => setNotaMin(Number(e.target.value))}
        />
      </div>
      <button type="button" className="btn" onClick={onLimpar}>
        Limpar filtros
      </button>
    </div>
  )
}

export const TIPOS_DISPONIVEIS = TIPOS
