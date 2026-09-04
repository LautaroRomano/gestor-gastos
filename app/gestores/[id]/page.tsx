'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus,
  Calendar,
  Copy,
  Check,
  BarChart3,
  Repeat,
  Pencil,
  Lock,
  LayoutDashboard,
  Tags,
  Wallet,
  PiggyBank,
  Target,
  Sparkles,
  MessageCircle,
  Settings,
} from 'lucide-react'

import Modal from '../../components/Modal'
import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { BalanceHero, Money } from '@/components/mobile/money'
import { Field, fieldClass } from '@/components/mobile/field'

interface Mes {
  id: string
  fechaInicio: string
  fechaCierre?: string
  cerrado: boolean
  ingresos: Array<{ monto: number }>
  gastos: Array<{ monto: number }>
}

interface GastoFijo {
  id: string
  monto: number
  descripcion: string
  categoria?: string
  activo: boolean
}

interface Gestor {
  id: string
  nombre: string
  descripcion?: string
  meses: Mes[]
  gastosFijos: GastoFijo[]
}

export default function GestorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [gestor, setGestor] = useState<Gestor | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isEditGestorOpen, setIsEditGestorOpen] = useState(false)
  const [isEditMesOpen, setIsEditMesOpen] = useState(false)
  const [editingMes, setEditingMes] = useState<Mes | null>(null)
  const [nuevoMes, setNuevoMes] = useState({ fechaInicio: '' })
  const [editGestorData, setEditGestorData] = useState({ nombre: '', descripcion: '' })
  const [copied, setCopied] = useState(false)

  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)
  const onEditGestorClose = () => {
    setIsEditGestorOpen(false)
    setEditGestorData({ nombre: '', descripcion: '' })
  }
  const onEditMesClose = () => {
    setIsEditMesOpen(false)
    setEditingMes(null)
    setNuevoMes({ fechaInicio: '' })
  }
  useEffect(() => {
    loadGestor()
  }, [id])

  async function loadGestor() {
    try {
      const res = await fetch(`/api/gestores/${id}`)
      if (res.ok) {
        const data = await res.json()
        setGestor(data)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function crearMes() {
    try {
      const fechaInicioISO = nuevoMes.fechaInicio
        ? new Date(nuevoMes.fechaInicio).toISOString()
        : new Date().toISOString()

      const res = await fetch(`/api/gestores/${id}/meses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaInicio: fechaInicioISO }),
      })

      if (res.ok) {
        await loadGestor()
        setNuevoMes({ fechaInicio: '' })
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al crear mes')
      }
    } catch (error) {
      alert('Error al crear mes')
    }
  }

  function calcularTotalIngresos(mes: Mes) {
    return mes.ingresos.reduce((sum, ing) => sum + ing.monto, 0)
  }
  function calcularTotalGastos(mes: Mes) {
    return mes.gastos.reduce((sum, gas) => sum + gas.monto, 0)
  }
  function calcularBalance(mes: Mes) {
    return calcularTotalIngresos(mes) - calcularTotalGastos(mes)
  }

  function calcularEstadisticasGestor() {
    if (!gestor) return { ingresos: 0, gastos: 0, balance: 0 }
    const ingresos = gestor.meses.reduce((sum, mes) => sum + calcularTotalIngresos(mes), 0)
    const gastos = gestor.meses.reduce((sum, mes) => sum + calcularTotalGastos(mes), 0)
    return { ingresos, gastos, balance: ingresos - gastos }
  }

  async function copiarIdGestor() {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
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

  function abrirEditarGestor() {
    if (!gestor) return
    setEditGestorData({ nombre: gestor.nombre, descripcion: gestor.descripcion || '' })
    setIsEditGestorOpen(true)
  }

  async function actualizarGestor() {
    try {
      const res = await fetch(`/api/gestores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editGestorData),
      })

      if (res.ok) {
        await loadGestor()
        onEditGestorClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al actualizar gestor')
      }
    } catch (error) {
      alert('Error al actualizar gestor')
    }
  }

  function abrirEditarMes(mes: Mes) {
    setEditingMes(mes)
    setNuevoMes({ fechaInicio: new Date(mes.fechaInicio).toISOString().slice(0, 16) })
    setIsEditMesOpen(true)
  }

  async function actualizarMes() {
    if (!editingMes) return
    try {
      const res = await fetch(`/api/meses/${editingMes.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaInicio: new Date(nuevoMes.fechaInicio).toISOString() }),
      })

      if (res.ok) {
        await loadGestor()
        onEditMesClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al actualizar mes')
      }
    } catch (error) {
      alert('Error al actualizar mes')
    }
  }

  if (loading) return <ScreenLoader />
  if (!gestor) return null

  const estadisticas = calcularEstadisticasGestor()

  return (
    <Screen>
      <AppBar
        title={gestor.nombre}
        subtitle={gestor.descripcion || undefined}
        onBack={() => router.push('/dashboard')}
        right={
          <button
            onClick={abrirEditarGestor}
            aria-label="Editar gestor"
            className="tap grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <Pencil className="size-[18px]" />
          </button>
        }
      />

      <Content>
        <BalanceHero
          label="Balance del gestor"
          value={estadisticas.balance}
          income={estadisticas.ingresos}
          expense={estadisticas.gastos}
        />

        {/* Compartir ID */}
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card p-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              ID para invitar
            </p>
            <code className="block truncate font-mono text-xs text-foreground/80">{id}</code>
          </div>
          <button
            onClick={copiarIdGestor}
            className="tap inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-semibold text-accent-foreground"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push(`/gestores/${id}/gastos-fijos`)}
            className="tap flex flex-col items-start gap-2 rounded-2xl border border-border/70 bg-card p-3.5"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Repeat className="size-[18px]" />
            </span>
            <span className="text-sm font-semibold">Gastos fijos</span>
          </button>
          <button
            onClick={() => router.push(`/gestores/${id}/dashboard`)}
            className="tap flex flex-col items-start gap-2 rounded-2xl border border-border/70 bg-card p-3.5"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
              <LayoutDashboard className="size-[18px]" />
            </span>
            <span className="text-sm font-semibold">Dashboard</span>
          </button>
        </div>

        {/* Secciones (spec §129) */}
        <section className="space-y-3">
          <h2 className="px-1 font-display text-base font-semibold">Secciones</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Sparkles className="size-[18px]" />, label: 'Análisis IA', href: 'analisis' },
              { icon: <PiggyBank className="size-[18px]" />, label: 'Presupuestos', href: 'presupuestos' },
              { icon: <Tags className="size-[18px]" />, label: 'Categorías', href: 'categorias' },
              { icon: <Wallet className="size-[18px]" />, label: 'Cuentas', href: 'cuentas' },
              { icon: <Target className="size-[18px]" />, label: 'Objetivos', href: 'objetivos' },
              { icon: <Repeat className="size-[18px]" />, label: 'Recurrentes', href: 'recurrentes' },
              { icon: <MessageCircle className="size-[18px]" />, label: 'WhatsApp', href: 'whatsapp' },
              { icon: <BarChart3 className="size-[18px]" />, label: 'Estadísticas', href: 'estadisticas' },
              { icon: <Settings className="size-[18px]" />, label: 'Configuración', href: 'configuracion' },
            ].map((s) => (
              <button
                key={s.href}
                onClick={() => router.push(`/gestores/${id}/${s.href}`)}
                className="tap flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-3 text-center"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
                  {s.icon}
                </span>
                <span className="text-[11px] font-medium leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Meses */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-base font-semibold">Meses</h2>
            <span className="text-xs text-muted-foreground">{gestor.meses.length}</span>
          </div>

          {gestor.meses.length === 0 ? (
            <EmptyState
              icon={<Calendar className="size-6" />}
              title="No hay meses todavía"
              description="Creá un mes para empezar a cargar ingresos y gastos."
              action={
                <Button onClick={onOpen} className="h-11 rounded-xl px-5">
                  Crear primer mes
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {gestor.meses.map((mes, i) => {
                const balance = calcularBalance(mes)
                return (
                  <motion.div
                    key={mes.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card p-3.5"
                  >
                    <button
                      onClick={() => router.push(`/meses/${mes.id}`)}
                      className="tap flex min-w-0 flex-1 items-center gap-3.5 text-left"
                    >
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                        <Calendar className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold capitalize">
                          {new Date(mes.fechaInicio).toLocaleDateString('es-ES', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <span
                          className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            mes.cerrado
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-income/15 text-income'
                          }`}
                        >
                          {mes.cerrado && <Lock className="size-2.5" />}
                          {mes.cerrado ? 'Cerrado' : 'Abierto'}
                        </span>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <div className="text-right">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Balance
                        </p>
                        <Money
                          value={balance}
                          className={`text-sm font-bold ${
                            balance < 0 ? 'text-expense' : 'text-foreground'
                          }`}
                        />
                      </div>
                      <button
                        onClick={() => abrirEditarMes(mes)}
                        aria-label="Editar mes"
                        className="tap grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>
      </Content>

      <BottomBar>
        <Button onClick={onOpen} className="h-12 flex-1 rounded-2xl text-[15px]">
          <Plus className="size-5" />
          Nuevo mes
        </Button>
      </BottomBar>

      {/* Crear mes */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Nuevo mes"
        footer={
          <>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="h-11 rounded-xl px-6" onClick={crearMes}>
              Crear
            </Button>
          </>
        }
      >
        <div className="pt-1">
          <Field label="Fecha de inicio" hint="Si lo dejás vacío, usa la fecha de hoy.">
            <input
              type="datetime-local"
              value={nuevoMes.fechaInicio}
              onChange={(e) => setNuevoMes({ fechaInicio: e.target.value })}
              className={fieldClass}
            />
          </Field>
        </div>
      </Modal>

      {/* Editar gestor */}
      <Modal
        isOpen={isEditGestorOpen}
        onClose={onEditGestorClose}
        title="Editar gestor"
        footer={
          <>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={onEditGestorClose}>
              Cancelar
            </Button>
            <Button className="h-11 rounded-xl px-6" onClick={actualizarGestor}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <Field label="Nombre">
            <input
              type="text"
              value={editGestorData.nombre}
              onChange={(e) => setEditGestorData({ ...editGestorData, nombre: e.target.value })}
              className={fieldClass}
            />
          </Field>
          <Field label="Descripción">
            <input
              type="text"
              value={editGestorData.descripcion}
              onChange={(e) =>
                setEditGestorData({ ...editGestorData, descripcion: e.target.value })
              }
              className={fieldClass}
            />
          </Field>
        </div>
      </Modal>

      {/* Editar mes */}
      <Modal
        isOpen={isEditMesOpen}
        onClose={onEditMesClose}
        title="Editar mes"
        footer={
          <>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={onEditMesClose}>
              Cancelar
            </Button>
            <Button className="h-11 rounded-xl px-6" onClick={actualizarMes}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="pt-1">
          <Field label="Fecha de inicio">
            <input
              type="datetime-local"
              value={nuevoMes.fechaInicio}
              onChange={(e) => setNuevoMes({ fechaInicio: e.target.value })}
              className={fieldClass}
            />
          </Field>
        </div>
      </Modal>
    </Screen>
  )
}
