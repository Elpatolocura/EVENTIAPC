import { useNotification } from '../context/NotificationContext'
import ToastNotificacion from './ToastNotificacion'

export default function ToastContainer() {
  const { toasts, removeToast } = useNotification()

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
      {toasts.map((t) => (
        <ToastNotificacion key={t.id} id={t.id} title={t.title} message={t.message} data={t.data} onClose={removeToast} />
      ))}
    </div>
  )
}
