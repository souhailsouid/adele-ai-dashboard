/**
 * Composant Badge de Surprise Économique
 * Affiche un badge avec emoji et couleur selon le type de surprise
 */

'use client'

interface SurpriseBadgeProps {
  surprise: 'positive' | 'negative' | 'neutral'
  magnitude?: number
}

export default function SurpriseBadge({ surprise, magnitude }: SurpriseBadgeProps) {
  const config = {
    positive: {
      emoji: '📈',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      label: 'Surprise positive',
    },
    negative: {
      emoji: '📉',
      color: 'bg-red-500/10 text-red-400 border-red-500/20',
      label: 'Surprise négative',
    },
    neutral: {
      emoji: '➡️',
      color: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
      label: 'Dans les attentes',
    },
  }

  const { emoji, color, label } = config[surprise]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${color}`}
    >
      <span className="text-base">{emoji}</span>
      <span>{label}</span>
      {magnitude !== undefined && (
        <span className="ml-1 font-mono">({Math.abs(magnitude).toFixed(2)}pp)</span>
      )}
    </span>
  )
}


