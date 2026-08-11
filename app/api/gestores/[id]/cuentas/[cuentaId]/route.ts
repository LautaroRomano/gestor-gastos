import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, ApiError } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  nombre: z.string().min(1).optional(),
  tipo: z.enum(['efectivo', 'banco', 'debito', 'credito', 'billetera']).optional(),
  saldo: z.number().finite().optional(),
  moneda: z.string().optional(),
})

async function ensureCuenta(gestorId: string, cuentaId: string) {
  const cuenta = await prisma.cuenta.findFirst({ where: { id: cuentaId, gestorId } })
  if (!cuenta) throw new ApiError(404, 'Cuenta no encontrada')
  return cuenta
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; cuentaId: string }> }) {
  try {
    const { id, cuentaId } = await params
    await requireGestor(id)
    await ensureCuenta(id, cuentaId)
    const data = schema.parse(await request.json())
    const cuenta = await prisma.cuenta.update({ where: { id: cuentaId }, data })
    return NextResponse.json(cuenta)
  } catch (error) {
    return handleError(error, 'actualizar cuenta')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; cuentaId: string }> }) {
  try {
    const { id, cuentaId } = await params
    await requireGestor(id)
    await ensureCuenta(id, cuentaId)
    await prisma.cuenta.delete({ where: { id: cuentaId } })
    return NextResponse.json({ message: 'Cuenta eliminada' })
  } catch (error) {
    return handleError(error, 'eliminar cuenta')
  }
}
