'use client'

import { useState } from 'react'

interface MacroEvent {
  id: string
  name: string
  date: string
  time: string
  impact: 'HIGH' | 'MED' | 'LOW'
  forecast?: string
  previous?: string
  description: string
  country: string
  category: string
}

const mockEvents: MacroEvent[] = [
  {
    id: '1',
    name: 'CPI Data Release',
    date: '2024-01-15',
    time: '08:30 AM',
    impact: 'HIGH',
    forecast: '3.1%',
    previous: '3.2%',
    description: 'Consumer Price Index (YoY). Critical for Fed rate decision outlook.',
    country: 'US',
    category: 'Inflation',
  },
  {
    id: '2',
    name: 'Initial Jobless Claims',
    date: '2024-01-15',
    time: '08:30 AM',
    impact: 'MED',
    forecast: '220K',
    previous: '218K',
    description: 'Weekly measure of the number of people filing first-time claims for state unemployment insurance.',
    country: 'US',
    category: 'Employment',
  },
  {
    id: '3',
    name: 'Fed Rate Decision',
    date: '2024-01-17',
    time: '02:00 PM',
    impact: 'HIGH',
    forecast: '5.25%',
    previous: '5.25%',
    description: 'Federal Reserve interest rate decision. Expected to hold rates steady.',
    country: 'US',
    category: 'Monetary Policy',
  },
  {
    id: '4',
    name: 'Fed Speaker Bostic',
    date: '2024-01-15',
    time: '10:00 AM',
    impact: 'LOW',
    description: 'Federal Reserve Bank of Atlanta President Raphael Bostic speaks on economic outlook.',
    country: 'US',
    category: 'Speeches',
  },
  {
    id: '5',
    name: 'Retail Sales',
    date: '2024-01-16',
    time: '08:30 AM',
    impact: 'MED',
    forecast: '0.3%',
    previous: '0.2%',
    description: 'Monthly retail sales data indicating consumer spending trends.',
    country: 'US',
    category: 'Consumption',
  },
  {
    id: '6',
    name: 'PPI (Producer Price Index)',
    date: '2024-01-16',
    time: '08:30 AM',
    impact: 'MED',
    forecast: '0.2%',
    previous: '0.1%',
    description: 'Producer Price Index measures average changes in selling prices received by domestic producers.',
    country: 'US',
    category: 'Inflation',
  },
]

