import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4'

function hashPrompt(prompt: string, endpoint: string): string {
  const data = new TextEncoder().encode(`${endpoint}:${prompt}`)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i]
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export async function getCachedResponse(
  prompt: string,
  endpoint: string
): Promise<string | null> {
  const hash = hashPrompt(prompt, endpoint)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data } = await supabase
    .from('ai_cache')
    .select('response')
    .eq('prompt_hash', hash)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle()

  return data?.response || null
}

export async function setCachedResponse(
  prompt: string,
  response: string,
  endpoint: string,
  model: string,
  ttlHours: number = 24
): Promise<void> {
  const hash = hashPrompt(prompt, endpoint)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const expiresAt = new Date(Date.now() + ttlHours * 3600000).toISOString()

  await supabase.from('ai_cache').upsert({
    prompt_hash: hash,
    prompt,
    response,
    endpoint,
    model,
    expires_at: expiresAt,
  }, { onConflict: 'prompt_hash' })
}
