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
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
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
    const contentType = response.headers.get('content-type') || ''
    const textData = await response.text()
    
    // Tenter de parser en JSON même si le content-type n'est pas application/json
    // (certaines APIs retournent text/plain mais avec du JSON)
    if (contentType.includes('application/json') || (textData.trim().startsWith('{') || textData.trim().startsWith('['))) {
      try {
        const jsonData = JSON.parse(textData)
        return jsonData as T
      } catch {
        // Si le parsing échoue, retourner le texte
        return textData as T
      }
    }

    return textData as T
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

// Export de la classe pour extension
export { BaseApiClient }

// Export singleton pour utilisation directe
const baseApiClient = new BaseApiClient()
export default baseApiClient

