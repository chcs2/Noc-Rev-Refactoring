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
 * UserDataContext — coração da camada de dados do NocRev.
 *
 * Concentra os dados de todos os usuários (mock, em localStorage) e expõe
 * uma API uniforme para as funcionalidades:
 *  - Sistema de Avaliação e Diário (req. 3.1.2)
 *  - Criação de Listas (req. 3.1.3)
 *  - Interação Social: seguir, curtir reviews, comentar em listas (req. 3.1.4)
 *  - Sistema de Progresso Flexível (req. 3.2.2)
 *  - Listas Mistas (req. 3.2.4)
 *  - Suporte aos cálculos de Estatísticas (req. 3.2.5) e Streaks (req. 3.2.6)
 *
 * Particionamento dos dados:
 *  - Cada usuário tem o seu próprio diário, listas, follows, review-likes,
 *    list-comments, watchlist, episódios vistos.
 *  - Existe um índice GLOBAL de obras (`obraIndex`) com todos os metadados
 *    serializados, para reconstruir as instâncias polimórficas de Obra.
 */

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

  // IMPORTANTE: nunca retorne valores não-undefined dessas effects.
  // Um arrow `() => userId && saveUser(...)` retorna `null` quando userId é null,
  // e o React 18 tenta chamar esse `null` como função de cleanup e quebra.
  useEffect(() => {
    if (userId) saveUser(userId, 'diary', diary)
  }, [userId, diary])
  useEffect(() => {
    if (userId) saveUser(userId, 'lists', lists)
  }, [userId, lists])
  useEffect(() => {
    if (userId) saveUser(userId, 'watchlist', watchlist)
  }, [userId, watchlist])
  useEffect(() => {
    if (userId) saveUser(userId, 'watchedEpisodes', watchedEpisodes)
  }, [userId, watchedEpisodes])
  useEffect(() => {
    if (userId) saveUser(userId, 'follows', follows)
  }, [userId, follows])
  useEffect(() => {
    if (userId) saveUser(userId, 'reviewLikes', reviewLikes)
  }, [userId, reviewLikes])
  useEffect(() => {
    if (userId) saveUser(userId, 'listComments', listComments)
  }, [userId, listComments])

  /* Índice de Obras (Modelagem Universal — req. 3.2.1) */
  const registrarObraNoIndice = useCallback((obra) => {
    if (!obra) return
    const chave = obra.getIdentificadorUnico()
    setObraIndex((prev) => ({ ...prev, [chave]: obra.paraIndice() }))
  }, [])

  const obterObraDoIndice = useCallback(
    (chave) => obraDeIndice(obraIndex[chave]),
    [obraIndex],
  )

  /* Diário / Avaliações (req. 3.1.2) */
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
        // 🧬 Rastreio do Padrão Prototype: Guarda o ID do log original caso seja uma nova revisão
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
    [userId, diary, dataVersion], // eslint-disable-line react-hooks/exhaustive-deps
  )

  /* Listas (req. 3.1.3 + 3.2.4 Listas Mistas) */
  const criarLista = useCallback(
    ({ nome, descricao = '', visibilidade = 'publica' }) => {
      if (!userId) throw new Error('Faça login para criar listas.')
      const lista = {
        id: 'lst_' + Math.random().toString(36).slice(2, 10),
        nome,
        descricao,
        visibilidade,
        itens: [],
        criadoEm: Date.now(),
        atualizadoEm: Date.now(),
      }
      setLists((prev) => [lista, ...prev])
      return lista
    },
    [userId],
  )

  const atualizarLista = useCallback((listId, patch) => {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, ...patch, atualizadoEm: Date.now() } : l)),
    )
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
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, itens: l.itens.filter((k) => k !== chave), atualizadoEm: Date.now() }
          : l,
      ),
    )
  }, [])

  const reordenarLista = useCallback((listId, novaOrdem) => {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, itens: novaOrdem, atualizadoEm: Date.now() } : l)),
    )
  }, [])

  const listarListasDoUsuario = useCallback(
    (alvoId) => {
      const id = alvoId || userId
      if (!id) return []
      return id === userId ? lists : loadUser(id, 'lists', [])
    },
    [userId, lists, dataVersion], // eslint-disable-line react-hooks/exhaustive-deps
  )

  /* Watchlist (lista especial "Para Assistir") */
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

  /* Episódios vistos (Sistema de Progresso Flexível — req. 3.2.2) */
  const episodioVisto = useCallback(
    (episodio) => Boolean(watchedEpisodes[episodio.getIdentificadorUnico()]),
    [watchedEpisodes],
  )

  const alternarEpisodioVisto = useCallback(
    (episodio) => {
      registrarObraNoIndice(episodio)
      const chave = episodio.getIdentificadorUnico()
      setWatchedEpisodes((prev) => {
        const next = { ...prev }
        if (next[chave]) delete next[chave]
        else next[chave] = Date.now()
        return next
      })
    },
    [registrarObraNoIndice],
  )

  const contarEpisodiosVistosDaSerie = useCallback(
    (serieId) => {
      const prefixo = `episodio:${serieId}:`
      return Object.keys(watchedEpisodes).filter((k) => k.startsWith(prefixo)).length
    },
    [watchedEpisodes],
  )

  const marcarSerieInteiraVista = useCallback(
    (todosEpisodios) => {
      setWatchedEpisodes((prev) => {
        const novos = { ...prev }
        for (const ep of todosEpisodios) {
          novos[ep.getIdentificadorUnico()] = Date.now()
          registrarObraNoIndice(ep)
        }
        return novos
      })
    },
    [registrarObraNoIndice],
  )

  /* Social — follows, review-likes, comentários (req. 3.1.4) */
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
    [userId, reviewLikes, dataVersion], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const comentarEmLista = useCallback(
    (listAuthorId, listId, texto) => {
      if (!userId) throw new Error('Faça login para comentar.')
      const chave = `${listAuthorId}/${listId}`
      const comentario = {
        id: 'c_' + Math.random().toString(36).slice(2, 10),
        autorId: userId,
        texto,
        criadoEm: Date.now(),
      }
      setListComments((prev) => ({
        ...prev,
        [chave]: [...(prev[chave] || []), comentario],
      }))
      setDataVersion((v) => v + 1)
    },
    [userId],
  )

  const editarComentarioLista = useCallback(
    (listAuthorId, listId, comentarioId, novoTexto) => {
      const chave = `${listAuthorId}/${listId}`
      setListComments((prev) => ({
        ...prev,
        [chave]: (prev[chave] || []).map((c) =>
          c.id === comentarioId ? { ...c, texto: novoTexto, editadoEm: Date.now() } : c,
        ),
      }))
    },
    [],
  )

  const excluirComentarioLista = useCallback(
    (listAuthorId, listId, comentarioId) => {
      const chave = `${listAuthorId}/${listId}`
      setListComments((prev) => ({
        ...prev,
        [chave]: (prev[chave] || []).filter((c) => c.id !== comentarioId),
      }))
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
    [userId, listComments, dataVersion], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const recarregarDadosCruzados = useCallback(() => setDataVersion((v) => v + 1), [])

  const api = useMemo(
    () => ({
      diary,
      lists,
      watchlist,
      watchedEpisodes,
      follows,
      obraIndex,

      registrarObraNoIndice,
      obterObraDoIndice,

      registrarLog,
      editarLog,
      excluirLog,
      listarDiarioDoUsuario,

      criarLista,
      atualizarLista,
      excluirLista,
      adicionarItemNaLista,
      removerItemDaLista,
      reordenarLista,
      listarListasDoUsuario,

      estaNaWatchlist,
      alternarWatchlist,

      episodioVisto,
      alternarEpisodioVisto,
      contarEpisodiosVistosDaSerie,
      marcarSerieInteiraVista,

      seguir,
      deixarDeSeguir,
      estaSeguindo,
      curtirReview,
      reviewCurtido,
      contarLikesReview,
      comentarEmLista,
      editarComentarioLista,
      excluirComentarioLista,
      listarComentariosDeLista,

      recarregarDadosCruzados,
    }),
    [
      diary, lists, watchlist, watchedEpisodes, follows, obraIndex,
      registrarObraNoIndice, obterObraDoIndice,
      registrarLog, editarLog, excluirLog, listarDiarioDoUsuario,
      criarLista, atualizarLista, excluirLista,
      adicionarItemNaLista, removerItemDaLista, reordenarLista, listarListasDoUsuario,
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