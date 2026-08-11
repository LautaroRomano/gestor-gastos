'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar } from '@/components/mobile/shell'
import { Field, fieldClass } from '@/components/mobile/field'

export default function UnirsePage() {
  const router = useRouter()
  const [gestorId, setGestorId] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUnirse() {
    if (!gestorId.trim()) {
      alert('Por favor ingresa el ID del gestor')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/gestores/${gestorId}/unirse`, { method: 'POST' })
      if (res.ok) {
        alert('Te has unido al gestor exitosamente')
        router.push(`/gestores/${gestorId}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Error al unirse al gestor')
      }
    } catch (error) {
      alert('Error al unirse al gestor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <AppBar title="Unirse a un gestor" onBack={() => router.back()} />

      <Content>
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card px-6 py-8 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Users className="size-7" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Unite con un ID</h2>
            <p className="mt-1 max-w-[30ch] text-sm text-muted-foreground">
              Pedile a quien administra el gestor el ID para invitar y pegalo acá.
            </p>
          </div>
        </div>

        <Field label="ID del gestor">
          <input
            type="text"
            value={gestorId}
            onChange={(e) => setGestorId(e.target.value)}
            placeholder="Pegá el ID acá"
            className={`${fieldClass} font-mono`}
            autoFocus
          />
        </Field>
      </Content>

      <BottomBar>
        <Button
          onClick={handleUnirse}
          disabled={loading}
          className="h-12 flex-1 rounded-2xl text-[15px]"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Uniéndose…
            </>
          ) : (
            'Unirse'
          )}
        </Button>
      </BottomBar>
    </Screen>
  )
}
