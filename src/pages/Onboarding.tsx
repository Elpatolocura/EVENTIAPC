import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const ICONS: Record<string, string> = {
  Música: '🎵', Deportes: '⚽', Tecnología: '💻', Arte: '🎨',
  Gastronomía: '🍽️', Negocios: '💼', Moda: '👗', Cine: '🎬',
  Teatro: '🎭', Educación: '📚', Salud: '🏥', Viajes: '✈️',
  Fotografía: '📷', Literatura: '📖', Videojuegos: '🎮',
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [categories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [ticketType, setTicketType] = useState<string>('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)

  const requestDeviceLocation = () => {
    if (!navigator.geolocation) { setError('Tu dispositivo no soporta geolocalización'); return }
    setLocating(true); setError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=es`
          )
          const data = await res.json()
          const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.state || ''
          if (city) setLocation(city)
          else setError('No se pudo determinar tu ciudad. Escríbela manualmente.')
        } catch {
          setError('No se pudo determinar tu ciudad. Escríbela manualmente.')
        }
        setLocating(false)
      },
      () => { setError('Permiso de ubicación denegado. Escríbela manualmente.'); setLocating(false) },
      { enableHighAccuracy: true }
    )
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  useEffect(() => {
    if (!user) { navigate('/', { replace: true }); return }
    supabase.from('profiles').select('categorias').eq('id', user.id).single().then(({ data }) => {
      if (data?.categorias?.length) navigate('/', { replace: true })
    })
  }, [user, navigate])

  const finish = async () => {
    if (!user || !ticketType || !location.trim()) { setError('Completa todos los campos'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('profiles').upsert({
      id: user.id,
      categorias: [...selectedCategories],
      ubicacion: location.trim(),
    }, { onConflict: 'id' })
    if (err) { setSaving(false); setError(err.message); return }
    await supabase.auth.updateUser({ data: { tipo_entrada: ticketType } })
    setSaving(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-orbitron font-bold text-slate-900">Eventia</h1>
          <p className="text-sm font-share-tech text-slate-500 mt-1">Personaliza tu experiencia</p>
        </div>
        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent to-accent-secondary"></div>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full border-2 border-black transition-all ${
                  step === s
                    ? 'bg-accent shadow-[1px_1px_0px_#000] scale-125'
                    : step > s
                      ? 'bg-accent-secondary'
                      : 'bg-[#f8f9fa]'
                }`}
              />
            ))}
          </div>
          {error && (
            <div className="p-3 rounded bg-red-50 border-2 border-red-400 text-red-600 text-sm font-share-tech mb-4">{error}</div>
          )}
          {step === 0 && (
            <div>
              <h2 className="text-base font-orbitron font-bold text-slate-900 mb-1 uppercase">¿Qué tipo de eventos te interesan?</h2>
              <p className="text-xs font-share-tech text-slate-500 mb-4">Selecciona una o más categorías</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold font-share-tech border-2 border-black transition-all cursor-pointer uppercase ${
                      selectedCategories.has(cat)
                        ? 'bg-accent text-white shadow-[1px_1px_0px_#000]'
                        : 'bg-white text-slate-600 hover:bg-accent-light'
                    }`}
                  >
                    <span>{ICONS[cat] || '📌'}</span>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCategories.size === 0) { setError('Selecciona al menos una categoría'); return }
                    setError(''); setStep(1)
                  }}
                  className="px-6 py-2.5 rounded font-bold text-sm font-orbitron cyber-btn-active border-2 border-black shadow-[2px_2px_0px_#000] transition-all cursor-pointer uppercase"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <h2 className="text-base font-orbitron font-bold text-slate-900 mb-1 uppercase">¿Qué tipo de entrada prefieres?</h2>
              <p className="text-xs font-share-tech text-slate-500 mb-4">Selecciona una opción</p>
              <div className="flex gap-3 mb-6">
                {[
                  { key: 'fisica', icon: '🎟️', label: 'Física / Presencial' },
                  { key: 'virtual', icon: '💻', label: 'Virtual / Online' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTicketType(opt.key)}
                    className={`flex-1 p-4 rounded text-center border-2 border-black transition-all cursor-pointer ${
                      ticketType === opt.key
                        ? 'bg-accent text-white shadow-[2px_2px_0px_#000]'
                        : 'bg-white text-slate-600 hover:bg-accent-light'
                    }`}
                  >
                    <div className="text-2xl mb-2">{opt.icon}</div>
                    <p className="text-xs font-orbitron font-bold uppercase">{opt.label}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="px-6 py-2.5 rounded font-bold text-sm font-share-tech cyber-btn border-2 border-black transition-all cursor-pointer uppercase"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!ticketType) { setError('Selecciona un tipo de entrada'); return }
                    setError(''); setStep(2)
                  }}
                  className="px-6 py-2.5 rounded font-bold text-sm font-orbitron cyber-btn-active border-2 border-black shadow-[2px_2px_0px_#000] transition-all cursor-pointer uppercase"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-base font-orbitron font-bold text-slate-900 mb-1 uppercase">¿Dónde te ubicas?</h2>
              <p className="text-xs font-share-tech text-slate-500 mb-4">Ciudad o región donde vives</p>
              <button
                type="button"
                onClick={requestDeviceLocation}
                disabled={locating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-xs font-bold font-share-tech cyber-btn border-2 border-black shadow-[1px_1px_0px_#000] disabled:opacity-40 transition-all cursor-pointer uppercase mb-3"
              >
                {locating ? '📍 Obteniendo ubicación...' : '📍 Usar ubicación del dispositivo'}
              </button>
              <p className="text-center text-xs font-share-tech text-slate-400 mb-3">— O escríbela manualmente —</p>
              <input
                type="text"
                value={location}
                onChange={(e) => { setLocation(e.target.value); setError('') }}
                placeholder="Ej: Medellín, Colombia"
                className="w-full px-4 py-2.5 rounded cyber-input border-2 border-black text-sm"
                autoFocus
              />
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 rounded font-bold text-sm font-share-tech cyber-btn border-2 border-black transition-all cursor-pointer uppercase"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={finish}
                  disabled={saving}
                  className="px-6 py-2.5 rounded font-bold text-sm font-orbitron cyber-btn-active border-2 border-black shadow-[2px_2px_0px_#000] disabled:opacity-40 transition-all cursor-pointer uppercase"
                >
                  {saving ? 'Guardando...' : 'Finalizar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
