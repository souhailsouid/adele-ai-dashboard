'use client'

export default function MacroCalendar() {
  return (
    <div className="relative w-full max-w-[500px] lg:ml-auto z-10">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-orange-500/10 blur-[100px] -z-10 opacity-30"></div>

      <div className="glass-card rounded-[1.2em] p-1 shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
        <div className="bg-neutral-900/40 rounded-xl overflow-hidden backdrop-blur-md">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-white tracking-tight">Macro Calendar</div>
                <div className="text-[10px] text-neutral-500 font-mono">NEXT 24 HOURS</div>
              </div>
            </div>
            <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-neutral-400 font-mono">
              EST (UTC-5)
            </div>
          </div>

          {/* Calendar Body */}
          <div className="p-5 space-y-6 relative pb-10">
            {/* Connecting line - S'adapte dynamiquement au contenu */}
            <div className="absolute left-[31px] top-8 bottom-6 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

            {/* Item 1 */}
            <div className="relative flex gap-5 group">
              <div className="w-3 h-3 rounded-full bg-orange-400 ring-4 ring-orange-400/10 mt-1.5 flex-shrink-0 z-10"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white group-hover:text-orange-300 transition-colors">
                    CPI Data Release
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">08:30 AM</span>
                </div>
                <p className="text-[11px] text-neutral-400 mb-2 leading-relaxed">
                  Consumer Price Index (YoY). Critical for Fed rate decision outlook.
                </p>
                <div className="flex gap-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-300 font-medium">
                    HIGH IMPACT
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 font-mono">
                    FORECAST: 3.1%
                  </span>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="relative flex gap-5 group">
              <div className="w-3 h-3 rounded-full bg-neutral-400 ring-4 ring-neutral-400/10 mt-1.5 flex-shrink-0 z-10"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">Initial Jobless Claims</span>
                  <span className="text-[10px] font-mono text-neutral-500">08:30 AM</span>
                </div>
                <p className="text-[11px] text-neutral-400 mb-2">
                  Weekly measure of the number of people filing first-time claims for state unemployment insurance.
                </p>
                <div className="flex gap-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 font-medium">
                    MED IMPACT
                  </span>
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="relative flex gap-5 group opacity-60">
              <div className="w-3 h-3 rounded-full bg-neutral-700 ring-4 ring-white/5 mt-1.5 flex-shrink-0 z-10"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">Fed Speaker Bostic</span>
                  <span className="text-[10px] font-mono text-neutral-500">10:00 AM</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-500 font-medium">
                    LOW IMPACT
                  </span>
                </div>
              </div>
            </div>
            
            {/* Margin bottom dynamique pour s'assurer que tout le contenu est visible */}
            <div className="h-10"></div>
          </div>

          {/* Alert overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-neutral-900/90 border border-white/10 backdrop-blur-xl rounded-lg p-3 flex items-start gap-3 transform translate-y-2 animate-[float_4s_ease-in-out_infinite] shadow-lg">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z"></path>
                <path d="M22 2 11 13"></path>
              </svg>
            </div>
            <div>
              <div className="text-xs font-medium text-white">Volatility Spike Detected</div>
              <div className="text-[10px] text-neutral-400">VIX +4.2% in pre-market due to CPI anticipation.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


