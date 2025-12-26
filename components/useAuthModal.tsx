'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthModalContextType {
  isOpen: boolean
  openModal: (view?: 'login' | 'signup') => void
  closeModal: () => void
  currentView: 'login' | 'signup'
  setView: (view: 'login' | 'signup') => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'login' | 'signup'>('signup')

  const openModal = (view: 'login' | 'signup' = 'signup') => {
    setCurrentView(view)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const setView = (view: 'login' | 'signup') => {
    setCurrentView(view)
  }

  return (
    <AuthModalContext.Provider value={{ isOpen, openModal, closeModal, currentView, setView }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}

