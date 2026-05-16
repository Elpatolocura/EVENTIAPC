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

  const refreshPlan = useCallback(async () => {
    if (user) await fetchPlan(user.id)
  }, [user, fetchPlan])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchPlan(u.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchPlan(u.id)
      else setPlan('Gratis')
    })

    return () => subscription.unsubscribe()
  }, [fetchPlan])

  const isPremium = plan === 'Premium'

  return (
    <AuthContext.Provider value={{ user, loading, plan, isPremium, refreshPlan }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
