'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sparkles, AlertTriangle, TrendingDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { BalanceHero, StatCard } from '@/components/mobile/money'
import { formatCurrency } from '@/lib/format-currency'
import { ChartCard, CategoriaChart, IngresoGastoChart, SerieChart, PresupuestoChart } from '@/components/charts'

interface Metrics {
  totalIncome: number
  totalExpenses: number
  balance: number
  ahorroReal: number
  porcentajeAhorrado: number
  dineroDisponible: number
  averageDailyExpense: number
  gastoDiarioRecomendado: number
  projectedEndBalance: number
  diasRestantes: number
  fechaEstimadaSinDinero: string | null
  topCategories: { categoria: string; total: number; porcentaje: number }[]
  extraordinaryExpenses: number
}

interface Analisis {
  metrics: Metrics
  prescindibles: { total: number; items: { descripcion: string; monto: number }[] }
  anomalias: { detalle: string }[]
  recomendacion: { ahorroRecomendado: number; detalle: string }
  presupuestos: { categoria: string; presupuesto: number; consumo: number; porcentaje: number }[]
}

interface MesHist {
  id: string
  fechaInicio: string
  ingresos: { monto: number }[]
  gastos: { monto: number }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [analisis, setAnalisis] = useState<Analisis | null>(null)
  const [meses, setMeses] = useState<MesHist[]>([])
  const [loading, setLoading] = useState(true)
  const [sinMeses, setSinMeses] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    try {
      const [aRes, gRes] = await Promise.all([
        fetch(`/api/gestores/${id}/analisis`),
        fetch(`/api/gestores/${id}`),
      ])
      if (aRes.ok) setAnalisis(await aRes.json())
      else if (aRes.status === 404) setSinMeses(true)
      if (gRes.ok) {
        const g = await gRes.json()
        setMeses(g.meses || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <ScreenLoader />

  if (sinMeses || !analisis) {
    return (
      <Screen>
        <AppBar title="Dashboard" onBack={() => router.push(`/gestores/${id}`)} />
        <Content>
          <EmptyState
            icon={<Sparkles className="size-6" />}
            title="Sin datos todavía"
            description="Creá un mes y cargá algunos movimientos para ver tu análisis."
            action={
              <Button className="h-11 rounded-xl px-5" onClick={() => router.push(`/gestores/${id}`)}>
                Ir al gestor
              </Button>
            }
          />
        </Content>
      </Screen>
    )
  }

  const m = analisis.metrics

  // Series históricas (orden cronológico)
  const histOrdenado = [...meses].sort(
    (a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime(),
  )
  const etiquetaMes = (f: string) =>
    new Date(f).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
  const ingresoGastoData = histOrdenado.map((mes) => ({
    mes: etiquetaMes(mes.fechaInicio),
    ingresos: mes.ingresos.reduce((s, x) => s + x.monto, 0),
    gastos: mes.gastos.reduce((s, x) => s + x.monto, 0),
  }))
  const ahorroData = histOrdenado.map((mes) => ({
    label: etiquetaMes(mes.fechaInicio),
    value:
      mes.ingresos.reduce((s, x) => s + x.monto, 0) - mes.gastos.reduce((s, x) => s + x.monto, 0),
  }))

  const topCats = m.topCategories.slice(0, 6).map((c) => ({ categoria: c.categoria, total: c.total }))

  return (
    <Screen>
      <AppBar
        title="Dashboard"
        onBack={() => router.push(`/gestores/${id}`)}
        right={
          <button
            onClick={() => router.push(`/gestores/${id}/analisis`)}
            aria-label="Análisis IA"
            className="tap grid size-9 place-items-center rounded-full text-primary hover:bg-accent"
          >
            <Sparkles className="size-[18px]" />
          </button>
        }
      />

      <Content>
        <BalanceHero label="Balance del mes" value={m.balance} income={m.totalIncome} expense={m.totalExpenses} />

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Ingresos" value={m.totalIncome} variant="income" />
          <StatCard label="Gastos" value={m.totalExpenses} variant="expense" />
          <StatCard label="Ahorro real" value={m.ahorroReal} variant={m.ahorroReal >= 0 ? 'income' : 'expense'} />
          <StatCard label="Disponible" value={m.dineroDisponible} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-card p-3.5">
            <span className="text-xs font-medium text-muted-foreground">% ahorrado</span>
            <span className="font-display text-lg font-bold">{m.porcentajeAhorrado}%</span>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-card p-3.5">
            <span className="text-xs font-medium text-muted-foreground">Gasto diario prom.</span>
            <span className="font-display text-lg font-bold tabular">{formatCurrency(m.averageDailyExpense)}</span>
          </div>
        </div>

        {/* Proyección de cierre (spec §7, §233) */}
        <div className="space-y-1 rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-sm font-semibold">Proyección de cierre</p>
          <p className="text-sm text-muted-foreground">
            Saldo proyectado a fin de mes:{' '}
            <span className={`font-semibold ${m.projectedEndBalance < 0 ? 'text-expense' : 'text-foreground'}`}>
              {formatCurrency(m.projectedEndBalance)}
            </span>
            .
          </p>
          <p className="text-sm text-muted-foreground">
            Podés gastar ~{formatCurrency(m.gastoDiarioRecomendado)} por día ({m.diasRestantes} días restantes).
          </p>
          {m.fechaEstimadaSinDinero && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-expense">
              <TrendingDown className="size-4" />
              Al ritmo actual, te quedarías sin disponible antes del{' '}
              {new Date(m.fechaEstimadaSinDinero).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}.
            </p>
          )}
        </div>

        {/* Recomendación de ahorro (spec §8) */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary">Ahorro recomendado</p>
          <p className="mt-1 font-display text-2xl font-bold tabular">
            {formatCurrency(analisis.recomendacion.ahorroRecomendado)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{analisis.recomendacion.detalle}</p>
        </div>

        {/* Anomalías (spec §6) */}
        {analisis.anomalias.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4 text-[var(--expense)]" />
              Cosas para mirar
            </p>
            {analisis.anomalias.slice(0, 4).map((a, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                • {a.detalle}
              </p>
            ))}
          </div>
        )}

        {topCats.length > 0 && (
          <ChartCard title="Gastos por categoría">
            <CategoriaChart data={topCats} />
          </ChartCard>
        )}

        {ingresoGastoData.length > 0 && (
          <ChartCard title="Ingresos vs gastos" hint="Por mes">
            <IngresoGastoChart data={ingresoGastoData} />
          </ChartCard>
        )}

        {ahorroData.length > 1 && (
          <ChartCard title="Evolución del ahorro" hint="Balance por mes">
            <SerieChart data={ahorroData} />
          </ChartCard>
        )}

        {analisis.presupuestos.length > 0 && (
          <ChartCard title="Presupuesto vs consumo">
            <PresupuestoChart data={analisis.presupuestos} />
          </ChartCard>
        )}

        {/* Gastos prescindibles (spec §5) */}
        {analisis.prescindibles.items.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold">Gastos potencialmente prescindibles</p>
            <p className="text-xs text-muted-foreground">
              Detectamos {formatCurrency(analisis.prescindibles.total)} que podrían reducirse según tus hábitos.
            </p>
            <div className="mt-1 space-y-1.5">
              {analisis.prescindibles.items.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{p.descripcion}</span>
                  <span className="shrink-0 font-semibold text-expense tabular">{formatCurrency(p.monto)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Content>
    </Screen>
  )
}
