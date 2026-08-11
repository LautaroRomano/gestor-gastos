// Rate limiting simple en memoria (token bucket por clave). Suficiente para una
// instancia; para multi-instancia habría que respaldarlo en Redis/DB (spec §16).

interface Bucket {
  tokens: number
  last: number
}

const buckets = new Map<string, Bucket>()

/**
 * Devuelve true si la acción está permitida y consume un token.
 * @param key      identificador (IP, número de teléfono, etc.)
 * @param limit    tokens máximos
 * @param windowMs ventana de recarga completa en ms
 */
export function rateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now()
  const refillPerMs = limit / windowMs
  const b = buckets.get(key) ?? { tokens: limit, last: now }

  // Recargar según el tiempo transcurrido
  b.tokens = Math.min(limit, b.tokens + (now - b.last) * refillPerMs)
  b.last = now

  if (b.tokens < 1) {
    buckets.set(key, b)
    return false
  }
  b.tokens -= 1
  buckets.set(key, b)
  return true
}
