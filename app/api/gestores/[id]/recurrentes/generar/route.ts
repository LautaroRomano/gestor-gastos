import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireGestor, handleError } from '@/lib/api'
import { getMesActivo } from '@/lib/finance/service'
import { clasificarGasto } from '@/lib/finance/classify'

function avanzarFecha(fecha: Date, frecuencia: string): Date {
  const d = new Date(fecha)
  switch (frecuencia) {
    case 'semanal':
      d.setDate(d.getDate() + 7)
      break
    case 'quincenal':
      d.setDate(d.getDate() + 15)
      break
    case 'anual':
      d.setFullYear(d.getFullYear() + 1)
      break
    default:
      d.setMonth(d.getMonth() + 1)
  }
  return d
}

/** Materializa los movimientos recurrentes vencidos en el mes activo del gestor (spec §recurring). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requireGestor(id)

    const mes = await getMesActivo(id)
    if (!mes || mes.cerrado) {
      return NextResponse.json({ error: 'No hay un mes abierto para generar movimientos' }, { status: 400 })
    }

    const ahora = new Date()
    const pendientes = await prisma.recurrente.findMany({
      where: { gestorId: id, activo: true, proximaFecha: { lte: ahora } },
    })

    let generados = 0
    for (const rec of pendientes) {
      if (rec.tipo === 'ingreso') {
        await prisma.ingreso.create({
          data: {
            mesId: mes.id,
            monto: rec.monto,
            descripcion: rec.descripcion,
            categoria: rec.categoria,
            categoriaId: rec.categoriaId,
            recurrente: true,
            source: 'web',
          },
        })
      } else {
        const clas = clasificarGasto(rec.descripcion)
        await prisma.gasto.create({
          data: {
            mesId: mes.id,
            monto: rec.monto,
            descripcion: rec.descripcion,
            categoria: rec.categoria ?? clas.categoria,
            categoriaId: rec.categoriaId,
            clasificacion: clas.clasificacion,
            necesidad: clas.necesidad,
            recurrente: true,
            source: 'web',
          },
        })
      }
      await prisma.recurrente.update({
        where: { id: rec.id },
        data: { proximaFecha: avanzarFecha(rec.proximaFecha, rec.frecuencia) },
      })
      generados++
    }

    return NextResponse.json({ generados })
  } catch (error) {
    return handleError(error, 'generar recurrentes')
  }
}
