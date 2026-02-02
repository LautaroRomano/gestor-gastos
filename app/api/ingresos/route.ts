import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ingresoSchema = z.object({
  mesId: z.string(),
  monto: z.number().positive(),
  descripcion: z.string().min(1),
  fecha: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { mesId, monto, descripcion, fecha } = ingresoSchema.parse(body)
    
    // Convertir fecha de datetime-local a ISO si existe
    let fechaISO: Date | undefined
    if (fecha) {
      // Si la fecha viene de datetime-local, agregar segundos y zona horaria si no los tiene
      const fechaStr = fecha.includes('T') ? fecha : `${fecha}T00:00:00`
      fechaISO = new Date(fechaStr)
      if (isNaN(fechaISO.getTime())) {
        return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
      }
    }

    // Verificar acceso al mes
    const mes = await prisma.mes.findUnique({
      where: { id: mesId },
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
        { error: 'No se pueden agregar ingresos a un mes cerrado' },
        { status: 400 }
      )
    }

    const ingreso = await prisma.ingreso.create({
      data: {
        mesId,
        monto,
        descripcion,
        fecha: fechaISO || new Date(),
      },
    })

    return NextResponse.json(ingreso, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al crear ingreso' },
      { status: 500 }
    )
  }
}
