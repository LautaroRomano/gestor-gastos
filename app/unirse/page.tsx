'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

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
      const res = await fetch(`/api/gestores/${gestorId}/unirse`, {
        method: 'POST',
      })

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Unirse a un Gestor</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Ingresa el ID del gestor al que deseas unirte
          </p>

          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="gestorId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ID del Gestor
            </label>
            <input
              id="gestorId"
              type="text"
              value={gestorId}
              onChange={(e) => setGestorId(e.target.value)}
              placeholder="Ingresa el ID del gestor"
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            />
          </div>

          <button
            onClick={handleUnirse}
            disabled={loading}
            className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uniéndose...</span>
              </>
            ) : (
              'Unirse'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
