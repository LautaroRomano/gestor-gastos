'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, LockClosedIcon, ChartBarIcon, CurrencyDollarIcon, CalendarIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/Modal'
import { Button } from '@/components/ui/button'

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
  gestor: {
    id: string
    nombre: string
  }
}

export default function MesPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [mes, setMes] = useState<Mes | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('gastos')
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
      // Necesitamos obtener el mes desde el gestor
      // Por ahora, vamos a crear una API para obtener un mes específico
      const res = await fetch(`/api/meses/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMes(data)
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
      const res = await fetch(`/api/ingresos/${ingresoId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadMes()
      } else {
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
      const res = await fetch(`/api/gastos/${gastoId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadMes()
      } else {
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
        body: JSON.stringify({
          fechaCierre: new Date(fechaCierre).toISOString(),
        }),
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
    const categoriaMap = new Map<string, number>()
    mes.gastos.forEach((gasto) => {
      const categoria = gasto.categoria || 'Sin categoría'
      const actual = categoriaMap.get(categoria) || 0
      categoriaMap.set(categoria, actual + gasto.monto)
    })
    return Array.from(categoriaMap.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  if (!mes) {
    return null
  }

  const gastosPorCategoria = calcularGastosPorCategoria()
  const maxGastoCategoria = gastosPorCategoria.length > 0
    ? Math.max(...gastosPorCategoria.map(g => g.total))
    : 0

  const colores = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
  ]

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6" style={{ padding: '10px 15px' }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '15px' }}>
          <Button
            onClick={() => router.push(`/gestores/${mes.gestor.id}`)}
            variant="ghost"
            className="text-gray-700 dark:text-gray-300 font-semibold transition-colors"
            size="lg"
            style={{ padding: '10px' }}
          >
            <ArrowLeftIcon className="w-4 h-4 text-primary font-bold" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {new Date(mes.fechaInicio).toLocaleDateString('es-ES', {
              month: 'long',
              year: 'numeric',
            })}
          </h1>
        </div>

        {/* Card de Resumen */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700" style={{ padding: '15px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '5px' }}>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100" style={{ marginBottom: '5px' }}>{mes.gestor.nombre}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400" style={{ marginBottom: '5px' }}>
                {new Date(mes.fechaInicio).toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            {mes.cerrado && (
              <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full flex items-center gap-1">
                <LockClosedIcon className="w-4 h-4" />
                Cerrado
              </span>
            )}
          </div>

          {/* Cards de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2" style={{ padding: '10px 0' }}>
            <div className="bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between"
              style={{ background: 'linear-gradient(to bottom, #80EF80, #80EF80)', padding: '8px 15px' }}>
              <CurrencyDollarIcon className="w-6 h-6 opacity-90" />
              <p className="text-lg font-bold">${calcularTotalIngresos().toFixed(2)}</p>
            </div>
            <div className="bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between"
              style={{ background: 'linear-gradient(to bottom, #FF6B6B, #FF6B6B)', padding: '8px 15px' }}>
              <CurrencyDollarIcon className="w-6 h-6 opacity-90" />
              <p className="text-lg font-bold">${calcularTotalGastos().toFixed(2)}</p>
            </div>
            <div className={`bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between`}
              style={{ background: 'linear-gradient(to bottom, #64B5F6, #64B5F6)', padding: '8px 15px' }}>
              <ChartBarIcon className="w-6 h-6 opacity-90" />
              <p className="text-lg font-bold">${calcularBalance().toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        {!mes.cerrado && (
          <div className="flex gap-3" style={{ padding: '0 15px', marginTop: '10px' }}>
            <Button
              onClick={onOpen}
              variant="default"
              className="text-white font-semibold transition-colors flex-1"
              size="lg"
              style={{ padding: '10px 20px' }}
            >
              <PlusIcon className="w-5 h-5" />
              <span>Agregar</span>
            </Button>
            <Button
              onClick={() => setIsCerrarOpen(true)}
              variant="outline"
              className="text-gray-700 dark:text-gray-300 font-semibold transition-colors flex-1"
              size="lg"
              style={{ padding: '10px 20px' }}
            >
              Cerrar Mes
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 border border-gray-100 dark:border-gray-700"
          style={{ padding: '10px 15px', marginTop: '10px' }}>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('gastos')}
              className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all ${activeTab === 'gastos'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              Gastos ({mes.gastos.length})
            </button>
            <button
              onClick={() => setActiveTab('ingresos')}
              className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all ${activeTab === 'ingresos'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              Ingresos ({mes.ingresos.length})
            </button>
            <button
              onClick={() => setActiveTab('estadisticas')}
              className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all ${activeTab === 'estadisticas'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              Estadísticas
            </button>
          </div>
        </div>

        {/* Contenido de Tabs */}
        {activeTab === 'ingresos' && (
          <div className="space-y-3" style={{ marginTop: '15px' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 px-2">
              Ingresos ({mes.ingresos.length})
            </h2>
            {mes.ingresos.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
                <CurrencyDollarIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay ingresos registrados</p>
              </div>
            ) : (
              mes.ingresos.map((ingreso) => (
                <div
                  key={ingreso.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all"
                  style={{ padding: '10px 15px', marginBottom: '5px' }}
                >
                  <div className="flex items-center justify-between" >
                    <div className="flex-1">
                      <p className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">{ingreso.descripcion}</p>
                      <div className="">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">${ingreso.monto.toFixed(2)}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(ingreso.fecha).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {!mes.cerrado && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              abrirEditarIngreso(ingreso)
                            }}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar ingreso"
                          >
                            <PencilIcon className="w-5 h-5 text-blue-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              eliminarIngreso(ingreso.id)
                            }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar ingreso"
                          >
                            <TrashIcon className="w-5 h-5 text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'gastos' && (
          <div className="space-y-3" style={{ marginTop: '15px' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 px-2">
              Gastos ({mes.gastos.length})
            </h2>
            {mes.gastos.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
                <CurrencyDollarIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay gastos registrados</p>
              </div>
            ) : (
              mes.gastos.map((gasto) => (
                <div
                  key={gasto.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all"
                  style={{ padding: '10px 15px', marginBottom: '5px' }}
                >
                  <div className="flex items-center justify-between" >
                    <div className="flex-1">
                      <p className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">{gasto.descripcion}</p>
                      <div className="">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">${gasto.monto.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(gasto.fecha).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {gasto.categoria && (
                          <>
                            <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium">
                              {gasto.categoria}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!mes.cerrado && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              abrirEditarGasto(gasto)
                            }}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar gasto"
                          >
                            <PencilIcon className="w-5 h-5 text-blue-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              eliminarGasto(gasto.id)
                            }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar gasto"
                          >
                            <TrashIcon className="w-5 h-5 text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div className="space-y-3" style={{ marginTop: '15px' }}>
            {/* Gastos por Categoría */}
            {gastosPorCategoria.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700" style={{ padding: '15px' }}>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <ChartBarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  Gastos por Categoría
                </h3>
                <div className="space-y-4">
                  {gastosPorCategoria.map((item, index) => {
                    const porcentaje = maxGastoCategoria > 0 ? (item.total / maxGastoCategoria) * 100 : 0
                    const color = colores[index % colores.length]

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.categoria}
                          </span>
                          <span className="text-lg font-bold text-red-600 dark:text-red-400">
                            ${item.total.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {porcentaje.toFixed(1)}% del total de gastos
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
                <ChartBarIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay estadísticas disponibles</p>
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={isOpen}
          onClose={onClose}
          title={activeTab === 'ingresos' ? 'Agregar Ingreso' : 'Agregar Gasto'}
          footer={
            <>
              <button
                onClick={onClose}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px' }}
              >
                Cancelar
              </button>
              <button
                onClick={activeTab === 'ingresos' ? crearIngreso : crearGasto}
                className="hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px', backgroundColor: '#4F46E5' }}
              >
                Agregar
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label htmlFor="monto" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Monto
              </label>
              <input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                style={{ padding: '10px 15px' }}
              />
            </div>
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label htmlFor="descripcion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <input
                id="descripcion"
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                style={{ padding: '10px 15px' }}
              />
            </div>
            {activeTab === 'gastos' && (
              <div className="flex flex-col" style={{ gap: '8px' }}>
                <label htmlFor="categoria" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categoría (opcional)
                </label>
                <input
                  id="categoria"
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  style={{ padding: '10px 15px' }}
                />
              </div>
            )}
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label htmlFor="fecha" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha
              </label>
              <input
                id="fecha"
                type="datetime-local"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                style={{ padding: '10px 15px' }}
              />
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isCerrarOpen}
          onClose={() => setIsCerrarOpen(false)}
          title="Cerrar Mes"
          footer={
            <>
              <button
                onClick={() => setIsCerrarOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px' }}
              >
                Cancelar
              </button>
              <button
                onClick={cerrarMes}
                className="hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px', backgroundColor: '#4F46E5' }}
              >
                Cerrar Mes
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecciona la fecha de cierre del mes (fecha de tu próximo cobro)
            </p>
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label htmlFor="fechaCierre" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de Cierre
              </label>
              <input
                id="fechaCierre"
                type="datetime-local"
                value={fechaCierre}
                onChange={(e) => setFechaCierre(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                style={{ padding: '10px 15px' }}
              />
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isEditOpen}
          onClose={onEditClose}
          title={editingType === 'ingreso' ? 'Editar Ingreso' : 'Editar Gasto'}
          footer={
            <>
              <button
                onClick={onEditClose}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px' }}
              >
                Cancelar
              </button>
              <button
                onClick={editingType === 'ingreso' ? actualizarIngreso : actualizarGasto}
                className="hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px', backgroundColor: '#4F46E5' }}
              >
                Guardar
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label htmlFor="edit-monto" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Monto
              </label>
              <input
                id="edit-monto"
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                style={{ padding: '10px 15px' }}
              />
            </div>
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label htmlFor="edit-descripcion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <input
                id="edit-descripcion"
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                style={{ padding: '10px 15px' }}
              />
            </div>
            {editingType === 'gasto' && (
              <div className="flex flex-col" style={{ gap: '8px' }}>
                <label htmlFor="edit-categoria" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categoría (opcional)
                </label>
                <input
                  id="edit-categoria"
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  style={{ padding: '10px 15px' }}
                />
              </div>
            )}
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <label htmlFor="edit-fecha" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha
              </label>
              <input
                id="edit-fecha"
                type="datetime-local"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                style={{ padding: '10px 15px' }}
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
