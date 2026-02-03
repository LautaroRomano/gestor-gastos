'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeftIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

interface Estadisticas {
  totalIngresos: number
  totalGastos: number
  balance: number
  gastosPorCategoria: Array<{ categoria: string; total: number }>
  promedioIngresos: number
  promedioGastos: number
  mesesAbiertos: number
  mesesCerrados: number
}

export default function EstadisticasPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEstadisticas()
  }, [id])

  async function loadEstadisticas() {
    try {
      const res = await fetch(`/api/gestores/${id}/estadisticas`)
      if (res.ok) {
        const data = await res.json()
        setEstadisticas(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
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

  if (!estadisticas) {
    return null
  }

  const maxGasto = estadisticas.gastosPorCategoria.length > 0
    ? Math.max(...estadisticas.gastosPorCategoria.map(g => g.total))
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
            onClick={() => router.push(`/gestores/${id}`)}
            variant="ghost"
            className="text-gray-700 dark:text-gray-300 font-semibold transition-colors"
            size="lg"
            style={{ padding: '10px' }}
          >
            <ArrowLeftIcon className="w-4 h-4 text-primary font-bold" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Estadísticas
          </h1>
        </div>

        {/* Cards de resumen principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2" style={{ padding: '10px 0' }}>
          <div className="bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between"
            style={{ background: 'linear-gradient(to bottom, #80EF80, #80EF80)', padding: '8px 15px' }}>
            <CurrencyDollarIcon className="w-6 h-6 opacity-90" />
            <p className="text-lg font-bold">${estadisticas.totalIngresos.toFixed(2)}</p>
          </div>

          <div className="bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between"
            style={{ background: 'linear-gradient(to bottom, #FF6B6B, #FF6B6B)', padding: '8px 15px' }}>
            <CurrencyDollarIcon className="w-6 h-6 opacity-90" />
            <p className="text-lg font-bold">${estadisticas.totalGastos.toFixed(2)}</p>
          </div>

          <div className={`bg-linear-to-br rounded-2xl shadow-xl p-5 text-gray-900 flex items-center justify-between`}
            style={{ background: 'linear-gradient(to bottom, #64B5F6, #64B5F6)', padding: '8px 15px' }}>
            <ChartBarIcon className="w-6 h-6 opacity-90" />
            <p className="text-lg font-bold">${estadisticas.balance.toFixed(2)}</p>
          </div>
        </div>

        {/* Promedios y Meses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
            style={{ padding: '15px' }}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Promedios
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Promedio Ingresos</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${estadisticas.promedioIngresos.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Promedio Gastos</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  ${estadisticas.promedioGastos.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gastos por Categoría */}
        {estadisticas.gastosPorCategoria.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700" style={{ padding: '15px', marginTop: '15px' }}>
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Gastos por Categoría
            </h2>
            <div className="space-y-4">
              {estadisticas.gastosPorCategoria.map((item, index) => {
                const porcentaje = maxGasto > 0 ? (item.total / maxGasto) * 100 : 0
                const color = colores[index % colores.length]

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {item.categoria || 'Sin categoría'}
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

        {estadisticas.gastosPorCategoria.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center"
            style={{ padding: '15px', marginTop: '15px' }}>
            <ChartBarIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No hay gastos por categoría registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}
