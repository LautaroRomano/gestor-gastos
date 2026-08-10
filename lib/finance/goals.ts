// Objetivos financieros (spec §9, §262-273). Puro.

export interface ObjetivoInput {
  nombre: string
  montoObjetivo: number
  montoActual: number
  fechaObjetivo?: Date | string | null
}

export interface ObjetivoCalculo {
  nombre: string
  montoObjetivo: number
  montoActual: number
  faltante: number
  progreso: number // 0..1
  mesesRestantes: number | null
  ahorroMensualNecesario: number | null
}

const round = (n: number) => Math.round(n * 100) / 100

function mesesEntre(desde: Date, hasta: Date): number {
  const anios = hasta.getFullYear() - desde.getFullYear()
  const meses = hasta.getMonth() - desde.getMonth()
  let total = anios * 12 + meses
  // Meses de aporte disponibles: si el día objetivo excede el de hoy, hay un
  // mes parcial extra en el que aún se puede ahorrar → redondear hacia arriba.
  if (hasta.getDate() > desde.getDate()) total += 1
  return total
}

export function calcularObjetivo(obj: ObjetivoInput, hoy: Date = new Date()): ObjetivoCalculo {
  const faltante = round(Math.max(0, obj.montoObjetivo - obj.montoActual))
  const progreso = obj.montoObjetivo > 0 ? round(obj.montoActual / obj.montoObjetivo) : 0

  let mesesRestantes: number | null = null
  let ahorroMensualNecesario: number | null = null

  if (obj.fechaObjetivo) {
    const fecha = obj.fechaObjetivo instanceof Date ? obj.fechaObjetivo : new Date(obj.fechaObjetivo)
    mesesRestantes = Math.max(1, mesesEntre(hoy, fecha))
    ahorroMensualNecesario = round(faltante / mesesRestantes)
  }

  return {
    nombre: obj.nombre,
    montoObjetivo: round(obj.montoObjetivo),
    montoActual: round(obj.montoActual),
    faltante,
    progreso,
    mesesRestantes,
    ahorroMensualNecesario,
  }
}
