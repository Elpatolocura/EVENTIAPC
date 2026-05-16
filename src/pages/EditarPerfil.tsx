import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getProfile, updateProfile } from '../lib/db'

const categories = [
  'Música', 'Deportes', 'Tecnología', 'Arte',
  'Gastronomía', 'Negocios', 'Moda', 'Cine',
]

export default function EditarPerfil() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [form, setForm] = useState({
    nombre: '', celular: '', ubicacion: '', biografia: '', categorias: [] as string[],
    avatar_url: '', cover_url: '',
  })
  const [improving, setImproving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    getProfile(user.id).then((p) => {
      if (p) setForm({ nombre: p.nombre || '', celular: p.celular || '', ubicacion: p.ubicacion || '', biografia: p.biografia || '', categorias: p.categorias || [], avatar_url: p.avatar_url || '', cover_url: p.cover_url || '' })
    })
  }, [user])

  const update = (field: string, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const readFile = (file: File, field: 'avatar_url' | 'cover_url') => {
    const reader = new FileReader()
    reader.onload = () => update(field, reader.result as string)
    reader.readAsDataURL(file)
  }

  const toggleCategory = (cat: string) =>
    setForm((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(cat)
        ? prev.categorias.filter((c) => c !== cat)
        : [...prev.categorias, cat],
    }))

  const improveBio = () => {
    setImproving(true)
    setTimeout(() => {
      update('biografia', 'Apasionado por crear experiencias inolvidables. Amante de la música, la tecnología y los eventos que conectan personas.')
      setImproving(false)
    }, 1200)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`,
            { headers: { 'User-Agent': 'EventiaApp/1.0' } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          const state = data.address?.state || data.address?.region || ''
          const location = [city, state].filter(Boolean).join(', ')
          update('ubicacion', location || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } catch {
          update('ubicacion', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
        setLocating(false)
      },
      () => {
        alert('No se pudo obtener la ubicación')
        setLocating(false)
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate('/configuracion')}
          className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('editar_perfil.titulo')}</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

        <div className="relative h-40 sm:h-48 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          {form.cover_url && <img src={form.cover_url} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/10" />
          <button type="button" onClick={() => coverRef.current?.click()}
            className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-sm hover:bg-white transition-colors cursor-pointer shadow-md">
            📷
          </button>
        </div>
        <input type="file" ref={coverRef} accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f, 'cover_url') }} />

        <div className="flex flex-col items-center gap-3 -mt-14">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center text-3xl text-indigo-500 shadow-md overflow-hidden">
              {form.avatar_url ? <img src={form.avatar_url} alt="" className="w-full h-full object-cover" /> : '👤'}
            </div>
            <button type="button" onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm hover:bg-indigo-700 transition-colors cursor-pointer shadow-md">
              📷
            </button>
          </div>
          <p className="text-xs text-gray-500">{t('editar_perfil.cambiar_foto')}</p>
        </div>
        <input type="file" ref={avatarRef} accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f, 'avatar_url') }} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('editar_perfil.nombre')}</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => update('nombre', e.target.value)}
            placeholder={t('editar_perfil.nombre_placeholder')}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('editar_perfil.celular')}</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm text-gray-500 select-none pointer-events-none">
              🇨🇴 +57
            </span>
            <input
              type="tel"
              value={form.celular}
              onChange={(e) => update('celular', e.target.value)}
              placeholder={t('editar_perfil.celular_placeholder')}
              className="w-full pl-[88px] pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('editar_perfil.ubicacion')}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.ubicacion}
              onChange={(e) => update('ubicacion', e.target.value)}
              placeholder={t('editar_perfil.ubicacion_placeholder')}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={locating}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {locating ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              <span>{locating ? t('editar_perfil.obteniendo') : t('editar_perfil.usar_ubicacion')}</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('editar_perfil.biografia')}</label>
            <button
              type="button"
              onClick={improveBio}
              disabled={improving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {improving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('editar_perfil.mejorando')}
                </>
              ) : (
                <>
                  <span>✨</span>
                  {t('editar_perfil.mejorar_ia')}
                </>
              )}
            </button>
          </div>
          <textarea
            value={form.biografia}
            onChange={(e) => update('biografia', e.target.value)}
            placeholder={t('editar_perfil.bio_placeholder')}
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('editar_perfil.categorias')}</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  form.categorias.includes(cat)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/configuracion')}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {t('editar_perfil.cancelar')}
          </button>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="button"
            onClick={async () => {
              if (!user) return
              setSaving(true)
              setError('')
              const { error: err } = await updateProfile(user.id, form)
              setSaving(false)
              if (err) {
                setError(`${t('editar_perfil.error')}: ${err.message}`)
              } else {
                navigate('/configuracion')
              }
            }}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? t('editar_perfil.guardando') : t('editar_perfil.guardar')}
          </button>
        </div>
      </div>
    </div>
  )
}
