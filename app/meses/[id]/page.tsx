'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Lock, BarChart3, ArrowUpRight, ArrowDownLeft, Repeat, RefreshCw } from 'lucide-react'

import Modal from '../../components/Modal'
import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { BalanceHero, Money, CategoryBar } from '@/components/mobile/money'
import { Field, fieldClass } from '@/components/mobile/field'
import { Switch } from '@/components/ui/switch'
import { formatCurrency } from '@/lib/format-currency'

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
  subcategoria?: string
  clasificacion?: string
  necesidad?: string
  metodoPago?: string
  cuentaId?: string
  notas?: string
  recurrente?: boolean
  pagado?: boolean
  gastoFijoId?: string | null
  fecha: string
}

interface Categoria {
  id: string
  nombre: string
  tipo: string
  parentId?: string | null
}

interface Cuenta {
  id: string
  nombre: string
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

const CLASIFICACIONES = ['fijo', 'variable', 'discrecional', 'extraordinario', 'deuda']
const METODOS_PAGO = ['efectivo', 'debito', 'credito', 'transferencia', 'billetera']

type Tab = 'gastos' | 'fijos' | 'ingresos' | 'estadisticas'

export default function MesPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [mes, setMes] = useState<Mes | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
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
    setFormData({ monto: '', descripcion: '', categoria: '', clasificacion: '', necesidad: '', metodoPago: '', cuentaId: '', notas: '', recurrente: false, fecha: '' })
  }
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    categoria: '',
    clasificacion: '',
    necesidad: '',
    metodoPago: '',
    cuentaId: '',
    notas: '',
    recurrente: false,
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
        if (data.gestor?.id) {
          const gid = data.gestor.id
          Promise.all([
            fetch(`/api/gestores/${gid}/categorias`).then((r) => (r.ok ? r.json() : [])),
            fetch(`/api/gestores/${gid}/cuentas`).then((r) => (r.ok ? r.json() : [])),
          ])
            .then(([cats, cts]) => {
              setCategorias(cats)
              setCuentas(cts)
            })
            .catch(() => {})
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
        setFormData({ monto: '', descripcion: '', categoria: '', clasificacion: '', necesidad: '', metodoPago: '', cuentaId: '', notas: '', recurrente: false, fecha: '' })
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
          clasificacion: formData.clasificacion || undefined,
          necesidad: formData.necesidad || undefined,
          metodoPago: formData.metodoPago || undefined,
          cuentaId: formData.cuentaId || undefined,
          notas: formData.notas || undefined,
          recurrente: formData.recurrente,
          fecha: formData.fecha || new Date().toISOString(),
        }),
      })
      if (res.ok) {
        await loadMes()
        setFormData({ monto: '', descripcion: '', categoria: '', clasificacion: '', necesidad: '', metodoPago: '', cuentaId: '', notas: '', recurrente: false, fecha: '' })
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

  async function cambiarNecesidad(gasto: Gasto) {
    const orden = ['necesario', 'prescindible', 'no_seguro']
    const idx = orden.indexOf(gasto.necesidad || '')
    const next = orden[(idx + 1) % orden.length]
    try {
      const res = await fetch(`/api/gastos/${gasto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ necesidad: next }),
      })
      if (res.ok) await loadMes()
    } catch {
      /* noop */
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
      clasificacion: '',
      necesidad: '',
      metodoPago: '',
      cuentaId: '',
      notas: '',
      recurrente: false,
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
      clasificacion: gasto.clasificacion || '',
      necesidad: gasto.necesidad || '',
      metodoPago: gasto.metodoPago || '',
      cuentaId: gasto.cuentaId || '',
      notas: gasto.notas || '',
      recurrente: gasto.recurrente || false,
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
          clasificacion: formData.clasificacion || undefined,
          necesidad: formData.necesidad || undefined,
          metodoPago: formData.metodoPago || undefined,
          cuentaId: formData.cuentaId || undefined,
          notas: formData.notas || undefined,
          recurrente: formData.recurrente,
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

  /** Marca un gasto como pagado o impago. Optimista: revierte si el server falla. */
  async function togglePagado(gasto: Gasto, pagado: boolean) {
    if (!mes) return
    const previo = mes
    setMes({ ...mes, gastos: mes.gastos.map((g) => (g.id === gasto.id ? { ...g, pagado } : g)) })
    try {
      const res = await fetch(`/api/gastos/${gasto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagado }),
      })
      if (!res.ok) {
        const data = await res.json()
        setMes(previo)
        alert(data.error || 'No se pudo actualizar el pago')
      }
    } catch {
      setMes(previo)
      alert('No se pudo actualizar el pago')
    }
  }

  /** Trae al mes los fijos que falten según las plantillas activas del gestor. */
  async function generarFijos() {
    if (!mes) return
    try {
      const res = await fetch(`/api/meses/${mes.id}/generar-fijos`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        if (data.creados === 0) alert('No hay fijos nuevos para agregar.')
        await loadMes()
      } else {
        alert(data.error || 'Error al generar los fijos')
      }
    } catch {
      alert('Error al generar los fijos')
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
  /** Todo lo cargado en el mes, pagado o no. Es lo que el mes te va a costar. */
  function calcularTotalComprometido() {
    if (!mes) return 0
    return mes.gastos.reduce((sum, gas) => sum + gas.monto, 0)
  }
  /** Solo lo efectivamente pagado. Los fijos generados nacen impagos. */
  function calcularTotalGastos() {
    if (!mes) return 0
    return mes.gastos.reduce((sum, gas) => (gas.pagado === false ? sum : sum + gas.monto), 0)
  }
  function calcularTotalPendiente() {
    return calcularTotalComprometido() - calcularTotalGastos()
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
  const totalPendiente = calcularTotalPendiente()
  const fijos = mes.gastos.filter((g) => g.gastoFijoId)
  const fijosImpagos = fijos.filter((g) => g.pagado === false).length
  const maxGastoCategoria =
    gastosPorCategoria.length > 0 ? Math.max(...gastosPorCategoria.map((g) => g.total)) : 0

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'gastos', label: 'Gastos' },
    { key: 'fijos', label: 'Fijos' },
    { key: 'ingresos', label: 'Ingresos' },
    { key: 'estadisticas', label: 'Stats' },
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

        {totalPendiente > 0 && (
          <button
            onClick={() => setActiveTab('fijos')}
            className="tap flex w-full items-center gap-3 rounded-2xl border border-dashed border-expense/40 bg-expense/5 p-3.5 text-left"
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-expense/15 text-expense">
              <Repeat className="size-[18px]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Pendiente de pago</p>
              <p className="text-xs text-muted-foreground">
                {fijosImpagos > 0
                  ? `${fijosImpagos} ${fijosImpagos === 1 ? 'fijo impago' : 'fijos impagos'}`
                  : 'Gastos sin marcar como pagados'}
                {' · comprometido '}
                {formatCurrency(calcularTotalComprometido())}
              </p>
            </div>
            <Money value={totalPendiente} className="shrink-0 text-base font-bold text-expense" />
          </button>
        )}

        {/* Segmented tabs */}
        <div className="grid grid-cols-4 rounded-2xl border border-border bg-muted/60 p-1">
          {tabs.map((t) => {
            const active = activeTab === t.key
            const count =
              t.key === 'gastos'
                ? mes.gastos.length
                : t.key === 'fijos'
                  ? fijos.length
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
                    clasificacion={gasto.clasificacion}
                    necesidad={gasto.necesidad}
                    recurrente={gasto.recurrente}
                    pagado={gasto.pagado}
                    variant="expense"
                    index={i}
                    editable={!mes.cerrado}
                    onEdit={() => abrirEditarGasto(gasto)}
                    onDelete={() => eliminarGasto(gasto.id)}
                    onToggleNecesidad={!mes.cerrado ? () => cambiarNecesidad(gasto) : undefined}
                  />
                ))
              ))}

            {activeTab === 'fijos' && (
              <>
                {fijos.length > 0 && (
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-3.5 py-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {fijos.length - fijosImpagos} de {fijos.length} pagados
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Falta pagar {formatCurrency(totalPendiente)}
                      </p>
                    </div>
                    {!mes.cerrado && (
                      <button
                        onClick={generarFijos}
                        className="tap inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold"
                      >
                        <RefreshCw className="size-3.5" />
                        Sincronizar
                      </button>
                    )}
                  </div>
                )}

                {fijos.length === 0 ? (
                  <EmptyState
                    icon={<Repeat className="size-6" />}
                    title="Sin gastos fijos este mes"
                    description={
                      mes.cerrado
                        ? 'Este mes está cerrado.'
                        : 'Generá los fijos a partir de las plantillas del gestor, o cargalas primero desde Gastos fijos.'
                    }
                    action={
                      !mes.cerrado ? (
                        <Button onClick={generarFijos} className="h-11 rounded-xl">
                          <RefreshCw className="size-4" />
                          Generar fijos del mes
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  fijos.map((gasto, i) => (
                    <FijoCard
                      key={gasto.id}
                      gasto={gasto}
                      index={i}
                      editable={!mes.cerrado}
                      onToggle={(v) => togglePagado(gasto, v)}
                      onEdit={() => abrirEditarGasto(gasto)}
                    />
                  ))
                )}
              </>
            )}

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
            <GastoFields
              formData={formData}
              setFormData={setFormData}
              categorias={categorias}
              cuentas={cuentas}
            />
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
            <GastoFields
              formData={formData}
              setFormData={setFormData}
              categorias={categorias}
              cuentas={cuentas}
            />
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

/* Campos extendidos de un gasto (categoría, clasificación, necesario/prescindible, etc.). */
function GastoFields({
  formData,
  setFormData,
  categorias,
  cuentas,
}: {
  formData: {
    categoria: string
    clasificacion: string
    necesidad: string
    metodoPago: string
    cuentaId: string
    notas: string
    recurrente: boolean
  }
  setFormData: (fn: any) => void
  categorias: Categoria[]
  cuentas: Cuenta[]
}) {
  const catsGasto = categorias.filter((c) => c.tipo === 'gasto')
  const set = (patch: Record<string, unknown>) => setFormData((prev: any) => ({ ...prev, ...patch }))
  const necesidades: { key: string; label: string }[] = [
    { key: 'necesario', label: 'Necesario' },
    { key: 'prescindible', label: 'Prescindible' },
    { key: 'no_seguro', label: 'No estoy seguro' },
  ]

  return (
    <>
      <Field label="Categoría" hint="Si la dejás vacía, se clasifica sola.">
        <select
          value={formData.categoria}
          onChange={(e) => set({ categoria: e.target.value })}
          className={fieldClass}
        >
          <option value="">Automática</option>
          {catsGasto.map((c) => (
            <option key={c.id} value={c.nombre}>
              {c.parentId ? `— ${c.nombre}` : c.nombre}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tipo de gasto" hint="Opcional">
        <select
          value={formData.clasificacion}
          onChange={(e) => set({ clasificacion: e.target.value })}
          className={fieldClass}
        >
          <option value="">Automático</option>
          {CLASIFICACIONES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="¿Necesario o prescindible?">
        <div className="grid grid-cols-3 gap-2">
          {necesidades.map((n) => {
            const active = formData.necesidad === n.key
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => set({ necesidad: active ? '' : n.key })}
                className={`tap rounded-xl border px-2 py-2 text-xs font-medium transition ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {n.label}
              </button>
            )
          })}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Método de pago">
          <select
            value={formData.metodoPago}
            onChange={(e) => set({ metodoPago: e.target.value })}
            className={fieldClass}
          >
            <option value="">—</option>
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m} className="capitalize">
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cuenta">
          <select
            value={formData.cuentaId}
            onChange={(e) => set({ cuentaId: e.target.value })}
            className={fieldClass}
          >
            <option value="">—</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={formData.recurrente}
          onChange={(e) => set({ recurrente: e.target.checked })}
          className="size-4 accent-[var(--primary)]"
        />
        Es un gasto recurrente
      </label>

      <Field label="Notas" hint="Opcional">
        <input
          type="text"
          value={formData.notas}
          onChange={(e) => set({ notas: e.target.value })}
          className={fieldClass}
        />
      </Field>
    </>
  )
}

/* Tarjeta de un ingreso o gasto individual. */
const NECESIDAD_LABEL: Record<string, string> = {
  necesario: 'Necesario',
  prescindible: 'Prescindible',
  no_seguro: 'No estoy seguro',
}

/* Fila de gasto fijo del mes, con el switch de pagado. */
function FijoCard({
  gasto,
  index,
  editable,
  onToggle,
  onEdit,
}: {
  gasto: Gasto
  index: number
  editable: boolean
  onToggle: (value: boolean) => void
  onEdit: () => void
}) {
  const pagado = gasto.pagado !== false
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-colors ${
        pagado ? 'border-income/30 bg-income/5' : 'border-border/70 bg-card'
      }`}
    >
      <button
        onClick={onEdit}
        disabled={!editable}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <p className={`truncate font-semibold ${pagado ? 'text-muted-foreground line-through' : ''}`}>
          {gasto.descripcion}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {gasto.categoria && (
            <span className="truncate rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
              {gasto.categoria}
            </span>
          )}
          <span className={pagado ? 'text-income' : 'text-expense'}>
            {pagado ? 'Pagado' : 'Impago'}
          </span>
        </div>
      </button>

      <Money
        value={gasto.monto}
        className={`shrink-0 text-base font-bold ${pagado ? 'text-muted-foreground' : 'text-expense'}`}
      />

      <Switch
        checked={pagado}
        disabled={!editable}
        onCheckedChange={onToggle}
        label={`Marcar ${gasto.descripcion} como ${pagado ? 'impago' : 'pagado'}`}
      />
    </motion.div>
  )
}

function MovimientoCard({
  descripcion,
  monto,
  fecha,
  categoria,
  clasificacion,
  necesidad,
  recurrente,
  pagado,
  variant,
  index,
  editable,
  onEdit,
  onDelete,
  onToggleNecesidad,
}: {
  descripcion: string
  monto: number
  fecha: string
  categoria?: string
  clasificacion?: string
  necesidad?: string
  recurrente?: boolean
  pagado?: boolean
  variant: 'income' | 'expense'
  index: number
  editable: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleNecesidad?: () => void
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
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>{fecha}</span>
          {categoria && (
            <>
              <span>·</span>
              <span className="truncate rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                {categoria}
              </span>
            </>
          )}
          {recurrente && (
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">↻ recurrente</span>
          )}
          {pagado === false && (
            <span className="rounded-full bg-expense/15 px-2 py-0.5 font-semibold text-expense">impago</span>
          )}
        </div>
        {!isIncome && (clasificacion || necesidad) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {clasificacion && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                {clasificacion}
              </span>
            )}
            {necesidad &&
              (onToggleNecesidad ? (
                <button
                  type="button"
                  onClick={onToggleNecesidad}
                  className={`tap rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    necesidad === 'prescindible'
                      ? 'bg-expense/15 text-expense'
                      : necesidad === 'necesario'
                        ? 'bg-income/15 text-income'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {NECESIDAD_LABEL[necesidad] || necesidad}
                </button>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {NECESIDAD_LABEL[necesidad] || necesidad}
                </span>
              ))}
          </div>
        )}
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
