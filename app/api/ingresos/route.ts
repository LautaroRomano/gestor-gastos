import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { montoSchema, parseFecha, handleError, ApiError } from '@/lib/api'
import { clasificarIngreso } from '@/lib/finance/classify'
import { z } from 'zod'

const ingresoSchema = z.object({
  mesId: z.string(),
  monto: montoSchema,
  descripcion: z.string().min(1),
  moneda: z.string().optional(),
  categoria: z.string().optional(),
  categoriaId: z.string().nullish(),
  recurrente: z.boolean().optional(),
  notas: z.string().nullish(),
  source: z.string().optional(),
  fecha: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError(401, 'No autorizado')

    const body = ingresoSchema.parse(await request.json())
    const fechaISO = parseFecha(body.fecha)

    const mes = await prisma.mes.findUnique({
      where: { id: body.mesId },
      include: { gestor: { include: { usuarios: { where: { usuarioId: user.id } } } } },
    })

    if (!mes) throw new ApiError(404, 'Mes no encontrado')
    if (mes.gestor.usuarios.length === 0) throw new ApiError(403, 'No autorizado')
    if (mes.cerrado) throw new ApiError(400, 'No se pueden agregar ingresos a un mes cerrado')

    const categoria = body.categoria || clasificarIngreso(body.descripcion).categoria

    const ingreso = await prisma.ingreso.create({
      data: {
        mesId: body.mesId,
        monto: body.monto,
        moneda: body.moneda || 'ARS',
        descripcion: body.descripcion,
        categoria,
        categoriaId: body.categoriaId ?? undefined,
        recurrente: body.recurrente ?? false,
        notas: body.notas ?? undefined,
        source: body.source || 'web',
        fecha: fechaISO || new Date(),
      },
    })

    return NextResponse.json(ingreso, { status: 201 })
  } catch (error) {
    return handleError(error, 'crear ingreso')
  }
}
