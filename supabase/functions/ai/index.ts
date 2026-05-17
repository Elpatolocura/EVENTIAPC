import { handleCors, corsHeaders } from './_shared/cors.ts'
import { callDeepSeek } from './_shared/deepseek.ts'
import { checkRateLimit } from './_shared/rate-limiter.ts'
import { getCachedResponse, setCachedResponse } from './_shared/cache.ts'
import { logUsage, incrementDailyLimit } from './_shared/log.ts'
import { validateImproveTitle, validateImproveDescription, validateChat, validateModerate, validateRecommend } from './_shared/validator.ts'
import {
  IMPROVE_TITLE_SYSTEM,
  IMPROVE_DESCRIPTION_SYSTEM,
  CHAT_SYSTEM_PREFIX,
  MODERATE_SYSTEM,
  RECOMMEND_SYSTEM,
} from './_shared/prompts.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4'

const START = Date.now()

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || ''

    const authHeader = req.headers.get('Authorization') || ''
    const userId = req.headers.get('x-user-id') || ''

    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const uid = user.id
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', uid)
      .maybeSingle()
    const isPremium = profile?.plan === 'Premium'

    const rateCheck = await checkRateLimit(uid, isPremium)
    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({ error: rateCheck.reason }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let result: { content: string; tokens: number; cached: boolean } | null = null

    switch (action) {
      case 'improve-title': {
        const body = await req.json()
        const v = validateImproveTitle(body)
        if (!v.valid) return error(400, v.error!, corsHeaders)

        const prompt = body.category
          ? `Categoría: ${body.category}. Título original: "${body.title}"`
          : `Título original: "${body.title}"`

        const cached = await getCachedResponse(prompt, 'improve-title')
        if (cached) {
          result = { content: cached, tokens: 0, cached: true }
          break
        }

        const ai = await callDeepSeek(
          [{ role: 'system', content: IMPROVE_TITLE_SYSTEM }, { role: 'user', content: prompt }],
          { max_tokens: 100, temperature: 0.8 }
        )
        await setCachedResponse(prompt, ai.content, 'improve-title', ai.model)
        result = { content: ai.content, tokens: ai.total_tokens, cached: false }
        break
      }

      case 'improve-description': {
        const body = await req.json()
        const v = validateImproveDescription(body)
        if (!v.valid) return error(400, v.error!, corsHeaders)

        const prompt = body.category
          ? `Categoría: ${body.category}. Texto original: "${body.description.slice(0, 500)}"`
          : `Texto original: "${body.description.slice(0, 500)}"`

        const cached = await getCachedResponse(prompt, 'improve-description')
        if (cached) {
          result = { content: cached, tokens: 0, cached: true }
          break
        }

        const ai = await callDeepSeek(
          [{ role: 'system', content: IMPROVE_DESCRIPTION_SYSTEM }, { role: 'user', content: prompt }],
          { max_tokens: 250, temperature: 0.7 }
        )
        await setCachedResponse(prompt, ai.content, 'improve-description', ai.model)
        result = { content: ai.content, tokens: ai.total_tokens, cached: false }
        break
      }

      case 'chat': {
        const body = await req.json()
        const v = validateChat(body)
        if (!v.valid) return error(400, v.error!, corsHeaders)

        const history = (body.history || []).slice(-6)
        const messages = [
          { role: 'system' as const, content: `${CHAT_SYSTEM_PREFIX}\n\nContexto del usuario:\n${body.eventsContext || 'Sin contexto'}` },
          ...history,
          { role: 'user' as const, content: body.message.slice(0, 1000) },
        ]

        const ai = await callDeepSeek(messages, { max_tokens: 500, temperature: 0.7 })

        await supabase.from('ai_memory').insert([
          { user_id: uid, role: 'user', content: body.message.slice(0, 500) },
          { user_id: uid, role: 'assistant', content: ai.content.slice(0, 500) },
        ])

        supabase.rpc('trim_ai_memory', { user_id_param: uid }).catch(() => {})

        result = { content: ai.content, tokens: ai.total_tokens, cached: false }
        break
      }

      case 'moderate': {
        const body = await req.json()
        const v = validateModerate(body)
        if (!v.valid) return error(400, v.error!, corsHeaders)

        const cached = await getCachedResponse(body.content.slice(0, 200), 'moderate')
        if (cached) {
          result = { content: cached, tokens: 0, cached: true }
          break
        }

        const ai = await callDeepSeek(
          [{ role: 'system', content: MODERATE_SYSTEM }, { role: 'user', content: body.content.slice(0, 2000) }],
          { max_tokens: 100, temperature: 0.1 }
        )
        await setCachedResponse(body.content.slice(0, 200), ai.content, 'moderate', ai.model, 72)
        result = { content: ai.content, tokens: ai.total_tokens, cached: false }
        break
      }

      case 'recommend': {
        const body = await req.json()

        const { data: events } = await supabase
          .from('events')
          .select('id, title, category, city, price, date')
          .eq('status', 'publicado')
          .limit(50)

        if (!events || events.length === 0) {
          result = { content: '{"recommendations":[]}', tokens: 0, cached: false }
          break
        }

        const eventsSummary = events.map(e =>
          `[${e.id}] ${e.title} — ${e.category || 'General'} — ${e.city || ''} — ${e.price || 'Gratis'}`
        ).join('\n')

        const prompt = `Preferencias del usuario: ${JSON.stringify(body)}\n\nEventos disponibles:\n${eventsSummary}`
        const ai = await callDeepSeek(
          [{ role: 'system', content: RECOMMEND_SYSTEM }, { role: 'user', content: prompt }],
          { max_tokens: 300, temperature: 0.3 }
        )
        result = { content: ai.content, tokens: ai.total_tokens, cached: false }
        break
      }

      default:
        return error(400, `Unknown action: ${action}`, corsHeaders)
    }

    const duration = Date.now() - START

    logUsage({
      user_id: uid,
      endpoint: action,
      model: 'deepseek-chat',
      prompt_tokens: 0,
      completion_tokens: result.tokens,
      total_tokens: result.tokens,
      estimated_cost_usd: result.tokens * 0.0011 / 1000,
      cache_hit: result.cached,
      duration_ms: duration,
      ip_address: req.headers.get('x-forwarded-for') || '',
    }).catch(() => {})

    if (!result.cached && result.tokens > 0) {
      incrementDailyLimit(uid, result.tokens).catch(() => {})
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.content,
      cached: result.cached,
      tokens: result.tokens,
      ms: duration,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('AI function error:', err)
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function error(status: number, message: string, cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
