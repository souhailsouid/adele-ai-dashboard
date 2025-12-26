'use client'

import { useState } from 'react'

export default function Alerts() {
  const [selectedCategory, setSelectedCategory] = useState('Primary')

  const categories = [
    { id: 'Primary', label: 'Primary', active: true },
    { id: 'Whale', label: 'Whale Alerts', active: false },
    { id: 'Macro', label: 'Macro Events', active: false },
    { id: 'Price', label: 'Price Alerts', active: false },
    { id: 'System', label: 'System', active: false },
  ]

  return (
    <div className="relative ring-1 ring-neutral-800 overflow-hidden bg-neutral-900 rounded-[20px] shadow-2xl">
      {/* Status/header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="size-8 rounded-lg bg-neutral-800 ring-1 ring-neutral-800 flex items-center justify-center hover:ring-neutral-700 transition-colors">
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
              className="size-4 text-neutral-300"
            >
              <path d="M4 12h16"></path>
              <path d="M4 18h16"></path>
              <path d="M4 6h16"></path>
            </svg>
          </button>
          <div className="flex items-center gap-2">
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
              className="size-4 text-neutral-300"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
            </svg>
            <span className="text-base font-medium text-neutral-200">Alerts</span>
          </div>
        </div>
        <button className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 ring-1 ring-neutral-800 hover:ring-neutral-700 transition-colors">
          Select
        </button>
      </div>

      {/* Search + quick actions */}
      <div className="px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl bg-neutral-800 ring-1 ring-neutral-800 px-3 py-2.5">
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
              className="size-4 text-neutral-400"
            >
              <path d="m21 21-4.34-4.34"></path>
              <circle cx="11" cy="11" r="8"></circle>
            </svg>
            <input
              className="w-full bg-transparent placeholder-neutral-500 text-sm focus:outline-none text-neutral-200"
              placeholder="Search alerts"
            />
          </div>
          <button className="size-10 rounded-xl bg-neutral-800 ring-1 ring-neutral-800 flex items-center justify-center hover:ring-neutral-700 transition-colors">
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
              className="size-5 text-neutral-300"
            >
              <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"></path>
            </svg>
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 py-1 items-center" style={{ scrollbarWidth: 'none' }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-orange-600/90 text-white shadow-sm'
                  : 'bg-neutral-800 text-neutral-300 ring-1 ring-neutral-800 hover:ring-neutral-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-6 pb-4">
        {/* Section: Pinned */}
        <div className="px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
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
                className="size-4 text-orange-400"
              >
                <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
              </svg>
              <span className="text-[13px] font-medium text-neutral-300">Pinned</span>
            </div>
            <button className="size-7 rounded-lg bg-neutral-800 ring-1 ring-neutral-800 flex items-center justify-center hover:ring-neutral-700 transition-colors">
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
                className="size-4 text-neutral-300"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {/* Pinned Item 1 */}
            <article className="group rounded-2xl bg-orange-600/10 ring-1 ring-orange-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm">
                  NVDA
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-neutral-100">Whale Alert • NVDA</p>
                  </div>
                  <p className="truncate text-[13px] text-neutral-300">$4.2M CALL SWEEP detected at $920 strike</p>
                </div>
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
                  className="size-4 text-neutral-400"
                >
                  <path d="M12 17v5"></path>
                  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path>
                </svg>
              </div>
            </article>

            {/* Pinned Item 2 */}
            <article className="group rounded-2xl bg-orange-600/10 ring-1 ring-orange-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  CPI
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-neutral-100">Macro Event • CPI Release</p>
                  </div>
                  <p className="truncate text-[13px] text-neutral-300">High impact event in 2 hours — prepare for volatility</p>
                </div>
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
                  className="size-4 text-orange-400"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path>
                  <path d="M12 9v4"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              </div>
            </article>
          </div>
        </div>

        {/* Section: Primary */}
        <div className="pr-4 pl-4">
          <div className="flex items-center gap-2 py-2">
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
              className="size-4 text-orange-400"
            >
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
            </svg>
            <p className="text-[13px] font-medium text-neutral-300">
              Primary <span className="ml-1 rounded-md bg-neutral-800 px-1.5 py-0.5 text-[11px] text-neutral-400 ring-1 ring-neutral-800">24</span>
            </p>
          </div>

          <ul className="space-y-0">
            {/* Alert 1 */}
            <li className="flex items-center gap-3 py-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-medium">
                TSLA
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-neutral-200">TSLA • PUT BLOCK</p>
                </div>
                <p className="truncate text-[13px] text-neutral-400">$850K bearish hedge detected • Strike $165</p>
              </div>
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
                className="size-4 text-orange-400"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                <path d="M12 8v4"></path>
                <path d="M12 16h.01"></path>
              </svg>
            </li>

            {/* Alert 2 */}
            <li className="flex gap-3 pt-3 pb-3 items-center">
              <div className="size-10 rounded-full bg-neutral-800 ring-1 ring-neutral-700 flex items-center justify-center">
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
                  className="size-6 text-orange-400"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-neutral-200">Dark Pool Activity</p>
                </div>
                <p className="truncate text-[13px] text-neutral-400">Large block trade detected on AAPL • $2.4M</p>
              </div>
              <div className="flex items-center gap-2">
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
                  className="size-4 text-orange-400"
                >
                  <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
                  <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
                </svg>
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
                  className="size-4 text-orange-400"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path>
                  <path d="M12 9v4"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              </div>
            </li>

            {/* Alert 3 */}
            <li className="flex items-center gap-3 py-3">
              <div className="size-10 rounded-full bg-neutral-800 ring-1 ring-neutral-700 flex items-center justify-center">
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
                  className="size-6 text-orange-300"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-neutral-200">Macro Calendar</p>
                </div>
                <p className="truncate text-[13px] text-neutral-400">Fed rate decision in 3 hours • Expected 0.25%</p>
              </div>
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
                className="size-4 text-orange-400"
              >
                <path d="M2 21a8 8 0 0 1 13.292-6"></path>
                <circle cx="10" cy="8" r="5"></circle>
                <path d="m16 19 2 2 4-4"></path>
              </svg>
            </li>

            {/* Alert 4 */}
            <li className="flex items-center gap-3 py-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center font-medium">
                META
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-neutral-200">META • CALL SPLIT</p>
                </div>
                <p className="truncate text-[13px] text-neutral-400">Earnings bet detected • $1.8M premium</p>
              </div>
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
                className="size-4 text-emerald-400"
              >
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </li>

            {/* Alert 5 */}
            <li className="flex items-center gap-3 py-3">
              <div className="size-10 rounded-full bg-neutral-800 ring-1 ring-neutral-700 overflow-hidden">
                <div className="size-10 bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
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
                    className="size-6 text-orange-400"
                  >
                    <path d="M12 15V3"></path>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <path d="m7 10 5 5 5-5"></path>
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-neutral-200">Data Export Ready</p>
                </div>
                <p className="truncate text-[13px] text-neutral-400">Your transaction history export is ready</p>
              </div>
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
                className="size-4 text-orange-400"
              >
                <path d="M12 15V3"></path>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <path d="m7 10 5 5 5-5"></path>
              </svg>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

