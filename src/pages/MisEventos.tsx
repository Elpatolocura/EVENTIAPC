import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getEvents, deleteEvent } from '../lib/db'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import { formatPrice } from '../lib/price'

export default function MisEventos() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [cancelEventId, setCancelEventId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (user) getEvents(user.id).then(async (evts) => {
      const ids = evts.map((e: any) => e.id)
      const counts: Record<string, number> = {}
      if (ids.length > 0) {
        const { data: ticketData } = await supabase.from('tickets').select('event_id').in('event_id', ids)
        if (ticketData) {
          for (const t of ticketData) {
            counts[t.event_id] = (counts[t.event_id] || 0) + 1
          }
        }
      }
      setEvents(evts.map((e: any) => ({ ...e, _ticketCount: counts[e.id] || 0 })))
    })
  }, [user])

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await deleteEvent(deleteId)
    if (!error) {
      setEvents((prev) => prev.filter((e) => e.id !== deleteId))
      setDeleteId(null)
    }
  }

  const handleCancelEvent = async () => {
    if (!cancelEventId || !user) return
    setCancelling(true)
    const { data: tickets } = await supabase.from('tickets').select('id, user_id, total').eq('event_id', cancelEventId).eq('status', 'válida')
    let totalRefund = 0
    if (tickets) {
      for (const t of tickets) {
        totalRefund += t.total || 0
        await supabase.from('tickets').update({ status: 'cancelada' }).eq('id', t.id)
        const { data: bal } = await supabase.from('balances').select('amount').eq('user_id', t.user_id).maybeSingle()
        await supabase.from('balances').upsert({ user_id: t.user_id, amount: (bal?.amount || 0) + (t.total || 0) }, { onConflict: 'user_id' })
        await supabase.from('transactions').insert({
          user_id: t.user_id, amount: t.total || 0, type: 'Devolución total',
          description: `Evento cancelado por el organizador`,
        })
      }
    }
    await supabase.from('balances').upsert({ user_id: user.id, locked: 0 }, { onConflict: 'user_id' })
    await supabase.from('events').update({ status: 'cancelado' }).eq('id', cancelEventId)
    setCancelling(false)
    setCancelEventId(null)
    getEvents(user.id).then((evts) => setEvents(evts))
  }

  return (
    <>
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('mis_eventos.titulo')}</h1>
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <span className="text-4xl block mb-3">📅</span>
          <p className="text-sm text-gray-500">{t('mis_eventos.vacio')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-32 relative bg-gradient-to-br from-indigo-500 to-fuchsia-500">
                {event.photos?.[0] && (
                  <img src={event.photos[0]} alt="" className="w-full h-full object-cover absolute inset-0" />
                )}
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-semibold z-10 ${event.status === 'borrador' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                  {event.status === 'borrador' ? t('mis_eventos.borrador') : t('mis_eventos.publicado')}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>{event.date}{event.hour ? ` • ${event.hour}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{[event.address, event.city].filter(Boolean).join(', ') || 'Ubicación no especificada'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{event.type === 'Gratis' ? 'Gratis' : formatPrice(event.price)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {event._ticketCount || 0}/{event.capacity || 0}
                  </div>
                  <div className="flex items-center gap-2">
                    {event.status === 'borrador' && (
                      <button type="button" onClick={() => setDeleteId(event.id)}
                        className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Eliminar
                      </button>
                    )}
                    {event.status === 'publicado' && event._ticketCount > 0 && (
                      <button type="button" onClick={() => setCancelEventId(event.id)}
                        className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Cancelar evento
                      </button>
                    )}
                    <button type="button" onClick={() => navigate(`/editar-evento/${event.id}`)}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      {t('mis_eventos.editar')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {deleteId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
        <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar evento</h3>
          <p className="text-sm text-gray-600 mb-6">¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setDeleteId(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">Cancelar</button>
            <button type="button" onClick={handleDelete}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer">Eliminar</button>
          </div>
        </div>
      </div>
    )}

    {cancelEventId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCancelEventId(null)}>
        <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4" onClick={(e) => e.stopPropagation()}>
          <span className="text-4xl block mb-3 text-center">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Cancelar evento</h3>
          <p className="text-sm text-gray-600 mb-6 text-center">Se devolverá el dinero completo a todos los compradores y el evento quedará cancelado.</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setCancelEventId(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">Volver</button>
            <button type="button" onClick={handleCancelEvent} disabled={cancelling}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer">
              {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
)
}
