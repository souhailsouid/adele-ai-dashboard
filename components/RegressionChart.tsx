'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from 'recharts'
import regressionService, { type RegressionPoint } from '@/services/regressionService'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, TrendingUp, Info } from 'lucide-react'

interface RegressionChartProps {
  ticker: string
  candleSize?: string // Taille de la bougie (ex: '1d', '1w', '1m')
  timeframe?: 'ytd' | '1y' | '3y' | '5y' | '10y' | 'max' // Période d'affichage
  showProjection?: boolean // Afficher la projection future
  projectionDays?: number // Nombre de jours à projeter
}

export default function RegressionChart({
  ticker,
  candleSize = '1d',
  timeframe = '5y',
  showProjection = true,
  projectionDays = 365,
}: RegressionChartProps) {
  const { loading: authLoading } = useAuth()
  const [data, setData] = useState<RegressionPoint[]>([])
  const [projectionData, setProjectionData] = useState<RegressionPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [regressionValue, setRegressionValue] = useState<number | null>(null)
  const [rSquared, setRSquared] = useState<number | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)

  // Calculer le nombre de bougies selon le timeframe
  const getLimitForTimeframe = (tf: string): number => {
    switch (tf) {
      case 'ytd':
        return 250 // ~1 an de trading
      case '1y':
        return 252
      case '3y':
        return 756
      case '5y':
        return 1260
      case '10y':
        return 2520
      case 'max':
        return 5000
      default:
        return 1260 // 5 ans par défaut
    }
  }

  // Charger les données
  useEffect(() => {
    if (authLoading || !ticker) return

    let isMounted = true
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const limit = getLimitForTimeframe(selectedTimeframe)
        const response = await regressionService.getRegressionData(ticker, candleSize, limit)

        if (!isMounted) return

        if (!response.success) {
          setError(response.error || 'Erreur lors du chargement des données')
          setData([])
          setProjectionData([])
          return
        }

        // Déterminer le point de séparation entre données historiques et projection
        const lastDataPoint = response.data[response.data.length - 1]
        if (lastDataPoint) {
          setCurrentPrice(lastDataPoint.price)
          setRegressionValue(lastDataPoint.regression)
        }
        
        // Stocker le R² pour l'affichage
        if (response.regression) {
          setRSquared(response.regression.rSquared)
        }

        // Générer la projection si demandée
        if (showProjection && response.regression) {
          const projection = regressionService.extrapolateProjection(
            response.regression,
            response.data.length,
            projectionDays
          )
          setProjectionData(projection)
        } else {
          setProjectionData([])
        }

        setData(response.data)
      } catch (err: any) {
        if (!isMounted) return
        console.error('Error loading regression data:', err)
        setError(err.message || 'Erreur lors du chargement des données')
        setData([])
        setProjectionData([])
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
  }, [ticker, candleSize, selectedTimeframe, showProjection, projectionDays, authLoading])

  // Format personnalisé pour le tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as RegressionPoint
      return (
        <div className="bg-neutral-900/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur">
          <p className="text-sm font-semibold text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
          {data && (
            <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
              <p className="text-xs text-neutral-400">+2σ: {data.plus2Sigma.toFixed(2)}</p>
              <p className="text-xs text-neutral-400">+1σ: {data.plus1Sigma.toFixed(2)}</p>
              <p className="text-xs text-neutral-400">-1σ: {data.minus1Sigma.toFixed(2)}</p>
              <p className="text-xs text-neutral-400">-2σ: {data.minus2Sigma.toFixed(2)}</p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Formater la date pour l'axe X
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })
  }

  // Combiner les données historiques et la projection
  const chartData = [...data, ...projectionData]
  const projectionStartIndex = data.length

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

  return (
    <div className="glass-card rounded-xl p-6 border border-white/10 bg-neutral-900/40 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Régression linéaire
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-neutral-400 font-mono">
              {ticker} - Canal de régression linéaire
            </p>
            {rSquared !== null && (
              <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                <span className="text-[10px] text-neutral-500 font-mono">Linéarité: </span>
                <span className="text-[10px] text-orange-400 font-mono font-semibold">
                  {rSquared.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center gap-1 bg-neutral-800/50 rounded-lg p-1">
            {(['ytd', '1y', '3y', '5y', '10y', 'max'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedTimeframe === tf
                    ? 'bg-orange-500/20 text-orange-400 font-medium'
                    : 'text-neutral-400 hover:text-neutral-300'
                }`}
              >
                {tf === 'ytd' ? 'YTD' : tf === '1y' ? '1A' : tf === '3y' ? '3A' : tf === '5y' ? '5A' : tf === '10y' ? '10A' : 'MAX'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Tooltip */}
      <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-neutral-300">
          <p className="font-medium text-orange-300 mb-1">Canal de régression linéaire</p>
          <p className="text-neutral-400">
            La ligne jaune représente la tendance linéaire. Les lignes grises pointillées indiquent les écarts-types (±1σ, ±2σ) qui forment le canal de volatilité.
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3035" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#888"
            fontSize={11}
            tickLine={false}
            tickFormatter={formatDate}
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#888"
            fontSize={11}
            tickLine={false}
            tickFormatter={(value) => {
              if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
              if (value >= 100) return value.toFixed(0)
              return value.toFixed(1)
            }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="line"
            wrapperStyle={{ paddingTop: '20px' }}
          />
          
          {/* Zone de projection (fond gris) */}
          {showProjection && projectionStartIndex > 0 && (
            <ReferenceArea
              x1={chartData[projectionStartIndex]?.date}
              x2={chartData[chartData.length - 1]?.date}
              fill="#4a5568"
              fillOpacity={0.1}
              label="Projection"
            />
          )}

          {/* Lignes d'écart-type */}
          <Line
            type="monotone"
            dataKey="plus2Sigma"
            stroke="#6b7280"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="+2σ"
            legendType="square"
          />
          <Line
            type="monotone"
            dataKey="plus1Sigma"
            stroke="#6b7280"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="+1σ"
            legendType="triangle"
          />
          <Line
            type="monotone"
            dataKey="minus1Sigma"
            stroke="#6b7280"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="-1σ"
            legendType="triangle"
          />
          <Line
            type="monotone"
            dataKey="minus2Sigma"
            stroke="#6b7280"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="-2σ"
            legendType="square"
          />

          {/* Ligne de régression */}
          <Line
            type="monotone"
            dataKey="regression"
            stroke="#fbbf24"
            strokeWidth={2}
            dot={false}
            name="Régression"
            legendType="diamond"
          />

          {/* Prix réel */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            name="Prix"
            legendType="circle"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Footer avec valeurs actuelles */}
      {currentPrice !== null && regressionValue !== null && (
        <div className="mt-4 p-4 bg-neutral-800/50 rounded-lg border border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
            <div>
              <p className="text-neutral-500 mb-1">Prix</p>
              <p className="text-blue-400 font-mono font-semibold">{currentPrice.toFixed(2)} $US</p>
            </div>
            <div>
              <p className="text-neutral-500 mb-1">Régression</p>
              <p className="text-yellow-400 font-mono font-semibold">{regressionValue.toFixed(2)} $US</p>
            </div>
            {data.length > 0 && (
              <>
                <div>
                  <p className="text-neutral-500 mb-1">+2σ</p>
                  <p className="text-neutral-400 font-mono">{data[data.length - 1].plus2Sigma.toFixed(2)} $US</p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1">+1σ</p>
                  <p className="text-neutral-400 font-mono">{data[data.length - 1].plus1Sigma.toFixed(2)} $US</p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1">-1σ</p>
                  <p className="text-neutral-400 font-mono">{data[data.length - 1].minus1Sigma.toFixed(2)} $US</p>
                </div>
                <div>
                  <p className="text-neutral-500 mb-1">-2σ</p>
                  <p className="text-neutral-400 font-mono">{data[data.length - 1].minus2Sigma.toFixed(2)} $US</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
