// Helpers compartidos para API routes: autenticación, autorización por gestor,
// validación de montos y manejo de errores uniforme (spec §16).
import { NextResponse } from 'next/server'
import { getCurrentUser } from './get-user'
import { prisma } from './prisma'
import { z } from 'zod'

// Validación estricta de montos (positivo, finito, tope razonable).
export const montoSchema = z.number().positive().finite().max(1_000_000_000_000)

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new ApiError(401, 'No autorizado')
  return user
}

/** Verifica que el usuario autenticado tenga acceso al gestor. Base del aislamiento de datos. */
export async function requireGestor(gestorId: string) {
  const user = await requireUser()
  const acceso = await prisma.usuarioGestor.findUnique({
    where: { usuarioId_gestorId: { usuarioId: user.id, gestorId } },
  })
  if (!acceso) throw new ApiError(403, 'No autorizado')
  return { user, acceso }
}

export function handleError(error: unknown, contexto: string) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 })
  }
  const message = error instanceof Error ? error.message : 'Error desconocido'
  console.error(`Error en ${contexto}:`, error)
  return NextResponse.json({ error: `Error en ${contexto}`, message }, { status: 500 })
}

/** Convierte un string de datetime-local o ISO a Date, o undefined. Lanza ApiError si es inválida. */
export function parseFecha(fecha?: string): Date | undefined {
  if (!fecha) return undefined
  const fechaStr = fecha.includes('T') ? fecha : `${fecha}T00:00:00`
  const d = new Date(fechaStr)
  if (isNaN(d.getTime())) throw new ApiError(400, 'Fecha inválida')
  return d
}
