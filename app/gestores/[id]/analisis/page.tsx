'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sparkles, Loader2, TrendingUp, TrendingDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { Field, fieldClass } from '@/components/mobile/field'
import { formatCurrency } from '@/lib/format-currency'

interface Analisis {
  metrics: {
    totalIncome: number
    totalExpenses: number
    balance: number
    topCategories: { categoria: string; total: number }[]
  }
  prescindibles: { total: number; items: { descripcion: string; monto: number; motivo: string }[] }
  anomalias: { detalle: string }[]
  recomendacion: { ahorroRecomendado: number; detalle: string }
  aiDisponible: boolean
}

interface MesHist {
  id: string
  fechaInicio: string
}

interface Comparacion {
  categorias: { categoria: string; montoA: number; montoB: number; variacionPct: number | null }[]
  totalA: number
  totalB: number
  variacionTotalPct: number | null
}

export default function AnalisisPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [analisis, setAnalisis] = useState<Analisis | null>(null)
  const [meses, setMeses] = useState<MesHist[]>([])
  const [loading, setLoading] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [narrativa, setNarrativa] = useState<{ analisis: string; recomendaciones: string } | null>(null)
  const [mesA, setMesA] = useState('')
  const [mesB, setMesB] = useState('')
  const [comparacion, setComparacion] = useState<Comparacion | null>(null)

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
      if (gRes.ok) {
        const g = await gRes.json()
        const ms: MesHist[] = g.meses || []
        setMeses(ms)
        if (ms.length >= 2) {
          setMesB(ms[0].id)
          setMesA(ms[1].id)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function generarIA() {
    setGenerando(true)
    try {
      const res = await fetch(`/api/gestores/${id}/analisis`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) setNarrativa(data)
      else alert(data.message || data.error || 'No se pudo generar el análisis')
    } catch {
      alert('Error al generar el análisis')
    } finally {
      setGenerando(false)
    }
  }

  async function comparar() {
    if (!mesA || !mesB || mesA === mesB) {
      alert('Elegí dos meses distintos')
      return
    }
    try {
      const res = await fetch(`/api/gestores/${id}/comparacion?mesA=${mesA}&mesB=${mesB}`)
      const data = await res.json()
      if (res.ok) setComparacion(data)
      else alert(data.error || 'Error al comparar')
    } catch {
      alert('Error al comparar')
    }
  }

  const etiquetaMes = (f: string) =>
    new Date(f).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  if (loading) return <ScreenLoader />

  if (!analisis) {
    return (
      <Screen>
        <AppBar title="Análisis IA" onBack={() => router.push(`/gestores/${id}`)} />
        <Content>
          <EmptyState
            icon={<Sparkles className="size-6" />}
            title="Sin datos"
            description="Cargá movimientos para generar un análisis."
          />
        </Content>
      </Screen>
    )
  }

  const m = analisis.metrics

  return (
    <Screen>
      <AppBar title="Análisis IA" onBack={() => router.push(`/gestores/${id}`)} />
      <Content>
        {/* Narrativa IA */}
        <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h2 className="font-display text-base font-semibold">Análisis del mes</h2>
          </div>
          {narrativa ? (
            <div className="space-y-2 text-sm">
              <p>{narrativa.analisis}</p>
              <p className="text-muted-foreground">{narrativa.recomendaciones}</p>
            </div>
          ) : analisis.aiDisponible ? (
            <>
              <p className="text-sm text-muted-foreground">
                Generá una explicación en lenguaje natural de tu situación financiera del mes.
              </p>
              <Button onClick={generarIA} disabled={generando} className="h-10 rounded-xl">
                {generando ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {generando ? 'Generando…' : 'Generar análisis'}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              El análisis con IA no está configurado. Configurá <code>OPENAI_API_KEY</code> para habilitarlo. Las
              métricas de abajo se calculan igual sin IA.
            </p>
          )}
        </div>

        {/* Métricas base (siempre por código) */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border/70 bg-card p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Ingresos</p>
            <p className="tabular text-sm font-bold text-income">{formatCurrency(m.totalIncome)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Gastos</p>
            <p className="tabular text-sm font-bold text-expense">{formatCurrency(m.totalExpenses)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Balance</p>
            <p className="tabular text-sm font-bold">{formatCurrency(m.balance)}</p>
          </div>
        </div>

        {/* Recomendación de ahorro */}
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-sm font-semibold">Ahorro recomendado: {formatCurrency(analisis.recomendacion.ahorroRecomendado)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{analisis.recomendacion.detalle}</p>
        </div>

        {/* Prescindibles */}
        {analisis.prescindibles.items.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-sm font-semibold">Gastos prescindibles · {formatCurrency(analisis.prescindibles.total)}</p>
            {analisis.prescindibles.items.slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{p.descripcion}</span>
                <span className="shrink-0 font-semibold text-expense tabular">{formatCurrency(p.monto)}</span>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">Podrían ser prescindibles según tus hábitos.</p>
          </div>
        )}

        {/* Comparación de meses (spec §18) */}
        {meses.length >= 2 && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
            <h2 className="font-display text-base font-semibold">Comparar meses</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mes A">
                <select value={mesA} onChange={(e) => setMesA(e.target.value)} className={fieldClass}>
                  {meses.map((mm) => (
                    <option key={mm.id} value={mm.id}>
                      {etiquetaMes(mm.fechaInicio)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mes B">
                <select value={mesB} onChange={(e) => setMesB(e.target.value)} className={fieldClass}>
                  {meses.map((mm) => (
                    <option key={mm.id} value={mm.id}>
                      {etiquetaMes(mm.fechaInicio)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Button onClick={comparar} variant="outline" className="h-10 w-full rounded-xl">
              Comparar
            </Button>

            {comparacion && (
              <div className="space-y-2 pt-1">
                {comparacion.categorias.slice(0, 8).map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{c.categoria}</span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 font-semibold ${
                        c.variacionPct === null
                          ? 'text-muted-foreground'
                          : c.variacionPct > 0
                            ? 'text-expense'
                            : 'text-income'
                      }`}
                    >
                      {c.variacionPct !== null &&
                        (c.variacionPct > 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />)}
                      {c.variacionPct === null ? 'nuevo' : `${c.variacionPct > 0 ? '+' : ''}${c.variacionPct}%`}
                    </span>
                  </div>
                ))}
                {comparacion.variacionTotalPct !== null && (
                  <p className="border-t border-border/70 pt-2 text-sm font-semibold">
                    Total: {comparacion.variacionTotalPct > 0 ? '+' : ''}
                    {comparacion.variacionTotalPct}% ({formatCurrency(comparacion.totalA)} → {formatCurrency(comparacion.totalB)})
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Content>
    </Screen>
  )
}
