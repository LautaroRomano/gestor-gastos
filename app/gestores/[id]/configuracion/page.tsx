'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Copy, Check, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, ScreenLoader } from '@/components/mobile/shell'
import { Field, fieldClass } from '@/components/mobile/field'

interface Miembro {
  usuario: { id: string; nombre: string; email: string }
  rol: string
}

interface Gestor {
  id: string
  nombre: string
  descripcion?: string | null
  moneda?: string | null
  usuarios: Miembro[]
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [gestor, setGestor] = useState<Gestor | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nombre: '', descripcion: '', moneda: '' })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      const res = await fetch(`/api/gestores/${id}`)
      if (res.ok) {
        const data: Gestor = await res.json()
        setGestor(data)
        setForm({ nombre: data.nombre, descripcion: data.descripcion || '', moneda: data.moneda || 'ARS' })
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function guardar() {
    setSaving(true)
    try {
      const res = await fetch(`/api/gestores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) await loadData()
      else {
        const d = await res.json()
        alert(d.error || 'Error')
      }
    } catch {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function copiarId() {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = id
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return <ScreenLoader />
  if (!gestor) return null

  return (
    <Screen>
      <AppBar title="Configuración" subtitle={gestor.nombre} onBack={() => router.push(`/gestores/${id}`)} />

      <Content>
        {/* Datos del gestor */}
        <section className="space-y-3">
          <h2 className="px-1 font-display text-base font-semibold">Datos del gestor</h2>
          <Field label="Nombre">
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={fieldClass}
            />
          </Field>
          <Field label="Descripción">
            <input
              type="text"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className={fieldClass}
            />
          </Field>
          <Field label="Moneda" hint="Ej. ARS, USD">
            <input
              type="text"
              value={form.moneda}
              onChange={(e) => setForm({ ...form, moneda: e.target.value })}
              className={fieldClass}
            />
          </Field>
          <Button onClick={guardar} disabled={saving} className="h-11 w-full rounded-xl">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </section>

        {/* ID para invitar */}
        <section className="space-y-3">
          <h2 className="px-1 font-display text-base font-semibold">ID para invitar</h2>
          <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card p-3">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/80">{id}</code>
            <button
              onClick={copiarId}
              className="tap inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-semibold text-accent-foreground"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </section>

        {/* Miembros */}
        <section className="space-y-3">
          <h2 className="px-1 font-display text-base font-semibold">Miembros ({gestor.usuarios.length})</h2>
          <div className="space-y-3">
            {gestor.usuarios.map((m) => (
              <div key={m.usuario.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.usuario.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.usuario.email}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium capitalize text-muted-foreground">
                  {m.rol}
                </span>
              </div>
            ))}
          </div>
        </section>
      </Content>
    </Screen>
  )
}
