import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllEvents } from '../lib/db'
import { chatWithAI } from '../lib/ai'

export default function ChatIA() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: '¡Hola! Soy YULIANIS, tu asistente inteligente de Eventia. Puedo consultar eventos, ayudarte a usar la plataforma o resolver tus dudas. ¿En qué te ayudo?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [eventsContext, setEventsContext] = useState('')

  useEffect(() => {
    getAllEvents().then((evts) => {
      if (evts.length > 0) {
        const list = evts.slice(0, 20).map((e: any) =>
          `- "${e.title}" en ${e.city || 'varias ciudades'} el ${e.date || 'próximamente'} (${e.type === 'Gratis' ? 'Gratis' : e.price || 'consultar'})`
        ).join('\n')
        setEventsContext(`Estos son los eventos disponibles actualmente:\n${list}\n\nLos usuarios pueden crear eventos, comprar entradas, chatear con organizadores, seguir a otros usuarios, y gestionar su perfil.`)
      } else {
        setEventsContext('No hay eventos disponibles actualmente. Los usuarios pueden crear eventos desde la sección "Crear Evento" en el menú lateral.')
      }
    })
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = { id: Date.now(), role: 'user' as const, content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages.slice(-10), userMsg]
      const systemPrompt = `Eres YULIANIS, la asistente virtual de Eventia (plataforma de eventos). Tu personalidad es amable, entusiasta y servicial.

INFORMACIÓN DE LA PLATAFORMA:
- Los usuarios pueden: crear eventos, comprar/vender entradas, chatear en eventos, seguir usuarios, gestionar perfil, dejar reseñas.
- Secciones disponibles: Inicio, Favoritos, Crear Evento, Chat, Chat IA, Mis Entradas, Mis Eventos, Notificaciones, Perfil, Configuración.
- Los eventos tienen: título, descripción, categoría, fecha, hora, ciudad, dirección, precio, capacidad, fotos, servicios.

${eventsContext}

Responde siempre en español, de forma clara y concisa. Si te preguntan por eventos, consulta la lista disponible. Si necesitan crear un evento, guíalos paso a paso. Sé cálida y usa emojis ocasionalmente.`

      const result = await chatWithAI(systemPrompt, history.map(m => ({ role: m.role, content: m.content })))
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: result || 'Lo siento, no pude procesar tu solicitud.' }])
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: 'Ocurrió un error. Por favor intenta de nuevo.' }])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center gap-3">
        <span className="text-3xl">✨</span>
        <div>
          <h1 className="font-bold text-lg">YULIANIS</h1>
          <p className="text-xs text-pink-100 font-medium">En línea</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none shadow-sm px-5 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escríbele a YULIANIS..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block pl-4 pr-12 py-3.5 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:hover:bg-pink-600 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
