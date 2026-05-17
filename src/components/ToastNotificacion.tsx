import { useEffect, useState, useRef } from 'react'
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
  const duration = 30
  const [remaining, setRemaining] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const left = Math.max(0, duration - elapsed)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(intervalRef.current)
        onClose(id)
      }
    }, 50)
    return () => clearInterval(intervalRef.current)
  }, [id, onClose])

  const handleVerMas = () => {
    clearInterval(intervalRef.current)
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

  const progress = (remaining / duration) * 100

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-slide-up">
      <div className="px-4 py-3 max-w-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{message}</p>
          </div>
          <button type="button" onClick={() => onClose(id)}
            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={handleVerMas}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer">
            Ver más
          </button>
        </div>
      </div>
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-indigo-500 transition-all duration-[50ms] ease-linear" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
