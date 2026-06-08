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
  { icon: '📧', label: 'radatova18@gmail.com', desc: 'Respuesta en 24 horas', href: 'mailto:radatova18@gmail.com' },
  { icon: '📞', label: '3052248972', desc: 'Línea de atención nacional', href: 'tel:3052248972' },
]

export default function CentroAyuda() {
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
        <h1 className="text-2xl font-orbitron font-extrabold uppercase">{t('centro_ayuda.titulo')}</h1>
      </div>

      <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] overflow-hidden mb-6">
        <div className="h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
        <div className="p-6">
          <h2 className="text-sm font-orbitron font-bold text-gray-900 mb-4">{t('centro_ayuda.canales')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {contactChannels.map((ch) => (
              <div key={ch.label} className="p-4 rounded-xl bg-gray-50 text-center border border-black overflow-hidden">
                <span className="text-2xl block mb-2">{ch.icon}</span>
                {ch.href ? (
                  <a href={ch.href} className="text-xs sm:text-sm font-orbitron font-bold text-fuchsia-600 hover:text-fuchsia-700 underline break-all leading-tight">{ch.label}</a>
                ) : (
                  <p className="text-xs sm:text-sm font-orbitron font-bold text-gray-900 break-words leading-tight">{ch.label}</p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">{ch.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
        <div className="p-6">
          <h2 className="text-sm font-orbitron font-bold text-gray-900 mb-4">{t('centro_ayuda.faq')}</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-black cursor-pointer list-none text-sm font-orbitron font-bold text-gray-900 group-open:text-fuchsia-600 hover:bg-gray-100 transition-colors">
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
    </div>
  )
}
