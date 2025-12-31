/**
 * Composant d'affichage des données extraites (Actual, Forecast, Previous, Surprise)
 * Utilisé dans SignalCard pour afficher les données économiques structurées
 */

'use client'

import type { ExtractedData } from '@/types/signals'
import SurpriseBadge from './SurpriseBadge'
import DataComparisonChart from './DataComparisonChart'

interface ExtractedDataDisplayProps {
  data: ExtractedData
}

export default function ExtractedDataDisplay({ data }: ExtractedDataDisplayProps) {
  const formatValue = (value?: number): string => {
    if (value === undefined) return 'N/A'
    if (data.unit === 'percent') return `${value.toFixed(2)}%`
    if (data.unit === 'index') return value.toFixed(2)
    return value.toLocaleString('fr-FR')
  }

  return (
    <div className="glass-card rounded-lg p-4 space-y-4 border border-white/5 bg-gradient-to-br from-orange-500/5 to-transparent">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm tracking-tight">
            {data.indicator || 'Données économiques'}
          </span>
          {data.region && (
            <span className="text-[10px] bg-neutral-800/50 text-neutral-400 px-2 py-0.5 rounded border border-white/5">
              {data.region}
            </span>
          )}
        </div>
        {data.surprise && (
          <SurpriseBadge surprise={data.surprise} magnitude={data.surpriseMagnitude} />
        )}
      </div>

      {/* Graphique de comparaison */}
      {(data.actual !== undefined || data.forecast !== undefined || data.previous !== undefined) && (
        <DataComparisonChart data={data} />
      )}

      {/* Valeurs détaillées */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
        {data.actual !== undefined && (
          <div className="text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Actual</div>
            <div className="text-lg font-bold text-white font-mono">{formatValue(data.actual)}</div>
          </div>
        )}
        {data.forecast !== undefined && (
          <div className="text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Forecast</div>
            <div className="text-lg font-semibold text-neutral-300 font-mono">{formatValue(data.forecast)}</div>
          </div>
        )}
        {data.previous !== undefined && (
          <div className="text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Previous</div>
            <div className="text-lg font-semibold text-neutral-400 font-mono">{formatValue(data.previous)}</div>
          </div>
        )}
      </div>

      {/* Métadonnées */}
      {(data.period || data.dataType) && (
        <div className="flex items-center gap-2 text-[10px] text-neutral-600">
          {data.period && <span className="uppercase tracking-wider">{data.period}</span>}
          {data.period && data.dataType && <span>•</span>}
          {data.dataType && (
            <span className="capitalize">
              {data.dataType.replace('_', ' ')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}


