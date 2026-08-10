import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, ApiError, montoSchema } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  categoriaId: z.string().nullish(),
  categoria: z.string().nullish(),
  monto: montoSchema.optional(),
  periodo: z.string().optional(),
})

async function ensurePresupuesto(gestorId: string, presId: string) {
  const p = await prisma.presupuesto.findFirst({ where: { id: presId, gestorId } })
  if (!p) throw new ApiError(404, 'Presupuesto no encontrado')
  return p
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; presId: string }> }) {
  try {
    const { id, presId } = await params
    await requireGestor(id)
    await ensurePresupuesto(id, presId)
    const data = schema.parse(await request.json())
    const presupuesto = await prisma.presupuesto.update({ where: { id: presId }, data })
    return NextResponse.json(presupuesto)
  } catch (error) {
    return handleError(error, 'actualizar presupuesto')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; presId: string }> }) {
  try {
    const { id, presId } = await params
    await requireGestor(id)
    await ensurePresupuesto(id, presId)
    await prisma.presupuesto.delete({ where: { id: presId } })
    return NextResponse.json({ message: 'Presupuesto eliminado' })
  } catch (error) {
    return handleError(error, 'eliminar presupuesto')
  }
}
