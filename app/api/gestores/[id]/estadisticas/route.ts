import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar acceso al gestor
    const acceso = await prisma.usuarioGestor.findUnique({
      where: {
        usuarioId_gestorId: {
          usuarioId: user.id,
          gestorId: id,
        },
      },
    })

    if (!acceso) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener todos los meses del gestor con sus ingresos y gastos
    const meses = await prisma.mes.findMany({
      where: { gestorId: id },
      include: {
        ingresos: true,
        gastos: true,
      },
    })

    // Calcular estadísticas
    const totalIngresos = meses.reduce(
      (sum, mes) => sum + mes.ingresos.reduce((s, ing) => s + ing.monto, 0),
      0
    )

    const totalGastos = meses.reduce(
      (sum, mes) => sum + mes.gastos.reduce((s, gas) => s + gas.monto, 0),
      0
    )

    const balance = totalIngresos - totalGastos

    const mesesConDatos = meses.filter(
      (mes) => mes.ingresos.length > 0 || mes.gastos.length > 0
    )

    const promedioIngresos =
      mesesConDatos.length > 0
        ? totalIngresos / mesesConDatos.length
        : 0

    const promedioGastos =
      mesesConDatos.length > 0
        ? totalGastos / mesesConDatos.length
        : 0

    const mesesAbiertos = meses.filter((mes) => !mes.cerrado).length
    const mesesCerrados = meses.filter((mes) => mes.cerrado).length

    // Gastos por categoría
    const gastosPorCategoriaMap = new Map<string, number>()
    meses.forEach((mes) => {
      mes.gastos.forEach((gasto) => {
        const categoria = gasto.categoria || 'Sin categoría'
        const actual = gastosPorCategoriaMap.get(categoria) || 0
        gastosPorCategoriaMap.set(categoria, actual + gasto.monto)
      })
    })

    const gastosPorCategoria = Array.from(gastosPorCategoriaMap.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({
      totalIngresos,
      totalGastos,
      balance,
      gastosPorCategoria,
      promedioIngresos,
      promedioGastos,
      mesesAbiertos,
      mesesCerrados,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas', message: errorMessage },
      { status: 500 }
    )
  }
}
