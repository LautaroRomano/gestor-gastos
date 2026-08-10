'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format-currency'

/* Monto con cifras tabulares y tipografía display. */
export function Money({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  return (
    <span className={cn('tabular font-display', className)}>
      {formatCurrency(value)}
    </span>
  )
}

/* Tarjeta hero con el balance del período. Elemento de firma. */
export function BalanceHero({
  label,
  value,
  income,
  expense,
}: {
  label: string
  value: number
  income?: number
  expense?: number
}) {
  const positive = value >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl px-5 py-6 text-[var(--primary-foreground)] shadow-[0_20px_50px_-24px_oklch(0.44_0.088_162/0.7)]"
      style={{
        backgroundImage:
          'radial-gradient(120% 120% at 85% 0%, var(--hero-to) 0%, var(--hero-from) 60%)',
      }}
    >
      {/* textura sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-[0.14em] opacity-80">
          {label}
        </p>
        <p className="mt-2 flex items-baseline gap-1">
          <Money
            value={value}
            className="text-[2.6rem] font-bold leading-none tracking-tight"
          />
        </p>
        {(income !== undefined || expense !== undefined) && (
          <div className="mt-5 flex items-center gap-5 text-sm">
            {income !== undefined && (
              <span className="inline-flex items-center gap-1.5 opacity-95">
                <ArrowUpRight className="size-4" strokeWidth={2.5} />
                <Money value={income} className="font-semibold" />
              </span>
            )}
            {expense !== undefined && (
              <span className="inline-flex items-center gap-1.5 opacity-95">
                <ArrowDownLeft className="size-4" strokeWidth={2.5} />
                <Money value={expense} className="font-semibold" />
              </span>
            )}
            <span className="ml-auto text-xs opacity-70">
              {positive ? 'A favor' : 'En rojo'}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const STAT_STYLES = {
  income: {
    chip: 'bg-income/15 text-income',
    value: 'text-income',
    icon: <ArrowUpRight className="size-4" strokeWidth={2.5} />,
  },
  expense: {
    chip: 'bg-expense/15 text-expense',
    value: 'text-expense',
    icon: <ArrowDownLeft className="size-4" strokeWidth={2.5} />,
  },
  neutral: {
    chip: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
    icon: null,
  },
} as const

/* Tarjeta de estadística con etiqueta clara. */
export function StatCard({
  label,
  value,
  variant = 'neutral',
  className,
}: {
  label: string
  value: number
  variant?: keyof typeof STAT_STYLES
  className?: string
}) {
  const s = STAT_STYLES[variant]
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-3.5',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {s.icon && (
          <span className={cn('grid size-6 place-items-center rounded-full', s.chip)}>
            {s.icon}
          </span>
        )}
      </div>
      <Money value={value} className={cn('text-lg font-bold', s.value)} />
    </div>
  )
}

/* Fila de gasto por categoría con barra proporcional. */
export function CategoryBar({
  label,
  amount,
  ratio,
  percent,
  index = 0,
}: {
  label: string
  amount: number
  ratio: number
  percent: number
  index?: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium">{label}</span>
        <Money value={amount} className="shrink-0 text-sm font-bold text-expense" />
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(ratio, 0.02) }}
          transition={{ duration: 0.7, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'left' }}
          className="h-full rounded-full bg-gradient-to-r from-[var(--hero-from)] to-[var(--hero-to)]"
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {percent.toFixed(1)}% del total
      </p>
    </div>
  )
}
