/**
 * Client API de base avec authentification automatique
 * Toutes les requêtes incluent automatiquement le token d'authentification
 */

import { config } from '@/lib/auth/config'
import authService from '@/lib/auth/authService'

export type TokenType = 'access' | 'id'

export interface RequestOptions extends RequestInit {
  tokenType?: TokenType
  skipAuth?: boolean
}

class BaseApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.apiUrl
  }

  /**
   * Récupère le token selon le type demandé
   */
  private getToken(tokenType: TokenType = 'access'): string | null {
    return tokenType === 'access' ? authService.getAccessToken() : authService.getIdToken()
  }

  /**
   * Effectue une requête HTTP avec authentification automatique
   */
  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { tokenType = 'access', skipAuth = false, headers = {}, ...fetchOptions } = options

    // Construire l'URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`

    // Préparer les headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    }

    // Ajouter le token d'authentification si nécessaire
    if (!skipAuth) {
      const token = this.getToken(tokenType)

      if (!token) {
        throw new Error('Not authenticated. Please sign in first.')
      }

      requestHeaders['Authorization'] = `Bearer ${token}`
    }

    // Effectuer la requête
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    })

    // Gérer les erreurs HTTP
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // Si la réponse n'est pas du JSON, utiliser le message par défaut
      }

      // Si 401, nettoyer les tokens
      if (response.status === 401) {
        authService.clearTokens()
      }

      throw new Error(errorMessage)
    }

    // Parser la réponse
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T
    }

    return (await response.text()) as T
  }

  /**
   * Méthodes HTTP helpers
   */
  async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Export singleton
const baseApiClient = new BaseApiClient()
export default baseApiClient

