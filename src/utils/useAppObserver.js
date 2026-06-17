import { useEffect } from 'react'

// Ajuste o caminho abaixo se o seu UserDataContext estiver em outra pasta
import { appEvents } from '../context/UserDataContext.jsx' 

/**
 * Hook customizado para escutar eventos globais do sistema (Observer).
 * 
 * @param {string} evento - Nome do evento (ex: 'NOVO_LOG_DIARIO', 'EPISODIO_STATUS_ALTERADO')
 * @param {function} callback - Função que será executada quando o evento acontecer
 */
export function useAppObserver(evento, callback) {
  useEffect(() => {
    // 1. Quando o componente é renderizado na tela, ele se INSCREVE para ouvir o evento
    appEvents.inscrever(evento, callback)

    // 2. Quando o componente sai da tela (desmonta), ele se DESINSCREVE automaticamente
    // Isso evita vazamento de memória (memory leak) e travamentos
    return () => {
      appEvents.desinscrever(evento, callback)
    }
  }, [evento, callback])
}