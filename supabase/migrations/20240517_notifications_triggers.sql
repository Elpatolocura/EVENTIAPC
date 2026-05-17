-- Notify on new follower
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
BEGIN
  SELECT COALESCE(nombre, 'Alguien') INTO follower_name
  FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (NEW.following_id, 'Nuevo seguidor', follower_name || ' empezó a seguirte');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_follower ON public.followers;
CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follower();

-- Notify other ticket holders on new chat message
CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  event_title TEXT;
  other_user UUID;
BEGIN
  SELECT COALESCE(p.nombre, 'Alguien') INTO sender_name
  FROM public.profiles p WHERE p.id = NEW.user_id;
  SELECT COALESCE(title, 'un evento') INTO event_title
  FROM public.events WHERE id = NEW.event_id;
  FOR other_user IN
    SELECT DISTINCT t.user_id FROM public.tickets t
    WHERE t.event_id = NEW.event_id AND t.user_id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (other_user, 'Nuevo mensaje en ' || event_title, sender_name || ': ' || LEFT(NEW.text, 80));
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_chat_message ON public.chat_messages;
CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_chat_message();

-- Notify followers when someone they follow creates an event
CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS TRIGGER AS $$
DECLARE
  follower_id UUID;
BEGIN
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
