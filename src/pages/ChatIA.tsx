import { useState } from 'react'

export default function ChatIA() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: '¡Hola! Soy Amore, tu asistente inteligente de Eventia. ¿En qué te puedo ayudar hoy? Puedo recomendarte eventos, ayudarte a organizar uno o resolver tus dudas sobre la plataforma.' }
  ])
  const [input, setInput] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { id: Date.now(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Simular respuesta de la IA
    setTimeout(() => {
      const aiMessage = { 
        id: Date.now() + 1, 
        role: 'ai', 
        content: 'Esta es una función en desarrollo. Próximamente la Inteligencia Artificial te ayudará a encontrar los mejores eventos y a gestionar tu experiencia.' 
      }
      setMessages(prev => [...prev, aiMessage])
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center gap-3">
        <span className="text-3xl">✨</span>
        <div>
          <h1 className="font-bold text-lg">Amore</h1>
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
              <p className="leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escríbele a Amore..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block pl-4 pr-12 py-3.5 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim()}
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
