/**
 * Composant Terminal pour Twitter/Bloomberg
 * Inspiré du style InstitutionTimeline avec un look terminal
 */

'use client'

import type { Signal } from '@/types/signals'
import signalsService from '@/services/signalsService'
import { TwitterIcon, BloombergIcon } from './SocialIcons'

interface NewsTerminalProps {
  signals: Signal[]
  feed: 'social' | 'bloomberg' | 'twitter'
}

export default function NewsTerminal({ signals, feed }: NewsTerminalProps) {
  if (!signals || signals.length === 0) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-0 bg-orange-500/10 blur-[100px] -z-10 opacity-30"></div>
        <div className="glass-card rounded-[1.2em] p-1">
          <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md">
            <div className="px-5 py-4 border-b border-white/5">
              <div className="text-sm font-medium text-white tracking-tight">
                Terminal {feed === 'social' ? 'Social' : feed === 'bloomberg' ? 'Bloomberg' : 'Twitter'}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">AUCUNE ACTIVITÉ</div>
            </div>
            <div className="p-5 text-center">
              <p className="text-sm text-neutral-400">Aucun signal disponible</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Trier par date (plus récents en premier)
  const sortedSignals = [...signals].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  const formatRelativeDate = (dateString: string): string => {
    return signalsService.formatRelativeDate(dateString)
  }

  const getFeedIcon = () => {
    switch (feed) {
      case 'bloomberg':
        return <BloombergIcon className="h-4 w-4" />
      case 'twitter':
      case 'social':
        return <TwitterIcon className="h-4 w-4" />
      default:
        return '📡'
    }
  }

  const getFeedColor = () => {
    switch (feed) {
      case 'bloomberg':
        return 'orange'
      case 'twitter':
      case 'social':
        return 'blue'
      default:
        return 'neutral'
    }
  }

  const feedColor = getFeedColor()

  return (
    <div className="relative w-full">
      {/* Glow effect */}
      <div className={`absolute inset-0 ${feedColor === 'orange' ? 'bg-orange-500/10' : 'bg-blue-500/10'} blur-[100px] -z-10 opacity-30`}></div>

      <div className="glass-card rounded-[1.2em] p-1">
        <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md">
          {/* Header - Style Terminal */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center ${feedColor === 'orange' ? 'text-orange-400' : 'text-blue-400'}`}>
                {getFeedIcon()}
              </div>
              <div>
                <div className="text-sm font-medium text-white tracking-tight">
                  {feed === 'social' ? 'Twitter Stream' : feed === 'bloomberg' ? 'Bloomberg Terminal' : 'Social Feed'}
                </div>
                <div className="text-xs text-neutral-400">
                  {sortedSignals.length} signal{sortedSignals.length > 1 ? 's' : ''} actif{sortedSignals.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/5 text-xs text-neutral-400">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Terminal Body - Scrollable */}
          <div className="p-6 space-y-6 relative max-h-[600px] overflow-y-auto custom-scrollbar">
            {/* Connecting line - Style terminal */}
            <div className="absolute left-[35px] top-8 bottom-8 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

            {sortedSignals.map((signal, idx) => {
              const isRecent = idx < 3 // Les 3 plus récents
              const hasSurprise = signal.raw_data?.extracted_data?.surprise && 
                signal.raw_data.extracted_data.surprise !== 'neutral'
              
              return (
                <div key={signal.id} className="relative flex gap-6 group">
                  {/* Terminal prompt indicator */}
                  <div className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 z-10 ${
                    isRecent 
                      ? feedColor === 'orange' 
                        ? 'bg-orange-400 ring-4 ring-orange-400/10' 
                        : 'bg-blue-400 ring-4 ring-blue-400/10'
                      : 'bg-neutral-500 ring-4 ring-neutral-500/10'
                  }`}></div>
                  
                  <div className="flex-1 min-w-0 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    {/* Timestamp - Style lisible */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-neutral-500">
                          {formatRelativeDate(signal.timestamp)}
                        </span>
                        {hasSurprise && (
                          <span className="text-base" title="Surprise économique détectée">⚡</span>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        isRecent 
                          ? feedColor === 'orange'
                            ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                            : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          : 'bg-white/5 text-neutral-400 border border-white/10'
                      }`}>
                        {isRecent ? 'Nouveau' : 'Archive'}
                      </span>
                    </div>

                    {/* Title - Style lisible inspiré de NewsStats */}
                    <div className="mb-3">
                      <h3 className={`text-base font-semibold ${isRecent ? 'text-white' : 'text-neutral-200'} group-hover:text-orange-300 transition-colors leading-snug`}>
                        {signal.raw_data?.title || 'No title'}
                      </h3>
                    </div>

                    {/* Description */}
                    {signal.raw_data?.description && (
                      <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
                        {signal.raw_data.description.substring(0, 250)}
                        {signal.raw_data.description.length > 250 && '...'}
                      </p>
                    )}

                    {/* Tags - Style lisible */}
                    <div className="flex gap-2 flex-wrap mb-3">
                      {hasSurprise && (
                        <span className={`px-2.5 py-1 text-xs rounded-md border font-medium ${
                          signal.raw_data.extracted_data?.surprise === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-300 border-red-500/20'
                        }`}>
                          Surprise {signal.raw_data.extracted_data?.surprise === 'positive' ? 'Positive' : 'Négative'}
                        </span>
                      )}
                      <span className="px-2.5 py-1 text-xs rounded-md bg-white/5 border border-white/10 text-neutral-400 font-medium">
                        {signal.raw_data?.feed || 'Unknown'}
                      </span>
                      {signal.priority && (
                        <span className={`px-2.5 py-1 text-xs rounded-md border font-medium ${
                          signal.priority === 'critical'
                            ? 'bg-red-500/10 text-red-300 border-red-500/20'
                            : signal.priority === 'high'
                            ? 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                            : 'bg-white/5 text-neutral-400 border-white/10'
                        }`}>
                          {signal.priority === 'critical' ? 'Critique' : signal.priority === 'high' ? 'Élevée' : 'Normale'}
                        </span>
                      )}
                      {signal.raw_data?.url && (
                        <a
                          href={signal.raw_data.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs rounded-md bg-white/5 border border-white/10 text-orange-400 hover:text-orange-300 transition-colors font-medium"
                        >
                          Lire →
                        </a>
                      )}
                    </div>

                    {/* Extracted data - Style lisible */}
                    {signal.raw_data?.extracted_data && signal.raw_data.extracted_data.actual !== undefined && (
                      <div className="mt-4 p-4 rounded-lg bg-neutral-800/50 border border-white/5">
                        <div className="text-xs font-medium text-neutral-400 mb-3">Données extraites</div>
                        <div className="space-y-2 text-sm">
                          {signal.raw_data.extracted_data.actual !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400 font-medium">Actual:</span>
                              <span className="text-white font-semibold">{signal.raw_data.extracted_data.actual}</span>
                            </div>
                          )}
                          {signal.raw_data.extracted_data.forecast !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-blue-400 font-medium">Forecast:</span>
                              <span className="text-white font-semibold">{signal.raw_data.extracted_data.forecast}</span>
                            </div>
                          )}
                          {signal.raw_data.extracted_data.previous !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-400 font-medium">Previous:</span>
                              <span className="text-white font-semibold">{signal.raw_data.extracted_data.previous}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer - Terminal status */}
          <div className="px-5 py-3 border-t border-white/5 bg-neutral-900/60">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${feedColor === 'orange' ? 'bg-orange-400' : 'bg-blue-400'} animate-pulse`}></div>
                <span className="text-neutral-400 font-medium">Statut: Actif</span>
              </div>
              <span className="text-neutral-500">
                Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

