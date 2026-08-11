import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, montoSchema, parseFecha, ApiError } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  tipo: z.enum(['gasto', 'ingreso']),
  monto: montoSchema,
  descripcion: z.string().min(1),
  categoria: z.string().nullish(),
  categoriaId: z.string().nullish(),
  frecuencia: z.enum(['mensual', 'semanal', 'quincenal', 'anual']).default('mensual'),
  proximaFecha: z.string(),
  activo: z.boolean().default(true),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const recurrentes = await prisma.recurrente.findMany({ where: { gestorId: id }, orderBy: { proximaFecha: 'asc' } })
    return NextResponse.json(recurrentes)
  } catch (error) {
    return handleError(error, 'obtener recurrentes')
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const data = schema.parse(await request.json())
    const proximaFecha = parseFecha(data.proximaFecha)
    if (!proximaFecha) throw new ApiError(400, 'Fecha inválida')
    const recurrente = await prisma.recurrente.create({
      data: { gestorId: id, ...data, proximaFecha },
    })
    return NextResponse.json(recurrente, { status: 201 })
  } catch (error) {
    return handleError(error, 'crear recurrente')
  }
}
