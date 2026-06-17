import { useState, useEffect } from 'react'
import { appEvents } from '../context/UserDataContext.jsx' // 🔌 Conexão direta com a fonte de eventos

export function NotificadorGlobal() {
  const [mensagem, setMensagem] = useState('')
  const [visivel, setVisivel] = useState(false)

  // Função para ativar o balãozinho na tela
  const dispararAlerta = (texto) => {
    setMensagem(texto)
    setVisivel(true)
  }

  // Controla o tempo de exibição (some após 3 segundos)
  useEffect(() => {
    if (visivel) {
      const timer = setTimeout(() => {
        setVisivel(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [visivel])

  // Inscrição direta nos eventos do ciclo de vida do app
  useEffect(() => {
    // 1. Ouvinte para novo diário
    const lidarComNovoLog = (dados) => {
      const titulo = dados.obra?.titulo || dados.obra?.nome || 'Obra'
      dispararAlerta(`🎬 "${titulo}" foi para o seu diário!`)
    }

    // 2. Ouvinte para episódios individuais
    const lidarComEpisodio = (dados) => {
      if (dados.visto) {
        dispararAlerta(`✅ Episódio marcado como visto!`)
      } else {
        dispararAlerta(`❌ Episódio desmarcado.`)
      }
    }

    // 3. Ouvinte para série inteira
    const lidarComSerieCompleta = () => {
      dispararAlerta(`🏆 Série completa marcada como vista!`)
    }

    // 4. Ouvinte para a Watchlist
    const lidarComWatchlist = (dados) => {
      const titulo = dados.obra?.titulo || dados.obra?.nome || 'Obra'
      if (dados.adicionado) {
        dispararAlerta(`🍿 "${titulo}" adicionado à Watchlist!`)
      } else {
        dispararAlerta(`🗑️ "${titulo}" removido da Watchlist.`)
      }
    }

    // Se inscreve nos canais corretos
    appEvents.inscrever('NOVO_LOG_DIARIO', lidarComNovoLog)
    appEvents.inscrever('EPISODIO_STATUS_ALTERADO', lidarComEpisodio)
    appEvents.inscrever('SERIE_COMPLETA_VISTA', lidarComSerieCompleta)
    appEvents.inscrever('WATCHLIST_ALTERADA', lidarComWatchlist) // 👈 Nova inscrição

    // Limpeza obrigatória para evitar vazamento de memória quando o componente desmontar
    return () => {
      appEvents.desinscrever('NOVO_LOG_DIARIO', lidarComNovoLog)
      appEvents.desinscrever('EPISODIO_STATUS_ALTERADO', lidarComEpisodio)
      appEvents.desinscrever('SERIE_COMPLETA_VISTA', lidarComSerieCompleta)
      appEvents.desinscrever('WATCHLIST_ALTERADA', lidarComWatchlist) // 👈 Nova limpeza
    }
  }, [])

  if (!visivel) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      backgroundColor: '#1e1e24', // Cor escura combinando com seu tema
      color: '#ffffff',
      border: '2px solid #6366f1', // Borda roxa idêntica ao seu layout padrão
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      zIndex: 11000, // Fica acima até dos modais normais
      fontWeight: 'bold',
      fontFamily: 'sans-serif',
      fontSize: '0.95rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      {mensagem}
    </div>
  )
}