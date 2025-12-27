/**
 * Page Signaux RSS - Affiche les signaux économiques avec données extraites
 */

'use client'

import SignalsList from '@/components/SignalsList'
import RealtimeAlerts from '@/components/RealtimeAlerts'
import Footer from '@/components/Footer'

export default function NewsPage() {
  const criticalKeywords = ['Trump', 'CPI', 'Fed', 'GDP', 'NFP', 'Musk', 'BTC', 'TSLA']

  return (
    <>
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neutral-800/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/10 blur-[120px]"></div>
      </div>

      {/* Alertes en temps réel (flottant) */}
      <RealtimeAlerts keywords={criticalKeywords} maxAlerts={5} position="top-right" />

      {/* Header is now in layout.tsx */}

      <main className="relative z-10 pt-32 pb-24">
        {/* Page Header */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Signaux RSS — Financial Juice
            </h1>
            <p className="text-lg text-neutral-400 max-w-3xl">
              Suivez en temps réel les données économiques significatives extraites des flux RSS. 
              Chaque signal peut contenir des données structurées (Actual, Forecast, Previous) 
              avec détection automatique des surprises économiques.
            </p>
          </div>
        </div>

        {/* Signals List Component */}
        <div className="max-w-7xl mx-auto px-6 mb-32">
          <SignalsList />
        </div>

        {/* Info Section */}
        <section className="max-w-7xl mx-auto px-6 mt-16 mb-32">
          <div className="glass-card rounded-[1.2em] p-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              À propos des Signaux RSS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h4 className="font-medium text-white">Surprise Positive 📈</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Les données économiques dépassent les prévisions, 
                  indiquant une économie plus forte que prévu.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <h4 className="font-medium text-white">Surprise Négative 📉</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Les données économiques sont inférieures aux prévisions, 
                  pouvant indiquer un ralentissement économique.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <h4 className="font-medium text-white">Données Extraites</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Les valeurs Actual, Forecast et Previous sont extraites 
                  automatiquement des articles pour un suivi précis.
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

