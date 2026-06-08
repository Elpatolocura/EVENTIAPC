import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface SettingItemProps {
  icon: React.ReactNode
  label: string
  description?: string
  to?: string
}

function ChevronIcon() {
  return (
    <svg className="w-5 h-5 text-accent-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function SettingItem({ icon, label, description, to }: SettingItemProps) {
  const content = (
    <div className="group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors cursor-pointer hover:bg-[#f0f1f3]">
      <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-orbitron font-bold text-sm text-gray-900 group-hover:text-accent-secondary transition-colors truncate">{label}</p>
        {description && <p className="font-share-tech text-xs text-slate-500 truncate">{description}</p>}
      </div>
      <ChevronIcon />
    </div>
  )

  if (to) return <Link to={to} className="block">{content}</Link>
  return content
}

function SettingsCard({ children, title, icon }: { children: React.ReactNode; title?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-accent-secondary" />
      {title && icon && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-accent-secondary">{icon}</span>
          <h2 className="font-orbitron font-semibold uppercase text-sm text-gray-800">{title}</h2>
        </div>
      )}
      <div className="divide-y divide-gray-200/60">{children}</div>
    </div>
  )
}

export default function Configuracion() {
  const { t } = useLanguage()
  const { isPremium, user } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // fallback: clear manually
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-7 h-7 text-accent-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h1 className="font-orbitron font-extrabold uppercase text-2xl text-gray-900">{t('config.titulo')}</h1>
        </div>
        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-accent-secondary" />
          <p className="font-share-tech text-sm text-slate-500 text-center">Inicia sesión para acceder a la configuración</p>
        </div>
      </div>
    )
  }

  const generalItems: SettingItemProps[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: t('config.editar_perfil'),
      description: t('config.editar_perfil_desc'),
      to: '/configuracion/editar-perfil',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: t('config.idioma'),
      description: t('config.idioma_desc'),
      to: '/configuracion/idioma',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      label: t('config.personalizar'),
      description: t('config.personalizar_desc'),
      to: '/configuracion/personalizar',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      label: t('config.cambiar_contrasena'),
      description: t('config.cambiar_contrasena_desc'),
      to: '/configuracion/cambiar-contrasena',
    },
  ]

  const notificationItems: SettingItemProps[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      label: 'Notificaciones',
      description: 'Configura tus notificaciones',
      to: '/configuracion/notificaciones',
    },
  ]

  const supportItems: SettingItemProps[] = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: t('config.centro_ayuda'),
      description: t('config.centro_ayuda_desc'),
      to: '/configuracion/centro-ayuda',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: t('config.politicas'),
      description: t('config.politicas_desc'),
      to: '/configuracion/politicas-privacidad',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      label: t('config.comentarios'),
      description: t('config.comentarios_desc'),
      to: '/configuracion/comentarios',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-7 h-7 text-accent-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h1 className="font-orbitron font-extrabold uppercase text-2xl text-gray-900">{t('config.titulo')}</h1>
      </div>

      <div className="space-y-5">
        {isPremium && (
          <SettingsCard
            title="Premium"
            icon={
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            }
          >
            <SettingItem
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
              label="Administrar suscripción"
              description="Gestiona tu plan Premium"
              to="/configuracion/suscripcion"
            />
          </SettingsCard>
        )}

        <SettingsCard
          title="General"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          }
        >
          {generalItems.map((item) => (
            <SettingItem key={item.label} {...item} />
          ))}
        </SettingsCard>

        <SettingsCard
          title="Notificaciones"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        >
          {notificationItems.map((item) => (
            <SettingItem key={item.label} {...item} />
          ))}
        </SettingsCard>

        <SettingsCard
          title="Soporte"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        >
          {supportItems.map((item) => (
            <SettingItem key={item.label} {...item} />
          ))}
        </SettingsCard>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="cyber-btn-danger w-full py-3 px-6 rounded-xl text-sm font-bold cursor-pointer flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('sidebar.cerrar_sesion')}
        </button>

        {showLogoutModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowLogoutModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[5px_5px_0px_#000] p-6 max-w-sm w-full relative animate-slide-up">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-500 rounded-t-xl" />
                <div className="flex flex-col items-center text-center pt-2">
                  <div className="w-14 h-14 rounded-full border-2 border-black bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mb-4 shadow-[2px_2px_0px_#000]">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="font-orbitron font-extrabold text-lg text-gray-900 mb-1">{t('sidebar.cerrar_sesion')}</h3>
                  <p className="font-share-tech text-sm text-slate-500 mb-6">¿Estás seguro de que quieres cerrar sesión?</p>
                  <div className="flex gap-3 w-full">
                    <button type="button" onClick={() => setShowLogoutModal(false)}
                      className="cyber-btn flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer">
                      Cancelar
                    </button>
                    <button type="button" onClick={handleLogout}
                      className="cyber-btn-danger flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer">
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
