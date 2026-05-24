# Documentación y Estructura del Proyecto: Eventia

## 🎯 ¿De qué trata el proyecto?
Eventia es una aplicación web interactiva y moderna diseñada para la exploración, creación y gestión de eventos locales. Permite a los usuarios descubrir actividades cercanas, administrar sus propias entradas y eventos, comunicarse a través de chats (incluyendo un Chat con Inteligencia Artificial) y personalizar su perfil y preferencias. La plataforma incluye un sistema de monetización/premium, balances, favoritos y notificaciones en tiempo real, ofreciendo una experiencia social integral en torno a las actividades locales.

---

## 🎨 Diseño y UI/UX

### Responsividad (Mobile First)
- 100% responsivo: móviles, tablets y escritorio
- Sidebar colapsable con menú hamburguesa en móviles
- Grillas adaptables: 1 columna en móviles, 2-4 en escritorio
- Barra de navegación inferior en móviles (bottom nav)

### Colores y Temas
- Tailwind CSS v4 con sistema de temas dinámicos
- Color principal: Índigo (#4f46e5)
- Modo oscuro (Dark Mode) completo
- 8 temas personalizables: Azul, Verde, Rojo, Rosa, Púrpura, Naranja, Teal e Índigo

### Tipografía
- Fuentes del sistema (Inter, Roboto, system-ui)
- Contenedor principal con min-h-screen y flex-1

---

## 🗺️ Mapa del Sitio - Rutas y Funcionalidad

### 🔒 Autenticación
| Ruta | Funcionalidad |
|---|---|
| `/login` | Login con email/contraseña y Google OAuth (PKCE), "Olvidé mi contraseña" funcional, enlace a registro |
| `/crear-cuenta` | Registro con nombre, email, contraseña, selector de tipo de usuario (Asistente/Organizador) |
| `/recuperar-clave` | Recuperación de contraseña mediante email (integración con Supabase) |

### 🏠 Descubrimiento y Navegación
| Ruta | Funcionalidad |
|---|---|
| `/` | Barra de búsqueda, filtros por tipo (Gratis/Pagado), fecha (Hoy/Mañana), categoría, geolocalización con Nominatim, "Cerca de mí", grid de eventos con LazyImage, favoritos |
| `/favoritos` | Grid de eventos favoritos del usuario, botón para eliminar de favoritos, estado vacío |
| `/evento/:id` | Carrusel de fotos con pantalla completa, detalles del evento, mapa OpenStreetMap incrustado, sección del organizador con rating promedio ⭐, sistema de reseñas (5 estrellas), comprar entrada con múltiples métodos de pago (Balance, Nequi, Daviplata, PSE, Efecty), reportar evento, compartir, toggle favorito |

### 🎟️ Gestión de Eventos y Entradas
| Ruta | Funcionalidad |
|---|---|
| `/crear-evento` | Wizard de 5 pasos: Info básica, Cuándo y dónde, Entradas, Fotos y servicios, Resumen. Mejora de título/descripción con IA, drag & drop de imágenes, selector de ciudades colombianas, servicios, borrador/publicar |
| `/editar-evento/:eventId` | Edición de evento existente (mismo componente que crear) |
| `/mis-entradas` | Pestañas (Todas/Válidas/Usadas/Canceladas), código QR por entrada, agrupación por evento, cancelación con reembolso 90%, expiración automática de entradas vencidas |
| `/mis-eventos` | Grid de eventos creados, badge de estado (borrador/publicado), editar, cancelar evento con reembolso total a compradores |

### 💬 Social y Mensajería
| Ruta | Funcionalidad |
|---|---|
| `/chat` | Mensajería en tiempo real (Supabase Realtime), adjuntar imágenes/videos, emojis, responder mensajes, eliminar para mí/todos, personalizar (color burbuja, fondo, fuente), pin/mute chats, límite premium (40 msgs/día), búsqueda de conversaciones |
| `/chat/:eventId` | Chat directo con evento específico preseleccionado |
| `/chat-ia` | YULIANIS - Asistente IA con DeepSeek, tarjetas de eventos, compra de entradas desde el chat, persistencia en localStorage, detección de inactividad |
| `/perfil/:id` | Avatar y portada, biografía, intereses, sistema de seguir/dejar de seguir, modal de seguidores con búsqueda, stats (seguidores, eventos, entradas) |
| `/notificaciones` | Lista en tiempo real, marcar todas como leídas, eliminar individual/todas, navegación inteligente al hacer clic |

### 💰 Economía y Monetización
| Ruta | Funcionalidad |
|---|---|
| `/premium` | Planes Gratis ($0) y Premium ($29.900/mes o $299.900/año), toggle anual/mensual (15% ahorro), pago simulado con 6 métodos, FAQ |
| `/balance` | Saldo disponible y bloqueado, recargas predefinidas ($20k-$500k), monto personalizado, historial de transacciones, liberación de fondos bloqueados |
| `/configuracion/suscripcion` | Ver plan actual, cancelar suscripción con confirmación |

### ⚙️ Configuración
| Ruta | Funcionalidad |
|---|---|
| `/configuracion` | Hub de ajustes con enlaces a todas las sub-secciones |
| `/configuracion/editar-perfil` | Editar nombre, foto, portada, ubicación (GPS), biografía (mejora con IA), categorías de interés |
| `/configuracion/idioma` | Español/Inglés, persiste en localStorage y Supabase |
| `/configuracion/personalizar` | 8 colores de acento, modo claro/oscuro con vista previa |
| `/configuracion/cambiar-contrasena` | Cambio de contraseña con validación |
| `/configuracion/notificaciones` | 4 toggles de preferencias de notificación |
| `/configuracion/centro-ayuda` | FAQ, contacto email/teléfono/chat |
| `/configuracion/comentarios` | Feedback con rating, categoría y mensaje (envía a Edge Function) |
| `/configuracion/politicas-privacidad` | Políticas en acordeón |

### 🛠️ Herramientas de Desarrollo
| Ruta | Funcionalidad |
|---|---|
| `/semilla` | Generador de 100 eventos de prueba con datos realistas |

---

## 🗄️ Base de Datos (Supabase)

### Tablas
| Tabla | Propósito |
|---|---|
| `profiles` | Perfiles de usuario (nombre, avatar, plan, idioma, biografía, ubicación, etc.) |
| `events` | Eventos (título, descripción, fecha, precio, fotos, servicios, estado) |
| `tickets` | Entradas compradas (evento, usuario, estado, cantidad, código) |
| `favorites` | Eventos favoritos por usuario |
| `chat_messages` | Mensajes de chat por evento |
| `deleted_messages` | Mensajes ocultos por usuario |
| `notifications` | Notificaciones de usuario |
| `notification_preferences` | Preferencias de notificación |
| `balances` | Billetera virtual (saldo disponible + bloqueado) |
| `transactions` | Historial de transacciones financieras |
| `followers` | Sistema de seguir usuarios |
| `reviews` | Reseñas de eventos (rating 1-5, texto) |
| `categories` | Categorías personalizadas de usuario |

### RPCs (Stored Procedures)
- `get_unread_chat_counts`, `mark_chat_read`
- `toggle_chat_pin`, `get_pinned_chats`
- `toggle_chat_mute`, `get_muted_chats`
- `delete_notification`, `delete_all_notifications`

### Edge Functions (Supabase Functions)
- `send-report` - Reportar eventos/mensajes
- `send-feedback` - Enviar feedback de la app
- `ai` - Endpoint IA (no usado directamente, la app usa DeepSeek API)

### Triggers
- `on_auth_user_created` - Crea automáticamente perfil en `profiles` al registrar un nuevo usuario

### Suscripciones en Tiempo Real
- Chat: INSERT en `chat_messages`
- Notificaciones: cambios en `notifications` por usuario
- Contexto de notificaciones: polling cada 5s + Realtime

---

## ✅ Funcionalidades Implementadas (Resumen)

- [x] Autenticación email/contraseña y Google OAuth
- [x] Recuperación de contraseña funcional
- [x] Registro con selector de tipo de usuario
- [x] Búsqueda y filtros de eventos (categoría, tipo, fecha, ubicación)
- [x] Geolocalización con Nominatim y "Cerca de mí"
- [x] Detalle de evento con carrusel, mapa, reseñas, compra
- [x] Creación/edición de eventos con wizard 5 pasos
- [x] Mejora de contenido con IA (título, descripción, biografía)
- [x] Drag & drop para imágenes
- [x] Chat en tiempo real con adjuntos, personalización, pin/mute
- [x] Chat IA (Yulianis) con DeepSeek y compra de entradas
- [x] Sistema de reseñas (5 estrellas) con rating de organizador
- [x] Código QR en entradas
- [x] Cancelación de entradas con reembolso 90%
- [x] Cancelación de eventos con reembolso total
- [x] Sistema de seguir usuarios
- [x] Notificaciones en tiempo real con sonido
- [x] Planes Premium con límites en chat
- [x] Billetera virtual (balance, recargas, fondos bloqueados)
- [x] Personalización de temas (8 colores, dark mode)
- [x] Multi-idioma (ES/EN)
- [x] Reportar eventos y mensajes
- [x] Feedback de la app
- [x] Skeleton loaders
- [x] Bottom navigation bar en móviles
- [x] PWA configurado (manifest, service worker)
- [x] Rate limiting (máx 5 eventos/hora)

---

## 🚀 Pendiente / Mejoras Futuras

- **SSR/SEO** - Meta tags dinámicas para compartir en redes
- **CDN de imágenes** - Compresión y WebP con Edge Functions
- **Offline PWA** - Entradas QR sin conexión
- **Pasarela de pagos real** (Stripe/MercadoPago)
- **Moderación automática** de imágenes (Google Cloud Vision)
- **Deep linking / referidos** para organizadores
- **Notificaciones post-evento** pidiendo reseña automáticamente
- **Gráficos y dashboard** en Mis Eventos y Balance
- **Editor de texto enriquecido** en descripciones
- **Transferir entradas** entre usuarios
