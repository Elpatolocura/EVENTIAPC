import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

const colors = [
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-600' },
  { name: 'Azul', value: 'blue', class: 'bg-blue-600' },
  { name: 'Verde', value: 'green', class: 'bg-green-500' },
  { name: 'Rojo', value: 'red', class: 'bg-red-500' },
  { name: 'Rosa', value: 'pink', class: 'bg-pink-500' },
  { name: 'Morado', value: 'purple', class: 'bg-purple-600' },
  { name: 'Naranja', value: 'orange', class: 'bg-orange-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
]

export default function Personalizar() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { color, theme, setColor, setTheme } = useTheme()

  const themes = [
    {
      value: 'light',
      label: t('personalizar.claro'),
      desc: t('personalizar.claro_desc'),
      preview: 'bg-white border-gray-200',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      value: 'dark',
      label: t('personalizar.oscuro'),
      desc: t('personalizar.oscuro_desc'),
      preview: 'bg-gray-900 border-gray-700',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
    },
  ]

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
        <h1 className="text-2xl font-bold text-gray-900">{t('personalizar.titulo')}</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('personalizar.color')}</h2>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-10 h-10 rounded-full ${c.class} flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                  color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                }`}
              >
                {color === c.value && (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {t('personalizar.seleccionaste')}: <span className="font-medium capitalize text-gray-600">{colors.find((c) => c.value === color)?.name}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('personalizar.tema')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  theme === t.value
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-full h-20 rounded-lg mb-3 ${t.preview} border flex items-center justify-center`}>
                  <div className={`${theme === t.value ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {t.icon}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
