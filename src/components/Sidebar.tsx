import { useNavigate } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { useSidebar } from '../context/SidebarContext'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export default function Sidebar() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isPremium } = useAuth()
  const { unreadCount } = useNotification()
  const { open, close } = useSidebar()

  const menuItems = [
    { label: t('sidebar.inicio'), path: '/', icon: '🏠' },
    { label: t('sidebar.favoritos'), path: '/favoritos', icon: '⭐' },
    { label: t('sidebar.balance'), path: '/balance', icon: '💰' },
    { label: t('sidebar.chat'), path: '/chat', icon: '💬' },
    { label: t('sidebar.mis_entradas'), path: '/mis-entradas', icon: '🎫' },
    { label: t('sidebar.mis_eventos'), path: '/mis-eventos', icon: '📅' },
    { label: t('sidebar.notificaciones'), path: '/notificaciones', icon: '🔔', badge: unreadCount },
    { label: t('sidebar.perfil'), path: '/perfil', icon: '👤' },
    { label: t('sidebar.configuracion'), path: '/configuracion', icon: '⚙️' },
  ]

  return (
    <>
      {/* overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:bg-black/30"
          onClick={close}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-72 bg-[#f8f9fa] border-r-2 border-black shadow-[4px_0_0px_#000] z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400" />

        <div className="p-6 border-b-2 border-black flex items-center justify-between">
          <h1 className="font-orbitron font-extrabold uppercase text-xl">Eventia</h1>
          <button type="button" onClick={close}
            className="p-1.5 bg-[#f8f9fa] border-2 border-black rounded shadow-[2px_2px_0px_#000] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={close}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-accent-light text-accent-dark border-2 border-black shadow-[1px_1px_0px_#000]'
                        : 'text-slate-700 hover:bg-accent-light hover:text-accent-dark'
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-orbitron font-bold text-xs">{item.label}</span>
                  {(item as any).badge > 0 && (
                    <span className="ml-auto bg-cyan-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {(item as any).badge > 99 ? '99+' : (item as any).badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {!isPremium && (
            <div className="px-3 mt-4">
              <button
                type="button"
                onClick={() => { close(); navigate('/premium') }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <span className="text-lg">⭐</span>
                <span>{t('sidebar.premium')}</span>
              </button>
            </div>
          )}

          {isPremium && (
            <div className="px-3 mt-4">
              <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-sm">
                <span className="text-lg">⭐</span>
                <span>Plan Premium activo</span>
              </div>
            </div>
          )}
        </nav>

        <div className="p-3 border-t-2 border-black space-y-1">
          {isPremium ? (
            <NavLink
              to="/crear-evento"
              end
              onClick={close}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-accent-light text-accent-dark border-2 border-black shadow-[1px_1px_0px_#000]'
                    : 'text-slate-700 hover:bg-accent-light hover:text-accent-dark'
                }`
              }
            >
              <span className="text-lg">➕</span>
              <span className="font-orbitron font-bold text-xs">{t('sidebar.crear_evento')}</span>
            </NavLink>
          ) : (
            <button
              type="button"
              onClick={() => setShowPremiumModal(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-accent-light hover:text-accent-dark transition-colors duration-200 cursor-pointer relative"
            >
              <span className="text-lg">➕</span>
              <span className="font-orbitron font-bold text-xs">{t('sidebar.crear_evento')}</span>
              <span className="ml-auto text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">
                ⭐ Premium
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-700 hover:bg-accent-light hover:text-accent-dark transition-colors duration-200 text-sm font-medium cursor-pointer"
          >
            <span className="text-lg">🚪</span>
            <span className="font-orbitron font-bold text-xs">{t('sidebar.cerrar_sesion')}</span>
          </button>
        </div>
      </aside>

      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-80 mx-4 text-center">
            <span className="text-5xl block mb-4">⭐</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Función Premium</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Crear eventos es exclusivo para cuentas <strong>Premium</strong>.
              Actualiza tu plan para acceder a esta función.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { setShowPremiumModal(false); close(); navigate('/premium') }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
              >
                Ver planes
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[6px_6px_0px_#000] p-6 max-w-sm w-full relative animate-slide-up overflow-hidden">
              <div className="absolute inset-0 cyber-grid pointer-events-none opacity-[0.06]" />
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-500 rounded-t-xl" />
              <div className="relative z-10 flex flex-col items-center text-center pt-2">
                <div className="w-16 h-16 rounded-full border-2 border-black bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mb-4 shadow-[3px_3px_0px_#000]">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="font-orbitron font-extrabold text-lg text-gray-900 mb-1">{t('sidebar.cerrar_sesion')}</h3>
                <p className="font-share-tech text-sm text-slate-500 mb-6">{t('sidebar.cerrar_sesion_confirm')}</p>
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="cyber-btn flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer"
                  >
                    {t('sidebar.cancelar')}
                  </button>
                  <button
                    type="button"
                    onClick={async () => { 
                      await supabase.auth.signOut();
                      navigate('/login'); 
                      setShowConfirm(false); 
                    }}
                    className="cyber-btn-danger flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer"
                  >
                    {t('sidebar.cerrar_sesion')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
