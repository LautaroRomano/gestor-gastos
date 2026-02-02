import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'

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

    // Verificar que el gestor existe
    const gestor = await prisma.gestor.findUnique({
      where: { id },
    })

    if (!gestor) {
      return NextResponse.json({ error: 'Gestor no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario no esté ya en el gestor
    const existe = await prisma.usuarioGestor.findUnique({
      where: {
        usuarioId_gestorId: {
          usuarioId: user.id,
          gestorId: id,
        },
      },
    })

    if (existe) {
      return NextResponse.json(
        { error: 'Ya estás registrado en este gestor' },
        { status: 400 }
      )
    }

    // Agregar usuario al gestor
    await prisma.usuarioGestor.create({
      data: {
        usuarioId: user.id,
        gestorId: id,
        rol: 'miembro',
      },
    })

    return NextResponse.json({ message: 'Te has unido al gestor exitosamente' })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en unirse al gestor:', error)
    return NextResponse.json(
      { error: 'Error al unirse al gestor', message: errorMessage },
      { status: 500 }
    )
  }
}
