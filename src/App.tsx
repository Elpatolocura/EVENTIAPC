import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { NotificationProvider } from './context/NotificationContext'
import ToastContainer from './components/ToastContainer'
import Sidebar from './components/Sidebar'
import { SidebarProvider, useSidebar } from './context/SidebarContext'
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
import Onboarding from './pages/Onboarding'
import Semilla from './pages/Semilla'

function HamburgerButton() {
  const { toggle } = useSidebar()
  const path = useLocation().pathname
  const isChat = path.startsWith('/chat')
  return (
    <button
      type="button"
      onClick={toggle}
      className={`${
        isChat
          ? 'fixed top-4 left-4 z-50 flex'
          : 'hidden md:flex mb-4'
      } items-center justify-center w-10 h-10 border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] bg-[#f8f9fa] text-slate-700 hover:text-accent-dark hover:bg-accent-light transition-all cursor-pointer`}
      aria-label="Abrir menú"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const authRoutes = ['/login', '/crear-cuenta', '/recuperar-clave', '/onboarding']
  const isAuthRoute = authRoutes.includes(location.pathname)

  useEffect(() => {
    if (!user) { setCheckingOnboarding(false); return }
    supabase.from('profiles').select('categorias').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (!data || !data.categorias || data.categorias.length === 0) {
        setNeedsOnboarding(true)
      } else {
        setNeedsOnboarding(false)
      }
      setCheckingOnboarding(false)
    })
  }, [user])

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageSkeleton />
      </div>
    )
  }

  if (!user && !isAuthRoute) return <Navigate to="/login" replace />
  if (user && isAuthRoute && location.pathname !== '/onboarding') return <Navigate to="/" replace />
  if (user && needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/crear-cuenta" element={<CrearCuenta />} />
        <Route path="/recuperar-clave" element={<RecuperarClave />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    )
  }

  return (
    <NotificationProvider>
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Sidebar />
      <BottomNav />
      <ToastContainer />
      <main className="flex-1 p-4 md:p-8 transition-all duration-200 w-full md:w-auto pb-20 md:pb-8">
        <HamburgerButton />
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

export default function App() {
  return (
    <SidebarProvider>
      <AppContent />
    </SidebarProvider>
  )
}

