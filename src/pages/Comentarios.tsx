import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const ratings = [1, 2, 3, 4, 5]

export default function Comentarios() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [form, setForm] = useState({ categoria: '', mensaje: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setErrorMsg('Debes iniciar sesión'); return }
    setSending(true)
    setErrorMsg('')
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        user_email: user.email,
        rating,
        category: form.categoria,
        message: form.mensaje,
      })
      if (error) throw new Error(error.message)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Eventia <onboarding@resend.dev>',
          to: ['radatova18@gmail.com'],
          subject: `💬 Feedback de ${user.email || 'usuario'} — ${form.categoria}`,
          html: `<h2>Nuevo feedback</h2>
<p><strong>Email:</strong> ${user.email || 'N/A'}</p>
<p><strong>Puntuación:</strong> ${'⭐'.repeat(rating)} (${rating}/5)</p>
<p><strong>Categoría:</strong> ${form.categoria}</p>
<p><strong>Mensaje:</strong></p>
<p style="background:#f5f5f5;padding:12px;border-radius:8px;">${form.mensaje.replace(/\n/g, '<br>')}</p>
<hr><p style="color:#999;font-size:12px;">Enviado desde Eventia</p>`,
        }),
      })
      if (!res.ok) {
        const errData = await res.json()
        console.error('Resend error:', errData)
      }

      setSent(true)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión')
    }
    setSending(false)
  }

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button type="button" onClick={() => navigate('/configuracion')} className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('comentarios.titulo')}</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <span className="text-5xl block mb-4">🎉</span>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('comentarios.gracias')}</h2>
          <p className="text-sm text-gray-500 mb-6">{t('comentarios.gracias_desc')}</p>
          <button
            type="button"
            onClick={() => navigate('/configuracion')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            {t('comentarios.volver')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={() => navigate('/configuracion')} className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('comentarios.titulo')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-3">{t('comentarios.satisfaccion')}</p>
          <div className="flex justify-center gap-1">
            {ratings.map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                className="text-3xl transition-all hover:scale-110 cursor-pointer"
              >
                {star <= (hover || rating) ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {rating === 1 && 'Muy malo'}
            {rating === 2 && 'Malo'}
            {rating === 3 && 'Regular'}
            {rating === 4 && 'Bueno'}
            {rating === 5 && 'Excelente'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('comentarios.categoria')}</label>
          <select
            value={form.categoria}
            onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            <option value="">{t('comentarios.selecciona')}</option>
            <option value="general">{t('comentarios.general')}</option>
            <option value="bug">{t('comentarios.error')}</option>
            <option value="sugerencia">{t('comentarios.sugerencia')}</option>
            <option value="pago">{t('comentarios.pagos')}</option>
            <option value="otro">{t('comentarios.otro')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('comentarios.mensaje')}</label>
          <textarea
            value={form.mensaje}
            onChange={(e) => setForm((p) => ({ ...p, mensaje: e.target.value }))}
            placeholder={t('comentarios.placeholder')}
            rows={5}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {errorMsg && (
          <p className="text-sm text-red-600 text-center">{errorMsg}</p>
        )}
        <button
          type="submit"
          disabled={!rating || !form.categoria || !form.mensaje || sending}
          className="w-full py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {sending ? 'Enviando...' : t('comentarios.enviar')}
        </button>
      </form>
    </div>
  )
}