export default function MacroCalendarDashboard() {
  const [selectedEvent, setSelectedEvent] = useState<MacroEvent | null>(mockEvents[0])
  const [filter, setFilter] = useState<'all' | 'HIGH' | 'MED' | 'LOW'>('all')

  const filteredEvents = filter === 'all' ? mockEvents : mockEvents.filter((e) => e.impact === filter)

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      case 'MED':
        return 'text-orange-300 bg-orange-500/5 border-orange-500/10'
      case 'LOW':
        return 'text-neutral-400 bg-neutral-800/50 border-neutral-700/50'
      default:
        return 'text-neutral-400 bg-neutral-800/50 border-neutral-700/50'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <section className="max-w-7xl mx-auto px-6 mb-32">
      <div className="flex transform-style-preserve-3d group w-full h-[700px] max-w-[1400px] mx-auto relative perspective-[2000px] items-center justify-center">
        <div
          className="hero-rotate overflow-hidden bg-[#0F1012] max-w-[1400px] border-white/10 border rounded-xl mr-auto ml-auto relative left-20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rotate-x-20 rotate-y-30 -rotate-z-20"
          style={{
            maskImage: 'linear-gradient(180deg, transparent, black 0%, black 50%, transparent)',
            WebkitMaskImage: 'linear-gradient(180deg, transparent, black 0%, black 50%, transparent)',
          }}
        >
          <div className="shimmer"></div>

          {/* Calendar Content Grid */}
          <div className="grid grid-cols-[300px_1fr] divide-x divide-white/5 h-[700px]">
            {/* Sidebar - Event List */}
            <div className="flex flex-col bg-[#0F1012]">
              {/* Header */}
              <div className="flex h-14 border-white/5 border-b pr-4 pl-4 gap-y-3 items-center gap-x-0">
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
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                </svg>
                <span className="ml-3 font-medium text-gray-200">Macro Calendar</span>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-white/5">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-orange-600/90 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('HIGH')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === 'HIGH'
                        ? 'bg-orange-600/90 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    High
                  </button>
                  <button
                    onClick={() => setFilter('MED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === 'MED'
                        ? 'bg-orange-600/90 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Med
                  </button>
                  <button
                    onClick={() => setFilter('LOW')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === 'LOW'
                        ? 'bg-orange-600/90 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Low
                  </button>
                </div>
              </div>

              {/* Event List */}
              <div className="flex-1 overflow-y-auto">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`group flex flex-col gap-1 p-4 border-b border-white/5 cursor-pointer transition-colors ${
                      selectedEvent?.id === event.id
                        ? 'bg-[#16181D] border-l-2 border-l-orange-500'
                        : 'hover:bg-[#131416]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-mono ${selectedEvent?.id === event.id ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                        {formatDate(event.date)}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                      <span className={`text-xs ${selectedEvent?.id === event.id ? 'text-orange-400' : 'text-gray-500'}`}>
                        {event.time}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${selectedEvent?.id === event.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                      {event.name}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getImpactColor(event.impact)}`}>
                        {event.impact} IMPACT
                      </span>
                      <span className="text-xs text-gray-500">{event.country}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail View */}
            <div className="flex flex-col bg-[#0B0C0E] relative">
              {/* Detail Header */}
              <div className="flex h-14 border-white/5 border-b pr-6 pl-6 items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="text-xs font-mono">Macro Calendar</span>
                  <span className="text-xs">/</span>
                  <span className="text-xs font-mono text-gray-300">{selectedEvent?.name}</span>
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
                    className="cursor-pointer hover:text-gray-300"
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
                    className="cursor-pointer hover:text-gray-300"
                  >
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="19" cy="12" r="1"></circle>
                    <circle cx="5" cy="12" r="1"></circle>
                  </svg>
                </div>
              </div>

              {/* Content */}
              {selectedEvent && (
                <div className="p-8 overflow-y-auto flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-2xl font-medium text-white tracking-tight">{selectedEvent.name}</h2>
                    <span className={`text-xs px-2 py-1 rounded border ${getImpactColor(selectedEvent.impact)}`}>
                      {selectedEvent.impact} IMPACT
                    </span>
                  </div>

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
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">
                        {formatDate(selectedEvent.date)} • {selectedEvent.time} EST
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
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span className="text-sm text-gray-400">{selectedEvent.country}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs px-2 py-1 rounded bg-neutral-800 border border-white/10 text-neutral-300">
                        {selectedEvent.category}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6 text-base text-gray-300 leading-relaxed">
                    <p>{selectedEvent.description}</p>

                    {/* Forecast & Previous */}
                    {(selectedEvent.forecast || selectedEvent.previous) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedEvent.forecast && (
                          <div className="rounded-lg bg-[#090A0B] border border-white/10 p-4">
                            <div className="text-xs text-gray-500 mb-2">Forecast</div>
                            <div className="text-2xl font-semibold text-white">{selectedEvent.forecast}</div>
                          </div>
                        )}
                        {selectedEvent.previous && (
                          <div className="rounded-lg bg-[#090A0B] border border-white/10 p-4">
                            <div className="text-xs text-gray-500 mb-2">Previous</div>
                            <div className="text-2xl font-semibold text-white">{selectedEvent.previous}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Market Impact */}
                    <div className="rounded-lg bg-[#090A0B] border border-white/10 overflow-hidden my-6">
                      <div className="flex items-center justify-between px-4 py-2 bg-[#131416] border-b border-white/5">
                        <span className="text-xs text-gray-500 font-mono">Market Impact</span>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Volatility Expectation</span>
                            <span className="text-sm font-medium text-orange-400">
                              {selectedEvent.impact === 'HIGH' ? 'High' : selectedEvent.impact === 'MED' ? 'Medium' : 'Low'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Affected Markets</span>
                            <span className="text-sm font-medium text-white">Stocks, Bonds, Forex</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Trading Hours</span>
                            <span className="text-sm font-medium text-white">US Market Hours</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400">
                      This event is closely monitored by institutional traders and can cause significant market movements
                      depending on the actual vs. forecasted results.
                    </p>
                  </div>

                  {/* Related Events */}
                  <div className="mt-12 pt-8 border-t border-white/5">
                    <h3 className="text-sm font-medium text-white mb-4">Upcoming Related Events</h3>
                    <div className="space-y-2">
                      {mockEvents
                        .filter((e) => e.category === selectedEvent.category && e.id !== selectedEvent.id)
                        .slice(0, 2)
                        .map((event) => (
                          <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#090A0B] border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
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
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                                <line x1="16" x2="16" y1="2" y2="6"></line>
                                <line x1="8" x2="8" y1="2" y2="6"></line>
                                <line x1="3" x2="21" y1="10" y2="10"></line>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">{event.name}</div>
                              <div className="text-xs text-gray-500">
                                {formatDate(event.date)} • {event.time}
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getImpactColor(event.impact)}`}>
                              {event.impact}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


