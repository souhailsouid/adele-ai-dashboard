'use client'

import { useState, useEffect } from 'react'
import type { FlowAlert } from '@/lib/api/flowAlertsClient'
import { Activity, Users, Briefcase, Newspaper, BarChart3, Sparkles, AlertTriangle, Bell, X } from 'lucide-react'
import UnifiedTimeline from './UnifiedTimeline'
import GreeksChart from './GreeksChart'
import OpenInterestChart from './OpenInterestChart'
import RegressionChart from './RegressionChart'
import TickerNewsTimeline from './TickerNewsTimeline'
import type { InstitutionalOwner } from '@/types/institutionalOwnership'
import type { InsiderTickerFlow, Insider } from '@/types/insiderTrades'
import type { DarkPoolTransaction } from '@/types/darkPools'
import institutionalOwnershipService from '@/services/institutionalOwnershipService'
import insiderTradesService from '@/services/insiderTradesService'
import darkPoolsService from '@/services/darkPoolsService'
import flowAlertsService from '@/services/flowAlertsService'

interface TradingTerminalProps {
  alert: FlowAlert | null
  onClose?: () => void
}

type NavSection = 'flow' | 'holdings' | 'insiders' | 'news'
type ChartView = 'greeks' | 'oi' | 'regression' | null

