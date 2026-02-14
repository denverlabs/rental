import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://rond-point-rentals.vercel.app'), // Update with your actual domain
  title: 'Rond Point Rentals | Alquileres en Punta del Este',
  description: 'Alquileres de temporada en Punta del Este, Uruguay. La Barra, Manantiales, José Ignacio y más. Reservá por WhatsApp o Airbnb.',
  keywords: 'alquiler punta del este, temporada punta del este, la barra alquiler, manantiales rental, jose ignacio, uruguay vacation rental',
  openGraph: {
    title: 'Rond Point Rentals | Alquileres en Punta del Este',
    description: 'Alquileres de temporada en el destino más exclusivo de Uruguay.',
    url: 'https://rond-point-rentals.vercel.app',
    siteName: 'Rond Point Rentals',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Rond Point Rentals - Luxury Beachfront Properties',
      },
    ],
    type: 'website',
    locale: 'es_UY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rond Point Rentals | Alquileres en Punta del Este',
    description: 'Alquileres de temporada en el destino más exclusivo de Uruguay.',
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'],
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
