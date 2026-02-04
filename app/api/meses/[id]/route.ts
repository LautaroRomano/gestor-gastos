import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateMesSchema = z.object({
  fechaInicio: z.string().datetime().optional(),
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
    const data = updateMesSchema.parse(body)

    const mes = await prisma.mes.findUnique({
      where: { id },
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
    })

    if (!mes) {
      return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })
    }

    if (mes.gestor.usuarios.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (mes.cerrado) {
      return NextResponse.json(
        { error: 'No se pueden modificar meses cerrados' },
        { status: 400 }
      )
    }

    const mesActualizado = await prisma.mes.update({
      where: { id },
      data: {
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
      },
    })

    return NextResponse.json(mesActualizado)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en actualizar mes:', error)
    return NextResponse.json(
      { error: 'Error al actualizar mes', message: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const mes = await prisma.mes.findUnique({
      where: { id },
      include: {
        ingresos: {
          orderBy: { fecha: 'desc' },
        },
        gastos: {
          orderBy: { fecha: 'desc' },
        },
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
    })

    if (!mes) {
      return NextResponse.json({ error: 'Mes no encontrado' }, { status: 404 })
    }

    if (mes.gestor.usuarios.length === 0) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    return NextResponse.json(mes)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en obtener mes:', error)
    return NextResponse.json(
      { error: 'Error al obtener mes', message: errorMessage },
      { status: 500 }
    )
  }
}
