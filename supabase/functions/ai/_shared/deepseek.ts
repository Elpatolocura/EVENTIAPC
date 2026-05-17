export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekOptions {
  max_tokens?: number
  temperature?: number
  model?: 'deepseek-chat'
}

export interface DeepSeekResponse {
  content: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

const API_URL = 'https://api.deepseek.com/v1/chat/completions'

const MODEL_COST_PER_1K = {
  'deepseek-chat': { input: 0.00027, output: 0.0011 },
}

export function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const costs = MODEL_COST_PER_1K[model as keyof typeof MODEL_COST_PER_1K] || MODEL_COST_PER_1K['deepseek-chat']
  return ((promptTokens * costs.input) + (completionTokens * costs.output)) / 1000
}

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  opts: DeepSeekOptions = {}
): Promise<DeepSeekResponse> {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY')
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model || 'deepseek-chat',
      messages,
      max_tokens: opts.max_tokens || 150,
      temperature: opts.temperature ?? 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const choice = data.choices?.[0]?.message

  if (!choice) throw new Error('No response from DeepSeek')

  return {
    content: choice.content?.trim() || '',
    prompt_tokens: data.usage?.prompt_tokens || 0,
    completion_tokens: data.usage?.completion_tokens || 0,
    total_tokens: data.usage?.total_tokens || 0,
  }
}
