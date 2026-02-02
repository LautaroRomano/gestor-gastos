'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, PlusIcon, CalendarIcon, LockClosedIcon, LockOpenIcon, ClipboardIcon, CheckIcon, ChartBarIcon, CurrencyDollarIcon, WalletIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/Modal'

interface Mes {
  id: string
  fechaInicio: string
  fechaCierre?: string
  cerrado: boolean
  ingresos: Array<{ monto: number }>
  gastos: Array<{ monto: number }>
}

interface Gestor {
  id: string
  nombre: string
  descripcion?: string
  meses: Mes[]
}

export default function GestorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [gestor, setGestor] = useState<Gestor | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [nuevoMes, setNuevoMes] = useState({ fechaInicio: '' })
  const [copied, setCopied] = useState(false)
  
  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)

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
      const res = await fetch(`/api/gestores/${id}/meses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaInicio: nuevoMes.fechaInicio || new Date().toISOString(),
        }),
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
      // Fallback para navegadores que no soportan clipboard API
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

  if (!gestor) {
    return null
  }

  const estadisticas = calcularEstadisticasGestor()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <WalletIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            {gestor.nombre}
          </h1>
          <div className="w-24"></div>
        </div>

        {/* Card del Gestor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{gestor.nombre}</h2>
              {gestor.descripcion && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {gestor.descripcion}
                </p>
              )}
            </div>
            <button
              onClick={copiarIdGestor}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Copiar ID del gestor"
            >
              {copied ? (
                <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <ClipboardIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID del Gestor:</span>
            <code className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 flex-1">
              {id}
            </code>
            <button
              onClick={copiarIdGestor}
              className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Estadísticas Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyDollarIcon className="w-6 h-6 opacity-90" />
              <span className="text-sm opacity-90">Total Ingresos</span>
            </div>
            <p className="text-2xl font-bold">${estadisticas.ingresos.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyDollarIcon className="w-6 h-6 opacity-90" />
              <span className="text-sm opacity-90">Total Gastos</span>
            </div>
            <p className="text-2xl font-bold">${estadisticas.gastos.toFixed(2)}</p>
          </div>
          <div className={`bg-gradient-to-br ${estadisticas.balance >= 0 ? 'from-indigo-500 to-blue-600' : 'from-orange-500 to-red-600'} rounded-2xl shadow-xl p-5 text-white`}>
            <div className="flex items-center gap-2 mb-2">
              <ChartBarIcon className="w-6 h-6 opacity-90" />
              <span className="text-sm opacity-90">Balance</span>
            </div>
            <p className="text-2xl font-bold">${estadisticas.balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <button
            onClick={onOpen}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nuevo Mes</span>
          </button>
          <button
            onClick={() => router.push(`/gestores/${id}/estadisticas`)}
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Estadísticas</span>
          </button>
        </div>

        {/* Lista de Meses */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 px-2">
            Meses ({gestor.meses.length})
          </h2>
          {gestor.meses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
              <CalendarIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No hay meses registrados</p>
              <button
                onClick={onOpen}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Crear primer mes
              </button>
            </div>
          ) : (
            gestor.meses.map((mes) => {
              const ingresos = calcularTotalIngresos(mes)
              const gastos = calcularTotalGastos(mes)
              const balance = calcularBalance(mes)

              return (
                <div
                  key={mes.id}
                  onClick={() => router.push(`/meses/${mes.id}`)}
                  className="cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all p-5 border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-3 rounded-xl ${mes.cerrado ? 'bg-gray-100 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-900/30'}`}>
                        <CalendarIcon className={`w-6 h-6 ${mes.cerrado ? 'text-gray-600 dark:text-gray-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                            {new Date(mes.fechaInicio).toLocaleDateString('es-ES', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </h3>
                          {mes.cerrado ? (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full flex items-center gap-1">
                              <LockClosedIcon className="w-3 h-3" />
                              Cerrado
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1">
                              <LockOpenIcon className="w-3 h-3" />
                              Abierto
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ingresos</p>
                            <p className="font-bold text-green-600 dark:text-green-400">${ingresos.toFixed(2)}</p>
                          </div>
                          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gastos</p>
                            <p className="font-bold text-red-600 dark:text-red-400">${gastos.toFixed(2)}</p>
                          </div>
                          <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Balance</p>
                            <p className={`font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              ${balance.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <Modal
          isOpen={isOpen}
          onClose={onClose}
          title="Crear Nuevo Mes"
          footer={
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={crearMes}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
              >
                Crear
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="fechaInicio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha de Inicio
            </label>
            <input
              id="fechaInicio"
              type="datetime-local"
              value={nuevoMes.fechaInicio}
              onChange={(e) => setNuevoMes({ fechaInicio: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            />
          </div>
        </Modal>
      </div>
    </div>
  )
}
