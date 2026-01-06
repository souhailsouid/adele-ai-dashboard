
import FlowAlerts from '@/components/FlowAlerts'
import HeroCalendarDashboard from '@/components/HeroCalendarDashboard'
import Hero from '@/components/Hero'
import HeroDashboard from '@/components/HeroDashboard'
import MacroCalendarDashboard from '@/components/MacroCalendarDashboard'
import TransactionFlow from '@/components/TransactionFlow'
import Alerts from '@/components/Alerts'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
import Footer from '@/components/Footer'
import AuraBackground from '@/components/AuraBackground'

export default function FlowAlertPage() {
  return (
    <>
      {/* Unicorn Studio Aura Background */}
      <AuraBackground />
      
      {/* Background Ambience (fallback/additional) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neutral-800/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/10 blur-[120px]"></div>
      </div>
      
      <main className="relative z-10 pt-32 pb-24 sm:px-6 lg:px-8 max-w-7xl mr-auto ml-auto pr-4 pl-4">

              <HeroCalendarDashboard />
              <FlowAlerts />
        <TransactionFlow />
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <Alerts />
        </section>
        <Features />
        <Pricing />
        <Footer />
      </main>
    </>
  )
}

