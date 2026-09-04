// Generación de los gastos fijos de un mes a partir de las plantillas GastoFijo
// del gestor. Cada gasto generado queda ligado a su plantilla por gastoFijoId y
// nace impago; el usuario lo marca como pagado desde la pantalla del mes.
import type { Prisma } from '../../src/generated/client'

/** Cliente de Prisma o transacción: ambos sirven. */
type Db = Prisma.TransactionClient

/**
 * Crea en `mesId` los gastos que falten para las plantillas activas del gestor.
 * Idempotente: el índice único (mesId, gastoFijoId) más `skipDuplicates` evitan
 * duplicar los que ya existen, así se puede llamar tantas veces como haga falta.
 * Devuelve cuántos se crearon.
 */
export async function generarFijosDelMes(
  db: Db,
  gestorId: string,
  mesId: string,
  fecha: Date
): Promise<number> {
  const plantillas = await db.gastoFijo.findMany({
    where: { gestorId, activo: true },
  })
  if (plantillas.length === 0) return 0

  const { count } = await db.gasto.createMany({
    data: plantillas.map((p) => ({
      mesId,
      gastoFijoId: p.id,
      monto: p.monto,
      descripcion: p.descripcion,
      categoria: p.categoria,
      clasificacion: 'fijo',
      pagado: false,
      fecha,
    })),
    skipDuplicates: true,
  })
  return count
}
