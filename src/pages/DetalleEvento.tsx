import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getBalance, getEventById, getReviews, createReview, getTickets, getProfile } from '../lib/db'
import { supabase } from '../lib/supabase'

export default function DetalleEvento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const normalizeEvent = (ev: any) => {
    if (!ev) return null
    return {
      ...ev,
      cat: ev.category || 'General',
      desc: ev.description || '',
      age: ev.age_min || 'Todas las edades',
      email: ev.email || '',
      cover: ev.cover || 'from-indigo-500 to-fuchsia-500',
      attendees: ev.attendees || 0,
    }
  }

  const [event, setEvent] = useState<any>(null)
  const [organizerProfile, setOrganizerProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select')
  const [balance, setBalance] = useState(0)
  const [reviews, setReviews] = useState<any[]>([])
  const [hasTicket, setHasTicket] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newReviewText, setNewReviewText] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showStickyMenu, setShowStickyMenu] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [fullScreenCarousel, setFullScreenCarousel] = useState(false)
  const descMaxLen = 150

  useEffect(() => {
    if (id) {
      setLoading(true)
      getEventById(id).then((ev) => { 
        setEvent(normalizeEvent(ev)); 
        if (ev?.organizer_id) {
          getProfile(ev.organizer_id).then(setOrganizerProfile)
        }
        setLoading(false) 
      })
    }
  }, [id])

  useEffect(() => {
    if (event?.id) {
      getReviews(event.id).then(setReviews)
      if (user) getTickets(user.id).then((tickets) => setHasTicket(tickets.some((t: any) => t.event_id === event.id)))
    }
  }, [event?.id, user])

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 300); setShowMenu(false); setShowStickyMenu(false) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    if (!user || !event) return
    supabase.from('favorites').select('id').eq('user_id', user.id).eq('event_id', event.id).maybeSingle().then(({ data }) => {
      if (data) setIsFav(true)
    })
  }, [user, event])

  const toggleFav = async () => {
    if (!user || !event) return
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('event_id', event.id)
      setIsFav(false)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, event_id: event.id })
      setIsFav(true)
    }
  }

  const handleSubmitReview = async () => {
    if (!newRating || !newReviewText.trim() || !user || !event) return
    const { data } = await createReview({ event_id: event.id, user_id: user.id, rating: newRating, text: newReviewText.trim() })
    if (data) {
      setReviews((prev) => [{ ...data, profiles: { nombre: user.user_metadata?.full_name || user.email?.split('@')[0] } }, ...prev])
      setNewRating(0)
      setNewReviewText('')
    }
  }

  const dbPhotos: string[] = Array.isArray(event?.photos) ? event.photos : []
  const photos: string[] = dbPhotos.length > 0
    ? dbPhotos
    : Array.from({ length: 5 }, (_, i) => `https://picsum.photos/seed/${event?.id || id}-${i}/800/400`)

  const priceNum = event ? Number(String(event.price || '').replace(/[^0-9]/g, '')) : 0
  const canUseBalance = balance >= priceNum

  useEffect(() => {
    if (user) getBalance(user.id).then((d) => setBalance(d?.amount || 0))
  }, [user])

  useEffect(() => {
    if (paymentStep === 'processing') {
      const t = setTimeout(async () => {
        if (user && event) {
          await supabase.from('tickets').insert({
            user_id: user.id,
            event_id: event.id,
            status: 'válida',
            qty: 1,
            total: priceNum,
            code: `ENT-${Date.now().toString(36).toUpperCase()}`,
          })
          const { data: current } = await supabase.from('balances').select('amount').eq('user_id', user.id).maybeSingle()
          const newAmount = (current?.amount || 0) - priceNum
          await supabase.from('balances').upsert({ user_id: user.id, amount: newAmount }, { onConflict: 'user_id' })
          setBalance(newAmount)
        }
        setPaymentStep('success')
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [paymentStep])

  if (!event) {
    if (loading) {
      return (
        <div className="max-w-2xl mx-auto text-center py-20">
          <span className="text-5xl block mb-4">⏳</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cargando evento...</h2>
        </div>
      )
    }
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <span className="text-5xl block mb-4">🔍</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('evento.no_encontrado')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('evento.no_existe')}</p>
        <Link to="/" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700">{t('evento.volver_inicio')}</Link>
      </div>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto pb-20 lg:pb-0 ${scrolled ? 'pt-[60px]' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('evento.volver')}
        </button>
        <div className="relative">
          <button type="button" onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <span className="text-lg">📘</span> {t('evento.facebook')}
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent(event.title + ' - ' + window.location.href)}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <span className="text-lg">💬</span> {t('evento.whatsapp')}
                </a>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(window.location.href); setShowMenu(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <span className="text-lg">🔗</span> {t('evento.copiar')}
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button type="button" onClick={() => { setShowReport(true); setShowMenu(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                  <span className="text-lg">🚩</span> {t('evento.denunciar')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`fixed top-0 left-64 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-transform duration-300 ${scrolled ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${event.cover} shrink-0 overflow-hidden`}>
            <img src={photos[0]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h2>
            <p className="text-xs text-gray-500">{event.date} • {event.hour}</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={toggleFav}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${isFav ? 'text-amber-500' : 'text-gray-400 hover:text-amber-400'}`}>
              <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
            <div className="relative">
              <button type="button" onClick={() => setShowStickyMenu(!showStickyMenu)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
              {showStickyMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowStickyMenu(false)} />
                  <div className="absolute right-0 top-8 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <span className="text-lg">📘</span> {t('evento.facebook')}
                    </a>
                    <a href={`https://wa.me/?text=${encodeURIComponent(event.title + ' - ' + window.location.href)}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <span className="text-lg">💬</span> {t('evento.whatsapp')}
                    </a>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(window.location.href); setShowStickyMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <span className="text-lg">🔗</span> {t('evento.copiar')}
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                <button type="button" onClick={() => { setShowReport(true); setShowStickyMenu(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                      <span className="text-lg">🚩</span> {t('evento.denunciar')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden mb-6 h-56 sm:h-64 select-none">
        <div className="flex transition-transform duration-300 h-full" style={{ transform: `translateX(-${currentPhoto * 100}%)` }}>
          {photos.map((src, i) => (
            <img key={i} src={src} alt={`Evento foto ${i + 1}`} onClick={() => setFullScreenCarousel(true)} className="min-w-full shrink-0 h-full object-cover cursor-pointer" />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer z-20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button type="button" onClick={() => setCurrentPhoto((prev) => (prev + 1) % photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer z-20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-3 right-3 flex gap-1.5 z-20">
              {photos.map((_, i) => (
                <button key={i} type="button" onClick={() => setCurrentPhoto(i)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === currentPhoto ? 'bg-white w-4' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button type="button" onClick={toggleFav}
            className={`w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors cursor-pointer ${isFav ? 'bg-amber-400/80 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
            <svg className="w-4.5 h-4.5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 p-6 z-10 transition-opacity duration-200 ${currentPhoto === 0 ? '' : 'opacity-50 hover:opacity-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm">{event.cat}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${event.type === 'Gratis' ? 'bg-green-100 text-green-800' : event.type === 'VIP' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{event.type}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{event.title}</h1>
        </div>
      </div>

      <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('evento.acerca')}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {descExpanded || event.desc.length <= descMaxLen ? event.desc : event.desc.slice(0, descMaxLen) + '...'}
            </p>
            {event.desc.length > descMaxLen && (
              <button type="button" onClick={() => setDescExpanded(!descExpanded)}
                className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                {descExpanded ? t('evento.ver_menos') : t('evento.ver_mas')}
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('evento.detalles')}</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {[
                { icon: '📅', label: t('evento.fecha'), value: event.date }, { icon: '⏰', label: t('evento.hora'), value: event.hour },
                { icon: '⏳', label: t('evento.duracion'), value: event.duration }, { icon: '📍', label: t('evento.direccion'), value: event.address },
                { icon: '👤', label: t('evento.organizador'), value: event.organizer }, { icon: '🔞', label: t('evento.edad_minima'), value: event.age },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-2.5">
                  <span className="text-lg">{d.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{d.label}</p>
                    {d.icon === '📍' && d.value ? (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.value + (event.city ? ', ' + event.city : ''))}`} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                        {d.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{d.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('evento.servicios')}</h2>
            <div className="flex flex-wrap gap-2">
              {event.parking && <span className="px-3 py-1.5 rounded-lg bg-green-50 text-xs font-medium text-green-700">🅿️ {t('evento.estacionamiento')}</span>}
              {event.accessibility && <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-xs font-medium text-blue-700">♿ {t('evento.accesibilidad')}</span>}
              <span className="px-3 py-1.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-600">🎟️ {event.attendees}/{event.capacity} {t('evento.asistentes')}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">{t('evento.organizador_label')}</p>
            <button type="button" onClick={() => navigate(`/perfil/${event.organizer_id}`)}
              className="w-full flex items-center gap-3 text-left hover:bg-white/60 p-2.5 rounded-xl transition-colors cursor-pointer mb-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm overflow-hidden ${!organizerProfile?.avatar_url ? 'bg-gradient-to-br ' + event.cover : ''}`}>
                {organizerProfile?.avatar_url ? (
                  <img src={organizerProfile.avatar_url} alt="Organizador" className="w-full h-full object-cover" />
                ) : (
                  event.organizer.charAt(0)
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{event.organizer}</p>
                <p className="text-xs text-indigo-600 font-medium">{t('evento.ver_perfil')}</p>
              </div>
            </button>
            <div className="space-y-2">
              {(organizerProfile?.email || event.email) && (
                <a href={`mailto:${organizerProfile?.email || event.email}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-white/60 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {organizerProfile?.email || event.email}
                </a>
              )}
              {event.phone && (
                <a href={`tel:${event.phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-white/60 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  +57 {event.phone}
                </a>
              )}
            </div>
          </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">{t('evento.resenas')}</h2>
                <span className="text-xs text-gray-400">{reviews.length} {t('evento.resenas')}</span>
              </div>
              {hasTicket && user ? (
                <div className="mb-4 p-3 rounded-xl bg-gray-50">
                  <p className="text-xs font-medium text-gray-600 mb-2">{t('evento.deja_resena')}</p>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setNewRating(star)}
                        className="text-lg hover:scale-110 transition-transform cursor-pointer">{star <= newRating ? '⭐' : '☆'}</button>
                    ))}
                  </div>
                  <textarea value={newReviewText} onChange={(e) => setNewReviewText(e.target.value)} placeholder={t('evento.escribe_opinion')} rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-2" />
                  <button type="button" onClick={handleSubmitReview}
                    disabled={!newRating || !newReviewText.trim() || !user}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">{t('evento.publicar')}</button>
                </div>
              ) : user ? (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 text-xs text-amber-700">
                  {t('evento.compra_para_resenar')}
                </div>
              ) : null}
              {reviews.map((r) => (
                <div key={r.id} className="flex gap-2 p-2 rounded-xl hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm shrink-0">👤</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-900">{r.profiles?.nombre || 'Usuario'}</span><span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span></div>
                    <div className="flex gap-0.5 my-0.5">{[1, 2, 3, 4, 5].map((s) => (<span key={s} className="text-xs">{s <= r.rating ? '⭐' : '☆'}</span>))}</div>
                    <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
                  </div>
                </div>
              ))}
          </div>
      </div>

      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-20 right-6 z-40 w-10 h-10 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center cursor-pointer ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>

      <div className="fixed bottom-0 left-64 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div>
          <p className="text-2xl font-bold text-gray-900">{event.price}</p>
          <p className="text-xs text-gray-500">{t('evento.por_persona')}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasTicket && (
            <Link to={`/chat/${event.id}`}
              className="px-4 py-3 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 cursor-pointer flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {t('evento.chat')}
            </Link>
          )}
          <Link to="/mis-entradas"
            className="px-4 py-3 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 cursor-pointer flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            {t('evento.entradas')}
          </Link>
          <button type="button" onClick={() => setShowPayment(true)}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer shadow-lg shadow-indigo-200">{t('evento.comprar')}</button>
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            {paymentStep === 'success' ? (
              <div className="text-center py-4">
                <span className="text-4xl block mb-3">✅</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('pago.exitoso')}</h3>
                <p className="text-sm text-gray-500 mb-1">{t('pago.adquiriste')} <strong>{event.title}</strong></p>
                <p className="text-sm text-gray-500 mb-6">{t('pago.por')} {event.price}</p>
                <Link to="/mis-entradas" className="inline-block px-6 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">{t('pago.ver_entradas')}</Link>
              </div>
            ) : paymentStep === 'processing' ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('pago.procesando')}</h3>
                <p className="text-sm text-gray-500">{t('pago.espera')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-900">{t('pago.metodo')}</h3>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">{event.price}</span>
                </div>
                <button type="button" onClick={() => setPaymentStep('processing')} disabled={!canUseBalance}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer mb-4 border-indigo-500 bg-indigo-50/50">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">💰</div>
                  <div className="flex-1"><p className="text-sm font-medium text-gray-900">{t('pago.balance')}</p><p className="text-xs text-gray-500">${balance.toLocaleString('es-CO')}</p></div>
                  <span className="text-xs font-medium text-green-600">{t('pago.pagar')}</span>
                </button>
                <div className="space-y-2 mb-6">
                  {[
                    { id: 'card', label: t('pago.tarjeta'), icon: '💳' },
                    { id: 'nequi', label: t('pago.nequi'), icon: '📱' },
                    { id: 'daviplata', label: t('pago.daviplata'), icon: '🏦' },
                    { id: 'pse', label: t('pago.pse'), icon: '🏧' },
                  ].map((m) => (
                    <button key={m.id} type="button" onClick={() => setPaymentStep('processing')}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 text-left hover:border-gray-300 cursor-pointer">
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-sm font-medium text-gray-900 flex-1">{m.label}</span>
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setShowPayment(false)}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">{t('pago.cancelar')}</button>
              </>
            )}
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            {reportSent ? (
              <div className="text-center py-4">
                <span className="text-4xl block mb-3">✅</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('reporte.enviado')}</h3>
                <p className="text-sm text-gray-500 mb-6">{t('reporte.gracias')}</p>
                <button type="button" onClick={() => { setShowReport(false); setReportSent(false); setReportReason('') }}
                  className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">{t('reporte.cerrar')}</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('reporte.titulo')}</h3>
                <p className="text-sm text-gray-500 mb-5">{t('reporte.desc')}</p>
                {[
                  { value: 'spam', label: t('reporte.spam') }, { value: 'contenido', label: t('reporte.contenido') },
                  { value: 'estafa', label: t('reporte.estafa') }, { value: 'informacion', label: t('reporte.informacion') }, { value: 'otro', label: t('reporte.otro') },
                ].map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setReportReason(opt.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left mb-2 transition-all cursor-pointer ${reportReason === opt.value ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-sm text-gray-900 flex-1">{opt.label}</span>
                    {reportReason === opt.value && <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                  </button>
                ))}
                <div className="flex gap-3 mt-5">
                  <button type="button" onClick={() => { setShowReport(false); setReportReason('') }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">{t('pago.cancelar')}</button>
                  <button type="button" onClick={() => setReportSent(true)} disabled={!reportReason}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">{t('reporte.enviar')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {fullScreenCarousel && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 text-white">
            <span className="text-sm font-medium">{currentPhoto + 1} / {photos.length}</span>
            <button type="button" onClick={() => setFullScreenCarousel(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <img src={photos[currentPhoto]} alt="Evento" className="max-w-full max-h-full object-contain" />
            
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length)}
                  className="absolute left-4 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" onClick={() => setCurrentPhoto((prev) => (prev + 1) % photos.length)}
                  className="absolute right-4 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
          </div>
          <div className="p-4 flex justify-center gap-2">
            {photos.map((_, i) => (
              <button key={i} type="button" onClick={() => setCurrentPhoto(i)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === currentPhoto ? 'bg-white w-4' : 'bg-white/50'}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
