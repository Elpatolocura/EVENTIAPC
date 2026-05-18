export function parsePrice(price: string | number | undefined | null): number {
  if (!price) return 0
  return Number(String(price).replace(/[^0-9]/g, '')) || 0
}

export function getCurrency(price: string | undefined | null): 'USD' | 'COP' {
  if (!price) return 'COP'
  if (String(price).trim().startsWith('USD')) return 'USD'
  return 'COP'
}

export function formatPrice(price: string | undefined | null): string {
  if (!price || price === 'Gratis' || price === 'gratis') return 'Gratis'
  const s = String(price).trim()
  if (s.startsWith('USD')) {
    const num = parsePrice(s)
    return `USD ${num.toLocaleString('en-US')}`
  }
  const num = parsePrice(s)
  return `$${num.toLocaleString('es-CO')}`
}
