import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getEvents, updateEvent } from '../lib/db'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

export default function MisEventos() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const editing = events.find((e) => e.id === editingId)

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

  const updateEventField = (field: string, value: string | number | boolean | string[]) =>
    setEvents((prev) => prev.map((e) => (e.id === editingId ? { ...e, [field]: value } : e)))

  const handleSave = async () => {
    if (!editing) return
    const { title, description, category, city, address, price, capacity, date, hour, duration, organizer, phone, age_min, parking, accessibility, pets, type: eType, services, status, photos } = editing
    const { error } = await updateEvent(editing.id, {
      title, description, category, city, address, price, capacity, date, hour, duration, organizer, phone, age_min, photos,
      parking: !!parking, accessibility: !!accessibility, pets: !!pets, type: eType, services, status,
    })
    if (error) {
      alert(t('mis_eventos.error_guardar') || 'Error al guardar los cambios')
      return
    }
    setEditingId(null)
  }

  if (editing) {
    return (
      <>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button type="button" onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('mis_eventos.editar')}</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.titulo_label')}</label>
            <input type="text" value={editing.title || ''} onChange={(e) => updateEventField('title', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.descripcion')}</label>
            <textarea value={editing.description || ''} onChange={(e) => updateEventField('description', e.target.value)} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.categoria')}</label>
              <input type="text" value={editing.category || ''} onChange={(e) => updateEventField('category', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.tipo')}</label>
              <select value={editing.type || 'Pagado'} onChange={(e) => updateEventField('type', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
                <option value="Gratis">Gratis</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={editing.type !== 'Pagado' ? 'hidden' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.precio')}</label>
              <input type="text" value={editing.price || ''} onChange={(e) => updateEventField('price', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.capacidad')}</label>
              <input type="text" value={editing.capacity || ''} onChange={(e) => updateEventField('capacity', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.fecha')}</label>
              <input type="text" value={editing.date || ''} onChange={(e) => updateEventField('date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.hora')}</label>
              <input type="text" value={editing.hour || ''} onChange={(e) => updateEventField('hour', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.ciudad')}</label>
              <input type="text" value={editing.city || ''} onChange={(e) => updateEventField('city', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.direccion')}</label>
              <input type="text" value={editing.address || ''} onChange={(e) => updateEventField('address', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.duracion')}</label>
              <input type="text" value={editing.duration || ''} onChange={(e) => updateEventField('duration', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.edad_min')}</label>
              <input type="text" value={editing.age_min || ''} onChange={(e) => updateEventField('age_min', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.fotos')}</label>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(editing.photos) ? editing.photos : []).map((url: string, i: number) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => updateEventField('photos', (editing.photos as string[]).filter((_, j) => j !== i))}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    const photos = Array.isArray(editing.photos) ? [...editing.photos] : []
                    updateEventField('photos', [...photos, reader.result])
                  }
                  reader.readAsDataURL(file)
                }
                input.click()
              }}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-400 transition-colors cursor-pointer">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('mis_eventos.servicios')}</label>
            <div className="flex flex-wrap gap-2">
              {['estacionamiento', 'accesibilidad', 'mascotas', 'wifi', 'comida', 'sonido', 'proyector', 'seguridad', 'camarinos', 'parqueadero'].map((s) => {
                const sv = (Array.isArray(editing.services) ? editing.services : [])
                return (
                  <button key={s} type="button" onClick={() => updateEventField('services', sv.includes(s) ? sv.filter((x: string) => x !== s) : [...sv, s])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${sv.includes(s) ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={!!editing.parking} onChange={(e) => updateEventField('parking', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              {t('mis_eventos.estacionamiento')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={!!editing.accessibility} onChange={(e) => updateEventField('accessibility', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              {t('mis_eventos.accesibilidad')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={!!editing.pets} onChange={(e) => updateEventField('pets', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              {t('mis_eventos.mascotas')}
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditingId(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">{t('mis_eventos.cancelar')}</button>
            <button type="button" onClick={() => setShowSaveConfirm(true)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer">{t('mis_eventos.guardar')}</button>
          </div>
        </div>
      </div>

      {showSaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSaveConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('mis_eventos.confirmar_guardar')}</h3>
            <p className="text-sm text-gray-600 mb-6">{t('mis_eventos.confirmar_guardar_desc')}</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowSaveConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">{t('mis_eventos.cancelar')}</button>
              <button type="button" onClick={() => { setShowSaveConfirm(false); handleSave() }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer">{t('mis_eventos.guardar')}</button>
            </div>
          </div>
        </div>
      )}
      </>
    )
  }

  return (
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
                    <span>{event.type === 'Gratis' ? 'Gratis' : `${event.price}`}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {event._ticketCount || 0}/{event.capacity || 0}
                  </div>
                  <button type="button" onClick={() => setEditingId(event.id)}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    {t('mis_eventos.editar')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
