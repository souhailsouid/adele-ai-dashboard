import FlowAlerts from '@/components/FlowAlerts'
import Footer from '@/components/Footer'
import AuraBackground from '@/components/AuraBackground'

export default function DashboardPage() {
  return (
    <>
      {/* Unicorn Studio Aura Background */}
      {/* <AuraBackground /> */}
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neutral-800/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/10 blur-[120px]"></div>
      </div>
      
      <main className="relative z-10 pt-32 pb-24">

       
        {/* Flow Alerts Component */}
        <FlowAlerts />
        
        {/* Additional Info Section */}
        <section className="max-w-7xl mx-auto px-6 mt-16 mb-32">
          <div className="glass-card rounded-[1.2em] p-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              À propos des Flow Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h4 className="font-medium text-white">Calls (Bullish)</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Les achats massifs de calls indiquent une anticipation haussière. 
                  Les institutions parient sur une hausse du prix de l'actif.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <h4 className="font-medium text-white">Puts (Bearish)</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Les achats massifs de puts signalent une anticipation baissière 
                  ou une protection contre une chute du marché.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <h4 className="font-medium text-white">Whale Score</h4>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Score calculé selon le montant de la prime et le ratio volume/OI. 
                  "WHALE" indique une transaction institutionnelle majeure.
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

