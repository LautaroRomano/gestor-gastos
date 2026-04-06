import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const gastoFijoSchema = z.object({
  monto: z.number().positive(),
  descripcion: z.string().min(1),
  categoria: z.string().optional(),
  activo: z.boolean().optional(),
})

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

    const acceso = await prisma.usuarioGestor.findUnique({
      where: {
        usuarioId_gestorId: {
          usuarioId: user.id,
          gestorId: id,
        },
      },
    })

    if (!acceso) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const gastosFijos = await prisma.gastoFijo.findMany({
      where: { gestorId: id },
      orderBy: { descripcion: 'asc' },
    })

    return NextResponse.json(gastosFijos)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en obtener gastos fijos:', error)
    return NextResponse.json(
      { error: 'Error al obtener gastos fijos', message: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const data = gastoFijoSchema.parse(body)

    const acceso = await prisma.usuarioGestor.findUnique({
      where: {
        usuarioId_gestorId: {
          usuarioId: user.id,
          gestorId: id,
        },
      },
    })

    if (!acceso) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const gastoFijo = await prisma.gastoFijo.create({
      data: {
        gestorId: id,
        monto: data.monto,
        descripcion: data.descripcion,
        categoria: data.categoria,
        activo: data.activo ?? true,
      },
    })

    return NextResponse.json(gastoFijo, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en crear gasto fijo:', error)
    return NextResponse.json(
      { error: 'Error al crear gasto fijo', message: errorMessage },
      { status: 500 }
    )
  }
}
