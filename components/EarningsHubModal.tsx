'use client'

import { useEffect, useState } from 'react'
import earningsHubClient from '@/lib/api/earningsHubClient'
import type { EarningsHubAnalysis } from '@/types/earningsHub'
import { BarChart2, Sparkles, History, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'

interface EarningsHubModalProps {
  isOpen: boolean
  onClose: () => void
  ticker: string
}

// Fonction pour obtenir la couleur du score
const getScoreColor = (score: 'A' | 'B' | 'C' | 'D' | 'F') => {
  switch (score) {
    case 'A':
      return { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100', pulse: 'bg-emerald-400', label: 'Excellent' }
    case 'B':
      return { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-100', pulse: 'bg-blue-400', label: 'Good' }
    case 'C':
      return { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-100', pulse: 'bg-yellow-400', label: 'Average' }
    case 'D':
      return { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-100', pulse: 'bg-orange-400', label: 'Weak' }
    case 'F':
      return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-100', pulse: 'bg-red-400', label: 'Very Weak' }
    default:
      return { bg: 'bg-neutral-500', text: 'text-neutral-600', border: 'border-neutral-100', pulse: 'bg-neutral-400', label: 'Unknown' }
  }
}

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function EarningsHubModal({ isOpen, onClose, ticker }: EarningsHubModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [analysis, setAnalysis] = useState<EarningsHubAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      setTimeout(() => setIsVisible(true), 10)
      document.body.style.overflow = 'hidden'
      
      if (ticker) {
        setLoading(true)
        setError(null)
        earningsHubClient.analyzeEarningsHub({ ticker, quartersLimit: 20 })
          .then((response) => {
            if (response.success) {
              setAnalysis(response.analysis)
            } else {
              setError(response.error || 'Erreur lors du chargement')
            }
          })
          .catch((err) => {
            setError(err.message || 'Erreur lors du chargement')
          })
          .finally(() => {
            setLoading(false)
          })
      }
    } else {
      setIsVisible(false)
      setTimeout(() => {
        setIsMounted(false)
        setAnalysis(null)
        setError(null)
      }, 300)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, ticker])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isMounted) return null

  const scoreColors = analysis ? getScoreColor(analysis.hubScore) : getScoreColor('F')

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onClose()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[151] flex items-center justify-center p-2 md:p-4 pt-20 md:pt-24 transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => {
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
      >
        <div className="relative w-full max-w-[98vw] lg:max-w-[95vw] max-h-[75vh] md:max-h-[80vh] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 shadow-2xl">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,.08),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,.08),transparent_45%)] pointer-events-none z-0"></div>

          {/* Close button */}
          <div className="absolute top-3 right-3 md:top-4 md:right-4 z-[250] pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onClose()
              }}
              className="p-2 md:p-2.5 rounded-lg bg-neutral-800/95 backdrop-blur-sm border border-white/20 md:border-2 md:border-white/30 text-white hover:text-orange-400 hover:bg-neutral-700 hover:border-orange-500/50 transition-all shadow-lg md:shadow-xl cursor-pointer"
              aria-label="Fermer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                className="md:w-[18px] md:h-[18px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full max-h-[75vh] md:max-h-[80vh]">
            {/* Header */}
            {analysis && (
              <div className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-sm border-b border-white/10 px-3 md:px-4 lg:px-6 py-3 md:py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold flex items-center justify-center text-xs md:text-sm shadow-lg">
                      {ticker}
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-white">
                        {ticker} Earnings Hub
                      </h2>
                      <p className="text-xs md:text-sm text-neutral-400">
                        Historical Earnings Analysis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-[10px] md:text-xs text-neutral-500 font-medium uppercase tracking-wide">Current Price</div>
                      <div className="text-lg md:text-xl font-medium tracking-tight text-white">${analysis.stats.currentPrice.toFixed(2)}</div>
                    </div>
                    <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
                    <div className="flex flex-col items-end">

                     
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content - Grid Layout like FlowAlerts (12 cols: 4 left, 8 right) */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-red-400 mb-2">Erreur</div>
                  <div className="text-neutral-400 text-sm">{error}</div>
                </div>
              </div>
            ) : analysis ? (
              <div className="flex-1 flex flex-col lg:flex-row gap-3 lg:gap-4 px-3 md:px-4 lg:px-6 py-3 md:py-4 lg:py-6 overflow-hidden">
                {/* LEFT: Stats & Analysis (4 cols = flex-[1]) */}
                <div className="lg:flex-[1] min-w-0 flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-r border-white/10 lg:pr-6 pt-4 lg:pt-0">
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Key Metrics Grid */}
                    <div>
                      <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-neutral-400" />
                        Performance Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 border border-white/10 p-3 rounded">
                          <div className="text-xs text-neutral-500 mb-1">EPS Beat Rate</div>
                          <div className="text-base font-medium text-white">{analysis.stats.epsBeatRate.toFixed(2)}%</div>
                          <div className="text-[10px] text-neutral-400 mt-1">{analysis.stats.epsBeatsCount} of {analysis.stats.totalQuarters} Quarters</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-3 rounded">
                          <div className="text-xs text-neutral-500 mb-1">Avg Surprise</div>
                          <div className={`text-base font-medium ${analysis.stats.avgEpsSurprise >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {analysis.stats.avgEpsSurprise >= 0 ? '+' : ''}{analysis.stats.avgEpsSurprise.toFixed(2)}%
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-1">Historical Avg</div>
                        </div>
                        {analysis.latestQuarter && (
                          <div className="bg-white/5 border border-white/10 p-3 rounded col-span-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-xs text-neutral-500 mb-1">Latest Quarter ({analysis.latestQuarter.period})</div>
                                <div className="text-base font-medium text-white">EPS ${analysis.latestQuarter.epsActual.toFixed(2)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-neutral-400">{formatDate(analysis.latestQuarter.reportDate)}</div>
                                <div className={`text-xs font-medium px-1.5 py-0.5 rounded inline-block mt-1 ${
                                  analysis.latestQuarter.epsBeat
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {analysis.latestQuarter.epsBeat ? 'Beat' : 'Miss'}
                                </div>
                              </div>
                            </div>
                            {/* Barre de progression visuelle */}
                            <div className="mt-3 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  analysis.latestQuarter.epsBeat ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                                style={{ 
                                  width: `${Math.min(
                                    (Math.abs(analysis.latestQuarter.epsActual) / Math.max(analysis.latestQuarter.epsEstimate, analysis.latestQuarter.epsActual)) * 100,
                                    100
                                  )}%` 
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                              <span>Actual: {analysis.latestQuarter.epsActual.toFixed(2)}</span>
                              <span>Est: {analysis.latestQuarter.epsEstimate.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interpretation Card */}
                    <div>
                      <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-neutral-400" />
                        AI Interpretation
                      </h3>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-4">
                          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            analysis.hubScore === 'A' || analysis.hubScore === 'B' ? 'text-emerald-400' :
                            analysis.hubScore === 'C' ? 'text-yellow-400' :
                            'text-red-400'
                          }`} />
                          <p className="text-xs leading-relaxed text-neutral-300">
                            <span className="font-medium text-white">Score {analysis.hubScore} ({scoreColors.label}).</span>{' '}
                            {analysis.interpretation.summary}
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          {analysis.interpretation.keyPoints.map((point, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className={`flex h-1.5 w-1.5 rounded-full ${
                                point.includes('⚠️') || point.includes('Tendance') || point.includes('manquer') ? 'bg-red-500' :
                                point.includes('✅') || point.includes('Amélioration') ? 'bg-emerald-500' :
                                'bg-neutral-400'
                              }`}></span>
                              <span className="text-xs font-medium text-neutral-300">{point.replace(/⚠️|✅/g, '').trim()}</span>
                            </div>
                          ))}
                        </div>

                        {analysis.interpretation.trends.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-neutral-500">Trend Signal</span>
                              {analysis.interpretation.trends.map((trend, idx) => (
                                <span
                                  key={idx}
                                  className={`text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                    trend.direction === 'improving'
                                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                      : trend.direction === 'deteriorating'
                                      ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                                      : 'text-neutral-400 bg-neutral-500/10 border border-neutral-500/20'
                                  }`}
                                >
                                  {trend.direction === 'improving' ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : trend.direction === 'deteriorating' ? (
                                    <TrendingDown className="w-3 h-3" />
                                  ) : null}
                                  {trend.direction === 'improving' ? 'Improving' : trend.direction === 'deteriorating' ? 'Deteriorating' : 'Stable'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Historical Data Table (8 cols = flex-[2]) */}
                <div className="lg:flex-[2] min-w-0 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-neutral-400" />
                        Earnings History
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-50">
                          <tr className="border-b border-white/5 bg-gradient-to-r from-neutral-900/98 via-neutral-900/95 to-neutral-900/98 backdrop-blur-xl shadow-lg">
                            <th className="py-3 pr-4 text-xs font-medium text-neutral-500 uppercase tracking-wider w-24">Period</th>
                            <th className="py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Report Date</th>
                            <th className="py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider text-right">EPS Act / Est</th>
                            <th className="py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider text-right">Surprise</th>
                            <th className="py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider text-right">1D Move</th>
                            <th className="py-3 pl-4 text-xs font-medium text-neutral-500 uppercase tracking-wider text-right">Win/Loss</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {analysis.history.map((quarter, idx) => (
                            <tr
                              key={idx}
                              className="group hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="py-3 pr-4 text-sm font-medium text-white">{quarter.period}</td>
                              <td className="py-3 px-4 text-sm text-neutral-400">{formatDate(quarter.reportDate)}</td>
                              <td className="py-3 px-4 text-sm text-white text-right tabular-nums">
                                {quarter.epsActual.toFixed(2)} <span className="text-neutral-400 font-normal">/ {quarter.epsEstimate.toFixed(2)}</span>
                              </td>
                              <td className={`py-3 px-4 text-sm text-right tabular-nums font-medium ${
                                quarter.epsSurprise >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {quarter.epsSurprise >= 0 ? '+' : ''}{quarter.epsSurprise.toFixed(2)}%
                              </td>
                              <td className={`py-3 px-4 text-sm text-right tabular-nums font-medium ${
                                quarter.priceMove1d !== null
                                  ? quarter.priceMove1d >= 0 ? 'text-emerald-400' : 'text-red-400'
                                  : 'text-neutral-500'
                              }`}>
                                {quarter.priceMove1d !== null
                                  ? `${quarter.priceMove1d >= 0 ? '+' : ''}${(quarter.priceMove1d * 100).toFixed(2)}%`
                                  : 'N/A'}
                              </td>
                              <td className="py-3 pl-4 text-right">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  quarter.epsBeat
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {quarter.epsBeat ? 'Beat' : 'Miss'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
