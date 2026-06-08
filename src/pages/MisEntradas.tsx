import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTickets, markExpiredTickets, releaseLockedFunds } from '../lib/db'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import { QRCodeSVG } from 'qrcode.react'

const statusCyberBadge: Record<string, string> = {
  válida: 'bg-emerald-500 text-white border border-black',
  usada: 'bg-gray-400 text-white border border-black',
  cancelada: 'bg-red-500 text-white border border-black',
}

const tabColors: Record<string, string> = {
  todas: 'bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-white border-2 border-black shadow-[2px_2px_0px_#000]',
  válida: 'bg-emerald-500 text-white border-2 border-black shadow-[2px_2px_0px_#000]',
  usada: 'bg-blue-500 text-white border-2 border-black shadow-[2px_2px_0px_#000]',
  cancelada: 'bg-red-500 text-white border-2 border-black shadow-[2px_2px_0px_#000]',
}

const getTicketStatus = (ticket: any): 'válida' | 'usada' | 'cancelada' => {
  if (ticket.status === 'cancelada') return 'cancelada'
  if (ticket.status === 'usada' || ticket.used) return 'usada'
  return 'válida'
}

export default function MisEntradas() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [filter, setFilter] = useState<'todas' | 'válida' | 'usada' | 'cancelada'>('todas')
  const [detailTicket, setDetailTicket] = useState<any>(null)
  const [cancelling, setCancelling] = useState<number | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<any>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (user) {
      markExpiredTickets(user.id).then(() => releaseLockedFunds().then(() => getTickets(user.id).then(setTickets)))
    }
  }, [user])

  const filtered = filter === 'todas' ? tickets : tickets.filter((t) => getTicketStatus(t) === filter)
  const grouped = Object.values(
    filtered.reduce((acc: any, t: any) => {
      const key = `${t.event_id}_${t.status}`
      if (!acc[key]) acc[key] = { ...t }
      else {
        acc[key].qty = (acc[key].qty || 1) + (t.qty || 1)
        acc[key].total = (acc[key].total || 0) + (t.total || 0)
      }
      return acc
    }, {})
  )

  const tabs = [
    { key: 'todas' as const, label: t('mis_entradas.todas') },
    { key: 'válida' as const, label: t('mis_entradas.validas') },
    { key: 'usada' as const, label: t('mis_entradas.usadas') },
    { key: 'cancelada' as const, label: t('mis_entradas.canceladas') },
  ]

  const statusLabels: Record<string, string> = {
    válida: t('mis_entradas.valida'),
    usada: t('mis_entradas.usada'),
    cancelada: t('mis_entradas.cancelada'),
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <h1 className="font-orbitron font-extrabold uppercase text-2xl mb-2">{t('mis_entradas.titulo')}</h1>

      <p className="flex items-center gap-2 text-cyan-500 font-share-tech text-sm mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        {t('mis_entradas.todas')}
      </p>

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${filter === tab.key ? tabColors[tab.key] : 'cyber-btn'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] relative overflow-hidden p-12 text-center">
          <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-400 absolute top-0 left-0 right-0" />
          <span className="text-4xl block mb-3 mt-2">🎟️</span>
          <p className="font-share-tech text-sm text-gray-600">{t('mis_entradas.vacia')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((ticket: any) => {
            const ev = ticket.events || {}
            const status = getTicketStatus(ticket)
            return (
              <div key={ticket.id} className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] relative overflow-hidden flex flex-col sm:flex-row">
                <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-400 absolute top-0 left-0 right-0 z-20" />
                <div className="sm:w-48 p-5 flex flex-col justify-center items-center text-white bg-gradient-to-br from-cyan-500 to-fuchsia-500 relative z-10">
                  <span className="text-3xl mb-1">🎟️</span>
                  <p className="font-share-tech text-xs opacity-80">{ticket.code || ticket.id}</p>
                  <p className="font-orbitron text-lg font-extrabold">{ticket.qty || 1} {t('mis_entradas.boleto')}</p>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between relative z-10">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-orbitron text-sm font-extrabold text-gray-900">{ev.title || 'Evento'}</h3>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border border-black shrink-0 ${statusCyberBadge[status] || 'bg-emerald-500 text-white border-black'}`}>
                        {statusLabels[status] || t('mis_entradas.valida')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-share-tech text-xs text-gray-500 mt-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {ev.date || 'Próximamente'}
                      <span className="mx-1.5 text-gray-300">|</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {ev.location || 'Colombia'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/20">
                    <div className="flex items-center gap-2">
                      <p className="font-orbitron text-sm font-extrabold text-gray-900">${ticket.total || 0}</p>
                      {status === 'válida' && (
                        <button type="button" onClick={() => setConfirmCancel(ticket)}
                          className="text-xs font-bold font-share-tech text-red-500 hover:text-red-600 transition-colors cursor-pointer uppercase">
                          Cancelar
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: ev.title || 'Evento', text: `🎟️ ${ticket.code || ticket.id}` })
                        }
                      }}
                        className="cyber-btn-active text-xs px-3 py-1">
                        Compartir
                      </button>
                      <button type="button" onClick={() => setDetailTicket(ticket)}
                        className="cyber-btn text-xs px-3 py-1">
                        {t('mis_entradas.ver_detalle')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmCancel(null)}>
          <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] relative overflow-hidden w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-400" />
            <div className="p-6 pt-5">
              <h3 className="font-orbitron font-extrabold uppercase text-lg text-center mb-2">¿Cancelar entrada?</h3>
              <p className="font-share-tech text-sm text-center mb-6">Se cancelará la entrada y se te devolverá el <strong>90%</strong> del valor (10% de comisión).</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmCancel(null)}
                  className="cyber-btn flex-1 py-2.5 text-sm cursor-pointer">
                  Volver
                </button>
                <button type="button" onClick={async () => {
                  if (!user || !confirmCancel) return
                  setCancelling(confirmCancel.id)
                  const ev = confirmCancel.events || {}
                  const priceNum = confirmCancel.total || 0
                  const refundAmount = Math.round(priceNum * 0.9)
                  const fee = priceNum - refundAmount
                  await supabase.from('tickets').update({ status: 'cancelada' }).eq('id', confirmCancel.id)
                  const { data: cur } = await supabase.from('balances').select('amount').eq('user_id', user.id).maybeSingle()
                  await supabase.from('balances').upsert({ user_id: user.id, amount: (cur?.amount || 0) + refundAmount }, { onConflict: 'user_id' })
                  await supabase.from('transactions').insert({
                    user_id: user.id, amount: refundAmount, type: 'Devolución parcial',
                    description: `Cancelación de entrada para ${ev.title || 'evento'} (comisión $${fee})`,
                  })
                  if (confirmCancel.events?.organizer_id) {
                    const { data: orgBal } = await supabase.from('balances').select('locked').eq('user_id', confirmCancel.events.organizer_id).maybeSingle()
                    const newOrgLocked = Math.max(0, (orgBal?.locked || 0) - priceNum)
                    await supabase.from('balances').upsert({ user_id: confirmCancel.events.organizer_id, locked: newOrgLocked }, { onConflict: 'user_id' })
                  }
                  setCancelling(null)
                  setConfirmCancel(null)
                  getTickets(user.id).then(setTickets)
                }}
                  disabled={cancelling === confirmCancel.id}
                  className="cyber-btn-active flex-1 py-2.5 text-sm cursor-pointer disabled:opacity-50">
                  {cancelling === confirmCancel.id ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailTicket && (() => {
        const ev = detailTicket.events || {}
        const photos: string[] = ev.photos || []
        const status = getTicketStatus(detailTicket)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDetailTicket(null)}>
            <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] relative overflow-hidden w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-400" />
              {photos[0] ? (
                <div className="h-48 bg-gradient-to-br from-cyan-500 to-fuchsia-500 relative">
                  <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center text-5xl">🎟️</div>
              )}
              <div className="p-6 pt-4 space-y-4">
                <div>
                  <h2 className="font-orbitron font-extrabold uppercase text-lg">{ev.title || 'Evento'}</h2>
                  <p className="font-share-tech text-sm">{ev.date || ''} {ev.hour ? `• ${ev.hour}` : ''}</p>
                </div>
                <div className="flex justify-center py-3">
                  <div className="bg-white p-3 rounded border-2 border-black shadow-[2px_2px_0px_#000]">
                    <QRCodeSVG value={detailTicket.code || String(detailTicket.id)} size={160} level="M" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded border-2 border-black bg-[#f8f9fa]">
                  <span className="font-share-tech text-sm">{t('mis_entradas.codigo')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-share-tech text-sm font-bold">{detailTicket.code || detailTicket.id}</span>
                    <button type="button" onClick={() => handleCopy(detailTicket.code || String(detailTicket.id))}
                      className="text-cyan-500 hover:text-cyan-600 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M8 16h8a2 2 0 002-2V8a2 2 0 00-2-2h-2M8 16v2a2 2 0 002 2h8a2 2 0 002-2v-2a2 2 0 00-2-2h-2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded border-2 border-black bg-[#f8f9fa]">
                  <span className="font-share-tech text-sm">{t('mis_entradas.estado')}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border border-black ${statusCyberBadge[status] || 'bg-emerald-500 text-white border-black'}`}>
                    {statusLabels[status] || t('mis_entradas.valida')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded border-2 border-black bg-[#f8f9fa]">
                  <span className="font-share-tech text-sm">{t('mis_entradas.cantidad')}</span>
                  <span className="font-share-tech text-sm font-bold">{detailTicket.qty || 1}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded border-2 border-black bg-[#f8f9fa]">
                  <span className="font-share-tech text-sm">{t('mis_entradas.total')}</span>
                  <span className="font-orbitron text-sm font-extrabold">${detailTicket.total || 0}</span>
                </div>
                <button type="button" onClick={() => setDetailTicket(null)}
                  className="cyber-btn-active w-full py-2.5 text-sm cursor-pointer">
                  {t('mis_entradas.cerrar')}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {showScrollTop && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded bg-accent text-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center cursor-pointer transition-all hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
