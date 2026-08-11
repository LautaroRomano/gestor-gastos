// Análisis derivado: prescindibles, anomalías, recomendación de ahorro,
// comparación de meses (spec §5, §6, §8, §18). Puro y determinista.

import type { MovGasto, Metrics } from './metrics'

const round = (n: number) => Math.round(n * 100) / 100

// ---------- Gastos prescindibles (spec §5) ----------
export interface Prescindible {
  descripcion: string
  monto: number
  categoria: string
  motivo: string
}

export function gastosPrescindibles(gastos: MovGasto[]): { items: Prescindible[]; total: number } {
  const items = gastos
    .filter((g) => {
      if (g.necesidad === 'prescindible') return true
      if (g.necesidad === 'necesario') return false
      // Sin marcar: discrecionales y extraordinarios son candidatos.
      const c = (g.clasificacion || '').toLowerCase()
      return c === 'discrecional' || c === 'extraordinario'
    })
    .map((g) => ({
      descripcion: g.descripcion,
      monto: round(g.monto),
      categoria: g.categoria || 'Sin categoría',
      // Nunca afirmar que es innecesario (spec §188-189).
      motivo:
        g.necesidad === 'prescindible'
          ? 'Marcado como prescindible'
          : 'Este gasto podría ser prescindible según tus hábitos.',
    }))
    .sort((a, b) => b.monto - a.monto)

  const total = round(items.reduce((s, i) => s + i.monto, 0))
  return { items, total }
}

// ---------- Anomalías y gastos extraordinarios (spec §6) ----------
export interface Anomalia {
  tipo: 'aumento_categoria' | 'gasto_alto' | 'duplicado'
  categoria?: string
  descripcion: string
  detalle: string
  monto: number
}

interface HistorialMes {
  gastos: MovGasto[]
}

function totalesPorCategoria(gastos: MovGasto[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const g of gastos) {
    const c = g.categoria || 'Sin categoría'
    m.set(c, (m.get(c) || 0) + g.monto)
  }
  return m
}

export function anomalias(gastosMes: MovGasto[], historial: HistorialMes[]): Anomalia[] {
  const out: Anomalia[] = []

  // 1) Categorías que crecen demasiado vs promedio histórico
  const actual = totalesPorCategoria(gastosMes)
  const histPorCat = new Map<string, number[]>()
  for (const mes of historial) {
    const t = totalesPorCategoria(mes.gastos)
    for (const [cat, val] of t) {
      if (!histPorCat.has(cat)) histPorCat.set(cat, [])
      histPorCat.get(cat)!.push(val)
    }
  }
  for (const [cat, valActual] of actual) {
    const previos = histPorCat.get(cat)
    if (!previos || previos.length === 0) continue
    const prom = previos.reduce((s, v) => s + v, 0) / previos.length
    if (prom > 0 && valActual > prom * 1.4 && valActual - prom > 20000) {
      const pct = Math.round(((valActual - prom) / prom) * 100)
      const min = round(Math.min(...previos))
      const max = round(Math.max(...previos))
      out.push({
        tipo: 'aumento_categoria',
        categoria: cat,
        descripcion: cat,
        detalle: `Normalmente gastás entre ${min} y ${max} en ${cat}. Este mes gastaste ${round(valActual)} (+${pct}%).`,
        monto: round(valActual),
      })
    }
  }

  // 2) Gasto individual muy superior al promedio de su categoría
  const promGastoPorCat = new Map<string, number>()
  for (const [cat, arr] of histPorCat) {
    promGastoPorCat.set(cat, arr.reduce((s, v) => s + v, 0) / arr.length)
  }
  for (const g of gastosMes) {
    const cat = g.categoria || 'Sin categoría'
    const prom = promGastoPorCat.get(cat)
    if (prom && prom > 0 && g.monto > prom * 1.5 && g.monto > 50000) {
      out.push({
        tipo: 'gasto_alto',
        categoria: cat,
        descripcion: g.descripcion,
        detalle: `"${g.descripcion}" (${round(g.monto)}) es más alto de lo habitual en ${cat}.`,
        monto: round(g.monto),
      })
    }
  }

  // 3) Duplicados dentro del mes (misma descripción y monto)
  const vistos = new Map<string, number>()
  for (const g of gastosMes) {
    const key = `${(g.descripcion || '').toLowerCase().trim()}|${g.monto}`
    vistos.set(key, (vistos.get(key) || 0) + 1)
  }
  for (const [key, count] of vistos) {
    if (count > 1) {
      const [desc, monto] = key.split('|')
      out.push({
        tipo: 'duplicado',
        descripcion: desc,
        detalle: `Detectamos ${count} gastos iguales de "${desc}" por ${monto}. ¿Es un cargo repetido?`,
        monto: Number(monto),
      })
    }
  }

  return out
}

