import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4'

interface UsageLog {
  user_id: string | null
  endpoint: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  cache_hit: boolean
  duration_ms: number
  ip_address: string
}

export async function logUsage(log: UsageLog): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    await supabase.from('ai_usage_logs').insert(log)
  } catch (err) {
    console.error('Failed to log AI usage:', err)
  }
}

export async function incrementDailyLimit(userId: string, tokens: number): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const today = new Date().toISOString().split('T')[0]

  await supabase.from('ai_daily_limits').upsert({
    user_id: userId,
    date: today,
    requests: 1,
    tokens_used: tokens,
  }, {
    onConflict: 'user_id,date',
    ignoreDuplicates: false,
  })

  await supabase.rpc('increment_daily_limit', {
    p_user_id: userId,
    p_date: today,
    p_tokens: tokens,
  }).catch(() => {
    supabase.from('ai_daily_limits').update({
      requests: supabase.rpc('increment', { x: 1 }),
      tokens_used: supabase.rpc('increment', { x: tokens }),
    }).eq('user_id', userId).eq('date', today)
  })
}
