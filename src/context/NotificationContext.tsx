import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

interface ToastNotif {
  id: number
  title: string
  message: string
  data?: { type?: string; event_id?: string; actor_id?: string }
}

interface NotificationCtx {
  unreadCount: number
  refreshUnread: () => void
  toasts: ToastNotif[]
  removeToast: (id: number) => void
}

const NotificationContext = createContext<NotificationCtx>({ unreadCount: 0, refreshUnread: () => {}, toasts: [], removeToast: () => {} })

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.setValueAtTime(800, audioCtx.currentTime)
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + 0.3)
  } catch {}
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [toasts, setToasts] = useState<ToastNotif[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const refreshUnread = useCallback(async () => {
    if (!user) { setUnreadCount(0); return }
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
    setUnreadCount(count || 0)
  }, [user])

  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    refreshUnread()
    const channel = supabase.channel('notifications-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          refreshUnread()
          playNotificationSound()
          const n = payload.new
          setToasts((prev) => [...prev, {
            id: n.id,
            title: n.title || 'Notificación',
            message: n.message || '',
            data: n.data || {},
          }])
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => refreshUnread())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, refreshUnread])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnread, toasts, removeToast }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
