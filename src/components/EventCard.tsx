import { Link } from 'react-router-dom'
import { formatPrice } from '../lib/price'
import LazyImage from './LazyImage'

interface EventCardProps {
  event: {
    id: any
    title: string
    date: string
    location: string
    price: any
    attendees: number
    cover: string | null
    cat: string
    type: string
    status?: string
    _ticketCount?: number
    capacity?: number
    hour?: string
  }
  isFavorite?: boolean
  onToggleFav?: (eventId: any, e: React.MouseEvent) => void
  isOrganizerView?: boolean
  onDelete?: (eventId: any) => void
  onCancel?: (eventId: any) => void
  onEdit?: (eventId: any) => void
}

export default function EventCard({
  event,
  isFavorite = false,
  onToggleFav,
  isOrganizerView = false,
  onDelete,
  onCancel,
  onEdit,
}: EventCardProps) {
  const isVIP = event.type === 'VIP'
  const isFree = event.type === 'Gratis'
  
  const neonBorderClass = isVIP 
    ? 'cyber-card-vip' 
    : isFree 
      ? 'cyber-card-free'
      : 'cyber-card-regular'

  const badgeClass = isVIP 
    ? 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-700'
    : isFree 
      ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
      : 'bg-cyan-100 border-cyan-400 text-cyan-700'

  return (
    <div
      className={`relative bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] overflow-hidden group flex flex-col justify-between ${neonBorderClass}`}
    >
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20 z-0"></div>
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 z-10"></div>
      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent opacity-50 z-10"></div>

      {!isOrganizerView && onToggleFav && (
        <button
          type="button"
          onClick={(e) => onToggleFav(event.id, e)}
          className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
            isFavorite
              ? 'bg-fuchsia-600 border-fuchsia-300 text-white shadow-[0_0_8px_rgba(217,70,239,0.6)] scale-110'
              : 'bg-white/80 border-cyan-500 text-cyan-600 hover:bg-cyan-500 hover:text-white hover:shadow-[0_0_8px_rgba(6,182,212,0.6)]'
          }`}
        >
          <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      )}

      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-white/90 px-2 py-0.5 rounded border border-slate-200 text-[9px] font-share-tech text-slate-600 shadow-sm">
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOrganizerView ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
        <span>{isOrganizerView ? 'MI_EVENTO' : 'EVENTO_LOCAL'}</span>
      </div>

      <div className="relative">
        <div className="h-32 relative overflow-hidden cyber-scanlines border-b border-slate-200">
          <LazyImage
            src={event.cover || ''}
            alt={event.title}
            fallbackGradient="from-[#e2e8f0] to-[#cbd5e1]"
            fallbackEmoji="📅"
            className="group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-black/10 z-10 pointer-events-none"></div>
        </div>

        <div className="p-4 z-10 relative">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-share-tech text-[10px] uppercase tracking-widest px-2 py-0.5 border border-purple-300 bg-purple-50 text-purple-700 rounded">
              [{event.cat}]
            </span>
            <span className={`font-share-tech text-[10px] px-2 py-0.5 border rounded uppercase ${badgeClass}`}>
              {event.type}
            </span>
          </div>

          <h3 className="font-orbitron font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-fuchsia-600 transition-colors uppercase tracking-wider mb-3">
            {event.title}
          </h3>

          <div className="space-y-1.5 font-share-tech text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-fuchsia-600 font-bold">&gt;&gt; FECHA:</span>
              <span className="text-slate-800">{event.date}{event.hour ? ` @ ${event.hour}` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-600 font-bold">&gt;&gt; LUGAR:</span>
              <span className="text-slate-800 truncate max-w-[180px]">{event.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0 z-10 relative">
        {isOrganizerView ? (
          <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-slate-200">
            <div className="flex justify-between items-center text-[11px] font-share-tech text-slate-600 mb-1">
              <span>AFORO_REGISTRADO:</span>
              <span className="text-cyan-600 font-bold">
                {event._ticketCount || 0} / {event.capacity || 0}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 border border-slate-300 rounded-full overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 h-full"
                style={{ width: `${Math.min(100, (((event._ticketCount || 0) / (event.capacity || 1)) * 100))}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              {event.status === 'borrador' && onDelete && (
                <button type="button" onClick={() => onDelete(event.id)}
                  className="flex-1 py-1 px-2 text-[10px] font-share-tech border border-red-400 hover:border-red-600 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer text-center">
                  [ELIMINAR]
                </button>
              )}
              {event.status === 'publicado' && (event._ticketCount || 0) > 0 && onCancel && (
                <button type="button" onClick={() => onCancel(event.id)}
                  className="flex-1 py-1 px-2 text-[10px] font-share-tech border border-red-400 hover:border-red-600 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer text-center">
                  [CANCELAR]
                </button>
              )}
              {onEdit && (
                <button type="button" onClick={() => onEdit(event.id)}
                  className="flex-1 py-1 px-2 text-[10px] font-share-tech border border-cyan-400 hover:border-cyan-600 text-cyan-600 hover:bg-cyan-50 rounded transition-all cursor-pointer text-center">
                  [EDITAR]
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-200 gap-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-share-tech text-slate-500 uppercase">PRECIO:</span>
              <p className="text-sm font-orbitron font-bold text-fuchsia-600 tracking-wider">
                {event.price === 'Gratis' || event.price === 0 ? 'ENTRADA_LIBRE' : formatPrice(event.price)}
              </p>
            </div>
            <Link
              to={`/evento/${event.id}`}
              className="px-3 py-1.5 font-share-tech text-xs uppercase tracking-wider rounded font-bold transition-all duration-100 arcade-btn-cyan text-center block"
            >
              VER_EVENTO
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
