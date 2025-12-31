/**
 * Composant Card pour afficher un signal RSS avec données extraites
 * Style cohérent avec le design system MarketFlow
 */

'use client'

import type { Signal } from '@/types/signals'
import signalsService from '@/services/signalsService'
import ExtractedDataDisplay from './ExtractedDataDisplay'
import Image from 'next/image'
import { TwitterIcon, BloombergIcon, YouTubeIcon, TruthSocialIcon } from '@/components/SocialIcons'
import type { ComponentType } from 'react'

// Mapping des feeds vers les logos PNG ou SVG (comme dans page.tsx)
// Prend en compte la plateforme pour déterminer le logo
const getFeedLogo = (feed: string | undefined, platform?: string): string | ComponentType<{ className?: string }> | null => {
  if (!feed) return null
  
  // Mapping par plateforme d'abord
  if (platform === 'youtube') {
    return YouTubeIcon
  }
  if (platform === 'twitter') {
    return TwitterIcon
  }
  if (platform === 'truth-social') {
    return TruthSocialIcon
  }
  
  // Mapping par feed (pour RSS traditionnel et fallback)
  const feedMap: Record<string, string | ComponentType<{ className?: string }>> = {
    'reuters': '/reuters.png',
    'bloomberg': '/bloomberg.png',
    'cnbc': '/cnbc.png',
    'financial-juice': '/financialjuice.png',
    'financial-times': '/financialtime.png',
    'investing': '/investing.png',
    'barchart': '/barchart.png',
    'benzinga': '/benzinga.png',
    'wsj': '/wsj.png',
    'wsj-markets': '/wsj.png',
    'wsj-world': '/wsj.png',
    'personalities': TwitterIcon,
    'real-vision': YouTubeIcon, // YouTube maintenant
    'social': TwitterIcon,
    'twitter': TwitterIcon,
    'youtube': YouTubeIcon,
    'trump-truth-social': TruthSocialIcon,
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

  // Liste des personnalités connues
  const knownPersonalities = [
    'Elon Musk', 'Bill Ackman', 'Carl Icahn', 'Cathie Wood', 'Michael Saylor',
    'Warren Buffett', 'Ray Dalio', 'Jeff Bezos', 'Mark Zuckerberg', 'Tim Cook',
    'Satoshi Nakamoto', 'Vitalik Buterin', 'Charlie Munger', 'David Einhorn',
    'Paul Tudor Jones', 'Stanley Druckenmiller', 'George Soros', 'Jim Simons',
    'Donald Trump', 'Trump', 'Donald J. Trump',
    'Musk', 'Ackman', 'Icahn', 'Wood', 'Saylor', 'Buffett', 'Dalio', 'Bezos',
    'Zuckerberg', 'Cook', 'Buterin', 'Munger', 'Einhorn', 'Soros', 'Simons'
  ]
  
  // Détecter si c'est Truth Social (Trump)
  const isTruthSocial = signal.raw_data?.platform === 'truth-social' ||
                       (signal.raw_data?.feed === 'social' && signal.raw_data?.platform === 'truth-social') ||
                       signal.raw_data?.feed === 'trump-truth-social'

  // Extraire le compte depuis signal.type ou l'URL (pour Twitter et Truth Social)
  const extractAccount = (): { account: string | null; fromType: boolean } => {
    // Cas 1: Extraire depuis signal.type pour Twitter (ex: "social-reuters-twitter" → "reuters")
    if (signal.type && signal.type.includes('-twitter')) {
      const match = signal.type.match(/social-([^-]+)-twitter/)
      if (match && match[1]) {
        const account = match[1]
        const capitalized = account.charAt(0).toUpperCase() + account.slice(1).toLowerCase()
        return { account: capitalized, fromType: true }
      }
    }
    
    // Cas 2: Extraire depuis signal.type pour Truth Social (ex: "social-trump-truth-social" → "trump")
    if (signal.type && signal.type.includes('-truth-social')) {
      const match = signal.type.match(/social-([^-]+)-truth-social/)
      if (match && match[1]) {
        const account = match[1]
        const capitalized = account.charAt(0).toUpperCase() + account.slice(1).toLowerCase()
        return { account: capitalized, fromType: true }
      }
    }
    
    // Cas 3: Extraire depuis l'URL Twitter (ex: "https://x.com/Reuters/status/..." → "Reuters")
    if (signal.raw_data?.url) {
      const urlMatch = signal.raw_data.url.match(/(?:x\.com|twitter\.com)\/([^\/]+)/i)
      if (urlMatch && urlMatch[1]) {
        const account = urlMatch[1]
        // Ne pas prendre "status" ou "i" (images)
        if (account !== 'status' && account !== 'i' && account !== 'intent') {
          return { account: account.charAt(0).toUpperCase() + account.slice(1), fromType: false }
        }
      }
    }
    
    return { account: null, fromType: false }
  }

  // Extraire le nom de la personnalité si c'est le feed "personalities" ou platform "twitter"
  const isPersonalityFeed = signal.raw_data?.feed === 'personalities' || 
                            signal.raw_data?.platform === 'twitter' ||
                            signal.raw_data?.platform === 'truth-social'
  
  // Détecter les signaux Twitter de manière plus robuste :
  // 1. feed === 'social' && platform === 'twitter'
  // 2. signal.type contient '-twitter' (ex: "social-reuters-twitter")
  // 3. URL contient x.com ou twitter.com
  const isSocialTwitter = 
    (signal.raw_data?.feed === 'social' && signal.raw_data?.platform === 'twitter') ||
    (signal.type && signal.type.includes('-twitter')) ||
    (signal.raw_data?.url && /(?:x\.com|twitter\.com)/i.test(signal.raw_data.url))
  
  // Détecter les signaux Truth Social
  const isSocialTruthSocial = 
    (signal.raw_data?.feed === 'social' && signal.raw_data?.platform === 'truth-social') ||
    (signal.type && signal.type.includes('-truth-social'))
  
  // Extraire le compte pour Twitter et Truth Social
  let accountInfo: { account: string | null; fromType: boolean } = { account: null, fromType: false }
  if (isSocialTwitter || isSocialTruthSocial) {
    accountInfo = extractAccount()
  }
  const socialAccount = accountInfo.account
  
  // Chercher le nom dans les tags d'abord (priorité)
  let personalityName: string | null = null
  if (isPersonalityFeed) {
    // 1. Chercher dans les tags (priorité la plus haute)
    if (signal.tags && signal.tags.length > 0) {
      for (const tag of signal.tags) {
        const foundPersonality = knownPersonalities.find(name => 
          tag.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(tag.toLowerCase())
        )
        if (foundPersonality) {
          // Utiliser le nom complet si disponible
          const fullName = knownPersonalities.find(n => 
            n.toLowerCase().includes(foundPersonality.toLowerCase()) && n.length > foundPersonality.length
          ) || foundPersonality
          personalityName = fullName
          break
        }
      }
    }
    
    // 2. Si pas trouvé dans les tags, chercher dans le titre ou la description complète
    if (!personalityName) {
      const searchText = `${rawTitle} ${signal.raw_data?.description || ''}`.toLowerCase()
      for (const name of knownPersonalities) {
        if (searchText.includes(name.toLowerCase())) {
          // Utiliser le nom complet si disponible
          const fullName = knownPersonalities.find(n => 
            n.toLowerCase().includes(name.toLowerCase()) && n.length > name.length
          ) || name
          personalityName = fullName
          break
        }
      }
    }
    
    // 3. Si toujours pas trouvé, chercher un pattern "Nom:" dans le titre
    if (!personalityName && rawTitle) {
      const nameMatch = rawTitle.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?):\s*(.+)$/)
      if (nameMatch && nameMatch[1]) {
        const potentialName = nameMatch[1].trim()
        // Vérifier si ça ressemble à un nom (2-3 mots, commence par majuscule)
        if (potentialName.split(' ').length <= 3 && /^[A-Z]/.test(potentialName)) {
          personalityName = potentialName
        }
      }
    }
  }
  
  // Détecter si c'est Trump (utilise Truth Social)
  // Vérifier d'abord la plateforme, puis le nom, puis le compte extrait
  const isTrump = isTruthSocial || 
                  isSocialTruthSocial ||
                  (personalityName && (
                    personalityName.toLowerCase().includes('trump') || 
                    personalityName.toLowerCase() === 'trump'
                  )) ||
                  (socialAccount !== null && socialAccount.toLowerCase().includes('trump'))

  // Carte Source - Style NewsStats (ligne 375-387)
  // Utiliser TruthSocialIcon pour Truth Social, sinon le logo basé sur feed + platform
  const feedLogo = (isTruthSocial || isSocialTruthSocial || isTrump)
    ? TruthSocialIcon 
    : getFeedLogo(signal.raw_data?.feed, signal.raw_data?.platform)
  const isSvgLogo = feedLogo && typeof feedLogo !== 'string'
  const IconComponent = isSvgLogo ? (feedLogo as ComponentType<{ className?: string }>) : null
  
  // Déterminer le nom de la plateforme à afficher
  const platformName = (isTruthSocial || isSocialTruthSocial || isTrump)
    ? 'Truth Social'
    : (isSocialTwitter || signal.raw_data?.platform === 'twitter' ? 'X (Twitter)' : null)
  
  // Effet couleur : Truth Social (violet) pour Truth Social, Twitter (bleu) pour les autres personnalités
  const twitterColorClass = isPersonalityFeed 
    ? ((isTruthSocial || isSocialTruthSocial || isTrump)
        ? 'hover:border-purple-500/30 border-purple-500/10 bg-purple-500/5'
        : 'hover:border-blue-500/30 border-blue-500/10 bg-blue-500/5')
    : 'hover:border-orange-500/30'
  
  const SourceCard = (
    <article className={`glass-card rounded-2xl p-4 flex gap-4 items-center transition-all ${twitterColorClass}`}>
      <div className="h-9 w-9 bg-gradient-to-br from-neutral-700 to-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
        {feedLogo ? (
          isSvgLogo && IconComponent ? (
            // Composant SVG
            <div className="text-neutral-300">
              <IconComponent className="h-5 w-5" />
            </div>
          ) : (
            // Image PNG
            <Image
              src={feedLogo as string}
              alt={signal.raw_data?.feed || 'Feed'}
              width={36}
              height={36}
              className="object-contain"
            />
          )
        ) : (
          <span className="text-sm">📰</span>
        )}
      </div>
        <div className="flex-1 min-w-0">
        {personalityName ? (
          <>
            <p className="text-sm font-semibold tracking-tight leading-tight text-white truncate">
              {personalityName}
            </p>
            <div className="flex items-center gap-2">
              {platformName && (
                <span className="text-xs text-neutral-500">
                  {platformName}
                </span>
              )}
              <span className="text-xs text-neutral-400">
                {signalsService.formatRelativeDate(signal.timestamp)}
              </span>
            </div>
          </>
        ) : socialAccount ? (
          <>
            <p className="text-sm font-semibold tracking-tight leading-tight text-white truncate">
              {(isSocialTruthSocial || isTrump) ? (isTrump ? 'Donald Trump' : socialAccount) : `@${socialAccount}`}
            </p>
            <div className="flex items-center gap-2">
              {platformName && (
                <span className="text-xs text-neutral-500">
                  {platformName}
                </span>
              )}
              <span className="text-xs text-neutral-400">
                {signalsService.formatRelativeDate(signal.timestamp)}
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-medium tracking-tight leading-tight text-white truncate">
              {signal.raw_data.feed || 'N/A'}
            </p>
            <div className="flex items-center gap-2">
              {platformName && (
                <span className="text-xs text-neutral-500">
                  {platformName}
                </span>
              )}
              <span className="text-xs text-neutral-400">
                {signalsService.formatRelativeDate(signal.timestamp)}
              </span>
            </div>
          </>
          )}
        </div>
    </article>
  )

  // Carte principale - Style NewsStats (ligne 348-373) adaptée pour articles
  // Pour les personnalités, reconstruire le titre complet depuis rawTitle
  const mainTitle = isPersonalityFeed 
    ? rawTitle.replace(/^FinancialJuice:\s*/i, '').trim() 
    : (description ? `${title} ${description}` : title)
  
  // Effet couleur : Truth Social (violet) pour Truth Social, Twitter (bleu) pour les autres personnalités
  const mainCardTwitterClass = isPersonalityFeed 
    ? ((isTruthSocial || isSocialTruthSocial || isTrump)
        ? 'hover:border-purple-500/30 border-purple-500/10 bg-purple-500/5'
        : 'hover:border-blue-500/30 border-blue-500/10 bg-blue-500/5')
    : 'hover:border-orange-500/30'
  
  const MainCard = (
    <article className={`glass-card rounded-2xl p-6 flex flex-col min-h-[420px] justify-between transition-all ${mainCardTwitterClass}`}>
      {/* Contenu principal */}
      <div>
        {/* Titre - Même police que NewsStats ligne 340 */}
        <p className="text-2xl sm:text-3xl leading-snug text-white font-normal tracking-tighter">
          {mainTitle}
        </p>

        {/* Description si présente - Même police (seulement si ce n'est pas une personnalité) */}
        {description && !isPersonalityFeed && title !== description && (
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
