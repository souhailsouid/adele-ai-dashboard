'use client'

import MacroCalendar from './MacroCalendar'

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-6 mb-24">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Hero Copy */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-300 text-[10px] font-medium tracking-wide uppercase mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
            </span>
            Live Market Data
          </div>

          {/* H1 */}
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tighter text-white mb-6 leading-[1.05]">
            Follow the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-white to-neutral-400">
              smart money
            </span>{' '}
            flow.
          </h1>

          <p className="text-neutral-300 text-base leading-relaxed max-w-lg mb-8 font-light">
            Don't trade in the dark. Detect unusual options activity, whale movements, and critical macro events before they impact price action. Institutional-grade analysis for the retail investor.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* CTA Button */}
            <button className="liquid-glass-button h-10 px-6 rounded-full text-white text-sm font-medium flex items-center justify-center gap-2 group transition-all duration-300">
              Start Free Trial
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
                className="group-hover:translate-x-0.5 transition-transform text-orange-200"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>

            {/* Secondary Button */}
            <button className="h-10 px-6 rounded-full border border-white/10 bg-white/5 text-neutral-200 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
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
                className="text-orange-300"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Watch Demo
            </button>
          </div>

          <div className="mt-10 flex items-center gap-4 text-xs text-neutral-500 font-mono">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-orange-300"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
              </svg>
              Real-time
            </div>
            <div className="w-1 h-1 rounded-full bg-neutral-700"></div>
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-orange-300"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" x2="12" y1="22.08" y2="12"></line>
              </svg>
              Dark Pool Data
            </div>
          </div>
        </div>

        {/* Right: Macro Calendar Visual */}
        <MacroCalendar />
      </div>
    </section>
  )
}

