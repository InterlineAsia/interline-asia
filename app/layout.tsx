import type { Metadata } from 'next'

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}