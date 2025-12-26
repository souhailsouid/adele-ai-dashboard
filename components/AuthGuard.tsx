'use client'

/**
 * Composant de protection des routes
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}

export default function AuthGuard({
  children,
  redirectTo = '/authentication/sign-in',
  fallback,
}: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push(redirectTo)
    }
  }, [loading, isAuthenticated, router, redirectTo])

  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-neutral-400">Chargement...</div>
        </div>
      )
    )
  }

  if (!isAuthenticated()) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-neutral-400">Redirection...</div>
        </div>
      )
    )
  }

  return <>{children}</>
}

