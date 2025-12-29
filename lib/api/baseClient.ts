/**
 * Client API de base avec authentification automatique
 * Toutes les requêtes incluent automatiquement le token d'authentification
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { config } from '@/lib/auth/config'
import authService from '@/lib/auth/authService'

export type TokenType = 'access' | 'id'

export interface RequestOptions extends Omit<AxiosRequestConfig, 'headers'> {
  tokenType?: TokenType
  skipAuth?: boolean
  headers?: Record<string, string>
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
    const { tokenType = 'access', skipAuth = false, headers = {}, ...axiosOptions } = options

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

    try {
      // Construire l'URL complète si nécessaire
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`

      // Effectuer la requête avec axios
      const response: AxiosResponse<T> = await axios.request({
        url,
        ...axiosOptions,
        headers: requestHeaders,
      })

      return response.data
    } catch (error) {
      // Gérer les erreurs axios
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error?: string; message?: string }>

        // Si 401, nettoyer les tokens
        if (axiosError.response?.status === 401) {
          authService.clearTokens()
        }

        // Extraire le message d'erreur
        let errorMessage = `HTTP error! status: ${axiosError.response?.status || 'unknown'}`
        
        if (axiosError.response?.data) {
          const errorData = axiosError.response.data
          errorMessage = errorData.error || errorData.message || errorMessage
        } else if (axiosError.message) {
          errorMessage = axiosError.message
        }

        throw new Error(errorMessage)
      }

      // Si ce n'est pas une erreur axios, la relancer
      throw error
    }
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
      data, // axios utilise 'data' au lieu de 'body'
    })
  }

  async put<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      data, // axios utilise 'data' au lieu de 'body'
    })
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      data, // axios utilise 'data' au lieu de 'body'
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

