import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'

import Home from './pages/Home.jsx'
import Browse from './pages/Browse.jsx'
import FilmeDetail from './pages/FilmeDetail.jsx'
import SerieDetail from './pages/SerieDetail.jsx'
import EpisodioDetail from './pages/EpisodioDetail.jsx'

import Login from './pages/Login.jsx'
import Cadastro from './pages/Cadastro.jsx'
import Perfil from './pages/Perfil.jsx'
import UsuarioPerfil from './pages/UsuarioPerfil.jsx'
import Usuarios from './pages/Usuarios.jsx'

import Diario from './pages/Diario.jsx'
import Listas from './pages/Listas.jsx'
import ListaDetalhe from './pages/ListaDetalhe.jsx'
import Watchlist from './pages/Watchlist.jsx'
import Estatisticas from './pages/Estatisticas.jsx'

function Protegida({ children }) {
  const { autenticado } = useAuth()
  if (!autenticado) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buscar" element={<Browse />} />

          <Route path="/filme/:id" element={<FilmeDetail />} />
          <Route path="/serie/:id" element={<SerieDetail />} />
          <Route
            path="/serie/:id/temporada/:seasonNumber/episodio/:episodeNumber"
            element={<EpisodioDetail />}
          />

          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/usuario/:userId" element={<UsuarioPerfil />} />
          <Route
            path="/perfil"
            element={
              <Protegida>
                <Perfil />
              </Protegida>
            }
          />

          <Route
            path="/diario"
            element={
              <Protegida>
                <Diario />
              </Protegida>
            }
          />
          <Route
            path="/listas"
            element={
              <Protegida>
                <Listas />
              </Protegida>
            }
          />
          <Route path="/listas/:autorId/:listId" element={<ListaDetalhe />} />
          <Route
            path="/watchlist"
            element={
              <Protegida>
                <Watchlist />
              </Protegida>
            }
          />
          <Route
            path="/estatisticas"
            element={
              <Protegida>
                <Estatisticas />
              </Protegida>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <span>
          NocRev · Dados de{' '}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
            TMDB
          </a>
          . Este produto usa a API do TMDB mas não é endossado por eles.
        </span>
      </footer>
    </div>
  )
}
