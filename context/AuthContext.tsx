'use client'

/**
 * Context d'authentification React
 * Fournit l'état d'authentification et les méthodes à toute l'application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import authService, { type User, type SignUpAttributes } from '@/lib/auth/authService'
import { createAuthError } from '@/lib/auth/errors'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, attributes?: SignUpAttributes) => Promise<{ success: boolean; message?: string }>
  confirmSignUp: (email: string, code: string) => Promise<boolean>
  signIn: (email: string, password: string, redirect?: boolean) => Promise<{ success: boolean }>
  signOut: () => Promise<void>
  isAuthenticated: () => boolean
  getAccessToken: () => string | null
  getIdToken: () => string | null
  loadUser: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  /**
   * Charger l'utilisateur actuel depuis Cognito
   */
  const loadUser = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (err) {
      console.error('Erreur lors du chargement de l\'utilisateur:', err)
      setUser(null)
      authService.clearTokens()
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Inscription
   */
  const signUp = useCallback(
    async (email: string, password: string, attributes?: SignUpAttributes) => {
      try {
        setError(null)
        setLoading(true)

        const result = await authService.signUp(email, password, attributes)

        return {
          success: result.success,
          message: result.message,
        }
      } catch (err) {
        const authError = createAuthError(err)
        setError(authError.message)
        throw authError
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Confirmation de l'inscription
   */
  const confirmSignUp = useCallback(async (email: string, code: string) => {
    try {
      setError(null)
      setLoading(true)

      const success = await authService.confirmSignUp(email, code)
      return success
    } catch (err) {
      const authError = createAuthError(err)
      setError(authError.message)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Connexion
   */
  const signIn = useCallback(
    async (email: string, password: string, redirect = false) => {
      try {
        setError(null)
        setLoading(true)

        const result = await authService.signIn(email, password)

        if (result.success) {
          // Charger l'utilisateur après connexion réussie
          await loadUser()

          if (redirect) {
            router.push('/dashboard')
          }

          return { success: true }
        }

        return { success: false }
      } catch (err) {
        const authError = createAuthError(err)
        setError(authError.message)
        throw authError
      } finally {
        setLoading(false)
      }
    },
    [loadUser, router]
  )

  /**
   * Déconnexion
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      await authService.signOut()
      setUser(null)
      router.push('/')
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err)
      // Nettoyer quand même l'état local
      authService.clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [router])

  /**
   * Vérifier l'authentification
   */
  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated()
  }, [])

  /**
   * Obtenir le token d'accès
   */
  const getAccessToken = useCallback(() => {
    return authService.getAccessToken()
  }, [])

  /**
   * Obtenir l'ID token
   */
  const getIdToken = useCallback(() => {
    return authService.getIdToken()
  }, [])

  /**
   * Effacer l'erreur
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Charger l'utilisateur au montage
  useEffect(() => {
    loadUser()
  }, [loadUser])

  const value: AuthContextType = {
    user,
    loading,
    error,
    signUp,
    confirmSignUp,
    signIn,
    signOut,
    isAuthenticated,
    getAccessToken,
    getIdToken,
    loadUser,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook pour utiliser le context d'authentification
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}


