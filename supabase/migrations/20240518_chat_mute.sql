CREATE TABLE IF NOT EXISTS public.chat_muted (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  muted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE public.chat_muted ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own chat mute" ON public.chat_muted;
CREATE POLICY "Users can manage own chat mute" ON public.chat_muted
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.toggle_chat_mute(p_user_id UUID, p_event_id UUID, p_muted BOOLEAN)
RETURNS void AS $$
BEGIN
  INSERT INTO public.chat_muted (user_id, event_id, muted)
  VALUES (p_user_id, p_event_id, p_muted)
  ON CONFLICT (user_id, event_id)
  DO UPDATE SET muted = p_muted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_muted_chats(p_user_id UUID)
RETURNS TABLE(event_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT cm.event_id
  FROM public.chat_muted cm
  WHERE cm.user_id = p_user_id AND cm.muted = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
