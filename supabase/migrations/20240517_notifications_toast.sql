-- Add JSONB data column to notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- Updated: notify on new follower with data
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
BEGIN
  SELECT COALESCE(nombre, 'Alguien') INTO follower_name
  FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, title, message, data)
  VALUES (
    NEW.following_id,
    'Nuevo seguidor',
    follower_name || ' empezó a seguirte',
    jsonb_build_object('type', 'new_follower', 'actor_id', NEW.follower_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated: notify on new chat message with data
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
    INSERT INTO public.notifications (user_id, title, message, data)
    VALUES (
      other_user,
      'Nuevo mensaje en ' || event_title,
      sender_name || ': ' || LEFT(NEW.text, 80),
      jsonb_build_object('type', 'new_message', 'event_id', NEW.event_id, 'actor_id', NEW.user_id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated: notify followers on new event with data
CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS TRIGGER AS $$
DECLARE
  follower_id UUID;
BEGIN
  FOR follower_id IN
    SELECT f.follower_id FROM public.followers f
    WHERE f.following_id = NEW.organizer_id
  LOOP
    INSERT INTO public.notifications (user_id, title, message, data)
    VALUES (
      follower_id,
      'Nuevo evento',
      NEW.title || ' fue publicado',
      jsonb_build_object('type', 'new_event', 'event_id', NEW.id)
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
