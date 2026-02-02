'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WalletIcon } from '@heroicons/react/24/outline'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'

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
      if (res.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      // No autenticado
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-4 sm:p-6 gap-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
          <WalletIcon className="w-12 h-12 text-white" />
        </div>
        <div>
          <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">
            Gestor de Gastos
          </h1>
          <p className="text-white/90 text-base font-medium">
            Controla tus finanzas de manera simple
          </p>
        </div>
      </div>

       {/* Card principal */}
       <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
         {isLogin ? (
           <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
         ) : (
           <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
         )}
       </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-white/80 text-sm font-medium">
          Gestiona tus ingresos y gastos de forma inteligente
        </p>
      </div>
    </div>
  )
}
