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

  const [obraIndex, setObraIndex] = useState(() => load('obraIndex', {}))
  const [dataVersion, setDataVersion] = useState(0)

  const [diary, setDiary] = useState([])
  const [lists, setLists] = useState([])
  const [watchlist, setWatchlist] = useState({})
  const [watchedEpisodes, setWatchedEpisodes] = useState({})
  const [follows, setFollows] = useState([])
  const [reviewLikes, setReviewLikes] = useState({})
  const [listComments, setListComments] = useState({})

  useEffect(() => save('obraIndex', obraIndex), [obraIndex])

  useEffect(() => {
    if (!userId) {
      setDiary([])
      setLists([])
      setWatchlist({})
      setWatchedEpisodes({})
      setFollows([])
      setReviewLikes({})
      setListComments({})
      return
    }
    setDiary(loadUser(userId, 'diary', []))
    setLists(loadUser(userId, 'lists', []))
    setWatchlist(loadUser(userId, 'watchlist', {}))
    setWatchedEpisodes(loadUser(userId, 'watchedEpisodes', {}))
    setFollows(loadUser(userId, 'follows', []))
    setReviewLikes(loadUser(userId, 'reviewLikes', {}))
    setListComments(loadUser(userId, 'listComments', {}))
  }, [userId])

  useEffect(() => { if (userId) saveUser(userId, 'diary', diary) }, [userId, diary])
  useEffect(() => { if (userId) saveUser(userId, 'lists', lists) }, [userId, lists])
  useEffect(() => { if (userId) saveUser(userId, 'watchlist', watchlist) }, [userId, watchlist])
  useEffect(() => { if (userId) saveUser(userId, 'watchedEpisodes', watchedEpisodes) }, [userId, watchedEpisodes])
  useEffect(() => { if (userId) saveUser(userId, 'follows', follows) }, [userId, follows])
  useEffect(() => { if (userId) saveUser(userId, 'reviewLikes', reviewLikes) }, [userId, reviewLikes])
  useEffect(() => { if (userId) saveUser(userId, 'listComments', listComments) }, [userId, listComments])

  /* Índice de Obras (Modelagem Universal) */
  const registrarObraNoIndice = useCallback((obra) => {
    if (!obra) return
    const chave = obra.getIdentificadorUnico()
    setObraIndex((prev) => ({ ...prev, [chave]: obra.paraIndice() }))
  }, [])

  const obterObraDoIndice = useCallback(
    (chave) => obraDeIndice(obraIndex[chave]),
    [obraIndex],
  )

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
      
      // ✨ CORREÇÃO: itens agora é recebido por parâmetro e clonado [...itens]
      const lista = { 
        id: 'lst_' + Math.random().toString(36).slice(2, 10), 
        nome, 
        descricao, 
        visibilidade, 
        itens: [...itens], 
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
        if (next[chave]) delete next[chave]
        else next[chave] = { adicionadoEm: Date.now() }
        return next
      })
    },
    [registrarObraNoIndice],
  )

  // INTEGRAÇÃO COM O PADRÃO COMPOSITE (Progresso Flexível)
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
    },
    [watchedEpisodes, registrarObraNoIndice],
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
    },
    [registrarObraNoIndice],
  )

  // Social
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
      registrarObraNoIndice, obterObraDoIndice,
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
      registrarObraNoIndice, obterObraDoIndice,
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