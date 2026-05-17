import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getNotificationPreferences, updateNotificationPreferences } from '../lib/db'

interface Pref {
  key: string
  label: string
  desc: string
  icon: string
}

const options: Pref[] = [
  { key: 'follow_publishes_event', label: 'Nuevos eventos', desc: 'Cuando alguien que sigas publique un evento', icon: '📢' },
  { key: 'new_follower', label: 'Nuevos seguidores', desc: 'Cuando alguien te siga', icon: '👥' },
  { key: 'new_message', label: 'Mensajes', desc: 'Cuando te envíen un mensaje en el chat', icon: '💬' },
  { key: 'event_near_date', label: 'Eventos próximos', desc: 'Cuando un evento esté cerca de su fecha', icon: '⏰' },
]

export default function NotificacionesConfig() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (user) getNotificationPreferences(user.id).then((data) => {
      setPrefs({
        follow_publishes_event: data.follow_publishes_event ?? true,
        new_follower: data.new_follower ?? true,
        new_message: data.new_message ?? true,
        event_near_date: data.event_near_date ?? true,
      })
    })
  }, [user])

  const toggle = (key: string) => {
    setSaved(false)
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSaved(false)
    setErrorMsg('')
    const result = await updateNotificationPreferences(user.id, prefs)
    setSaving(false)
    if (result?.error) {
      setErrorMsg('Error al guardar: verifica que la tabla notification_preferences exista en Supabase')
    } else {
      setSaved(true)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notificaciones</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {options.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{opt.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle(opt.key)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer ${prefs[opt.key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${prefs[opt.key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 w-full py-3 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {saving ? 'Guardando...' : 'Guardar preferencias'}
      </button>

      {errorMsg && (
        <p className="mt-3 text-sm text-red-600 text-center">{errorMsg}</p>
      )}
      {saved && (
        <p className="mt-3 text-sm text-green-600 text-center">Preferencias guardadas correctamente</p>
      )}
    </div>
  )
}
