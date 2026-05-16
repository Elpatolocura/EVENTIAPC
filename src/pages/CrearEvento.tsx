import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { createEvent, getUserCategories, addUserCategory } from '../lib/db'

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

export default function CrearEvento() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
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

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const addPhoto = () =>
    setPhotos((prev) => [...prev, { id: Date.now(), url: null }])

  const removePhoto = (id: number) =>
    setPhotos((prev) => prev.filter((p) => p.id !== id))

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

  const handlePublish = async () => {
    if (!user) return
    setSaving(true)
    setPublishError('')
    const photoUrls = photos.filter((p) => p.url).map((p) => p.url!)
    const priceValue = form.precio ? `$${form.precio.replace(/^[$]/, '')}` : 'Gratis'
    const typeValue = priceValue === 'Gratis' ? 'Gratis' : 'Pagado'

    const { data, error } = await createEvent({
      organizer_id: user.id,
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
      organizer: form.organizador,
      phone: form.telefonoContacto,
      age_min: form.edadMinima,
      parking: form.estacionamiento,
      accessibility: form.accesibilidad,
      pets: form.mascotas,
      photos: photoUrls,
      type: typeValue,
      services: selectedServices,
      status: 'publicado',
    })

    setSaving(false)
    if (data) {
      setPublishedId(data.id)
    } else if (error) {
      setPublishError('No se pudo publicar el evento. Asegúrate de haber ejecutado el SQL en Supabase.')
    }
  }

  const previewPhotos = photos.filter((p) => p.url)

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('crear_evento.titulo')}</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:max-w-[480px]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:sticky lg:top-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{t('crear_evento.vista_previa')}</h2>

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
                  {t('crear_evento.sin_imagen')}
                </div>
              )}

              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 text-base leading-snug min-h-[1.25em]">
                  {form.titulo || t('crear_evento.titulo_label')}
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
                    <span className="text-sm font-bold text-gray-900">${form.precio}</span>
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
        </div>

        <div className="flex-1 min-w-0">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('crear_evento.fotos')}</label>
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
                      <button
                        type="button"
                        onClick={() => handlePhotoUpload(p.id)}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-[10px]">{t('crear_evento.agregar')}</span>
                      </button>
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
                    <span className="text-[10px]">{t('crear_evento.agregar')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">{t('crear_evento.titulo_label')}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setImprovingTitle(true)
                      setTimeout(() => {
                        update('titulo', '🎵 Festival de Música 2026: La Experiencia Inolvidable')
                        setImprovingTitle(false)
                      }, 1200)
                    }}
                    disabled={improvingTitle}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {improvingTitle ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t('crear_evento.mejorando')}
                      </>
                    ) : (
                      <><span>✨</span> {t('crear_evento.mejorar_ia')}</>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => update('titulo', e.target.value)}
                  placeholder={t('crear_evento.titulo_placeholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">{t('crear_evento.descripcion')}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setImprovingDesc(true)
                      setTimeout(() => {
                        update('descripcion', 'Disfruta de una experiencia musical única con los mejores artistas nacionales e internacionales. Música en vivo, comida gourmet, zonas de descanso y actividades interactivas te esperan en el evento más esperado del año. ¡No te lo pierdas!')
                        setImprovingDesc(false)
                      }, 1400)
                    }}
                    disabled={improvingDesc || !form.titulo}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {improvingDesc ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t('crear_evento.mejorando')}
                      </>
                    ) : (
                      <><span>✨</span> {t('crear_evento.mejorar_ia')}</>
                    )}
                  </button>
                </div>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => update('descripcion', e.target.value)}
                  placeholder={t('crear_evento.desc_placeholder')}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.categoria')}</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <select
                      value={form.categoria}
                      onChange={(e) => update('categoria', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                      <option value="">{t('crear_evento.seleccionar_categoria')}</option>
                      {[...predefinedCategories, ...userCategories.filter((c) => !predefinedCategories.includes(c))].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-400 transition-colors cursor-pointer shrink-0"
                    title="Nueva categoría"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.fecha')}</label>
                <input
                  type="text"
                  value={form.fecha}
                  onChange={(e) => update('fecha', e.target.value)}
                  placeholder="Ej: 15 jun 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.hora')}</label>
                <input
                  type="text"
                  value={form.hora}
                  onChange={(e) => update('hora', e.target.value)}
                  placeholder="Ej: 7:00 PM"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.duracion')}</label>
                <input
                  type="text"
                  value={form.duracion}
                  onChange={(e) => update('duracion', e.target.value)}
                  placeholder="Ej: 3 horas"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.ciudad')}</label>
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={(e) => update('ciudad', e.target.value)}
                  placeholder="Ej: Bogotá"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.direccion')}</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => update('direccion', e.target.value)}
                  placeholder="Ej: Cra 15 # 88-64"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.precio')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm text-gray-400">$</span>
                  <input
                    type="text"
                    value={form.precio}
                    onChange={(e) => update('precio', e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.aforo')}</label>
                <input
                  type="text"
                  value={form.aforo}
                  onChange={(e) => update('aforo', e.target.value)}
                  placeholder="Ej: 500"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.organizador')}</label>
                <input
                  type="text"
                  value={form.organizador}
                  onChange={(e) => update('organizador', e.target.value)}
                  placeholder="Nombre del organizador"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.telefono')}</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500">🇨🇴 +57</span>
                  <input
                    type="tel"
                    value={form.telefonoContacto}
                    onChange={(e) => update('telefonoContacto', e.target.value)}
                    placeholder="300 123 4567"
                    className="w-full px-4 py-2.5 rounded-r-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('crear_evento.edad_minima')}</label>
                <input
                  type="text"
                  value={form.edadMinima}
                  onChange={(e) => update('edadMinima', e.target.value)}
                  placeholder="Ej: 18"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('crear_evento.detalles_adicionales')}</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'estacionamiento', label: t('crear_evento.estacionamiento') },
                    { key: 'accesibilidad', label: t('crear_evento.accesibilidad') },
                    { key: 'mascotas', label: t('crear_evento.mascotas') },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
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

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de servicios</label>
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

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t('crear_evento.guardar_borrador')}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Publicando...' : t('crear_evento.publicar')}
              </button>
            </div>
            {publishError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {publishError}
              </div>
            )}
          </form>
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
                onClick={() => navigate(`/evento/${publishedId}`)}
                className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Ver evento
              </button>
              <button
                type="button"
                onClick={() => navigate('/inicio')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}