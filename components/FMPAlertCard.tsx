/**
 * Composant Carte d'Alerte FMP
 * Style inspiré de HeroDashboard avec glassmorphism
 */

'use client'

import type { FMPSignal } from '@/types/fmpSignals'
import marketSignalsService from '@/services/marketSignalsService'

interface FMPAlertCardProps {
  signal: FMPSignal
  isActive?: boolean
}

export default function FMPAlertCard({ signal, isActive = false }: FMPAlertCardProps) {
  const isBullish = signal.type === 'bullish'
  
  const severityConfig = {
    high: {
      label: 'High Priority',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    },
    medium: {
      label: 'Medium',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    low: {
      label: 'Low',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
  }

  const severity = severityConfig[signal.severity]

  return (
    <div
      className={`group flex flex-col gap-1 p-4 border-b border-white/5 cursor-pointer transition-colors ${
        isActive
          ? 'bg-[#16181D] border-l-2 border-l-orange-500'
          : 'hover:bg-[#131416]'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-mono ${isActive ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
          FMP-{signal.id.substring(0, 6)}
        </span>
        {isActive && (
          <>
            <div className="w-1 h-1 rounded-full bg-gray-600"></div>
            <span className="text-xs text-gray-500">{severity.label}</span>
          </>
        )}
      </div>
      
      <span className={`text-sm ${isActive ? 'font-medium text-white' : 'text-gray-300 group-hover:text-white'}`}>
        {signal.ticker} • {isBullish ? '🟢 BULLISH' : '🔴 BEARISH'} • {signal.message}
      </span>

      <div className="flex items-center gap-2 mt-2">
        {isActive ? (
          <div className="w-2 h-2 rounded-full animate-pulse bg-orange-400"></div>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${isBullish ? 'text-emerald-400' : 'text-red-400'}`}
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        )}
        <span className="text-xs text-gray-500">{isActive ? 'Live' : 'Processed'}</span>
        
        <div className={`ml-auto flex items-center gap-2`}>
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${severity.color} ${severity.bgColor} ${severity.borderColor} border`}>
            {signal.severity}
          </span>
        </div>
      </div>

      {/* Liste des signaux détectés */}
      {signal.signals.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
          {signal.signals.slice(0, 3).map((sig, idx) => (
            <div key={idx} className="text-xs text-neutral-400 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-orange-400"></span>
              <span>{sig}</span>
            </div>
          ))}
          {signal.signals.length > 3 && (
            <div className="text-xs text-neutral-500">+{signal.signals.length - 3} more</div>
          )}
        </div>
      )}
    </div>
  )
}

