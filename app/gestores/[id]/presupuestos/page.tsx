'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react'

import Modal from '@/app/components/Modal'
import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { Money } from '@/components/mobile/money'
import { Field, fieldClass } from '@/components/mobile/field'

interface Presupuesto {
  id: string
  categoria: string | null
  monto: number
  periodo: string
}
interface Categoria {
  id: string
  nombre: string
  tipo: string
}

export default function PresupuestosPage() {
  const router = useRouter()
  const id = useParams().id as string
  const [items, setItems] = useState<Presupuesto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Presupuesto | null>(null)
  const [form, setForm] = useState({ categoria: '', monto: '' })

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    try {
      const [rp, rc] = await Promise.all([
        fetch(`/api/gestores/${id}/presupuestos`),
        fetch(`/api/gestores/${id}/categorias`),
      ])
      if (rp.ok) setItems(await rp.json())
      if (rc.ok) setCategorias(await rc.json())
    } finally {
      setLoading(false)
    }
  }

  function abrirNuevo() {
    setEditing(null)
    setForm({ categoria: '', monto: '' })
    setIsOpen(true)
  }
  function abrirEditar(p: Presupuesto) {
    setEditing(p)
    setForm({ categoria: p.categoria || '', monto: p.monto.toString() })
    setIsOpen(true)
  }

  async function guardar() {
    const body = { categoria: form.categoria || undefined, monto: parseFloat(form.monto) }
    const url = editing
      ? `/api/gestores/${id}/presupuestos/${editing.id}`
      : `/api/gestores/${id}/presupuestos`
    const res = await fetch(url, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      await load()
      setIsOpen(false)
    } else {
      const d = await res.json()
      alert(d.error || 'Error')
    }
  }

  async function eliminar(presId: string) {
    if (!confirm('¿Eliminar este presupuesto?')) return
    const res = await fetch(`/api/gestores/${id}/presupuestos/${presId}`, { method: 'DELETE' })
    if (res.ok) await load()
    else alert((await res.json()).error || 'Error')
  }

  if (loading) return <ScreenLoader />

  const categoriasGasto = categorias.filter((c) => c.tipo === 'gasto')

  return (
    <Screen>
      <AppBar title="Presupuestos" subtitle="Límite mensual por categoría" onBack={() => router.push(`/gestores/${id}`)} />
      <Content>
        {items.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="size-6" />}
            title="Sin presupuestos"
            description="Definí cuánto querés gastar como máximo por categoría cada mes."
          />
        ) : (
          <div className="space-y-3">
            {items.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <PiggyBank className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.categoria || 'Sin categoría'}</p>
                  <p className="text-xs text-muted-foreground">por mes</p>
                </div>
                <Money value={p.monto} className="shrink-0 text-base font-bold" />
                <div className="flex shrink-0 flex-col gap-1">
                  <button onClick={() => abrirEditar(p)} aria-label="Editar" className="tap grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent">
                    <Pencil className="size-3.5" />
                  </button>
                  <button onClick={() => eliminar(p.id)} aria-label="Eliminar" className="tap grid size-8 place-items-center rounded-lg text-expense hover:bg-expense/10">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Content>

      <BottomBar>
        <Button onClick={abrirNuevo} className="h-12 flex-1 rounded-2xl text-[15px]">
          <Plus className="size-5" />
          Nuevo presupuesto
        </Button>
      </BottomBar>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
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
          <Field label="Categoría">
            <input
              list="categorias-gasto"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              placeholder="Ej. Alimentación"
              className={fieldClass}
            />
            <datalist id="categorias-gasto">
              {categoriasGasto.map((c) => (
                <option key={c.id} value={c.nombre} />
              ))}
            </datalist>
          </Field>
          <Field label="Monto mensual">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
              placeholder="0"
              className={fieldClass}
            />
          </Field>
        </div>
      </Modal>
    </Screen>
  )
}
