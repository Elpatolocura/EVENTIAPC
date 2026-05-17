import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { generateSeedEvents } from '../data/seed-events'

export default function Semilla() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    if (!user || loading || done) return
    const confirmed = window.confirm('¿Insertar 100 eventos de prueba en Supabase?')
    if (!confirmed) return
    handleSeed()
  }, [user])

  const handleSeed = async () => {
    if (!user) return
    setLoading(true)
    setLog([])

    const events = generateSeedEvents()
    let inserted = 0

    for (let i = 0; i < events.length; i += 10) {
      const chunk = events.slice(i, i + 10).map(e => ({
        ...e,
        organizer_id: user.id,
        status: 'publicado',
      }))
      const { error } = await supabase.from('events').insert(chunk)
      if (error) {
        setLog(p => [...p, `❌ Error lote ${i / 10 + 1}: ${error.message}`])
      } else {
        inserted += chunk.length
        setLog(p => [...p, `✅ Lote ${i / 10 + 1}: ${chunk.length} eventos`])
      }
    }

    setLog(p => [...p, `\n🎉 Total: ${inserted}/${events.length} eventos`])
    setDone(true)
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-500">Debes iniciar sesión para usar esta página.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🌱 Semilla de datos</h1>
      <p className="text-sm text-gray-500 mb-6">Insertando 100 eventos de prueba en tu cuenta...</p>

      {log.length === 0 && !loading && (
        <button onClick={handleSeed} className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer">
          Insertar 100 eventos
        </button>
      )}

      {log.length > 0 && (
        <div className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs font-mono leading-relaxed max-h-80 overflow-y-auto">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {done && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          ✅ Listo. <a href="/" className="font-semibold underline">Ver en Inicio</a>
        </div>
      )}
    </div>
  )
}
