import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, ApiError } from '@/lib/api'
import { buildMesInput } from '@/lib/finance/service'
import { compararMeses } from '@/lib/finance/insights'

// Comparación entre dos meses (spec §18). ?mesA=&mesB=
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)

    const mesAId = request.nextUrl.searchParams.get('mesA')
    const mesBId = request.nextUrl.searchParams.get('mesB')
    if (!mesAId || !mesBId) throw new ApiError(400, 'Faltan parámetros mesA y mesB')

    // Verificar que ambos meses pertenecen al gestor (aislamiento)
    const count = await prisma.mes.count({ where: { gestorId: id, id: { in: [mesAId, mesBId] } } })
    if (count < 2) throw new ApiError(404, 'Mes no encontrado')

    const [a, b] = await Promise.all([buildMesInput(mesAId), buildMesInput(mesBId)])
    const comparacion = compararMeses(a?.gastos ?? [], b?.gastos ?? [])
    return NextResponse.json(comparacion)
  } catch (error) {
    return handleError(error, 'comparar meses')
  }
}
