import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError, ApiError } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  phoneNumber: z.string().min(6).max(20).regex(/^\+?[0-9]+$/, 'Número inválido'),
})

function normalizarNumero(n: string): string {
  return n.replace(/[^0-9]/g, '')
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user } = await requireGestor(id)
    const conexiones = await prisma.conexionWhatsApp.findMany({
      where: { gestorId: id, usuarioId: user.id },
    })
    return NextResponse.json(conexiones)
  } catch (error) {
    return handleError(error, 'obtener conexiones WhatsApp')
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user } = await requireGestor(id)
    const { phoneNumber } = schema.parse(await request.json())
    const phone = normalizarNumero(phoneNumber)

    // Un número solo puede estar vinculado a una conexión (idempotencia de origen).
    const existente = await prisma.conexionWhatsApp.findUnique({ where: { phoneNumber: phone } })
    if (existente && existente.usuarioId !== user.id) {
      throw new ApiError(409, 'Ese número ya está vinculado a otra cuenta')
    }

    const conexion = await prisma.conexionWhatsApp.upsert({
      where: { phoneNumber: phone },
      create: { usuarioId: user.id, gestorId: id, phoneNumber: phone, activo: true },
      update: { gestorId: id, activo: true },
    })
    return NextResponse.json(conexion, { status: 201 })
  } catch (error) {
    return handleError(error, 'vincular WhatsApp')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { user } = await requireGestor(id)
    const phone = normalizarNumero(request.nextUrl.searchParams.get('phoneNumber') || '')
    if (!phone) throw new ApiError(400, 'Falta phoneNumber')
    await prisma.conexionWhatsApp.deleteMany({ where: { phoneNumber: phone, usuarioId: user.id, gestorId: id } })
    return NextResponse.json({ message: 'Conexión eliminada' })
  } catch (error) {
    return handleError(error, 'eliminar conexión WhatsApp')
  }
}
