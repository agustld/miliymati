import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({ 
  subsets: ['latin'], 
  variable: '--font-montserrat',
  weight: ['300', '400', '600']
})

export const metadata: Metadata = {
  title: 'Nuestra Boda - Fiesta',
  description: 'Página de invitación para nuestra boda',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}

