'use client'

export default function Pricing() {
  return (
    <section className="relative z-10 sm:px-6 lg:px-8 max-w-7xl mr-auto ml-auto pt-8 pr-4 pb-16 pl-4">
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10 bg-neutral-900">
        {/* Gradient glow - adapted to orange theme */}
        <div className="absolute -right-20 -top-24 h-72 w-72 bg-gradient-to-tr from-orange-500/20 to-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Copy */}
          <div className="p-6 sm:p-10 lg:col-span-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-neutral-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 text-orange-300"
              >
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                <path d="M20 2v4"></path>
                <path d="M22 4h-4"></path>
                <circle cx="4" cy="20" r="2"></circle>
              </svg>
              MEMBERSHIP
            </span>
            
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl tracking-tighter text-white">MarketFlow Pro</h2>
            <p className="mt-3 text-neutral-300 max-w-[42ch]">
              Unlock institutional-grade insights: real-time whale alerts, dark pool data, advanced analytics, and priority API access.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-orange-400"
                >
                  <line x1="19" x2="5" y1="5" y2="19"></line>
                  <circle cx="6.5" cy="6.5" r="2.5"></circle>
                  <circle cx="17.5" cy="17.5" r="2.5"></circle>
                </svg>
                Real-time transaction alerts
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-orange-300"
                >
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
                Unlimited dark pool data
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-orange-300"
                >
                  <path d="M12 6v6h4"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                Advanced macro calendar
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-orange-300"
                >
                  <path d="M9 14 4 9l5-5"></path>
                  <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"></path>
                </svg>
                Historical data access
              </li>
            </ul>

            <a
              href="#join"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 text-white h-11 px-5 ring-1 ring-white/10 text-sm transition-colors"
            >
              Start free 7‑day trial
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </a>
          </div>

          {/* Plans */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 border-t border-white/10 lg:border-l lg:border-t-0">
            {/* Monthly */}
            <div className="p-6 sm:p-10 border-b md:border-b-0 md:border-r border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl text-white tracking-tight">Monthly</h3>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-neutral-300">
                  Flexible
                </span>
              </div>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl text-white tracking-tight">$49</span>
                <span className="text-neutral-400 mb-1 text-sm">/mo</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-neutral-300">
                <li className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-orange-400"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  Real-time alerts
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-orange-400"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  Dark pool data
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-orange-400"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  API access
                </li>
              </ul>
              <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 hover:bg-orange-600/90 text-white h-11 ring-1 ring-orange-400/30 text-sm transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path>
                  <path d="M5 21h14"></path>
                </svg>
                Choose monthly
              </button>
            </div>

            {/* Annual */}
            <div className="p-6 sm:p-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl text-white tracking-tight">Annual</h3>
                <span className="inline-flex items-center gap-1 rounded-lg border border-orange-400/30 bg-orange-500/10 px-2 py-1 text-[11px] text-orange-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-300"></span>
                  Best value
                </span>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl text-white tracking-tight">$479</span>
                <span className="text-neutral-400 mb-1 text-sm">/yr</span>
                <span className="text-xs text-orange-300 bg-orange-500/10 ring-1 ring-orange-400/20 rounded-full px-2 py-0.5">
                  Save 18%
                </span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-neutral-300">
                <li className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-orange-400"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  Everything in Monthly
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-orange-400"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  Historical data archive
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-orange-400"
                  >
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  Priority support
                </li>
              </ul>
              <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white text-neutral-900 hover:bg-neutral-100 h-11 text-sm transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
                </svg>
                Choose annual
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

