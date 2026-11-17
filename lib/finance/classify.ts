// Clasificación inteligente de movimientos (spec §2, §72-94).
// Puro y sin dependencias: primero aplica reglas aprendidas del gestor,
// luego heurística por palabras clave.

import { CATEGORIAS_GASTO, categoriaCanonica } from './categorias'

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

// Mapa keyword -> categoría/clasificación. Usa SOLO las categorías de
// ./categorias. El orden importa: gana la primera coincidencia (por eso
// "mercado libre" va antes que "mercado" y "gaseosa" antes que "gas").
const MAPA: Entrada[] = [
  // Préstamos y deudas
  { keywords: ['prestamo', 'préstamo', 'preste', 'presté', 'le debo', 'deuda'], categoria: 'Préstamos y deudas', subcategoria: 'Préstamos', clasificacion: 'deuda' },
  { keywords: ['tarjeta', 'visa', 'mastercard', 'amex', 'resumen'], categoria: 'Préstamos y deudas', subcategoria: 'Tarjeta', clasificacion: 'deuda' },
  { keywords: ['comision', 'comisión', 'interes', 'interés', 'mantenimiento de cuenta'], categoria: 'Préstamos y deudas', subcategoria: 'Comisiones', clasificacion: 'deuda' },

  // Compras (antes que Supermercado por "mercado libre")
  { keywords: ['mercado libre', 'mercadolibre', 'shein', 'temu', 'amazon'], categoria: 'Compras', subcategoria: 'Online', clasificacion: 'discrecional' },
  { keywords: ['ropa', 'zapatilla', 'zapato', 'remera', 'pantalon', 'pantalón', 'campera', 'vestido', 'botines'], categoria: 'Compras', subcategoria: 'Ropa', clasificacion: 'discrecional' },
  { keywords: ['electronic', 'electrónic', 'notebook', 'auricular', 'monitor', 'teclado', 'mouse', 'tablet', ' pc '], categoria: 'Compras', subcategoria: 'Electrónica', clasificacion: 'discrecional' },
  { keywords: ['mueble', 'escritorio', 'silla', 'deco', 'pintura', 'ferreteria', 'ferretería', 'bazar'], categoria: 'Compras', subcategoria: 'Hogar', clasificacion: 'discrecional' },
  { keywords: ['accesorio', 'reloj', 'lente', 'perfume'], categoria: 'Compras', subcategoria: 'Accesorios', clasificacion: 'discrecional' },

  // Vivienda
  { keywords: ['alquiler'], categoria: 'Vivienda', subcategoria: 'Alquiler', clasificacion: 'fijo' },
  { keywords: ['expensa'], categoria: 'Vivienda', subcategoria: 'Expensas', clasificacion: 'fijo' },
  { keywords: ['plomero', 'electricista', 'gasista', 'arreglo casa', 'arreglo de la casa'], categoria: 'Vivienda', subcategoria: 'Mantenimiento', clasificacion: 'variable' },

  // Salidas y comida afuera (antes que Servicios por "gaseosa", que contiene "gas")
  { keywords: ['delivery', 'pedidosya', 'rappi', 'mcdonald', 'burger', 'pizza', 'empanada', 'hamburguesa', 'sandwich', 'sanguche', 'lomito'], categoria: 'Salidas y comida afuera', subcategoria: 'Comida afuera', clasificacion: 'discrecional' },
  { keywords: ['restaurant', 'resto', 'parrilla', 'cerveza', 'birra', 'vino', 'fernet', 'trago'], categoria: 'Salidas y comida afuera', subcategoria: 'Bares y restaurantes', clasificacion: 'discrecional' },
  { keywords: ['helado', 'grido', 'cafe', 'café', 'kiosco', 'kiosko', 'gaseosa', 'coca', 'golosina', 'alfajor', 'facturas', 'papas'], categoria: 'Salidas y comida afuera', subcategoria: 'Kiosco y café', clasificacion: 'discrecional' },

  // Servicios
  { keywords: ['internet', 'wifi', 'fibra'], categoria: 'Servicios', subcategoria: 'Internet', clasificacion: 'fijo' },
  { keywords: ['abono', 'telefon', 'celular', 'movil', 'móvil', 'movistar'], categoria: 'Servicios', subcategoria: 'Telefonía', clasificacion: 'fijo' },
  { keywords: ['edet', 'luz', 'electricidad', ' gas ', 'agua', 'purificador'], categoria: 'Servicios', subcategoria: 'Luz, gas y agua', clasificacion: 'fijo' },
  { keywords: ['netflix', 'spotify', 'disney', 'hbo', 'flow', 'youtube', 'suscripcion', 'suscripción', 'membresia', 'membresía'], categoria: 'Servicios', subcategoria: 'Suscripciones', clasificacion: 'discrecional' },

  // Salud
  { keywords: ['prepaga', 'sancor', 'osde', 'obra social', 'farmacia', 'medico', 'médico', 'dentista', 'remedio', 'psicolog'], categoria: 'Salud', clasificacion: 'fijo' },

  // Auto y transporte
  { keywords: ['nafta', 'combustible', 'gasolina', 'ypf', 'shell', 'axion'], categoria: 'Auto y transporte', subcategoria: 'Nafta', clasificacion: 'variable' },
  { keywords: ['uber', 'cabify', 'didi', 'taxi', 'remis'], categoria: 'Auto y transporte', subcategoria: 'Uber', clasificacion: 'variable' },
  { keywords: ['colectivo', 'sube', 'subte', 'tren', 'boleto'], categoria: 'Auto y transporte', subcategoria: 'Transporte público', clasificacion: 'variable' },
  { keywords: ['cochera', 'estacionamiento', 'seguro', 'patente', 'vtv', 'peaje'], categoria: 'Auto y transporte', subcategoria: 'Auto', clasificacion: 'fijo' },
  { keywords: [' auto ', 'taller', 'mecanico', 'mecánico', 'repuesto', 'gomeria', 'gomería'], categoria: 'Auto y transporte', subcategoria: 'Arreglos', clasificacion: 'extraordinario' },

  // Salidas (después de transporte: "uber cancha" es Uber)
  { keywords: ['cine', 'teatro', 'recital', 'evento', 'entrada', 'boliche', 'salida', 'futbol', 'fútbol', 'cancha', 'pelota', 'padel', 'pádel', 'juego', 'steam', 'playstation'], categoria: 'Salidas y comida afuera', subcategoria: 'Salidas', clasificacion: 'discrecional' },

  // Supermercado
  { keywords: [' super', 'almacen', 'almacén', 'verduleria', 'verdulería', 'carniceria', 'carnicería', 'mercado', 'pollo', ' pan ', 'carne', 'comida', 'chino'], categoria: 'Supermercado', clasificacion: 'variable' },

  // Familia y regalos
  { keywords: ['regalo', 'mama', 'mamá', 'papa', 'papá', 'hermano', 'hermana', 'familia', 'abuela', 'abuelo'], categoria: 'Familia y regalos', clasificacion: 'variable' },

  // Otros, con subcategoría útil
  { keywords: ['cigarr', 'ciarr', 'puchos', 'tabaco'], categoria: 'Otros', subcategoria: 'Cigarrillos', clasificacion: 'variable' },
  { keywords: ['viaje', 'pasaje', 'hotel', 'hostel'], categoria: 'Otros', subcategoria: 'Viajes', clasificacion: 'extraordinario' },
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

/** Normaliza un keyword conservando los espacios de borde que marcan palabra completa. */
function prepararKeyword(k: string): string {
  const inicio = k.startsWith(' ') ? ' ' : ''
  const fin = k.endsWith(' ') ? ' ' : ''
  return inicio + normalizar(k).replace(/[^a-z0-9]+/g, ' ').trim() + fin
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
        categoria: categoriaCanonica(regla.categoria) || 'Otros',
        clasificacion: clasif,
        necesidad: (regla.necesidad as Necesidad) || necesidadPorClasificacion(clasif),
      }
    }
  }

  // 2) Heurística por keyword. La descripción se compara con los signos
  // pasados a espacios y espacios en los bordes: un keyword con espacio
  // (' gas ') exige palabra completa y no matchea "gastos".
  const descPalabras = ` ${desc.replace(/[^a-z0-9]+/g, ' ').trim()} `
  for (const entrada of MAPA) {
    if (entrada.keywords.some((k) => descPalabras.includes(prepararKeyword(k)))) {
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

// Categorías por defecto para sembrar al crear un gestor: la lista corta y plana.
export const CATEGORIAS_GASTO_DEFAULT: { nombre: string; clasificacion: Clasificacion; sub: string[] }[] =
  CATEGORIAS_GASTO.map((c) => ({ nombre: c.nombre, clasificacion: c.clasificacion, sub: [] }))

export const CATEGORIAS_INGRESO_DEFAULT = [
  'Sueldo',
  'Freelance',
  'Empresa',
  'Ventas',
  'Inversiones',
  'Transferencias',
  'Otros',
]

/**
 * Lleva cualquier categoría que llegue (formulario, WhatsApp, IA, nombres
 * viejos) a una de la lista corta. Si no se reconoce, se clasifica por la
 * descripción.
 */
export function resolverCategoriaGasto(
  categoria: string | null | undefined,
  descripcion: string,
  reglas: Regla[] = [],
): string {
  return categoriaCanonica(categoria) ?? clasificarGasto(descripcion, reglas).categoria
}
