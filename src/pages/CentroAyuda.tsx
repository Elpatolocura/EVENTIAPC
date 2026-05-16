import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const faqs = [
  { q: '¿Cómo puedo crear un evento?', a: 'Ve a "Crear evento" en el menú lateral y completa el formulario con los detalles del evento.' },
  { q: '¿Cómo compro una entrada?', a: 'Busca el evento que te interesa, selecciona la cantidad de entradas y procede al pago.' },
  { q: '¿Puedo cancelar mi compra?', a: 'Sí, puedes solicitar la cancelación dentro de las 48 horas posteriores a la compra desde "Mis entradas".' },
  { q: '¿Cómo contacto con el organizador?', a: 'Usa la sección "Chat" para enviar un mensaje directo al organizador del evento.' },
  { q: '¿Cómo recupero mi contraseña?', a: 'En la pantalla de inicio de sesión, selecciona "Olvidé mi contraseña" y sigue las instrucciones.' },
]

const contactChannels = [
  { icon: '💬', label: 'Chat en vivo', desc: 'Lun - Vie, 9:00 - 18:00' },
  { icon: '📧', label: 'correo@eventia.com', desc: 'Respuesta en 24 horas' },
  { icon: '📞', label: '+57 601 234 5678', desc: 'Línea de atención nacional' },
]

export default function CentroAyuda() {
  const navigate = useNavigate()
  const { t } = useLanguage()

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
        <h1 className="text-2xl font-bold text-gray-900">{t('centro_ayuda.titulo')}</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('centro_ayuda.canales')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {contactChannels.map((ch) => (
            <div key={ch.label} className="p-4 rounded-xl bg-gray-50 text-center">
              <span className="text-2xl block mb-2">{ch.icon}</span>
              <p className="text-sm font-medium text-gray-900">{ch.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{ch.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('centro_ayuda.faq')}</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="group">
              <summary className="flex items-center justify-between p-3 rounded-xl bg-gray-50 cursor-pointer list-none text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors">
                {faq.q}
                <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="p-3 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
