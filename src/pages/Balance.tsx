import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getBalance, getTransactions, releaseLockedFunds } from '../lib/db'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

const amounts = [20000, 50000, 100000, 200000, 500000]

export default function Balance() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const [locked, setLocked] = useState(0)
  const [history, setHistory] = useState<{ amount: number; method: string; date: string }[]>([])
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select')
  const [method, setMethod] = useState('')
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (!user) return
    releaseLockedFunds().then(() => {
      getBalance(user.id).then((data) => {
        setBalance(data?.amount || 0)
        setLocked(data?.locked || 0)
      })
    })
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
      <h1 className="text-2xl font-orbitron font-extrabold uppercase mb-6">{t('balance.titulo')}</h1>

      <div className="flex items-center gap-2 mb-6">
        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-share-tech text-slate-500 uppercase tracking-wider">{t('balance.gestion')}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
          <p className="text-xs font-share-tech text-slate-600 uppercase mb-1">Disponible</p>
          <p className="text-xl sm:text-2xl font-orbitron font-bold text-gray-900">${balance.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-red-400"></div>
          <p className="text-xs font-share-tech text-slate-600 uppercase mb-1">Pendiente</p>
          <p className="text-xl sm:text-2xl font-orbitron font-bold text-amber-600">${locked.toLocaleString('es-CO')}</p>
          <p className="text-[11px] text-gray-400 mt-1">Disponible tras finalizar el evento</p>
        </div>
      </div>

      <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden mb-6">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
        <button type="button" onClick={() => setShowHistory(!showHistory)} className="w-full flex items-center justify-between mb-4 cursor-pointer">
          <h2 className="text-sm font-orbitron font-semibold text-gray-900 uppercase">{t('balance.historial')}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-share-tech text-slate-500">{history.length} {t('balance.recargas')}</span>
            <svg className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showHistory ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {history.length === 0 ? (
            <p className="text-sm font-share-tech text-slate-500 text-center py-6">{t('balance.no_recargas')}</p>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-400 flex items-center justify-center text-sm text-white">💰</div>
                    <div>
                      <p className="text-sm font-orbitron font-bold text-gray-900">+${h.amount.toLocaleString('es-CO')}</p>
                      <p className="text-xs font-share-tech text-slate-500">{h.method} • {h.date}</p>
                    </div>
                  </div>
                  <span className="text-xs font-share-tech font-bold text-emerald-600 uppercase">{t('balance.completado')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
        <h2 className="text-sm font-orbitron font-semibold text-gray-900 uppercase mb-4">{t('balance.agregar_dinero')}</h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {amounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setSelectedAmount(a); setCustomAmount('') }}
              className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                selectedAmount === a
                  ? 'cyber-btn-active'
                  : 'cyber-btn'
              }`}
            >
              <span className={`text-sm font-semibold ${selectedAmount === a ? '' : 'text-gray-900'}`}>
                ${a.toLocaleString('es-CO')}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-xs font-share-tech text-slate-600 uppercase mb-1.5">{t('balance.otra_cantidad')}</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm text-slate-500 font-share-tech">$</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
              placeholder="0"
              className="cyber-input w-full pl-8 pr-4 py-2.5 rounded-xl border-2 border-black text-sm bg-white"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={displayAmount <= 0}
          className="w-full py-3 rounded-xl cyber-btn-active border-2 border-black text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {t('balance.agregar')} ${displayAmount.toLocaleString('es-CO')}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 w-full max-w-md mx-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
            {step === 'success' ? (
              <div className="text-center py-4">
                <span className="text-4xl block mb-3">✅</span>
                <h3 className="text-lg font-orbitron font-bold uppercase text-gray-900 mb-1">{t('balance.dinero_agregado')}</h3>
                <p className="text-sm font-share-tech text-slate-500 mb-6">{t('balance.se_agregaron')} <strong>${displayAmount.toLocaleString('es-CO')}</strong> {t('balance.a_tu_balance')}</p>
                <button type="button" onClick={() => { completeRecharge(); setShowModal(false) }}
                  className="px-6 py-2 rounded-lg text-sm font-semibold text-white cyber-btn-active border-2 border-black cursor-pointer">
                  {t('balance.cerrar')}
                </button>
              </div>
            ) : step === 'processing' ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <h3 className="text-lg font-orbitron font-bold uppercase text-gray-900 mb-1">Procesando pago</h3>
                <p className="text-sm font-share-tech text-slate-500">Por favor espera...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-orbitron font-bold uppercase text-gray-900">Método de pago</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-share-tech font-bold text-white cyber-btn-active border-2 border-black">${displayAmount.toLocaleString('es-CO')}</span>
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
                        method === m.id ? 'cyber-btn-active border-2 border-black' : 'cyber-btn'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-sm font-orbitron font-bold text-gray-900 flex-1">{m.label}</span>
                      {method === m.id && (
                        <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border-2 border-black text-sm font-share-tech font-bold text-gray-900 bg-white hover:bg-gray-100 transition-colors cursor-pointer">
                    Cancelar
                  </button>
                  <button type="button" onClick={() => setStep('processing')}
                    disabled={!method}
                    className="flex-1 py-2.5 rounded-xl cyber-btn-active border-2 border-black text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
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
