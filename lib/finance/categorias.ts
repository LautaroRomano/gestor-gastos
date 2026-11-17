// Lista única y corta de categorías de gasto. Es la fuente de verdad para
// los selectores, el clasificador automático, la IA y los presupuestos.
// Puro: sin dependencias de React ni de la DB.

import type { Clasificacion } from './classify'

export interface CategoriaGasto {
  /** Nombre que se guarda en Gasto.categoria / Presupuesto.categoria. */
  nombre: string
  /** Pista corta para saber qué va acá. */
  ejemplos: string
  /** Clave de ícono (se resuelve en el cliente). */
  icono:
    | 'home'
    | 'zap'
    | 'cart'
    | 'utensils'
    | 'bag'
    | 'car'
    | 'heart'
    | 'gift'
    | 'coins'
    | 'dots'
  clasificacion: Clasificacion
}

export const CATEGORIAS_GASTO: CategoriaGasto[] = [
  { nombre: 'Vivienda', ejemplos: 'Alquiler, expensas, arreglos de la casa', icono: 'home', clasificacion: 'fijo' },
  { nombre: 'Servicios', ejemplos: 'Luz, gas, internet, celular, streaming', icono: 'zap', clasificacion: 'fijo' },
  { nombre: 'Supermercado', ejemplos: 'Comida para casa, verdulería, carnicería', icono: 'cart', clasificacion: 'variable' },
  { nombre: 'Salidas y comida afuera', ejemplos: 'Restaurantes, delivery, bares, helado, kiosco', icono: 'utensils', clasificacion: 'discrecional' },
  { nombre: 'Compras', ejemplos: 'Ropa, Mercado Libre, electrónica, cosas para la casa', icono: 'bag', clasificacion: 'discrecional' },
  { nombre: 'Auto y transporte', ejemplos: 'Nafta, cochera, seguro, VTV, Uber, colectivo', icono: 'car', clasificacion: 'variable' },
  { nombre: 'Salud', ejemplos: 'Prepaga, farmacia, médicos', icono: 'heart', clasificacion: 'fijo' },
  { nombre: 'Familia y regalos', ejemplos: 'Ayuda a la familia, regalos, cumpleaños', icono: 'gift', clasificacion: 'variable' },
  { nombre: 'Préstamos y deudas', ejemplos: 'Plata prestada, tarjeta, cuotas', icono: 'coins', clasificacion: 'deuda' },
  { nombre: 'Otros', ejemplos: 'Cigarrillos, viajes, lo que no entra en ninguna', icono: 'dots', clasificacion: 'variable' },
]

export const NOMBRES_CATEGORIAS_GASTO = CATEGORIAS_GASTO.map((c) => c.nombre)

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// Nombres viejos (categorías y subcategorías sembradas, o texto libre que se
// cargó antes) -> categoría nueva. Clave normalizada.
const LEGADO: Record<string, string> = {
  vivienda: 'Vivienda',
  alquiler: 'Vivienda',
  expensas: 'Vivienda',
  mantenimiento: 'Vivienda',
  hogar: 'Compras',

  servicios: 'Servicios',
  internet: 'Servicios',
  telefonia: 'Servicios',
  suscripciones: 'Servicios',

  supermercado: 'Supermercado',
  alimentacion: 'Supermercado',
  comida: 'Supermercado',
  'alimentos y bebidas': 'Supermercado',

  salidas: 'Salidas y comida afuera',
  restaurante: 'Salidas y comida afuera',
  delivery: 'Salidas y comida afuera',
  golosinas: 'Salidas y comida afuera',
  entretenimiento: 'Salidas y comida afuera',
  eventos: 'Salidas y comida afuera',
  juegos: 'Salidas y comida afuera',

  compras: 'Compras',
  ropa: 'Compras',
  electronica: 'Compras',
  tecnologia: 'Compras',
  accesorios: 'Compras',
  equipamiento: 'Compras',
  herramientas: 'Compras',
  software: 'Servicios',
  trabajo: 'Compras',
  deportes: 'Compras',

  transporte: 'Auto y transporte',
  auto: 'Auto y transporte',
  nafta: 'Auto y transporte',
  uber: 'Auto y transporte',
  'transporte publico': 'Auto y transporte',
  reparaciones: 'Auto y transporte',
  seguro: 'Auto y transporte',
  patente: 'Auto y transporte',

  salud: 'Salud',

  familia: 'Familia y regalos',
  'ayuda familiar': 'Familia y regalos',
  mama: 'Familia y regalos',
  papa: 'Familia y regalos',
  hermanos: 'Familia y regalos',
  regalos: 'Familia y regalos',
  'deuda y regalos': 'Familia y regalos',

  finanzas: 'Préstamos y deudas',
  prestamos: 'Préstamos y deudas',
  deudas: 'Préstamos y deudas',
  tarjeta: 'Préstamos y deudas',
  comisiones: 'Préstamos y deudas',

  otros: 'Otros',
}

/** Si el nombre ya es (o equivale a) una categoría de la lista, la devuelve; si no, null. */
export function categoriaCanonica(nombre: string | null | undefined): string | null {
  if (!nombre) return null
  const n = norm(nombre)
  const exacta = CATEGORIAS_GASTO.find((c) => norm(c.nombre) === n)
  if (exacta) return exacta.nombre
  return LEGADO[n] ?? null
}

export function getCategoriaGasto(nombre: string | null | undefined): CategoriaGasto | undefined {
  const canon = categoriaCanonica(nombre)
  return CATEGORIAS_GASTO.find((c) => c.nombre === canon)
}
