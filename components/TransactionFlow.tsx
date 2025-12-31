'use client'

import { useState } from 'react'

interface Transaction {
  ticker: string
  time: string
  type: 'CALL_SWEEP' | 'PUT_BLOCK' | 'CALL_SPLIT'
  strike: string
  expiry: string
  premium: string
  whaleScore: number | 'WHALE'
  sentiment: string
}

const mockTransactions: Transaction[] = [
  {
    ticker: 'NVDA',
    time: '14:32:01 EST',
    type: 'CALL_SWEEP',
    strike: '$920 C',
    expiry: 'EXP 21 JUN',
    premium: '$4.2M',
    whaleScore: 'WHALE',
    sentiment: 'Extremely Bullish',
  },
  {
    ticker: 'TSLA',
    time: '14:30:45 EST',
    type: 'PUT_BLOCK',
    strike: '$165 P',
    expiry: 'EXP 19 APR',
    premium: '$850K',
    whaleScore: 60,
    sentiment: 'Bearish Hedge',
  },
  {
    ticker: 'META',
    time: '14:28:10 EST',
    type: 'CALL_SPLIT',
    strike: '$510 C',
    expiry: 'EXP 24 MAY',
    premium: '$1.8M',
    whaleScore: 'WHALE',
    sentiment: 'Earnings Bet',
  },
]

export default function TransactionFlow() {
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all')

  return (
    <section className="max-w-7xl mx-auto px-6 mb-32">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold tracking-tighter text-white mb-4">Unusual Transaction Flow</h2>
        <p className="text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
          Real-time detection of institutional "whale" activity. We flag large block trades, sweep orders, and unusual options activity that deviates from standard volume.
        </p>
      </div>

      {/* The Data Table UI */}
      <div className="glass-card rounded-[1.2em]">
        <div className="bg-neutral-900/30">
          {/* Table Header Controls */}
          <div className="border-b border-white/5 p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  filter === 'all'
                    ? 'bg-white/10 text-white border-white/10'
                    : 'bg-transparent text-neutral-500 hover:text-white'
                }`}
              >
                All Flow
              </button>
              <button
                onClick={() => setFilter('bullish')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filter === 'bullish'
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'bg-transparent text-neutral-500 hover:text-white'
                }`}
              >
                Bullish
              </button>
              <button
                onClick={() => setFilter('bearish')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filter === 'bearish'
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'bg-transparent text-neutral-500 hover:text-white'
                }`}
              >
                Bearish
              </button>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> LIVE
              </span>
              <span>SCANNING 4,203 TICKERS</span>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.02] text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
            <div className="col-span-1">Ticker / Time</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-1">Strike / Exp</div>
            <div className="col-span-1">Premium</div>
            <div className="col-span-1 text-center">Whale Score</div>
            <div className="col-span-1 text-right">Analysis</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5 text-sm">
            {mockTransactions.map((tx, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-6 gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group ${
                  idx === 0 ? 'relative shimmer' : ''
                }`}
              >
                <div className="col-span-1 flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white text-black font-bold flex items-center justify-center text-[10px] tracking-tight">
                    {tx.ticker}
                  </div>
                  <div>
                    <div className="font-semibold text-white tracking-tight">{tx.ticker}</div>
                    <div className="text-[10px] font-mono text-neutral-500">{tx.time}</div>
                  </div>
                </div>
                <div className="col-span-1 flex items-center">
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      tx.type.includes('CALL')
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}
                  >
                    {tx.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="col-span-1 flex flex-col justify-center font-mono">
                  <div className="text-white">{tx.strike}</div>
                  <div className="text-[10px] text-neutral-500">{tx.expiry}</div>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-white font-mono font-medium">{tx.premium}</span>
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  {tx.whaleScore === 'WHALE' ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-orange-300">
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
                      >
                        <path d="m22 2-7 20-4-9-9-4Z"></path>
                        <path d="M22 2 11 13"></path>
                      </svg>
                      <span className="text-[10px] font-bold">WHALE</span>
                    </div>
                  ) : (
                    <div className="w-16 h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-500" style={{ width: `${tx.whaleScore}%` }}></div>
                    </div>
                  )}
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  <span
                    className={`text-xs font-medium ${
                      tx.sentiment.includes('Bullish')
                        ? 'text-emerald-400'
                        : tx.sentiment.includes('Bearish')
                        ? 'text-red-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    {tx.sentiment}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* View All Footer */}
          <div className="border-t border-white/5 p-3 text-center">
            <button className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto font-sans">
              View all transactions
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}


