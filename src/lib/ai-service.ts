import { supabase } from './supabase'

const AI_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai`

interface AIOptions {
  signal?: AbortSignal
}

interface AIResponse<T = string> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  tokens?: number
  ms?: number
}

async function callAI(action: string, payload: Record<string, any>, opts?: AIOptions): Promise<AIResponse> {
  try {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    if (!token) {
      return { success: false, error: 'No hay sesión activa' }
    }

    const res = await fetch(`${AI_FUNCTION_URL}?action=${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: opts?.signal,
    })

    const json = await res.json()

    if (!res.ok) {
      return { success: false, error: json.error || `Error ${res.status}` }
    }

    return {
      success: json.success,
      data: json.data,
      cached: json.cached,
      tokens: json.tokens,
      ms: json.ms,
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Solicitud cancelada' }
    }
    return { success: false, error: err instanceof Error ? err.message : 'Error de conexión' }
  }
}

export async function improveTitle(
  title: string,
  category?: string,
  opts?: AIOptions
): Promise<AIResponse<string>> {
  return callAI('improve-title', { title, category }, opts) as Promise<AIResponse<string>>
}

export async function improveDescription(
  description: string,
  category?: string,
  opts?: AIOptions
): Promise<AIResponse<string>> {
  return callAI('improve-description', { description, category }, opts) as Promise<AIResponse<string>>
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function chatWithAI(
  message: string,
  history: ChatMessage[],
  eventsContext?: string,
  opts?: AIOptions
): Promise<AIResponse<string>> {
  return callAI('chat', { message, history: history.slice(-6), eventsContext }, opts) as Promise<AIResponse<string>>
}

export async function moderateContent(
  content: string,
  opts?: AIOptions
): Promise<AIResponse<{ flagged: boolean; reason?: string; confidence?: number }>> {
  const result = await callAI('moderate', { content }, opts)
  if (result.success && result.data) {
    try {
      const parsed = JSON.parse(result.data)
      return { ...result, data: parsed }
    } catch {
      return { ...result, data: { flagged: false } }
    }
  }
  return result as AIResponse<any>
}

export async function getRecommendations(
  preferences: { categories?: string[]; city?: string; priceRange?: string },
  opts?: AIOptions
): Promise<AIResponse<{ eventId: string; reason: string }[]>> {
  const result = await callAI('recommend', preferences, opts)
  if (result.success && result.data) {
    try {
      const parsed = JSON.parse(result.data)
      return { ...result, data: parsed.recommendations || [] }
    } catch {
      return { ...result, data: [] }
    }
  }
  return result as AIResponse<any>
}
