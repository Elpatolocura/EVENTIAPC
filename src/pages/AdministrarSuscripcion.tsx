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
          onClick={() => navigate(-1)}
          className="cyber-btn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-orbitron font-extrabold uppercase text-2xl text-gray-900">Administrar suscripción</h1>
      </div>

      <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 relative overflow-hidden space-y-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-500" />

        <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-600 to-fuchsia-700 text-white shadow-[3px_3px_0px_#000] border-2 border-black">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-cyan-200 text-sm font-medium mb-1 font-share-tech uppercase tracking-wider">Plan actual</p>
              <h2 className="text-3xl font-bold flex items-center gap-2 font-orbitron">
                ⭐ {plan}
              </h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/20 text-sm font-semibold border border-white/30">
              Activo
            </div>
          </div>
          <p className="text-cyan-100 text-sm font-share-tech">
            Disfruta de eventos ilimitados, sin comisiones por venta y soporte 24/7.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-orbitron font-bold text-lg text-gray-900">Detalles de la suscripción</h3>
          <div className="divide-y divide-gray-200 border-2 border-black rounded-xl bg-white shadow-[2px_2px_0px_#000]">
            <div className="flex items-center justify-between p-4">
              <span className="font-share-tech text-sm text-slate-600 uppercase">Estado</span>
              <span className="text-sm font-medium text-green-600 font-orbitron">Al día</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="font-share-tech text-sm text-slate-600 uppercase">Renovación automática</span>
              <span className="text-sm font-medium text-gray-900 font-orbitron">Activada</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t-2 border-dashed border-gray-300">
          <h3 className="font-orbitron font-bold text-lg text-fuchsia-600 mb-2">Zona de peligro</h3>
          <p className="font-share-tech text-sm text-slate-600 mb-4">
            Si cancelas tu suscripción perderás acceso a las funciones premium inmediatamente y tu cuenta volverá al plan Gratis.
          </p>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="cyber-btn-danger"
          >
            Cancelar suscripción
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] p-6 w-80 mx-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-500" />
            <h2 className="font-orbitron font-extrabold uppercase text-lg text-gray-900 mb-2">¿Estás seguro?</h2>
            <p className="font-share-tech text-sm text-slate-600 mb-6">
              Perderás tus beneficios premium. Tus eventos existentes no se eliminarán, pero no podrás crear nuevos hasta que vuelvas a suscribirte.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="cyber-btn"
              >
                Mantener plan
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={canceling}
                className="cyber-btn-danger"
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
