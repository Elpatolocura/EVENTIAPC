import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

export default function CambiarContrasena() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.nueva.length < 6) {
      setError(t('cambiar_contrasena.minimo'))
      return
    }
    if (form.nueva !== form.confirmar) {
      setError(t('cambiar_contrasena.no_coinciden'))
      return
    }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password: form.nueva })
    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setForm({ actual: '', nueva: '', confirmar: '' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate('/configuracion')}
          className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('cambiar_contrasena.titulo')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('cambiar_contrasena.actual')}</label>
          <input
            type="password"
            value={form.actual}
            onChange={(e) => update('actual', e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('cambiar_contrasena.nueva')}</label>
          <input
            type="password"
            value={form.nueva}
            onChange={(e) => update('nueva', e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('cambiar_contrasena.confirmar')}</label>
          <input
            type="password"
            value={form.confirmar}
            onChange={(e) => update('confirmar', e.target.value)}
            placeholder="Repite la nueva contraseña"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {form.confirmar && form.nueva !== form.confirmar && (
            <p className="text-xs text-red-500 mt-1">{t('cambiar_contrasena.no_coinciden')}</p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {t('cambiar_contrasena.exito')}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? t('cambiar_contrasena.guardando') : t('cambiar_contrasena.guardar')}
        </button>
      </form>
    </div>
  )
}
