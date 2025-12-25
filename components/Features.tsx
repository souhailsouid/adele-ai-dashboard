'use client'

export default function Features() {
  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" x2="12" y1="20" y2="10"></line>
          <line x1="18" x2="18" y1="20" y2="4"></line>
          <line x1="6" x2="6" y1="20" y2="16"></line>
        </svg>
      ),
      title: 'Volume Analysis',
      description:
        'Identify price levels where institutions are accumulating or distributing shares through proprietary volume profile algorithms.',
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
      ),
      title: 'Dark Pool Prints',
      description:
        'See the hidden trades. We track off-exchange transaction data to show you where the real support and resistance levels lie.',
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
      ),
      title: 'Sentiment Scoring',
      description:
        'AI-driven sentiment analysis aggregating news, options flow, and social signals to give you a directional bias score.',
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-6 mb-32">
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="glass-card rounded-[1.2em] p-6 group hover:border-white/20 transition-all duration-300 bg-gradient-to-r from-white/5 to-white/0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-700 border border-white/10 flex items-center justify-center text-white mb-4 shadow-lg">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{feature.title}</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-light">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

