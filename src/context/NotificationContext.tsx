import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { getMutedChats } from '../lib/db'

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
  const lastNotifId = useRef(0)
  const notifiedIds = useRef(new Set<number>())
  const mutedChatsRef = useRef(new Set<string>())

  useEffect(() => {
    if (!user) return
    getMutedChats(user.id).then(s => { mutedChatsRef.current = s })
    const interval = setInterval(() => {
      getMutedChats(user.id).then(s => { mutedChatsRef.current = s })
    }, 15000)
    return () => clearInterval(interval)
  }, [user])

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

    supabase.from('notifications').select('id').eq('user_id', user.id).order('id', { ascending: false }).limit(10).then(({ data }) => {
      if (data && data.length > 0) {
        lastNotifId.current = data[0].id
        data.forEach((n: { id: number }) => notifiedIds.current.add(n.id))
      }
    })

    const channel = supabase.channel('notifications-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          refreshUnread()
          showToastFromNotif(payload.new)
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => refreshUnread())
      .subscribe()

    const poll = setInterval(async () => {
      const { data } = await supabase.from('notifications')
        .select('id, title, message, data')
        .eq('user_id', user.id)
        .order('id', { ascending: false })
        .limit(5)
      if (data) {
        for (const n of data) {
          if (n.id > lastNotifId.current) {
            lastNotifId.current = n.id
          }
          if (!notifiedIds.current.has(n.id)) {
            notifiedIds.current.add(n.id)
            showToastFromNotif(n)
          }
        }
        refreshUnread()
      }
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [user, refreshUnread])

  function showToastFromNotif(n: any) {
    const eventId = n.data?.event_id
    if (n.data?.type === 'new_message' && eventId && mutedChatsRef.current.has(eventId)) {
      return
    }
    playNotificationSound()
    setToasts((prev) => [...prev, {
      id: n.id,
      title: n.title || 'Notificación',
      message: n.message || '',
      data: n.data || {},
    }])
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnread, toasts, removeToast }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
