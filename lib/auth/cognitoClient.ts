/**
 * Client Cognito Identity Provider
 * Singleton pattern pour réutiliser la même instance
 */

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'
import { config } from './config'

// Instance singleton du client
let cognitoClient: CognitoIdentityProviderClient | null = null

/**
 * Récupère ou crée l'instance singleton du client Cognito
 * @returns Instance du client Cognito
 */
export function getCognitoClient(): CognitoIdentityProviderClient {
  if (!cognitoClient) {
    cognitoClient = new CognitoIdentityProviderClient({
      region: config.region || 'eu-west-3',
    })
  }

  return cognitoClient
}

// Export des commandes AWS SDK
export {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider'

