import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Panel - Unpacker Clone',
  description: 'Administrative interface for Unpacker Clone platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
