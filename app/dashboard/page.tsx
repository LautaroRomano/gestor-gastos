'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Wallet, LogOut, ChevronRight, Users } from 'lucide-react'

import Modal from '../components/Modal'
import { InstallAppButton } from '../components/InstallAppButton'
import { Button } from '@/components/ui/button'
import { Screen, AppBar, Content, BottomBar, ScreenLoader, EmptyState } from '@/components/mobile/shell'
import { BalanceHero, Money } from '@/components/mobile/money'
import { Field, fieldClass } from '@/components/mobile/field'

interface Gestor {
  id: string
  nombre: string
  descripcion?: string
  usuarios: Array<{
    usuario: { id: string; nombre: string; email: string }
    rol: string
  }>
  meses?: Array<{
    ingresos: Array<{ monto: number }>
    gastos: Array<{ monto: number }>
  }>
}

export default function Dashboard() {
  const router = useRouter()
  const [gestores, setGestores] = useState<Gestor[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [nuevoGestor, setNuevoGestor] = useState({ nombre: '', descripcion: '' })

  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const userRes = await fetch('/api/auth/me')
      if (!userRes.ok) {
        router.push('/')
        return
      }
      const userData = await userRes.json()
      setUser(userData)

      const gestoresRes = await fetch('/api/gestores')
      if (gestoresRes.ok) {
        const gestoresData = await gestoresRes.json()
        setGestores(gestoresData)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function calcularTotalGestor(gestor: Gestor) {
    if (!gestor.meses) return { ingresos: 0, gastos: 0, balance: 0 }
    const ingresos = gestor.meses.reduce(
      (sum, mes) => sum + mes.ingresos.reduce((s, ing) => s + ing.monto, 0),
      0,
    )
    const gastos = gestor.meses.reduce(
      (sum, mes) => sum + mes.gastos.reduce((s, gas) => s + gas.monto, 0),
      0,
    )
    return { ingresos, gastos, balance: ingresos - gastos }
  }

  async function crearGestor() {
    try {
      const res = await fetch('/api/gestores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoGestor),
      })

      if (res.ok) {
        const nuevo = await res.json()
        setGestores([...gestores, nuevo])
        setNuevoGestor({ nombre: '', descripcion: '' })
        onClose()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al crear gestor')
      }
    } catch (error) {
      alert('Error al crear gestor')
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    try {
      localStorage.removeItem('lastMesId')
      localStorage.removeItem('lastGestorId')
    } catch {
      // noop
    }
    router.push('/')
    router.refresh()
  }

  if (loading) return <ScreenLoader />

  const totalIngresos = gestores.reduce((sum, g) => sum + calcularTotalGestor(g).ingresos, 0)
  const totalGastos = gestores.reduce((sum, g) => sum + calcularTotalGestor(g).gastos, 0)
  const balanceTotal = totalIngresos - totalGastos

  return (
    <Screen>
      <AppBar
        title="Mis gestores"
        subtitle={user ? `Hola, ${user.nombre}` : undefined}
        right={
          <div className="flex items-center gap-1">
            <InstallAppButton variant="compact" />
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="tap grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        }
      />

      <Content>
        <BalanceHero
          label="Balance total"
          value={balanceTotal}
          income={totalIngresos}
          expense={totalGastos}
        />

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-base font-semibold">Gestores</h2>
            <span className="text-xs text-muted-foreground">{gestores.length}</span>
          </div>

          {gestores.length === 0 ? (
            <EmptyState
              icon={<Wallet className="size-6" />}
              title="Todavía no tenés gestores"
              description="Creá tu primer gestor para empezar a registrar movimientos."
              action={
                <Button onClick={onOpen} className="h-11 rounded-xl px-5">
                  Crear mi primer gestor
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {gestores.map((gestor, i) => {
                const { balance } = calcularTotalGestor(gestor)
                const miembros = gestor.usuarios?.length ?? 0
                return (
                  <motion.button
                    key={gestor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => router.push(`/gestores/${gestor.id}`)}
                    className="tap flex w-full items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3.5 text-left"
                  >
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <Wallet className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{gestor.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {gestor.descripcion || (
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3" />
                            {miembros} {miembros === 1 ? 'miembro' : 'miembros'}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <div className="text-right">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Balance
                        </p>
                        <Money
                          value={balance}
                          className={`text-sm font-bold ${
                            balance < 0 ? 'text-expense' : 'text-foreground'
                          }`}
                        />
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </section>
      </Content>

      <BottomBar>
        <Button onClick={onOpen} className="h-12 flex-1 rounded-2xl text-[15px]">
          <Plus className="size-5" />
          Nuevo gestor
        </Button>
        <Button
          onClick={() => router.push('/unirse')}
          variant="outline"
          className="h-12 flex-1 rounded-2xl text-[15px]"
        >
          <Users className="size-5" />
          Unirse
        </Button>
      </BottomBar>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Nuevo gestor"
        footer={
          <>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="h-11 rounded-xl px-6" onClick={crearGestor}>
              Crear
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <Field label="Nombre">
            <input
              type="text"
              value={nuevoGestor.nombre}
              onChange={(e) => setNuevoGestor({ ...nuevoGestor, nombre: e.target.value })}
              autoFocus
              placeholder="Ej. Gastos del hogar"
              className={fieldClass}
            />
          </Field>
          <Field label="Descripción" hint="Opcional">
            <input
              type="text"
              value={nuevoGestor.descripcion}
              onChange={(e) =>
                setNuevoGestor({ ...nuevoGestor, descripcion: e.target.value })
              }
              placeholder="Una nota breve"
              className={fieldClass}
            />
          </Field>
        </div>
      </Modal>
    </Screen>
  )
}
