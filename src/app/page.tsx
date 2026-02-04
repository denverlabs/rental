'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, MapPin, Users, Bed, Bath, Star, Home, Instagram, Facebook, PlusCircle } from 'lucide-react'
import type { Property, SiteSettings } from '@/types'

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propsRes, settingsRes] = await Promise.all([
          fetch('/api/properties'),
          fetch('/api/settings')
        ])
        const propsData = await propsRes.json()
        const settingsData = await settingsRes.json()

        // Filter only active properties
        const activeProperties = propsData.filter((p: Property) => p.active !== false)
        setProperties(activeProperties)
        setSettings(settingsData)

        // Set featured property as selected
        const featured = activeProperties.find((p: Property) => p.featured) || activeProperties[0]
        setSelectedProperty(featured)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const whatsappLink = settings
    ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage)}`
    : '#'

  const getPropertyWhatsappLink = (property: Property) => {
    const message = `Hola! Me interesa: ${property.title} en ${property.location}. Quiero más info y disponibilidad.`
    return `https://wa.me/${settings?.whatsappNumber}?text=${encodeURIComponent(message)}`
  }

  const getListPropertyWhatsappLink = () => {
    const message = `Hola! Tengo una propiedad en Punta del Este y me gustaría publicarla.`
    return `https://wa.me/${settings?.whatsappNumber}?text=${encodeURIComponent(message)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Home className="w-8 h-8 text-primary-500" />
              <span className="text-xl font-bold text-gray-900">{settings?.siteName}</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#propiedades" className="text-gray-600 hover:text-primary-500 transition-colors">Propiedades</a>
              <a href="#contacto" className="text-gray-600 hover:text-primary-500 transition-colors">Contacto</a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp flex items-center gap-2 !py-2 !px-4"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Featured Property */}
      <section className="pt-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              {settings?.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {settings?.heroSubtitle}
            </p>
          </div>

          {selectedProperty && (
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Main Image Gallery */}
              <div className="space-y-4">
                {/* Main Large Image */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={selectedProperty.images[activeImage]}
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover gallery-image"
                  />
                  <div className="absolute inset-0 gradient-overlay opacity-30"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      {selectedProperty.location}
                    </span>
                  </div>
                </div>

                {/* Thumbnail Images */}
                <div className="grid grid-cols-3 gap-3">
                  {selectedProperty.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden transition-all ${
                        activeImage === idx
                          ? 'ring-2 ring-primary-500 ring-offset-2'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${selectedProperty.title} - ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Info */}
              <div className="lg:sticky lg:top-24 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-600">Destacado</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedProperty.title}
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {selectedProperty.description}
                  </p>
                </div>

                {/* Property Stats */}
                <div className="flex flex-wrap gap-4 py-4 border-y border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-500" />
                    <span className="text-gray-700">{selectedProperty.guests} huéspedes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-primary-500" />
                    <span className="text-gray-700">{selectedProperty.bedrooms} habitaciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-primary-500" />
                    <span className="text-gray-700">{selectedProperty.bathrooms} baños</span>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Comodidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold text-gray-900">{selectedProperty.price}</span>
                    <span className="text-gray-500">{selectedProperty.priceNote}</span>
                  </div>

                  <div className="space-y-3">
                    <a
                      href={getPropertyWhatsappLink(selectedProperty)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp w-full flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Consultar disponibilidad
                    </a>
                    <a
                      href={selectedProperty.airbnbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-airbnb w-full flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 14.957c-.09.246-.195.479-.312.698-.366.681-.845 1.203-1.418 1.552-.573.349-1.222.523-1.936.523-.494 0-.95-.087-1.36-.262-.41-.174-.77-.419-1.07-.732-.18-.188-.34-.39-.48-.605-.14.215-.3.417-.48.605-.3.313-.66.558-1.07.732-.41.175-.866.262-1.36.262-.714 0-1.363-.174-1.936-.523-.573-.349-1.052-.871-1.418-1.552-.117-.219-.222-.452-.312-.698-.3-.82-.45-1.74-.45-2.757 0-.888.112-1.695.336-2.421.224-.726.544-1.36.96-1.9.416-.54.916-.96 1.5-1.26.584-.3 1.232-.45 1.944-.45.856 0 1.584.234 2.184.702.6.468 1.02 1.134 1.26 1.998h.048c.24-.864.66-1.53 1.26-1.998.6-.468 1.328-.702 2.184-.702.712 0 1.36.15 1.944.45.584.3 1.084.72 1.5 1.26.416.54.736 1.174.96 1.9.224.726.336 1.533.336 2.421 0 1.017-.15 1.937-.45 2.757z"/>
                      </svg>
                      Ver en Airbnb
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* All Properties Section */}
      <section id="propiedades" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Propiedades en Punta del Este
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              La Barra, Manantiales, José Ignacio, Playa Brava y más. Escribinos por WhatsApp y te armamos un presupuesto.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {properties.map((property) => (
              <div
                key={property.id}
                className="property-card bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer"
                onClick={() => {
                  setSelectedProperty(property)
                  setActiveImage(0)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  {property.featured && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        Destacado
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4">
                    <span className="bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                      {property.price} <span className="font-normal text-gray-500">{property.priceNote}</span>
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h3>
                  <p className="text-gray-500 flex items-center gap-1 mb-4">
                    <MapPin className="w-4 h-4" />
                    {property.location}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {property.guests}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" /> {property.bedrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-4 h-4" /> {property.bathrooms}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={getPropertyWhatsappLink(property)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white text-center py-2.5 px-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Consultar
                    </a>
                    <a
                      href={property.airbnbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-[#FF5A5F] hover:bg-[#e04e52] text-white text-center py-2.5 px-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Ver en Airbnb
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Tenés dudas? Escribinos
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Te respondemos al instante por WhatsApp. Consultá disponibilidad, precios y armamos tu presupuesto.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white p-6 rounded-2xl transition-all hover:scale-105"
              >
                <MessageCircle className="w-8 h-8" />
                <div className="text-left">
                  <div className="font-bold text-lg">Chateá con nosotros</div>
                  <div className="text-white/80 text-sm">Respuesta inmediata 24/7</div>
                </div>
              </a>

              <a
                href={getListPropertyWhatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-primary-500 hover:bg-primary-600 text-white p-6 rounded-2xl transition-all hover:scale-105"
              >
                <PlusCircle className="w-8 h-8" />
                <div className="text-left">
                  <div className="font-bold text-lg">Publicá tu propiedad</div>
                  <div className="text-white/80 text-sm">Sumate a nuestra red</div>
                </div>
              </a>
            </div>

            {/* Social Media */}
            <div className="flex items-center justify-center gap-4">
              {settings?.instagram && (
                <a
                  href={`https://instagram.com/${settings.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {settings?.facebook && (
                <a
                  href={`https://facebook.com/${settings.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <Facebook className="w-6 h-6" />
                </a>
              )}
              {settings?.tiktok && (
                <a
                  href={`https://tiktok.com/@${settings.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <TikTokIcon className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Home className="w-6 h-6 text-primary-400" />
              <span className="font-bold">{settings?.siteName}</span>
            </div>
            <div className="text-center text-gray-400 text-sm">
              {settings?.footerText}
              {settings?.email && (
                <span className="ml-2">
                  | <a href={`mailto:${settings.email}`} className="hover:text-primary-400 transition-colors">{settings.email}</a>
                </span>
              )}
            </div>
            <a href="/admin" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
              Admin
            </a>
          </div>
        </div>
      </footer>

    </main>
  )
}
