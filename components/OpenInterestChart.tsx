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
} from 'recharts'
import optionsDataService, { type FormattedOptionsData } from '@/services/optionsDataService'
import { useAuth } from '@/hooks/useAuth'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'

interface OpenInterestChartProps {
  ticker: string
  date?: string // Date au format YYYY-MM-DD pour récupérer les données historiques
  currentPrice?: number
  showRangeFilter?: boolean
}

export default function OpenInterestChart({
  ticker,
  date,
  currentPrice,
  showRangeFilter = true,
}: OpenInterestChartProps) {
  const { loading: authLoading } = useAuth()
  const [data, setData] = useState<FormattedOptionsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterRange, setFilterRange] = useState(20) // Pourcentage de range autour du prix
  const [rawData, setRawData] = useState<FormattedOptionsData[]>([]) // Données brutes pour le filtrage local

  // Charger les données uniquement quand ticker, date ou authLoading changent
  useEffect(() => {
    if (authLoading || !ticker) return

    let isMounted = true
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await optionsDataService.getOpenInterestData(ticker, date)

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
        console.error('Error loading open interest data:', err)
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
  }, [ticker, date, authLoading])

  // Filtrer les données localement quand currentPrice ou filterRange changent
  useEffect(() => {
    if (rawData.length === 0) {
      setData([])
      return
    }

    let processedData = [...rawData]

    // Filtrer autour du prix actuel si disponible
    if (currentPrice && showRangeFilter) {
      processedData = optionsDataService.filterAroundPrice(
        processedData,
        currentPrice,
        filterRange
      )
    }

    // Limiter le nombre de strikes pour la performance
    processedData = optionsDataService.limitStrikes(processedData, 100)

    setData(processedData)
  }, [rawData, currentPrice, filterRange, showRangeFilter])

  // Format personnalisé pour le tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur">
          <p className="text-sm font-semibold text-white mb-2">Strike: ${label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

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
            Open Interest per Strike
          </h3>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            {ticker} - Open Interest Changes
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
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
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
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
            dataKey="call"
            fill="#4ade80"
            name="Call"
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="put"
            fill="#f87171"
            name="Put"
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Calls: {data.reduce((sum, item) => sum + item.call, 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span>Puts: {data.reduce((sum, item) => sum + item.put, 0).toLocaleString()}</span>
          </div>
        </div>
        <span className="text-[10px]">Powered by unusualwhales.com</span>
      </div>
    </div>
  )
}
