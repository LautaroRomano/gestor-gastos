'use client'

import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 800) onClose()
            }}
            className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card text-card-foreground shadow-2xl sm:rounded-3xl"
          >
            {/* Grabber */}
            <div className="flex shrink-0 justify-center pt-3 sm:hidden">
              <div className="h-1.5 w-11 rounded-full bg-border" />
            </div>

            <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-3">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="tap -mr-1 grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
              {children}
            </div>

            {footer && (
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 bg-card px-5 pb-safe pt-3">
                <div className="flex w-full items-center justify-end gap-2 pb-1">
                  {footer}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
