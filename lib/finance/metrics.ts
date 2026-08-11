// Motor de cálculo financiero (spec §4, §7, §142-172).
// TODAS las métricas críticas se calculan acá con código. La IA solo las explica.
// Funciones puras y deterministas (reciben `hoy` para ser testeables).

import type { Clasificacion } from './classify'

export interface MovGasto {
  monto: number
  fecha: Date | string
  categoria?: string | null
  clasificacion?: string | null
  necesidad?: string | null
  descripcion: string
}

export interface MovIngreso {
  monto: number
  fecha: Date | string
  categoria?: string | null
  descripcion: string
}

export interface MesInput {
  fechaInicio: Date | string
  fechaCierre?: Date | string | null
  ingresoEsperado?: number | null
  ahorroObjetivo?: number | null
  gastos: MovGasto[]
  ingresos: MovIngreso[]
}

export interface CategoriaTotal {
  categoria: string
  total: number
  porcentaje: number
}

export interface Metrics {
  // Base (spec §146-161)
  totalIncome: number
  totalExpenses: number
  balance: number
  savingsRate: number
  averageDailyExpense: number
  averageWeeklyExpense: number
  fixedExpenses: number
  variableExpenses: number
  discretionaryExpenses: number
  extraordinaryExpenses: number
  debtExpenses: number
  topCategories: CategoriaTotal[]
  topTransactions: { descripcion: string; monto: number; categoria: string }[]
  projectedEndBalance: number
  // Ahorro (spec §106-107)
  ahorroReal: number
  ahorroObjetivo: number
  porcentajeAhorrado: number
  // Presupuesto y proyección (spec §7, §224-233)
  diasEnMes: number
  diasTranscurridos: number
  diasRestantes: number
  dineroDisponible: number
  gastoDiarioPromedio: number
  gastoDiarioRecomendado: number
  gastoEsperado: number
  saldoProyectado: number
  fechaEstimadaSinDinero: string | null
}

const MS_DIA = 1000 * 60 * 60 * 24

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

function diffDias(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_DIA)
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function esClasificacion(g: MovGasto, c: Clasificacion): boolean {
  return (g.clasificacion || '').toLowerCase() === c
}

export function computeMetrics(mes: MesInput, hoy: Date = new Date()): Metrics {
  const inicio = toDate(mes.fechaInicio)
  const fin = mes.fechaCierre ? toDate(mes.fechaCierre) : addMonths(inicio, 1)

  // Ventana temporal del mes
  const diasEnMes = Math.max(1, diffDias(inicio, fin))
  const ahora = hoy < inicio ? inicio : hoy > fin ? fin : hoy
  const diasTranscurridos = Math.max(1, diffDias(inicio, ahora))
  const diasRestantes = Math.max(0, diffDias(ahora, fin))

  const totalIncome = round(mes.ingresos.reduce((s, i) => s + i.monto, 0))
  const totalExpenses = round(mes.gastos.reduce((s, g) => s + g.monto, 0))
  const balance = round(totalIncome - totalExpenses)

  const savingsRate = totalIncome > 0 ? round(balance / totalIncome) : 0

  const averageDailyExpense = round(totalExpenses / diasTranscurridos)
  const averageWeeklyExpense = round(averageDailyExpense * 7)

  const sumBy = (c: Clasificacion) =>
    round(mes.gastos.filter((g) => esClasificacion(g, c)).reduce((s, g) => s + g.monto, 0))

  const fixedExpenses = sumBy('fijo')
  const variableExpenses = sumBy('variable')
  const discretionaryExpenses = sumBy('discrecional')
  const extraordinaryExpenses = sumBy('extraordinario')
  const debtExpenses = sumBy('deuda')

  // Top categorías
  const porCategoria = new Map<string, number>()
  for (const g of mes.gastos) {
    const cat = g.categoria || 'Sin categoría'
    porCategoria.set(cat, (porCategoria.get(cat) || 0) + g.monto)
  }
  const topCategories: CategoriaTotal[] = Array.from(porCategoria.entries())
    .map(([categoria, total]) => ({
      categoria,
      total: round(total),
      porcentaje: totalExpenses > 0 ? round((total / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  const topTransactions = [...mes.gastos]
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5)
    .map((g) => ({ descripcion: g.descripcion, monto: round(g.monto), categoria: g.categoria || 'Sin categoría' }))

  // Plan mensual
  const ingresoBase = mes.ingresoEsperado ?? totalIncome
  const ahorroObjetivo = mes.ahorroObjetivo ?? 0

  // Proyección: gasto esperado = ritmo diario * días del mes
  const gastoEsperado = round(averageDailyExpense * diasEnMes)
  const projectedExpenses = round(totalExpenses + averageDailyExpense * diasRestantes)
  const projectedEndBalance = round(ingresoBase - projectedExpenses)
  const saldoProyectado = round(ingresoBase - gastoEsperado)

  // Disponible y ritmo recomendado (spec §224-233)
  const dineroDisponible = round(ingresoBase - ahorroObjetivo - totalExpenses)
  const gastoDiarioPromedio = averageDailyExpense
  const gastoDiarioRecomendado = diasRestantes > 0 ? round(Math.max(0, dineroDisponible) / diasRestantes) : 0

  // Fecha estimada de quedarse sin dinero
  let fechaEstimadaSinDinero: string | null = null
  if (gastoDiarioPromedio > 0 && dineroDisponible > 0) {
    const diasHasta = dineroDisponible / gastoDiarioPromedio
    if (diasHasta < diasRestantes) {
      const fecha = new Date(ahora.getTime() + diasHasta * MS_DIA)
      fechaEstimadaSinDinero = fecha.toISOString()
    }
  }

  const ahorroReal = balance
  const porcentajeAhorrado = ingresoBase > 0 ? round((ahorroReal / ingresoBase) * 100) : 0

  return {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate,
    averageDailyExpense,
    averageWeeklyExpense,
    fixedExpenses,
    variableExpenses,
    discretionaryExpenses,
    extraordinaryExpenses,
    debtExpenses,
    topCategories,
    topTransactions,
    projectedEndBalance,
    ahorroReal,
    ahorroObjetivo,
    porcentajeAhorrado,
    diasEnMes,
    diasTranscurridos,
    diasRestantes,
    dineroDisponible,
    gastoDiarioPromedio,
    gastoDiarioRecomendado,
    gastoEsperado,
    saldoProyectado,
    fechaEstimadaSinDinero,
  }
}
