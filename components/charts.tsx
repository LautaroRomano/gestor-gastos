'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/format-currency'

// Paleta categórica de orden fijo (validada con el validador de dataviz en modo
// claro). La identidad nunca se apoya solo en color: los charts llevan siempre
// etiqueta directa + leyenda (codificación secundaria).
export const CATEGORICAL = ['#0E8A5F', '#E0553B', '#E0A11A', '#1E9E9E', '#B34AA0', '#3E63D0']

const AXIS = 'var(--muted-foreground)'
const GRID = 'var(--border)'

function tooltipStyle(): React.CSSProperties {
  return {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    fontSize: 12,
    color: 'var(--foreground)',
  }
}

const fmt = (v: number) => formatCurrency(v)
const fmtCorto = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)

export function ChartCard({
  title,
  children,
  hint,
}: {
  title: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

/* Gastos por categoría — dona con leyenda (spec §17). */
export function CategoriaChart({ data }: { data: { categoria: string; total: number }[] }) {
  if (data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="categoria"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle()} formatter={(v) => fmt(Number(v))} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

/* Ingresos vs gastos por mes (spec §17). */
export function IngresoGastoChart({
  data,
}: {
  data: { mes: string; ingresos: number; gastos: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtCorto} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={38} />
        <Tooltip contentStyle={tooltipStyle()} formatter={(v) => fmt(Number(v))} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
        <Bar dataKey="ingresos" name="Ingresos" fill="var(--income)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="gastos" name="Gastos" fill="var(--expense)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* Serie temporal de una sola métrica (gastos diarios, evolución del ahorro). */
export function SerieChart({
  data,
  color = 'var(--primary)',
  height = 200,
}: {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: AXIS }} axisLine={false} tickLine={false} minTickGap={16} />
        <YAxis tickFormatter={fmtCorto} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={38} />
        <Tooltip contentStyle={tooltipStyle()} formatter={(v) => fmt(Number(v))} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

/* Presupuesto vs consumo por categoría — barras apiladas horizontales (spec §17). */
export function PresupuestoChart({
  data,
}: {
  data: { categoria: string; presupuesto: number; consumo: number }[]
}) {
  if (data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tickFormatter={fmtCorto} tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11, fill: AXIS }} axisLine={false} tickLine={false} width={90} />
        <Tooltip contentStyle={tooltipStyle()} formatter={(v) => fmt(Number(v))} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
        <Bar dataKey="presupuesto" name="Presupuesto" fill="var(--muted-foreground)" radius={4} barSize={10} />
        <Bar dataKey="consumo" name="Consumo" fill="var(--expense)" radius={4} barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  )
}
