const API_KEY = 'sk-344b246e3dd348e1b86a190ef58ce9d7'
const API_URL = 'https://api.deepseek.com/v1/chat/completions'

export async function improveWithAI(prompt: string, context: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Eres un asistente experto en crear contenido atractivo para eventos en español. Responde solo con el texto mejorado, sin explicaciones ni comillas.' },
        { role: 'user', content: `${prompt}\n\n${context}` },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

export async function chatWithAI(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}
