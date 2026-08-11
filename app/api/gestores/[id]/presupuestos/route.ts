import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, montoSchema } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  categoriaId: z.string().nullish(),
  categoria: z.string().nullish(),
  monto: montoSchema,
  periodo: z.string().default('mensual'),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const presupuestos = await prisma.presupuesto.findMany({ where: { gestorId: id } })
    return NextResponse.json(presupuestos)
  } catch (error) {
    return handleError(error, 'obtener presupuestos')
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const data = schema.parse(await request.json())
    const presupuesto = await prisma.presupuesto.create({ data: { gestorId: id, ...data } })
    return NextResponse.json(presupuesto, { status: 201 })
  } catch (error) {
    return handleError(error, 'crear presupuesto')
  }
}
