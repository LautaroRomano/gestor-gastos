'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'

import Modal from '@/app/components/Modal'
import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { Field, fieldClass } from '@/components/mobile/field'

interface Categoria {
  id: string
  nombre: string
  tipo: 'gasto' | 'ingreso'
  parentId: string | null
  clasificacionDefault: string | null
}

const CLASIFICACIONES = ['fijo', 'variable', 'discrecional', 'extraordinario', 'deuda']

const emptyForm = { nombre: '', tipo: 'gasto', clasificacionDefault: '', parentId: '' }

export default function CategoriasPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Categoria | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    try {
      const res = await fetch(`/api/gestores/${id}/categorias`)
      if (res.ok) setCategorias(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function abrirNueva() {
    setEditing(null)
    setForm(emptyForm)
    setIsOpen(true)
  }

  function abrirEditar(c: Categoria) {
    setEditing(c)
    setForm({
      nombre: c.nombre,
      tipo: c.tipo,
      clasificacionDefault: c.clasificacionDefault || '',
      parentId: c.parentId || '',
    })
    setIsOpen(true)
  }

  async function guardar() {
    const body: Record<string, unknown> = {
      nombre: form.nombre,
      clasificacionDefault: form.clasificacionDefault || undefined,
      parentId: form.parentId || undefined,
    }
    if (!editing) body.tipo = form.tipo
    const url = editing
      ? `/api/gestores/${id}/categorias/${editing.id}`
      : `/api/gestores/${id}/categorias`
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

  async function eliminar(catId: string) {
    if (!confirm('¿Eliminar esta categoría? Se eliminarán también sus subcategorías.')) return
    const res = await fetch(`/api/gestores/${id}/categorias/${catId}`, { method: 'DELETE' })
    if (res.ok) await load()
    else {
      const d = await res.json()
      alert(d.error || 'Error')
    }
  }

  if (loading) return <ScreenLoader />

  const padres = (tipo: string) => categorias.filter((c) => c.tipo === tipo && !c.parentId)
  const hijas = (parentId: string) => categorias.filter((c) => c.parentId === parentId)
  const padresDelTipoForm = categorias.filter((c) => c.tipo === form.tipo && !c.parentId && c.id !== editing?.id)

  function Seccion({ tipo, titulo }: { tipo: 'gasto' | 'ingreso'; titulo: string }) {
    const items = padres(tipo)
    if (items.length === 0) return null
    return (
      <section className="space-y-3">
        <h2 className="px-1 font-display text-base font-semibold">{titulo}</h2>
        {items.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border/70 bg-card p-3.5">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.nombre}</p>
                {c.clasificacionDefault && (
                  <span className="mt-0.5 inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                    {c.clasificacionDefault}
                  </span>
                )}
              </div>
              <button
                onClick={() => abrirEditar(c)}
                aria-label="Editar"
                className="tap grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => eliminar(c.id)}
                aria-label="Eliminar"
                className="tap grid size-8 place-items-center rounded-lg text-expense hover:bg-expense/10"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {hijas(c.id).length > 0 && (
              <div className="mt-3 space-y-1.5 border-l border-border pl-4">
                {hijas(c.id).map((h) => (
                  <div key={h.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-foreground/80">{h.nombre}</span>
                    <button
                      onClick={() => abrirEditar(h)}
                      aria-label="Editar"
                      className="tap grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => eliminar(h.id)}
                      aria-label="Eliminar"
                      className="tap grid size-7 place-items-center rounded-lg text-expense hover:bg-expense/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    )
  }

  return (
    <Screen>
      <AppBar title="Categorías" onBack={() => router.push(`/gestores/${id}`)} />
      <Content>
        {categorias.length === 0 ? (
          <EmptyState
            icon={<Tag className="size-6" />}
            title="Sin categorías"
            description="Creá categorías para organizar tus gastos e ingresos."
          />
        ) : (
          <>
            <Seccion tipo="gasto" titulo="Gastos" />
            <Seccion tipo="ingreso" titulo="Ingresos" />
          </>
        )}
      </Content>

      <BottomBar>
        <Button onClick={abrirNueva} className="h-12 flex-1 rounded-2xl text-[15px]">
          <Plus className="size-5" />
          Nueva categoría
        </Button>
      </BottomBar>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
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
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={fieldClass}
            />
          </Field>
          {!editing && (
            <Field label="Tipo">
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value, parentId: '' })}
                className={fieldClass}
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </Field>
          )}
          {form.tipo === 'gasto' && (
            <Field label="Clasificación por defecto" hint="Opcional">
              <select
                value={form.clasificacionDefault}
                onChange={(e) => setForm({ ...form, clasificacionDefault: e.target.value })}
                className={fieldClass}
              >
                <option value="">— Sin definir —</option>
                {CLASIFICACIONES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Categoría padre" hint="Opcional: convertir en subcategoría">
            <select
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              className={fieldClass}
            >
              <option value="">— Ninguna —</option>
              {padresDelTipoForm.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
    </Screen>
  )
}
