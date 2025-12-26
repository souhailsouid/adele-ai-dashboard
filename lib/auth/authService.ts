/**
 * Service d'authentification AWS Cognito
 * Gère toutes les opérations d'authentification et de gestion des tokens
 */

import {
  getCognitoClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
} from './cognitoClient'
import { config } from './config'
import { createAuthError } from './errors'

export interface SignUpAttributes {
  firstName?: string
  lastName?: string
  [key: string]: string | undefined
}

export interface AuthTokens {
  idToken: string
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface SignUpResult {
  success: boolean
  userSub?: string
  message?: string
}

export interface SignInResult {
  success: boolean
  tokens?: AuthTokens
  challengeName?: string
  session?: string
}

export interface User {
  email: string
  firstName?: string
  lastName?: string
  sub: string
  emailVerified: boolean
  [key: string]: unknown
}

/**
 * Clés de stockage localStorage
 * Exportées pour être utilisées par d'autres services
 */
export const STORAGE_KEYS = {
  ID_TOKEN: 'cognito_id_token',
  ACCESS_TOKEN: 'cognito_access_token',
  REFRESH_TOKEN: 'cognito_refresh_token',
  TOKEN_EXPIRES: 'cognito_token_expires',
} as const

class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(
    email: string,
    password: string,
    attributes: SignUpAttributes = {}
  ): Promise<SignUpResult> {
    try {
      // Validation de la configuration
      if (!config.clientId || !config.userPoolId) {
        throw new Error(
          `Configuration Cognito manquante. ClientId: ${config.clientId ? 'OK' : 'MANQUANT'}, UserPoolId: ${config.userPoolId ? 'OK' : 'MANQUANT'}`
        )
      }

      const client = getCognitoClient()

      // Construire les attributs utilisateur
      const userAttributes = Object.entries(attributes)
        .filter(([_, value]) => value)
        .map(([key, value]) => ({
          Name: key === 'firstName' ? 'given_name' : key === 'lastName' ? 'family_name' : key,
          Value: value as string,
        }))

      const command = new SignUpCommand({
        ClientId: config.clientId,
        Username: email,
        Password: password,
        UserAttributes: userAttributes,
      })

      const response = await client.send(command)

      return {
        success: true,
        userSub: response.UserSub,
        message: 'Inscription réussie. Vérifiez votre email pour confirmer votre compte.',
      }
    } catch (error) {
      throw createAuthError(error)
    }
  }

  /**
   * Confirmation de l'inscription avec code
   */
  async confirmSignUp(email: string, confirmationCode: string): Promise<boolean> {
    try {
      const client = getCognitoClient()

      const command = new ConfirmSignUpCommand({
        ClientId: config.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
      })

      await client.send(command)
      return true
    } catch (error) {
      throw createAuthError(error)
    }
  }

  /**
   * Renvoyer le code de confirmation
   */
  async resendConfirmationCode(email: string): Promise<boolean> {
    try {
      const client = getCognitoClient()

      const command = new ResendConfirmationCodeCommand({
        ClientId: config.clientId,
        Username: email,
      })

      await client.send(command)
      return true
    } catch (error) {
      throw createAuthError(error)
    }
  }

  /**
   * Connexion avec email et mot de passe
   */
  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      // Validation de la configuration
      if (!config.clientId || !config.userPoolId) {
        throw new Error(
          `Configuration Cognito manquante. ClientId: ${config.clientId ? 'OK' : 'MANQUANT'}, UserPoolId: ${config.userPoolId ? 'OK' : 'MANQUANT'}`
        )
      }

      const client = getCognitoClient()

      const command = new InitiateAuthCommand({
        ClientId: config.clientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })

      const response = await client.send(command)

      if (response.AuthenticationResult) {
        const tokens: AuthTokens = {
          idToken: response.AuthenticationResult.IdToken || '',
          accessToken: response.AuthenticationResult.AccessToken || '',
          refreshToken: response.AuthenticationResult.RefreshToken || '',
          expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
        }

        this.storeTokens(tokens)

        return {
          success: true,
          tokens,
        }
      }

