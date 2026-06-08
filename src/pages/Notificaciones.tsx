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

  const deleteOne = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await supabase.rpc('delete_notification', { p_id: id })
    refreshUnread()
  }

  const deleteAll = async () => {
    setNotifications([])
    await supabase.rpc('delete_all_notifications')
    refreshUnread()
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-orbitron font-extrabold uppercase text-lg text-gray-900">{t('notificaciones.titulo')}</h1>
          <p className="font-share-tech text-cyan-500 text-sm flex items-center gap-1.5 mt-0.5">
            <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {unreadCount} {t('notificaciones.sin_leer')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead}
              className="cyber-btn px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer">
              {t('notificaciones.marcar_leido')}
            </button>
          )}
          {notifications.length > 0 && (
            <button type="button" onClick={deleteAll}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-black shadow-[2px_2px_0px_#000] hover:from-red-600 hover:to-red-700 transition-all cursor-pointer">
              Eliminar todas
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[2px_2px_0px_#000] rounded-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500" />
          <div className="p-12 text-center">
            <span className="text-4xl block mb-3">🔔</span>
            <p className="font-share-tech text-sm text-gray-500">{t('notificaciones.vacio')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-black shadow-[2px_2px_0px_#000] rounded-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500" />
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div key={n.id} onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-white/80 transition-colors cursor-pointer group ${n.unread ? 'bg-cyan-50/60' : ''}`}>
                <span className="text-xl mt-0.5 shrink-0">🔔</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-orbitron text-sm ${n.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>{n.title}</p>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />}
                  </div>
                  <p className="font-share-tech text-sm text-slate-600 mt-0.5 line-clamp-2">{n.desc}</p>
                  <p className="font-share-tech text-xs text-slate-400 mt-1">{n.time}</p>
                </div>
                <button type="button" onClick={(e) => deleteOne(n.id, e)}
                  className="shrink-0 text-red-400 hover:text-red-600 transition-colors cursor-pointer mt-1"
                  title="Eliminar">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
