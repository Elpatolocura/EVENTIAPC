import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Inicio from './pages/Inicio'
import Favoritos from './pages/Favoritos'
import CrearEvento from './pages/CrearEvento'
import Chat from './pages/Chat'
import ChatIA from './pages/ChatIA'
import MisEntradas from './pages/MisEntradas'
import MisEventos from './pages/MisEventos'
import Notificaciones from './pages/Notificaciones'
import Perfil from './pages/Perfil'
import Configuracion from './pages/Configuracion'
import EditarPerfil from './pages/EditarPerfil'
import Idioma from './pages/Idioma'
import Personalizar from './pages/Personalizar'
import CambiarContrasena from './pages/CambiarContrasena'
import CentroAyuda from './pages/CentroAyuda'
import PoliticasPrivacidad from './pages/PoliticasPrivacidad'
import Comentarios from './pages/Comentarios'
import DetalleEvento from './pages/DetalleEvento'
import Premium from './pages/Premium'
import AdministrarSuscripcion from './pages/AdministrarSuscripcion'
import Balance from './pages/Balance'
import Login from './pages/Login'
import CrearCuenta from './pages/CrearCuenta'
import RecuperarClave from './pages/RecuperarClave'

function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const authRoutes = ['/login', '/crear-cuenta', '/recuperar-clave']
  const isAuthRoute = authRoutes.includes(location.pathname)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!user && !isAuthRoute) return <Navigate to="/login" replace />
  if (user && isAuthRoute) return <Navigate to="/" replace />

  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/crear-cuenta" element={<CrearCuenta />} />
        <Route path="/recuperar-clave" element={<RecuperarClave />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/crear-evento" element={<CrearEvento />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:eventId" element={<Chat />} />
          <Route path="/chat-ia" element={<ChatIA />} />
          <Route path="/mis-entradas" element={<MisEntradas />} />
          <Route path="/mis-eventos" element={<MisEventos />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/:id" element={<Perfil />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/configuracion/editar-perfil" element={<EditarPerfil />} />
          <Route path="/configuracion/idioma" element={<Idioma />} />
          <Route path="/configuracion/personalizar" element={<Personalizar />} />
          <Route path="/configuracion/cambiar-contrasena" element={<CambiarContrasena />} />
          <Route path="/configuracion/centro-ayuda" element={<CentroAyuda />} />
          <Route path="/configuracion/politicas-privacidad" element={<PoliticasPrivacidad />} />
          <Route path="/configuracion/comentarios" element={<Comentarios />} />
          <Route path="/evento/:id" element={<DetalleEvento />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/configuracion/suscripcion" element={<AdministrarSuscripcion />} />
          <Route path="/balance" element={<Balance />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
