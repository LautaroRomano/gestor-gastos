'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BarChart3, TrendingUp, TrendingDown, CalendarClock, CalendarCheck } from 'lucide-react'

import { Screen, AppBar, Content, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { BalanceHero, Money, CategoryBar } from '@/components/mobile/money'

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

  if (loading) return <ScreenLoader />
  if (!estadisticas) return null

  const maxGasto =
    estadisticas.gastosPorCategoria.length > 0
      ? Math.max(...estadisticas.gastosPorCategoria.map((g) => g.total))
      : 0

  const tiles = [
    {
      label: 'Prom. ingresos',
      value: estadisticas.promedioIngresos,
      icon: <TrendingUp className="size-4" />,
      className: 'text-income',
      money: true,
    },
    {
      label: 'Prom. gastos',
      value: estadisticas.promedioGastos,
      icon: <TrendingDown className="size-4" />,
      className: 'text-expense',
      money: true,
    },
    {
      label: 'Meses abiertos',
      value: estadisticas.mesesAbiertos,
      icon: <CalendarClock className="size-4" />,
      className: 'text-foreground',
      money: false,
    },
    {
      label: 'Meses cerrados',
      value: estadisticas.mesesCerrados,
      icon: <CalendarCheck className="size-4" />,
      className: 'text-foreground',
      money: false,
    },
  ]

  return (
    <Screen>
      <AppBar title="Estadísticas" onBack={() => router.push(`/gestores/${id}`)} />

      <Content>
        <BalanceHero
          label="Resumen histórico"
          value={estadisticas.balance}
          income={estadisticas.totalIngresos}
          expense={estadisticas.totalGastos}
        />

        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{t.label}</span>
                <span className={`${t.className} opacity-80`}>{t.icon}</span>
              </div>
              {t.money ? (
                <Money value={t.value} className={`text-lg font-bold ${t.className}`} />
              ) : (
                <span className={`font-display text-lg font-bold tabular ${t.className}`}>
                  {t.value}
                </span>
              )}
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 px-1 font-display text-base font-semibold">
            <BarChart3 className="size-5 text-primary" />
            Gastos por categoría
          </h2>

          {estadisticas.gastosPorCategoria.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="size-6" />}
              title="Sin datos"
              description="No hay gastos por categoría registrados todavía."
            />
          ) : (
            <div className="space-y-5 rounded-2xl border border-border/70 bg-card p-4">
              {estadisticas.gastosPorCategoria.map((item, index) => (
                <CategoryBar
                  key={index}
                  label={item.categoria || 'Sin categoría'}
                  amount={item.total}
                  ratio={maxGasto > 0 ? item.total / maxGasto : 0}
                  percent={
                    estadisticas.totalGastos > 0
                      ? (item.total / estadisticas.totalGastos) * 100
                      : 0
                  }
                  index={index}
                />
              ))}
            </div>
          )}
        </section>
      </Content>
    </Screen>
  )
}
