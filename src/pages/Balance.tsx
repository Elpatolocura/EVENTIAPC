import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getBalance, getTransactions } from '../lib/db'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

const amounts = [20000, 50000, 100000, 200000, 500000]

export default function Balance() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const [history, setHistory] = useState<{ amount: number; method: string; date: string }[]>([])
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select')
  const [method, setMethod] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    getBalance(user.id).then((data) => setBalance(data?.amount || 0))
    getTransactions(user.id).then((tx) =>
      setHistory(tx.map((t: any) => ({ amount: t.amount, method: t.type, date: new Date(t.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) })))
    )
  }, [user])

  const methodLabels: Record<string, string> = {
    card: 'Tarjeta', nequi: 'Nequi', daviplata: 'Daviplata', pse: 'PSE', efecty: 'Efecty',
  }

  const displayAmount = selectedAmount || Number(customAmount) || 0

  const handleAdd = () => {
    if (displayAmount <= 0) return
    setShowModal(true)
    setStep('select')
    setMethod('')
  }

  const completeRecharge = async () => {
    if (saving) return
    setSaving(true)
    const methodLabel = methodLabels[method] || method
    const newEntry = { amount: displayAmount, method: methodLabel, date: 'Hoy' }
    setHistory((prev) => [newEntry, ...prev])
    setBalance((b) => b + displayAmount)
    setCustomAmount('')
    setSelectedAmount(null)
    if (user) {
      try {
        const { error: txErr } = await supabase.from('transactions').insert({ user_id: user.id, amount: displayAmount, type: methodLabel, description: 'Recarga de saldo' })
        if (txErr) console.error('Error al insertar transacción:', txErr)
        const currentBalance = await supabase.from('balances').select('amount').eq('user_id', user.id).maybeSingle()
        const newAmount = (currentBalance.data?.amount || 0) + displayAmount
        const { error: balErr } = await supabase.from('balances').upsert({ user_id: user.id, amount: newAmount }, { onConflict: 'user_id' })
        if (balErr) console.error('Error al actualizar balance:', balErr)
      } catch (e) {
        console.error('Error en completeRecharge:', e)
      }
    }
    setSaving(false)
  }

  useEffect(() => {
    if (step === 'processing') {
      const t = setTimeout(() => setStep('success'), 2000)
      return () => clearTimeout(t)
    }
  }, [step])

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('balance.titulo')}</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('balance.disponible')}</p>
        <p className="text-4xl font-bold text-gray-900">${balance.toLocaleString('es-CO')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">{t('balance.historial')}</h2>
          <span className="text-xs text-gray-400">{history.length} {t('balance.recargas')}</span>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{t('balance.no_recargas')}</p>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">💰</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">+${h.amount.toLocaleString('es-CO')}</p>
                    <p className="text-xs text-gray-400">{h.method} • {h.date}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600">{t('balance.completado')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('balance.agregar_dinero')}</h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {amounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setSelectedAmount(a); setCustomAmount('') }}
              className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                selectedAmount === a
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`text-sm font-semibold ${selectedAmount === a ? 'text-indigo-700' : 'text-gray-900'}`}>
                ${a.toLocaleString('es-CO')}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('balance.otra_cantidad')}</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm text-gray-400">$</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
              placeholder="0"
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={displayAmount <= 0}
          className="w-full py-3 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {t('balance.agregar')} ${displayAmount.toLocaleString('es-CO')}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            {step === 'success' ? (
              <div className="text-center py-4">
                <span className="text-4xl block mb-3">✅</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('balance.dinero_agregado')}</h3>
                <p className="text-sm text-gray-500 mb-6">{t('balance.se_agregaron')} <strong>${displayAmount.toLocaleString('es-CO')}</strong> {t('balance.a_tu_balance')}</p>
                <button type="button" onClick={() => { completeRecharge(); setShowModal(false) }}
                  className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer">
                  {t('balance.cerrar')}
                </button>
              </div>
            ) : step === 'processing' ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Procesando pago</h3>
                <p className="text-sm text-gray-500">Por favor espera...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">Método de pago</h3>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">${displayAmount.toLocaleString('es-CO')}</span>
                </div>

                <div className="space-y-2 mb-6">
                  {[
                    { id: 'card', label: 'Tarjeta de crédito/débito', icon: '💳' },
                    { id: 'nequi', label: 'Nequi', icon: '📱' },
                    { id: 'daviplata', label: 'Daviplata', icon: '🏦' },
                    { id: 'pse', label: 'PSE', icon: '🏧' },
                    { id: 'efecty', label: 'Efecty', icon: '📍' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        method === m.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-sm font-medium text-gray-900 flex-1">{m.label}</span>
                      {method === m.id && (
                        <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    Cancelar
                  </button>
                  <button type="button" onClick={() => setStep('processing')}
                    disabled={!method}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    Pagar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
