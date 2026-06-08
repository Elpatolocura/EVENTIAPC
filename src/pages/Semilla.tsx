import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { generateSeedEvents } from '../data/seed-events'

export default function Semilla() {
  const { user } = useAuth()
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
        <p className="font-share-tech text-slate-600">Debes iniciar sesión para usar esta página.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#f8f9fa] rounded-xl border-2 border-black shadow-[4px_4px_0px_#000] p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-400" />
        <h1 className="text-2xl font-orbitron font-extrabold uppercase text-gray-900 mb-2">🌱 Semilla de datos</h1>
        <p className="text-sm font-share-tech text-slate-600 mb-6">Insertando 100 eventos de prueba en tu cuenta...</p>

        {log.length === 0 && !loading && (
          <button onClick={handleSeed} className="px-6 py-3 rounded-xl cyber-btn-active border-2 border-black text-sm font-orbitron font-bold uppercase shadow-[2px_2px_0px_#000] cursor-pointer">
            Insertar 100 eventos
          </button>
        )}

        {log.length > 0 && (
          <div className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs font-mono leading-relaxed max-h-80 overflow-y-auto border-2 border-black shadow-[2px_2px_0px_#000]">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}

        {done && (
          <div className="mt-4 p-4 bg-green-50 border-2 border-black shadow-[2px_2px_0px_#000] rounded-xl text-sm font-share-tech text-green-700">
            ✅ Listo. <a href="/" className="font-bold underline text-cyan-600 hover:text-fuchsia-600 transition-colors">Ver en Inicio</a>
          </div>
        )}
      </div>
    </div>
  )
}
