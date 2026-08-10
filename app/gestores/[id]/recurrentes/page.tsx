'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Repeat, RefreshCw } from 'lucide-react'

import Modal from '@/app/components/Modal'
import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { Money } from '@/components/mobile/money'
import { Field, fieldClass } from '@/components/mobile/field'

interface Recurrente {
  id: string
  tipo: 'gasto' | 'ingreso'
  monto: number
  descripcion: string
  categoria?: string | null
  frecuencia: 'mensual' | 'semanal' | 'quincenal' | 'anual'
  proximaFecha: string
  activo: boolean
}

const emptyForm = {
  tipo: 'gasto',
  monto: '',
  descripcion: '',
  categoria: '',
  frecuencia: 'mensual',
  proximaFecha: '',
  activo: true,
}

export default function RecurrentesPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [recurrentes, setRecurrentes] = useState<Recurrente[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Recurrente | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      const res = await fetch(`/api/gestores/${id}/recurrentes`)
      if (res.ok) setRecurrentes(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function abrirNuevo() {
    setEditing(null)
    setForm({ ...emptyForm })
    setIsOpen(true)
  }

  function abrirEditar(rec: Recurrente) {
    setEditing(rec)
    setForm({
      tipo: rec.tipo,
      monto: rec.monto.toString(),
      descripcion: rec.descripcion,
      categoria: rec.categoria || '',
      frecuencia: rec.frecuencia,
      proximaFecha: new Date(rec.proximaFecha).toISOString().slice(0, 10),
      activo: rec.activo,
    })
    setIsOpen(true)
  }

  function onClose() {
    setIsOpen(false)
    setEditing(null)
    setForm({ ...emptyForm })
  }

  async function guardar() {
    const body = {
      tipo: form.tipo,
      monto: parseFloat(form.monto),
      descripcion: form.descripcion,
      categoria: form.categoria || undefined,
      frecuencia: form.frecuencia,
      proximaFecha: form.proximaFecha,
      activo: form.activo,
    }
    try {
      const url = editing
        ? `/api/gestores/${id}/recurrentes/${editing.id}`
        : `/api/gestores/${id}/recurrentes`
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        await loadData()
        onClose()
      } else {
        const d = await res.json()
        alert(d.error || 'Error')
      }
    } catch {
      alert('Error al guardar')
    }
  }

  async function eliminar(recId: string) {
    if (!confirm('¿Eliminar este movimiento recurrente?')) return
    try {
      const res = await fetch(`/api/gestores/${id}/recurrentes/${recId}`, { method: 'DELETE' })
      if (res.ok) await loadData()
      else {
        const d = await res.json()
        alert(d.error || 'Error')
      }
    } catch {
      alert('Error al eliminar')
    }
  }

  async function generarVencidos() {
    try {
      const res = await fetch(`/api/gestores/${id}/recurrentes/generar`, { method: 'POST' })
      const d = await res.json()
      if (res.ok) {
        alert(`Se generaron ${d.generados} movimientos`)
        await loadData()
      } else {
        alert(d.error || 'Error')
      }
    } catch {
      alert('Error al generar')
    }
  }

  function fmtFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return <ScreenLoader />

  return (
    <Screen>
      <AppBar title="Recurrentes" onBack={() => router.push(`/gestores/${id}`)} />

      <Content>
        {recurrentes.length === 0 ? (
          <EmptyState
            icon={<Repeat className="size-6" />}
            title="Sin recurrentes"
            description="Cargá tus ingresos y gastos que se repiten para generarlos automáticamente."
          />
        ) : (
          <div className="space-y-3">
            {recurrentes.map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5">
                <div
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    rec.tipo === 'ingreso' ? 'bg-income/15 text-income' : 'bg-expense/15 text-expense'
                  }`}
                >
                  <Repeat className="size-5" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{rec.descripcion}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    <span className="capitalize">{rec.frecuencia}</span> · próxima {fmtFecha(rec.proximaFecha)}
                    {!rec.activo && ' · Inactivo'}
                  </p>
                </div>
                <Money
                  value={rec.monto}
                  className={`shrink-0 text-base font-bold ${rec.tipo === 'ingreso' ? 'text-income' : 'text-expense'}`}
                />
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    onClick={() => abrirEditar(rec)}
                    aria-label="Editar"
                    className="tap grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => eliminar(rec.id)}
                    aria-label="Eliminar"
                    className="tap grid size-7 place-items-center rounded-lg text-expense hover:bg-expense/10"
                  >
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
          Nuevo
        </Button>
        <Button onClick={generarVencidos} variant="outline" className="h-12 flex-1 rounded-2xl text-[15px]">
          <RefreshCw className="size-4" />
          Generar
        </Button>
      </BottomBar>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editing ? 'Editar recurrente' : 'Nuevo recurrente'}
        footer={
          <>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="h-11 rounded-xl px-6" onClick={guardar}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <Field label="Tipo">
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className={fieldClass}
            >
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </Field>
          <Field label="Monto">
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
          <Field label="Descripción">
            <input
              type="text"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej. Alquiler"
              className={fieldClass}
            />
          </Field>
          <Field label="Categoría" hint="Opcional">
            <input
              type="text"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className={fieldClass}
            />
          </Field>
          <Field label="Frecuencia">
            <select
              value={form.frecuencia}
              onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
              className={fieldClass}
            >
              <option value="mensual">Mensual</option>
              <option value="quincenal">Quincenal</option>
              <option value="semanal">Semanal</option>
              <option value="anual">Anual</option>
            </select>
          </Field>
          <Field label="Próxima fecha">
            <input
              type="date"
              value={form.proximaFecha}
              onChange={(e) => setForm({ ...form, proximaFecha: e.target.value })}
              className={fieldClass}
            />
          </Field>
          <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="size-4 accent-[var(--primary)]"
            />
            Activo
          </label>
        </div>
      </Modal>
    </Screen>
  )
}
