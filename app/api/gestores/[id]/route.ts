import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'

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

    const gestor = await prisma.gestor.findFirst({
      where: {
        id,
        usuarios: {
          some: {
            usuarioId: user.id,
          },
        },
      },
      include: {
        usuarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
        },
        meses: {
          orderBy: {
            fechaInicio: 'desc',
          },
          include: {
            ingresos: true,
            gastos: true,
          },
        },
      },
    })

    if (!gestor) {
      return NextResponse.json({ error: 'Gestor no encontrado' }, { status: 404 })
    }

    return NextResponse.json(gestor)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en obtener gestor:', error)
    return NextResponse.json(
      { error: 'Error al obtener gestor', message: errorMessage },
      { status: 500 }
    )
  }
}
