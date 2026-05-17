import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getProfile, getAllEvents } from '../lib/db'
import { supabase } from '../lib/supabase'

export default function Inicio() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<Record<string, any> | null>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('todos')
  const [ticketType, setTicketType] = useState('todos')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!user) return
    getProfile(user.id).then(setProfile)
  }, [user])

  useEffect(() => {
    getAllEvents().then(setEvents)
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('favorites').select('event_id').eq('user_id', user.id).then(({ data }) => {
      if (data) setFavorites(new Set(data.map(f => f.event_id)))
    })
  }, [user])

  const toggleFav = async (eventId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    const isFav = favorites.has(eventId)
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('event_id', eventId)
      setFavorites(prev => { const n = new Set(prev); n.delete(eventId); return n })
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, event_id: eventId })
      setFavorites(prev => { const n = new Set(prev); n.add(eventId); return n })
    }
  }

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const months: Record<string, number> = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isPast = (dateStr: string) => {
    const m = dateStr.match(/^(\d+)\s+(\w+)\s+(\d+)$/)
    if (!m) return false
    return new Date(parseInt(m[3]), months[m[2].toLowerCase()], parseInt(m[1])) < today
  }

  const allEvents = events
    .filter((ev: any) => !ev.date || !isPast(ev.date))
    .map((ev: any) => ({
    id: ev.id,
    title: ev.title,
    date: ev.date || 'Próximamente',
    location: ev.city || 'Colombia',
    price: ev.price || 'Gratis',
    attendees: 0,
    cover: ev.photos?.[0] || null,
    cat: ev.category || 'General',
    type: ev.type || 'Pagado',
    photos: ev.photos || [],
  }))

  const popularEvents = [...allEvents].sort((a, b) => b.attendees - a.attendees).slice(0, 6)
  const eventCategories = [...new Set(allEvents.map((e) => e.cat))].sort()

  const filters = [
    { key: 'todos', label: t('inicio.todos'), count: allEvents.length },
    { key: 'populares', label: t('inicio.destacados'), count: popularEvents.length },
  ]

  const clearFilters = () => {
    setSearch('')
    setActiveFilter('todos')
    setTicketType('todos')
    setCategoryFilter('todos')
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const hasActiveFilters = search || activeFilter !== 'todos' || ticketType !== 'todos' || categoryFilter !== 'todos'

  const getFilteredEvents = () => {
    let result = allEvents
    if (activeFilter === 'populares') {
      result = popularEvents
    }
    if (categoryFilter !== 'todos') {
      result = result.filter((e) => e.cat.toLowerCase() === categoryFilter.toLowerCase())
    }
    if (ticketType !== 'todos') {
      result = result.filter((e) => e.type === ticketType)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.cat.toLowerCase().includes(q)
      )
    }
    return result
  }

  const displayEvents = getFilteredEvents()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('inicio.bienvenido')}, {profile?.nombre || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'} 👋
        </h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {profile?.ubicacion || 'Colombia'}
        </div>
      </div>

      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('inicio.buscar')}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('inicio.tipo')}:</span>
        <div className="flex gap-1.5">
          {[
            { key: 'todos', label: t('inicio.todos') },
            { key: 'Gratis', label: t('inicio.gratis') },
            { key: 'Pagado', label: t('inicio.pagado') },
            { key: 'VIP', label: t('inicio.vip') },
          ].map((t2) => (
            <button
              key={t2.key}
              type="button"
              onClick={() => setTicketType(t2.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                ticketType === t2.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t2.label}
            </button>
          ))}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
          >
            {t('inicio.limpiar')}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === f.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            {f.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
              activeFilter === f.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button type="button" onClick={() => setCategoryFilter('todos')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            categoryFilter === 'todos'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}>
          Ver todo
        </button>
        {eventCategories.map((cat) => (
          <button key={cat} type="button" onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              categoryFilter === cat
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {displayEvents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="text-sm text-gray-500">{t('inicio.no_resultados')}</p>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
            >
              {t('inicio.limpiar_busqueda')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer relative"
                  >
                    <button type="button" onClick={(e) => toggleFav(event.id, e)}
                      className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        favorites.has(event.id) ? 'bg-red-500 text-white' : 'bg-black/20 text-white/80 hover:bg-black/40 hover:text-white'
                      }`}>
                      <svg className="w-3.5 h-3.5" fill={favorites.has(event.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <Link to={`/evento/${event.id}`}>
                      <div className={`h-28 relative ${!event.cover ? `bg-gradient-to-br from-indigo-500 to-fuchsia-500` : ''}`}>
                        {event.cover && typeof event.cover === 'string' && event.cover.startsWith('data:') ? (
                          <img src={event.cover} alt="" className="w-full h-full object-cover" />
                        ) : event.cover && typeof event.cover === 'string' && !event.cover.startsWith('from-') ? (
                          <img src={event.cover} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-2xl">🎉</div>
                        )}
                      </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {event.title}
                      </h3>
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-500">
                        {event.cat}
                      </span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        event.type === 'Gratis' ? 'bg-green-100 text-green-700' :
                        event.type === 'VIP' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {event.date}
                      <span className="mx-1 text-gray-300">|</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm font-bold text-gray-900">{event.price}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.attendees}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )
          )}
        </div>
      )}

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all hover:scale-110 cursor-pointer z-50"
          aria-label="Volver al inicio"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}