// ---------- Recomendación de ahorro (spec §8) ----------
export interface RecomendacionAhorro {
  ahorroRecomendado: number
  ingresosBase: number
  gastosNormales: number
  gastosExtraordinarios: number
  margenSeguridad: number
  detalle: string
}

/**
 * No usa una regla fija del 20%. Pondera ingresos, fijos, variables,
 * extraordinarios, deudas, historial y objetivos, dejando un margen de seguridad.
 */
export function recomendacionAhorro(
  metrics: Metrics,
  historialGastosMensuales: number[] = [],
): RecomendacionAhorro {
  const ingresosBase = metrics.totalIncome > 0 ? metrics.totalIncome : metrics.ahorroObjetivo + metrics.totalExpenses

  // Gastos "normales" = recurrentes/necesarios (fijos + variables + deuda), sin extraordinarios.
  const gastosNormales = round(metrics.fixedExpenses + metrics.variableExpenses + metrics.debtExpenses)
  const gastosExtraordinarios = metrics.extraordinaryExpenses

  // Si hay historial, usar el promedio de gasto normal como referencia estable.
  const referenciaGastoNormal =
    historialGastosMensuales.length > 0
      ? historialGastosMensuales.reduce((s, v) => s + v, 0) / historialGastosMensuales.length
      : gastosNormales

  // Margen de seguridad ~10% de ingresos.
  const margenSeguridad = round(ingresosBase * 0.1)

  const capacidad = ingresosBase - referenciaGastoNormal - margenSeguridad
  const ahorroRecomendado = round(Math.max(0, capacidad))

  const detalle =
    `Con ingresos de ${round(ingresosBase)} y gastos normales de ${round(referenciaGastoNormal)}` +
    (gastosExtraordinarios > 0 ? ` (más ${gastosExtraordinarios} en extraordinarios este mes)` : '') +
    `, dejando un margen de seguridad de ${margenSeguridad}, podrías apuntar a ahorrar ${ahorroRecomendado}.`

  return {
    ahorroRecomendado,
    ingresosBase: round(ingresosBase),
    gastosNormales: round(referenciaGastoNormal),
    gastosExtraordinarios,
    margenSeguridad,
    detalle,
  }
}

// ---------- Comparación entre meses (spec §18) ----------
export interface ComparacionCategoria {
  categoria: string
  montoA: number
  montoB: number
  variacionPct: number | null
}

export function compararMeses(
  gastosA: MovGasto[],
  gastosB: MovGasto[],
): { categorias: ComparacionCategoria[]; totalA: number; totalB: number; variacionTotalPct: number | null } {
  const a = totalesPorCategoria(gastosA)
  const b = totalesPorCategoria(gastosB)
  const cats = new Set<string>([...a.keys(), ...b.keys()])

  const categorias: ComparacionCategoria[] = []
  for (const cat of cats) {
    const montoA = round(a.get(cat) || 0)
    const montoB = round(b.get(cat) || 0)
    const variacionPct = montoA > 0 ? Math.round(((montoB - montoA) / montoA) * 100) : montoB > 0 ? null : 0
    categorias.push({ categoria: cat, montoA, montoB, variacionPct })
  }
  categorias.sort((x, y) => y.montoB - x.montoB)

  const totalA = round([...a.values()].reduce((s, v) => s + v, 0))
  const totalB = round([...b.values()].reduce((s, v) => s + v, 0))
  const variacionTotalPct = totalA > 0 ? Math.round(((totalB - totalA) / totalA) * 100) : null

  return { categorias, totalA, totalB, variacionTotalPct }
}
