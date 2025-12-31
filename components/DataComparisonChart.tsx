/**
 * Composant Graphique de Comparaison Actual vs Forecast vs Previous
 * Affiche un graphique en barres pour comparer les valeurs économiques
 */

'use client'

import type { ExtractedData } from '@/types/signals'

interface DataComparisonChartProps {
  data: ExtractedData
}

export default function DataComparisonChart({ data }: DataComparisonChartProps) {
  if (!data.actual && !data.forecast && !data.previous) return null

  const values = [data.actual, data.forecast, data.previous].filter(v => v !== undefined) as number[]
  const max = Math.max(...values) * 1.15 // 15% de marge en haut
  const min = Math.min(...values) * 0.85 // 15% de marge en bas si négatif

  const actualPercent = data.actual !== undefined ? ((data.actual - min) / (max - min)) * 100 : 0
  const forecastPercent = data.forecast !== undefined ? ((data.forecast - min) / (max - min)) * 100 : 0
  const previousPercent = data.previous !== undefined ? ((data.previous - min) / (max - min)) * 100 : 0

  const formatValue = (value?: number): string => {
    if (value === undefined) return 'N/A'
    if (data.unit === 'percent') return `${value.toFixed(2)}%`
    if (data.unit === 'index') return value.toFixed(2)
    return value.toLocaleString('fr-FR')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3 h-32">
        {/* Forecast */}
        {data.forecast !== undefined && (
          <div className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-neutral-700/50 rounded-t border border-neutral-600/50 transition-all hover:opacity-80"
              style={{ height: `${Math.max(forecastPercent, 5)}%` }}
            />
            <div className="text-[10px] mt-2 text-neutral-500 font-medium uppercase tracking-wider">Forecast</div>
            <div className="text-sm font-bold text-neutral-300 font-mono">{formatValue(data.forecast)}</div>
          </div>
        )}

        {/* Actual */}
        {data.actual !== undefined && (
          <div className="flex-1 flex flex-col items-center">
            <div
              className={`w-full rounded-t border transition-all hover:opacity-80 ${
                data.actual > (data.forecast ?? 0)
                  ? 'bg-emerald-500/80 border-emerald-400/50'
                  : data.actual < (data.forecast ?? 0)
                  ? 'bg-red-500/80 border-red-400/50'
                  : 'bg-orange-500/80 border-orange-400/50'
              }`}
              style={{ height: `${Math.max(actualPercent, 5)}%` }}
            />
            <div className="text-[10px] mt-2 text-neutral-500 font-medium uppercase tracking-wider">Actual</div>
            <div
              className={`text-sm font-bold font-mono ${
                data.actual > (data.forecast ?? 0)
                  ? 'text-emerald-400'
                  : data.actual < (data.forecast ?? 0)
                  ? 'text-red-400'
                  : 'text-orange-400'
              }`}
            >
              {formatValue(data.actual)}
            </div>
          </div>
        )}

        {/* Previous */}
        {data.previous !== undefined && (
          <div className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-neutral-600/30 rounded-t border border-neutral-700/50 transition-all hover:opacity-80"
              style={{ height: `${Math.max(previousPercent, 5)}%` }}
            />
            <div className="text-[10px] mt-2 text-neutral-500 font-medium uppercase tracking-wider">Previous</div>
            <div className="text-sm font-semibold text-neutral-400 font-mono">{formatValue(data.previous)}</div>
          </div>
        )}
      </div>
    </div>
  )
}


