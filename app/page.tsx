import Header from '@/components/Header'
import Hero from '@/components/Hero'
import TransactionFlow from '@/components/TransactionFlow'
import Features from '@/components/Features'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neutral-800/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/10 blur-[120px]"></div>
      </div>

      <Header />
      
      <main className="relative z-10 pt-32 pb-24">
        <Hero />
        <TransactionFlow />
        <Features />
        <Footer />
      </main>
    </>
  )
}

