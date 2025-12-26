'use client'

import AuthModal from './AuthModal'
import { useAuthModal } from './useAuthModal'

export default function AuthModalWrapper() {
  const { isOpen, closeModal, currentView } = useAuthModal()

  console.log('AuthModalWrapper: isOpen=', isOpen, 'currentView=', currentView)

  return <AuthModal isOpen={isOpen} onClose={closeModal} initialView={currentView} />
}

