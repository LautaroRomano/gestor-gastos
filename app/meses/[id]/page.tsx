'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon, LockClosedIcon, ChartBarIcon, CurrencyDollarIcon, CalendarIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/Modal'

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
  const [activeTab, setActiveTab] = useState('ingresos')
  const [isOpen, setIsOpen] = useState(false)
  const [isCerrarOpen, setIsCerrarOpen] = useState(false)
  
  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/gestores/${mes.gestor.id}`)}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            {new Date(mes.fechaInicio).toLocaleDateString('es-ES', {
              month: 'long',
              year: 'numeric',
            })}
          </h1>
          <div className="w-24"></div>
        </div>

        {/* Card de Resumen */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{mes.gestor.nombre}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 opacity-90" />
                <span className="text-sm opacity-90">Ingresos</span>
              </div>
              <p className="text-2xl font-bold">${calcularTotalIngresos().toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-5 h-5 opacity-90" />
                <span className="text-sm opacity-90">Gastos</span>
              </div>
              <p className="text-2xl font-bold">${calcularTotalGastos().toFixed(2)}</p>
            </div>
            <div className={`bg-gradient-to-br ${calcularBalance() >= 0 ? 'from-indigo-500 to-blue-600' : 'from-orange-500 to-red-600'} rounded-xl shadow-lg p-4 text-white`}>
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-5 h-5 opacity-90" />
                <span className="text-sm opacity-90">Balance</span>
              </div>
              <p className="text-2xl font-bold">${calcularBalance().toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        {!mes.cerrado && (
          <div className="flex gap-3">
            <button
              onClick={onOpen}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Agregar</span>
            </button>
            <button
              onClick={() => setIsCerrarOpen(true)}
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg"
            >
              Cerrar Mes
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 border border-gray-100 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('ingresos')}
              className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all ${
                activeTab === 'ingresos'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Ingresos ({mes.ingresos.length})
            </button>
            <button
              onClick={() => setActiveTab('gastos')}
              className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all ${
                activeTab === 'gastos'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Gastos ({mes.gastos.length})
            </button>
          </div>
        </div>

        {/* Contenido de Tabs */}
        {activeTab === 'ingresos' && (
          <div className="space-y-3">
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
                <div key={ingreso.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">{ingreso.descripcion}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
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
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">${ingreso.monto.toFixed(2)}</p>
                      </div>
                      {!mes.cerrado && (
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
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'gastos' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 px-2 mb-3">
                Gastos ({mes.gastos.length})
              </h2>
              {mes.gastos.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
                  <CurrencyDollarIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No hay gastos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mes.gastos.map((gasto) => (
                    <div key={gasto.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">{gasto.descripcion}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <p>{new Date(gasto.fecha).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                            {gasto.categoria && (
                              <>
                                <span>•</span>
                                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium">
                                  {gasto.categoria}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">${gasto.monto.toFixed(2)}</p>
                          </div>
                          {!mes.cerrado && (
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
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gastos por Categoría */}
            {gastosPorCategoria.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
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
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={activeTab === 'ingresos' ? crearIngreso : crearGasto}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
              >
                Agregar
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
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
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="descripcion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <input
                id="descripcion"
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
            </div>
            {activeTab === 'gastos' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="categoria" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categoría (opcional)
                </label>
                <input
                  id="categoria"
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="fecha" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha
              </label>
              <input
                id="fecha"
                type="datetime-local"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
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
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={cerrarMes}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
              >
                Cerrar Mes
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecciona la fecha de cierre del mes (fecha de tu próximo cobro)
            </p>
            <div className="flex flex-col gap-2">
              <label htmlFor="fechaCierre" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fecha de Cierre
              </label>
              <input
                id="fechaCierre"
                type="datetime-local"
                value={fechaCierre}
                onChange={(e) => setFechaCierre(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
