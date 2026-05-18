CREATE TABLE IF NOT EXISTS public.chat_pinned (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE public.chat_pinned ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own chat pins" ON public.chat_pinned;
CREATE POLICY "Users can manage own chat pins" ON public.chat_pinned
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.toggle_chat_pin(p_user_id UUID, p_event_id UUID, p_pinned BOOLEAN)
RETURNS void AS $$
BEGIN
  IF p_pinned THEN
    INSERT INTO public.chat_pinned (user_id, event_id)
    VALUES (p_user_id, p_event_id)
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.chat_pinned
    WHERE user_id = p_user_id AND event_id = p_event_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_pinned_chats(p_user_id UUID)
RETURNS TABLE(event_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT cp.event_id
  FROM public.chat_pinned cp
  WHERE cp.user_id = p_user_id
  ORDER BY cp.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
