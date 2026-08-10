import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['efectivo', 'banco', 'debito', 'credito', 'billetera']).default('efectivo'),
  saldo: z.number().finite().default(0),
  moneda: z.string().default('ARS'),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const cuentas = await prisma.cuenta.findMany({ where: { gestorId: id }, orderBy: { nombre: 'asc' } })
    return NextResponse.json(cuentas)
  } catch (error) {
    return handleError(error, 'obtener cuentas')
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)
    const data = schema.parse(await request.json())
    const cuenta = await prisma.cuenta.create({ data: { gestorId: id, ...data } })
    return NextResponse.json(cuenta, { status: 201 })
  } catch (error) {
    return handleError(error, 'crear cuenta')
  }
}
