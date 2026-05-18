-- Updated chat notify: also notify the event organizer
CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  event_title TEXT;
  other_user UUID;
  pref boolean;
BEGIN
  SELECT COALESCE(title, 'un evento') INTO event_title
  FROM public.events WHERE id = NEW.event_id;
  SELECT COALESCE(nombre, 'Alguien') INTO sender_name
  FROM public.profiles p WHERE p.id = NEW.user_id;
  FOR other_user IN
    SELECT DISTINCT t.user_id FROM public.tickets t
    WHERE t.event_id = NEW.event_id AND t.user_id != NEW.user_id
    UNION
    SELECT organizer_id FROM public.events WHERE id = NEW.event_id
  LOOP
    IF other_user = NEW.user_id THEN CONTINUE; END IF;
    SELECT COALESCE((SELECT new_message FROM public.notification_preferences WHERE user_id = other_user), true) INTO pref;
    IF pref THEN
      INSERT INTO public.notifications (user_id, title, message, data)
      VALUES (
        other_user,
        'Nuevo mensaje en ' || event_title,
        sender_name || ': ' || LEFT(NEW.text, 80),
        jsonb_build_object('type', 'new_message', 'event_id', NEW.event_id, 'actor_id', NEW.user_id)
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