export default function TradingTerminal({ alert, onClose }: TradingTerminalProps) {
  const [activeNav, setActiveNav] = useState<NavSection>('flow')
  const [activeChart, setActiveChart] = useState<ChartView>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed'>('open')
  const [ownership, setOwnership] = useState<InstitutionalOwner[]>([])
  const [insiderTrades, setInsiderTrades] = useState<InsiderTickerFlow[]>([])
  const [insiders, setInsiders] = useState<Insider[]>([])
  const [darkPools, setDarkPools] = useState<DarkPoolTransaction[]>([])
  const [recentAlerts, setRecentAlerts] = useState<FlowAlert[]>([])
  const [loading, setLoading] = useState(true)

  // Charger le prix actuel et les données de base
  useEffect(() => {
    if (!alert?.ticker) return

    const loadData = async () => {
      setLoading(true)
      try {
        // Récupérer le prix actuel depuis l'alerte
        const price = parseFloat(alert.underlying_price || alert.strike?.toString() || '0')
        if (!isNaN(price)) {
          setCurrentPrice(price)
        }

        // Charger les données en parallèle
        const [ownershipData, insiderData, darkPoolsData, alertsData] = await Promise.all([
          institutionalOwnershipService.getOwnership(alert.ticker, 5).catch(() => []),
          insiderTradesService.getInsiderTrades(alert.ticker, 20).catch(() => []),
          darkPoolsService.getDarkPools(alert.ticker, 20).catch(() => []),
          flowAlertsService.getAlertsByTicker(alert.ticker, 50).catch(() => []),
        ])

        setOwnership(ownershipData)
        setInsiderTrades(insiderData)
        setRecentAlerts(alertsData.slice(0, 20)) // Top 20 pour The Tape

        // Charger les insiders séparément
        const insidersData = await insiderTradesService.getInsiders(alert.ticker).catch(() => [])
        setInsiders(insidersData)
        setDarkPools(darkPoolsData)
      } catch (error) {
        console.error('Error loading trading terminal data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [alert?.ticker])

  // Simuler le statut du marché (à remplacer par un vrai service)
  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    // Market open: 9:30 AM - 4:00 PM ET, Monday-Friday
    const isOpen = day >= 1 && day <= 5 && hour >= 9 && hour < 16
    setMarketStatus(isOpen ? 'open' : 'closed')
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase()
  }

  const getAlertTypeBadge = (alert: FlowAlert) => {
    const type = alert.type?.toLowerCase()
    if (type === 'sweep') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-sans bg-orange-500/20 text-orange-400 border border-orange-500/20 font-medium">
          SWEEP
        </span>
      )
    }
    if (type === 'block') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-sans bg-emerald-900/20 text-emerald-400 border border-emerald-500/10">
          BLOCK
        </span>
      )
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-sans bg-neutral-800 text-neutral-400 border border-white/5">
        SPLIT
      </span>
    )
  }

  if (!alert) return null

  return (
    <div className="h-full flex flex-col bg-black text-neutral-300 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-white/5 bg-neutral-950 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white font-semibold tracking-tight">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-neutral-800 to-neutral-700 flex items-center justify-center border border-white/10">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span>FlowDesk</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Ticker Search / Context */}
          <div className="flex items-center gap-3 bg-neutral-900/50 py-1 px-2 rounded-md border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">{alert.ticker}</span>
              {currentPrice && (
                <>
                  <span className="text-xs font-mono text-neutral-400">${currentPrice.toFixed(2)}</span>
                  <span
                    className={`text-xs font-mono flex items-center ${
                      priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                marketStatus === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'
              }`}
            />
            {marketStatus === 'open' ? 'Market Open' : 'Market Closed'}
          </span>
          <button className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 transition-colors">
            <Bell className="w-4 h-4 stroke-[1.5]" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 transition-colors"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: Navigation & Instrument Stats */}
        <aside className="w-64 border-r border-white/5 bg-neutral-950 flex flex-col shrink-0">
          <nav className="p-2 space-y-0.5">
            <button
              onClick={() => setActiveNav('flow')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeNav === 'flow'
                  ? 'bg-white/5 text-white border border-white/5'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
              }`}
            >
              <Activity className="w-4 h-4 text-orange-400" />
              Live Flow
            </button>
            <button
              onClick={() => setActiveNav('holdings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeNav === 'holdings'
                  ? 'bg-white/5 text-white border border-white/5'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              Holdings (13F)
            </button>
            <button
              onClick={() => setActiveNav('insiders')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeNav === 'insiders'
                  ? 'bg-white/5 text-white border border-white/5'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Insiders
            </button>
            <button
              onClick={() => setActiveNav('news')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeNav === 'news'
                  ? 'bg-white/5 text-white border border-white/5'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              News & Earnings
            </button>
          </nav>

          <div className="mt-4 px-4 pt-4 border-t border-white/5 flex-1 overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-3">
              Instrument Greeks
            </h3>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="p-2 bg-neutral-900/50 rounded border border-white/5">
                <div className="text-[10px] text-neutral-500">IV Rank</div>
                <div className="text-sm font-mono text-orange-400">68%</div>
              </div>
              <div className="p-2 bg-neutral-900/50 rounded border border-white/5">
                <div className="text-[10px] text-neutral-500">Put/Call Vol</div>
                <div className="text-sm font-mono text-red-400">1.42</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Delta</span>
                <span className="font-mono text-neutral-300">0.42</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Gamma</span>
                <span className="font-mono text-neutral-300">0.03</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Theta</span>
                <span className="font-mono text-red-400">-0.85</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <h3 className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-3">
                Unusual Activity
              </h3>
              <div className="p-2.5 rounded border border-red-500/20 bg-red-500/5 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-medium text-red-300">Bearish Divergence</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  Price making higher highs while Put flow volume increasing by 40%.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER: The Tape & Fundamentals */}
        <main className="flex-1 bg-grid flex flex-col min-w-0">
          {/* Filter Bar */}
          <div className="h-10 border-b border-white/5 flex items-center px-4 gap-4 bg-neutral-950/80 backdrop-blur shrink-0">
            <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-400">
              <span className="text-neutral-600">FILTER:</span>
              <button className="px-2 py-0.5 rounded bg-white/10 text-white border border-white/10 hover:border-white/20 transition-colors">
                Sweeps
              </button>
              <button className="px-2 py-0.5 rounded hover:bg-white/5 transition-colors">Blocks</button>
              <button className="px-2 py-0.5 rounded hover:bg-white/5 transition-colors">Dark Pool</button>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-400">
              <span className="text-neutral-600">MIN PREM:</span>
              <button className="px-2 py-0.5 rounded hover:bg-white/5 text-orange-400">$100k+</button>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveChart('greeks')}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  activeChart === 'greeks'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                Greeks
              </button>
              <button
                onClick={() => setActiveChart('oi')}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  activeChart === 'oi'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                OI
              </button>
              <button
                onClick={() => setActiveChart('regression')}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  activeChart === 'regression'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                Regression
              </button>
            </div>
          </div>

          {/* TAPE SECTION (Top Half) */}
          <div className="flex flex-col h-[50%] border-b border-white/5">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-white/5 bg-neutral-900/30 text-[10px] uppercase tracking-wider font-semibold text-neutral-500 shrink-0">
              <div className="col-span-1">Time</div>
              <div className="col-span-1">Sym</div>
              <div className="col-span-1">Exp</div>
              <div className="col-span-1">Strike</div>
              <div className="col-span-1">C/P</div>
              <div className="col-span-1 text-right">Spot</div>
              <div className="col-span-2 text-right">Details</div>
              <div className="col-span-2 text-right">Prem</div>
              <div className="col-span-2">Type</div>
            </div>

            {/* The Tape List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs">
              {recentAlerts.slice(0, 20).map((alertItem, index) => (
                <div
                  key={alertItem.id || index}
                  className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer group"
                >
                  <div className="col-span-1 text-neutral-400">
                    {alertItem.timestamp ? formatTime(alertItem.timestamp) : '--:--:--'}
                  </div>
                  <div className="col-span-1 font-bold text-white">{alertItem.ticker}</div>
                  <div className="col-span-1 text-neutral-400">
                    {alertItem.expiration ? formatDate(alertItem.expiration) : '--'}
                  </div>
                  <div className="col-span-1 text-neutral-300">${alertItem.strike}</div>
                  <div
                    className={`col-span-1 font-bold ${
                      alertItem.type?.toLowerCase() === 'call' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {alertItem.type?.toUpperCase() || 'PUT'}
                  </div>
                  <div className="col-span-1 text-right text-neutral-400">
                    ${parseFloat(alertItem.underlying_price || '0').toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right text-neutral-500">
                    {alertItem.alert_rule || 'OTM'}
                  </div>
                  <div className="col-span-2 text-right text-white font-medium">
                    ${((parseFloat(alertItem.premium || '0') * parseFloat(alertItem.size || '0')) / 1000).toFixed(1)}k
                  </div>
                  <div className="col-span-2 flex items-center gap-2">{getAlertTypeBadge(alertItem)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FUNDAMENTAL DATA & INSIGHTS (Bottom Half) */}
          <div className="flex-1 flex overflow-hidden bg-neutral-900/20">
            {/* 13F Holdings (Left) */}
            <div className="w-1/2 border-r border-white/5 flex flex-col">
              <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-neutral-400" />
                  13F Institutional Holders (Top 5)
                </h3>
                <span className="text-[10px] text-neutral-500 font-mono">Q2 UPDATE</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {ownership.slice(0, 5).map((holder, index) => (
                  <div
                    key={holder.cik}
                    className="bg-neutral-900/50 rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-orange-500">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-0.5">
                          <h4 className="text-xs font-semibold text-white truncate">{holder.name}</h4>
                          <span className="text-[10px] text-neutral-500 font-mono">CIK: {holder.cik}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1 gap-x-4 mt-2">
                          <div>
                            <div className="text-[10px] text-neutral-500">Ownership</div>
                            <div className="text-xs font-mono text-neutral-300">
                              {((holder.value / (holder.value + 1000000000)) * 100).toFixed(2)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-neutral-500">Units</div>
                            <div className="text-xs font-mono text-neutral-300">
                              {holder.shares.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-neutral-500">Market Value</div>
                            <div className="text-xs font-mono text-neutral-300">
                              ${(holder.value / 1000000000).toFixed(2)}B
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-neutral-500">Change</div>
                            <div className="text-xs font-mono text-emerald-400">+1.24%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unified Timeline: News, Insiders, Events (Right) */}
            <div className="w-1/2 flex flex-col">
              <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                  <Newspaper className="w-3.5 h-3.5 text-neutral-400" />
                  Unified Timeline
                </h3>
                <div className="flex gap-2">
                  <span className="px-1.5 py-0.5 text-[9px] bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                    News
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
                    Insiders
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <UnifiedTimeline alert={alert} ownership={ownership} insiderTrades={insiderTrades} darkPools={darkPools} />
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR: Structure & Levels */}
        <aside className="w-80 border-l border-white/5 bg-neutral-950 flex flex-col shrink-0">
          {/* Chart Section */}
          {activeChart && (
            <div className="h-1/2 border-b border-white/5 overflow-y-auto custom-scrollbar p-4">
              {activeChart === 'greeks' && alert?.ticker && (
                <GreeksChart ticker={alert.ticker} currentPrice={currentPrice || undefined} showRangeFilter={false} />
              )}
              {activeChart === 'oi' && alert?.ticker && (
                <OpenInterestChart
                  ticker={alert.ticker}
                  currentPrice={currentPrice || undefined}
                  showRangeFilter={true}
                />
              )}
              {activeChart === 'regression' && alert?.ticker && (
                <RegressionChart ticker={alert.ticker} timeframe="5y" showProjection={true} />
              )}
            </div>
          )}

          {/* Key Levels & Synthesis */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-neutral-900/20">
            <h3 className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-3">Key Levels</h3>

            <div className="space-y-2">
              {/* Resistance */}
              <div className="flex items-center justify-between p-2 rounded bg-neutral-900/30 border border-white/5">
                <div>
                  <div className="text-[10px] text-red-400/80">Call Wall</div>
                  <div className="text-sm font-mono text-white">$250.00</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-500">OI</div>
                  <div className="text-xs font-mono text-neutral-300">45k</div>
                </div>
              </div>

              {/* Pivot */}
              <div className="flex items-center justify-between p-2 rounded bg-neutral-900/30 border border-white/5">
                <div>
                  <div className="text-[10px] text-orange-400/80">Max Pain</div>
                  <div className="text-sm font-mono text-white">
                    {currentPrice ? `$${currentPrice.toFixed(2)}` : '$242.50'}
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className="flex items-center justify-between p-2 rounded bg-neutral-900/30 border border-white/5 bg-emerald-900/5 border-emerald-500/10">
                <div>
                  <div className="text-[10px] text-emerald-400/80">Put Wall</div>
                  <div className="text-sm font-mono text-white">$240.00</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-500">OI</div>
                  <div className="text-xs font-mono text-neutral-300">62k</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <h3 className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-orange-400" />
                AI Synthesis
              </h3>
              <div className="text-xs text-neutral-300 leading-relaxed font-light">
                <span className="text-orange-400 font-medium">Alert:</span> Insiders buying dips while 13F data
                shows Vanguard increasing stake by 1.2%. Despite bearish option flow, long-term holders are
                accumulating below ${currentPrice ? currentPrice.toFixed(2) : '242'} pivot.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
