import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createEvent, updateEvent, getEventById, getUserCategories, addUserCategory } from '../lib/db'
import { improveWithAI } from '../lib/ai'
import { getCurrency } from '../lib/price'
import { supabase } from '../lib/supabase'

const predefinedCategories = [
  'Música', 'Deportes', 'Tecnología', 'Arte',
  'Gastronomía', 'Negocios', 'Moda', 'Cine', 'Teatro', 'Educación',
]

const serviceOptions = [
  { key: 'estacionamiento', labelKey: 'Estacionamiento' },
  { key: 'accesibilidad', labelKey: 'Accesibilidad' },
  { key: 'mascotas', labelKey: 'Mascotas permitidas' },
  { key: 'wifi', labelKey: 'WiFi gratuito' },
  { key: 'comida', labelKey: 'Comida y bebida' },
  { key: 'sonido', labelKey: 'Equipo de sonido' },
  { key: 'proyector', labelKey: 'Proyector' },
  { key: 'seguridad', labelKey: 'Seguridad privada' },
  { key: 'camarinos', labelKey: 'Camarinos' },
  { key: 'parqueadero', labelKey: 'Parqueadero VIP' },
]

const steps = [
  { num: 1, label: 'Info básica' },
  { num: 2, label: 'Cuándo y dónde' },
  { num: 3, label: 'Entradas' },
  { num: 4, label: 'Fotos y servicios' },
  { num: 5, label: 'Resumen' },
]

