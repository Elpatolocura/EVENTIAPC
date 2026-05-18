-- Notify followers when someone they follow creates or publishes an event
CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS TRIGGER AS $$
DECLARE
  follower_id UUID;
BEGIN
  IF NEW.status != 'publicado' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'publicado' THEN
    RETURN NEW;
  END IF;
  FOR follower_id IN
    SELECT f.follower_id FROM public.followers f
    WHERE f.following_id = NEW.organizer_id
  LOOP
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (follower_id, 'Nuevo evento', NEW.title || ' fue publicado');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_event ON public.events;
CREATE TRIGGER on_new_event
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_event();

DROP TRIGGER IF EXISTS on_publish_event ON public.events;
CREATE TRIGGER on_publish_event
  AFTER UPDATE ON public.events
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM 'publicado' AND NEW.status = 'publicado')
  EXECUTE FUNCTION public.notify_new_event();
