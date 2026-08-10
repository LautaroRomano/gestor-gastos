'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Lock, BarChart3, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

import Modal from '../../components/Modal'
import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { BalanceHero, Money, CategoryBar } from '@/components/mobile/money'
import { Field, fieldClass } from '@/components/mobile/field'

interface Ingreso {
  id: string
  monto: number
  descripcion: string
  fecha: string
}

interface Gasto {
  id: string
  monto: number
  descripcion: string
  categoria?: string
  fecha: string
}

interface Mes {
  id: string
  fechaInicio: string
  fechaCierre?: string
  cerrado: boolean
  ingresos: Ingreso[]
  gastos: Gasto[]
  gestor: { id: string; nombre: string }
}

type Tab = 'gastos' | 'ingresos' | 'estadisticas'

export default function MesPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [mes, setMes] = useState<Mes | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('gastos')
  const [isOpen, setIsOpen] = useState(false)
  const [isCerrarOpen, setIsCerrarOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Ingreso | Gasto | null>(null)
  const [editingType, setEditingType] = useState<'ingreso' | 'gasto' | null>(null)

  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)
  const onEditClose = () => {
    setIsEditOpen(false)
    setEditingItem(null)
    setEditingType(null)
    setFormData({ monto: '', descripcion: '', categoria: '', fecha: '' })
  }
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    categoria: '',
    fecha: '',
  })
  const [fechaCierre, setFechaCierre] = useState('')

  useEffect(() => {
    loadMes()
  }, [id])

  async function loadMes() {
    try {
      const res = await fetch(`/api/meses/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMes(data)
        try {
          localStorage.setItem('lastMesId', data.id)
          if (data.gestor?.id) localStorage.setItem('lastGestorId', data.gestor.id)
        } catch (e) {
          console.error('Error guardando el último mes visitado', e)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function crearIngreso() {
    if (!mes) return
    try {
      const res = await fetch('/api/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mesId: mes.id,
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion,
          fecha: formData.fecha || new Date().toISOString(),
        }),
      })
      if (res.ok) {
        await loadMes()
        setFormData({ monto: '', descripcion: '', categoria: '', fecha: '' })
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al crear ingreso')
      }
    } catch (error) {
      alert('Error al crear ingreso')
    }
  }

  async function crearGasto() {
    if (!mes) return
    try {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mesId: mes.id,
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion,
          categoria: formData.categoria || undefined,
          fecha: formData.fecha || new Date().toISOString(),
        }),
      })
      if (res.ok) {
        await loadMes()
        setFormData({ monto: '', descripcion: '', categoria: '', fecha: '' })
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al crear gasto')
      }
    } catch (error) {
      alert('Error al crear gasto')
    }
  }

  async function eliminarIngreso(ingresoId: string) {
    if (!confirm('¿Estás seguro de eliminar este ingreso?')) return
    try {
      const res = await fetch(`/api/ingresos/${ingresoId}`, { method: 'DELETE' })
      if (res.ok) await loadMes()
      else {
        const data = await res.json()
        alert(data.error || 'Error al eliminar ingreso')
      }
    } catch (error) {
      alert('Error al eliminar ingreso')
    }
  }

  async function eliminarGasto(gastoId: string) {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return
    try {
      const res = await fetch(`/api/gastos/${gastoId}`, { method: 'DELETE' })
      if (res.ok) await loadMes()
      else {
        const data = await res.json()
        alert(data.error || 'Error al eliminar gasto')
      }
    } catch (error) {
      alert('Error al eliminar gasto')
    }
  }

  function abrirEditarIngreso(ingreso: Ingreso) {
    setEditingItem(ingreso)
    setEditingType('ingreso')
    setFormData({
      monto: ingreso.monto.toString(),
      descripcion: ingreso.descripcion,
      categoria: '',
      fecha: new Date(ingreso.fecha).toISOString().slice(0, 16),
    })
    setIsEditOpen(true)
  }

  function abrirEditarGasto(gasto: Gasto) {
    setEditingItem(gasto)
    setEditingType('gasto')
    setFormData({
      monto: gasto.monto.toString(),
      descripcion: gasto.descripcion,
      categoria: gasto.categoria || '',
      fecha: new Date(gasto.fecha).toISOString().slice(0, 16),
    })
    setIsEditOpen(true)
  }

  async function actualizarIngreso() {
    if (!editingItem || editingType !== 'ingreso') return
    try {
      const res = await fetch(`/api/ingresos/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion,
          fecha: formData.fecha ? new Date(formData.fecha).toISOString() : undefined,
        }),
      })
      if (res.ok) {
        await loadMes()
        onEditClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al actualizar ingreso')
      }
    } catch (error) {
      alert('Error al actualizar ingreso')
    }
  }

  async function actualizarGasto() {
    if (!editingItem || editingType !== 'gasto') return
    try {
      const res = await fetch(`/api/gastos/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion,
          categoria: formData.categoria || undefined,
          fecha: formData.fecha ? new Date(formData.fecha).toISOString() : undefined,
        }),
      })
      if (res.ok) {
        await loadMes()
        onEditClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al actualizar gasto')
      }
    } catch (error) {
      alert('Error al actualizar gasto')
    }
  }

  async function cerrarMes() {
    if (!mes || !fechaCierre) return
    try {
      const res = await fetch(`/api/meses/${mes.id}/cerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaCierre: new Date(fechaCierre).toISOString() }),
      })
      if (res.ok) {
        await loadMes()
        setIsCerrarOpen(false)
        setFechaCierre('')
      } else {
        const data = await res.json()
        alert(data.error || 'Error al cerrar mes')
      }
    } catch (error) {
      alert('Error al cerrar mes')
    }
  }

  function calcularTotalIngresos() {
    if (!mes) return 0
    return mes.ingresos.reduce((sum, ing) => sum + ing.monto, 0)
  }
  function calcularTotalGastos() {
    if (!mes) return 0
    return mes.gastos.reduce((sum, gas) => sum + gas.monto, 0)
  }
  function calcularBalance() {
    return calcularTotalIngresos() - calcularTotalGastos()
  }

  function calcularGastosPorCategoria() {
    if (!mes) return []
    const normalizarCategoria = (valor: string) =>
      valor
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')

    const categoriaMap = new Map<string, { total: number; label: string }>()
    mes.gastos.forEach((gasto) => {
      const categoriaOriginal =
        gasto.categoria && gasto.categoria.trim() !== '' ? gasto.categoria : 'Sin categoría'
      const key = normalizarCategoria(categoriaOriginal)
      const existente = categoriaMap.get(key) || { total: 0, label: categoriaOriginal }
      categoriaMap.set(key, { total: existente.total + gasto.monto, label: existente.label })
    })

    return Array.from(categoriaMap.values())
      .map(({ label, total }) => ({ categoria: label, total }))
      .sort((a, b) => b.total - a.total)
  }

  function fmtFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) return <ScreenLoader />
  if (!mes) return null

  const gastosPorCategoria = calcularGastosPorCategoria()
  const totalGastos = calcularTotalGastos()
  const maxGastoCategoria =
    gastosPorCategoria.length > 0 ? Math.max(...gastosPorCategoria.map((g) => g.total)) : 0

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'gastos', label: `Gastos` },
    { key: 'ingresos', label: `Ingresos` },
    { key: 'estadisticas', label: `Stats` },
  ]

  const tituloMes = new Date(mes.fechaInicio).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <Screen>
      <AppBar
        title={<span className="capitalize">{tituloMes}</span>}
        subtitle={mes.gestor.nombre}
        onBack={() => router.push(`/gestores/${mes.gestor.id}`)}
        right={
          mes.cerrado ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <Lock className="size-3" />
              Cerrado
            </span>
          ) : undefined
        }
      />

      <Content>
        <BalanceHero
          label={`Balance · ${tituloMes}`}
          value={calcularBalance()}
          income={calcularTotalIngresos()}
          expense={calcularTotalGastos()}
        />

        {/* Segmented tabs */}
        <div className="grid grid-cols-3 rounded-2xl border border-border bg-muted/60 p-1">
          {tabs.map((t) => {
            const active = activeTab === t.key
            const count =
              t.key === 'gastos'
                ? mes.gastos.length
                : t.key === 'ingresos'
                  ? mes.ingresos.length
                  : undefined
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="relative z-10 rounded-xl py-2 text-sm font-semibold transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="mes-tab-pill"
                    transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                    className="absolute inset-0 -z-10 rounded-xl bg-card shadow-sm"
                  />
                )}
                <span className={active ? 'text-foreground' : 'text-muted-foreground'}>
                  {t.label}
                  {count !== undefined && (
                    <span className="ml-1 text-xs opacity-60">{count}</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {activeTab === 'gastos' &&
              (mes.gastos.length === 0 ? (
                <EmptyState
                  icon={<ArrowDownLeft className="size-6" />}
                  title="Sin gastos"
                  description="Todavía no registraste gastos este mes."
                />
              ) : (
                mes.gastos.map((gasto, i) => (
                  <MovimientoCard
                    key={gasto.id}
                    descripcion={gasto.descripcion}
                    monto={gasto.monto}
                    fecha={fmtFecha(gasto.fecha)}
                    categoria={gasto.categoria}
                    variant="expense"
                    index={i}
                    editable={!mes.cerrado}
                    onEdit={() => abrirEditarGasto(gasto)}
                    onDelete={() => eliminarGasto(gasto.id)}
                  />
                ))
              ))}

            {activeTab === 'ingresos' &&
              (mes.ingresos.length === 0 ? (
                <EmptyState
                  icon={<ArrowUpRight className="size-6" />}
                  title="Sin ingresos"
                  description="Todavía no registraste ingresos este mes."
                />
              ) : (
                mes.ingresos.map((ingreso, i) => (
                  <MovimientoCard
                    key={ingreso.id}
                    descripcion={ingreso.descripcion}
                    monto={ingreso.monto}
                    fecha={fmtFecha(ingreso.fecha)}
                    variant="income"
                    index={i}
                    editable={!mes.cerrado}
                    onEdit={() => abrirEditarIngreso(ingreso)}
                    onDelete={() => eliminarIngreso(ingreso.id)}
                  />
                ))
              ))}

            {activeTab === 'estadisticas' &&
              (gastosPorCategoria.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="size-6" />}
                  title="Sin estadísticas"
                  description="Cargá algunos gastos para ver el desglose por categoría."
                />
              ) : (
                <div className="space-y-5 rounded-2xl border border-border/70 bg-card p-4">
                  <h3 className="flex items-center gap-2 font-display text-base font-semibold">
                    <BarChart3 className="size-5 text-primary" />
                    Gastos por categoría
                  </h3>
                  {gastosPorCategoria.map((item, index) => (
                    <CategoryBar
                      key={index}
                      label={item.categoria}
                      amount={item.total}
                      ratio={maxGastoCategoria > 0 ? item.total / maxGastoCategoria : 0}
                      percent={totalGastos > 0 ? (item.total / totalGastos) * 100 : 0}
                      index={index}
                    />
                  ))}
                </div>
              ))}
          </motion.div>
        </AnimatePresence>
      </Content>

      {!mes.cerrado && (
        <BottomBar>
          {activeTab !== 'estadisticas' && (
            <Button onClick={onOpen} className="h-12 flex-1 rounded-2xl text-[15px]">
              <Plus className="size-5" />
              {activeTab === 'ingresos' ? 'Ingreso' : 'Gasto'}
            </Button>
          )}
          <Button
            onClick={() => setIsCerrarOpen(true)}
            variant="outline"
            className="h-12 flex-1 rounded-2xl text-[15px]"
          >
            <Lock className="size-4" />
            Cerrar mes
          </Button>
        </BottomBar>
      )}

      {/* Agregar movimiento */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={activeTab === 'ingresos' ? 'Agregar ingreso' : 'Agregar gasto'}
        footer={
          <>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="h-11 rounded-xl px-6"
              onClick={activeTab === 'ingresos' ? crearIngreso : crearGasto}
            >
              Agregar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <Field label="Monto">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              placeholder="0"
              className={fieldClass}
            />
          </Field>
          <Field label="Descripción">
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className={fieldClass}
            />
          </Field>
          {activeTab === 'gastos' && (
            <Field label="Categoría" hint="Opcional">
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className={fieldClass}
              />
            </Field>
          )}
          <Field label="Fecha">
            <input
              type="datetime-local"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className={fieldClass}
            />
          </Field>
        </div>
      </Modal>

      {/* Cerrar mes */}
      <Modal
        isOpen={isCerrarOpen}
        onClose={() => setIsCerrarOpen(false)}
        title="Cerrar mes"
        footer={
          <>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={() => setIsCerrarOpen(false)}>
              Cancelar
            </Button>
            <Button className="h-11 rounded-xl px-6" onClick={cerrarMes}>
              Cerrar mes
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <p className="text-sm text-muted-foreground">
            Elegí la fecha de cierre del mes (la fecha de tu próximo cobro).
          </p>
          <Field label="Fecha de cierre">
            <input
              type="datetime-local"
              value={fechaCierre}
              onChange={(e) => setFechaCierre(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>
      </Modal>

      {/* Editar movimiento */}
      <Modal
        isOpen={isEditOpen}
        onClose={onEditClose}
        title={editingType === 'ingreso' ? 'Editar ingreso' : 'Editar gasto'}
        footer={
          <>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={onEditClose}>
              Cancelar
            </Button>
            <Button
              className="h-11 rounded-xl px-6"
              onClick={editingType === 'ingreso' ? actualizarIngreso : actualizarGasto}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <Field label="Monto">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              className={fieldClass}
            />
          </Field>
          <Field label="Descripción">
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className={fieldClass}
            />
          </Field>
          {editingType === 'gasto' && (
            <Field label="Categoría" hint="Opcional">
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className={fieldClass}
              />
            </Field>
          )}
          <Field label="Fecha">
            <input
              type="datetime-local"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              className={fieldClass}
            />
          </Field>
        </div>
      </Modal>
    </Screen>
  )
}

/* Tarjeta de un ingreso o gasto individual. */
function MovimientoCard({
  descripcion,
  monto,
  fecha,
  categoria,
  variant,
  index,
  editable,
  onEdit,
  onDelete,
}: {
  descripcion: string
  monto: number
  fecha: string
  categoria?: string
  variant: 'income' | 'expense'
  index: number
  editable: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const isIncome = variant === 'income'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5"
    >
      <div
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${
          isIncome ? 'bg-income/15 text-income' : 'bg-expense/15 text-expense'
        }`}
      >
        {isIncome ? (
          <ArrowUpRight className="size-5" strokeWidth={2.5} />
        ) : (
          <ArrowDownLeft className="size-5" strokeWidth={2.5} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{descripcion || 'Sin descripción'}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{fecha}</span>
          {categoria && (
            <>
              <span>·</span>
              <span className="truncate rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                {categoria}
              </span>
            </>
          )}
        </div>
      </div>

      <Money
        value={monto}
        className={`shrink-0 text-base font-bold ${isIncome ? 'text-income' : 'text-expense'}`}
      />

      {editable && (
        <div className="flex shrink-0 flex-col gap-1">
          <button
            onClick={onEdit}
            aria-label="Editar"
            className="tap grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label="Eliminar"
            className="tap grid size-7 place-items-center rounded-lg text-expense hover:bg-expense/10"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  )
}
