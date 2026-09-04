import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, handleError, ApiError } from '@/lib/api'
import { generarFijosDelMes } from '@/lib/finance/fijos'

/**
 * Genera en este mes los gastos fijos que falten según las plantillas activas
 * del gestor. Sirve para meses creados antes de cargar los fijos, o cuando se
 * agrega una plantilla a mitad de mes. Es idempotente: no duplica.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params

    const mes = await prisma.mes.findUnique({
      where: { id },
      include: { gestor: { include: { usuarios: { where: { usuarioId: user.id } } } } },
    })

    if (!mes) throw new ApiError(404, 'Mes no encontrado')
    if (mes.gestor.usuarios.length === 0) throw new ApiError(403, 'No autorizado')
    if (mes.cerrado) throw new ApiError(400, 'No se pueden generar fijos en un mes cerrado')

    const creados = await prisma.$transaction((tx) =>
      generarFijosDelMes(tx, mes.gestorId, mes.id, mes.fechaInicio)
    )

    return NextResponse.json({ creados })
  } catch (error) {
    return handleError(error, 'generar gastos fijos')
  }
}
