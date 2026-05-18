CREATE OR REPLACE FUNCTION public.delete_notification(p_id BIGINT)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE id = p_id AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_all_notifications()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE user_id = auth.uid();
END;
$$;
