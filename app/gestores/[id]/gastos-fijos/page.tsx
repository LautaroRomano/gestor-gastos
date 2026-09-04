'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Repeat } from 'lucide-react'

import Modal from '@/app/components/Modal'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { Field, fieldClass } from '@/components/mobile/field'
import { Money } from '@/components/mobile/money'
import { formatCurrency } from '@/lib/format-currency'

interface GastoFijo {
  id: string
  monto: number
  descripcion: string
  categoria: string | null
  activo: boolean
}

interface Categoria {
  id: string
  nombre: string
  tipo: string
  parentId?: string | null
}

const emptyForm = { monto: '', descripcion: '', categoria: '', activo: true }

export default function GastosFijosPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [fijos, setFijos] = useState<GastoFijo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<GastoFijo | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    try {
      const [f, c] = await Promise.all([
        fetch(`/api/gestores/${id}/gastos-fijos`).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/gestores/${id}/categorias`).then((r) => (r.ok ? r.json() : [])),
      ])
      setFijos(f)
      setCategorias(c)
    } finally {
      setLoading(false)
    }
  }

  function abrirNuevo() {
    setEditing(null)
    setForm(emptyForm)
    setIsOpen(true)
  }

  function abrirEditar(gf: GastoFijo) {
    setEditing(gf)
    setForm({
      monto: String(gf.monto),
      descripcion: gf.descripcion,
      categoria: gf.categoria || '',
      activo: gf.activo,
    })
    setIsOpen(true)
  }

  async function guardar() {
    const monto = parseFloat(form.monto)
    if (!form.descripcion.trim()) return alert('Poné una descripción.')
    if (!monto || monto <= 0) return alert('El monto tiene que ser mayor a cero.')

    const body = {
      monto,
      descripcion: form.descripcion.trim(),
      categoria: form.categoria || undefined,
      activo: form.activo,
    }
    const res = await fetch(
      editing ? `/api/gastos-fijos/${editing.id}` : `/api/gestores/${id}/gastos-fijos`,
      {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    if (res.ok) {
      await load()
      setIsOpen(false)
    } else {
      const d = await res.json()
      alert(d.error || 'Error al guardar')
    }
  }

  /** Activar/pausar sin abrir el modal: es la acción más frecuente. */
  async function toggleActivo(gf: GastoFijo, activo: boolean) {
    const previo = fijos
    setFijos(fijos.map((f) => (f.id === gf.id ? { ...f, activo } : f)))
    const res = await fetch(`/api/gastos-fijos/${gf.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo }),
    })
    if (!res.ok) {
      setFijos(previo)
      alert('No se pudo actualizar')
    }
  }

  async function eliminar(gfId: string) {
    if (!confirm('¿Eliminar esta plantilla? Los gastos ya generados en los meses no se borran.'))
      return
    const res = await fetch(`/api/gastos-fijos/${gfId}`, { method: 'DELETE' })
    if (res.ok) await load()
    else alert('No se pudo eliminar')
  }

  if (loading) return <ScreenLoader />

  const activos = fijos.filter((f) => f.activo)
  const totalActivos = activos.reduce((s, f) => s + f.monto, 0)
  const catsGasto = categorias.filter((c) => c.tipo === 'gasto')

  return (
    <Screen>
      <AppBar title="Gastos fijos" onBack={() => router.push(`/gestores/${id}`)} />
      <Content>
        {fijos.length > 0 && (
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total mensual activo
            </p>
            <Money value={totalActivos} className="mt-1 text-2xl font-bold text-expense" />
            <p className="mt-1 text-xs text-muted-foreground">
              {activos.length} de {fijos.length} activos · se generan impagos en cada mes nuevo
            </p>
          </div>
        )}

        {fijos.length === 0 ? (
          <EmptyState
            icon={<Repeat className="size-6" />}
            title="Sin gastos fijos"
            description="Cargá acá el alquiler, los servicios, la cuota del auto. Cada mes se generan solos y los vas marcando como pagados."
            action={
              <Button onClick={abrirNuevo} className="h-11 rounded-xl">
                <Plus className="size-4" />
                Agregar el primero
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {fijos.map((gf) => (
              <div
                key={gf.id}
                className={`flex items-center gap-3 rounded-2xl border border-border/70 p-3.5 ${
                  gf.activo ? 'bg-card' : 'bg-muted/40'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-semibold ${gf.activo ? '' : 'text-muted-foreground'}`}>
                    {gf.descripcion}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-expense">{formatCurrency(gf.monto)}</span>
                    {gf.categoria && (
                      <>
                        <span>·</span>
                        <span className="truncate rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                          {gf.categoria}
                        </span>
                      </>
                    )}
                    {!gf.activo && <span>· pausado</span>}
                  </div>
                </div>

                <Switch
                  checked={gf.activo}
                  onCheckedChange={(v) => toggleActivo(gf, v)}
                  label={`${gf.activo ? 'Pausar' : 'Activar'} ${gf.descripcion}`}
                />
                <button
                  onClick={() => abrirEditar(gf)}
                  aria-label="Editar"
                  className="tap grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => eliminar(gf.id)}
                  aria-label="Eliminar"
                  className="tap grid size-8 shrink-0 place-items-center rounded-lg text-expense hover:bg-expense/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Content>

      <BottomBar>
        <Button onClick={abrirNuevo} className="h-12 flex-1 rounded-2xl text-[15px]">
          <Plus className="size-5" />
          Nuevo gasto fijo
        </Button>
      </BottomBar>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
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
          <Field label="Descripción">
            <input
              type="text"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Alquiler, Internet, Seguro…"
              className={fieldClass}
            />
          </Field>
          <Field label="Monto">
            <input
              type="number"
              inputMode="decimal"
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
              className={fieldClass}
            />
          </Field>
          <Field label="Categoría" hint="Opcional">
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className={fieldClass}
            >
              <option value="">— Sin categoría —</option>
              {catsGasto.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-center justify-between rounded-xl border border-border/70 p-3.5">
            <div>
              <p className="text-sm font-semibold">Activo</p>
              <p className="text-xs text-muted-foreground">
                Solo los activos se generan en los meses nuevos.
              </p>
            </div>
            <Switch
              checked={form.activo}
              onCheckedChange={(v) => setForm({ ...form, activo: v })}
              label="Activo"
            />
          </div>
        </div>
      </Modal>
    </Screen>
  )
}
