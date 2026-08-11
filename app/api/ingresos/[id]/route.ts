import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { montoSchema, parseFecha, handleError, ApiError } from '@/lib/api'
import { z } from 'zod'

const updateIngresoSchema = z.object({
  monto: montoSchema.optional(),
  descripcion: z.string().min(1).optional(),
  moneda: z.string().optional(),
  categoria: z.string().nullish(),
  categoriaId: z.string().nullish(),
  recurrente: z.boolean().optional(),
  notas: z.string().nullish(),
  fecha: z.string().optional(),
})

async function loadIngreso(id: string, userId: string) {
  const ingreso = await prisma.ingreso.findUnique({
    where: { id },
    include: { mes: { include: { gestor: { include: { usuarios: { where: { usuarioId: userId } } } } } } },
  })
  if (!ingreso) throw new ApiError(404, 'Ingreso no encontrado')
  if (ingreso.mes.gestor.usuarios.length === 0) throw new ApiError(403, 'No autorizado')
  return ingreso
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError(401, 'No autorizado')
    const { id } = await params
    const ingreso = await loadIngreso(id, user.id)
    if (ingreso.mes.cerrado) throw new ApiError(400, 'No se pueden modificar ingresos de un mes cerrado')
    await prisma.ingreso.delete({ where: { id } })
    return NextResponse.json({ message: 'Ingreso eliminado' })
  } catch (error) {
    return handleError(error, 'eliminar ingreso')
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError(401, 'No autorizado')
    const { id } = await params
    const data = updateIngresoSchema.parse(await request.json())
    const ingreso = await loadIngreso(id, user.id)
    if (ingreso.mes.cerrado) throw new ApiError(400, 'No se pueden modificar ingresos de un mes cerrado')

    const ingresoActualizado = await prisma.ingreso.update({
      where: { id },
      data: {
        monto: data.monto,
        descripcion: data.descripcion,
        moneda: data.moneda,
        categoria: data.categoria ?? undefined,
        categoriaId: data.categoriaId ?? undefined,
        recurrente: data.recurrente,
        notas: data.notas ?? undefined,
        fecha: data.fecha ? parseFecha(data.fecha) : undefined,
      },
    })

    return NextResponse.json(ingresoActualizado)
  } catch (error) {
    return handleError(error, 'actualizar ingreso')
  }
}
