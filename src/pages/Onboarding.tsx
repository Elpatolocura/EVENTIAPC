import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getAllEvents, updateProfile } from '../lib/db'

const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setLang } = useLanguage()
  const [step, setStep] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const [selectedLang, setSelectedLang] = useState('es')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllEvents().then((events) => {
      const cats = [...new Set(events.map((e: any) => e.category || 'General'))].sort() as string[]
      setCategories(cats)
    })
  }, [])

  const getLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          const data = await res.json()
          setLocation(data.address?.city || data.address?.town || data.address?.state || '')
        } catch {
          setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        }
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000 }
    )
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      await updateProfile(user.id, {
        categorias: selectedCategories,
        ubicacion: location,
        idioma: selectedLang,
        nombre: user.user_metadata?.full_name || '',
      })
      setLang(selectedLang)
      navigate('/', { replace: true })
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-orbitron font-extrabold uppercase text-gray-900">Eventia</h1>
          <p className="text-sm font-share-tech text-slate-600 mt-1">
            {step === 0 ? 'Elige tus categorías favoritas' :
             step === 1 ? '¿Dónde te encuentras?' :
             'Selecciona tu idioma'}
          </p>
        </div>

        <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-400" />

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border-2 border-black text-red-600 text-sm font-share-tech shadow-[2px_2px_0px_#000] mb-4">{error}</div>
          )}

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`flex-1 h-2 rounded-full border border-black transition-colors ${step >= i ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-400' : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* Step 0: Categories */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-xs font-share-tech text-slate-500 uppercase mb-3">Selecciona las categorías que te interesan</p>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {categories.map((cat) => (
                  <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-orbitron font-bold uppercase border-2 transition-all cursor-pointer shadow-[2px_2px_0px_#000] ${
                      selectedCategories.includes(cat)
                        ? 'cyber-btn-active border-2 border-black'
                        : 'cyber-btn border-black'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setStep(1)}
                className="w-full py-2.5 rounded-xl cyber-btn-active border-2 border-black text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer mt-4">
                Continuar →
              </button>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs font-share-tech text-slate-500 uppercase mb-3">Ingresa tu ubicación para ver eventos cercanos</p>
              <div>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ciudad, Departamento"
                  className="w-full px-4 py-2.5 rounded-xl cyber-input text-sm" />
              </div>
              <button type="button" onClick={getLocation} disabled={locating}
                className="w-full py-2.5 rounded-xl cyber-btn border-2 border-black text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
                {locating ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
                {locating ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(0)}
                  className="cyber-btn flex-1 py-2.5 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer">
                  ← Atrás
                </button>
                <button type="button" onClick={() => setStep(2)}
                  className="cyber-btn-active flex-1 py-2.5 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer">
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Language */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs font-share-tech text-slate-500 uppercase mb-3">¿En qué idioma prefieres ver la app?</p>
              {languages.map((lang) => (
                <button key={lang.code} type="button" onClick={() => setSelectedLang(lang.code)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer shadow-[2px_2px_0px_#000] ${
                    selectedLang === lang.code
                      ? 'cyber-btn-active border-2 border-black'
                      : 'cyber-btn border-black'
                  }`}>
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-sm font-orbitron font-bold uppercase">{lang.label}</span>
                  {selectedLang === lang.code && (
                    <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  )}
                </button>
              ))}
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setStep(1)}
                  className="cyber-btn flex-1 py-2.5 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer">
                  ← Atrás
                </button>
                <button type="button" onClick={handleFinish} disabled={saving}
                  className="cyber-btn-active flex-1 py-2.5 rounded-xl text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] disabled:opacity-40 cursor-pointer">
                  {saving ? 'Guardando...' : 'Finalizar 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
