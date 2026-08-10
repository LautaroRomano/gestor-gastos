import { prisma } from './prisma'
import { CATEGORIAS_GASTO_DEFAULT, CATEGORIAS_INGRESO_DEFAULT } from './finance/classify'

/** Siembra las categorías por defecto (spec §63-81) al crear un gestor. Idempotente por gestor. */
export async function seedCategorias(gestorId: string) {
  const existentes = await prisma.categoria.count({ where: { gestorId } })
  if (existentes > 0) return

  for (const cat of CATEGORIAS_GASTO_DEFAULT) {
    const parent = await prisma.categoria.create({
      data: { gestorId, nombre: cat.nombre, tipo: 'gasto', clasificacionDefault: cat.clasificacion },
    })
    for (const sub of cat.sub) {
      await prisma.categoria.create({
        data: { gestorId, nombre: sub, tipo: 'gasto', parentId: parent.id, clasificacionDefault: cat.clasificacion },
      })
    }
  }

  for (const nombre of CATEGORIAS_INGRESO_DEFAULT) {
    await prisma.categoria.create({ data: { gestorId, nombre, tipo: 'ingreso' } })
  }
}