      // Gestion des challenges (MFA, etc.)
      if (response.ChallengeName) {
        return {
          success: false,
          challengeName: response.ChallengeName,
          session: response.Session,
        }
      }

      throw new Error('Réponse d\'authentification invalide')
    } catch (error) {
      throw createAuthError(error)
    }
  }

  /**
   * Déconnexion
   */
  async signOut(): Promise<void> {
    try {
      const accessToken = this.getAccessToken()
      if (accessToken) {
        const client = getCognitoClient()
        const command = new GlobalSignOutCommand({
          AccessToken: accessToken,
        })
        await client.send(command)
      }
    } catch (error) {
      // Même en cas d'erreur, on nettoie les tokens locaux
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      this.clearTokens()
    }
  }

  /**
   * Récupérer les informations de l'utilisateur actuel
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const accessToken = this.getAccessToken()
      if (!accessToken) {
        return null
      }

      const client = getCognitoClient()
      const command = new GetUserCommand({
        AccessToken: accessToken,
      })

      const response = await client.send(command)

      // Transformer les attributs Cognito en objet User
      const userAttributes = response.UserAttributes || []
      const user: User = {
        email: '',
        sub: response.Username || '',
        emailVerified: false,
      }

      userAttributes.forEach((attr) => {
        if (attr.Name === 'email') {
          user.email = attr.Value || ''
        } else if (attr.Name === 'email_verified') {
          user.emailVerified = attr.Value === 'true'
        } else if (attr.Name === 'given_name') {
          user.firstName = attr.Value
        } else if (attr.Name === 'family_name') {
          user.lastName = attr.Value
        } else {
          user[attr.Name] = attr.Value
        }
      })

      return user
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error)
      this.clearTokens()
      return null
    }
  }

  /**
   * Mot de passe oublié - demande de réinitialisation
   */
  async forgotPassword(email: string): Promise<boolean> {
    try {
      const client = getCognitoClient()

      const command = new ForgotPasswordCommand({
        ClientId: config.clientId,
        Username: email,
      })

      await client.send(command)
      return true
    } catch (error) {
      throw createAuthError(error)
    }
  }

  /**
   * Confirmation du nouveau mot de passe
   */
  async confirmForgotPassword(
    email: string,
    confirmationCode: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const client = getCognitoClient()

      const command = new ConfirmForgotPasswordCommand({
        ClientId: config.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      })

      await client.send(command)
      return true
    } catch (error) {
      throw createAuthError(error)
    }
  }

  /**
   * Stocker les tokens dans localStorage
   */
  storeTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return

    const expiresAt = Date.now() + tokens.expiresIn * 1000

    localStorage.setItem(STORAGE_KEYS.ID_TOKEN, tokens.idToken)
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, expiresAt.toString())
  }

  /**
   * Récupérer tous les tokens stockés
   */
  getTokens(): AuthTokens | null {
    if (typeof window === 'undefined') return null

    const idToken = localStorage.getItem(STORAGE_KEYS.ID_TOKEN)
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES)

    if (!idToken || !accessToken || !refreshToken || !expiresAt) {
      return null
    }

    return {
      idToken,
      accessToken,
      refreshToken,
      expiresIn: Math.floor((parseInt(expiresAt) - Date.now()) / 1000),
    }
  }

  /**
   * Récupérer le token d'accès
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  }

  /**
   * Récupérer l'ID token
   */
  getIdToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEYS.ID_TOKEN)
  }

  /**
   * Vérifier si les tokens sont expirés
   */
  areTokensExpired(): boolean {
    if (typeof window === 'undefined') return true

    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES)
    if (!expiresAt) return true

    return Date.now() >= parseInt(expiresAt)
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const tokens = this.getTokens()
    if (!tokens) return false

    // Vérifier l'expiration
    if (this.areTokensExpired()) {
      this.clearTokens()
      return false
    }

    return true
  }

  /**
   * Supprimer tous les tokens
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return

    localStorage.removeItem(STORAGE_KEYS.ID_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES)
  }
}

// Export singleton
const authService = new AuthService()
export default authService

