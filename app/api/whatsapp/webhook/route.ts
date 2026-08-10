import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { procesarMensaje } from '@/lib/whatsapp/handler'
import { enviarMensaje } from '@/lib/whatsapp/send'

// --- Verificación del webhook (Meta) — spec §10 ---
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// Valida la firma X-Hub-Signature-256 (HMAC con el App Secret) — spec §16.
function firmaValida(rawBody: string, signature: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    // Sin secreto configurado no podemos validar: rechazamos por seguridad.
    return false
  }
  if (!signature) return false
  const esperado = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(esperado))
  } catch {
    return false
  }
}

interface WAMessage {
  from: string
  id: string
  type: string
  text?: { body: string }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    if (!firmaValida(rawBody, signature)) {
      return new NextResponse('Invalid signature', { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const mensajes: WAMessage[] =
      payload?.entry?.flatMap(
        (e: any) => e?.changes?.flatMap((c: any) => c?.value?.messages ?? []) ?? [],
      ) ?? []

    for (const msg of mensajes) {
      if (msg.type !== 'text' || !msg.text?.body) continue

      // Rate limiting por número (spec §16)
      if (!rateLimit(`wa:${msg.from}`, 20, 60_000)) {
        await enviarMensaje(msg.from, 'Estás enviando mensajes muy rápido. Probá de nuevo en un momento. 🙏')
        continue
      }

      // Idempotencia: si ya procesamos este message id, lo ignoramos (spec §16, §594)
      const yaExiste = await prisma.mensajeWhatsApp.findUnique({ where: { externalId: msg.id } })
      if (yaExiste) continue
      await prisma.mensajeWhatsApp.create({
        data: { externalId: msg.id, phoneNumber: msg.from, procesado: false, payload: rawBody.slice(0, 4000) },
      })

      const respuesta = await procesarMensaje(msg.from, msg.text.body)
      await enviarMensaje(msg.from, respuesta)
      await prisma.mensajeWhatsApp.update({ where: { externalId: msg.id }, data: { procesado: true } })
    }

    // Meta espera 200 rápido para no reintentar.
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[whatsapp webhook] error:', error)
    // Devolvemos 200 igual para que Meta no reintente en loop ante un payload raro.
    return NextResponse.json({ ok: true })
  }
}
