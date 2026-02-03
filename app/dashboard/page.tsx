'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, WalletIcon, ArrowRightIcon, ChartBarIcon, CurrencyDollarIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import Modal from '../components/Modal'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Gestor {
  id: string
  nombre: string
  descripcion?: string
  usuarios: Array<{
    usuario: {
      id: string
      nombre: string
      email: string
    }
    rol: string
  }>
  meses?: Array<{
    ingresos: Array<{ monto: number }>
    gastos: Array<{ monto: number }>
  }>
}

export default function Dashboard() {
  const router = useRouter()
  const [gestores, setGestores] = useState<Gestor[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [nuevoGestor, setNuevoGestor] = useState({ nombre: '', descripcion: '' })

  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) {
        router.push('/')
        return
      }
      const userData = await userRes.json()
      setUser(userData)

      const gestoresRes = await fetch('/api/gestores')
      if (gestoresRes.ok) {
        const gestoresData = await gestoresRes.json()
        setGestores(gestoresData)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function calcularTotalGestor(gestor: Gestor) {
    if (!gestor.meses) return { ingresos: 0, gastos: 0, balance: 0 }
    const ingresos = gestor.meses.reduce((sum, mes) =>
      sum + mes.ingresos.reduce((s, ing) => s + ing.monto, 0), 0
    )
    const gastos = gestor.meses.reduce((sum, mes) =>
      sum + mes.gastos.reduce((s, gas) => s + gas.monto, 0), 0
    )
    return { ingresos, gastos, balance: ingresos - gastos }
  }

  async function crearGestor() {
    try {
      const res = await fetch('/api/gestores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoGestor),
      })

      if (res.ok) {
        const nuevo = await res.json()
        setGestores([...gestores, nuevo])
        setNuevoGestor({ nombre: '', descripcion: '' })
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al crear gestor')
      }
    } catch (error) {
      alert('Error al crear gestor')
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
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

  const totalIngresos = gestores.reduce((sum, g) => sum + calcularTotalGestor(g).ingresos, 0)
  const totalGastos = gestores.reduce((sum, g) => sum + calcularTotalGestor(g).gastos, 0)
  const balanceTotal = totalIngresos - totalGastos

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '15px' }}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <WalletIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              Mis Gestores
            </h1>
            {user && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                Hola, {user.nombre}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <LogOut className="w-6 h-6 text-primary" />
          </button>
        </div>

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">

          <div className="bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between"
            style={{ background: 'linear-gradient(to bottom, #80EF80, #80EF80)', padding: '8px 15px' }}>
            <CurrencyDollarIcon className="w-6 h-6 opacity-90" />
            <p className="text-lg font-bold">${totalIngresos.toFixed(2)}</p>
          </div>

          <div className="bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between"
            style={{ background: 'linear-gradient(to bottom, #FF6B6B, #FF6B6B)', padding: '8px 15px' }}>
            <CurrencyDollarIcon className="w-6 h-6 opacity-90" />
            <p className="text-lg font-bold">${totalGastos.toFixed(2)}</p>
          </div>

          <div className={`bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between`}
            style={{ background: 'linear-gradient(to bottom, #64B5F6, #64B5F6)', padding: '8px 15px' }}>
            <ChartBarIcon className="w-6 h-6 opacity-90" />
            <p className="text-lg font-bold">${balanceTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Lista de Gestores */}
        <div className="space-y-3 gap-4" style={{ padding: '15px', marginTop: '15px' }}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 px-2">
            Gestores
          </h2>
          {gestores.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center"
              style={{ padding: '15px' }}>
              <WalletIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No tienes gestores aún</p>
              <Button
                onClick={onOpen}
                variant="default"
                className="text-white font-semibold transition-colors"
                size="lg"
                style={{ padding: '10px 20px' }}
              >
                Crear tu primer gestor
              </Button>
            </div>
          ) : (
            gestores.map((gestor) => {
              return (
                <div
                  key={gestor.id}
                  onClick={() => router.push(`/gestores/${gestor.id}`)}
                  className='cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all border border-gray-300 dark:border-gray-700'
                  style={{ margin: '10px 0' }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: '10px' }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <WalletIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{gestor.nombre}</h3>
                        {gestor.descripcion && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{gestor.descripcion}</p>
                        )}
                      </div>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 justify-center" style={{ padding: '0 15px' }}>
          <Button
            onClick={onOpen}
            variant="default"
            className="text-white font-semibold transition-colors"
            size="lg"
            style={{ padding: '10px 20px', width: '100%' }}
          >
            <PlusIcon className="w-5 h-5" />
            <span>Crear Nuevo Gestor</span>
          </Button>

          <Button
            onClick={() => router.push('/unirse')}
            variant="outline"
            className="text-gray-700 dark:text-gray-300 font-semibold transition-colors"
            size="lg"
            style={{ padding: '10px 20px', width: '100%' }}
          >
            Unirse a un Gestor
          </Button>
        </div>

        <Modal
          isOpen={isOpen}
          onClose={onClose}
          title="Crear Nuevo Gestor"
          footer={
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={crearGestor}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
              >
                Crear
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="nombre" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={nuevoGestor.nombre}
                onChange={(e) => setNuevoGestor({ ...nuevoGestor, nombre: e.target.value })}
                autoFocus
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="descripcion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción (opcional)
              </label>
              <input
                id="descripcion"
                type="text"
                value={nuevoGestor.descripcion}
                onChange={(e) => setNuevoGestor({ ...nuevoGestor, descripcion: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
