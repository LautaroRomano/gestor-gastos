'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Trash2, MessageCircle, Phone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { Field, fieldClass } from '@/components/mobile/field'

interface Conexion {
  id: string
  phoneNumber: string
  activo: boolean
}

export default function WhatsAppPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [conexiones, setConexiones] = useState<Conexion[]>([])
  const [loading, setLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      const res = await fetch(`/api/gestores/${id}/whatsapp`)
      if (res.ok) setConexiones(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function vincular() {
    if (!phoneNumber.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/gestores/${id}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      })
      if (res.ok) {
        setPhoneNumber('')
        await loadData()
      } else {
        const d = await res.json()
        alert(d.error || 'Error')
      }
    } catch {
      alert('Error al vincular')
    } finally {
      setSaving(false)
    }
  }

  async function desvincular(numero: string) {
    if (!confirm('¿Desvincular este número?')) return
    try {
      const res = await fetch(`/api/gestores/${id}/whatsapp?phoneNumber=${encodeURIComponent(numero)}`, {
        method: 'DELETE',
      })
      if (res.ok) await loadData()
      else {
        const d = await res.json()
        alert(d.error || 'Error')
      }
    } catch {
      alert('Error al desvincular')
    }
  }

  if (loading) return <ScreenLoader />

  return (
    <Screen>
      <AppBar title="WhatsApp" onBack={() => router.push(`/gestores/${id}`)} />

      <Content>
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
              <MessageCircle className="size-[18px]" />
            </span>
            <h2 className="font-display text-base font-semibold">Registrá gastos por WhatsApp</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Una vez vinculado tu número, vas a poder registrar gastos escribiéndole al bot de WhatsApp
            (por ej. <span className="font-medium text-foreground">“Gasté 15000 en supermercado”</span>) y
            hacer consultas como <span className="font-medium text-foreground">“¿Cuánto gasté este mes?”</span>.
            Requiere que el administrador configure las credenciales de WhatsApp Cloud API.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="px-1 font-display text-base font-semibold">Vincular número</h2>
          <Field label="Número de teléfono" hint="Con código de país, ej: +5493815551234">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+54..."
              className={fieldClass}
            />
          </Field>
          <Button onClick={vincular} disabled={saving} className="h-11 w-full rounded-xl">
            <Phone className="size-4" />
            {saving ? 'Vinculando…' : 'Vincular número'}
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="px-1 font-display text-base font-semibold">Números vinculados</h2>
          {conexiones.length === 0 ? (
            <EmptyState
              icon={<Phone className="size-6" />}
              title="Sin números"
              description="Todavía no vinculaste ningún número a este gestor."
            />
          ) : (
            <div className="space-y-3">
              {conexiones.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <Phone className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.phoneNumber}</p>
                    <p className="text-xs text-muted-foreground">{c.activo ? 'Activo' : 'Inactivo'}</p>
                  </div>
                  <button
                    onClick={() => desvincular(c.phoneNumber)}
                    aria-label="Desvincular"
                    className="tap grid size-8 place-items-center rounded-lg text-expense hover:bg-expense/10"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Content>
    </Screen>
  )
}
