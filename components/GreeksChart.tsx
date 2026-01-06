'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts'
import greeksService, { type FormattedGreekData } from '@/services/greeksService'
import { useAuth } from '@/hooks/useAuth'
import { TrendingUp, TrendingDown, Loader2, Info } from 'lucide-react'

interface GreeksChartProps {
  ticker: string
  date?: string // Date au format YYYY-MM-DD pour récupérer les données historiques
  currentPrice?: number
  showRangeFilter?: boolean
  greekType?: 'gamma' | 'delta' | 'vega' | 'theta' // Type de Greek à afficher
}

export default function GreeksChart({
  ticker,
  date,
  currentPrice,
  showRangeFilter = true,
  greekType = 'gamma',
}: GreeksChartProps) {
  const { loading: authLoading } = useAuth()
  const [data, setData] = useState<FormattedGreekData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterRange, setFilterRange] = useState(20) // Pourcentage de range autour du prix
  const [rawData, setRawData] = useState<FormattedGreekData[]>([]) // Données brutes pour le filtrage local
  const [useSpotExposures, setUseSpotExposures] = useState(true) // Utiliser les expositions spot par défaut

  // Charger les données uniquement quand ticker, date ou authLoading changent
  useEffect(() => {
    if (authLoading || !ticker) return

    let isMounted = true
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await greeksService.getGreeksData(ticker, date, useSpotExposures)

        if (!isMounted) return

        if (!response.success) {
          setError(response.error || 'Erreur lors du chargement des données')
          setData([])
          setRawData([])
          return
        }

        // Stocker les données brutes
        setRawData(response.data)
      } catch (err: any) {
        if (!isMounted) return
        console.error('Error loading greeks data:', err)
        setError(err.message || 'Erreur lors du chargement des données')
        setData([])
        setRawData([])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [ticker, date, authLoading, useSpotExposures])

  // Filtrer les données localement quand currentPrice ou filterRange changent
  useEffect(() => {
    if (rawData.length === 0) {
      setData([])
      return
    }

    let processedData = [...rawData]
    
    // Filtrer autour du prix actuel si disponible et si le prix est valide
    if (currentPrice && showRangeFilter && currentPrice > 0) {
      // Vérifier si le currentPrice est dans une plage raisonnable par rapport aux strikes
      const strikes = processedData.map(d => parseFloat(d.strike))
      const minStrike = Math.min(...strikes)
      const maxStrike = Math.max(...strikes)
      
      // Ne filtrer que si le currentPrice est proche des strikes disponibles
      if (currentPrice >= minStrike * 0.5 && currentPrice <= maxStrike * 1.5) {
        const beforeFilter = processedData.length
        processedData = greeksService.filterAroundPrice(
          processedData,
          currentPrice,
          filterRange
        )
        console.log(`Filtered from ${beforeFilter} to ${processedData.length} strikes around ${currentPrice} ±${filterRange}%`)
      } else {
        console.log(`Skipping filter: currentPrice ${currentPrice} is outside strike range [${minStrike}, ${maxStrike}]`)
      }
    }
    
    // Limiter le nombre de strikes pour la performance (seulement si on a beaucoup de données)
    if (processedData.length > 100) {
      const beforeLimit = processedData.length
      processedData = greeksService.limitStrikes(processedData, 100)
      console.log(`Limited from ${beforeLimit} to ${processedData.length} strikes`)
    }
    
    setData(processedData)
  }, [rawData, currentPrice, filterRange, showRangeFilter])
  
  console.log('data_greeks (final)', data)
  // Format personnalisé pour le tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-neutral-900/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur">
          <p className="text-sm font-semibold text-white mb-2">Strike: ${label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="space-y-1">
              <p className="text-xs" style={{ color: entry.color }}>
                {entry.name}: {entry.value.toLocaleString()}
              </p>
              {data.delta !== undefined && (
                <p className="text-xs text-neutral-400">
                  Delta: {data.delta?.toLocaleString() || 'N/A'}
                </p>
              )}
              {data.vega !== undefined && (
                <p className="text-xs text-neutral-400">
                  Vega: {data.vega?.toLocaleString() || 'N/A'}
                </p>
              )}
              {data.theta !== undefined && (
                <p className="text-xs text-neutral-400">
                  Theta: {data.theta?.toLocaleString() || 'N/A'}
                </p>
              )}
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Obtenir la valeur du Greek à afficher
  const getGreekValue = (item: FormattedGreekData): number => {
    switch (greekType) {
      case 'delta':
        return item.delta || 0
      case 'vega':
        return item.vega || 0
      case 'theta':
        return item.theta || 0
      default:
        return item.gamma
    }
  }

  // Obtenir le nom du Greek
  const getGreekName = (): string => {
    switch (greekType) {
      case 'delta':
        return 'Delta'
      case 'vega':
        return 'Vega'
      case 'theta':
        return 'Theta'
      default:
        return 'Gamma'
    }
  }

  // Préparer les données pour le graphique
  const chartData = data.map((item) => ({
    strike: item.strike,
    value: getGreekValue(item),
    color: getGreekValue(item) > 0 ? '#4ade80' : '#f87171',
    delta: item.delta,
    vega: item.vega,
    theta: item.theta,
  }))

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-8 border border-white/10">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          <span className="ml-3 text-neutral-400">Chargement des données...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-8 border border-white/10">
        <div className="text-center py-12">
          <p className="text-red-400 mb-2">Erreur</p>
          <p className="text-sm text-neutral-400">{error}</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 border border-white/10">
        <div className="text-center py-12">
          <p className="text-neutral-400">Aucune donnée disponible pour {ticker}</p>
        </div>
      </div>
    )
  }

  const totalPositive = chartData.filter((d) => d.value > 0).reduce((sum, d) => sum + d.value, 0)
  const totalNegative = chartData.filter((d) => d.value < 0).reduce((sum, d) => sum + Math.abs(d.value), 0)

  return (
    <div className="glass-card rounded-xl p-6 border border-white/10 bg-neutral-900/40 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            {getGreekName()} Exposure per Strike
          </h3>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            {ticker} - {getGreekName()} Exposure Changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentPrice && showRangeFilter && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Range:</span>
              <select
                value={filterRange}
                onChange={(e) => setFilterRange(Number(e.target.value))}
                className="bg-neutral-800 border border-white/10 text-white text-xs rounded px-2 py-1 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                <option value="10">±10%</option>
                <option value="20">±20%</option>
                <option value="30">±30%</option>
                <option value="50">±50%</option>
                <option value="100">All</option>
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Type:</span>
            <select
              value={greekType}
              onChange={(e) => {
                // Note: greekType est une prop, donc on ne peut pas le changer directement
                // Il faudrait passer une fonction onChange au parent
              }}
              className="bg-neutral-800 border border-white/10 text-white text-xs rounded px-2 py-1 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
              disabled
            >
              <option value="gamma">Gamma</option>
              <option value="delta">Delta</option>
              <option value="vega">Vega</option>
              <option value="theta">Theta</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info Tooltip */}
      <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-neutral-300">
          <p className="font-medium text-orange-300 mb-1">{getGreekName()} Exposure</p>
          <p className="text-neutral-400">
            {greekType === 'gamma' 
              ? 'Un Gamma positif (Long Gamma) suggère une volatilité réduite. Un Gamma négatif (Short Gamma) suggère une volatilité amplifiée.'
              : greekType === 'delta'
              ? 'Le Delta mesure la sensibilité du prix de l\'option par rapport au prix de l\'actif sous-jacent.'
              : greekType === 'vega'
              ? 'Le Vega mesure la sensibilité du prix de l\'option par rapport à la volatilité implicite.'
              : 'Le Theta mesure la dépréciation temporelle de l\'option.'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          barCategoryGap="10%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#2d3035"
            vertical={false}
            horizontal={true}
          />
          <XAxis
            dataKey="strike"
            stroke="#888"
            fontSize={11}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#888"
            fontSize={11}
            tickFormatter={(value) => {
              if (Math.abs(value) >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`
              } else if (Math.abs(value) >= 1000) {
                return `${(value / 1000).toFixed(0)}k`
              }
              return value.toString()
            }}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Bar
            dataKey="value"
            name={getGreekName()}
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Positive: {totalPositive.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span>Negative: {totalNegative.toLocaleString()}</span>
          </div>
        </div>
        <span className="text-[10px]">Powered by unusualwhales.com</span>
      </div>
    </div>
  )
}
