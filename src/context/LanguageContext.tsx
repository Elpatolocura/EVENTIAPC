import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import translations from '../i18n/translations'

type LanguageContextType = {
  lang: string
  t: (key: string) => string
  setLang: (code: string) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  t: (key: string) => key,
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'es')

  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
          if (data?.idioma && data.idioma !== lang) {
            setLangState(data.idioma)
            localStorage.setItem('lang', data.idioma)
          }
        } catch {}
      })()
    }
  }, [user])

  const setLang = (code: string) => {
    setLangState(code)
    localStorage.setItem('lang', code)
    if (user) {
      supabase.from('profiles').upsert({ id: user.id, idioma: code }).then()
    }
  }

  const t = (key: string): string => {
    return (translations as any)[lang]?.[key] || (translations as any)['es']?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
