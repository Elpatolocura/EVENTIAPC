import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import ToastContainer from './components/ToastContainer'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import { PageSkeleton } from './components/Skeletons'
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
import NotificacionesConfig from './pages/NotificacionesConfig'
import DetalleEvento from './pages/DetalleEvento'
import Premium from './pages/Premium'
import AdministrarSuscripcion from './pages/AdministrarSuscripcion'
import Balance from './pages/Balance'
import Login from './pages/Login'
import CrearCuenta from './pages/CrearCuenta'
import RecuperarClave from './pages/RecuperarClave'
import Semilla from './pages/Semilla'

function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const authRoutes = ['/login', '/crear-cuenta', '/recuperar-clave']
  const isAuthRoute = authRoutes.includes(location.pathname)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageSkeleton />
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
    <NotificationProvider>
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <BottomNav />
      <ToastContainer />
      <main className={`flex-1 p-4 md:p-8 transition-all duration-200 w-full md:w-auto pb-20 md:pb-8 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/crear-evento" element={<CrearEvento />} />
          <Route path="/editar-evento/:eventId" element={<CrearEvento />} />
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
          <Route path="/configuracion/notificaciones" element={<NotificacionesConfig />} />
          <Route path="/evento/:id" element={<DetalleEvento />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/configuracion/suscripcion" element={<AdministrarSuscripcion />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/semilla" element={<Semilla />} />
        </Routes>
      </main>
    </div>
    </NotificationProvider>
  )
}

export default App
