import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateIngresoSchema = z.object({
  monto: z.number().positive().optional(),
  descripcion: z.string().min(1).optional(),
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

    const ingreso = await prisma.ingreso.findUnique({
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

    if (!ingreso) {
      return NextResponse.json({ error: 'Ingreso no encontrado' }, { status: 404 })
    }

    if (ingreso.mes.gestor.usuarios.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (ingreso.mes.cerrado) {
      return NextResponse.json(
        { error: 'No se pueden modificar ingresos de un mes cerrado' },
        { status: 400 }
      )
    }

    await prisma.ingreso.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Ingreso eliminado' })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en eliminar ingreso:', error)
    return NextResponse.json(
      { error: 'Error al eliminar ingreso', message: errorMessage },
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
    const data = updateIngresoSchema.parse(body)

    const ingreso = await prisma.ingreso.findUnique({
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

    if (!ingreso) {
      return NextResponse.json({ error: 'Ingreso no encontrado' }, { status: 404 })
    }

    if (ingreso.mes.gestor.usuarios.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (ingreso.mes.cerrado) {
      return NextResponse.json(
        { error: 'No se pueden modificar ingresos de un mes cerrado' },
        { status: 400 }
      )
    }

    const ingresoActualizado = await prisma.ingreso.update({
      where: { id },
      data: {
        ...data,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
      },
    })

    return NextResponse.json(ingresoActualizado)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en actualizar ingreso:', error)
    return NextResponse.json(
      { error: 'Error al actualizar ingreso', message: errorMessage },
      { status: 500 }
    )
  }
}
