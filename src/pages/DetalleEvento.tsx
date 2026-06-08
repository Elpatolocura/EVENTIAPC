import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getBalance, getEventById, createReview, getProfile } from '../lib/db'
import { formatPrice, parsePrice } from '../lib/price'
import { supabase } from '../lib/supabase'
import { PageSkeleton } from '../components/Skeletons'
import LazyImage from '../components/LazyImage'

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
  const [reportDetails, setReportDetails] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [sendingReport, setSendingReport] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [fullScreenCarousel, setFullScreenCarousel] = useState(false)
  const [copied, setCopied] = useState(false)
  const [orgRating, setOrgRating] = useState(0)
  const [orgReviewCount, setOrgReviewCount] = useState(0)
  const [qty, setQty] = useState(1)
  const [isForOther, setIsForOther] = useState(false)
  const [guestNames, setGuestNames] = useState<string[]>([''])
  const [chatToast, setChatToast] = useState<string | null>(null)
  const descMaxLen = 150

  useEffect(() => {
    setGuestNames((prev) => {
      if (prev.length === qty) return prev
      if (prev.length < qty) return [...prev, ...Array(qty - prev.length).fill('')]
      return prev.slice(0, qty)
    })
  }, [qty])

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 300) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    if (!id) return
    getEventById(id).then((ev) => {
      if (ev) {
        setEvent(normalizeEvent(ev))
        if (ev.organizer_id) getProfile(ev.organizer_id).then(setOrganizerProfile)
      }
      setLoading(false)
    })
  }, [id])
  useEffect(() => {
    if (!id || !user) return
    supabase.from('tickets').select('id').eq('event_id', id).eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data) setHasTicket(true)
    })
  }, [id, user])
  useEffect(() => {
    if (!id) return
    supabase.from('reviews').select('rating').eq('event_id', id).then(({ data }) => {
      if (data && data.length > 0) {
        const avg = Math.round(data.reduce((s, r) => s + r.rating, 0) / data.length)
        setOrgRating(avg)
        setOrgReviewCount(data.length)
      }
    })
  }, [id, reviews])
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

  const handleShare = async () => {
    const shareData = {
      title: event?.title || 'Evento en Eventia',
      text: `¡Mira este evento: ${event?.title}! 🎉`,
      url: window.location.href,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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

  const playErrorSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      g.gain.setValueAtTime(0.2, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }

  const dbPhotos: string[] = Array.isArray(event?.photos) ? event.photos : []
  const photos: string[] = dbPhotos.length > 0
    ? dbPhotos
    : Array.from({ length: 5 }, (_, i) => `https://picsum.photos/seed/${event?.id || id}-${i}/800/400`)

  const priceNum = event ? parsePrice(event.price) : 0
  const totalPrice = priceNum * qty
  const canUseBalance = balance >= totalPrice

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
            qty: qty,
            total: totalPrice,
            code: `ENT-${Date.now().toString(36).toUpperCase()}`,
            guests: guestNames.some((n) => n.trim()) ? guestNames.filter((n) => n.trim()) : null,
          })
          const { data: current } = await supabase.from('balances').select('amount').eq('user_id', user.id).maybeSingle()
          const newAmount = (current?.amount || 0) - totalPrice
          await supabase.from('balances').upsert({ user_id: user.id, amount: newAmount }, { onConflict: 'user_id' })
          setBalance(newAmount)
          const { data: orgBalance } = await supabase.from('balances').select('amount, locked').eq('user_id', event.organizer_id).maybeSingle()
          const newLocked = (orgBalance?.locked || 0) + totalPrice
          await supabase.from('balances').upsert({ user_id: event.organizer_id, locked: newLocked }, { onConflict: 'user_id' })
          await supabase.from('transactions').insert({
            user_id: event.organizer_id,
            amount: totalPrice,
            type: 'Venta de entrada',
            description: `Venta de entrada para ${event.title || 'evento'} - ${user.email || 'comprador'}${guestNames.some((n) => n.trim()) ? ' - Invitados: ' + guestNames.filter((n) => n.trim()).join(', ') : ''}`,
          })
        }
        setPaymentStep('success')
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [paymentStep])

  if (!event) {
    if (loading) {
      return (
        <div className="pt-8">
          <PageSkeleton />
        </div>
      )
    }
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <span className="text-5xl block mb-4">🔍</span>
        <h2 className="text-xl font-orbitron font-extrabold uppercase text-gray-900 mb-2">{t('evento.no_encontrado')}</h2>
        <p className="text-sm font-share-tech text-slate-600 mb-6">{t('evento.no_existe')}</p>
        <Link to="/" className="cyber-btn-active inline-block px-6 py-2.5 rounded-xl border-2 border-black text-sm font-orbitron font-bold shadow-[2px_2px_0px_#000]">{t('evento.volver_inicio')}</Link>
      </div>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto pb-20 lg:pb-0 ${scrolled ? 'pt-[60px]' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-share-tech text-slate-600 hover:text-gray-700 transition-colors cursor-pointer border-2 border-black px-3 py-1.5 rounded-xl cyber-btn shadow-[2px_2px_0px_#000]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('evento.volver')}
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-share-tech font-bold transition-colors cursor-pointer border-2 border-black cyber-btn shadow-[2px_2px_0px_#000]">
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-green-600">Copiado</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                <span>Compartir</span>
              </>
            )}
          </button>
          <button type="button" onClick={() => setShowReport(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border-2 border-black cyber-btn shadow-[2px_2px_0px_#000]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
          </button>
        </div>
      </div>

      <div className={`fixed top-0 left-0 right-0 z-50 bg-[#f8f9fa] border-b-2 border-black shadow-[0_2px_0px_#000] transition-transform duration-300 ${scrolled ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${event.cover} shrink-0 overflow-hidden border-2 border-black`}>
            <img src={photos[0]} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-orbitron font-extrabold uppercase text-gray-900 truncate">{event.title}</h2>
            <p className="text-xs font-share-tech text-slate-600">{event.date} • {event.hour}</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={toggleFav}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 border-2 border-black ${isFav ? 'bg-amber-400 text-white shadow-[2px_2px_0px_#000]' : 'cyber-btn shadow-[2px_2px_0px_#000]'}`}>
              <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
            <button type="button" onClick={handleShare}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border-2 border-black cyber-btn shadow-[2px_2px_0px_#000]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden mb-6 h-56 sm:h-64 select-none border-2 border-black shadow-[3px_3px_0px_#000]">
        <div className="flex transition-transform duration-300 h-full" style={{ transform: `translateX(-${currentPhoto * 100}%)` }}>
          {photos.map((src, i) => (
            <div key={i} className="min-w-full shrink-0 h-full cursor-pointer" onClick={() => setFullScreenCarousel(true)}>
              <LazyImage src={src} alt={`Evento foto ${i + 1}`} fallbackGradient={event.cover} fallbackEmoji="🎉" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer z-20 border-2 border-black">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button type="button" onClick={() => setCurrentPhoto((prev) => (prev + 1) % photos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer z-20 border-2 border-black">
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
            className={`w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center transition-colors cursor-pointer ${isFav ? 'bg-amber-400/80 text-white shadow-[2px_2px_0px_#000]' : 'bg-white/20 text-white hover:bg-white/30'}`}>
            <svg className="w-4.5 h-4.5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 p-6 z-10 transition-opacity duration-200 ${currentPhoto === 0 ? '' : 'opacity-50 hover:opacity-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-orbitron font-bold backdrop-blur-sm uppercase">{event.cat}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-orbitron font-bold uppercase ${event.type === 'Gratis' ? 'bg-green-100 text-green-800' : event.type === 'VIP' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{event.type}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-orbitron font-extrabold uppercase text-white">{event.title}</h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
          <h2 className="text-sm font-orbitron font-extrabold uppercase text-gray-900 mb-4">{t('evento.acerca')}</h2>
          <p className="text-sm font-share-tech text-slate-600 leading-relaxed">
            {descExpanded || event.desc.length <= descMaxLen ? event.desc : event.desc.slice(0, descMaxLen) + '...'}
          </p>
          {event.desc.length > descMaxLen && (
            <button type="button" onClick={() => setDescExpanded(!descExpanded)}
              className="mt-2 text-xs font-orbitron font-bold uppercase cyber-btn-active border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_#000] cursor-pointer">
              {descExpanded ? t('evento.ver_menos') : t('evento.ver_mas')}
            </button>
          )}
        </div>

        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
          <h2 className="text-sm font-orbitron font-extrabold uppercase text-gray-900 mb-4">{t('evento.detalles')}</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            {[
              { icon: '📅', label: t('evento.fecha'), value: event.date }, { icon: '⏰', label: t('evento.hora'), value: event.hour },
              { icon: '⏳', label: t('evento.duracion'), value: event.duration }, { icon: '📍', label: t('evento.direccion'), value: event.address },
              { icon: '👤', label: t('evento.organizador'), value: event.organizer }, { icon: '🔞', label: t('evento.edad_minima'), value: event.age },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-2.5">
                <span className="text-lg">{d.icon}</span>
                <div>
                  <p className="text-xs font-share-tech text-slate-600 uppercase">{d.label}</p>
                  {d.icon === '📍' && d.value ? (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.value + (event.city ? ', ' + event.city : ''))}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-orbitron font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                      {d.value}
                    </a>
                  ) : (
                    <p className="text-sm font-orbitron font-bold text-gray-900">{d.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
          <h2 className="text-sm font-orbitron font-extrabold uppercase text-gray-900 mb-4">{t('evento.servicios')}</h2>
          <div className="flex flex-wrap gap-2">
            {event.parking && <span className="px-3 py-1.5 rounded-lg bg-green-50 border-2 border-black text-xs font-orbitron font-bold text-green-700">🅿️ {t('evento.estacionamiento')}</span>}
            {event.accessibility && <span className="px-3 py-1.5 rounded-lg bg-blue-50 border-2 border-black text-xs font-orbitron font-bold text-blue-700">♿ {t('evento.accesibilidad')}</span>}
            <span className="px-3 py-1.5 rounded-lg bg-gray-50 border-2 border-black text-xs font-orbitron font-bold text-slate-600">🎟️ {event.attendees}/{event.capacity} {t('evento.asistentes')}</span>
          </div>
        </div>

        {event.address && (
          <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
            <h2 className="text-sm font-orbitron font-extrabold uppercase text-gray-900 mb-4">{t('evento.ubicacion')}</h2>
            <div className="rounded-xl overflow-hidden border-2 border-black mb-3">
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=-74.5,4.5,-74.0,5.0&layer=mapnik&marker=4.7,-74.2`}
                width="100%" height="200" style={{ border: 0 }}
                loading="lazy"
                title={event.address}
              />
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address + (event.city ? ', ' + event.city : ''))}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs font-orbitron font-bold uppercase cyber-btn-active border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_#000] inline-block">
              {t('evento.abrir_maps')} →
            </a>
          </div>
        )}

        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
          <p className="text-xs font-orbitron font-extrabold uppercase text-accent tracking-wider mb-3">{t('evento.organizador_label')}</p>
          <button type="button" onClick={() => navigate(`/perfil/${event.organizer_id}`)}
            className="w-full flex items-center gap-3 text-left hover:bg-white/60 p-2.5 rounded-xl transition-colors cursor-pointer mb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-orbitron font-bold shrink-0 shadow-[2px_2px_0px_#000] overflow-hidden border-2 border-black ${!organizerProfile?.avatar_url ? 'bg-gradient-to-br ' + event.cover : ''}`}>
              {organizerProfile?.avatar_url ? (
                <img src={organizerProfile.avatar_url} alt="Organizador" className="w-full h-full object-cover" />
              ) : (
                event.organizer.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-orbitron font-extrabold uppercase text-gray-900">{event.organizer}</p>
              {orgRating > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => (<span key={s} className="text-xs">{s <= orgRating ? '⭐' : '☆'}</span>))}</div>
                  <span className="text-xs font-share-tech text-slate-600">({orgReviewCount})</span>
                </div>
              )}
              <p className="text-xs font-share-tech text-accent font-bold uppercase">{t('evento.ver_perfil')}</p>
            </div>
          </button>
          <div className="space-y-2">
            {(organizerProfile?.email || event.email) && (
              <a href={`mailto:${organizerProfile?.email || event.email}`} className="flex items-center gap-2.5 text-sm font-share-tech text-slate-600 hover:text-accent p-2 rounded-lg hover:bg-white/60 transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {organizerProfile?.email || event.email}
              </a>
            )}
            {event.phone && (
              <a href={`tel:${event.phone}`} className="flex items-center gap-2.5 text-sm font-share-tech text-slate-600 hover:text-accent p-2 rounded-lg hover:bg-white/60 transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                +57 {event.phone}
              </a>
            )}
          </div>
        </div>

        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-orbitron font-extrabold uppercase text-gray-900">{t('evento.resenas')}</h2>
            <span className="text-xs font-share-tech text-slate-600">{reviews.length} {t('evento.resenas')}</span>
          </div>
          {hasTicket && user ? (
            <div className="mb-4 p-4 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000]">
              <p className="text-xs font-share-tech text-slate-600 uppercase mb-2">{t('evento.deja_resena')}</p>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setNewRating(star)}
                    className="text-lg hover:scale-110 transition-transform cursor-pointer">{star <= newRating ? '⭐' : '☆'}</button>
                ))}
              </div>
              <textarea value={newReviewText} onChange={(e) => setNewReviewText(e.target.value)} placeholder={t('evento.escribe_opinion')} rows={2}
                className="w-full px-3 py-2 rounded-xl cyber-input text-sm resize-none mb-2" />
              <button type="button" onClick={handleSubmitReview}
                disabled={!newRating || !newReviewText.trim() || !user}
                className="cyber-btn-active border-2 border-black px-4 py-1.5 rounded-xl text-xs font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">{t('evento.publicar')}</button>
            </div>
          ) : user ? (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-share-tech text-amber-700">
              {t('evento.compra_para_resenar')}
            </div>
          ) : null}
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-2 p-2 rounded-xl hover:bg-white/60 border-2 border-transparent hover:border-black transition-all">
              <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-black flex items-center justify-center text-sm shrink-0">👤</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-sm font-orbitron font-bold text-gray-900">{r.profiles?.nombre || 'Usuario'}</span><span className="text-xs font-share-tech text-slate-600">{new Date(r.created_at).toLocaleDateString()}</span></div>
                <div className="flex gap-0.5 my-0.5">{[1, 2, 3, 4, 5].map((s) => (<span key={s} className="text-xs">{s <= r.rating ? '⭐' : '☆'}</span>))}</div>
                <p className="text-sm font-share-tech text-slate-600 leading-relaxed">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-20 right-6 z-40 w-10 h-10 rounded-xl bg-accent text-black border-2 border-black shadow-[3px_3px_0px_#000] transition-all duration-200 flex items-center justify-center cursor-pointer hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#f8f9fa] border-t-2 border-black px-4 py-3 flex items-center justify-between shadow-[0_-4px_0px_#000]">
        <div>
          <p className="text-2xl font-orbitron font-bold text-accent-secondary tracking-wider">{formatPrice(event.price)}</p>
          <p className="text-xs font-share-tech text-slate-600 uppercase">{t('evento.por_persona')}</p>
        </div>
        <div className="flex items-center gap-2">
          {(hasTicket || user?.id === event.organizer_id) ? (
            <Link to={`/chat/${event.id}`}
              className="cyber-btn-active border-2 border-black px-4 py-3 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {t('evento.chat')}
            </Link>
          ) : (
            <button type="button" onClick={() => {
              playErrorSound()
              setChatToast('Debes adquirir una entrada para acceder al chat')
              setTimeout(() => setChatToast(null), 3000)
            }}
              className="cyber-btn border-2 border-black px-4 py-3 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {t('evento.chat')}
            </button>
          )}
          <Link to="/mis-entradas"
            className="cyber-btn border-2 border-black px-4 py-3 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            {t('evento.entradas')}
          </Link>
          <button type="button" onClick={() => { setShowPayment(true); setQty(1); setIsForOther(false); setGuestNames(['']) }}
            className="cyber-btn-active border-2 border-black px-8 py-3 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer">{t('evento.comprar')}</button>
        </div>
      </div>

      {chatToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] font-share-tech text-sm font-bold">
          {chatToast}
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] p-6 w-full max-w-md mx-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
            {paymentStep === 'success' ? (
              <div className="text-center py-4">
                <span className="text-4xl block mb-3">✅</span>
                <h3 className="text-lg font-orbitron font-extrabold uppercase text-gray-900 mb-1">{t('pago.exitoso')}</h3>
                <p className="text-sm font-share-tech text-slate-600 mb-1">{t('pago.adquiriste')} {qty} {qty === 1 ? 'entrada' : 'entradas'} {t('pago.para')} <strong className="font-orbitron">{event.title}</strong></p>
                <p className="text-sm font-share-tech text-slate-600 mb-6">{t('pago.por')} {formatPrice(event.price)} {qty > 1 ? `c/u — ${t('pago.total')} ${formatPrice(totalPrice)}` : ''}</p>
                <Link to="/mis-entradas" className="cyber-btn-active border-2 border-black inline-block px-6 py-2 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000]">{t('pago.ver_entradas')}</Link>
              </div>
            ) : paymentStep === 'processing' ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 animate-spin text-accent mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <h3 className="text-lg font-orbitron font-extrabold uppercase text-gray-900 mb-1">{t('pago.procesando')}</h3>
                <p className="text-sm font-share-tech text-slate-600">{t('pago.espera')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-orbitron font-extrabold uppercase text-gray-900">{t('pago.metodo')}</h3>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-share-tech text-slate-600 uppercase">{t('evento.tipo_entrada')}:</span>
                  <span className="text-xs font-orbitron font-bold uppercase text-accent-secondary">{event.type || 'General'}</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <button type="button" onClick={() => setIsForOther(false)}
                    className={`cyber-btn-active border-2 border-black px-4 py-2 rounded-xl text-xs font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer ${!isForOther ? 'cyber-btn-active' : 'cyber-btn'}`}>
                    {t('evento.para_mi')}
                  </button>
                  <button type="button" onClick={() => setIsForOther(true)}
                    className={`cyber-btn-active border-2 border-black px-4 py-2 rounded-xl text-xs font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer ${isForOther ? 'cyber-btn-active' : 'cyber-btn'}`}>
                    {t('evento.para_otro')}
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-share-tech text-slate-600 uppercase">{t('evento.cantidad')}:</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}
                      className="cyber-btn border-2 border-black w-8 h-8 rounded-xl flex items-center justify-center text-sm font-orbitron font-bold shadow-[2px_2px_0px_#000] disabled:opacity-40 cursor-pointer">−</button>
                    <span className="w-10 text-center font-orbitron font-bold text-lg">{qty}</span>
                    <button type="button" onClick={() => setQty(Math.min(10, qty + 1))} disabled={qty >= 10}
                      className="cyber-btn border-2 border-black w-8 h-8 rounded-xl flex items-center justify-center text-sm font-orbitron font-bold shadow-[2px_2px_0px_#000] disabled:opacity-40 cursor-pointer">+</button>
                  </div>
                </div>

                {isForOther && (
                  <div className="mb-4 space-y-2">
                    {guestNames.map((name, i) => (
                      <input key={i} type="text" value={name} onChange={(e) => {
                        const next = [...guestNames]
                        next[i] = e.target.value
                        setGuestNames(next)
                      }} placeholder={`${t('evento.nombre_invitado')} ${i + 1}`}
                        className="cyber-input w-full px-3 py-2 rounded-xl text-sm" />
                    ))}
                  </div>
                )}

                <button type="button" onClick={() => setPaymentStep('processing')} disabled={!canUseBalance}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-black text-left transition-all cursor-pointer mb-4 cyber-btn-active shadow-[2px_2px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed">
                  <div className="w-10 h-10 rounded-xl bg-green-100 border-2 border-black flex items-center justify-center text-lg shadow-[2px_2px_0px_#000]">💰</div>
                  <div className="flex-1"><p className="text-sm font-orbitron font-bold uppercase text-gray-900">{t('pago.balance')}</p><p className="text-xs font-share-tech text-slate-600">${balance.toLocaleString('es-CO')}</p></div>
                </button>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPayment(false)}
                    className="cyber-btn border-2 border-black flex-1 py-2.5 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer">{t('pago.cancelar')}</button>
                  <button type="button" onClick={() => setPaymentStep('processing')} disabled={!canUseBalance}
                    className="cyber-btn-active border-2 border-black flex-1 py-2.5 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">{t('pago.pagar')} {formatPrice(totalPrice)}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] p-6 w-full max-w-md mx-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400"></div>
            {reportSent ? (
              <div className="text-center py-4">
                <span className="text-4xl block mb-3">✅</span>
                <h3 className="text-lg font-orbitron font-extrabold uppercase text-gray-900 mb-1">{t('reporte.enviado')}</h3>
                <p className="text-sm font-share-tech text-slate-600 mb-6">{t('reporte.gracias')}</p>
                <button type="button" onClick={() => { setShowReport(false); setReportSent(false); setReportReason(''); setReportDetails('') }}
                  className="cyber-btn-active border-2 border-black px-6 py-2 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer">{t('reporte.cerrar')}</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-orbitron font-extrabold uppercase text-gray-900 mb-2">{t('reporte.titulo')}</h3>
                <p className="text-sm font-share-tech text-slate-600 mb-5">{t('reporte.desc')}</p>
                {[
                  { value: 'spam', label: t('reporte.spam') }, { value: 'contenido', label: t('reporte.contenido') },
                  { value: 'estafa', label: t('reporte.estafa') }, { value: 'informacion', label: t('reporte.informacion') }, { value: 'otro', label: t('reporte.otro') },
                ].map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setReportReason(opt.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left mb-2 transition-all cursor-pointer ${reportReason === opt.value ? 'border-red-500 bg-red-50/50 shadow-[2px_2px_0px_#ef4444]' : 'border-black bg-white shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]'}`}>
                    <span className="text-sm font-share-tech text-gray-900 flex-1">{opt.label}</span>
                    {reportReason === opt.value && <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                  </button>
                ))}
                <div className="mt-4">
                  <label className="block text-xs font-share-tech text-slate-600 uppercase mb-1.5">{t('reporte.detalles_label')}</label>
                  <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)}
                    placeholder={t('reporte.detalles_placeholder')}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl cyber-input text-sm resize-none" />
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => { setShowReport(false); setReportReason(''); setReportDetails('') }}
                    className="cyber-btn border-2 border-black flex-1 py-2.5 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer">{t('pago.cancelar')}</button>
                  <button type="button" onClick={async () => {
                    if (!reportReason) return
                    setSendingReport(true)
                    try {
                      const token = (await supabase.auth.getSession()).data.session?.access_token
                      await fetch('https://kuamqlxbaeclxspmlztv.supabase.co/functions/v1/send-report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ type: 'evento', target_id: id, reason: reportReason, details: reportDetails }),
                      })
                      setReportSent(true)
                    } catch { setReportSent(true) }
                    finally { setSendingReport(false) }
                  }} disabled={!reportReason || sendingReport}
                    className="cyber-btn-danger border-2 border-black flex-1 py-2.5 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">{sendingReport ? 'Enviando...' : t('reporte.enviar')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {fullScreenCarousel && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 text-white">
            <span className="text-sm font-orbitron font-bold">{currentPhoto + 1} / {photos.length}</span>
            <button type="button" onClick={() => setFullScreenCarousel(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer border-2 border-white/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <img src={photos[currentPhoto]} alt="Evento" className="max-w-full max-h-full object-contain" />
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => setCurrentPhoto((prev) => (prev - 1 + photos.length) % photos.length)}
                  className="absolute left-4 w-12 h-12 rounded-xl bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer border-2 border-white/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button type="button" onClick={() => setCurrentPhoto((prev) => (prev + 1) % photos.length)}
                  className="absolute right-4 w-12 h-12 rounded-xl bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer border-2 border-white/30">
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
