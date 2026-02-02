import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const mesSchema = z.object({
  fechaInicio: z.string().datetime(),
  fechaCierre: z.string().datetime().optional(),
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

    // Verificar acceso al gestor
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

    const meses = await prisma.mes.findMany({
      where: { gestorId: id },
      orderBy: { fechaInicio: 'desc' },
      include: {
        ingresos: true,
        gastos: true,
      },
    })

    return NextResponse.json(meses)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en obtener meses:', error)
    return NextResponse.json(
      { error: 'Error al obtener meses', message: errorMessage },
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

    // Verificar acceso al gestor
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

    const body = await request.json()
    const { fechaInicio } = mesSchema.parse(body)

    const mes = await prisma.mes.create({
      data: {
        gestorId: id,
        fechaInicio: new Date(fechaInicio),
        cerrado: false,
      },
      include: {
        ingresos: true,
        gastos: true,
      },
    })

    return NextResponse.json(mes, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en crear mes:', error)
    return NextResponse.json(
      { error: 'Error al crear mes', message: errorMessage },
      { status: 500 }
    )
  }
}
