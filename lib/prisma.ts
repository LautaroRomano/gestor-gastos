import { PrismaClient } from '../src/generated/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Reutilizar el pool si existe y no está cerrado, o crear uno nuevo
  let pool = globalForPrisma.pool
  
  if (!pool || pool.ended) {
    pool = new Pool({
      connectionString,
      max: 20, // Aumentar el máximo de conexiones
      min: 2, // Mantener mínimo de conexiones activas
      idleTimeoutMillis: 30000, // Cerrar conexiones inactivas después de 30 segundos
      connectionTimeoutMillis: 10000, // Aumentar timeout de conexión a 10 segundos
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })

    // Manejar errores del pool
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      // No cerrar el pool, solo loguear el error
    })

    // Guardar el pool globalmente en desarrollo para reutilizarlo
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.pool = pool
    }
  }

  const adapter = new PrismaPg(pool)
  
  const client = new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
