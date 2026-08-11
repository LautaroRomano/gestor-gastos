import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, ApiError } from '@/lib/api'
import { analizarMes, getMesActivo, buildMesInput } from '@/lib/finance/service'
import { aiDisponible, explicarAnalisis } from '@/lib/ai/openai'

async function resolverMesId(gestorId: string, mesIdParam: string | null): Promise<string> {
  if (mesIdParam) {
    const mes = await prisma.mes.findFirst({ where: { id: mesIdParam, gestorId } })
    if (!mes) throw new ApiError(404, 'Mes no encontrado')
    return mes.id
  }
  const activo = await getMesActivo(gestorId)
  if (!activo) throw new ApiError(404, 'El gestor no tiene meses')
  return activo.id
}

// Presupuesto vs consumo del mes (spec §7, §17, §12).
async function presupuestoVsConsumo(gestorId: string, mesId: string) {
  const [presupuestos, input] = await Promise.all([
    prisma.presupuesto.findMany({ where: { gestorId } }),
    buildMesInput(mesId),
  ])
  const consumoPorCat = new Map<string, number>()
  for (const g of input?.gastos ?? []) {
    const c = g.categoria || 'Sin categoría'
    consumoPorCat.set(c, (consumoPorCat.get(c) || 0) + g.monto)
  }
  return presupuestos.map((p) => {
    const nombre = p.categoria || ''
    const consumo = consumoPorCat.get(nombre) || 0
    const porcentaje = p.monto > 0 ? Math.round((consumo / p.monto) * 100) : 0
    return { presupuestoId: p.id, categoria: nombre, presupuesto: p.monto, consumo, porcentaje }
  })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const mesId = await resolverMesId(id, request.nextUrl.searchParams.get('mesId'))
    const analisis = await analizarMes(mesId, id)
    if (!analisis) throw new ApiError(404, 'Mes no encontrado')
    const presupuestos = await presupuestoVsConsumo(id, mesId)
    return NextResponse.json({ ...analisis, presupuestos, aiDisponible: aiDisponible() })
  } catch (error) {
    return handleError(error, 'obtener análisis')
  }
}

// Dispara la explicación con IA y la cachea (spec §537).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    if (!aiDisponible()) {
      return NextResponse.json(
        { error: 'IA no configurada', message: 'Configurá OPENAI_API_KEY para habilitar el análisis con IA.' },
        { status: 503 },
      )
    }
    const mesId = await resolverMesId(id, request.nextUrl.searchParams.get('mesId'))
    const analisis = await analizarMes(mesId, id)
    if (!analisis) throw new ApiError(404, 'Mes no encontrado')

    const ia = await explicarAnalisis(analisis.metrics, {
      prescindiblesTotal: analisis.prescindibles.total,
      anomalias: analisis.anomalias.map((a) => a.detalle),
    })

    const mes = await prisma.mes.findUnique({ where: { id: mesId } })
    const periodo = mes ? new Date(mes.fechaInicio).toISOString().slice(0, 7) : 'actual'
    await prisma.analisisIA.create({
      data: { gestorId: id, mesId, periodo, analisis: ia.analisis, recomendaciones: ia.recomendaciones },
    })

    return NextResponse.json(ia)
  } catch (error) {
    return handleError(error, 'generar análisis IA')
  }
}
