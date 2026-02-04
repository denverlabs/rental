import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rond Point Rentals | Alquileres en Punta del Este',
  description: 'Alquileres de temporada en Punta del Este, Uruguay. La Barra, Manantiales, José Ignacio y más. Reservá por WhatsApp o Airbnb.',
  keywords: 'alquiler punta del este, temporada punta del este, la barra alquiler, manantiales rental, jose ignacio, uruguay vacation rental',
  openGraph: {
    title: 'Rond Point Rentals | Alquileres en Punta del Este',
    description: 'Alquileres de temporada en el destino más exclusivo de Uruguay.',
    type: 'website',
    locale: 'es_UY',
  },
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
