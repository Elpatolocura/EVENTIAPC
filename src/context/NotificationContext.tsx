import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

interface NotificationCtx {
  unreadCount: number
  refreshUnread: () => void
}

const NotificationContext = createContext<NotificationCtx>({ unreadCount: 0, refreshUnread: () => {} })

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnread = useCallback(async () => {
    if (!user) { setUnreadCount(0); return }
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
    setUnreadCount(count || 0)
  }, [user])

  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    refreshUnread()
    const channel = supabase.channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => refreshUnread())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => refreshUnread())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, refreshUnread])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnread }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
