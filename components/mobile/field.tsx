'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/* Clase base compartida para inputs dentro de los sheets. */
export const fieldClass =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15'

/* Etiqueta + control, con hint opcional. */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: React.ReactNode
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-sm font-medium text-foreground/90">{label}</span>
      )}
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}
