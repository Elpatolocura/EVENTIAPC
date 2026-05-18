-- Notify organizer on ticket purchase
CREATE OR REPLACE FUNCTION public.notify_ticket_purchase()
RETURNS TRIGGER AS $$
DECLARE
  event_title TEXT;
  buyer_name TEXT;
BEGIN
  SELECT COALESCE(title, 'un evento') INTO event_title
  FROM public.events WHERE id = NEW.event_id;
  SELECT COALESCE(p.nombre, split_part(u.email, '@', 1), 'Alguien') INTO buyer_name
  FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = NEW.user_id;
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (
    (SELECT organizer_id FROM public.events WHERE id = NEW.event_id),
    '🎟️ ¡Nueva venta!',
    buyer_name || ' compró ' || NEW.qty || ' entrada(s) para ' || event_title || ' por $' || NEW.total
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ticket_purchase ON public.tickets;
CREATE TRIGGER on_ticket_purchase
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_purchase();
