import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4'

interface RateLimitConfig {
  /** Max requests per minute per user */
  requestsPerMinute: number
  /** Max requests per day per user (free tier) */
  requestsPerDay: number
  /** Cooldown in ms between consecutive requests */
  cooldownMs: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  requestsPerMinute: 10,
  requestsPerDay: 100,
  cooldownMs: 1000,
}

export async function checkRateLimit(
  userId: string,
  isPremium: boolean,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60000)
  const today = now.toISOString().split('T')[0]

  const maxDay = isPremium ? config.requestsPerDay * 5 : config.requestsPerDay

  const [minuteCount, dayCount, lastLog] = await Promise.all([
    supabase
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneMinuteAgo.toISOString()),

    supabase
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`),

    supabase
      .from('ai_usage_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (minuteCount.count != null && minuteCount.count >= config.requestsPerMinute) {
    return { allowed: false, reason: 'Demasiadas solicitudes por minuto. Espera un momento.' }
  }

  if (dayCount.count != null && dayCount.count >= maxDay) {
    return { allowed: false, reason: 'Límite diario alcanzado. Vuelve mañana o actualiza a Premium.' }
  }

  if (lastLog.data?.created_at) {
    const lastMs = new Date(lastLog.data.created_at).getTime()
    const elapsed = Date.now() - lastMs
    if (elapsed < config.cooldownMs) {
      return {
        allowed: false,
        reason: `Espera ${Math.ceil((config.cooldownMs - elapsed) / 1000)}s antes de la siguiente solicitud.`,
        remaining: Math.ceil((config.cooldownMs - elapsed) / 1000),
      }
    }
  }

  return {
    allowed: true,
    remaining: maxDay - (dayCount.count || 0),
  }
}
