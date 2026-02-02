import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const gestorSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const gestores = await prisma.gestor.findMany({
      where: {
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
          include: {
            ingresos: true,
            gastos: true,
          },
        },
      },
    })

    return NextResponse.json(gestores)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en obtener gestores:', error)
    return NextResponse.json(
      { error: 'Error al obtener gestores', message: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, descripcion } = gestorSchema.parse(body)

    const gestor = await prisma.gestor.create({
      data: {
        nombre,
        descripcion,
        usuarios: {
          create: {
            usuarioId: user.id,
            rol: 'admin',
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
      },
    })

    return NextResponse.json(gestor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en crear gestor:', error)
    return NextResponse.json(
      { error: 'Error al crear gestor', message: errorMessage },
      { status: 500 }
    )
  }
}
