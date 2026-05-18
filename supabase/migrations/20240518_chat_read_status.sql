-- Table to track when a user last read a chat conversation
CREATE TABLE IF NOT EXISTS public.chat_read_status (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE public.chat_read_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can upsert own read status" ON public.chat_read_status;
CREATE POLICY "Users can upsert own read status" ON public.chat_read_status
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to mark a conversation as read
CREATE OR REPLACE FUNCTION public.mark_chat_read(p_user_id UUID, p_event_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.chat_read_status (user_id, event_id, last_read_at)
  VALUES (p_user_id, p_event_id, NOW())
  ON CONFLICT (user_id, event_id)
  DO UPDATE SET last_read_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message counts for a user across all their events
CREATE OR REPLACE FUNCTION public.get_unread_chat_counts(p_user_id UUID)
RETURNS TABLE(event_id UUID, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS event_id,
    COUNT(cm.id)::BIGINT AS unread_count
  FROM public.events e
  INNER JOIN public.chat_messages cm ON cm.event_id = e.id
  LEFT JOIN public.chat_read_status crs ON crs.event_id = e.id AND crs.user_id = p_user_id
  WHERE (
    (crs.last_read_at IS NULL AND cm.created_at > e.created_at)
    OR
    (crs.last_read_at IS NOT NULL AND cm.created_at > crs.last_read_at)
  )
  AND cm.user_id != p_user_id
  AND (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.event_id = e.id AND t.user_id = p_user_id)
    OR
    e.organizer_id = p_user_id
  )
  GROUP BY e.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
