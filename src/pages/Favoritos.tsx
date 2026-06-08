import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getFavorites } from '../lib/db'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import { formatPrice } from '../lib/price'

export default function Favoritos() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<any[]>([])
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null)

  useEffect(() => {
    if (user) getFavorites(user.id).then(setFavorites)
  }, [user])

  const handleRemoveClick = (favId: number) => {
    setConfirmRemove(favId)
  }

  const removeFavorite = async (favId: number) => {
    await supabase.from('favorites').delete().eq('id', favId)
    setFavorites((prev) => prev.filter((f) => f.id !== favId))
    setConfirmRemove(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-orbitron font-extrabold uppercase text-lg text-gray-900 mb-1">{t('favoritos.titulo')}</h1>
      <p className="font-share-tech text-accent-secondary text-sm mb-6 flex items-center gap-1.5">
        <svg className="w-4 h-4 text-accent-secondary" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
        {favorites.length} {t('favoritos.evento_guardado')}
      </p>

      {favorites.length === 0 ? (
        <div className="bg-white border-2 border-black shadow-[2px_2px_0px_#000] rounded-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500" />
          <div className="p-12 text-center">
            <span className="text-4xl block mb-3">⭐</span>
            <p className="font-share-tech text-sm text-gray-500 mb-1">{t('favoritos.vacio')}</p>
            <p className="font-share-tech text-xs text-gray-400">{t('favoritos.explora')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => {
            const ev = fav.events || {}
            const photos: string[] = ev.photos || []
            return (
              <Link key={fav.id} to={`/evento/${ev.id}`}
                className="bg-white rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] overflow-hidden flex flex-col group hover:shadow-[3px_3px_0px_var(--accent)] hover:border-accent transition-all">
                {photos[0] ? (
                  <div className="h-32 overflow-hidden">
                    <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-2xl">
                    🎉
                  </div>
                )}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-orbitron text-sm font-semibold text-gray-900 truncate">{ev.title || 'Evento'}</h3>
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveClick(fav.id) }}
                        className="shrink-0 text-gray-500 hover:text-red-600 transition-colors cursor-pointer" title={t('favoritos.eliminar')}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 font-share-tech text-xs text-gray-500 mt-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {ev.date || 'Próximamente'}
                      <span className="mx-1 text-gray-300">|</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {ev.city || 'Colombia'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <p className="font-orbitron text-sm font-semibold text-gray-900">{formatPrice(ev.price)}</p>
                    <span className="font-share-tech text-xs font-medium text-accent-secondary group-hover:underline transition-colors">{t('favoritos.comprar')}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {confirmRemove !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmRemove(null)}>
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-lg p-6 max-w-sm mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-orbitron font-bold text-sm text-gray-900 mb-3">{t('favoritos.confirmar_eliminar') || '¿Deseas quitar este evento de favoritos?'}</h3>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirmRemove(null)}
                className="cyber-btn px-4 py-2 rounded-lg text-xs font-medium cursor-pointer">
                No
              </button>
              <button type="button" onClick={() => removeFavorite(confirmRemove)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-red-500 text-white border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-red-600 transition-colors cursor-pointer">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
