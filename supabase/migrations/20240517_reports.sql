CREATE TABLE IF NOT EXISTS public.reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('evento', 'chat')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view reports" ON public.reports FOR SELECT USING (true);
