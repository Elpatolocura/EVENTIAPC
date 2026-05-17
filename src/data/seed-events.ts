export interface SeedEvent {
  title: string
  description: string
  category: string
  city: string
  address: string
  price: string
  capacity: string
  date: string
  hour: string
  duration: string
  phone: string
  type: string
  photos: string[]
  services: string[]
}

const cities = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Cúcuta', 'Ibagué',
  'Santa Marta', 'Villavicencio', 'Pasto', 'Neiva', 'Armenia',
  'Sincelejo', 'Valledupar', 'Montería', 'Popayán', 'Tunja',
]

const categories = ['Música', 'Deportes', 'Tecnología', 'Gastronomía', 'Arte', 'Negocios', 'Moda', 'Educación', 'Salud', 'Teatro']

const eventTemplates: { title: string; desc: string; cat: string; price: string; cap: string; dur: string }[] = [
  { title: 'Concierto de {banda} en vivo', desc: 'Disfruta de una noche inolvidable con {banda} en el mejor escenario de {ciudad}. Música en vivo, luces y sonido de primera calidad. No te pierdas este espectáculo único.', cat: 'Música', price: '85000', cap: '500', dur: '4 horas' },
  { title: 'Feria gastronómica {nombre}', desc: 'Los mejores chefs de {ciudad} se reúnen para ofrecerte una experiencia culinaria inigualable. Degustaciones, show cooking y platos tradicionales con un toque moderno.', cat: 'Gastronomía', price: '35000', cap: '300', dur: '6 horas' },
  { title: 'Maratón {ciudad} 5K', desc: 'Corre por las calles de {ciudad} en esta emocionante carrera de 5 kilómetros. Incluye kit de corredor, hidratación y medalla conmemorativa para todos los participantes.', cat: 'Deportes', price: '45000', cap: '1000', dur: '3 horas' },
  { title: 'Taller de {tema} para principiantes', desc: 'Aprende {tema} desde cero con instructores expertos. Material incluido, certificado de participación y coffee break. Cupos limitados.', cat: 'Educación', price: '55000', cap: '30', dur: '5 horas' },
  { title: 'Exposición de arte contemporáneo', desc: 'Más de 50 obras de artistas locales e internacionales en una exhibición curada por expertos. Una mirada al arte contemporáneo latinoamericano.', cat: 'Arte', price: '20000', cap: '200', dur: '8 horas' },
  { title: 'Conferencia de tecnología {nombre}', desc: 'Expertos en tecnología comparten las últimas tendencias en inteligencia artificial, blockchain y desarrollo web. Networking incluido.', cat: 'Tecnología', price: '120000', cap: '150', dur: '8 horas' },
  { title: 'Noche de stand up comedy', desc: 'Los comediantes más divertidos del país se presentan en una noche llena de risas. Show para mayores de 14 años. Bar disponible.', cat: 'Teatro', price: '40000', cap: '120', dur: '2 horas' },
  { title: 'Feria de emprendimiento {nombre}', desc: 'Más de 100 emprendedores locales exhiben sus productos y servicios. Charlas inspiradoras, talleres prácticos y oportunidades de networking.', cat: 'Negocios', price: '15000', cap: '500', dur: '7 horas' },
  { title: 'Clase magistral de {tema}', desc: 'Una oportunidad única de aprender con los mejores profesionales del sector. Metodología práctica y personalizada. Incluye materiales y certificación.', cat: 'Educación', price: '95000', cap: '25', dur: '6 horas' },
  { title: 'Festival de {tema} {nombre}', desc: 'Un festival que celebra lo mejor de {tema} con actividades para toda la familia. Música, comida, talleres y mucho más en un solo lugar.', cat: 'Arte', price: '30000', cap: '800', dur: '10 horas' },
]

const bandas = ['Los Rolling Col', 'Bogotá Brass', 'Salsa Brava', 'Los Andinos', 'Rock Nacional', 'Orquesta Sinfónica', 'DJ Marce', 'Banda del Sol', 'Los Tropicales', 'Folclor Colombiano']
const temas = ['Fotografía', 'Cocina molecular', 'Programación Web', 'Yoga y Meditación', 'Marketing Digital', 'Pintura al óleo', 'Jardinería', 'Canto', 'Diseño Gráfico', 'Escritura creativa']
const nombres = ['2026', 'del Sabor', 'Extremo', 'Verano', 'Invierno', 'Otoño', 'Spring', 'Fest', 'Expo', 'City']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function futureDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function generatePhoto(city: string, index: number): string {
  return `https://picsum.photos/seed/${city.replace(/\s/g, '')}${index}/800/400`
}

export function generateSeedEvents(): SeedEvent[] {
  const events: SeedEvent[] = []
  let id = 1
  for (const city of cities) {
    for (let i = 0; i < 5; i++) {
      const tpl = eventTemplates[(id - 1) % eventTemplates.length]
      const banda = randomItem(bandas)
      const tema = randomItem(temas)
      const nombre = randomItem(nombres)

      const title = tpl.title
        .replace('{banda}', banda)
        .replace('{nombre}', nombre)
        .replace('{tema}', tema)
        .replace('{ciudad}', city)

      const description = tpl.desc
        .replace('{banda}', banda)
        .replace('{nombre}', nombre)
        .replace('{tema}', tema)
        .replace('{ciudad}', city)

      const price = Math.random() > 0.2 ? tpl.price : 'Gratis'
      const type = price === 'Gratis' ? 'Gratis' : 'Pagado'

      events.push({
        title,
        description,
        category: tpl.cat,
        city,
        address: `Carrera ${Math.floor(Math.random() * 100) + 1}#${Math.floor(Math.random() * 100)}-${Math.floor(Math.random() * 50)}`,
        price,
        capacity: String(Math.floor(Math.random() * 500) + 20 + parseInt(tpl.cap)),
        date: futureDate(Math.floor(Math.random() * 60) + 1),
        hour: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:00`,
        duration: tpl.dur,
        phone: `300${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        type,
        photos: [generatePhoto(city, i)],
        services: ['Parqueadero', 'Accesibilidad'].filter(() => Math.random() > 0.5),
      })
      id++
    }
  }
  return events
}
