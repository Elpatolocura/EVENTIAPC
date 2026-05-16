import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getBalance } from '../lib/db'

const plans = [
  {
    name: 'Gratis',
    price: '$0',
    period: 'siempre',
    description: 'Perfecto para empezar',
    popular: false,
    features: [
      'Explorar todos los eventos',
      'Comprar entradas',
      'Chat en eventos',
      'Perfil básico',
      'Favoritos',
    ],
    notIncluded: [
      'Crear eventos',
      'Estadísticas avanzadas',
      'Soporte prioritario',
      'Perfil verificado',
    ],
  },
  {
    name: 'Premium',
    price: '$29.900',
    period: '/mes',
    description: 'Para organizadores profesionales',
    popular: true,
    features: [
      'Todo lo del plan Gratis',
      'Crear eventos ilimitados',
      'Entradas ilimitadas por evento',
      'Estadísticas avanzadas',
      'Soporte prioritario 24/7',
      'Perfil verificado',
      'Sin comisión por venta',
      'Chat prioritario',
      'Informes exportables',
      'Personalización de marca',
      'Promoción en inicio',
    ],
    notIncluded: [],
  },
]

const anualPremium = { price: '$299.900', period: '/año', original: '$358.800' }

const faqs = [
  { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, puedes cancelar tu suscripción en cualquier momento desde la configuración. Si cancelas, seguirás teniendo acceso hasta el final del período facturado.' },
  { q: '¿Hay algún período de prueba?', a: 'Sí, el plan Premium incluye 7 días de prueba gratuita. No te cobraremos hasta que termine el período de prueba.' },
  { q: '¿Puedo cambiar de plan?', a: 'Puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplicarán al siguiente ciclo de facturación.' },
  { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos tarjetas de crédito, débito, Nequi, Daviplata y transferencias bancarias.' },
]

export default function Premium() {
  const { t } = useLanguage()
  const { user, plan: currentPlan, refreshPlan } = useAuth()
  const navigate = useNavigate()
  const [annual, setAnnual] = useState(false)
  const [showPayment, setShowPayment] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select')
  const [currentBalance, setCurrentBalance] = useState(0)
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    if (user) {
      getBalance(user.id).then((data) => setCurrentBalance(data?.amount || 0))
    }
  }, [user])

  const planNames: Record<string, string> = {
    Gratis: t('premium.gratis'),
    Premium: t('premium.premium'),
  }

  const planDescs: Record<string, string> = {
    'Perfecto para empezar': t('premium.gratis_desc'),
    'Para organizadores profesionales': t('premium.premium_desc'),
  }

  const handleSubscribe = (planName: string, price: string) => {
    if (price === '$0') return
    setShowPayment(planName)
    setPaymentStep('select')
    setPaymentMethod('')
    setPaymentError('')
  }

  useEffect(() => {
    if (paymentStep === 'processing') {
      const planCost = annual ? 299900 : 29900
      
      if (paymentMethod === 'balance' && currentBalance < planCost) {
        setPaymentError('No tienes suficiente saldo en tu balance.')
        setPaymentStep('select')
        return
      }

      const timer = setTimeout(async () => {
        if (user && showPayment && showPayment !== 'Gratis') {
          if (paymentMethod === 'balance') {
            await supabase.from('balances').update({ amount: currentBalance - planCost }).eq('user_id', user.id)
            await supabase.from('transactions').insert({
              user_id: user.id,
              amount: planCost,
              type: 'pago',
              description: `Suscripción Premium ${annual ? 'Anual' : 'Mensual'}`
            })
            setCurrentBalance(prev => prev - planCost)
          }

          await supabase
            .from('profiles')
            .upsert({ id: user.id, plan: showPayment }, { onConflict: 'id' })
          await refreshPlan()
        }
        setPaymentStep('success')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [paymentStep, user, showPayment, refreshPlan, annual, currentBalance, paymentMethod])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <span className="text-4xl block mb-3">⭐</span>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('premium.titulo')}</h1>
        <p className="text-gray-500 max-w-xl mx-auto">{t('premium.subtitulo')}</p>
      </div>

      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>{t('premium.mensual')}</span>
        <button
          type="button"
          onClick={() => setAnnual(!annual)}
          className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${annual ? 'bg-indigo-600' : 'bg-gray-300'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${annual ? 'translate-x-6' : ''}`} />
        </button>
        <span className={`text-sm font-medium ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
          {t('premium.anual')}
          <span className="ml-1 text-[11px] text-green-600 font-semibold">{t('premium.ahorra')}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {plans.map((plan) => {
          const isCurrentPlan = plan.name === currentPlan
          const isPremiumPlan = plan.name === 'Premium'
          return (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-sm border-2 p-6 flex flex-col ${
                isCurrentPlan ? 'border-green-500 shadow-lg' : isPremiumPlan ? 'border-indigo-500 shadow-lg' : 'border-gray-100'
              }`}
            >
              {isCurrentPlan && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-green-600 text-white text-[11px] font-semibold">
                  ✓ Tu plan actual
                </span>
              )}
              {!isCurrentPlan && isPremiumPlan && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-semibold">
                  {t('premium.popular')}
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">{planNames[plan.name] || plan.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{planDescs[plan.description] || plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {annual && isPremiumPlan ? anualPremium.price : plan.price}
                  </span>
                  <span className="text-sm text-gray-500">{annual && isPremiumPlan ? anualPremium.period : plan.period}</span>
                </div>
                {annual && isPremiumPlan && (
                  <p className="text-[11px] text-green-600 font-medium mt-1">
                    {t('premium.en_lugar_de')} <span className="line-through text-gray-400">{anualPremium.original}</span>
                  </p>
                )}
                {isPremiumPlan && (
                  <p className="text-[11px] text-gray-400 mt-1">{t('premium.prueba')}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSubscribe(plan.name, plan.price)}
                disabled={isCurrentPlan}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors mb-6 ${
                  isCurrentPlan
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : isPremiumPlan
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {isCurrentPlan ? '✓ Plan activo' : plan.price === '$0' ? t('premium.comenzar') : t('premium.suscribirse')}
              </button>

              <ul className="space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 text-center">{t('premium.faq')}</h2>
        <div className="max-w-2xl mx-auto space-y-2">
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

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            {paymentStep === 'success' ? (
              <div className="text-center py-4">
                <span className="text-4xl block mb-3">✅</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('premium.suscripcion_exitosa')}</h3>
                <p className="text-sm text-gray-500 mb-6">{t('premium.bienvenido_a')} <strong>{showPayment}</strong>. {t('premium.disfruta_beneficios')}</p>
                <button type="button" onClick={() => { setShowPayment(null); setPaymentMethod(''); navigate('/') }}
                  className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer">
                  {t('premium.ir_app')}
                </button>
              </div>
            ) : paymentStep === 'processing' ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('premium.procesando_pago')}</h3>
                <p className="text-sm text-gray-500">{t('premium.procesando_desc')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">{t('premium.metodo_pago')}</h3>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">{showPayment}</span>
                </div>

                <div className="space-y-2 mb-6">
                  {[
                    { id: 'balance', label: `Mi Balance ($${currentBalance.toLocaleString('es-CO')})`, icon: '💰' },
                    { id: 'card', label: 'Tarjeta de crédito/débito', icon: '💳' },
                    { id: 'nequi', label: 'Nequi', icon: '📱' },
                    { id: 'daviplata', label: 'Daviplata', icon: '🏦' },
                    { id: 'pse', label: 'PSE', icon: '🏧' },
                    { id: 'efecty', label: 'Efecty', icon: '📍' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        paymentMethod === method.id
                          ? 'border-indigo-500 bg-indigo-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{method.icon}</span>
                      <span className="text-sm font-medium text-gray-900 flex-1">{method.label}</span>
                      {paymentMethod === method.id && (
                        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowPayment(null); setPaymentMethod(''); setPaymentError('') }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    {t('premium.cancelar')}
                  </button>
                  <button type="button" onClick={() => { setPaymentError(''); setPaymentStep('processing') }}
                    disabled={!paymentMethod}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    {t('premium.pagar')}
                  </button>
                </div>
                {paymentError && (
                  <p className="mt-3 text-sm text-red-600 text-center font-medium">{paymentError}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
