// Procesamiento de mensajes de WhatsApp: interpreta lenguaje natural con IA,
// aplica la intención (alta o consulta) sobre datos reales del usuario (spec §10-13).
import { prisma } from '../prisma'
import { formatCurrency } from '../format-currency'
import { clasificarGasto } from '../finance/classify'
import { getMesActivo, analizarMes, buildMesInput } from '../finance/service'
import { computeMetrics } from '../finance/metrics'
import { aiDisponible, parseMensaje, responderConsulta, type ParseResultado } from '../ai/openai'

const CONFIANZA_MINIMA = 0.85

type Conexion = { id: string; usuarioId: string; gestorId: string; phoneNumber: string; pendiente: string | null }

const AYUDA =
  '🤖 *Asistente financiero*\n\n' +
  'Registrá movimientos escribiendo, por ejemplo:\n' +
  '• "Gasté 15000 en supermercado"\n' +
  '• "Cobré 1700000 de sueldo"\n' +
  '• "Ayer pagué 150 mil de la tarjeta"\n\n' +
  'O consultá:\n' +
  '• "¿Cuánto gasté este mes?"\n' +
  '• "¿En qué gasté más?"\n' +
  '• "¿Cuánto me queda?"\n' +
  '• "¿Cuánto debería ahorrar?"'

