import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

export default function CrearCuenta() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmar) return setError(t('crear_cuenta.no_coinciden'))
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.nombre } }
    })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-orbitron font-extrabold uppercase text-gray-900">Eventia</h1>
          <p className="text-sm font-share-tech text-slate-600 mt-1">{t('crear_cuenta.titulo')}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] p-6 relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
          {error && <div className="p-3 rounded-xl bg-red-50 border-2 border-black text-red-600 text-sm font-share-tech shadow-[2px_2px_0px_#000]">{error}</div>}
          <div>
            <label className="block font-share-tech text-slate-600 uppercase text-xs mb-1.5">{t('crear_cuenta.nombre')}</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              placeholder={t('crear_cuenta.nombre_placeholder')}
              className="w-full px-4 py-2.5 rounded-xl cyber-input text-sm" />
          </div>
          <div>
            <label className="block font-share-tech text-slate-600 uppercase text-xs mb-1.5">{t('crear_cuenta.email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder={t('crear_cuenta.email_placeholder')}
              className="w-full px-4 py-2.5 rounded-xl cyber-input text-sm" />
          </div>
          <div>
            <label className="block font-share-tech text-slate-600 uppercase text-xs mb-1.5">{t('crear_cuenta.contrasena')}</label>
            <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-2.5 rounded-xl cyber-input text-sm" />
          </div>
          <div>
            <label className="block font-share-tech text-slate-600 uppercase text-xs mb-1.5">{t('crear_cuenta.confirmar')}</label>
            <input type="password" value={form.confirmar} onChange={(e) => setForm((p) => ({ ...p, confirmar: e.target.value }))}
              placeholder="Repite la contraseña"
              className="w-full px-4 py-2.5 rounded-xl cyber-input text-sm" />
            {form.confirmar && form.password !== form.confirmar && (
              <p className="text-xs text-red-500 mt-1 font-share-tech">{t('crear_cuenta.no_coinciden')}</p>
            )}
          </div>
          <button type="submit" disabled={loading || !form.nombre || !form.email || !form.password || form.password !== form.confirmar}
            className="w-full py-2.5 rounded-xl cyber-btn-active border-2 border-black text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
            {loading ? t('crear_cuenta.creando') : t('crear_cuenta.crear')}
          </button>
          <p className="text-xs font-share-tech text-slate-600 text-center">
            {t('crear_cuenta.ya_cuenta')}{' '}
            <Link to="/login" className="text-cyan-600 hover:text-fuchsia-600 font-bold transition-colors">{t('crear_cuenta.iniciar')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
