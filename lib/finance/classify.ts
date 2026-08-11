// Clasificación inteligente de movimientos (spec §2, §72-94).
// Puro y sin dependencias: primero aplica reglas aprendidas del gestor,
// luego heurística por palabras clave.

export type Clasificacion =
  | 'fijo'
  | 'variable'
  | 'discrecional'
  | 'extraordinario'
  | 'deuda'

export type Necesidad = 'necesario' | 'prescindible' | 'no_seguro'

export interface Regla {
  patron: string
  categoria?: string | null
  clasificacion?: string | null
  necesidad?: string | null
}

export interface ResultadoClasificacion {
  categoria: string
  subcategoria?: string
  clasificacion: Clasificacion
  necesidad: Necesidad
}

interface Entrada {
  keywords: string[]
  categoria: string
  subcategoria?: string
  clasificacion: Clasificacion
}

// Mapa keyword -> categoría/clasificación (spec §72-94).
const MAPA: Entrada[] = [
  // Vivienda
  { keywords: ['alquiler'], categoria: 'Vivienda', subcategoria: 'Alquiler', clasificacion: 'fijo' },
  { keywords: ['expensa'], categoria: 'Vivienda', subcategoria: 'Expensas', clasificacion: 'fijo' },
  { keywords: ['internet', 'wifi', 'fibra'], categoria: 'Vivienda', subcategoria: 'Internet', clasificacion: 'fijo' },
  { keywords: ['telefon', 'celular', 'movil', 'línea', 'linea'], categoria: 'Vivienda', subcategoria: 'Telefonía', clasificacion: 'fijo' },
  { keywords: ['edet', 'luz', 'electricidad', 'gas', 'agua', 'servicio'], categoria: 'Vivienda', subcategoria: 'Servicios', clasificacion: 'variable' },
  { keywords: ['mantenimiento', 'plomero', 'electricista'], categoria: 'Vivienda', subcategoria: 'Mantenimiento', clasificacion: 'variable' },

  // Transporte
  { keywords: ['nafta', 'combustible', 'gasolina', 'ypf', 'shell'], categoria: 'Transporte', subcategoria: 'Nafta', clasificacion: 'variable' },
  { keywords: ['uber', 'cabify', 'didi', 'taxi', 'remis'], categoria: 'Transporte', subcategoria: 'Uber', clasificacion: 'variable' },
  { keywords: ['colectivo', 'sube', 'subte', 'tren', 'transporte publico', 'transporte público', 'boleto'], categoria: 'Transporte', subcategoria: 'Transporte público', clasificacion: 'variable' },
  { keywords: ['reparacion', 'reparación', 'repuesto', 'taller', 'mecanico', 'mecánico'], categoria: 'Transporte', subcategoria: 'Reparaciones', clasificacion: 'extraordinario' },
  { keywords: ['seguro'], categoria: 'Transporte', subcategoria: 'Seguro', clasificacion: 'fijo' },
  { keywords: ['patente', 'vtv', 'peaje'], categoria: 'Transporte', subcategoria: 'Patente', clasificacion: 'fijo' },

  // Alimentación
  { keywords: ['super', 'supermercado', 'almacen', 'almacén', 'verduleria', 'verdulería', 'carniceria', 'carnicería', 'mercado'], categoria: 'Alimentación', subcategoria: 'Supermercado', clasificacion: 'variable' },
  { keywords: ['restaurant', 'restaurante', 'resto', 'cena', 'almuerzo', 'parrilla', 'bar'], categoria: 'Alimentación', subcategoria: 'Restaurante', clasificacion: 'discrecional' },
  { keywords: ['delivery', 'pedidosya', 'rappi', 'pedido', 'mcdonald', 'burger', 'pizza'], categoria: 'Alimentación', subcategoria: 'Delivery', clasificacion: 'discrecional' },
  { keywords: ['cafe', 'café', 'kiosco', 'kiosko', 'panaderia', 'panadería', 'comida'], categoria: 'Alimentación', subcategoria: 'Comida', clasificacion: 'variable' },

  // Compras
  { keywords: ['ropa', 'zapatilla', 'zapato', 'remera', 'pantalon', 'pantalón', 'campera', 'vestido'], categoria: 'Compras', subcategoria: 'Ropa', clasificacion: 'discrecional' },
  { keywords: ['electronic', 'electrónic', 'celu', 'notebook', 'tv', 'auricular', 'monitor', 'teclado'], categoria: 'Compras', subcategoria: 'Electrónica', clasificacion: 'discrecional' },
  { keywords: ['hogar', 'mueble', 'deco', 'pintura', 'ferreteria', 'ferretería'], categoria: 'Compras', subcategoria: 'Hogar', clasificacion: 'discrecional' },
  { keywords: ['accesorio', 'reloj', 'lente', 'perfume'], categoria: 'Compras', subcategoria: 'Accesorios', clasificacion: 'discrecional' },

  // Familia
  { keywords: ['mama', 'mamá', 'papa', 'papá', 'hermano', 'hermana', 'familia', 'ayuda familiar', 'abuela', 'abuelo'], categoria: 'Familia', clasificacion: 'variable' },

  // Finanzas / deuda
  { keywords: ['tarjeta', 'visa', 'mastercard', 'amex'], categoria: 'Finanzas', subcategoria: 'Tarjeta', clasificacion: 'deuda' },
  { keywords: ['prestamo', 'préstamo', 'cuota', 'deuda'], categoria: 'Finanzas', subcategoria: 'Préstamos', clasificacion: 'deuda' },
  { keywords: ['comision', 'comisión', 'interes', 'interés', 'mantenimiento de cuenta'], categoria: 'Finanzas', subcategoria: 'Comisiones', clasificacion: 'deuda' },

  // Entretenimiento
  { keywords: ['netflix', 'spotify', 'disney', 'hbo', 'suscripcion', 'suscripción', 'membresia', 'membresía'], categoria: 'Entretenimiento', subcategoria: 'Suscripciones', clasificacion: 'discrecional' },
  { keywords: ['juego', 'gaming', 'steam', 'playstation', 'xbox'], categoria: 'Entretenimiento', subcategoria: 'Juegos', clasificacion: 'discrecional' },
  { keywords: ['cine', 'teatro', 'recital', 'evento', 'entrada', 'boliche', 'salida'], categoria: 'Entretenimiento', subcategoria: 'Salidas', clasificacion: 'discrecional' },

  // Trabajo
  { keywords: ['herramienta', 'software', 'licencia', 'equipamiento', 'curso', 'capacitacion', 'capacitación'], categoria: 'Trabajo', clasificacion: 'variable' },
]

