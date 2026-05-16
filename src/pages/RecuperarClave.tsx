import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function RecuperarClave() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Eventia</h1>
          <p className="text-sm text-gray-500 mt-1">{t('recuperar.titulo')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {sent ? (
            <div className="text-center py-4">
              <span className="text-4xl block mb-3">📧</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('recuperar.exito')}</h3>
              <p className="text-sm text-gray-500 mb-6">{t('recuperar.enlace_enviado')} <strong>{email}</strong></p>
              <Link to="/login"
                className="inline-block px-6 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                {t('recuperar.volver')}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-5">{t('recuperar.desc')}</p>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('recuperar.email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('recuperar.email_placeholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <button type="button" onClick={() => setSent(true)} disabled={!email}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                {t('recuperar.enviar')}
              </button>
              <p className="text-xs text-gray-500 text-center mt-4">
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
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
