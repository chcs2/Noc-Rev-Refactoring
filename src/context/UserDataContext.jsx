import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { load, save, userScoped } from '../utils/storage.js'
import { useAuth } from './AuthContext.jsx'
import { obraDeIndice } from '../domain/factory.js'

/**
 * IMPLEMENTAÇÃO DO PADRÃO COMPORTAMENTAL OBSERVER
 * Cria um Subject (Gerenciador de Eventos) centralizado para que outros 
 * sistemas fiquem sabendo de ações do usuário sem gerar acoplamento rígido.
 */
class EventNotifier {
  constructor() {
    this.observers = {}
  }

  inscrever(evento, callback) {
    if (!this.observers[evento]) this.observers[evento] = []
    this.observers[evento].push(callback)
  }

  // Método adicionado para evitar travamentos quando componentes são fechados
  desinscrever(evento, callback) {
    if (!this.observers[evento]) return
    this.observers[evento] = this.observers[evento].filter(cb => cb !== callback)
  }

  notificar(evento, dados) {
    if (!this.observers[evento]) return
    this.observers[evento].forEach(callback => callback(dados))
  }
}

export const appEvents = new EventNotifier()

const UserDataContext = createContext(null)

function loadUser(userId, key, fallback) {
  return load(userScoped(userId, key), fallback)
}
function saveUser(userId, key, value) {
  save(userScoped(userId, key), value)
}

