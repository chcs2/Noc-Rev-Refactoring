import { useMemo } from 'react'
import { useUserData } from '../context/UserDataContext.jsx'
import ObraCard from '../components/ObraCard.jsx'

/**
 * Watchlist — lista especial "Para Assistir" do usuário (atalho do diário).
 * É um caso simplificado de lista pessoal, separado de "Listas" para
 * acesso rápido inspirado no Letterboxd.
 */
export default function Watchlist() {
  const { watchlist, obterObraDoIndice, alternarWatchlist } = useUserData()

  const itens = useMemo(() => {
    return Object.entries(watchlist)
      .map(([chave, meta]) => ({
        chave,
        obra: obterObraDoIndice(chave),
        adicionadoEm: meta.adicionadoEm,
      }))
      .filter((x) => x.obra)
      .sort((a, b) => b.adicionadoEm - a.adicionadoEm)
  }, [watchlist, obterObraDoIndice])

  return (
    <div>
      <h1 className="page-title">Watchlist</h1>
      {itens.length === 0 ? (
        <div className="empty-state">
          Sua watchlist está vazia. Encontre uma obra e clique em “+ Watchlist”.
        </div>
      ) : (
        <div className="grid">
          {itens.map(({ chave, obra }) => (
            <div key={chave} className="lista-item-wrap">
              <ObraCard obra={obra} />
              <button className="btn" onClick={() => alternarWatchlist(obra)}>
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
