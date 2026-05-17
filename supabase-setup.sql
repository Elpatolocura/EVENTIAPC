-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT DEFAULT '',
  celular TEXT DEFAULT '',
  ubicacion TEXT DEFAULT '',
  biografia TEXT DEFAULT '',
  categorias JSONB DEFAULT '[]'::jsonb,
  avatar_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  idioma TEXT DEFAULT 'es',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS "Cualquiera puede ver perfiles" ON public.profiles;
CREATE POLICY "Cualquiera puede ver perfiles"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden crear su propio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'https://picsum.photos/seed/' || NEW.id::text || '/400/400'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- Tabla de eventos
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  city TEXT DEFAULT '',
  address TEXT DEFAULT '',
  price TEXT DEFAULT '',
  capacity TEXT DEFAULT '',
  date TEXT DEFAULT '',
  hour TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  organizer TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  age_min TEXT DEFAULT '',
  parking BOOLEAN DEFAULT FALSE,
  accessibility BOOLEAN DEFAULT FALSE,
  pets BOOLEAN DEFAULT FALSE,
  photos JSONB DEFAULT '[]'::jsonb,
  type TEXT DEFAULT 'Pagado',
  services JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'publicado',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver eventos publicados" ON public.events;
CREATE POLICY "Cualquiera puede ver eventos publicados"
  ON public.events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Usuarios pueden crear eventos" ON public.events;
CREATE POLICY "Usuarios pueden crear eventos"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizador puede actualizar su evento" ON public.events;
CREATE POLICY "Organizador puede actualizar su evento"
  ON public.events FOR UPDATE
  USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizador puede eliminar su evento" ON public.events;
CREATE POLICY "Organizador puede eliminar su evento"
  ON public.events FOR DELETE
  USING (auth.uid() = organizer_id);

-- =============================================
-- Tabla de categorías personalizadas
-- =============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus categorías" ON public.categories;
CREATE POLICY "Usuarios pueden ver sus categorías"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden crear categorías" ON public.categories;
CREATE POLICY "Usuarios pueden crear categorías"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Tabla de reseñas
-- =============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver reseñas" ON public.reviews;
CREATE POLICY "Cualquiera puede ver reseñas"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear reseñas" ON public.reviews;
CREATE POLICY "Usuarios autenticados pueden crear reseñas"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Tabla de tickets
-- =============================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'válida',
  qty INTEGER DEFAULT 1,
  total NUMERIC(12,2) DEFAULT 0,
  code TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Eliminar UNIQUE constraint para permitir múltiples entradas del mismo evento
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_event_id_user_id_key;

-- Agregar columnas faltantes en tablas existentes
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'válida';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qty INTEGER DEFAULT 1;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS code TEXT DEFAULT '';

DROP POLICY IF EXISTS "Usuarios pueden ver sus tickets" ON public.tickets;
CREATE POLICY "Usuarios pueden ver sus tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden comprar tickets" ON public.tickets;
CREATE POLICY "Usuarios pueden comprar tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus tickets" ON public.tickets;
CREATE POLICY "Usuarios pueden eliminar sus tickets"
  ON public.tickets FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Tabla de mensajes del chat
-- =============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios con ticket pueden ver mensajes" ON public.chat_messages;
CREATE POLICY "Usuarios con ticket pueden ver mensajes"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.event_id = chat_messages.event_id
        AND tickets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios con ticket pueden enviar mensajes" ON public.chat_messages;
CREATE POLICY "Usuarios con ticket pueden enviar mensajes"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.event_id = chat_messages.event_id
        AND tickets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Autor puede eliminar sus mensajes" ON public.chat_messages;
CREATE POLICY "Autor puede eliminar sus mensajes"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_event_id ON public.chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- =============================================
-- Tabla de mensajes eliminados para cada usuario
-- =============================================
CREATE TABLE IF NOT EXISTS public.deleted_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id BIGINT NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

ALTER TABLE public.deleted_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario puede ver sus eliminados" ON public.deleted_messages;
CREATE POLICY "Usuario puede ver sus eliminados"
  ON public.deleted_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuario puede insertar sus eliminados" ON public.deleted_messages;
CREATE POLICY "Usuario puede insertar sus eliminados"
  ON public.deleted_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Tabla de favoritos
-- =============================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus favoritos" ON public.favorites;
CREATE POLICY "Usuarios pueden ver sus favoritos"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden agregar favoritos" ON public.favorites;
CREATE POLICY "Usuarios pueden agregar favoritos"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus favoritos" ON public.favorites;
CREATE POLICY "Usuarios pueden eliminar sus favoritos"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Tabla de balance
-- =============================================
CREATE TABLE IF NOT EXISTS public.balances (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver su balance" ON public.balances;
CREATE POLICY "Usuarios pueden ver su balance"
  ON public.balances FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden crear o actualizar su balance" ON public.balances;
CREATE POLICY "Usuarios pueden crear o actualizar su balance"
  ON public.balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su balance" ON public.balances;
CREATE POLICY "Usuarios pueden actualizar su balance"
  ON public.balances FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- Tabla de notificaciones
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus notificaciones" ON public.notifications;
CREATE POLICY "Usuarios pueden ver sus notificaciones"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden crear notificaciones" ON public.notifications;
CREATE POLICY "Usuarios pueden crear notificaciones"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Tabla de preferencias de notificaciones
-- =============================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  follow_publishes_event BOOLEAN DEFAULT TRUE,
  new_follower BOOLEAN DEFAULT TRUE,
  new_message BOOLEAN DEFAULT TRUE,
  event_near_date BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus preferencias" ON public.notification_preferences;
CREATE POLICY "Usuarios pueden ver sus preferencias"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden crear sus preferencias" ON public.notification_preferences;
CREATE POLICY "Usuarios pueden crear sus preferencias"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus preferencias" ON public.notification_preferences;
CREATE POLICY "Usuarios pueden actualizar sus preferencias"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- Tabla de transacciones
-- =============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) DEFAULT 0,
  type TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus transacciones" ON public.transactions;
CREATE POLICY "Usuarios pueden ver sus transacciones"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden crear transacciones" ON public.transactions;
CREATE POLICY "Usuarios pueden crear transacciones"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Tabla de seguidores
-- =============================================
CREATE TABLE IF NOT EXISTS public.followers (
  id BIGSERIAL PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seguidores pueden ver seguidos" ON public.followers;
CREATE POLICY "Seguidores pueden ver seguidos"
  ON public.followers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Usuarios pueden seguir" ON public.followers;
CREATE POLICY "Usuarios pueden seguir"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Usuarios pueden dejar de seguir" ON public.followers;
CREATE POLICY "Usuarios pueden dejar de seguir"
  ON public.followers FOR DELETE
  USING (auth.uid() = follower_id);

-- =============================================
-- Corregir FK constraints en tablas existentes
-- (por si fueron creadas apuntando a profiles(id))
-- =============================================
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE public.categories ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.balances DROP CONSTRAINT IF EXISTS balances_user_id_fkey;
ALTER TABLE public.balances ADD CONSTRAINT balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.followers DROP CONSTRAINT IF EXISTS followers_follower_id_fkey;
ALTER TABLE public.followers ADD CONSTRAINT followers_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.followers DROP CONSTRAINT IF EXISTS followers_following_id_fkey;
ALTER TABLE public.followers ADD CONSTRAINT followers_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Agregar columna status si no existe (para tablas creadas antes de este cambio)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'publicado';
