import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/format-currency'
import { getMesActivo, buildMesInput } from '@/lib/finance/service'
import { computeMetrics } from '@/lib/finance/metrics'
import { enviarMensaje } from '@/lib/whatsapp/send'

/**
 * Tarea programada (Vercel Cron u otro): evalúa alertas de presupuesto y ahorro
 * y las envía por WhatsApp (spec §12). Protegida con CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const provisto =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.nextUrl.searchParams.get('secret')
  if (!secret || provisto !== secret) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const conexiones = await prisma.conexionWhatsApp.findMany({ where: { activo: true } })
  let alertasEnviadas = 0

  for (const conexion of conexiones) {
    const mes = await getMesActivo(conexion.gestorId)
    if (!mes) continue
    const input = await buildMesInput(mes.id)
    if (!input) continue
    const m = computeMetrics(input)

    // Alertas de presupuesto por categoría (≥80%) — spec §12
    const presupuestos = await prisma.presupuesto.findMany({ where: { gestorId: conexion.gestorId } })
    const consumo = new Map<string, number>()
    for (const g of input.gastos) {
      const c = g.categoria || 'Sin categoría'
      consumo.set(c, (consumo.get(c) || 0) + g.monto)
    }
    for (const p of presupuestos) {
      const usado = consumo.get(p.categoria || '') || 0
      const pct = p.monto > 0 ? (usado / p.monto) * 100 : 0
      if (pct >= 80) {
        const restante = Math.max(0, p.monto - usado)
        await enviarMensaje(
          conexion.phoneNumber,
          `⚠️ Ya utilizaste el ${Math.round(pct)}% de tu presupuesto de ${p.categoria}.\n\nTe quedan ${formatCurrency(restante)} para el resto del mes.`,
        )
        alertasEnviadas++
      }
    }

    // Progreso de ahorro (spec §12)
    if (m.ahorroObjetivo > 0 && m.ahorroReal > 0) {
      const falta = m.ahorroObjetivo - m.ahorroReal
      if (falta > 0 && m.ahorroReal >= m.ahorroObjetivo * 0.7) {
        await enviarMensaje(
          conexion.phoneNumber,
          `💰 Vas muy bien.\n\nEste mes ya ahorraste ${formatCurrency(m.ahorroReal)}.\nEstás a ${formatCurrency(falta)} de tu objetivo mensual.`,
        )
        alertasEnviadas++
      }
    }
  }

  return NextResponse.json({ ok: true, alertasEnviadas })
}
