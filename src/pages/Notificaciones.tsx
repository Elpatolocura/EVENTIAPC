import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { getNotifications } from '../lib/db'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

export default function Notificaciones() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  const { refreshUnread } = useNotification()
  const [notifications, setNotifications] = useState<any[]>([])

  const mapNotif = (n: any) => ({
    id: n.id,
    title: n.title || 'Notificación',
    desc: n.message || '',
    time: new Date(n.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
    unread: !n.read,
    data: n.data || {},
  })

  const load = useCallback(async () => {
    if (!user) return
    const data = await getNotifications(user.id)
    setNotifications(data.map(mapNotif))
  }, [user])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('notificaciones-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => { load(); refreshUnread() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, load, refreshUnread])

  const unreadCount = notifications.filter((n) => n.unread).length

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
    if (user) { await supabase.from('notifications').update({ read: true }).eq('user_id', user.id); refreshUnread() }
  }

  const handleClick = async (n: any) => {
    if (n.unread) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
      refreshUnread()
    }
    if (n.data?.type === 'new_follower' && n.data.actor_id) {
      navigate(`/perfil/${n.data.actor_id}`)
    } else if (n.data?.type === 'new_event' && n.data.event_id) {
      navigate(`/evento/${n.data.event_id}`)
    } else if (n.data?.type === 'new_message' && n.data.event_id) {
      navigate(`/chat/${n.data.event_id}`)
    }
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
            <button key={n.id} type="button" onClick={() => handleClick(n)}
              className={`w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer ${n.unread ? 'bg-indigo-50/40' : ''}`}>
              <span className="text-xl mt-0.5 shrink-0">🔔</span>
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
