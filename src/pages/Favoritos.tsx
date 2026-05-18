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

  useEffect(() => {
    if (user) getFavorites(user.id).then(setFavorites)
  }, [user])

  const removeFavorite = async (favId: number) => {
    await supabase.from('favorites').delete().eq('id', favId)
    setFavorites((prev) => prev.filter((f) => f.id !== favId))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('favoritos.titulo')}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {favorites.length} {t('favoritos.evento_guardado')}
      </p>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <span className="text-4xl block mb-3">⭐</span>
          <p className="text-sm text-gray-500 mb-1">{t('favoritos.vacio')}</p>
          <p className="text-xs text-gray-400">{t('favoritos.explora')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map((fav) => {
            const ev = fav.events || {}
            const photos: string[] = ev.photos || []
            return (
              <Link key={fav.id} to={`/evento/${ev.id}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex group hover:shadow-md transition-shadow">
                {photos[0] ? (
                  <div className="w-24 shrink-0 overflow-hidden">
                    <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 shrink-0 bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-2xl">
                    🎉
                  </div>
                )}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{ev.title || 'Evento'}</h3>
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFavorite(fav.id) }}
                        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors cursor-pointer" title={t('favoritos.eliminar')}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {ev.date || 'Próximamente'}
                      <span className="mx-1 text-gray-300">|</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {ev.city || 'Colombia'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(ev.price)}</p>
                    <span className="text-xs font-medium text-indigo-600 group-hover:text-indigo-700 transition-colors">{t('favoritos.comprar')}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
