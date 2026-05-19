import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getAllEvents } from '../lib/db'
import { chatWithAI } from '../lib/ai'
import { formatPrice } from '../lib/price'

const STORAGE_KEY = (uid?: string | null) => `yulianis_chat_${uid || 'anonymous'}`
const INACTIVITY_MS = 120000

function renderContent(text: string, navigate: ReturnType<typeof useNavigate>, onBuyTicket?: (eventId: string, title: string) => void) {
  const cardRegex = /\[CARD:([^\]]+)\]/g
  const segments: { type: 'text' | 'card'; value: string; cardData?: string[] }[] = []
  let lastIdx = 0, m: RegExpExecArray | null
  while ((m = cardRegex.exec(text)) !== null) {
    if (m.index > lastIdx) segments.push({ type: 'text', value: text.slice(lastIdx, m.index) })
    segments.push({ type: 'card', value: m[1], cardData: m[1].split('|') })
    lastIdx = cardRegex.lastIndex
  }
  if (lastIdx < text.length) segments.push({ type: 'text', value: text.slice(lastIdx) })

  return segments.map((seg, segIdx) => {
    if (seg.type === 'card' && seg.cardData && seg.cardData.length >= 2) {
      const [eventId, title, date, city, price] = seg.cardData
      return (
        <div key={segIdx} className="border border-gray-200 rounded-xl p-3 my-2 bg-white shadow-sm">
          <h4 className="font-semibold text-sm text-gray-900 mb-1">{title}</h4>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500 mb-2">
            {date && <span>📅 {date}</span>}
            {city && <span>📍 {city}</span>}
            {price && <span>💰 {formatPrice(price)}</span>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate(`/evento/${eventId}`)}
              className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-medium cursor-pointer">
              Ver más
            </button>
            <button type="button" onClick={() => onBuyTicket ? onBuyTicket(eventId, title) : navigate(`/evento/${eventId}`)}
              className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs font-medium cursor-pointer">
              Comprar entrada
            </button>
          </div>
        </div>
      )
    }
    const linkParts = seg.value.split(/(\[BUY:[^\]]+\])/g)
    return linkParts.map((part, i) => {
      const buyMatch = part.match(/^\[BUY:([^\]]+):(\d+)\]$/)
      if (buyMatch && onBuyTicket) {
        const [, , _qtyStr] = buyMatch
        return null
      }
      return <span key={`${segIdx}-${i}`}>{part}</span>
    })
  })
}

function loadMessages(uid?: string | null) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY(uid))
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return [
    { id: 1, role: 'ai', content: '¡Hola! Soy YULIANIS, tu asistente inteligente de Eventia. Puedo consultar eventos, ayudarte a usar la plataforma o resolver tus dudas. ¿En qué te ayudo?' }
  ]
}