export default function CrearEvento() {
  const { eventId } = useParams<{ eventId: string }>()
  const isEditing = !!eventId
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<{ id: number; url: string | null }[]>([{ id: 1, url: null }])
  const [improvingTitle, setImprovingTitle] = useState(false)
  const [improvingDesc, setImprovingDesc] = useState(false)
  const [userCategories, setUserCategories] = useState<string[]>([])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(false)
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP')
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    ciudad: '',
    direccion: '',
    precio: '',
    aforo: '',
    fecha: '',
    hora: '',
    duracion: '',
    organizador: '',
    telefonoContacto: '',
    edadMinima: '',
    estacionamiento: false,
    accesibilidad: false,
    mascotas: false,
  })

  useEffect(() => {
    if (user) getUserCategories(user.id).then(setUserCategories)
  }, [user])

  useEffect(() => {
    if (!eventId) return
    setLoadingEvent(true)
    getEventById(eventId).then((ev) => {
      if (ev) {
        setForm({
          titulo: ev.title || '',
          descripcion: ev.description || '',
          categoria: ev.category || '',
          ciudad: ev.city || '',
          direccion: ev.address || '',
          precio: typeof ev.price === 'string' ? ev.price.replace(/^(USD\s*|\$)/, '').trim() : '',
          aforo: ev.capacity || '',
          fecha: ev.date || '',
          hora: ev.hour || '',
          duracion: ev.duration || '',
          organizador: ev.organizer || '',
          telefonoContacto: ev.phone || '',
          edadMinima: ev.age_min || '',
          estacionamiento: !!ev.parking,
          accesibilidad: !!ev.accessibility,
          mascotas: !!ev.pets,
        })
        setCurrency(getCurrency(ev.price))
        if (Array.isArray(ev.photos) && ev.photos.length > 0) {
          setPhotos(ev.photos.map((url: string, i: number) => ({ id: i + 1, url })))
        }
        if (Array.isArray(ev.services)) {
          setSelectedServices(ev.services)
        }
      }
      setLoadingEvent(false)
    })
  }, [eventId])

  const update = (field: string, value: string | boolean) => {
    setValidationMsg('')
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addPhoto = () =>
    setPhotos((prev) => [...prev, { id: Date.now(), url: null }])

  const removePhoto = (id: number) =>
    setPhotos((prev) => prev.filter((p) => p.id !== id))

  const [dragOver, setDragOver] = useState(false)
  const handlePhotoUpload = (id: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const url = ev.target?.result as string
          setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, url } : p)))
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleDrop = (e: React.DragEvent, id: number) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const url = ev.target?.result as string
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, url } : p)))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddCategory = async () => {
    if (!user || !newCategory.trim()) return
    const name = newCategory.trim()
    await addUserCategory(user.id, name)
    setUserCategories((prev) => [...prev, name])
    update('categoria', name)
    setNewCategory('')
    setShowNewCategory(false)
  }

  const toggleService = (key: string) => {
    setSelectedServices((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    )
  }

  const buildEventData = (status: string) => {
    const photoUrls = photos.filter((p) => p.url).map((p) => p.url!)
    const raw = form.precio.replace(/^(USD\s*|\$)/, '').trim()
    const priceValue = form.precio ? (currency === 'USD' ? `USD ${raw}` : `$${raw}`) : 'Gratis'
    return {
      organizer_id: user!.id,
      title: form.titulo || 'Evento sin título',
      description: form.descripcion,
      category: form.categoria,
      city: form.ciudad,
      address: form.direccion,
      price: priceValue,
      capacity: form.aforo,
      date: form.fecha || 'Próximamente',
      hour: form.hora,
      duration: form.duracion,
      organizer: form.organizador || user?.email?.split('@')[0] || 'Organizador',
      phone: form.telefonoContacto,
      age_min: form.edadMinima,
      parking: form.estacionamiento,
      accessibility: form.accesibilidad,
      pets: form.mascotas,
      photos: photoUrls,
      type: priceValue === 'Gratis' ? 'Gratis' : 'Pagado',
      services: selectedServices,
      status,
    }
  }

  const handleSaveDraft = async () => {
    if (!user) return
    setSaving(true)
    setPublishError('')
    if (isEditing && eventId) {
      const { error } = await updateEvent(eventId, buildEventData('borrador'))
      setSaving(false)
      if (!error) navigate('/mis-eventos')
      else setPublishError('No se pudo guardar el borrador.')
    } else {
      const { data: d } = await createEvent(buildEventData('borrador'))
      setSaving(false)
      if (d) navigate('/mis-eventos')
      else setPublishError('No se pudo guardar el borrador.')
    }
  }

  const handlePublish = async () => {
    if (!user) return
    const { count } = await supabase.from('events')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', user.id)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())
    if (count && count >= 5) {
      setPublishError('Límite de 5 eventos por hora. Espera un momento antes de publicar otro.')
      return
    }
    const months: Record<string, number> = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 }
    const dm = form.fecha.match(/^(\d+)\s+(\w+)\s+(\d+)$/)
    if (dm) {
      const [, d, m, y] = dm
      const eventDate = new Date(parseInt(y), months[m.toLowerCase()], parseInt(d))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (eventDate < today) {
        setPublishError('No puedes publicar un evento con fecha anterior a hoy.')
        return
      }
    }
    setSaving(true)
    setPublishError('')
    if (isEditing && eventId) {
      const { error } = await updateEvent(eventId, buildEventData('publicado'))
      setSaving(false)
      if (error) setPublishError('No se pudo publicar el evento.')
      else setPublishedId(eventId)
    } else {
      const { data: d2 } = await createEvent(buildEventData('publicado'))
      setSaving(false)
      if (d2) setPublishedId(d2.id)
      else setPublishError('No se pudo publicar el evento. Asegúrate de haber ejecutado el SQL en Supabase.')
    }
  }

  const previewPhotos = photos.filter((p) => p.url)

  const [validationMsg, setValidationMsg] = useState('')

  const handleNext = () => {
    const missing: string[] = []
    if (step === 1) {
      if (!form.titulo.trim()) missing.push('título')
      if (!form.descripcion.trim()) missing.push('descripción')
      if (!form.categoria) missing.push('categoría')
    }
    if (step === 2) {
      if (!form.fecha.trim()) missing.push('fecha')
      if (!form.hora.trim()) missing.push('hora')
      if (!form.ciudad) missing.push('ciudad')
    }
    if (step === 3) {
      if (!form.precio.trim()) missing.push('precio')
      if (!form.aforo.trim()) missing.push('aforo')
      if (!form.telefonoContacto.trim()) missing.push('teléfono de contacto')
    }
    if (step === 4) {
      if (!photos.some((p) => p.url)) missing.push('al menos una foto')
    }
    if (missing.length > 0) {
      setValidationMsg(`Completa los campos obligatorios: ${missing.join(', ')}`)
      return
    }
    setValidationMsg('')
    setStep(step + 1)
  }

  const renderPreview = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:sticky lg:top-8">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Vista previa</h2>
      <div className="rounded-xl overflow-hidden border border-gray-200">
        {previewPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-0.5">
            {previewPhotos.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className={`${previewPhotos.length === 1 ? 'col-span-2 h-52' : previewPhotos.length === 2 ? 'h-40' : previewPhotos.indexOf(p) === 0 ? 'col-span-2 h-44' : 'h-36'} bg-gray-100`}
              >
                <img src={p.url!} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {previewPhotos.length > 3 && (
              <div className="h-36 bg-gray-900/60 flex items-center justify-center text-white text-sm font-medium">
                +{previewPhotos.length - 3} más
              </div>
            )}
            {previewPhotos.length === 2 && <div className="col-span-2 h-0" />}
          </div>
        ) : (
          <div className="h-44 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Sin imagen
          </div>
        )}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 text-base leading-snug min-h-[1.25em]">
            {form.titulo || 'Título del evento'}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {form.fecha && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {form.fecha}{form.hora ? ` • ${form.hora}` : ''}
              </span>
            )}
            {(form.ciudad || form.direccion) && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {[form.ciudad, form.direccion].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          {form.categoria && (
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-[11px] font-medium text-indigo-600">
              {form.categoria}
            </span>
          )}
          {form.descripcion && (
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
              {form.descripcion}
            </p>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {form.precio ? (
              <span className="text-sm font-bold text-gray-900">{currency === 'USD' ? `USD ${form.precio}` : `$${form.precio}`}</span>
            ) : (
              <span className="text-xs text-gray-400">Precio no definido</span>
            )}
            {form.aforo && (
              <span className="text-xs text-gray-500">Aforo: {form.aforo}</span>
            )}
          </div>
          {selectedServices.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {selectedServices.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-full bg-green-50 text-[10px] font-medium text-green-700">
                  {serviceOptions.find((o) => o.key === s)?.labelKey || s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => s.num < step && setStep(s.num)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
              s.num === step
                ? 'bg-indigo-600 text-white scale-110 shadow-md'
                : s.num < step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
            }`}
          >
            {s.num < step ? '✓' : s.num}
          </button>
          <span className={`text-xs font-medium hidden sm:block ${s.num === step ? 'text-indigo-600' : 'text-gray-400'}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`w-8 h-0.5 ${s.num < step ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Título del evento <span className="text-red-400">*</span></label>
                <button
                  type="button"
                  onClick={async () => {
                    setImprovingTitle(true)
                    try {
                      const result = await improveWithAI(
                        'Genera un título atractivo y llamativo para un evento. Corto, impactante, con emoji si aplica.',
                        `Categoría: ${form.categoria || 'sin categoría'}. Descripción actual: ${form.descripcion || 'sin descripción'}. Título actual: ${form.titulo || 'sin título'}`
                      )
                      if (result) update('titulo', result)
                    } catch { /* fallback silencioso */ }
                    setImprovingTitle(false)
                  }}
                  disabled={improvingTitle}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {improvingTitle ? (
                    <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Mejorando...</>
                  ) : (
                    <><span>✨</span> Mejorar con IA</>
                  )}
                </button>
              </div>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => update('titulo', e.target.value)}
                placeholder="Ej: Festival de Música 2026"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Descripción <span className="text-red-400">*</span></label>
                <button
                  type="button"
                  onClick={async () => {
                    setImprovingDesc(true)
                    try {
                      const result = await improveWithAI(
                        'Genera una descripción atractiva y persuasiva para un evento. Entre 2 y 4 párrafos cortos. Sin encabezados ni formato.',
                        `Título: ${form.titulo || 'Evento'}. Categoría: ${form.categoria || 'sin categoría'}. Ciudad: ${form.ciudad || 'sin especificar'}.`
                      )
                      if (result) update('descripcion', result)
                    } catch { /* fallback silencioso */ }
                    setImprovingDesc(false)
                  }}
                  disabled={improvingDesc || !form.titulo}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {improvingDesc ? (
                    <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Mejorando...</>
                  ) : (
                    <><span>✨</span> Mejorar con IA</>
                  )}
                </button>
              </div>
              <textarea
                value={form.descripcion}
                onChange={(e) => update('descripcion', e.target.value)}
                placeholder="Describe tu evento..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <select
                    value={form.categoria}
                    onChange={(e) => update('categoria', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">Seleccionar categoría</option>
                    {[...predefinedCategories, ...userCategories.filter((c) => !predefinedCategories.includes(c))].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="px-3 py-3 rounded-xl border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-400 transition-colors cursor-pointer shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              {showNewCategory && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nombre de la nueva categoría"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha del evento <span className="text-red-400">*</span></label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      value={(() => {
                        if (!form.fecha) return ''
                        const months: Record<string, string> = { ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06', jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12' }
                        const match = form.fecha.match(/^(\d+)\s+(\w+)\s+(\d+)$/)
                        if (match) {
                          const [, d, m, y] = match
                          const mm = months[m.toLowerCase()]
                          if (mm) return `${y}-${mm}-${String(parseInt(d)).padStart(2, '0')}`
                        }
                        return ''
                      })()}
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-')
                          const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
                          update('fecha', `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`)
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent [color-scheme:light]"
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora <span className="text-red-400">*</span></label>
                <input
                  type="time"
                  value={(() => {
                    if (!form.hora) return ''
                    const match = form.hora.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
                    if (match) {
                      let h = parseInt(match[1])
                      const m = match[2]
                      const ap = match[3].toUpperCase()
                      if (ap === 'PM' && h !== 12) h += 12
                      if (ap === 'AM' && h === 12) h = 0
                      return `${String(h).padStart(2, '0')}:${m}`
                    }
                    return ''
                  })()}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [h, m] = e.target.value.split(':')
                      const hh = parseInt(h)
                      const ap = hh >= 12 ? 'PM' : 'AM'
                      const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
                      update('hora', `${h12}:${m} ${ap}`)
                    } else {
                      update('hora', '')
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent [color-scheme:light]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '30 min', value: '30 minutos' },
                    { label: '1 h', value: '1 hora' },
                    { label: '2 h', value: '2 horas' },
                    { label: '3 h', value: '3 horas' },
                    { label: '4 h+', value: '4+ horas' },
                    { label: 'Todo el día', value: 'Todo el día' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update('duracion', form.duracion === opt.value ? '' : opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        form.duracion === opt.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad <span className="text-red-400">*</span></label>
                <select
                  value={form.ciudad}
                  onChange={(e) => update('ciudad', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="">Seleccionar ciudad</option>
                  {[
                    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
                    'Bucaramanga', 'Pereira', 'Manizales', 'Cúcuta', 'Ibagué',
                    'Santa Marta', 'Villavicencio', 'Armenia', 'Neiva', 'Pasto',
                    'Popayán', 'Montería', 'Sincelejo', 'Valledupar', 'Riohacha',
                    'Tunja', 'Florencia', 'Quibdó', 'San Andrés', 'Leticia',
                  ].sort().map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => update('direccion', e.target.value)}
                    placeholder="Cra 15 # 88-64"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Ej: Cra 15 # 88-64, Centro</p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm text-gray-400">{currency === 'COP' ? '$' : 'USD'}</span>
                    <input
                      type="text"
                      value={form.precio}
                      onChange={(e) => update('precio', e.target.value)}
                      placeholder="0 (dejar vacío = Gratis)"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden shrink-0">
                    <button type="button" onClick={() => setCurrency('COP')}
                      className={`px-3 py-3 text-xs font-semibold transition-colors cursor-pointer ${currency === 'COP' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                      COL$
                    </button>
                    <button type="button" onClick={() => setCurrency('USD')}
                      className={`px-3 py-3 text-xs font-semibold transition-colors cursor-pointer ${currency === 'USD' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                      USD
                    </button>
                  </div>
                </div>
                {!form.precio && (
                  <p className="text-xs text-green-600 mt-1">Este evento será gratuito</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacidad (aforo) <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.aforo}
                  onChange={(e) => update('aforo', e.target.value)}
                  placeholder="Ej: 500"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Edad mínima</label>
                  <input
                    type="text"
                    value={form.edadMinima}
                    onChange={(e) => update('edadMinima', e.target.value)}
                    placeholder="Ej: 18"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono de contacto <span className="text-red-400">*</span></label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500">🇨🇴 +57</span>
                  <input
                    type="tel"
                    value={form.telefonoContacto}
                    onChange={(e) => update('telefonoContacto', e.target.value)}
                    placeholder="300 123 4567"
                    className="w-full px-4 py-3 rounded-r-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fotos del evento <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative">
                    {p.url ? (
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => handleDrop(e, p.id)}
                        className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-gray-400 transition-colors cursor-pointer ${dragOver ? 'border-indigo-500 bg-indigo-50 text-indigo-500' : 'border-gray-200 hover:border-indigo-400 hover:text-indigo-500'}`}
                      >
                        <div onClick={() => handlePhotoUpload(p.id)} className="flex flex-col items-center justify-center gap-1 w-full h-full">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-[10px]">Agregar</span>
                          <span className="text-[8px] text-gray-300">o arrastra</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {photos.length < 6 && photos.every((p) => p.url) && (
                  <button
                    type="button"
                    onClick={addPhoto}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[10px]">Agregar</span>
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Detalles adicionales</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'estacionamiento', label: 'Estacionamiento' },
                  { key: 'accesibilidad', label: 'Accesibilidad' },
                  { key: 'mascotas', label: 'Mascotas permitidas' },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[opt.key as keyof typeof form] as boolean}
                      onChange={(e) => update(opt.key, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Servicios</label>
              <div className="flex flex-wrap gap-2">
                {serviceOptions.map((svc) => (
                  <button
                    key={svc.key}
                    type="button"
                    onClick={() => toggleService(svc.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      selectedServices.includes(svc.key)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {svc.labelKey}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Resumen del evento</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📌</span>
                  <div>
                    <p className="text-xs text-gray-400">Título</p>
                    <p className="text-sm font-medium text-gray-900">{form.titulo || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">📅</span>
                  <div>
                    <p className="text-xs text-gray-400">Fecha y hora</p>
                    <p className="text-sm font-medium text-gray-900">{form.fecha || '—'} {form.hora ? `• ${form.hora}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="text-xs text-gray-400">Ubicación</p>
                    <p className="text-sm font-medium text-gray-900">{[form.ciudad, form.direccion].filter(Boolean).join(', ') || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🎟️</span>
                  <div>
                    <p className="text-xs text-gray-400">Precio / Aforo</p>
                    <p className="text-sm font-medium text-gray-900">{form.precio ? (currency === 'USD' ? `USD ${form.precio}` : `$${form.precio}`) : 'Gratis'}{form.aforo ? ` • ${form.aforo} personas` : ''}</p>
                  </div>
                </div>
                {form.descripcion && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">📝</span>
                    <div>
                      <p className="text-xs text-gray-400">Descripción</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{form.descripcion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {publishError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {publishError}
              </div>
            )}

            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Publicando...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Publicar evento</>
              )}
            </button>
          </div>
        )
    }
  }

  if (loadingEvent) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Cargando evento...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar Evento' : 'Crear Evento'}</h1>
        <span className="text-xs text-gray-400">Paso {step} de 5</span>
      </div>

      {renderStepIndicator()}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:max-w-[480px] order-2 lg:order-2">
          {renderPreview()}
        </div>

        <div className="flex-1 min-w-0 order-1 lg:order-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {renderStep()}

            {step < 5 && (
              <div className="mt-8 pt-5 border-t border-gray-100">
                <div className="flex gap-3">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => { setValidationMsg(''); setStep(step - 1) }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      Anterior
                    </button>
                  ) : (
                    <button
                      type="button"
                onClick={() => navigate('/')}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setValidationMsg(''); handleSaveDraft() }}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    📄 Borrador
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    Siguiente
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
                {validationMsg && (
                  <p className="mt-2 text-xs text-red-500 text-center">{validationMsg}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {publishedId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 mx-4 max-w-sm w-full text-center">
            <span className="text-5xl block mb-4">🎉</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Evento publicado!</h2>
            <p className="text-sm text-gray-500 mb-6">Tu evento se ha creado y publicado correctamente.</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  )
}
