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