export default function ChatIA() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>(() => loadMessages(user?.id))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [eventsContext, setEventsContext] = useState('')
  const [buyModal, setBuyModal] = useState<{ eventId: string; title: string } | null>(null)
  const [buyQty, setBuyQty] = useState(1)
  const [buying, setBuying] = useState(false)
  const [bought, setBought] = useState(false)
  const lastActivity = useRef(Date.now())
  const inactivityTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAllEvents().then((evts) => {
      if (evts.length > 0) {
        const list = evts.slice(0, 20).map((e: any) =>
          `- ${e.title} (ID:${e.id}) — ${e.city || 'varias ciudades'} — ${e.date || 'próximamente'} — ${e.type === 'Gratis' ? 'Gratis' : e.price || 'consultar'}`
        ).join('\n')
        setEventsContext(`Estos son los eventos disponibles actualmente:\n${list}\n\nLos usuarios pueden crear eventos, comprar entradas, chatear con organizadores, seguir a otros usuarios, y gestionar su perfil.`)
      } else {
        setEventsContext('No hay eventos disponibles actualmente. Los usuarios pueden crear eventos desde la sección "Crear Evento" en el menú lateral.')
      }
    })
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY(user?.id), JSON.stringify(messages))
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, user?.id])

  useEffect(() => {
    setMessages(loadMessages(user?.id))
  }, [user?.id])

  useEffect(() => {
    inactivityTimer.current = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current
      if (elapsed >= INACTIVITY_MS && !loading) {
        const last = messages[messages.length - 1]
        if (last && last.role === 'ai' && last.content.includes('¿Quieres finalizar')) return
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'ai',
          content: '😊 Llevas un tiempo sin escribir. ¿Quieres finalizar la conversación o necesitas ayuda con algo más?'
        }])
        lastActivity.current = Date.now()
      }
    }, 30000)
    return () => { if (inactivityTimer.current) clearInterval(inactivityTimer.current) }
  }, [messages, loading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    lastActivity.current = Date.now()

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

Instrucciones importantes:
- Cuando el usuario pregunte por un evento o pida información, responde con el formato exacto:
  [CARD:ID|Título|Fecha|Ciudad|Precio]
  Ejemplo: [CARD:abc-123|Concierto Rock|15 Jun|Medellín|$50.000]
  IMPORTANTE: Usa | como separador. Si falta algún dato, déjalo vacío (ej: abc-123|Título||Ciudad|).
- Cuando el usuario te pida comprar entradas y ya tengas el ID y la cantidad, termina tu respuesta con: [BUY:ID:CANTIDAD]
  Ejemplo: [BUY:abc-123:2]
- Solo usa [BUY:...] si el usuario pidió explícitamente comprar.
- NUNCA uses formato de link [texto](/ruta) — solo usa [CARD:...] para eventos y [BUY:...] para compras.
- Responde siempre en español, de forma clara y concisa.
- Sé cálida y usa emojis ocasionalmente.`

      const result = await chatWithAI(systemPrompt, history.map(m => ({ role: m.role, content: m.content })))
      const buyMatch = result?.match(/\[BUY:([^\]]+):(\d+)\]/)
      if (buyMatch && user) {
        const [, eventId, qtyStr] = buyMatch
        const qty = parseInt(qtyStr) || 1
        const cleanResult = result?.replace(/\[BUY:[^\]]+\]/, '').trim()
        const { error } = await supabase.from('tickets').insert({
          event_id: eventId, user_id: user.id, qty, total: 0,
          status: 'válida', code: `TIX-${Date.now().toString(36).toUpperCase()}`,
        })
        if (!error) {
          setMessages(prev => [...prev, {
            id: Date.now(), role: 'ai',
            content: `${cleanResult || '✅ Entrada comprada correctamente.'} Puedes ver tus entradas en Mis Entradas.`
          }])
        } else {
          setMessages(prev => [...prev, {
            id: Date.now(), role: 'ai',
            content: 'Lo siento, ocurrió un error al procesar la compra. Intenta de nuevo.'
          }])
        }
      } else {
        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: result || 'Lo siento, no pude procesar tu solicitud.' }])
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: 'Ocurrió un error. Por favor intenta de nuevo.' }])
    }
    setLoading(false)
  }

  const handleBuyTicket = async () => {
    if (!user || !buyModal || buying) return
    setBuying(true)
    const { error } = await supabase.from('tickets').insert({
      event_id: buyModal.eventId,
      user_id: user.id,
      qty: buyQty,
      total: 0,
      status: 'válida',
      code: `TIX-${Date.now().toString(36).toUpperCase()}`,
    })
    setBuying(false)
    if (!error) {
      setBought(true)
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'ai',
        content: `✅ ¡Entrada${buyQty > 1 ? 's' : ''} comprada${buyQty > 1 ? 's' : ''} para ${buyModal.title}! Puedes ver tus entradas en Mis Entradas.`
      }])
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center gap-3">
          <span className="text-3xl">✨</span>
          <div>
            <h1 className="font-bold text-lg">YULIANIS</h1>
            <p className="text-xs text-pink-100 font-medium">Asistente IA</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <span className="text-5xl block mb-4">🔒</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Inicia sesión para usar YULIANIS</h2>
            <p className="text-gray-500 mb-6 text-sm">YULIANIS es tu asistente inteligente de Eventia. Inicia sesión para hablar con ella.</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all cursor-pointer"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    )
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
              <div className="leading-relaxed whitespace-pre-wrap">{renderContent(m.content, navigate, (eid, title) => { setBuyModal({ eventId: eid, title }); setBuyQty(1); setBought(false) })}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
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

      {buyModal && (
        <div className="p-4 bg-white border-t border-gray-100">
          {bought ? (
            <p className="text-sm text-green-600 text-center font-medium">✅ ¡Entrada{ buyQty > 1 ? 's' : '' } comprada{ buyQty > 1 ? 's' : '' }!</p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{buyModal.title}</p>
                <p className="text-xs text-gray-500">Cantidad de entradas</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setBuyQty(Math.max(1, buyQty - 1))} disabled={buyQty <= 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer text-lg font-medium">−</button>
                <span className="w-8 text-center text-sm font-semibold text-gray-900">{buyQty}</span>
                <button type="button" onClick={() => setBuyQty(Math.min(10, buyQty + 1))} disabled={buyQty >= 10}
                  className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer text-lg font-medium">+</button>
              </div>
              <button type="button" onClick={handleBuyTicket} disabled={buying}
                className="px-5 py-2.5 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer whitespace-nowrap">
                {buying ? 'Comprando...' : `Comprar ${buyQty > 1 ? buyQty : ''}`.trim()}
              </button>
              <button type="button" onClick={() => setBuyModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escríbele a YULIANIS..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block pl-4 pr-12 py-3.5 transition-colors"
            onFocus={() => { lastActivity.current = Date.now() }}
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
