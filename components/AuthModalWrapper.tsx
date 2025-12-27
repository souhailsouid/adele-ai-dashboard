'use client'

import AuthModal from './AuthModal'
import { useAuthModal } from './useAuthModal'

export default function AuthModalWrapper() {
  const { isOpen, closeModal, currentView } = useAuthModal()

  return <AuthModal isOpen={isOpen} onClose={closeModal} initialView={currentView} />
}

