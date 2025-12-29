'use client'

import { useEffect } from 'react'

export default function HeroDashboard() {
  useEffect(() => {
    // Initialize Unicorn Studio if needed
    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false }
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js'
      script.onload = () => {
        if (!window.UnicornStudio?.isInitialized && window.UnicornStudio?.init) {
          window.UnicornStudio.init()
          window.UnicornStudio.isInitialized = true
        }
      }
      ;(document.head || document.body).appendChild(script)
    }
  }, [])

  return (
    <section className="grid grid-cols-1 gap-10 lg:gap-12 md:py-14 min-h-[500px] lg:min-h-screen pt-10 pb-10 relative items-center">
      <div className="z-10 flex-grow flex flex-col md:py-0 pt-14 pb-14 relative justify-center">
        {/* Hero content will be added here if needed */}
      </div>

      <div className="flex transform-style-preserve-3d group w-full h-[700px] max-w-[1200px] my-16 relative perspective-[2000px] items-center justify-center">
        <style jsx>{`
          @keyframes float-slow {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          @keyframes float-medium {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-15px);
            }
          }
          @keyframes float-fast {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
          .animate-float-slow {
            animation: float-slow 6s ease-in-out infinite;
          }
          .animate-float-medium {
            animation: float-medium 5s ease-in-out infinite;
          }
          .animate-float-fast {
            animation: float-fast 4s ease-in-out infinite;
          }
        `}</style>

        {/* DESKTOP DASHBOARD UI */}
        <div
          className="hero-perspective -mt-8 group md:px-0 md:pt-20 my-24 pt-20 pr-4 pb-20 pl-4"
          style={{
            maskImage: 'linear-gradient(180deg, transparent, black 0%, black 25%, transparent)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent, black 0%, black 25%, transparent)',
          }}
        >
          <div
            className="hero-rotate overflow-hidden bg-[#0F1012] max-w-[1300px] border-white/10 border rounded-xl mr-auto ml-auto relative left-20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rotate-x-20 rotate-y-30 -rotate-z-20"
            style={{
              maskImage: 'linear-gradient(180deg, transparent, black 0%, black 50%, transparent)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent, black 0%, black 50%, transparent)',
            }}
          >
            <div className="shimmer"></div>

            {/* Mockup Content Grid */}
            <div className="grid grid-cols-[260px_380px_1fr] divide-x divide-white/5 h-[800px]">
              {/* Sidebar */}
              <div className="flex flex-col bg-[#0F1012]">
                {/* Workspace Select */}
                <div className="flex h-14 border-white/5 border-b pr-4 pl-4 gap-y-3 items-center gap-x-0">
                  <span className="ml-3 font-medium text-gray-200">MarketFlow</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    role="img"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    className="ml-auto"
                    style={{ color: 'rgb(107, 114, 128)' }}
                  >
                    <path
                      fill="currentColor"
                      d="m12.37 15.835l6.43-6.63C19.201 8.79 18.958 8 18.43 8H5.57c-.528 0-.771.79-.37 1.205l6.43 6.63c.213.22.527.22.74 0"
                    ></path>
                  </svg>
                </div>

                <div className="p-3 space-y-1">
                  <div className="flex gap-3 text-gray-200 bg-white/5 border-white/5 border rounded-md pt-2 pr-3 pb-2 pl-3 gap-x-3 gap-y-3 items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-orange-400"
                    >
                      <path d="M5 12h14"></path>
                      <path d="M12 5v14"></path>
                    </svg>
                    <span className="text-sm">New Alert</span>
                    <span className="ml-auto text-xs text-gray-600 border border-white/10 rounded px-1.5 py-0.5">A</span>
                  </div>
                </div>

                <div className="p-3 space-y-0.5 mt-2">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 cursor-pointer transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" x2="12" y1="20" y2="10"></line>
                      <line x1="18" x2="18" y1="20" y2="4"></line>
                      <line x1="6" x2="6" y1="20" y2="16"></line>
                    </svg>
                    <span className="text-sm">Dashboard</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 cursor-pointer transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span className="text-sm">Alerts</span>
                    <span className="ml-auto text-xs px-1.5 rounded text-orange-400 bg-orange-400/10">3</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 cursor-pointer transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                    <span className="text-sm">Dark Pools</span>
                  </div>
                </div>

                <div className="mt-6 px-6 text-xs font-medium text-gray-600 uppercase tracking-wider">Models</div>
                <div className="p-3 space-y-0.5">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-200 bg-white/5 cursor-pointer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-orange-400"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z"></path>
                      <path d="M22 2 11 13"></path>
                    </svg>
                    <span className="text-sm">Whale Detection</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 cursor-pointer transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-orange-500"
                    >
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <span className="text-sm">Price Prediction</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 cursor-pointer transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-orange-500"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                      <line x1="16" x2="16" y1="2" y2="6"></line>
                      <line x1="8" x2="8" y1="2" y2="6"></line>
                      <line x1="3" x2="21" y1="10" y2="10"></line>
                    </svg>
                    <span className="text-sm">Macro Events</span>
                  </div>
                </div>
              </div>

              {/* List View */}
              <div className="flex flex-col bg-[#0B0C0E]">
                {/* List Header */}
                <div className="flex h-14 border-white/5 border-b pr-5 pl-5 items-center justify-between">
                  <span className="text-sm font-medium text-gray-400">Whale Detection</span>
                  <div className="flex gap-3 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="cursor-pointer hover:text-gray-300"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 17 14 12.46 22 3"></polygon>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="cursor-pointer hover:text-gray-300"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M7 12h10"></path>
                      <path d="M10 18h4"></path>
                    </svg>
                  </div>
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto">
                  {/* Active Item */}
                  <div className="group flex flex-col gap-1 p-4 border-b border-white/5 bg-[#16181D] border-l-2 cursor-pointer border-l-orange-500">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-orange-400">WHALE-2491</span>
                      <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                      <span className="text-xs text-gray-500">High Priority</span>
                    </div>
                    <span className="text-sm font-medium text-white">NVDA Call Sweep Detected • $4.2M Premium</span>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full animate-pulse bg-orange-400"></div>
                      <span className="text-xs text-gray-500">Live</span>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-orange-700 to-orange-600 ml-auto border border-black/50 text-[10px] flex items-center justify-center text-white">
                        94
                      </div>
                    </div>
                  </div>

                  {/* Other Items */}
                  <div className="group flex flex-col gap-1 p-4 border-b border-white/5 hover:bg-[#131416] cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500 group-hover:text-gray-400">WHALE-2490</span>
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white">TSLA Put Block • Bearish Signal</span>
                    <div className="flex items-center gap-2 mt-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-orange-500"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      <span className="text-xs text-gray-500">Processed</span>
                      <span className="ml-auto text-xs text-orange-400">98.2% conf</span>
                    </div>
                  </div>

                  <div className="group flex flex-col gap-1 p-4 border-b border-white/5 hover:bg-[#131416] cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500 group-hover:text-gray-400">WHALE-2489</span>
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white">META Earnings Bet • Call Split</span>
                    <div className="flex items-center gap-2 mt-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-orange-500"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                      </svg>
                      <span className="text-xs text-gray-500">Analyzing</span>
                      <span className="ml-auto text-xs text-gray-600">4h remaining</span>
                    </div>
                  </div>
                  <div className="group flex flex-col gap-1 p-4 border-b border-white/5 hover:bg-[#131416] cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500 group-hover:text-gray-400">WHALE-2488</span>
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white">Dark Pool Activity • AAPL</span>
                    <div className="flex items-center gap-2 mt-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                      </svg>
                      <span className="text-xs text-gray-500">Queued</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail View */}
              <div className="flex flex-col bg-[#0B0C0E] relative">
                {/* Detail Header */}
                <div className="flex h-14 border-white/5 border-b pr-6 pl-6 items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-xs font-mono">Whale Detection</span>
                    <span className="text-xs">/</span>
                    <span className="text-xs font-mono text-gray-300">WHALE-2491</span>
                  </div>
                  <div className="flex gap-4 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto">
                  <h2 className="text-2xl font-medium text-white mb-4 tracking-tight">
                    NVDA Call Sweep Detected • $4.2M Premium
                  </h2>

                  <div className="flex items-center gap-6 mb-8 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-400"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">
                        Detected by <span className="text-gray-200">Whale Detection Model</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-orange-400"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span className="text-sm text-gray-400">Live Monitoring</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs border px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border-orange-500/20">
                        Score: 94.5%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6 text-base text-gray-300 leading-relaxed">
                    <p>
                      The Whale Detection model has identified an unusual call sweep on NVDA with a premium of $4.2M at
                      the $920 strike. This transaction deviates significantly from normal volume patterns and suggests
                      institutional bullish sentiment.
                    </p>

                    <div className="rounded-lg bg-[#090A0B] border border-white/10 overflow-hidden my-6 shadow-2xl">
                      <div className="flex items-center justify-between px-4 py-2 bg-[#131416] border-b border-white/5">
                        <span className="text-xs text-gray-500 font-mono">detect_whale.py</span>
                        <span className="text-xs text-gray-600">Python</span>
                      </div>
                      <div className="p-4 font-mono text-xs md:text-sm leading-6 overflow-x-auto">
                        <div className="text-gray-500"># Calculate whale score</div>
                        <div className="flex">
                          <span className="text-orange-400">whale_score</span>&nbsp;
                          <span className="text-white">=</span>&nbsp;
                          <span className="text-orange-300">calculate_whale_score</span>
                          <span className="text-gray-400">(</span>
                        </div>
                        <div className="pl-4 flex">
                          <span className="text-orange-300">premium</span>
                          <span className="text-white">=</span>
                          <span className="text-orange-400">4200000</span>
                          <span className="text-gray-400">,</span>
                        </div>
                        <div className="pl-4 flex">
                          <span className="text-orange-300">volume_ratio</span>
                          <span className="text-white">=</span>
                          <span className="text-orange-400">12.5</span>
                          <span className="text-gray-400">,</span>
                        </div>
                        <div className="pl-4 flex">
                          <span className="text-orange-300">strike_proximity</span>
                          <span className="text-white">=</span>
                          <span className="text-orange-400">0.015</span>
                        </div>
                        <div className="text-gray-400">)</div>

                        <div className="flex mt-2">
                          <span className="text-gray-500"># Classify transaction</span>
                        </div>
                        <div className="flex">
                          <span className="text-orange-400">sentiment</span>&nbsp;
                          <span className="text-white">=</span>&nbsp;
                          <span className="text-orange-300">classify_sentiment</span>
                          <span className="text-gray-400">(</span>
                          <span className="text-orange-300">whale_score</span>
                          <span className="text-gray-400">)</span>
                        </div>
                      </div>
                    </div>

                    <p>
                      Analysis indicates this is an extremely bullish signal with 94.5% confidence. The strike price
                      of $920 is within 1.5% of current market price, suggesting expectations of immediate upward
                      movement.
                    </p>
                  </div>

                  {/* Activity Stream */}
                  <div className="mt-12 pt-8 border-t border-white/5">
                    <div className="flex gap-4 mb-6">
                      <div className="w-8 h-8 rounded-full border flex items-center justify-center text-xs bg-orange-900/50 border-orange-500/30 text-orange-300">
                        AC
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">Alert System</span>
                          <span className="text-xs text-gray-500">2 hours ago</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Whale alert triggered. Notification sent to 247 subscribers.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full border flex items-center justify-center text-xs bg-orange-900/50 border-orange-500/30 text-orange-300">
                        SB
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">Analytics Engine</span>
                          <span className="text-xs text-gray-500">1 hour ago</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Historical pattern analysis complete. Similar signals preceded 15% price moves 78% of the time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Action */}
                <div className="absolute bottom-8 right-8">
                  <button className="bg-white text-black hover:bg-gray-200 transition-colors rounded-full p-3 shadow-lg shadow-white/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

