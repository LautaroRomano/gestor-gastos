import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, montoSchema, parseFecha } from '@/lib/api'
import { calcularObjetivo } from '@/lib/finance/goals'
import { z } from 'zod'

const schema = z.object({
  nombre: z.string().min(1),
  montoObjetivo: montoSchema,
  montoActual: z.number().min(0).finite().default(0),
  fechaObjetivo: z.string().nullish(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const objetivos = await prisma.objetivo.findMany({ where: { gestorId: id }, orderBy: { createdAt: 'desc' } })
    // Adjuntar el cálculo derivado (faltante, progreso, ahorro/mes) — spec §9
    const conCalculo = objetivos.map((o) => ({ ...o, calculo: calcularObjetivo(o) }))
    return NextResponse.json(conCalculo)
  } catch (error) {
    return handleError(error, 'obtener objetivos')
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const data = schema.parse(await request.json())
    const objetivo = await prisma.objetivo.create({
      data: {
        gestorId: id,
        nombre: data.nombre,
        montoObjetivo: data.montoObjetivo,
        montoActual: data.montoActual,
        fechaObjetivo: parseFecha(data.fechaObjetivo ?? undefined) ?? null,
      },
    })
    return NextResponse.json({ ...objetivo, calculo: calcularObjetivo(objetivo) }, { status: 201 })
  } catch (error) {
    return handleError(error, 'crear objetivo')
  }
}
