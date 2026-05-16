import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

interface SettingItemProps {
  icon: string
  label: string
  description?: string
  right?: React.ReactNode
  to?: string
}

function SettingItem({ icon, label, description, right, to }: SettingItemProps) {
  const content = (
    <div className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      {right}
    </div>
  )

  if (to) return <Link to={to}>{content}</Link>
  return content
}

export default function Configuracion() {
  const { t } = useLanguage()
  const { isPremium } = useAuth()

  const settings: SettingItemProps[] = [
    ...(isPremium ? [{ 
      icon: '⭐', 
      label: 'Administrar suscripción', 
      description: 'Gestiona tu plan Premium', 
      to: '/configuracion/suscripcion' 
    }] : []),
    { icon: '✏️', label: t('config.editar_perfil'), description: t('config.editar_perfil_desc'), to: '/configuracion/editar-perfil' },
    { icon: '🌐', label: t('config.idioma'), description: t('config.idioma_desc'), to: '/configuracion/idioma' },
    { icon: '🎨', label: t('config.personalizar'), description: t('config.personalizar_desc'), to: '/configuracion/personalizar' },
    { icon: '🔒', label: t('config.cambiar_contrasena'), description: t('config.cambiar_contrasena_desc'), to: '/configuracion/cambiar-contrasena' },
    { icon: '❓', label: t('config.centro_ayuda'), description: t('config.centro_ayuda_desc'), to: '/configuracion/centro-ayuda' },
    { icon: '📋', label: t('config.politicas'), description: t('config.politicas_desc'), to: '/configuracion/politicas-privacidad' },
    { icon: '💬', label: t('config.comentarios'), description: t('config.comentarios_desc'), to: '/configuracion/comentarios' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('config.titulo')}</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {settings.map((s) => (
          <SettingItem key={s.label} {...s} />
        ))}
      </div>
    </div>
  )
}
