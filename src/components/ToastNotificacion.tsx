import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface ToastProps {
  id: number
  title: string
  message: string
  data?: { type?: string; event_id?: string; actor_id?: string }
  onClose: (id: number) => void
}

export default function ToastNotificacion({ id, title, message, data, onClose }: ToastProps) {
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    timerRef.current = setTimeout(() => onClose(id), 5000)
    return () => clearTimeout(timerRef.current)
  }, [id, onClose])

  const handleClick = () => {
    clearTimeout(timerRef.current)
    onClose(id)
    if (data?.type === 'new_follower' && data.actor_id) {
      navigate(`/perfil/${data.actor_id}`)
    } else if (data?.type === 'new_event' && data.event_id) {
      navigate(`/evento/${data.event_id}`)
    } else if (data?.type === 'new_message' && data.event_id) {
      navigate(`/chat/${data.event_id}`)
    } else {
      navigate('/notificaciones')
    }
  }

  return (
    <div
      onClick={handleClick}
      className="bg-indigo-600 text-white rounded-xl shadow-2xl border border-indigo-400 px-5 py-4 max-w-sm cursor-pointer animate-slide-up hover:bg-indigo-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{title}</p>
          <p className="text-xs text-indigo-100 mt-1 line-clamp-2">{message}</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); clearTimeout(timerRef.current); onClose(id) }}
          className="shrink-0 text-indigo-200 hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
