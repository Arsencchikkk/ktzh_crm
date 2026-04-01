import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'КТЖ CRM — Управление обращениями пассажиров',
  description: 'CRM система для обработки жалоб пассажиров Казахстанских железных дорог',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`${inter.variable} dark`}>
      <body className="bg-surface-950 text-surface-100 antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
