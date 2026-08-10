// Puente entre Prisma y el motor puro: carga movimientos desde la DB y arma
// los inputs para computeMetrics / insights. Solo servidor.
import { prisma } from '../prisma'
import { computeMetrics, type MesInput, type MovGasto, type Metrics } from './metrics'
import { gastosPrescindibles, anomalias, recomendacionAhorro, type Anomalia } from './insights'

export interface AnalisisMes {
  mesId: string
  metrics: Metrics
  prescindibles: ReturnType<typeof gastosPrescindibles>
  anomalias: Anomalia[]
  recomendacion: ReturnType<typeof recomendacionAhorro>
}

function mapGasto(g: {
  monto: number
  fecha: Date
  categoria: string | null
  clasificacion: string | null
  necesidad: string | null
  descripcion: string
}): MovGasto {
  return {
    monto: g.monto,
    fecha: g.fecha,
    categoria: g.categoria,
    clasificacion: g.clasificacion,
    necesidad: g.necesidad,
    descripcion: g.descripcion,
  }
}

/** Mes activo del gestor: el más reciente sin cerrar; si no hay, el más reciente. */
export async function getMesActivo(gestorId: string) {
  const abierto = await prisma.mes.findFirst({
    where: { gestorId, cerrado: false },
    orderBy: { fechaInicio: 'desc' },
  })
  if (abierto) return abierto
  return prisma.mes.findFirst({ where: { gestorId }, orderBy: { fechaInicio: 'desc' } })
}

export async function buildMesInput(mesId: string): Promise<MesInput | null> {
  const mes = await prisma.mes.findUnique({
    where: { id: mesId },
    include: { gastos: true, ingresos: true },
  })
  if (!mes) return null
  return {
    fechaInicio: mes.fechaInicio,
    fechaCierre: mes.fechaCierre,
    ingresoEsperado: mes.ingresoEsperado,
    ahorroObjetivo: mes.ahorroObjetivo,
    gastos: mes.gastos.map(mapGasto),
    ingresos: mes.ingresos.map((i) => ({
      monto: i.monto,
      fecha: i.fecha,
      categoria: i.categoria,
      descripcion: i.descripcion,
    })),
  }
}

/** Meses previos (para anomalías y comparación), excluyendo el mes actual. */
export async function buildHistorial(gestorId: string, exceptMesId: string, limite = 6) {
  const meses = await prisma.mes.findMany({
    where: { gestorId, id: { not: exceptMesId } },
    orderBy: { fechaInicio: 'desc' },
    take: limite,
    include: { gastos: true },
  })
  return meses.map((m) => ({ gastos: m.gastos.map(mapGasto) }))
}

/** Análisis completo del mes: métricas + prescindibles + anomalías + recomendación. */
export async function analizarMes(mesId: string, gestorId: string, hoy = new Date()): Promise<AnalisisMes | null> {
  const input = await buildMesInput(mesId)
  if (!input) return null
  const historial = await buildHistorial(gestorId, mesId)
  const metrics = computeMetrics(input, hoy)
  const historialTotales = historial.map((h) =>
    h.gastos
      .filter((g) => ['fijo', 'variable', 'deuda'].includes((g.clasificacion || '').toLowerCase()))
      .reduce((s, g) => s + g.monto, 0),
  )
  return {
    mesId,
    metrics,
    prescindibles: gastosPrescindibles(input.gastos),
    anomalias: anomalias(input.gastos, historial),
    recomendacion: recomendacionAhorro(metrics, historialTotales),
  }
}
