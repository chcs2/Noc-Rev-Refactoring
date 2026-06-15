import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { load, save } from '../utils/storage.js'

/**
 * AuthContext — gerencia Autenticação e Perfil (req. 3.1.1).
 *
 * Esta é uma implementação MOCK voltada ao protótipo: não há servidor.
 * O estado de "usuários cadastrados" e "usuário atual" mora em localStorage.
 * Em produção, este módulo seria substituído por chamadas a um backend.
 *
 * Estados possíveis (conforme documento de visão):
 *  - Deslogado            (currentUser === null)
 *  - Autenticado          (currentUser !== null)
 *  - Perfil Público       (currentUser.privacidade === 'publico')
 *  - Perfil Privado       (currentUser.privacidade === 'privado')
 *  - Conta Suspensa       (currentUser.suspenso === true)
 */

const AuthContext = createContext(null)

const USERS_KEY = 'auth.users'
const CURRENT_KEY = 'auth.currentUserId'

// Usuários "demo" semeados para que as funcionalidades sociais (req. 3.1.4)
// tenham com quem interagir desde o primeiro acesso.
const USUARIOS_DEMO = [
  {
    id: 'u_maria',
    username: 'maria',
    displayName: 'Maria Helena',
    bio: 'Cinéfila com fraqueza por noir e thrillers psicológicos.',
    photoUrl: '',
    privacidade: 'publico',
    suspenso: false,
    criadoEm: 1714521600000, // 1 maio 2024
  },
  {
    id: 'u_joao',
    username: 'joao',
    displayName: 'João Pedro',
    bio: 'Maratonando séries dos anos 2000.',
    photoUrl: '',
    privacidade: 'publico',
    suspenso: false,
    criadoEm: 1717200000000,
  },
  {
    id: 'u_ana',
    username: 'ana',
    displayName: 'Ana Lívia',
    bio: 'Listas mistas são minha paixão.',
    photoUrl: '',
    privacidade: 'privado',
    suspenso: false,
    criadoEm: 1719792000000,
  },
]

function semearUsuarios() {
  const existentes = load(USERS_KEY, null)
  if (existentes && Object.keys(existentes).length > 0) return existentes
  const mapa = {}
  for (const u of USUARIOS_DEMO) mapa[u.id] = u
  save(USERS_KEY, mapa)
  return mapa
}

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState(() => semearUsuarios())
  const [currentUserId, setCurrentUserId] = useState(() =>
    load(CURRENT_KEY, null),
  )

  useEffect(() => save(USERS_KEY, usuarios), [usuarios])
  useEffect(() => save(CURRENT_KEY, currentUserId), [currentUserId])

  const api = useMemo(() => {
    const usuarioAtual = currentUserId ? usuarios[currentUserId] || null : null

    function cadastrar({ username, displayName, bio = '', privacidade = 'publico' }) {
      const limpo = (username || '').trim().toLowerCase()
      if (!limpo) throw new Error('Nome de usuário obrigatório.')
      const conflito = Object.values(usuarios).some(
        (u) => u.username.toLowerCase() === limpo,
      )
      if (conflito) throw new Error('Esse nome de usuário já existe.')
      const novo = {
        id: 'u_' + Math.random().toString(36).slice(2, 10),
        username: limpo,
        displayName: (displayName || '').trim() || limpo,
        bio,
        photoUrl: '',
        privacidade,
        suspenso: false,
        criadoEm: Date.now(),
      }
      setUsuarios((prev) => ({ ...prev, [novo.id]: novo }))
      setCurrentUserId(novo.id)
      return novo
    }

    function login(username) {
      const limpo = (username || '').trim().toLowerCase()
      const u = Object.values(usuarios).find(
        (x) => x.username.toLowerCase() === limpo,
      )
      if (!u) throw new Error('Usuário não encontrado.')
      if (u.suspenso) throw new Error('Conta suspensa.')
      setCurrentUserId(u.id)
      return u
    }

    function logout() {
      setCurrentUserId(null)
    }

    function atualizarPerfil(patch) {
      if (!usuarioAtual) return
      setUsuarios((prev) => ({
        ...prev,
        [usuarioAtual.id]: { ...usuarioAtual, ...patch },
      }))
    }

    function alternarPrivacidade() {
      if (!usuarioAtual) return
      const nova = usuarioAtual.privacidade === 'publico' ? 'privado' : 'publico'
      atualizarPerfil({ privacidade: nova })
    }

    function listarTodosUsuarios() {
      return Object.values(usuarios)
    }

    function buscarUsuarios(termo) {
      const t = (termo || '').toLowerCase()
      if (!t) return listarTodosUsuarios()
      return listarTodosUsuarios().filter(
        (u) =>
          u.username.toLowerCase().includes(t) ||
          (u.displayName || '').toLowerCase().includes(t),
      )
    }

    function obterUsuario(id) {
      return usuarios[id] || null
    }

    return {
      usuarioAtual,
      autenticado: Boolean(usuarioAtual),
      cadastrar,
      login,
      logout,
      atualizarPerfil,
      alternarPrivacidade,
      listarTodosUsuarios,
      buscarUsuarios,
      obterUsuario,
    }
  }, [usuarios, currentUserId])

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return ctx
}
