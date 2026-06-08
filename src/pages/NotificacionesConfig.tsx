import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
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
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="cyber-btn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-orbitron font-extrabold uppercase text-2xl text-gray-900">Notificaciones</h1>
      </div>
      <div className="space-y-3">
        {options.map((opt) => (
          <div key={opt.key} className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-500" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{opt.icon}</span>
                <div>
                  <p className="font-orbitron font-bold group-hover:text-fuchsia-600 text-sm text-gray-900 transition-colors">{opt.label}</p>
                  <p className="font-share-tech text-xs text-slate-600">{opt.desc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle(opt.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors cursor-pointer ${prefs[opt.key] ? 'bg-cyan-500 border-black' : 'bg-gray-300 border-gray-400'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-[1px_1px_0px_#000] transition-transform ${prefs[opt.key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 w-full cyber-btn-active"
      >
        {saving ? 'Guardando...' : 'Guardar preferencias'}
      </button>

      {errorMsg && (
        <p className="mt-3 text-sm text-red-600 text-center font-share-tech">{errorMsg}</p>
      )}
      {saved && (
        <p className="mt-3 text-sm text-green-600 text-center font-share-tech">Preferencias guardadas correctamente</p>
      )}
    </div>
  )
}
