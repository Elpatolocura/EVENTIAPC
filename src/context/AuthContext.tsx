import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

type Plan = 'Gratis' | 'Premium'

type AuthContextType = {
  user: User | null
  loading: boolean
  plan: Plan
  isPremium: boolean
  refreshPlan: () => Promise<void>
}

function clearSupabaseSession() {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  plan: 'Gratis',
  isPremium: false,
  refreshPlan: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<Plan>('Gratis')

  const fetchPlan = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .maybeSingle()
    setPlan((data?.plan as Plan) || 'Gratis')
  }, [])

  const ensureProfile = useCallback(async (u: User) => {
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', u.id).maybeSingle()
    if (!existing) {
      const fullName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Usuario'
      const avatarUrl = u.user_metadata?.avatar_url || u.user_metadata?.picture || ''
      const tipo = u.user_metadata?.tipo || 'asistente'
      await supabase.from('profiles').upsert({
        id: u.id,
        nombre: fullName,
        avatar_url: avatarUrl,
        tipo,
        plan: 'Gratis',
        language: navigator.language?.startsWith('es') ? 'es' : 'en',
      }, { onConflict: 'id' })
    }
  }, [])

  const refreshPlan = useCallback(async () => {
    if (user) await fetchPlan(user.id)
  }, [user, fetchPlan])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        clearSupabaseSession()
      } else {
        setUser(session.user)
        ensureProfile(session.user)
        fetchPlan(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        await ensureProfile(u)
        fetchPlan(u.id)
      }
      else setPlan('Gratis')
    })

    return () => subscription.unsubscribe()
  }, [fetchPlan, ensureProfile])

  const isPremium = plan === 'Premium'

  return (
    <AuthContext.Provider value={{ user, loading, plan, isPremium, refreshPlan }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
