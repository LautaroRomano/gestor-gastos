'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Target } from 'lucide-react'

import Modal from '@/app/components/Modal'
import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { Field, fieldClass } from '@/components/mobile/field'
import { formatCurrency } from '@/lib/format-currency'

interface Calculo {
  faltante: number
  progreso: number
  mesesRestantes: number | null
  ahorroMensualNecesario: number | null
}
interface Objetivo {
  id: string
  nombre: string
  montoObjetivo: number
  montoActual: number
  fechaObjetivo: string | null
  calculo: Calculo
}

export default function ObjetivosPage() {
  const router = useRouter()
  const id = useParams().id as string
  const [items, setItems] = useState<Objetivo[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Objetivo | null>(null)
  const [form, setForm] = useState({ nombre: '', montoObjetivo: '', montoActual: '', fechaObjetivo: '' })

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    try {
      const res = await fetch(`/api/gestores/${id}/objetivos`)
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function abrirNuevo() {
    setEditing(null)
    setForm({ nombre: '', montoObjetivo: '', montoActual: '', fechaObjetivo: '' })
    setIsOpen(true)
  }
  function abrirEditar(o: Objetivo) {
    setEditing(o)
    setForm({
      nombre: o.nombre,
      montoObjetivo: o.montoObjetivo.toString(),
      montoActual: o.montoActual.toString(),
      fechaObjetivo: o.fechaObjetivo ? o.fechaObjetivo.slice(0, 10) : '',
    })
    setIsOpen(true)
  }

  async function guardar() {
    const body: Record<string, unknown> = {
      nombre: form.nombre,
      montoObjetivo: parseFloat(form.montoObjetivo),
      montoActual: parseFloat(form.montoActual || '0'),
    }
    if (form.fechaObjetivo) body.fechaObjetivo = new Date(form.fechaObjetivo).toISOString()
    const url = editing ? `/api/gestores/${id}/objetivos/${editing.id}` : `/api/gestores/${id}/objetivos`
    const res = await fetch(url, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      await load()
      setIsOpen(false)
    } else {
      alert((await res.json()).error || 'Error')
    }
  }

  async function eliminar(objId: string) {
    if (!confirm('¿Eliminar este objetivo?')) return
    const res = await fetch(`/api/gestores/${id}/objetivos/${objId}`, { method: 'DELETE' })
    if (res.ok) await load()
    else alert((await res.json()).error || 'Error')
  }

  if (loading) return <ScreenLoader />

  return (
    <Screen>
      <AppBar title="Objetivos" subtitle="Metas de ahorro" onBack={() => router.push(`/gestores/${id}`)} />
      <Content>
        {items.length === 0 ? (
          <EmptyState
            icon={<Target className="size-6" />}
            title="Sin objetivos"
            description="Definí una meta (ej. comprar una PC) y te decimos cuánto ahorrar por mes."
          />
        ) : (
          <div className="space-y-3">
            {items.map((o) => {
              const pct = Math.min(100, Math.round(o.calculo.progreso * 100))
              return (
                <div key={o.id} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-semibold">{o.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(o.montoActual)} de {formatCurrency(o.montoObjetivo)} · {pct}%
                      </p>
                    </div>
                    <button onClick={() => abrirEditar(o)} aria-label="Editar" className="tap grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => eliminar(o.id)} aria-label="Eliminar" className="tap grid size-8 place-items-center rounded-lg text-expense hover:bg-expense/10">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--hero-from)] to-[var(--hero-to)]"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  {o.calculo.ahorroMensualNecesario != null ? (
                    <p className="text-sm text-muted-foreground">
                      Faltan <span className="font-semibold text-foreground">{formatCurrency(o.calculo.faltante)}</span> · Ahorrá{' '}
                      <span className="font-semibold text-primary">{formatCurrency(o.calculo.ahorroMensualNecesario)}</span>/mes
                      {o.calculo.mesesRestantes ? ` (${o.calculo.mesesRestantes} meses)` : ''}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Faltan <span className="font-semibold text-foreground">{formatCurrency(o.calculo.faltante)}</span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Content>

      <BottomBar>
        <Button onClick={abrirNuevo} className="h-12 flex-1 rounded-2xl text-[15px]">
          <Plus className="size-5" />
          Nuevo objetivo
        </Button>
      </BottomBar>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Editar objetivo' : 'Nuevo objetivo'}
        footer={
          <>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button className="h-11 rounded-xl px-6" onClick={guardar}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <Field label="Nombre">
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Comprar PC" className={fieldClass} />
          </Field>
          <Field label="Monto objetivo">
            <input type="number" step="0.01" min="0" value={form.montoObjetivo} onChange={(e) => setForm({ ...form, montoObjetivo: e.target.value })} placeholder="0" className={fieldClass} />
          </Field>
          <Field label="Ahorrado hasta ahora">
            <input type="number" step="0.01" min="0" value={form.montoActual} onChange={(e) => setForm({ ...form, montoActual: e.target.value })} placeholder="0" className={fieldClass} />
          </Field>
          <Field label="Fecha objetivo" hint="Opcional. Con fecha, calculamos cuánto ahorrar por mes.">
            <input type="date" value={form.fechaObjetivo} onChange={(e) => setForm({ ...form, fechaObjetivo: e.target.value })} className={fieldClass} />
          </Field>
        </div>
      </Modal>
    </Screen>
  )
}
