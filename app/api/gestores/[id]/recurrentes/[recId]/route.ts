import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, ApiError, montoSchema, parseFecha } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  tipo: z.enum(['gasto', 'ingreso']).optional(),
  monto: montoSchema.optional(),
  descripcion: z.string().min(1).optional(),
  categoria: z.string().nullish(),
  categoriaId: z.string().nullish(),
  frecuencia: z.enum(['mensual', 'semanal', 'quincenal', 'anual']).optional(),
  proximaFecha: z.string().optional(),
  activo: z.boolean().optional(),
})

async function ensureRecurrente(gestorId: string, recId: string) {
  const r = await prisma.recurrente.findFirst({ where: { id: recId, gestorId } })
  if (!r) throw new ApiError(404, 'Recurrente no encontrado')
  return r
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; recId: string }> }) {
  try {
    const { id, recId } = await params
    await requireGestor(id)
    await ensureRecurrente(id, recId)
    const data = schema.parse(await request.json())
    const recurrente = await prisma.recurrente.update({
      where: { id: recId },
      data: { ...data, proximaFecha: data.proximaFecha ? parseFecha(data.proximaFecha) : undefined },
    })
    return NextResponse.json(recurrente)
  } catch (error) {
    return handleError(error, 'actualizar recurrente')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; recId: string }> }) {
  try {
    const { id, recId } = await params
    await requireGestor(id)
    await ensureRecurrente(id, recId)
    await prisma.recurrente.delete({ where: { id: recId } })
    return NextResponse.json({ message: 'Recurrente eliminado' })
  } catch (error) {
    return handleError(error, 'eliminar recurrente')
  }
}
