// Envío de mensajes por WhatsApp Cloud API (Graph API). Requiere
// WHATSAPP_TOKEN + WHATSAPP_PHONE_ID (spec §10).

const GRAPH_VERSION = 'v21.0'

export function whatsappConfigurado(): boolean {
  return !!process.env.WHATSAPP_TOKEN && !!process.env.WHATSAPP_PHONE_ID
}

export async function enviarMensaje(to: string, texto: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) {
    console.warn('[whatsapp] no configurado; mensaje no enviado a', to)
    return
  }
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: texto },
      }),
    })
    if (!res.ok) {
      console.error('[whatsapp] error al enviar:', res.status, await res.text())
    }
  } catch (error) {
    console.error('[whatsapp] excepción al enviar:', error)
  }
}
