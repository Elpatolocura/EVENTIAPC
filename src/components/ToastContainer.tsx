import { useNotification } from '../context/NotificationContext'
import ToastNotificacion from './ToastNotificacion'

export default function ToastContainer() {
  const { toasts, removeToast } = useNotification()

  return (
    <div className="fixed top-0 right-0 z-[9999] flex flex-col gap-2 p-4 pt-14 max-h-screen overflow-y-auto">
      {toasts.map((t) => (
        <ToastNotificacion key={t.id} id={t.id} title={t.title} message={t.message} data={t.data} onClose={removeToast} />
      ))}
    </div>
  )
}
