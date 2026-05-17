-- Ensure notification_preferences table exists
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  follow_publishes_event BOOLEAN DEFAULT TRUE,
  new_follower BOOLEAN DEFAULT TRUE,
  new_message BOOLEAN DEFAULT TRUE,
  event_near_date BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own prefs" ON public.notification_preferences;
CREATE POLICY "Users can view own prefs" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can upsert own prefs" ON public.notification_preferences;
CREATE POLICY "Users can upsert own prefs" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prefs" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Updated trigger: check pref before notifying on new follower
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
  pref boolean;
BEGIN
  SELECT COALESCE((SELECT new_follower FROM public.notification_preferences WHERE user_id = NEW.following_id), true) INTO pref;
  IF NOT pref THEN RETURN NEW; END IF;
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

-- Updated trigger: check pref before notifying on chat message
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
  LOOP
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

-- Updated trigger: check pref before notifying on new event
CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS TRIGGER AS $$
DECLARE
  follower_id UUID;
  pref boolean;
BEGIN
  FOR follower_id IN
    SELECT f.follower_id FROM public.followers f
    WHERE f.following_id = NEW.organizer_id
  LOOP
    SELECT COALESCE((SELECT follow_publishes_event FROM public.notification_preferences WHERE user_id = follower_id), true) INTO pref;
    IF pref THEN
      INSERT INTO public.notifications (user_id, title, message, data)
      VALUES (
        follower_id,
        'Nuevo evento',
        NEW.title || ' fue publicado',
        jsonb_build_object('type', 'new_event', 'event_id', NEW.id)
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
