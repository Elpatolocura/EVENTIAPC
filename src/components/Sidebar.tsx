import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isPremium } = useAuth()

  const menuItems = [
    { label: t('sidebar.inicio'), path: '/', icon: '🏠' },
    { label: t('sidebar.favoritos'), path: '/favoritos', icon: '⭐' },
    { label: t('sidebar.balance'), path: '/balance', icon: '💰' },
    { label: t('sidebar.chat'), path: '/chat', icon: '💬' },
    { label: t('sidebar.chat_ia'), path: '/chat-ia', icon: '🤖' },
    { label: t('sidebar.mis_entradas'), path: '/mis-entradas', icon: '🎫' },
    { label: t('sidebar.mis_eventos'), path: '/mis-eventos', icon: '📅' },
    { label: t('sidebar.notificaciones'), path: '/notificaciones', icon: '🔔' },
    { label: t('sidebar.perfil'), path: '/perfil', icon: '👤' },
    { label: t('sidebar.configuracion'), path: '/configuracion', icon: '⚙️' },
  ]

  return (
    <>
      <aside className={`${collapsed ? 'w-16' : 'w-64'} h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 transition-all duration-200 z-30`}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && <h1 className="text-xl font-bold text-indigo-600">Eventia</h1>}
          <button type="button" onClick={onToggle}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer ml-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
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
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Botón premium — solo se muestra si NO es premium */}
          {!isPremium && (
            <div className="px-3 mt-4">
              <button
                type="button"
                onClick={() => navigate('/premium')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-sm cursor-pointer ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? 'Premium' : undefined}
              >
                <span className="text-lg">⭐</span>
                {!collapsed && <span>{t('sidebar.premium')}</span>}
              </button>
            </div>
          )}

          {/* Badge de plan activo (Premium / VIP) */}
          {isPremium && (
            <div className="px-3 mt-4">
              <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-sm ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? 'Premium activo' : undefined}>
                <span className="text-lg">⭐</span>
                {!collapsed && <span>Plan Premium activo</span>}
              </div>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-gray-200 space-y-1">
          {/* Botón crear evento — bloqueado si no es premium */}
          {isPremium ? (
            <NavLink
              to="/crear-evento"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? t('sidebar.crear_evento') : undefined}
            >
              <span className="text-lg">➕</span>
              {!collapsed && <span>{t('sidebar.crear_evento')}</span>}
            </NavLink>
          ) : (
            <button
              type="button"
              onClick={() => setShowPremiumModal(true)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors duration-200 cursor-pointer relative ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? t('sidebar.crear_evento') : undefined}
            >
              <span className="text-lg">➕</span>
              {!collapsed && <span>{t('sidebar.crear_evento')}</span>}
              {!collapsed && (
                <span className="ml-auto text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">
                  ⭐ Premium
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 text-sm font-medium cursor-pointer ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? t('sidebar.cerrar_sesion') : undefined}
          >
            <span className="text-lg">🚪</span>
            {!collapsed && <span>{t('sidebar.cerrar_sesion')}</span>}
          </button>
        </div>
      </aside>

      {/* Modal: requiere plan Premium */}
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
                onClick={() => { setShowPremiumModal(false); navigate('/premium') }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
              >
                Ver planes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar cierre de sesión */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('sidebar.cerrar_sesion')}</h2>
            <p className="text-sm text-gray-600 mb-6">{t('sidebar.cerrar_sesion_confirm')}</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
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
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
              >
                {t('sidebar.cerrar_sesion')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
