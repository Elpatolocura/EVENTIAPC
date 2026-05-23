import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

export default function CrearCuenta() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '', tipo: 'asistente' })
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
      options: { data: { full_name: form.nombre, tipo: form.tipo } }
    })
    setLoading(false)
    if (error) return setError(error.message)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Eventia</h1>
          <p className="text-sm text-gray-500 mt-1">{t('crear_cuenta.titulo')}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_cuenta.nombre')}</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              placeholder={t('crear_cuenta.nombre_placeholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_cuenta.email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder={t('crear_cuenta.email_placeholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_cuenta.contrasena')}</label>
            <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_cuenta.confirmar')}</label>
            <input type="password" value={form.confirmar} onChange={(e) => setForm((p) => ({ ...p, confirmar: e.target.value }))}
              placeholder="Repite la contraseña"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            {form.confirmar && form.password !== form.confirmar && (
              <p className="text-xs text-red-500 mt-1">{t('crear_cuenta.no_coinciden')}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_cuenta.tipo')}</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm((p) => ({ ...p, tipo: 'asistente' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${form.tipo === 'asistente' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                🎟️ {t('crear_cuenta.asistente')}
              </button>
              <button type="button" onClick={() => setForm((p) => ({ ...p, tipo: 'organizador' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${form.tipo === 'organizador' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                📅 {t('crear_cuenta.organizador')}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading || !form.nombre || !form.email || !form.password || form.password !== form.confirmar}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
            {loading ? t('crear_cuenta.creando') : t('crear_cuenta.crear')}
          </button>
          <p className="text-xs text-gray-500 text-center">
            {t('crear_cuenta.ya_cuenta')}{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">{t('crear_cuenta.iniciar')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
