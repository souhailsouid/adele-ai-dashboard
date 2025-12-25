'use client'

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full pt-4 px-4">
      <div className="max-w-7xl mx-auto rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-lg h-14 flex items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 group">
          <span className="text-base font-semibold tracking-tight text-white group-hover:text-orange-300 transition-colors">
            MarketFlow
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors tracking-tight">
            Live Flow
          </a>
          <a href="#" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors tracking-tight">
            Dark Pools
          </a>
          <a href="#" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors tracking-tight">
            Macro Calendar
          </a>
          <a href="#" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors tracking-tight">
            Education
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a href="#" className="hidden md:block text-sm font-medium text-neutral-300 hover:text-white transition-colors tracking-tight">
            Log in
          </a>
          <button
            className="liquid-glass-button relative inline-flex items-center justify-center h-8 px-5 text-white/90 font-medium text-xs cursor-pointer outline-none overflow-hidden backdrop-blur-xl border border-white/15 rounded-full transition-all duration-300 ease-out hover:scale-105 active:scale-95"
            onClick={() => {
              // Handle click
            }}
          >
            <span className="relative z-10">Start Analysis</span>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none"></div>
          </button>
        </div>
      </div>
    </header>
  )
}

