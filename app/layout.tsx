import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CropRadar — Disease Reporting for Farmers',
  description: 'Report and track crop disease outbreaks in your region',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
