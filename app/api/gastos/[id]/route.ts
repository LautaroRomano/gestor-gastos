import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateGastoSchema = z.object({
  monto: z.number().positive().optional(),
  descripcion: z.string().min(1).optional(),
  categoria: z.string().optional(),
  fecha: z.string().datetime().optional(),
})

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

    const gasto = await prisma.gasto.findUnique({
      where: { id },
      include: {
        mes: {
          include: {
            gestor: {
              include: {
                usuarios: {
                  where: {
                    usuarioId: user.id,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!gasto) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    if (gasto.mes.gestor.usuarios.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (gasto.mes.cerrado) {
      return NextResponse.json(
        { error: 'No se pueden modificar gastos de un mes cerrado' },
        { status: 400 }
      )
    }

    await prisma.gasto.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Gasto eliminado' })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en eliminar gasto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar gasto', message: errorMessage },
      { status: 500 }
    )
  }
}

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
    const data = updateGastoSchema.parse(body)

    const gasto = await prisma.gasto.findUnique({
      where: { id },
      include: {
        mes: {
          include: {
            gestor: {
              include: {
                usuarios: {
                  where: {
                    usuarioId: user.id,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!gasto) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    if (gasto.mes.gestor.usuarios.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (gasto.mes.cerrado) {
      return NextResponse.json(
        { error: 'No se pueden modificar gastos de un mes cerrado' },
        { status: 400 }
      )
    }

    const gastoActualizado = await prisma.gasto.update({
      where: { id },
      data: {
        ...data,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
      },
    })

    return NextResponse.json(gastoActualizado)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en actualizar gasto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar gasto', message: errorMessage },
      { status: 500 }
    )
  }
}
