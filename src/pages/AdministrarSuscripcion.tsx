import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function AdministrarSuscripcion() {
  const navigate = useNavigate()
  const { user, plan, refreshPlan } = useAuth()
  const [canceling, setCanceling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCancel = async () => {
    if (!user) return
    setCanceling(true)
    
    // Cambiar plan a Gratis
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'Gratis' })
      .eq('id', user.id)

    if (!error) {
      await refreshPlan()
      navigate('/configuracion')
    }
    setCanceling(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Administrar suscripción</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Plan actual</p>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                ⭐ {plan}
              </h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/20 text-sm font-semibold">
              Activo
            </div>
          </div>
          <p className="text-indigo-100 text-sm">
            Disfruta de eventos ilimitados, sin comisiones por venta y soporte 24/7.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Detalles de la suscripción</h3>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-gray-500">Estado</span>
              <span className="text-sm font-medium text-green-600">Al día</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-gray-500">Renovación automática</span>
              <span className="text-sm font-medium text-gray-900">Activada</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Zona de peligro</h3>
          <p className="text-sm text-gray-500 mb-4">
            Si cancelas tu suscripción perderás acceso a las funciones premium inmediatamente y tu cuenta volverá al plan Gratis.
          </p>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
          >
            Cancelar suscripción
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Estás seguro?</h2>
            <p className="text-sm text-gray-600 mb-6">
              Perderás tus beneficios premium. Tus eventos existentes no se eliminarán, pero no podrás crear nuevos hasta que vuelvas a suscribirte.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Mantener plan
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={canceling}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {canceling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
