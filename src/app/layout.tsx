import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Paradise Rentals - Alquiler Vacacional',
  description: 'Descubre las mejores propiedades de alquiler vacacional. Reserva directo con nosotros o a través de Airbnb.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
