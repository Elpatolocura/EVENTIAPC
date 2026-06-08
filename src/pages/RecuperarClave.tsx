import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'

export default function RecuperarClave() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/configuracion/cambiar-contrasena`,
    })
    setLoading(false)
    if (err) return setError(err.message)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-orbitron font-extrabold uppercase text-gray-900">Eventia</h1>
          <p className="text-sm font-share-tech text-slate-600 mt-1">{t('recuperar.titulo')}</p>
        </div>

        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
          {sent ? (
            <div className="text-center py-4">
              <span className="text-4xl block mb-3">📧</span>
              <h3 className="text-lg font-orbitron font-extrabold uppercase text-gray-900 mb-1">{t('recuperar.exito')}</h3>
              <p className="text-sm font-share-tech text-slate-600 mb-6">{t('recuperar.enlace_enviado')} <strong>{email}</strong></p>
              <Link to="/login"
                className="inline-block px-6 py-2 rounded-xl cyber-btn-active border-2 border-black text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] transition-colors">
                {t('recuperar.volver')}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm font-share-tech text-slate-600 mb-5">{t('recuperar.desc')}</p>
              <div className="mb-5">
                <label className="block font-share-tech text-slate-600 uppercase text-xs mb-1.5">{t('recuperar.email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('recuperar.email_placeholder')}
                  className="w-full px-4 py-2.5 rounded-xl cyber-input text-sm" />
              </div>
              {error && <div className="p-3 rounded-xl bg-red-50 border-2 border-black text-red-600 text-sm font-share-tech shadow-[2px_2px_0px_#000] mb-5">{error}</div>}
              <button type="button" onClick={handleSend} disabled={!email || loading}
                className="w-full py-2.5 rounded-xl cyber-btn-active border-2 border-black text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                {loading ? t('recuperar.enviando') : t('recuperar.enviar')}
              </button>
              <p className="text-xs font-share-tech text-slate-600 text-center mt-4">
                <Link to="/login" className="text-cyan-600 hover:text-fuchsia-600 font-bold transition-colors">
                  {t('recuperar.volver')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
