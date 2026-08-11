'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react'

import Modal from '@/app/components/Modal'
import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { Money } from '@/components/mobile/money'
import { Field, fieldClass } from '@/components/mobile/field'

interface Cuenta {
  id: string
  nombre: string
  tipo: string
  saldo: number
  moneda: string
}

const TIPOS = ['efectivo', 'banco', 'debito', 'credito', 'billetera']
const emptyForm = { nombre: '', tipo: 'efectivo', saldo: '', moneda: 'ARS' }

export default function CuentasPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Cuenta | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    try {
      const res = await fetch(`/api/gestores/${id}/cuentas`)
      if (res.ok) setCuentas(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function abrirNueva() {
    setEditing(null)
    setForm(emptyForm)
    setIsOpen(true)
  }

  function abrirEditar(c: Cuenta) {
    setEditing(c)
    setForm({ nombre: c.nombre, tipo: c.tipo, saldo: c.saldo.toString(), moneda: c.moneda })
    setIsOpen(true)
  }

  async function guardar() {
    const body = {
      nombre: form.nombre,
      tipo: form.tipo,
      saldo: parseFloat(form.saldo) || 0,
      moneda: form.moneda || 'ARS',
    }
    const url = editing ? `/api/gestores/${id}/cuentas/${editing.id}` : `/api/gestores/${id}/cuentas`
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

  async function eliminar(cuentaId: string) {
    if (!confirm('¿Eliminar esta cuenta?')) return
    const res = await fetch(`/api/gestores/${id}/cuentas/${cuentaId}`, { method: 'DELETE' })
    if (res.ok) await load()
    else {
      const d = await res.json()
      alert(d.error || 'Error')
    }
  }

  if (loading) return <ScreenLoader />

  return (
    <Screen>
      <AppBar title="Cuentas" onBack={() => router.push(`/gestores/${id}`)} />
      <Content>
        {cuentas.length === 0 ? (
          <EmptyState
            icon={<Wallet className="size-6" />}
            title="Sin cuentas"
            description="Agregá tus cuentas: efectivo, banco, tarjetas o billeteras."
          />
        ) : (
          <div className="space-y-3">
            {cuentas.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Wallet className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.nombre}</p>
                  <span className="mt-0.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                    {c.tipo}
                  </span>
                </div>
                <Money value={c.saldo} className="shrink-0 text-base font-bold" />
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    onClick={() => abrirEditar(c)}
                    aria-label="Editar"
                    className="tap grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => eliminar(c.id)}
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
        <Button onClick={abrirNueva} className="h-12 flex-1 rounded-2xl text-[15px]">
          <Plus className="size-5" />
          Nueva cuenta
        </Button>
      </BottomBar>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? 'Editar cuenta' : 'Nueva cuenta'}
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
          <Field label="Tipo">
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={fieldClass}>
              {TIPOS.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Saldo">
            <input
              type="number"
              step="0.01"
              value={form.saldo}
              onChange={(e) => setForm({ ...form, saldo: e.target.value })}
              placeholder="0"
              className={fieldClass}
            />
          </Field>
          <Field label="Moneda">
            <input
              type="text"
              value={form.moneda}
              onChange={(e) => setForm({ ...form, moneda: e.target.value })}
              className={fieldClass}
            />
          </Field>
        </div>
      </Modal>
    </Screen>
  )
}
