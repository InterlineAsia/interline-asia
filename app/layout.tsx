import type { Metadata } from 'next'
import Header from '../components/Header'
import Footer from '../components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Interline Asia - Exclusive Cruise Experiences for Travel Professionals',
  description: 'The world\'s most exclusive cruise booking platform for verified travel industry professionals. Unlock extraordinary experiences at unbeatable interline rates.',
  keywords: 'cruise deals, interline rates, travel professionals, luxury cruises, cruise booking, travel industry, exclusive cruises, cruise discounts',
  authors: [{ name: 'Interline Asia' }],
  openGraph: {
    title: 'Interline Asia - Exclusive Cruise Experiences for Travel Professionals',
    description: 'The world\'s most exclusive cruise booking platform for verified travel industry professionals. Unlock extraordinary experiences at unbeatable interline rates.',
    type: 'website',
    url: 'https://www.interlineasia.com',
    images: [
      {
        url: 'https://www.interlineasia.com/cruise-ship.png',
        width: 1200,
        height: 630,
        alt: 'Interline Asia - Exclusive Cruise Experiences',
      },
    ],
    siteName: 'Interline Asia',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interline Asia - Exclusive Cruise Experiences',
    description: 'Exclusive cruise booking platform for travel professionals with unbeatable interline rates.',
    images: ['https://www.interlineasia.com/cruise-ship.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className="font-sans antialiased">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}