// Palabras clave de ingresos (spec §63-70).
const MAPA_INGRESOS: { keywords: string[]; categoria: string }[] = [
  { keywords: ['sueldo', 'salario', 'nomina', 'nómina'], categoria: 'Sueldo' },
  { keywords: ['freelance', 'proyecto', 'changa'], categoria: 'Freelance' },
  { keywords: ['empresa', 'facturacion', 'facturación'], categoria: 'Empresa' },
  { keywords: ['venta', 'vendi', 'vendí'], categoria: 'Ventas' },
  { keywords: ['inversion', 'inversión', 'dividendo', 'interes', 'renta'], categoria: 'Inversiones' },
  { keywords: ['transferencia', 'transfer', 'me pasaron', 'me mandaron'], categoria: 'Transferencias' },
]

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

function necesidadPorClasificacion(clasificacion: Clasificacion): Necesidad {
  if (clasificacion === 'discrecional') return 'no_seguro'
  if (clasificacion === 'extraordinario') return 'no_seguro'
  return 'necesario'
}

/**
 * Clasifica un gasto. Aplica reglas aprendidas del gestor primero,
 * luego heurística por keyword. Nunca lanza; ante la duda cae en "Otros/variable".
 */
export function clasificarGasto(descripcion: string, reglas: Regla[] = []): ResultadoClasificacion {
  const desc = normalizar(descripcion)

  // 1) Reglas aprendidas (spec §2, §96)
  for (const regla of reglas) {
    if (regla.patron && desc.includes(normalizar(regla.patron))) {
      const clasif = (regla.clasificacion as Clasificacion) || 'variable'
      return {
        categoria: regla.categoria || 'Otros',
        clasificacion: clasif,
        necesidad: (regla.necesidad as Necesidad) || necesidadPorClasificacion(clasif),
      }
    }
  }

  // 2) Heurística por keyword
  for (const entrada of MAPA) {
    if (entrada.keywords.some((k) => desc.includes(normalizar(k)))) {
      return {
        categoria: entrada.categoria,
        subcategoria: entrada.subcategoria,
        clasificacion: entrada.clasificacion,
        necesidad: necesidadPorClasificacion(entrada.clasificacion),
      }
    }
  }

  // 3) Fallback
  return { categoria: 'Otros', clasificacion: 'variable', necesidad: 'no_seguro' }
}

export function clasificarIngreso(descripcion: string): { categoria: string } {
  const desc = normalizar(descripcion)
  for (const entrada of MAPA_INGRESOS) {
    if (entrada.keywords.some((k) => desc.includes(normalizar(k)))) {
      return { categoria: entrada.categoria }
    }
  }
  return { categoria: 'Otros' }
}

// Categorías por defecto para sembrar al crear un gestor (spec §63-81).
export const CATEGORIAS_GASTO_DEFAULT: { nombre: string; clasificacion: Clasificacion; sub: string[] }[] = [
  { nombre: 'Vivienda', clasificacion: 'fijo', sub: ['Alquiler', 'Expensas', 'Servicios', 'Internet', 'Telefonía', 'Mantenimiento'] },
  { nombre: 'Transporte', clasificacion: 'variable', sub: ['Nafta', 'Uber', 'Transporte público', 'Reparaciones', 'Seguro', 'Patente'] },
  { nombre: 'Alimentación', clasificacion: 'variable', sub: ['Supermercado', 'Restaurante', 'Delivery', 'Comida', 'Salidas'] },
  { nombre: 'Compras', clasificacion: 'discrecional', sub: ['Ropa', 'Electrónica', 'Hogar', 'Accesorios'] },
  { nombre: 'Familia', clasificacion: 'variable', sub: ['Mamá', 'Papá', 'Hermanos', 'Ayuda familiar'] },
  { nombre: 'Finanzas', clasificacion: 'deuda', sub: ['Tarjeta', 'Préstamos', 'Deudas', 'Comisiones'] },
  { nombre: 'Entretenimiento', clasificacion: 'discrecional', sub: ['Salidas', 'Juegos', 'Suscripciones', 'Eventos'] },
  { nombre: 'Trabajo', clasificacion: 'variable', sub: ['Herramientas', 'Software', 'Equipamiento'] },
  { nombre: 'Otros', clasificacion: 'variable', sub: [] },
]

export const CATEGORIAS_INGRESO_DEFAULT = [
  'Sueldo',
  'Freelance',
  'Empresa',
  'Ventas',
  'Inversiones',
  'Transferencias',
  'Otros',
]
