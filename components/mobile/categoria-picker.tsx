'use client'

import {
  Home,
  Zap,
  ShoppingCart,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  HeartPulse,
  Gift,
  HandCoins,
  MoreHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

import { CATEGORIAS_GASTO, getCategoriaGasto, type CategoriaGasto } from '@/lib/finance/categorias'

const ICONOS: Record<CategoriaGasto['icono'], LucideIcon> = {
  home: Home,
  zap: Zap,
  cart: ShoppingCart,
  utensils: UtensilsCrossed,
  bag: ShoppingBag,
  car: Car,
  heart: HeartPulse,
  gift: Gift,
  coins: HandCoins,
  dots: MoreHorizontal,
}

export function CategoriaIcon({ nombre, className }: { nombre: string | null | undefined; className?: string }) {
  const cat = getCategoriaGasto(nombre)
  const Icon = cat ? ICONOS[cat.icono] : MoreHorizontal
  return <Icon className={className} />
}

/**
 * Selector de categoría de gasto: grilla de botones con ícono y ejemplos.
 * `value` vacío = automática (si `allowAuto`).
 */
export function CategoriaPicker({
  value,
  onChange,
  allowAuto = false,
  autoLabel = 'Automática',
  conTope = [],
}: {
  value: string
  onChange: (nombre: string) => void
  allowAuto?: boolean
  autoLabel?: string
  /** Categorías que tienen presupuesto, para marcarlas. */
  conTope?: string[]
}) {
  const seleccion = getCategoriaGasto(value)?.nombre ?? ''

  const base =
    'tap flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition'
  const on = 'border-primary bg-primary/10 text-primary'
  const off = 'border-border bg-background text-foreground'

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {allowAuto && (
          <button type="button" onClick={() => onChange('')} className={`${base} ${seleccion === '' ? on : off}`}>
            <Sparkles className="size-4 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold leading-tight">{autoLabel}</span>
              <span className="block truncate text-[11px] text-muted-foreground">Según la descripción</span>
            </span>
          </button>
        )}
        {CATEGORIAS_GASTO.map((c) => {
          const Icon = ICONOS[c.icono]
          const active = seleccion === c.nombre
          return (
            <button
              key={c.nombre}
              type="button"
              onClick={() => onChange(active && allowAuto ? '' : c.nombre)}
              className={`${base} ${active ? on : off}`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight">
                  {c.nombre}
                  {conTope.includes(c.nombre) && (
                    <span className="ml-1 rounded-full bg-expense/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-expense align-middle">
                      tope
                    </span>
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {seleccion && (
        <p className="px-1 text-xs text-muted-foreground">
          {getCategoriaGasto(seleccion)?.ejemplos}
        </p>
      )}
    </div>
  )
}
