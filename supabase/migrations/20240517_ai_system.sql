-- =============================================
-- AI SYSTEM — Tables for cost-optimized AI features
-- =============================================

-- 1. AI USAGE LOGS (every AI call is logged for cost control)
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'deepseek-chat',
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  estimated_cost_usd NUMERIC(10,8) DEFAULT 0,
  cache_hit BOOLEAN DEFAULT FALSE,
  duration_ms INT DEFAULT 0,
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_date ON public.ai_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_endpoint ON public.ai_usage_logs(endpoint);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage"
  ON public.ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (true);

-- 2. AI CACHE (avoid duplicate calls, TTL-based expiration)
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id BIGSERIAL PRIMARY KEY,
  prompt_hash TEXT NOT NULL UNIQUE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'deepseek-chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON public.ai_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON public.ai_cache(expires_at);

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage cache"
  ON public.ai_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. DAILY LIMITS (per-user quota tracking)
CREATE TABLE IF NOT EXISTS public.ai_daily_limits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  requests INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE public.ai_daily_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own limits"
  ON public.ai_daily_limits FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Service role can upsert"
  ON public.ai_daily_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. AI MEMORY (lightweight conversation memory for YULIANIS)
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_user_time ON public.ai_memory(user_id, created_at DESC);

ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own memory"
  ON public.ai_memory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Cleanup: delete expired cache entries periodically
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 6. Cleanup: keep only last 50 memory entries per user (cheap memory)
CREATE OR REPLACE FUNCTION public.trim_ai_memory(user_id_param UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_memory
  WHERE user_id = user_id_param
    AND id NOT IN (
      SELECT id FROM public.ai_memory
      WHERE user_id = user_id_param
      ORDER BY created_at DESC
      LIMIT 50
    );
END;
$$ LANGUAGE plpgsql;
