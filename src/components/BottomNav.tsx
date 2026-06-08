import { NavLink } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useNotification } from '../context/NotificationContext'

export default function BottomNav() {
  const { t } = useLanguage()
  const { unreadCount } = useNotification()

  const navItems = [
    { label: t('sidebar.inicio'), path: '/', icon: '🏠' },
    { label: t('sidebar.mis_entradas'), path: '/mis-entradas', icon: '🎫' },
    { label: t('sidebar.chat'), path: '/chat', icon: '💬' },
    { label: t('sidebar.perfil'), path: '/perfil', icon: '👤', badge: unreadCount }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#f8f9fa] border-t-2 border-black md:hidden pb-safe shadow-[0_-2px_0px_#000]">
      <ul className="flex items-center justify-around w-full px-2 py-2">
        {navItems.map((item) => (
          <li key={item.label} className="w-full flex-1">
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center w-full py-1 gap-1 transition-all duration-200 ${
                  isActive
                    ? 'text-fuchsia-600 font-bold'
                    : 'text-gray-500 hover:text-fuchsia-600'
                }`
              }
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="font-share-tech text-[10px] leading-none truncate max-w-[64px]">
                {item.label}
              </span>
              {(item as any).badge > 0 && (
                <span className="absolute top-0 right-[calc(50%-18px)] bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center transform -translate-y-1 translate-x-1/2 border border-black shadow-[1px_1px_0px_#000]">
                  {(item as any).badge > 99 ? '99+' : (item as any).badge}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
