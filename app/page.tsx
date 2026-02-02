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
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-white gap-16">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <WalletIcon className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-4xl font-extrabold text-indigo-600 mb-3 tracking-tight">
            Gestor de Gastos
          </h1>
          <p className="text-indigo-600/90 text-base font-medium">
            Controla tus finanzas de manera simple
          </p>
        </div>
      </div>

      {/* Card principal */}
      <div className="w-full flex items-center justify-center max-w-md rounded-2xl text-gray-900">
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center justify-center text-center">
        <p className="text-indigo-600/90 text-sm font-medium">
          Gestiona tus ingresos y gastos de forma inteligente
        </p>
      </div>
    </div >
  )
}
