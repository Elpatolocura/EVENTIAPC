-- Fix RLS policies on chat_messages to include the event organizer
DROP POLICY IF EXISTS "Usuarios con ticket pueden ver mensajes" ON public.chat_messages;
CREATE POLICY "Usuarios con ticket pueden ver mensajes"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.event_id = chat_messages.event_id
        AND tickets.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = chat_messages.event_id
        AND events.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios con ticket pueden enviar mensajes" ON public.chat_messages;
CREATE POLICY "Usuarios con ticket pueden enviar mensajes"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.tickets
        WHERE tickets.event_id = chat_messages.event_id
          AND tickets.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = chat_messages.event_id
          AND events.organizer_id = auth.uid()
      )
    )
  );
