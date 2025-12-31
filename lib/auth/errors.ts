/**
 * Gestion des erreurs Cognito
 * Traduction des codes d'erreur AWS en messages utilisateur
 */

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Traduit les codes d'erreur Cognito en messages français
 */
export const translateCognitoError = (error: unknown): string => {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // Erreurs d'inscription
    if (errorMessage.includes('usernameexists')) {
      return "Cet email est déjà utilisé. Essayez de vous connecter."
    }
    if (errorMessage.includes('invalidpassword')) {
      return "Le mot de passe ne respecte pas les critères requis."
    }
    if (errorMessage.includes('invalidparameter')) {
      return "Les informations fournies sont invalides."
    }

    // Erreurs de connexion
    if (errorMessage.includes('notauthorized')) {
      return "Email ou mot de passe incorrect."
    }
    if (errorMessage.includes('userdoesnotexist')) {
      return "Aucun compte trouvé avec cet email."
    }
    if (errorMessage.includes('userisnotconfirmed')) {
      return "Votre compte n'est pas confirmé. Vérifiez votre email."
    }
    if (errorMessage.includes('passwordresetsrequired')) {
      return "Vous devez réinitialiser votre mot de passe."
    }
    if (errorMessage.includes('usernametaken')) {
      return "Cet email est déjà utilisé."
    }

    // Erreurs de confirmation
    if (errorMessage.includes('codeexpired')) {
      return "Le code de confirmation a expiré. Demandez un nouveau code."
    }
    if (errorMessage.includes('codenotfound')) {
      return "Code de confirmation invalide."
    }
    if (errorMessage.includes('expiredcodeexception')) {
      return "Le code a expiré. Veuillez en demander un nouveau."
    }

    // Erreurs de token
    if (errorMessage.includes('tokenextendedexception')) {
      return "Votre session a expiré. Veuillez vous reconnecter."
    }
    if (errorMessage.includes('notauthorizedexception')) {
      return "Vous n'êtes pas autorisé à effectuer cette action."
    }

    // Erreurs réseau
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return "Erreur de connexion. Vérifiez votre connexion internet."
    }

    // Message par défaut
    return error.message || "Une erreur est survenue. Veuillez réessayer."
  }

  return "Une erreur inattendue est survenue."
}

/**
 * Crée une erreur AuthError à partir d'une erreur Cognito
 */
export const createAuthError = (error: unknown, code?: string): AuthError => {
  const message = translateCognitoError(error)
  return new AuthError(message, code, error)
}


