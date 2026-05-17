import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTickets, markExpiredTickets } from '../lib/db'
import { useLanguage } from '../context/LanguageContext'

const statusColors: Record<string, string> = {
  válida: 'bg-green-100 text-green-700',
  usada: 'bg-gray-100 text-gray-500',
  cancelada: 'bg-red-100 text-red-600',
}

export default function MisEntradas() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [filter, setFilter] = useState<'todas' | 'válida' | 'usada' | 'cancelada'>('todas')
  const [detailTicket, setDetailTicket] = useState<any>(null)

  useEffect(() => {
    if (user) {
      markExpiredTickets(user.id).then(() => getTickets(user.id).then(setTickets))
    }
  }, [user])

  const filtered = filter === 'todas' ? tickets : tickets.filter((t) => t.status === filter)
  const grouped = Object.values(
    filtered.reduce((acc: any, t: any) => {
      const id = t.event_id
      if (!acc[id]) acc[id] = { ...t }
      else {
        acc[id].qty = (acc[id].qty || 1) + (t.qty || 1)
        acc[id].total = (acc[id].total || 0) + (t.total || 0)
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

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('mis_entradas.titulo')}</h1>

      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${filter === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <span className="text-4xl block mb-3">🎫</span>
          <p className="text-sm text-gray-500">{t('mis_entradas.vacia')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((ticket: any) => {
            const ev = ticket.events || {}
            return (
              <div key={ticket.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row">
                <div className="sm:w-48 p-5 flex flex-col justify-center items-center text-white bg-gradient-to-br from-indigo-500 to-fuchsia-500">
                  <span className="text-3xl mb-1">🎟️</span>
                  <p className="text-xs font-medium opacity-80">{ticket.code || ticket.id}</p>
                  <p className="text-lg font-bold">{ticket.qty || 1} {t('mis_entradas.boleto')}</p>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">{ev.title || 'Evento'}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${statusColors[ticket.status] || 'bg-gray-100 text-gray-500'}`}>
                        {statusLabels[ticket.status] || t('mis_entradas.valida')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {ev.date || 'Próximamente'}
                      <span className="mx-1.5 text-gray-300">|</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {ev.location || 'Colombia'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">${ticket.total || 0}</p>
                    <button type="button" onClick={() => setDetailTicket(ticket)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer">{t('mis_entradas.ver_detalle')}</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {detailTicket && (() => {
        const ev = detailTicket.events || {}
        const photos: string[] = ev.photos || []
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDetailTicket(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {photos[0] ? (
                <div className="h-48 bg-gradient-to-br from-indigo-500 to-fuchsia-500 relative">
                  <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-5xl">🎟️</div>
              )}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{ev.title || 'Evento'}</h2>
                  <p className="text-sm text-gray-500">{ev.date || ''} {ev.hour ? `• ${ev.hour}` : ''}</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-gray-600">{t('mis_entradas.codigo')}</span>
                  <span className="text-sm font-semibold text-gray-900">{detailTicket.code || detailTicket.id}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-gray-600">{t('mis_entradas.estado')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[detailTicket.status] || 'bg-green-100 text-green-700'}`}>
                    {statusLabels[detailTicket.status] || t('mis_entradas.valida')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-gray-600">{t('mis_entradas.cantidad')}</span>
                  <span className="text-sm font-semibold text-gray-900">{detailTicket.qty || 1}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-sm text-gray-600">{t('mis_entradas.total')}</span>
                  <span className="text-sm font-semibold text-gray-900">${detailTicket.total || 0}</span>
                </div>
                <button type="button" onClick={() => setDetailTicket(null)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer">
                  {t('mis_entradas.cerrar')}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