export function UserDataProvider({ children }) {
  const { usuarioAtual } = useAuth()
  const userId = usuarioAtual?.id || null

  // 🛡️ CORREÇÃO: O estado inicial do index agora começa vazio
  // e se adapta dinamicamente ao usuário logado.
  const [obraIndex, setObraIndex] = useState({})
  const [dataVersion, setDataVersion] = useState(0)

  const [diary, setDiary] = useState([])
  const [lists, setLists] = useState([])
  const [watchlist, setWatchlist] = useState({})
  const [watchedEpisodes, setWatchedEpisodes] = useState({})
  const [follows, setFollows] = useState([])
  const [reviewLikes, setReviewLikes] = useState({})
  const [listComments, setListComments] = useState({})

  useEffect(() => {
    if (!userId) {
      setObraIndex({})
      setDiary([])
      setLists([])
      setWatchlist({})
      setWatchedEpisodes({})
      setFollows([])
      setReviewLikes({})
      setListComments({})
      return
    }
    setObraIndex(loadUser(userId, 'obraIndex', {}))
    setDiary(loadUser(userId, 'diary', []))
    setLists(loadUser(userId, 'lists', []))
    setWatchlist(loadUser(userId, 'watchlist', {}))
    setWatchedEpisodes(loadUser(userId, 'watchedEpisodes', {}))
    setFollows(loadUser(userId, 'follows', []))
    setReviewLikes(loadUser(userId, 'reviewLikes', {}))
    setListComments(loadUser(userId, 'listComments', {}))
  }, [userId])

  useEffect(() => { if (userId) saveUser(userId, 'obraIndex', obraIndex) }, [userId, obraIndex])
  useEffect(() => { if (userId) saveUser(userId, 'diary', diary) }, [userId, diary])
  useEffect(() => { if (userId) saveUser(userId, 'lists', lists) }, [userId, lists])
  useEffect(() => { if (userId) saveUser(userId, 'watchlist', watchlist) }, [userId, watchlist])
  useEffect(() => { if (userId) saveUser(userId, 'watchedEpisodes', watchedEpisodes) }, [userId, watchedEpisodes])
  useEffect(() => { if (userId) saveUser(userId, 'follows', follows) }, [userId, follows])
  useEffect(() => { if (userId) saveUser(userId, 'reviewLikes', reviewLikes) }, [userId, reviewLikes])
  useEffect(() => { if (userId) saveUser(userId, 'listComments', listComments) }, [userId, listComments])

  /* Índice de Obras */
  const registrarObraNoIndice = useCallback((obra) => {
    if (!obra) return
    const chave = obra.getIdentificadorUnico()
    setObraIndex((prev) => ({ ...prev, [chave]: obra.paraIndice() }))
  }, [])

  // 🌍 BUSCA GLOBAL DE OBRAS: Procura no índice local, se não achar, varre outros usuários
  const obterObraDoIndice = useCallback(
    (chave) => {
      // 1. Tenta achar no índice do usuário logado (rápido)
      if (obraIndex[chave]) {
        return obraDeIndice(obraIndex[chave])
      }

      // 2. Se não achar, procura nos índices dos outros usuários (Busca Global)
      const usuarios = load('auth.users', {})
      
      for (const id of Object.keys(usuarios)) {
        if (id === userId) continue // Pula o atual pois já checamos
        
        const indexDeOutro = loadUser(id, 'obraIndex', {})
        if (indexDeOutro[chave]) {
          return obraDeIndice(indexDeOutro[chave]) // Achou no banco de outro usuário!
        }
      }

      // 3. Se realmente ninguém tem essa obra, retorna null
      return null
    },
    [obraIndex, userId],
  )


  // IMPLEMENTAÇÃO PRÁTICA DO PADRÃO PROTOTYPE 
  
  const duplicarObraPersonalizada = useCallback((obraOriginal, novoTitulo) => {
    if (!obraOriginal || typeof obraOriginal.clone !== 'function') {
      throw new Error('A obra fornecida não suporta o padrão Prototype (método clone não encontrado).')
    }

    // 1. O Prototype em ação: clonamos a obra inteira sem nos acoplarmos à sua classe concreta.
    const obraClonada = obraOriginal.clone()
    
    // 2. Alteramos apenas as propriedades exclusivas do clone
    obraClonada.id = obraClonada.id + '_custom_' + Math.random().toString(36).slice(2, 8)
    if (novoTitulo) {
      obraClonada.titulo = novoTitulo
    }

    // 3. Salvamos a nova variante no nosso banco de dados local
    registrarObraNoIndice(obraClonada)
    
    // Disparamos o Observer para avisar a interface visual
    appEvents.notificar('OBRA_CLONADA', { original: obraOriginal.titulo, clone: obraClonada.titulo })

    return obraClonada
  }, [registrarObraNoIndice])

  /* Diário / Avaliações */
  const registrarLog = useCallback(
    (obra, { dataVisualizacao, nota = 0, resenha = '', curtido = false, baseadoEmId = null }) => {
      if (!userId) throw new Error('Faça login para registrar no diário.')
      registrarObraNoIndice(obra)
      
      const entry = {
        id: 'l_' + Math.random().toString(36).slice(2, 10),
        obraIdUnique: obra.getIdentificadorUnico(),
        dataVisualizacao: dataVisualizacao || new Date().toISOString().slice(0, 10),
        nota,
        resenha,
        curtido,
        baseadoEmId, 
        criadoEm: Date.now(),
      }
      
      setDiary((prev) => [entry, ...prev])
      
      if (obra.getTipo() === 'Episódio') {
        setWatchedEpisodes((prev) => ({
          ...prev,
          [entry.obraIdUnique]: Date.now(),
        }))
      }

      // 🚀 OBSERVER
      appEvents.notificar('NOVO_LOG_DIARIO', { userId, entry, obra })
      
      return entry
    },
    [userId, registrarObraNoIndice],
  )

  const editarLog = useCallback((entryId, patch) => {
    setDiary((prev) => prev.map((e) => (e.id === entryId ? { ...e, ...patch } : e)))
  }, [])

  const excluirLog = useCallback((entryId) => {
    setDiary((prev) => prev.filter((e) => e.id !== entryId))
  }, [])

  const listarDiarioDoUsuario = useCallback(
    (alvoId) => {
      const id = alvoId || userId
      if (!id) return []
      return id === userId ? diary : loadUser(id, 'diary', [])
    },
    [userId, diary, dataVersion], 
  )

  /* Listas */
  const criarLista = useCallback(
    ({ nome, descricao = '', visibilidade = 'publica', itens = [] }) => {
      if (!userId) throw new Error('Faça login para criar listas.')
      
      const lista = { 
        id: 'lst_' + Math.random().toString(36).slice(2, 10), 
        nome, 
        descricao, 
        visibilidade, 
        itens: [...itens], // Clone do array para evitar referências mutáveis
        criadoEm: Date.now(), 
        atualizadoEm: Date.now() 
      }
      
      setLists((prev) => [lista, ...prev])
      return lista
    },
    [userId],
  )

  const atualizarLista = useCallback((listId, patch) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, ...patch, atualizadoEm: Date.now() } : l)))
  }, [])

  const excluirLista = useCallback((listId) => {
    setLists((prev) => prev.filter((l) => l.id !== listId))
  }, [])

  const adicionarItemNaLista = useCallback(
    (listId, obra) => {
      registrarObraNoIndice(obra)
      const chave = obra.getIdentificadorUnico()
      setLists((prev) =>
        prev.map((l) => {
          if (l.id !== listId) return l
          if (l.itens.includes(chave)) return l
          return { ...l, itens: [...l.itens, chave], atualizadoEm: Date.now() }
        }),
      )
    },
    [registrarObraNoIndice],
  )

  const removerItemDaLista = useCallback((listId, chave) => {
    setLists((prev) => prev.map((l) => l.id === listId ? { ...l, itens: l.itens.filter((k) => k !== chave), atualizadoEm: Date.now() } : l))
  }, [])

  const reordenarLista = useCallback((listId, novaOrdem) => {
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, itens: novaOrdem, atualizadoEm: Date.now() } : l)))
  }, [])

  const listarListasDoUsuario = useCallback(
    (alvoId) => {
      const id = alvoId || userId
      if (!id) return []
      return id === userId ? lists : loadUser(id, 'lists', [])
    },
    [userId, lists, dataVersion], 
  )

  /* Watchlist */
  const estaNaWatchlist = useCallback(
    (obra) => Boolean(watchlist[obra.getIdentificadorUnico()]),
    [watchlist],
  )

  const alternarWatchlist = useCallback(
    (obra) => {
      registrarObraNoIndice(obra)
      const chave = obra.getIdentificadorUnico()
      
      setWatchlist((prev) => {
        const next = { ...prev }
        const jaEstavaNaWatchlist = Boolean(next[chave])
        
        if (jaEstavaNaWatchlist) {
          delete next[chave]
        } else {
          next[chave] = { adicionadoEm: Date.now() }
        }

        // 🚀 OBSERVER - Notificamos o sistema de forma assíncrona para não travar o fluxo de renderização
        setTimeout(() => {
          appEvents.notificar('WATCHLIST_ALTERADA', { 
            obra: obra, 
            adicionado: !jaEstavaNaWatchlist 
          })
        }, 0)

        return next
      })
    },
    [registrarObraNoIndice],
  )

  /* Progressos (Composite integrado) */
  const episodioVisto = useCallback(
    (episodio) => {
      if (episodio.isVisto()) return true
      return Boolean(watchedEpisodes[episodio.getIdentificadorUnico()])
    },
    [watchedEpisodes],
  )

  const alternarEpisodioVisto = useCallback(
    (episodio) => {
      const chave = episodio.getIdentificadorUnico()
      const estavaVisto = episodio.isVisto() || Boolean(watchedEpisodes[chave])
      
      episodio.setVisto(!estavaVisto)
      registrarObraNoIndice(episodio)
      
      setWatchedEpisodes((prev) => {
        const next = { ...prev }
        if (estavaVisto) delete next[chave]
        else next[chave] = Date.now()
        return next
      })

      // 🚀 OBSERVER
      appEvents.notificar('EPISODIO_STATUS_ALTERADO', { userId, episodio, visto: !estavaVisto })
    },
    [watchedEpisodes, registrarObraNoIndice, userId],
  )

  const contarEpisodiosVistosDaSerie = useCallback(
    (serieId) => {
      const prefixo = `episodio:${serieId}:`
      return Object.keys(watchedEpisodes).filter((k) => k.startsWith(prefixo)).length
    },
    [watchedEpisodes],
  )

  const marcarSerieInteiraVista = useCallback(
    (serieArvore) => {
      serieArvore.setVisto(true)

      const salvarRecursivo = (obra) => {
        registrarObraNoIndice(obra)
        if (typeof obra.getFilhos === 'function') {
          obra.getFilhos().forEach(salvarRecursivo)
        }
      }
      salvarRecursivo(serieArvore)

      setWatchedEpisodes((prev) => {
        const novos = { ...prev }
        const preencherIds = (obra) => {
          if (obra.getTipo() === 'Episódio') {
            novos[obra.getIdentificadorUnico()] = Date.now()
          }
          if (typeof obra.getFilhos === 'function') {
            obra.getFilhos().forEach(preencherIds)
          }
        }
        preencherIds(serieArvore)
        return novos
      })

      // 🚀 OBSERVER
      appEvents.notificar('SERIE_COMPLETA_VISTA', { userId, serieId: serieArvore.id })
    },
    [registrarObraNoIndice, userId],
  )

  /* Social */
  const seguir = useCallback(
    (alvoId) => {
      if (!userId || alvoId === userId) return
      setFollows((prev) => (prev.includes(alvoId) ? prev : [...prev, alvoId]))
    },
    [userId],
  )

  const deixarDeSeguir = useCallback((alvoId) => {
    setFollows((prev) => prev.filter((u) => u !== alvoId))
  }, [])

  const estaSeguindo = useCallback((alvoId) => follows.includes(alvoId), [follows])

  const curtirReview = useCallback(
    (autorId, entryId) => {
      if (!userId) return
      const chave = `${autorId}/${entryId}`
      setReviewLikes((prev) => {
        const next = { ...prev }
        if (next[chave]) delete next[chave]
        else next[chave] = true
        return next
      })
    },
    [userId],
  )

  const reviewCurtido = useCallback(
    (autorId, entryId) => Boolean(reviewLikes[`${autorId}/${entryId}`]),
    [reviewLikes],
  )

  const contarLikesReview = useCallback(
    (autorId, entryId) => {
      const usuarios = load('auth.users', {})
      let total = 0
      const chave = `${autorId}/${entryId}`
      for (const id of Object.keys(usuarios)) {
        const dados = id === userId ? reviewLikes : loadUser(id, 'reviewLikes', {})
        if (dados[chave]) total++
      }
      return total
    },
    [userId, reviewLikes, dataVersion], 
  )

  const comentarEmLista = useCallback(
    (listAuthorId, listId, texto) => {
      if (!userId) throw new Error('Faça login para comentar.')
      const chave = `${listAuthorId}/${listId}`
      const comentario = { id: 'c_' + Math.random().toString(36).slice(2, 10), autorId: userId, texto, criadoEm: Date.now() }
      setListComments((prev) => ({ ...prev, [chave]: [...(prev[chave] || []), comentario] }))
      setDataVersion((v) => v + 1)
    },
    [userId],
  )

  const editarComentarioLista = useCallback(
    (listAuthorId, listId, comentarioId, novoTexto) => {
      const chave = `${listAuthorId}/${listId}`
      setListComments((prev) => ({
        ...prev,
        [chave]: (prev[chave] || []).map((c) => c.id === comentarioId ? { ...c, texto: novoTexto, editadoEm: Date.now() } : c),
      }))
    },
    [],
  )

  const excluirComentarioLista = useCallback(
    (listAuthorId, listId, comentarioId) => {
      const chave = `${listAuthorId}/${listId}`
      setListComments((prev) => ({ ...prev, [chave]: (prev[chave] || []).filter((c) => c.id !== comentarioId) }))
    },
    [],
  )

  const listarComentariosDeLista = useCallback(
    (listAuthorId, listId) => {
      const chave = `${listAuthorId}/${listId}`
      const usuarios = load('auth.users', {})
      const acumulador = []
      for (const id of Object.keys(usuarios)) {
        const dados = id === userId ? listComments : loadUser(id, 'listComments', {})
        for (const c of dados[chave] || []) acumulador.push(c)
      }
      acumulador.sort((a, b) => a.criadoEm - b.criadoEm)
      return acumulador
    },
    [userId, listComments, dataVersion], 
  )

  const recarregarDadosCruzados = useCallback(() => setDataVersion((v) => v + 1), [])

  const api = useMemo(
    () => ({
      diary, lists, watchlist, watchedEpisodes, follows, obraIndex,
      registrarObraNoIndice, obterObraDoIndice, duplicarObraPersonalizada, // 👈 INSERIDO AQUI
      registrarLog, editarLog, excluirLog, listarDiarioDoUsuario,
      criarLista, atualizarLista, excluirLista, adicionarItemNaLista, removerItemDaLista, reordenarLista, listarListasDoUsuario,
      estaNaWatchlist, alternarWatchlist,
      episodioVisto, alternarEpisodioVisto, contarEpisodiosVistosDaSerie, marcarSerieInteiraVista,
      seguir, deixarDeSeguir, estaSeguindo, curtirReview, reviewCurtido, contarLikesReview,
      comentarEmLista, editarComentarioLista, excluirComentarioLista, listarComentariosDeLista,
      recarregarDadosCruzados,
    }),
    [
      diary, lists, watchlist, watchedEpisodes, follows, obraIndex,
      registrarObraNoIndice, obterObraDoIndice, duplicarObraPersonalizada, // 👈 INSERIDO AQUI
      registrarLog, editarLog, excluirLog, listarDiarioDoUsuario,
      criarLista, atualizarLista, excluirLista, adicionarItemNaLista, removerItemDaLista, reordenarLista, listarListasDoUsuario,
      estaNaWatchlist, alternarWatchlist,
      episodioVisto, alternarEpisodioVisto, contarEpisodiosVistosDaSerie, marcarSerieInteiraVista,
      seguir, deixarDeSeguir, estaSeguindo, curtirReview, reviewCurtido, contarLikesReview,
      comentarEmLista, editarComentarioLista, excluirComentarioLista, listarComentariosDeLista,
      recarregarDadosCruzados,
    ],
  )

  return <UserDataContext.Provider value={api}>{children}</UserDataContext.Provider>
}

export function useUserData() {
  const ctx = useContext(UserDataContext)
  if (!ctx) throw new Error('useUserData precisa de UserDataProvider')
  return ctx
}