import { useNotification } from '../context/NotificationContext'
import ToastNotificacion from './ToastNotificacion'

export default function ToastContainer() {
  const { toasts, removeToast } = useNotification()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
      {toasts.map((t) => (
        <ToastNotificacion key={t.id} id={t.id} title={t.title} message={t.message} data={t.data} onClose={removeToast} />
      ))}
    </div>
  )
}
