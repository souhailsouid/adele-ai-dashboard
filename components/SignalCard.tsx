/**
 * Composant Card pour afficher un signal RSS avec données extraites
 * Style cohérent avec le design system MarketFlow
 */

'use client'

import type { Signal } from '@/types/signals'
import signalsService from '@/services/signalsService'
import ExtractedDataDisplay from './ExtractedDataDisplay'
import Image from 'next/image'

// Mapping des feeds vers les logos PNG
const getFeedLogo = (feed: string | undefined): string | null => {
  if (!feed) return null
  const feedMap: Record<string, string> = {
    'reuters': '/reuters.png',
    'bloomberg': '/bloomberg.png',
    'cnbc': '/cnbc.png',
    'financial-juice': '/financialjuice.png',
    'financial-press': '/financialtime.png',
    'investing': '/investing.png',
    'barchart': '/barchart.png',
    'trading': '/barchart.png',
    'personalities': '/investing.png',
    'institutions': '/bloomberg.png',
    'real-vision': '/cnbc.png',
    'social': '/investing.png',
    'twitter': '/investing.png',
  }
  return feedMap[feed.toLowerCase()] || null
}

interface SignalCardProps {
  signal: Signal
  compact?: boolean
  index?: number // Pour créer l'effet zigzag
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

export default function SignalCard({ signal, compact = false, index = 0 }: SignalCardProps) {
  const extractedData = signal.raw_data?.extracted_data
  const hasData = extractedData && extractedData.actual !== undefined
  
  // Nettoyer le titre pour extraire titre et description
  const rawTitle = signal.raw_data?.title ? decodeHtmlEntities(signal.raw_data.title) : ''
  const { title, description: extractedDescription } = cleanTitle(rawTitle)
  
  // Utiliser la description extraite ou celle de raw_data
  const description = extractedDescription || (signal.raw_data?.description ? decodeHtmlEntities(signal.raw_data.description) : '')

  if (compact) {
    // Version compacte (garder le style original pour les cas compacts)
    return (
      <div className="glass-card rounded-lg p-3 space-y-2 border transition-all hover:border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white line-clamp-1 tracking-tight leading-snug">
              {title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>{signalsService.formatRelativeDate(signal.timestamp)}</span>
        </div>
      </div>
    )
  }

  // Version complète inspirée de NewsStats (lignes 183-452)
  const hasSurprise = extractedData?.surprise && extractedData.surprise !== 'neutral'
  const surpriseColor = extractedData?.surprise === 'positive' ? 'emerald' : 'red'

  // Carte Source - Style NewsStats (ligne 375-387)
  const feedLogo = getFeedLogo(signal.raw_data?.feed)
  const SourceCard = (
    <article className="glass-card rounded-2xl p-4 flex gap-4 items-center hover:border-orange-500/30 transition-all">
      <div className="h-9 w-9 bg-gradient-to-br from-neutral-700 to-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
        {feedLogo ? (
          <Image
            src={feedLogo}
            alt={signal.raw_data?.feed || 'Feed'}
            width={36}
            height={36}
            className="object-contain"
          />
        ) : (
          <span className="text-sm">📰</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium tracking-tight leading-tight text-white truncate">
          {signal.raw_data.feed || 'N/A'}
        </p>
        <p className="text-xs text-neutral-400">
          {signalsService.formatRelativeDate(signal.timestamp)}
        </p>
      </div>
    </article>
  )

  // Carte principale - Style NewsStats (ligne 348-373) adaptée pour articles
  const MainCard = (
    <article className="glass-card rounded-2xl p-6 flex flex-col min-h-[420px] justify-between hover:border-orange-500/30 transition-all">
      {/* Contenu principal */}
      <div>
        {/* Titre - Même police que NewsStats ligne 340 */}
        <p className="text-2xl sm:text-3xl leading-snug text-white font-normal tracking-tighter">
          {title}
        </p>

        {/* Description si présente - Même police */}
        {description && (
          <p className="text-2xl sm:text-3xl leading-snug text-white font-normal tracking-tighter">
            {description}
          </p>
        )}

        {/* Surprise si présente */}
        {hasSurprise && (
          <div className="flex items-center gap-3">
            <span className="text-lg">⚡</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
              surpriseColor === 'emerald'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-red-500/10 text-red-300 border-red-500/20'
            }`}>
              Surprise {extractedData?.surprise === 'positive' ? 'Positive' : 'Négative'}
            </span>
          </div>
        )}

        {/* Données Extraites si présentes - Même police */}
        {hasData && extractedData && (
          <div className="space-y-4">
            {extractedData.actual !== undefined && (
              <p className="text-2xl sm:text-3xl leading-snug text-white font-normal tracking-tighter">
                Actual: {extractedData.actual}
              </p>
            )}
            {extractedData.forecast !== undefined && (
              <p className="text-2xl sm:text-3xl leading-snug text-white font-normal tracking-tighter">
                Forecast: {extractedData.forecast}
              </p>
            )}
            {extractedData.previous !== undefined && (
              <p className="text-2xl sm:text-3xl leading-snug text-white font-normal tracking-tighter">
                Previous: {extractedData.previous}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer avec "Lire l'article" - Remplace les étoiles (ligne 353-371) */}
      {signal.raw_data?.url && (
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-500">
            <a
              href={signal.raw_data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
            >
              <span className="text-sm">Lire l'article</span>
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
                className="h-4 w-4"
              >
                <path d="M7 17L17 7"></path>
                <path d="M7 7h10v10"></path>
              </svg>
            </a>
          </div>
        </div>
      )}
    </article>
  )

  // Style zigzag : alterner l'ordre selon la position dans la grille
  // Pattern zigzag : colonnes paires = source en haut, colonnes impaires = source en bas
  const columnIndex = index % 4 // Pour 4 colonnes
  const sourceFirst = columnIndex % 2 === 0 // Colonnes 0 et 2 = source en haut, 1 et 3 = source en bas

  return (
    <div className="space-y-6">
      {sourceFirst ? (
        <>
          {SourceCard}
          {MainCard}
        </>
      ) : (
        <>
          {MainCard}
          {SourceCard}
        </>
      )}
    </div>
  )
}
