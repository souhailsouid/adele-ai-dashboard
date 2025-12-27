/**
 * Composant d'Alertes en Temps Réel
 * Affiche les nouvelles alertes reçues via Supabase Realtime (broadcast)
 * Style cohérent avec le design system MarketFlow
 */

'use client'

import { useRealtimeSignals } from '@/hooks/useRealtimeSignals'
import SignalCard from './SignalCard'

interface RealtimeAlertsProps {
  keywords?: string[]
  maxAlerts?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export default function RealtimeAlerts({
  keywords = ['Trump', 'CPI', 'Fed', 'GDP', 'NFP'],
  maxAlerts = 5,
  position = 'top-right',
}: RealtimeAlertsProps) {
  const { signals, isConnected } = useRealtimeSignals({
    keywords,
    enableBrowserNotifications: true,
  })

  if (signals.length === 0) return null

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} w-96 max-h-[600px] overflow-y-auto z-50`}
    >
      <div className="glass-card rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent shadow-2xl p-4 space-y-3 backdrop-blur-xl">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
              </div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-neutral-500"></div>
            )}
            <h3 className="font-bold text-lg text-white tracking-tight">
              🔔 {signals.length} nouvelle(s) alerte(s)
            </h3>
          </div>
        </div>

        {/* Liste des alertes */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
          {signals.slice(0, maxAlerts).map((signal, idx) => (
            <div key={signal.id} className="opacity-0 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
              <SignalCard signal={signal} compact />
            </div>
          ))}
        </div>

        {/* Badge de connexion */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-neutral-500'
              }`}
            />
            <span>{isConnected ? 'Connecté en temps réel' : 'Déconnecté'}</span>
          </div>
          {signals.length > maxAlerts && (
            <span className="text-xs text-neutral-500 font-mono">
              +{signals.length - maxAlerts} autres
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

