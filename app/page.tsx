'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'

import { Loader2, Sparkles, Wallet } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isLogin, setIsLogin] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) router.push('/dashboard')
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-background">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-purple-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl w-full items-center justify-center px-4 py-12" style={{ padding: '10px 15px' }}>
        <div className="grid w-full gap-10 lg:grid-cols-2 lg:items-center">
          {/* Left / Hero */}
          <div className="hidden lg:flex flex-col gap-8" style={{ padding: '5px' }}>
            <Badge className="flex items-center gap-2" style={{ padding: '5px' }}>
              <Sparkles className="h-4 w-4" />
              Control simple, visión clara
            </Badge>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight">
              Gestor de Gastos
            </h1>

            <p className="mt-3 max-w-md text-base text-muted-foreground">
              Registrá ingresos y egresos, categorizá movimientos y seguí tu
              progreso con una interfaz limpia.
            </p>

            <div className="mt-8 rounded-2xl border bg-background/60 p-6 backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Todo en un solo lugar</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Panel con totales, métricas y últimos movimientos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Auth Card */}
          <div className="mx-auto w-full max-w-md">
            <Card className="" style={{ padding: '15px' }}>
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Bienvenido</CardTitle>
                    <CardDescription>
                      Iniciá sesión o creá una cuenta para continuar.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs
                  value={isLogin ? 'login' : 'register'}
                  onValueChange={(v) => setIsLogin(v === 'login')}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                    <TabsTrigger value="register">Registrarme</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-6">
                    <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
                  </TabsContent>

                  <TabsContent value="register" className="mt-6">
                    <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
                  </TabsContent>
                </Tabs>
              </CardContent>

              <CardFooter className="flex flex-col items-center gap-2 text-center">
                <p className="text-xs text-muted-foreground">
                  Gestiona tus ingresos y gastos de forma inteligente.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
