'use client'

import { useState, useEffect } from 'react'
import {
  Home,
  Settings,
  Image,
  Plus,
  Trash2,
  Save,
  LogOut,
  Eye,
  EyeOff,
  Edit3,
  X,
  Star,
  StarOff,
  ExternalLink,
  Menu,
  ChevronLeft,
  ToggleLeft,
  ToggleRight,
  Hash
} from 'lucide-react'
import type { Property, SiteSettings } from '@/types'

type Tab = 'properties' | 'settings'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [activeTab, setActiveTab] = useState<Tab>('properties')
  const [properties, setProperties] = useState<Property[]>([])
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (res.ok) {
        setIsAuthenticated(true)
        setAuthError('')
        // Set cookie with 7 day expiry
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()
        document.cookie = `admin_auth=true; expires=${expires}; path=/`
      } else {
        setAuthError('Contraseña incorrecta')
      }
    } catch {
      setAuthError('Error de conexión')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    // Delete cookie by setting expired date
    document.cookie = 'admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  }

  // Check session on mount (use cookies for good persistence)
  useEffect(() => {
    // Check cookie for auth
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find(c => c.trim().startsWith('admin_auth='))
    if (authCookie && authCookie.split('=')[1] === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchData = async () => {
      try {
        // Add cache-busting timestamp to prevent stale data
        const timestamp = Date.now()
        const [propsRes, settingsRes] = await Promise.all([
          fetch(`/api/properties?t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/settings?t=${timestamp}`, { cache: 'no-store' })
        ])
        setProperties(await propsRes.json())
        setSettings(await settingsRes.json())
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isAuthenticated])

  // Show message
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Save settings
  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        showMessage('success', 'Configuración guardada')
      } else {
        showMessage('error', 'Error al guardar')
      }
    } catch {
      showMessage('error', 'Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Save property
  const saveProperty = async (property: Property) => {
    setSaving(true)
    try {
      const isNew = property.id.startsWith('new-')
      const url = isNew ? '/api/properties' : `/api/properties/${property.id}`
      const method = isNew ? 'POST' : 'PUT'

      const body = isNew ? { ...property, id: undefined } : property

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        const savedProperty = await res.json()
        if (isNew) {
          setProperties([...properties, savedProperty])
        } else {
          setProperties(properties.map(p => p.id === property.id ? savedProperty : p))
        }
        setShowPropertyModal(false)
        setEditingProperty(null)
        showMessage('success', isNew ? 'Propiedad creada' : 'Propiedad actualizada')
      } else {
        showMessage('error', 'Error al guardar')
      }
    } catch {
      showMessage('error', 'Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Delete property
  const deleteProperty = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta propiedad?')) return

    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProperties(properties.filter(p => p.id !== id))
        showMessage('success', 'Propiedad eliminada')
      } else {
        showMessage('error', 'Error al eliminar')
      }
    } catch {
      showMessage('error', 'Error de conexión')
    }
  }

  // Toggle featured
  const toggleFeatured = async (property: Property) => {
    const updated = { ...property, featured: !property.featured }
    await saveProperty(updated)
  }

  // Toggle active
  const toggleActive = async (property: Property) => {
    const updated = { ...property, active: !property.active }
    await saveProperty(updated)
  }

  // New property
  const newProperty = (): Property => ({
    id: `new-${Date.now()}`,
    referenceCode: '',
    title: '',
    description: '',
    location: '',
    price: '',
    priceNote: 'por noche',
    images: ['', '', ''],
    airbnbUrl: '',
    featured: false,
    active: true,
    amenities: [],
    guests: 2,
    bedrooms: 1,
    bathrooms: 1
  })

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500">Rond Point Rentals</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="admin-label">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input"
                placeholder="Ingresa tu contraseña"
                autoFocus
              />
            </div>

            {authError && (
              <p className="text-red-500 text-sm">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-20'} bg-gray-900 text-white flex-shrink-0 transition-all duration-300 overflow-hidden`}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            {sidebarOpen && (
              <>
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold">Admin</h2>
                  <p className="text-xs text-gray-400">Rond Point Rentals</p>
                </div>
              </>
            )}
          </div>

          <nav className="space-y-2 flex-1">
            <button
              onClick={() => setActiveTab('properties')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'properties'
                ? 'bg-primary-500 text-white'
                : 'text-gray-300 hover:bg-gray-800'
                }`}
            >
              <Image className="w-5 h-5" />
              {sidebarOpen && <span>Propiedades</span>}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings'
                ? 'bg-primary-500 text-white'
                : 'text-gray-300 hover:bg-gray-800'
                }`}
            >
              <Settings className="w-5 h-5" />
              {sidebarOpen && <span>Configuración</span>}
            </button>
          </nav>

          <div className="space-y-2">
            <a
              href="/"
              target="_blank"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <Eye className="w-5 h-5" />
              {sidebarOpen && <span>Ver Sitio</span>}
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === 'properties' ? 'Gestionar Propiedades' : 'Configuración del Sitio'}
            </h1>
          </div>

          {activeTab === 'properties' && (
            <button
              onClick={() => {
                setEditingProperty(newProperty())
                setShowPropertyModal(true)
              }}
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Propiedad
            </button>
          )}
        </header>

        {/* Toast Message */}
        {message.text && (
          <div className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white font-medium animate-fade-in`}>
            {message.text}
          </div>
        )}

        <div className="p-6">
          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden ${!property.active ? 'opacity-60' : ''}`}
                >
                  <div className="relative aspect-[4/3]">
                    {property.images[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className={`w-full h-full object-cover ${!property.active ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Image className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {property.featured && (
                        <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Star className="w-3 h-3" /> Destacada
                        </div>
                      )}
                      {!property.active && (
                        <div className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Inactiva
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-gray-900">{property.title || 'Sin título'}</h3>
                      {property.referenceCode && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono" title="Ficha">
                          {property.referenceCode}
                        </span>
                      )}
                      {property.airbnbId && (
                        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded font-mono border border-red-100" title="Airbnb ID">
                          {property.airbnbId}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{property.location || 'Sin ubicación'}</p>
                    <p className="text-lg font-bold text-primary-500 mb-4">
                      {property.price} <span className="text-sm font-normal text-gray-500">{property.priceNote}</span>
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProperty(property)
                          setShowPropertyModal(true)
                        }}
                        className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Edit3 className="w-4 h-4" /> Editar
                      </button>
                      <button
                        onClick={() => toggleActive(property)}
                        className={`p-2 rounded-lg transition-colors ${property.active
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        title={property.active ? 'Desactivar' : 'Activar'}
                      >
                        {property.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => toggleFeatured(property)}
                        className={`p-2 rounded-lg transition-colors ${property.featured
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        title={property.featured ? 'Quitar destacado' : 'Destacar'}
                      >
                        {property.featured ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => deleteProperty(property.id)}
                        className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && settings && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Información General</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="admin-label">Nombre del Sitio</label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="admin-label">Título Principal (Hero)</label>
                      <input
                        type="text"
                        value={settings.heroTitle}
                        onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="admin-label">Subtítulo (Hero)</label>
                      <textarea
                        value={settings.heroSubtitle}
                        onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                        className="admin-input"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Contacto</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="admin-label">Número de WhatsApp (sin +)</label>
                      <input
                        type="text"
                        value={settings.whatsappNumber}
                        onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                        className="admin-input"
                        placeholder="+17372081313"
                      />
                    </div>
                    <div>
                      <label className="admin-label">Mensaje Predeterminado de WhatsApp</label>
                      <textarea
                        value={settings.whatsappMessage}
                        onChange={(e) => setSettings({ ...settings, whatsappMessage: e.target.value })}
                        className="admin-input"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Email</label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        className="admin-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Redes Sociales</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="admin-label">Instagram</label>
                      <input
                        type="text"
                        value={settings.instagram || ''}
                        onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                        className="admin-input"
                        placeholder="usuario"
                      />
                    </div>
                    <div>
                      <label className="admin-label">Facebook</label>
                      <input
                        type="text"
                        value={settings.facebook || ''}
                        onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                        className="admin-input"
                        placeholder="usuario"
                      />
                    </div>
                    <div>
                      <label className="admin-label">TikTok</label>
                      <input
                        type="text"
                        value={settings.tiktok || ''}
                        onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
                        className="admin-input"
                        placeholder="usuario"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Footer</h3>
                  <div>
                    <label className="admin-label">Texto del Footer</label>
                    <input
                      type="text"
                      value={settings.footerText}
                      onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Analytics y Tracking</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="admin-label">Google Analytics 4 (ID)</label>
                      <input
                        type="text"
                        value={settings.googleAnalyticsId || ''}
                        onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                        className="admin-input"
                        placeholder="G-XXXXXXXXXX"
                      />
                      <p className="text-xs text-gray-500 mt-1">ID de medición de GA4 (empieza con G-)</p>
                    </div>
                    <div>
                      <label className="admin-label">Meta Pixel (Facebook)</label>
                      <input
                        type="text"
                        value={settings.metaPixelId || ''}
                        onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value })}
                        className="admin-input"
                        placeholder="123456789012345"
                      />
                      <p className="text-xs text-gray-500 mt-1">ID del Pixel de Meta/Facebook (solo números)</p>
                    </div>
                    <div>
                      <label className="admin-label">Google Tag Manager (ID)</label>
                      <input
                        type="text"
                        value={settings.googleTagManagerId || ''}
                        onChange={(e) => setSettings({ ...settings, googleTagManagerId: e.target.value })}
                        className="admin-input"
                        placeholder="GTM-XXXXXXX"
                      />
                      <p className="text-xs text-gray-500 mt-1">ID del contenedor GTM (empieza con GTM-)</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Código Personalizado</h3>
                  <div>
                    <label className="admin-label">Código para {'<head>'}</label>
                    <textarea
                      value={settings.customHeadCode || ''}
                      onChange={(e) => setSettings({ ...settings, customHeadCode: e.target.value })}
                      className="admin-input font-mono text-sm"
                      rows={5}
                      placeholder="<!-- Pega aquí código adicional para el <head> -->"
                    />
                    <p className="text-xs text-gray-500 mt-1">Scripts, meta tags u otro código HTML para el {'<head>'}</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Property Edit Modal */}
      {showPropertyModal && editingProperty && (
        <PropertyModal
          property={editingProperty}
          onSave={saveProperty}
          onClose={() => {
            setShowPropertyModal(false)
            setEditingProperty(null)
          }}
          saving={saving}
        />
      )}
    </div>
  )
}

// Property Edit Modal Component
function PropertyModal({
  property,
  onSave,
  onClose,
  saving
}: {
  property: Property
  onSave: (property: Property) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<Property>({
    ...property,
    active: property.active !== false
  })
  const [amenityInput, setAmenityInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  const handleImport = async () => {
    if (!form.airbnbUrl) return
    setImporting(true)
    setImportError('')
    try {
      const res = await fetch('/api/properties/import-airbnb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.airbnbUrl.trim() })
      })
      if (res.ok) {
        const data = await res.json()
        setForm({
          ...form,
          title: data.title || form.title,
          description: data.description || form.description,
          location: data.location || form.location,
          price: data.price || form.price,
          guests: data.guests || form.guests,
          bedrooms: data.bedrooms || form.bedrooms,
          bathrooms: data.bathrooms || form.bathrooms,
          amenities: data.amenities && data.amenities.length > 0 ? data.amenities : form.amenities,
          images: data.images && data.images.length > 0
            ? (data.images.length >= 3 ? data.images.slice(0, 3) : [...data.images, ...Array(3 - data.images.length).fill('')])
            : form.images,
          airbnbUrl: data.airbnbUrl || form.airbnbUrl
        })
      } else {
        const errorData = await res.json()
        setImportError(errorData.error || 'Error al importar')
      }
    } catch (error) {
      setImportError('Error de conexión')
    } finally {
      setImporting(false)
    }
  }

  const extractAirbnbId = (url: string) => {
    const match = url.match(/\/rooms\/(\d+)/)
    return match ? match[1] : ''
  }

  const handleUrlChange = (url: string) => {
    const id = extractAirbnbId(url)
    setForm({ ...form, airbnbUrl: url, airbnbId: id || form.airbnbId })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  const addAmenity = () => {
    if (amenityInput.trim()) {
      setForm({ ...form, amenities: [...form.amenities, amenityInput.trim()] })
      setAmenityInput('')
    }
  }

  const removeAmenity = (index: number) => {
    setForm({ ...form, amenities: form.amenities.filter((_, i) => i !== index) })
  }

  const updateImage = (index: number, url: string) => {
    const newImages = [...form.images]
    newImages[index] = url
    setForm({ ...form, images: newImages })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {property.id.startsWith('new-') ? 'Nueva Propiedad' : 'Editar Propiedad'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Airbnb Info & Import (Moved to Top) */}
          <div className="p-4 bg-red-50 border border-red-100 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700 font-semibold">
                <ExternalLink className="w-4 h-4" />
                Vincular con Airbnb
              </div>
              {property.id.startsWith('new-') && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || !form.airbnbUrl}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shrink-0 shadow-sm"
                >
                  {importing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Precargar datos
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="admin-label">URL de Airbnb</label>
                <input
                  type="url"
                  value={form.airbnbUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="admin-input border-red-100 focus:ring-red-500"
                  placeholder="https://www.airbnb.com/rooms/..."
                  required
                />
              </div>
              <div>
                <label className="admin-label">ID de Airbnb (Automático)</label>
                <input
                  type="text"
                  value={form.airbnbId || ''}
                  readOnly
                  className="admin-input border-red-100 bg-red-50/50 text-red-800 cursor-not-allowed"
                  placeholder="Se extraerá de la URL..."
                />
              </div>
            </div>

            {importError && (
              <p className="text-xs text-red-600 font-medium">{importError}</p>
            )}

            {property.id.startsWith('new-') && !importError && !importing && (
              <p className="text-xs text-red-500/70">
                Pega la URL de Airbnb y haz clic en <strong>Precargar datos</strong> para autocompletar la ficha técnica.
              </p>
            )}
          </div>
          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="font-semibold text-gray-900">Estado de la propiedad</label>
              <p className="text-sm text-gray-500">Las propiedades inactivas no se muestran en el sitio</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${form.active
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-600'
                }`}
            >
              {form.active ? (
                <>
                  <ToggleRight className="w-5 h-5" /> Activa
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5" /> Inactiva
                </>
              )}
            </button>
          </div>

          {/* Reference Code */}
          <div>
            <label className="admin-label">Código de Ficha</label>
            <input
              type="text"
              value={form.referenceCode || ''}
              onChange={(e) => setForm({ ...form, referenceCode: e.target.value })}
              className="admin-input"
              placeholder="PDE-001"
            />
            <p className="text-xs text-gray-500 mt-1">Código interno para identificar la propiedad (ej: PDE-001)</p>
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="admin-label">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="admin-label">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="admin-input"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="admin-label">Ubicación</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="admin-label">Precio</label>
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="admin-input"
                  placeholder="$250"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="admin-label">Nota</label>
                <input
                  type="text"
                  value={form.priceNote || ''}
                  onChange={(e) => setForm({ ...form, priceNote: e.target.value })}
                  className="admin-input"
                  placeholder="por noche"
                />
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="admin-label">Capacidad</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Huéspedes</label>
                <input
                  type="number"
                  min="1"
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: parseInt(e.target.value) || 1 })}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Habitaciones</label>
                <input
                  type="number"
                  min="1"
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: parseInt(e.target.value) || 1 })}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Baños</label>
                <input
                  type="number"
                  min="1"
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: parseInt(e.target.value) || 1 })}
                  className="admin-input"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="admin-label">Imágenes (URLs)</label>
            <p className="text-sm text-gray-500 mb-3">
              Pega URLs de imágenes. La primera será la principal.
            </p>
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {form.images[index] ? (
                      <img src={form.images[index]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <input
                    type="url"
                    value={form.images[index] || ''}
                    onChange={(e) => updateImage(index, e.target.value)}
                    className="admin-input flex-1"
                    placeholder={`URL de imagen ${index + 1}${index === 0 ? ' (principal)' : ''}`}
                  />
                </div>
              ))}
            </div>
          </div>


          {/* Amenities */}
          <div>
            <label className="admin-label">Comodidades</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                className="admin-input flex-1"
                placeholder="Agregar comodidad..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAmenity()
                  }
                }}
              />
              <button
                type="button"
                onClick={addAmenity}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
