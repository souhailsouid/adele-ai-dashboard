'use client'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 pt-16 bg-neutral-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-white tracking-tight">MarketFlow</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Democratizing institutional data for the modern trader.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 opacity-80">Product</h4>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  Flow Scanner
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  Dark Pools
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  API Access
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 opacity-80">Resources</h4>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  Trading Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  Option Greek Calculator
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 opacity-80">Legal</h4>
            <ul className="space-y-2 text-xs text-neutral-500">
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-300 transition-colors">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 py-8 text-[10px] text-neutral-600">
          <p>© 2024 MarketFlow Inc. Data delayed by 15 mins unless subscribed to real-time package.</p>
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-2">
              Status:{' '}
              <span className="flex items-center gap-1.5 text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Operational
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}


