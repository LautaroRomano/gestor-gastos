import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateGastoFijoSchema = z.object({
  monto: z.number().positive().optional(),
  descripcion: z.string().min(1).optional(),
  categoria: z.string().optional(),
  activo: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateGastoFijoSchema.parse(body)

    const gastoFijo = await prisma.gastoFijo.findUnique({
      where: { id },
      include: {
        gestor: {
          include: {
            usuarios: {
              where: { usuarioId: user.id },
            },
          },
        },
      },
    })

    if (!gastoFijo) {
      return NextResponse.json({ error: 'Gasto fijo no encontrado' }, { status: 404 })
    }

    if (gastoFijo.gestor.usuarios.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const gastoFijoActualizado = await prisma.gastoFijo.update({
      where: { id },
      data,
    })

    return NextResponse.json(gastoFijoActualizado)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en actualizar gasto fijo:', error)
    return NextResponse.json(
      { error: 'Error al actualizar gasto fijo', message: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const gastoFijo = await prisma.gastoFijo.findUnique({
      where: { id },
      include: {
        gestor: {
          include: {
            usuarios: {
              where: { usuarioId: user.id },
            },
          },
        },
      },
    })

    if (!gastoFijo) {
      return NextResponse.json({ error: 'Gasto fijo no encontrado' }, { status: 404 })
    }

    if (gastoFijo.gestor.usuarios.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await prisma.gastoFijo.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Gasto fijo eliminado' })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en eliminar gasto fijo:', error)
    return NextResponse.json(
      { error: 'Error al eliminar gasto fijo', message: errorMessage },
      { status: 500 }
    )
  }
}
