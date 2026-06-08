import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const sections = [
  {
    title: 'Información que recopilamos',
    content: 'Recopilamos la información que nos proporcionas al crear una cuenta, como tu nombre, correo electrónico, número de teléfono y ubicación. También recopilamos datos de uso para mejorar tu experiencia en la plataforma.',
  },
  {
    title: 'Uso de la información',
    content: 'Utilizamos tu información para procesar tus compras de entradas, recomendarte eventos relevantes, mejorar nuestros servicios y comunicarnos contigo sobre actualizaciones importantes de la plataforma.',
  },
  {
    title: 'Protección de datos',
    content: 'Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales contra accesos no autorizados, pérdida o alteración. Todos los datos se transmiten mediante conexiones cifradas (SSL/TLS).',
  },
  {
    title: 'Cookies',
    content: 'Utilizamos cookies y tecnologías similares para mejorar tu experiencia, recordar tus preferencias y analizar el tráfico de la aplicación. Puedes gestionar tus preferencias de cookies desde la configuración.',
  },
  {
    title: 'Tus derechos',
    content: 'Tienes derecho a acceder, rectificar, eliminar tus datos personales, así como a limitar u oponerte al tratamiento de los mismos. Puedes ejercer estos derechos desde tu perfil o contactándonos directamente.',
  },
  {
    title: 'Cambios en la política',
    content: 'Nos reservamos el derecho de actualizar esta política de privacidad en cualquier momento. Te notificaremos sobre cambios significativos a través de la aplicación o por correo electrónico.',
  },
]

export default function PoliticasPrivacidad() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cyber-btn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-orbitron font-extrabold uppercase text-2xl text-gray-900">{t('politicas.titulo')}</h1>
      </div>

      <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-500" />
        {sections.map((s) => (
          <details key={s.title} className="group border-b-2 border-black last:border-b-0">
            <summary className="flex items-center justify-between cursor-pointer list-none p-5 font-orbitron font-bold text-sm text-gray-900 hover:text-fuchsia-600 transition-colors">
              {s.title}
              <svg className="w-4 h-4 text-gray-400 group-open:text-fuchsia-600 group-open:rotate-180 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="px-5 pb-5 font-share-tech text-sm text-slate-600 leading-relaxed">{s.content}</p>
          </details>
        ))}
      </div>

      <p className="font-share-tech text-xs text-slate-400 mt-4 text-center">
        {t('politicas.actualizacion')}
      </p>
    </div>
  )
}
