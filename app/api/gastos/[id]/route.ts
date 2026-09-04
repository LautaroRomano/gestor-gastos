import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { montoSchema, parseFecha, handleError, ApiError } from '@/lib/api'
import { normalizar } from '@/lib/finance/classify'
import { z } from 'zod'

const updateGastoSchema = z.object({
  monto: montoSchema.optional(),
  descripcion: z.string().min(1).optional(),
  moneda: z.string().optional(),
  categoria: z.string().nullish(),
  categoriaId: z.string().nullish(),
  subcategoria: z.string().nullish(),
  clasificacion: z.enum(['fijo', 'variable', 'discrecional', 'extraordinario', 'deuda']).nullish(),
  necesidad: z.enum(['necesario', 'prescindible', 'no_seguro']).nullish(),
  recurrente: z.boolean().optional(),
  metodoPago: z.string().nullish(),
  cuentaId: z.string().nullish(),
  notas: z.string().nullish(),
  pagado: z.boolean().optional(),
  fecha: z.string().optional(),
})

async function loadGasto(id: string, userId: string) {
  const gasto = await prisma.gasto.findUnique({
    where: { id },
    include: { mes: { include: { gestor: { include: { usuarios: { where: { usuarioId: userId } } } } } } },
  })
  if (!gasto) throw new ApiError(404, 'Gasto no encontrado')
  if (gasto.mes.gestor.usuarios.length === 0) throw new ApiError(403, 'No autorizado')
  return gasto
}

// Extrae la palabra más significativa de una descripción para usar como patrón de regla.
function patronDe(descripcion: string): string | null {
  const palabras = normalizar(descripcion)
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['para', 'con', 'del', 'los', 'las', 'una', 'unos'].includes(w))
  if (palabras.length === 0) return null
  return palabras.sort((a, b) => b.length - a.length)[0]
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError(401, 'No autorizado')
    const { id } = await params
    const gasto = await loadGasto(id, user.id)
    if (gasto.mes.cerrado) throw new ApiError(400, 'No se pueden modificar gastos de un mes cerrado')
    await prisma.gasto.delete({ where: { id } })
    return NextResponse.json({ message: 'Gasto eliminado' })
  } catch (error) {
    return handleError(error, 'eliminar gasto')
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError(401, 'No autorizado')

    const { id } = await params
    const data = updateGastoSchema.parse(await request.json())
    const gasto = await loadGasto(id, user.id)
    if (gasto.mes.cerrado) throw new ApiError(400, 'No se pueden modificar gastos de un mes cerrado')

    const gastoActualizado = await prisma.gasto.update({
      where: { id },
      data: {
        monto: data.monto,
        descripcion: data.descripcion,
        moneda: data.moneda,
        categoria: data.categoria ?? undefined,
        categoriaId: data.categoriaId ?? undefined,
        subcategoria: data.subcategoria ?? undefined,
        clasificacion: data.clasificacion ?? undefined,
        necesidad: data.necesidad ?? undefined,
        recurrente: data.recurrente,
        metodoPago: data.metodoPago ?? undefined,
        cuentaId: data.cuentaId ?? undefined,
        notas: data.notas ?? undefined,
        pagado: data.pagado,
        fecha: data.fecha ? parseFecha(data.fecha) : undefined,
      },
    })

    // Aprender de la corrección (spec §2, §96): si el usuario cambió clasificación,
    // categoría o necesidad, guardar una regla para futuros gastos similares.
    if (data.clasificacion || data.categoria || data.necesidad) {
      const patron = patronDe(gastoActualizado.descripcion)
      if (patron) {
        await prisma.reglaClasificacion.upsert({
          where: { gestorId_patron: { gestorId: gasto.mes.gestorId, patron } },
          create: {
            gestorId: gasto.mes.gestorId,
            patron,
            categoria: data.categoria ?? gastoActualizado.categoria,
            clasificacion: data.clasificacion ?? gastoActualizado.clasificacion,
            necesidad: data.necesidad ?? gastoActualizado.necesidad,
          },
          update: {
            categoria: data.categoria ?? gastoActualizado.categoria,
            clasificacion: data.clasificacion ?? gastoActualizado.clasificacion,
            necesidad: data.necesidad ?? gastoActualizado.necesidad,
          },
        })
      }
    }

    return NextResponse.json(gastoActualizado)
  } catch (error) {
    return handleError(error, 'actualizar gasto')
  }
}
