import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Interline Asia - Luxury Cruise Agency',
  description: 'Exclusive cruise experiences for travel professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
