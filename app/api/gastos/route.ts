import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { montoSchema, parseFecha, handleError, ApiError } from '@/lib/api'
import { clasificarGasto } from '@/lib/finance/classify'
import { z } from 'zod'

const gastoSchema = z.object({
  mesId: z.string(),
  monto: montoSchema,
  descripcion: z.string().min(1),
  moneda: z.string().optional(),
  categoria: z.string().optional(),
  categoriaId: z.string().nullish(),
  subcategoria: z.string().nullish(),
  clasificacion: z.enum(['fijo', 'variable', 'discrecional', 'extraordinario', 'deuda']).nullish(),
  necesidad: z.enum(['necesario', 'prescindible', 'no_seguro']).nullish(),
  recurrente: z.boolean().optional(),
  metodoPago: z.string().nullish(),
  cuentaId: z.string().nullish(),
  notas: z.string().nullish(),
  source: z.string().optional(),
  fecha: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError(401, 'No autorizado')

    const body = gastoSchema.parse(await request.json())
    const fechaISO = parseFecha(body.fecha)

    const mes = await prisma.mes.findUnique({
      where: { id: body.mesId },
      include: { gestor: { include: { usuarios: { where: { usuarioId: user.id } } } } },
    })

    if (!mes) throw new ApiError(404, 'Mes no encontrado')
    if (mes.gestor.usuarios.length === 0) throw new ApiError(403, 'No autorizado')
    if (mes.cerrado) throw new ApiError(400, 'No se pueden agregar gastos a un mes cerrado')

    // Autoclasificación (spec §2): si falta categoría o clasificación, inferirlas
    // aplicando primero las reglas aprendidas del gestor.
    let { categoria, subcategoria, clasificacion, necesidad } = body
    if (!categoria || !clasificacion) {
      const reglas = await prisma.reglaClasificacion.findMany({ where: { gestorId: mes.gestorId } })
      const auto = clasificarGasto(body.descripcion, reglas)
      categoria = categoria || auto.categoria
      subcategoria = subcategoria || auto.subcategoria
      clasificacion = clasificacion || auto.clasificacion
      necesidad = necesidad || auto.necesidad
    }

    const gasto = await prisma.gasto.create({
      data: {
        mesId: body.mesId,
        monto: body.monto,
        moneda: body.moneda || 'ARS',
        descripcion: body.descripcion,
        categoria,
        categoriaId: body.categoriaId ?? undefined,
        subcategoria: subcategoria ?? undefined,
        clasificacion: clasificacion ?? undefined,
        necesidad: necesidad ?? undefined,
        recurrente: body.recurrente ?? false,
        metodoPago: body.metodoPago ?? undefined,
        cuentaId: body.cuentaId ?? undefined,
        notas: body.notas ?? undefined,
        source: body.source || 'web',
        fecha: fechaISO || new Date(),
      },
    })

    return NextResponse.json(gasto, { status: 201 })
  } catch (error) {
    return handleError(error, 'crear gasto')
  }
}
