import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, ApiError } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  nombre: z.string().min(1).optional(),
  parentId: z.string().nullish(),
  clasificacionDefault: z.string().nullish(),
  icono: z.string().nullish(),
  color: z.string().nullish(),
})

async function ensureCategoria(gestorId: string, catId: string) {
  const cat = await prisma.categoria.findFirst({ where: { id: catId, gestorId } })
  if (!cat) throw new ApiError(404, 'Categoría no encontrada')
  return cat
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; catId: string }> }) {
  try {
    const { id, catId } = await params
    await requireGestor(id)
    await ensureCategoria(id, catId)
    const data = schema.parse(await request.json())
    const categoria = await prisma.categoria.update({ where: { id: catId }, data })
    return NextResponse.json(categoria)
  } catch (error) {
    return handleError(error, 'actualizar categoría')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; catId: string }> }) {
  try {
    const { id, catId } = await params
    await requireGestor(id)
    await ensureCategoria(id, catId)
    await prisma.categoria.delete({ where: { id: catId } })
    return NextResponse.json({ message: 'Categoría eliminada' })
  } catch (error) {
    return handleError(error, 'eliminar categoría')
  }
}
