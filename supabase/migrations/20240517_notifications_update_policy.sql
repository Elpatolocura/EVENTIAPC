DROP POLICY IF EXISTS "Usuarios pueden actualizar sus notificaciones" ON public.notifications;
CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);
