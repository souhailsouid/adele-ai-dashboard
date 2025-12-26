import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { AuthModalProvider } from '@/components/useAuthModal'
import Header from '@/components/Header'
import AuthModalWrapper from '@/components/AuthModalWrapper'

export const metadata: Metadata = {
  title: 'MarketFlow — Decode Institutional Market Movements',
  description: 'Detect unusual whale transactions and macro events before they shake the market. Institutional grade analysis for retail traders.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full bg-neutral-950 text-neutral-100 antialiased selection:bg-neutral-400/30 selection:text-neutral-100">
        <AuthProvider>
          <AuthModalProvider>
            <Header />
            {children}
            <AuthModalWrapper />
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

