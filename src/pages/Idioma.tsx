import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸', description: 'MX' },
  { code: 'en', label: 'English', flag: '🇺🇸', description: 'US' },
]

export default function Idioma() {
  const navigate = useNavigate()
  const { lang, setLang, t } = useLanguage()

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
        <h1 className="text-2xl font-bold text-gray-900">{t('idioma.titulo')}</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className={`w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
              lang === l.code ? 'bg-indigo-50/50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{l.flag}</span>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{l.label}</p>
                <p className="text-xs text-gray-500">{l.description}</p>
              </div>
            </div>
            {lang === l.code && (
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
