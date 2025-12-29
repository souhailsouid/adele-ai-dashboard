'use client'

import { useEffect, useState } from 'react'
import HeroDashboardDynamic from './HeroDashboardDynamic'
import type { FlowAlert } from '@/lib/api/flowAlertsClient'

interface FlowAlertDetailModalProps {
  isOpen: boolean
  onClose: () => void
  alert: FlowAlert | null
}

export default function FlowAlertDetailModal({ isOpen, onClose, alert }: FlowAlertDetailModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      // Small delay to trigger animation
      setTimeout(() => {
        setIsVisible(true)
      }, 10)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      // Wait for animation to complete before unmounting
      setTimeout(() => setIsMounted(false), 300)
      // Restore body scroll
      document.body.style.overflow = 'unset'
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isMounted) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[101] flex items-center justify-center p-2 md:p-4 transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full max-w-[98vw] lg:max-w-[95vw] max-h-[95vh] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 shadow-2xl">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,.08),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,.08),transparent_45%)] pointer-events-none"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2.5 rounded-lg bg-neutral-800 border-2 border-white/30 text-white hover:text-orange-400 hover:bg-neutral-700 hover:border-orange-500/50 transition-all shadow-xl"
            aria-label="Fermer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>

          {/* Content */}
          <div className="relative overflow-y-auto max-h-[95vh]">
            {/* Header with alert info (will be made dynamic later) */}
            {alert && (
              <div className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold flex items-center justify-center text-sm shadow-lg">
                      {alert.ticker}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {alert.ticker} {alert.type.toUpperCase()} • ${alert.strike}
                      </h2>
                      <p className="text-sm text-neutral-400">
                        {alert.alert_rule.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HeroDashboardDynamic content */}
            <div className="overflow-hidden">
              <HeroDashboardDynamic alert={alert} onClose={onClose} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

