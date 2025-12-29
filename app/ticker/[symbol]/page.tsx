/**
 * Page de détail d'un ticker avec signaux FMP et RSS
 * Style inspiré de HeroDashboard et MacroCalendar
 */

'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import TickerAlerts from '@/components/TickerAlerts'
import FMPAlertsList from '@/components/FMPAlertsList'
import InsiderTradingList from '@/components/InsiderTradingList'
import FMPGradesConsensus from '@/components/FMPGradesConsensus'
import FMPPriceTargets from '@/components/FMPPriceTargets'
import FMPGradesHistorical from '@/components/FMPGradesHistorical'
import Footer from '@/components/Footer'

export default function TickerPage() {
  const params = useParams()
  const ticker = (params?.symbol as string)?.toUpperCase() || ''
  const [mounted, setMounted] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Éviter l'hydratation mismatch
  if (!mounted) {
    return (
      <main className="relative z-10 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-card rounded-[1.2em] p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-neutral-400 mt-4">Chargement...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!ticker) {
    return (
      <main className="relative z-10 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-card rounded-[1.2em] p-12 text-center">
            <p className="text-neutral-400">Ticker non spécifié</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neutral-800/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/10 blur-[120px]"></div>
      </div>

      <main className="relative z-10 pt-32 pb-24">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              {ticker} Market Signals
            </h1>
            <p className="text-lg text-neutral-400 max-w-3xl">
              Analyse des signaux FMP (grades, insider trading, price targets) et signaux RSS 
              pour détecter les événements susceptibles d'impacter le marché.
            </p>
          </div>
        </div>

        {/* Grille des composants - Row 1 */}
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Détection Manuelle (Style MacroCalendar) */}
          <div>
            <TickerAlerts ticker={ticker} includeCompany={true} onPriceUpdate={setCurrentPrice} />
          </div>

          {/* Alertes Realtime FMP (Style HeroDashboard) */}
          <div>
            <FMPAlertsList ticker={ticker} maxItems={10} />
          </div>
        </div>

        {/* Grille des composants - Row 2: Consensus & Price Targets */}
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <FMPGradesConsensus symbol={ticker} />
          </div>
          <div>
            <FMPPriceTargets symbol={ticker} currentPrice={currentPrice || undefined} />
          </div>
        </div>

        {/* Historique des Grades */}
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <FMPGradesHistorical symbol={ticker} limit={24} />
        </div>

        {/* Insider Trading */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <InsiderTradingList symbol={ticker} maxItems={20} />
        </div>

        {/* Info Section */}
        <section className="max-w-7xl mx-auto px-6 mt-16 mb-32">
          <div className="glass-card rounded-[1.2em] p-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              À propos des Signaux FMP
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h4 className="font-medium text-white">Bullish Signals 🟢</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Upgrades analyst, consensus Buy, price target au-dessus du cours actuel, 
                  ou achats massifs d'insiders → anticipation haussière.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <h4 className="font-medium text-white">Bearish Signals 🔴</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Downgrades, consensus Sell, baisse des price targets, 
                  ou ventes importantes d'insiders → anticipation baissière.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <h4 className="font-medium text-white">Severity</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  High: Cluster de signaux alignés (upgrade + insider buy + target up). 
                  Medium/Low: Signaux isolés ou contradictoires.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}

