'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      {/* Travel Tools Bar */}
      <div className="bg-gradient-to-r from-ocean-600 to-ocean-700 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <span className="font-medium">Complete your travel experience:</span>
            <div className="flex flex-wrap items-center gap-4">
              <a href="https://trip.tpk.mx/qhlnnQh8" target="_blank" rel="noopener noreferrer" 
                 className="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                <span>✈️</span>
                <span>Flights</span>
              </a>
              <a href="https://kiwitaxi.tpk.mx/NGL3ovB3" target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                <span>🚖</span>
                <span>Transfers</span>
              </a>
              <a href="https://ektatraveling.tpk.mx/IUGS6Ovk" target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                <span>🛡️</span>
                <span>Insurance</span>
              </a>
              <a href="https://airalo.tpk.mx/M99krJZy" target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                <span>📶</span>
                <span>eSIM</span>
              </a>
              <a href="https://getrentacar.tpk.mx/I3FuOWfB" target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                <span>🚗</span>
                <span>Cars</span>
              </a>
              <a href="https://wise.com/invite/ihpc/rodneyowenp" target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 hover:text-ocean-200 transition-colors">
                <span>💳</span>
                <span>Currency</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-ocean-500 to-ocean-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  IA
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900 tracking-tight">Interline Asia</span>
                  <span className="text-xs text-gray-500 font-medium">Luxury Cruise Experiences</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-ocean-600 font-medium transition-colors">
                Home
              </Link>
              <Link href="/about.html" className="text-gray-700 hover:text-ocean-600 font-medium transition-colors">
                About
              </Link>
              <Link href="/partners.html" className="text-gray-700 hover:text-ocean-600 font-medium transition-colors">
                Partners
              </Link>
              <Link href="/login.html" 
                    className="bg-ocean-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-ocean-700 transition-colors">
                Member Login
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-ocean-600 focus:outline-none focus:text-ocean-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
                <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-ocean-600 font-medium">
                  Home
                </Link>
                <Link href="/about.html" className="block px-3 py-2 text-gray-700 hover:text-ocean-600 font-medium">
                  About
                </Link>
                <Link href="/partners.html" className="block px-3 py-2 text-gray-700 hover:text-ocean-600 font-medium">
                  Partners
                </Link>
                <Link href="/login.html" 
                      className="block px-3 py-2 bg-ocean-600 text-white rounded-lg font-medium hover:bg-ocean-700 transition-colors text-center">
                  Member Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}