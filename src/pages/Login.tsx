import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [user, loading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    setSubmitting(false)
    if (error) return setError(error.message)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-orbitron font-extrabold uppercase text-gray-900">Eventia</h1>
          <p className="text-sm font-share-tech text-slate-600 mt-1">{t('login.titulo')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] p-6 relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
          {user && <div className="p-3 rounded-xl bg-green-50 border-2 border-black text-green-700 text-sm font-share-tech shadow-[2px_2px_0px_#000]">Sesión iniciada. Redirigiendo...</div>}
          {error && <div className="p-3 rounded-xl bg-red-50 border-2 border-black text-red-600 text-sm font-share-tech shadow-[2px_2px_0px_#000]">{error}</div>}
          <div>
            <label className="block font-share-tech text-slate-600 uppercase text-xs mb-1.5">{t('login.email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder={t('login.email_placeholder')}
              className="w-full px-4 py-2.5 rounded-xl cyber-input text-sm" />
          </div>
          <div>
            <label className="block font-share-tech text-slate-600 uppercase text-xs mb-1.5">{t('login.contrasena')}</label>
            <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl cyber-input text-sm" />
          </div>
          <div className="flex justify-end">
            <Link to="/recuperar-clave" className="text-xs text-cyan-600 hover:text-fuchsia-600 font-bold transition-colors">
              {t('login.olvidaste')}
            </Link>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-2.5 rounded-xl cyber-btn-active border-2 border-black text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
            {submitting ? t('login.iniciando') : t('login.iniciar')}
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[#f8f9fa] px-3 text-gray-400 font-share-tech">{t('login.o')}</span></div>
          </div>
          <button type="button" onClick={async () => {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: window.location.origin },
            })
            if (error) setError(error.message)
          }}
            className="w-full py-2.5 rounded-xl cyber-btn border-2 border-black text-sm font-orbitron font-bold shadow-[2px_2px_0px_#000] transition-colors cursor-pointer flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {t('login.google')}
          </button>
          <p className="text-xs font-share-tech text-slate-600 text-center">
            {t('login.no_cuenta')}{' '}
            <Link to="/crear-cuenta" className="text-cyan-600 hover:text-fuchsia-600 font-bold transition-colors">{t('login.crear')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