function inicioDeMes(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Obtiene el mes activo del gestor; si no hay ninguno abierto, crea uno. */
async function asegurarMes(gestorId: string): Promise<string> {
  const activo = await getMesActivo(gestorId)
  if (activo && !activo.cerrado) return activo.id
  const mes = await prisma.mes.create({ data: { gestorId, fechaInicio: inicioDeMes() } })
  return mes.id
}

async function balanceDelMes(gestorId: string): Promise<{ ingresos: number; gastos: number; balance: number }> {
  const mesId = await asegurarMes(gestorId)
  const input = await buildMesInput(mesId)
  const m = computeMetrics(input!)
  return { ingresos: m.totalIncome, gastos: m.totalExpenses, balance: m.balance }
}

async function registrarDesdeParse(conexion: Conexion, p: ParseResultado): Promise<string> {
  const mesId = await asegurarMes(conexion.gestorId)
  const fecha = p.date ? new Date(`${p.date}T12:00:00`) : new Date()

  if (p.type === 'income') {
    await prisma.ingreso.create({
      data: {
        mesId,
        monto: p.amount!,
        moneda: p.currency || 'ARS',
        descripcion: p.description || 'Ingreso',
        categoria: p.category,
        recurrente: false,
        source: 'whatsapp',
        fecha,
      },
    })
    const bal = await balanceDelMes(conexion.gestorId)
    return (
      `✅ Ingreso registrado\n\n${p.description || 'Ingreso'}\n+${formatCurrency(p.amount!)}\n\n` +
      `Ingresos del mes: ${formatCurrency(bal.ingresos)}`
    )
  }

  // gasto
  const reglas = await prisma.reglaClasificacion.findMany({ where: { gestorId: conexion.gestorId } })
  const auto = clasificarGasto(p.description || '', reglas)
  const categoria = p.category || auto.categoria
  const clasificacion = (p.expenseType as string) || auto.clasificacion
  await prisma.gasto.create({
    data: {
      mesId,
      monto: p.amount!,
      moneda: p.currency || 'ARS',
      descripcion: p.description || 'Gasto',
      categoria,
      subcategoria: p.subcategory || auto.subcategoria,
      clasificacion,
      necesidad: auto.necesidad,
      source: 'whatsapp',
      fecha,
    },
  })
  const bal = await balanceDelMes(conexion.gestorId)
  return (
    `✅ Gasto registrado\n\n${p.description || 'Gasto'}\n${formatCurrency(p.amount!)}\n\n` +
    `Categoría: ${categoria}\nTipo: ${clasificacion}\n\nBalance del mes: ${formatCurrency(bal.balance)}`
  )
}

async function responderQuery(conexion: Conexion, p: ParseResultado, texto: string): Promise<string> {
  const mesId = await asegurarMes(conexion.gestorId)
  const analisis = await analizarMes(mesId, conexion.gestorId)
  if (!analisis) return 'Todavía no tenés movimientos este mes.'

  const m = analisis.metrics
  const contexto = {
    ingresos: m.totalIncome,
    gastos: m.totalExpenses,
    balance: m.balance,
    disponible: m.dineroDisponible,
    ahorroReal: m.ahorroReal,
    gastoDiarioRecomendado: m.gastoDiarioRecomendado,
    topCategorias: m.topCategories.slice(0, 5),
    topGastos: m.topTransactions.slice(0, 3),
    prescindiblesTotal: analisis.prescindibles.total,
    recomendacionAhorro: analisis.recomendacion.ahorroRecomendado,
    diasRestantes: m.diasRestantes,
  }

  // Con IA: respuesta en lenguaje natural sobre datos reales.
  if (aiDisponible()) {
    return responderConsulta(p.query || texto, contexto)
  }

  // Fallback sin IA: respuestas determinísticas para las consultas más comunes.
  switch (p.intent) {
    case 'query_balance':
    case 'query_expenses':
      return `Este mes gastaste ${formatCurrency(m.totalExpenses)} sobre ingresos de ${formatCurrency(m.totalIncome)}. Balance: ${formatCurrency(m.balance)}.`
    case 'query_savings':
      return `Ahorro real del mes: ${formatCurrency(m.ahorroReal)}. Recomendado: ${formatCurrency(analisis.recomendacion.ahorroRecomendado)}.`
    case 'query_category': {
      const top = m.topCategories[0]
      return top ? `Donde más gastaste fue ${top.categoria}: ${formatCurrency(top.total)}.` : 'Sin datos de categorías.'
    }
    default:
      return `Ingresos ${formatCurrency(m.totalIncome)} · Gastos ${formatCurrency(m.totalExpenses)} · Disponible ${formatCurrency(m.dineroDisponible)}.`
  }
}

/**
 * Procesa un mensaje entrante y devuelve el texto de respuesta.
 * La idempotencia se maneja antes de llamar a esta función (en el webhook).
 */
export async function procesarMensaje(phone: string, texto: string): Promise<string> {
  const conexion = await prisma.conexionWhatsApp.findUnique({ where: { phoneNumber: phone } })
  if (!conexion || !conexion.activo) {
    return (
      '👋 Tu número todavía no está vinculado a una cuenta.\n\n' +
      'Entrá a la app → tu gestor → sección WhatsApp y vinculá este número para empezar a registrar gastos por acá.'
    )
  }

  const limpio = texto.trim()

  // Confirmación pendiente (baja confianza) — spec §350, §413
  if (conexion.pendiente) {
    const afirmativo = /^(s[ií]|dale|ok|confirmo|correcto|👍)/i.test(limpio)
    const negativo = /^(no|cancelar|❌)/i.test(limpio)
    if (afirmativo || negativo) {
      const pendiente: ParseResultado = JSON.parse(conexion.pendiente)
      await prisma.conexionWhatsApp.update({ where: { id: conexion.id }, data: { pendiente: null } })
      if (negativo) return 'Listo, no registré nada. 👍'
      return registrarDesdeParse(conexion, pendiente)
    }
    // Si no responde sí/no, limpiamos el pendiente y seguimos con el mensaje nuevo.
    await prisma.conexionWhatsApp.update({ where: { id: conexion.id }, data: { pendiente: null } })
  }

  if (!aiDisponible()) {
    return 'El asistente con IA no está configurado todavía. Pedile al administrador que configure OPENAI_API_KEY.'
  }

  const p = await parseMensaje(limpio, new Date().toISOString().slice(0, 10))

  if (p.intent === 'help') return AYUDA

  if (p.intent.startsWith('query_')) {
    return responderQuery(conexion, p, limpio)
  }

  if (p.intent === 'create_expense' || p.intent === 'create_income') {
    // Datos faltantes → preguntar (spec §348)
    if (!p.amount || (p.missing && p.missing.length > 0)) {
      const faltan = !p.amount ? 'el monto' : (p.missing || []).join(', ')
      return `Me falta ${faltan} para registrarlo. ¿Me lo pasás?`
    }
    // Baja confianza → pedir confirmación (spec §413)
    if (p.confidence < CONFIANZA_MINIMA) {
      await prisma.conexionWhatsApp.update({ where: { id: conexion.id }, data: { pendiente: JSON.stringify(p) } })
      const tipo = p.type === 'income' ? 'ingreso' : 'gasto'
      return `¿Registro un ${tipo} de ${formatCurrency(p.amount)} (${p.description || 'sin descripción'})? Respondé *sí* o *no*.`
    }
    return registrarDesdeParse(conexion, p)
  }

  return AYUDA
}
