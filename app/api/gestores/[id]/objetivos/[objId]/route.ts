import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, ApiError, montoSchema, parseFecha } from '@/lib/api'
import { calcularObjetivo } from '@/lib/finance/goals'
import { z } from 'zod'

const schema = z.object({
  nombre: z.string().min(1).optional(),
  montoObjetivo: montoSchema.optional(),
  montoActual: z.number().min(0).finite().optional(),
  fechaObjetivo: z.string().nullish(),
})

async function ensureObjetivo(gestorId: string, objId: string) {
  const o = await prisma.objetivo.findFirst({ where: { id: objId, gestorId } })
  if (!o) throw new ApiError(404, 'Objetivo no encontrado')
  return o
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; objId: string }> }) {
  try {
    const { id, objId } = await params
    await requireGestor(id)
    await ensureObjetivo(id, objId)
    const data = schema.parse(await request.json())
    const objetivo = await prisma.objetivo.update({
      where: { id: objId },
      data: {
        nombre: data.nombre,
        montoObjetivo: data.montoObjetivo,
        montoActual: data.montoActual,
        fechaObjetivo:
          data.fechaObjetivo === undefined ? undefined : parseFecha(data.fechaObjetivo ?? undefined) ?? null,
      },
    })
    return NextResponse.json({ ...objetivo, calculo: calcularObjetivo(objetivo) })
  } catch (error) {
    return handleError(error, 'actualizar objetivo')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; objId: string }> }) {
  try {
    const { id, objId } = await params
    await requireGestor(id)
    await ensureObjetivo(id, objId)
    await prisma.objetivo.delete({ where: { id: objId } })
    return NextResponse.json({ message: 'Objetivo eliminado' })
  } catch (error) {
    return handleError(error, 'eliminar objetivo')
  }
}
