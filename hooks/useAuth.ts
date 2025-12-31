/**
 * Hook personnalisé pour l'authentification
 * Alias pour useAuthContext pour une meilleure ergonomie
 */

import { useAuthContext } from '@/context/AuthContext'

export const useAuth = useAuthContext

export default useAuth


