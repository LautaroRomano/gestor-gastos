'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, PlusIcon, CalendarIcon, LockClosedIcon, LockOpenIcon, ClipboardIcon, CheckIcon, ChartBarIcon, CurrencyDollarIcon, WalletIcon, PencilIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/Modal'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'

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

  function abrirEditarGestor() {
    if (!gestor) return
    setEditGestorData({
      nombre: gestor.nombre,
      descripcion: gestor.descripcion || '',
    })
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
        body: JSON.stringify({
          fechaInicio: new Date(nuevoMes.fechaInicio).toISOString(),
        }),
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
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6" style={{ padding: '10px 15px' }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '15px' }}>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="text-gray-700 dark:text-gray-300 font-semibold transition-colors"
            size="lg"
            style={{ padding: '10px' }}
          >
            <ArrowLeftIcon className="w-4 h-4 text-primary font-bold" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {gestor.nombre}
          </h1>
        </div>

        {/* Card del Gestor */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700" style={{ padding: '15px' }}>

          <div className="flex items-start justify-between" style={{ marginBottom: '5px' }}>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100" style={{ marginBottom: '5px' }} >{gestor.nombre}</h2>
              {gestor.descripcion && (
                <p className="text-sm text-gray-600 dark:text-gray-400" style={{ marginBottom: '5px' }}>
                  {gestor.descripcion}
                </p>
              )}
            </div>
            <button
              onClick={abrirEditarGestor}
              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Editar gestor"
            >
              <PencilIcon className="w-5 h-5 text-blue-500" />
            </button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID del Gestor:</span>
            <code className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 flex-1">
              {id}
            </code>
            <Button
              variant="ghost"
              className="text-gray-700 dark:text-gray-300 font-extrabold transition-colors"
              size="lg"
              style={{ padding: '10px' }}
              onClick={copiarIdGestor}
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <ClipboardIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Estadísticas Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2" style={{ padding: '10px 0' }}>
          <div className="bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between"
            style={{ background: 'linear-gradient(to bottom, #80EF80, #80EF80)', padding: '8px 15px' }}>
            <CurrencyDollarIcon className="w-6 h-6 opacity-90" />
            <p className="text-lg font-bold">${estadisticas.ingresos.toFixed(2)}</p>
          </div>

          <div className="bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between"
            style={{ background: 'linear-gradient(to bottom, #FF6B6B, #FF6B6B)', padding: '8px 15px' }}>
            <CurrencyDollarIcon className="w-6 h-6 opacity-90" />
            <p className="text-lg font-bold">${estadisticas.gastos.toFixed(2)}</p>
          </div>

          <div className={`bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between`}
            style={{ background: 'linear-gradient(to bottom, #64B5F6, #64B5F6)', padding: '8px 15px' }}>
            <ChartBarIcon className="w-6 h-6 opacity-90" />
            <p className="text-lg font-bold">${estadisticas.balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-3" style={{ padding: '0 15px' }}>
          <Button
            onClick={onOpen}
            variant="default"
            className="text-white font-semibold transition-colors flex-1"
            size="lg"
            style={{ padding: '10px 20px' }}
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nuevo Mes</span>
          </Button>
          <Button
            onClick={() => router.push(`/gestores/${id}/estadisticas`)}
            variant="outline"
            className="text-gray-700 dark:text-gray-300 font-semibold transition-colors flex-1"
            size="lg"
            style={{ padding: '10px 20px' }}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Estadísticas</span>
          </Button>
        </div>

        {/* Lista de Meses */}
        <div className="space-y-3 gap-4" style={{ padding: '10px 15px', marginTop: '15px' }}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 px-2">
            Meses ({gestor.meses.length})
          </h2>
          {gestor.meses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center"
              style={{ padding: '15px' }}>
              <CalendarIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No hay meses registrados</p>
              <Button
                onClick={onOpen}
                variant="default"
                className="text-white font-semibold transition-colors"
                size="lg"
                style={{ padding: '10px 20px' }}
              >
                Crear primer mes
              </Button>
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
                  className='cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all border border-gray-300 dark:border-gray-700'
                  style={{ margin: '10px 0' }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: '10px' }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                          {new Date(mes.fechaInicio).toLocaleDateString('es-ES', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {mes.cerrado ? 'Cerrado' : 'Abierto'}
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-gray-400" />
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
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px' }}
              >
                Cancelar
              </button>
              <button
                onClick={crearMes}
                className="hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px', backgroundColor: '#4F46E5' }}
              >
                Crear
              </button>
            </>
          }
        >
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <label htmlFor="fechaInicio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha de Inicio
            </label>
            <input
              id="fechaInicio"
              type="datetime-local"
              value={nuevoMes.fechaInicio}
              onChange={(e) => setNuevoMes({ fechaInicio: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              style={{ padding: '10px 15px' }}
            />
          </div>
        </Modal>

        <Modal
          isOpen={isEditGestorOpen}
          onClose={onEditGestorClose}
          title="Editar Gestor"
          footer={
            <>
              <button
                onClick={onEditGestorClose}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px' }}
              >
                Cancelar
              </button>
              <button
                onClick={actualizarGestor}
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
              <label htmlFor="edit-nombre" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                id="edit-nombre"
                type="text"
                value={editGestorData.nombre}
                onChange={(e) => setEditGestorData({ ...editGestorData, nombre: e.target.value })}
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
                value={editGestorData.descripcion}
                onChange={(e) => setEditGestorData({ ...editGestorData, descripcion: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                style={{ padding: '10px 15px' }}
              />
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isEditMesOpen}
          onClose={onEditMesClose}
          title="Editar Mes"
          footer={
            <>
              <button
                onClick={onEditMesClose}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px' }}
              >
                Cancelar
              </button>
              <button
                onClick={actualizarMes}
                className="hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px', backgroundColor: '#4F46E5' }}
              >
                Guardar
              </button>
            </>
          }
        >
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <label htmlFor="edit-fechaInicio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha de Inicio
            </label>
            <input
              id="edit-fechaInicio"
              type="datetime-local"
              value={nuevoMes.fechaInicio}
              onChange={(e) => setNuevoMes({ fechaInicio: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              style={{ padding: '10px 15px' }}
            />
          </div>
        </Modal>

        <Modal
          isOpen={isEditGestorOpen}
          onClose={onEditGestorClose}
          title="Editar Gestor"
          footer={
            <>
              <button
                onClick={onEditGestorClose}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px' }}
              >
                Cancelar
              </button>
              <button
                onClick={actualizarGestor}
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
              <label htmlFor="edit-nombre" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                id="edit-nombre"
                type="text"
                value={editGestorData.nombre}
                onChange={(e) => setEditGestorData({ ...editGestorData, nombre: e.target.value })}
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
                value={editGestorData.descripcion}
                onChange={(e) => setEditGestorData({ ...editGestorData, descripcion: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                style={{ padding: '10px 15px' }}
              />
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isEditMesOpen}
          onClose={onEditMesClose}
          title="Editar Mes"
          footer={
            <>
              <button
                onClick={onEditMesClose}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px' }}
              >
                Cancelar
              </button>
              <button
                onClick={actualizarMes}
                className="hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                style={{ padding: '10px 20px', backgroundColor: '#4F46E5' }}
              >
                Guardar
              </button>
            </>
          }
        >
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <label htmlFor="edit-fechaInicio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha de Inicio
            </label>
            <input
              id="edit-fechaInicio"
              type="datetime-local"
              value={nuevoMes.fechaInicio}
              onChange={(e) => setNuevoMes({ fechaInicio: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              style={{ padding: '10px 15px' }}
            />
          </div>
        </Modal>

      </div>
    </div>
  )
}
