import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getProfile, getFollowers } from '../lib/db'

export default function Perfil() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { id } = useParams()
  const [profile, setProfile] = useState<Record<string, any> | null>(null)
  const [followers, setFollowers] = useState<any[]>([])
  const [showFollowers, setShowFollowers] = useState(false)
  const [search, setSearch] = useState('')

  const targetId = id || user?.id
  const isOwnProfile = !id || id === user?.id

  useEffect(() => {
    if (!targetId) return
    Promise.all([
      getProfile(targetId).then((data) => setProfile(data || {})),
      getFollowers(targetId).then(setFollowers),
    ])
  }, [targetId])

  const filtered = followers.filter(
    (f) => (f.follower?.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative h-48 sm:h-56 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          {profile?.cover_url && <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end -mt-14 sm:-mt-16 gap-4 sm:gap-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center text-4xl sm:text-5xl text-indigo-500 shadow-md shrink-0 overflow-hidden">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : '👤'}
            </div>
            <div className="flex-1 pt-2 sm:pt-0 sm:pb-1">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">{profile?.nombre || (isOwnProfile ? user?.email?.split('@')[0] : t('perfil.usuario'))}</h1>
                {isOwnProfile ? (
                  <button type="button" onClick={() => navigate('/configuracion/editar-perfil')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer">
                    {t('perfil.editar')}
                  </button>
                ) : (
                  <button type="button"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer">
                    {t('perfil.seguir')}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {profile?.ubicacion || t('perfil.colombia')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-5 pb-5 border-b border-gray-100">
            <button type="button" onClick={() => setShowFollowers(true)}
              className="text-center hover:bg-gray-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer">
              <p className="text-lg font-bold text-gray-900">{(profile as any)?.seguidores || followers.length || 0}</p>
              <p className="text-xs text-gray-500">{t('perfil.seguidores')}</p>
            </button>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{(profile as any)?.eventosCreados || 0}</p>
              <p className="text-xs text-gray-500">{t('perfil.eventos_creados')}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{(profile as any)?.eventosAsistidos || 0}</p>
              <p className="text-xs text-gray-500">{t('perfil.eventos_asistidos')}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('perfil.biografia')}</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{profile?.biografia || t('perfil.sin_biografia')}</p>
            </div>
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('perfil.categorias')}</h2>
              <div className="flex flex-wrap gap-2">
                {(profile?.categorias || ['Música', 'Tecnología']).map((cat: string) => (
                  <span key={cat} className="px-3 py-1.5 rounded-full bg-indigo-50 text-xs font-medium text-indigo-600">{cat}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFollowers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{t('perfil.seguidores')}</h3>
              <button type="button" onClick={() => setShowFollowers(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('perfil.buscar_seguidor')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">{t('perfil.no_seguidores')}</p>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg shrink-0">👤</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{f.follower?.full_name || t('perfil.usuario')}</p>
                        <p className="text-xs text-gray-400">@{f.follower?.full_name?.toLowerCase().replace(/\s/g, '')}</p>
                      </div>
                      <button type="button"
                        className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                        {t('perfil.seguir')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 text-center text-xs text-gray-400">
              {filtered.length} {t('perfil.de')} {followers.length} {t('perfil.seguidores')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
