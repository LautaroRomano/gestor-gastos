import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const cerrarSchema = z.object({
  fechaCierre: z.string(),
})

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

    // Obtener el mes y verificar acceso
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
        { error: 'El mes ya está cerrado' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { fechaCierre } = cerrarSchema.parse(body)
    
    // Convertir fecha de datetime-local a Date si existe
    let fechaCierreISO: Date
    if (fechaCierre) {
      const fechaStr = fechaCierre.includes('T') ? fechaCierre : `${fechaCierre}T00:00:00`
      fechaCierreISO = new Date(fechaStr)
      if (isNaN(fechaCierreISO.getTime())) {
        return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Fecha de cierre requerida' }, { status: 400 })
    }

    const mesActualizado = await prisma.mes.update({
      where: { id },
      data: {
        fechaCierre: fechaCierreISO,
        cerrado: true,
      },
      include: {
        ingresos: true,
        gastos: true,
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
    console.error('Error en cerrar mes:', error)
    return NextResponse.json(
      { error: 'Error al cerrar mes', message: errorMessage },
      { status: 500 }
    )
  }
}
