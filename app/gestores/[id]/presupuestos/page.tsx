'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react'

import Modal from '@/app/components/Modal'
import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { Money } from '@/components/mobile/money'
import { Field, fieldClass } from '@/components/mobile/field'
import { CategoriaPicker, CategoriaIcon } from '@/components/mobile/categoria-picker'
import { categoriaCanonica } from '@/lib/finance/categorias'

interface Presupuesto {
  id: string
  categoria: string | null
  monto: number
  periodo: string
}
interface Consumo {
  presupuestoId: string
  consumo: number
}

export default function PresupuestosPage() {
  const router = useRouter()
  const id = useParams().id as string
  const [items, setItems] = useState<Presupuesto[]>([])
  const [consumos, setConsumos] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Presupuesto | null>(null)
  const [form, setForm] = useState({ categoria: '', monto: '' })

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    try {
      const [rp, ra] = await Promise.all([
        fetch(`/api/gestores/${id}/presupuestos`),
        fetch(`/api/gestores/${id}/analisis`),
      ])
      if (rp.ok) setItems(await rp.json())
      if (ra.ok) {
        const a = (await ra.json()) as { presupuestos?: Consumo[] }
        setConsumos(Object.fromEntries((a.presupuestos ?? []).map((p) => [p.presupuestoId, p.consumo])))
      }
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
    setForm({ categoria: categoriaCanonica(p.categoria) || '', monto: p.monto.toString() })
    setIsOpen(true)
  }

  async function guardar() {
    if (!form.categoria) return alert('Elegí una categoría')
    const monto = parseFloat(form.monto)
    if (!(monto > 0)) return alert('Poné un monto mayor a 0')
    const repetido = items.find(
      (p) => p.id !== editing?.id && categoriaCanonica(p.categoria) === form.categoria,
    )
    if (repetido) return alert(`Ya hay un tope para ${form.categoria}. Editalo en vez de crear otro.`)

    const url = editing
      ? `/api/gestores/${id}/presupuestos/${editing.id}`
      : `/api/gestores/${id}/presupuestos`
    const res = await fetch(url, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria: form.categoria, monto }),
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
    if (!confirm('¿Eliminar este tope?')) return
    const res = await fetch(`/api/gestores/${id}/presupuestos/${presId}`, { method: 'DELETE' })
    if (res.ok) await load()
    else alert((await res.json()).error || 'Error')
  }

  if (loading) return <ScreenLoader />

  return (
    <Screen>
      <AppBar title="Topes de gasto" subtitle="Máximo por categoría en el mes" onBack={() => router.push(`/gestores/${id}`)} />
      <Content>
        {items.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="size-6" />}
            title="Sin topes"
            description="Definí cuánto querés gastar como máximo por categoría cada mes."
          />
        ) : (
          <div className="space-y-3">
            {items.map((p, i) => {
              const usado = consumos[p.id] ?? 0
              const ratio = p.monto > 0 ? usado / p.monto : 0
              const restante = p.monto - usado
              const color = ratio >= 1 ? 'bg-expense' : ratio >= 0.8 ? 'bg-amber-500' : 'bg-income'
              return (
                <div key={p.id} className="rounded-2xl border border-border/70 bg-card p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <CategoriaIcon nombre={p.categoria} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.categoria || 'Sin categoría'}</p>
                      <p className="text-xs text-muted-foreground">
                        Tope <Money value={p.monto} className="font-semibold" /> por mes
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => abrirEditar(p)} aria-label="Editar" className="tap grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => eliminar(p.id)} aria-label="Eliminar" className="tap grid size-8 place-items-center rounded-lg text-expense hover:bg-expense/10">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: Math.min(Math.max(ratio, 0.02), 1) }}
                      transition={{ duration: 0.7, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: 'left' }}
                      className={`h-full rounded-full ${color}`}
                    />
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between text-xs">
                    <span className="text-muted-foreground">
                      Gastado <Money value={usado} className="font-semibold text-foreground" /> ({Math.round(ratio * 100)}%)
                    </span>
                    {restante >= 0 ? (
                      <span className="text-muted-foreground">
                        Quedan <Money value={restante} className="font-semibold text-income" />
                      </span>
                    ) : (
                      <span className="font-semibold text-expense">
                        Te pasaste <Money value={-restante} />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Content>

      <BottomBar>
        <Button onClick={abrirNuevo} className="h-12 flex-1 rounded-2xl text-[15px]">
          <Plus className="size-5" />
          Nuevo tope
        </Button>
      </BottomBar>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Editar tope' : 'Nuevo tope'}
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
            <CategoriaPicker value={form.categoria} onChange={(categoria) => setForm({ ...form, categoria })} />
          </Field>
          <Field label="Máximo por mes">
            <input
              type="number"
              inputMode="decimal"
              step="1000"
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
