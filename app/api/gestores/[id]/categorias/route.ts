import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['gasto', 'ingreso']).default('gasto'),
  parentId: z.string().nullish(),
  clasificacionDefault: z.string().nullish(),
  icono: z.string().nullish(),
  color: z.string().nullish(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const categorias = await prisma.categoria.findMany({
      where: { gestorId: id },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    })
    return NextResponse.json(categorias)
  } catch (error) {
    return handleError(error, 'obtener categorías')
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const data = schema.parse(await request.json())
    const categoria = await prisma.categoria.create({ data: { gestorId: id, ...data } })
    return NextResponse.json(categoria, { status: 201 })
  } catch (error) {
    return handleError(error, 'crear categoría')
  }
}
