import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getNotifications } from '../lib/db'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

export default function Notificaciones() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (user) getNotifications(user.id).then((data) =>
      setNotifications(data.map((n: any) => ({
        id: n.id,
        type: n.type || 'evento',
        icon: n.icon || '🔔',
        title: n.title || 'Notificación',
        desc: n.desc || '',
        time: new Date(n.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) || 'Hoy',
        unread: !n.read,
      })))
    )
  }, [user])

  const unreadCount = notifications.filter((n) => n.unread).length

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
    if (user) await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
  }

  const toggleRead = async (id: number) => {
    const n = notifications.find((x) => x.id === id)
    if (!n) return
    setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, unread: !x.unread } : x)))
    await supabase.from('notifications').update({ read: !n.unread }).eq('id', id)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('notificaciones.titulo')}</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={markAllRead}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer">
            {t('notificaciones.marcar_leido')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <span className="text-4xl block mb-3">🔔</span>
          <p className="text-sm text-gray-500">{t('notificaciones.vacio')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {notifications.map((n) => (
            <button key={n.id} type="button" onClick={() => toggleRead(n.id)}
              className={`w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer ${n.unread ? 'bg-indigo-50/40' : ''}`}>
              <span className="text-xl mt-0.5 shrink-0">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${n.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>{n.title}</p>
                  {n.unread && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.desc}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
