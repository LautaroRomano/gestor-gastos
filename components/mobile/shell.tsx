'use client'

import * as React from 'react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Columna central tipo teléfono, ocupa toda la altura del viewport. */
export function Screen({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative mx-auto flex min-h-dvh w-full max-w-md flex-col',
        'md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-[2rem] md:border md:border-border/70 md:shadow-[0_30px_80px_-40px_oklch(0.3_0.03_80/0.5)]',
        'md:overflow-hidden md:bg-card/30',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* Barra superior fija con título grande, back opcional y slot derecho. */
export function AppBar({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  onBack?: () => void
  right?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 pt-safe">
      <div className="border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Volver"
              className="tap -ml-1.5 grid size-9 place-items-center rounded-full text-foreground/80 hover:bg-accent"
            >
              <ChevronLeft className="size-5" strokeWidth={2.5} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[1.35rem] font-semibold leading-tight tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {right}
        </div>
      </div>
    </header>
  )
}

/* Área de contenido con padding y espaciado consistentes. */
export function Content({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main className={cn('flex-1 space-y-6 px-4 pt-4 pb-8', className)}>
      {children}
    </main>
  )
}

/* Barra inferior fija para acciones primarias, con fade y safe-area. */
export function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 mt-auto">
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent" />
      <div className="relative bg-background/85 px-4 pt-3 pb-safe backdrop-blur-xl">
        <div className="flex gap-3 pb-3">{children}</div>
      </div>
    </div>
  )
}

/* Pantalla de carga a página completa. */
export function ScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-7 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Cargando…</span>
      </div>
    </div>
  )
}

/* Estado vacío reutilizable. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="font-display text-base font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-[24ch] text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
