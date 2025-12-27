/**
 * Composant Card pour afficher un signal RSS avec données extraites
 * Style cohérent avec le design system MarketFlow
 */

'use client'

import type { Signal } from '@/types/signals'
import signalsService from '@/services/signalsService'
import ExtractedDataDisplay from './ExtractedDataDisplay'

interface SignalCardProps {
  signal: Signal
  compact?: boolean
}

/**
 * Décode les entités HTML (&#x2018; → ', &apos; → ', etc.)
 */
const decodeHtmlEntities = (text: string): string => {
  if (typeof window === 'undefined') {
    // Côté serveur, utiliser une regex simple
    return text
      .replace(/&#x2018;/g, "'")
      .replace(/&#x2019;/g, "'")
      .replace(/&#x201C;/g, '"')
      .replace(/&#x201D;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  }
  // Côté client, utiliser le DOM
  const txt = document.createElement('textarea')
  txt.innerHTML = text
  return txt.value
}

/**
 * Nettoie le titre en supprimant "FinancialJuice:" et en extrayant le titre et la description
 */
const cleanTitle = (rawTitle: string): { title: string; description: string } => {
  let cleaned = rawTitle
  
  // Supprimer "FinancialJuice:" au début
  cleaned = cleaned.replace(/^FinancialJuice:\s*/i, '')
  
  // Chercher le pattern "Mot: Description" (ex: "Zelenskiy: He does not...")
  const match = cleaned.match(/^([^:]+):\s*(.+)$/)
  
  if (match && match.length === 3) {
    return {
      title: match[1].trim(),
      description: match[2].trim()
    }
  }
  
  // Si pas de pattern "Mot:", prendre les premiers mots comme titre
  const words = cleaned.split(' ')
  if (words.length > 3) {
    return {
      title: words.slice(0, 2).join(' '), // Premiers 2 mots comme titre
      description: words.slice(2).join(' ') // Le reste comme description
    }
  }
  
  // Sinon, tout comme titre
  return {
    title: cleaned,
    description: ''
  }
}

export default function SignalCard({ signal, compact = false }: SignalCardProps) {
  const extractedData = signal.raw_data?.extracted_data
  const hasData = extractedData && extractedData.actual !== undefined
  
  // Nettoyer le titre pour extraire titre et description
  const rawTitle = signal.raw_data?.title ? decodeHtmlEntities(signal.raw_data.title) : ''
  const { title, description: extractedDescription } = cleanTitle(rawTitle)
  
  // Utiliser la description extraite ou celle de raw_data
  const description = extractedDescription || (signal.raw_data?.description ? decodeHtmlEntities(signal.raw_data.description) : '')

  const getPriorityColor = () => {
    switch (signal.priority) {
      case 'critical':
        return 'border-red-500/30 bg-red-500/5'
      case 'high':
        return 'border-orange-500/30 bg-orange-500/5'
      case 'medium':
        return 'border-yellow-500/20 bg-yellow-500/5'
      default:
        return 'border-white/5 bg-white/[0.02]'
    }
  }

  const getPriorityLabel = () => {
    switch (signal.priority) {
      case 'critical':
        return 'Critique'
      case 'high':
        return 'Élevée'
      case 'medium':
        return 'Moyenne'
      default:
        return 'Normale'
    }
  }

  return (
    <div className={`glass-card rounded-lg ${compact ? 'p-3 space-y-2' : 'p-5 space-y-4'} border transition-all hover:border-white/10 ${getPriorityColor()}`}>
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-white ${compact ? 'text-sm mb-1 line-clamp-1' : 'text-base mb-2 line-clamp-2'} tracking-tight leading-snug`}>
            {title}
          </h3>
          {description && !compact && (
            <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {signal.priority && (
          <span
            className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider whitespace-nowrap ${
              signal.priority === 'critical'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : signal.priority === 'high'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : signal.priority === 'medium'
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                : 'bg-neutral-800/50 text-neutral-400 border border-white/5'
            }`}
          >
            {getPriorityLabel()}
          </span>
        )}
      </div>

      {/* Données Extraites */}
      {hasData && extractedData && !compact && <ExtractedDataDisplay data={extractedData} />}

      {/* Métadonnées */}
      <div className={`flex items-center justify-between gap-4 ${compact ? 'pt-2' : 'pt-3'} border-t border-white/5`}>
        <div className={`flex items-center ${compact ? 'gap-2' : 'gap-4'} text-xs text-neutral-500`}>
          {signal.raw_data.feed && !compact && (
            <span className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
              </svg>
              <span className="truncate max-w-[150px]">{signal.raw_data.feed}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>{signalsService.formatRelativeDate(signal.timestamp)}</span>
          </span>
        </div>

        {/* Lien */}
        {!compact && (
          <a
            href={signal.raw_data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5 font-medium"
          >
            <span>Lire la suite</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7"></path>
              <path d="M7 7h10v10"></path>
            </svg>
          </a>
        )}
      </div>

      {/* Tags */}
      {signal.tags && signal.tags.length > 0 && !compact && (
        <div className="flex items-center gap-2 flex-wrap pt-2">
          {signal.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[10px] bg-neutral-800/50 text-neutral-400 border border-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
