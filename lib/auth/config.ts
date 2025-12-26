/**
 * Configuration AWS Cognito
 * Les valeurs sont chargées depuis les variables d'environnement
 */

export interface CognitoConfig {
  region: string
  userPoolId: string
  clientId: string
  domain: string
  apiUrl: string
}

const config: CognitoConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-3',
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
}

/**
 * Valide que toutes les variables de configuration requises sont présentes
 * @returns true si la configuration est complète, false sinon
 */
export const validateConfig = (): boolean => {
  const required: (keyof CognitoConfig)[] = ['userPoolId', 'clientId', 'domain', 'apiUrl']
  const missing = required.filter((key) => !config[key])

  if (missing.length > 0) {
    console.warn(
      `⚠️  Configuration Cognito incomplète. Variables manquantes: ${missing.join(', ')}`
    )
  }

  return missing.length === 0
}

export { config }
export default config

