'use client'

import ConvergenceTerminal from '@/components/ConvergenceTerminal'
import Header from '@/components/Header'

export default function ConvergenceTerminalPage() {
  return (
    <div className="min-h-screen bg-[#050505] relative">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-neutral-900/40 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-900/5 blur-[150px]"></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-900/5 blur-[120px]"></div>
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-24">
        <section className="w-full px-4 sm:px-6 lg:px-8">
          <div className="sm:mt-16 mt-16 relative">
            <ConvergenceTerminal defaultWatchlist={[]} defaultDays={60} />
          </div>
        </section>
      </main>
    </div>
  )
}

