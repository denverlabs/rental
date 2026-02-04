'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Home,
  Calendar,
  Users,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  X,
  Save,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogIn,
  LogOut as LogOutIcon,
  DollarSign
} from 'lucide-react'
import type { Property, Reservation, Guest, ReservationStatus, ReservationSource } from '@/types'

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  checked_in: 'Hospedado',
  checked_out: 'Finalizada',
  cancelled: 'Cancelada'
}

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-green-100 text-green-800',
  checked_out: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const SOURCE_LABELS: Record<ReservationSource, string> = {
  whatsapp: 'WhatsApp',
  airbnb: 'Airbnb',
  direct: 'Directo',
  other: 'Otro'
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'guests'>('today')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all')

  // Modal states
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Check auth
  useEffect(() => {
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find(c => c.trim().startsWith('admin_auth='))
    if (!authCookie || authCookie.split('=')[1] !== 'true') {
      window.location.href = '/admin'
    }
  }, [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const timestamp = Date.now()
        const [resRes, guestsRes, propsRes] = await Promise.all([
          fetch(`/api/reservations?t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/guests?t=${timestamp}`, { cache: 'no-store' }),
          fetch(`/api/properties?t=${timestamp}`, { cache: 'no-store' })
        ])
        setReservations(await resRes.json())
        setGuests(await guestsRes.json())
        setProperties(await propsRes.json())
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Get guest by ID
  const getGuest = (guestId: string) => guests.find(g => g.id === guestId)

  // Get property by code
  const getProperty = (code: string) => properties.find(p => p.referenceCode === code)

  // Today's date
  const today = new Date().toISOString().split('T')[0]

  // Filtered reservations
  const todayReservations = reservations.filter(r =>
    (r.checkIn <= today && r.checkOut >= today && r.status !== 'cancelled') ||
    r.checkIn === today ||
    r.checkOut === today
  )

  const filteredReservations = reservations.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (searchTerm) {
      const guest = getGuest(r.guestId)
      const property = getProperty(r.propertyCode)
      const searchLower = searchTerm.toLowerCase()
      return (
        guest?.name.toLowerCase().includes(searchLower) ||
        guest?.phone.includes(searchTerm) ||
        property?.title.toLowerCase().includes(searchLower) ||
        r.propertyCode.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // Stats
  const activeNow = reservations.filter(r =>
    r.status === 'checked_in' ||
    (r.status === 'confirmed' && r.checkIn <= today && r.checkOut >= today)
  ).length

  const todayCheckIns = reservations.filter(r => r.checkIn === today && r.status !== 'cancelled').length
  const todayCheckOuts = reservations.filter(r => r.checkOut === today && r.status !== 'cancelled').length
  const pendingReservations = reservations.filter(r => r.status === 'pending').length

  // Save reservation
  const saveReservation = async (reservation: Partial<Reservation>) => {
    setSaving(true)
    try {
      const isNew = !reservation.id || reservation.id.startsWith('new-')
      const url = isNew ? '/api/reservations' : `/api/reservations/${reservation.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation)
      })

      if (res.ok) {
        const saved = await res.json()
        if (isNew) {
          setReservations([...reservations, saved])
        } else {
          setReservations(reservations.map(r => r.id === saved.id ? saved : r))
        }
        setShowReservationModal(false)
        setEditingReservation(null)
        showMessage('success', isNew ? 'Reserva creada' : 'Reserva actualizada')
      } else {
        showMessage('error', 'Error al guardar')
      }
    } catch {
      showMessage('error', 'Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Delete reservation
  const deleteReservation = async (id: string) => {
    if (!confirm('¿Eliminar esta reserva?')) return
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setReservations(reservations.filter(r => r.id !== id))
        showMessage('success', 'Reserva eliminada')
      }
    } catch {
      showMessage('error', 'Error al eliminar')
    }
  }

  // Save guest
  const saveGuest = async (guest: Partial<Guest>) => {
    setSaving(true)
    try {
      const isNew = !guest.id || guest.id.startsWith('new-')
      const url = isNew ? '/api/guests' : `/api/guests/${guest.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guest)
      })

      if (res.ok) {
        const saved = await res.json()
        if (isNew) {
          setGuests([...guests, saved])
        } else {
          setGuests(guests.map(g => g.id === saved.id ? saved : g))
        }
        setShowGuestModal(false)
        setEditingGuest(null)
        showMessage('success', isNew ? 'Huésped creado' : 'Huésped actualizado')
      } else {
        showMessage('error', 'Error al guardar')
      }
    } catch {
      showMessage('error', 'Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary-500" />
              <h1 className="text-xl font-bold text-gray-900">CRM - Reservas</h1>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingReservation({
                id: `new-${Date.now()}`,
                propertyId: '',
                propertyCode: '',
                guestId: '',
                checkIn: today,
                checkOut: '',
                status: 'pending',
                source: 'whatsapp',
                totalAmount: 0,
                currency: 'USD',
                paidAmount: 0,
                createdAt: '',
                updatedAt: ''
              })
              setShowReservationModal(true)
            }}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Reserva
          </button>
        </div>
      </header>

      {/* Toast */}
      {message.text && (
        <div className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-medium`}>
          {message.text}
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeNow}</p>
                <p className="text-sm text-gray-500">Hospedados hoy</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <LogIn className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayCheckIns}</p>
                <p className="text-sm text-gray-500">Check-ins hoy</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <LogOutIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{todayCheckOuts}</p>
                <p className="text-sm text-gray-500">Check-outs hoy</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingReservations}</p>
                <p className="text-sm text-gray-500">Pendientes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'today'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Hoy ({todayReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todas ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'guests'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Huéspedes ({guests.length})
          </button>
        </div>

        {/* Filters (for 'all' tab) */}
        {activeTab === 'all' && (
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o propiedad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        {activeTab === 'guests' ? (
          // Guests List
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Lista de Huéspedes</h2>
              <button
                onClick={() => {
                  setEditingGuest({
                    id: `new-${Date.now()}`,
                    name: '',
                    phone: '',
                    email: '',
                    country: '',
                    notes: '',
                    createdAt: ''
                  })
                  setShowGuestModal(true)
                }}
                className="flex items-center gap-1 text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nuevo Huésped
              </button>
            </div>
            <div className="divide-y">
              {guests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay huéspedes registrados</p>
                </div>
              ) : (
                guests.map(guest => (
                  <div key={guest.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                        {guest.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{guest.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {guest.phone}
                          </span>
                          {guest.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {guest.email}
                            </span>
                          )}
                          {guest.country && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {guest.country}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingGuest(guest)
                        setShowGuestModal(true)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Editar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // Reservations List
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y">
              {(activeTab === 'today' ? todayReservations : filteredReservations).length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay reservas {activeTab === 'today' ? 'para hoy' : ''}</p>
                </div>
              ) : (
                (activeTab === 'today' ? todayReservations : filteredReservations).map(reservation => {
                  const guest = getGuest(reservation.guestId)
                  const property = getProperty(reservation.propertyCode)
                  const isCheckInToday = reservation.checkIn === today
                  const isCheckOutToday = reservation.checkOut === today

                  return (
                    <div key={reservation.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[reservation.status]}`}>
                              {STATUS_LABELS[reservation.status]}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {SOURCE_LABELS[reservation.source]}
                            </span>
                            {isCheckInToday && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                                <LogIn className="w-3 h-3" /> Check-in hoy
                              </span>
                            )}
                            {isCheckOutToday && (
                              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                                <LogOutIcon className="w-3 h-3" /> Check-out hoy
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{guest?.name || 'Sin huésped'}</p>
                              <p className="text-sm text-gray-500">{guest?.phone}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1 font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {reservation.propertyCode}
                            </span>
                            <span>{property?.title || 'Propiedad no encontrada'}</span>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {reservation.checkIn} → {reservation.checkOut}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {reservation.currency} {reservation.totalAmount}
                              {reservation.paidAmount > 0 && (
                                <span className="text-green-600">
                                  (pagado: {reservation.paidAmount})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingReservation(reservation)
                              setShowReservationModal(true)
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deleteReservation(reservation.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Reservation Modal */}
      {showReservationModal && editingReservation && (
        <ReservationModal
          reservation={editingReservation}
          guests={guests}
          properties={properties}
          onSave={saveReservation}
          onClose={() => {
            setShowReservationModal(false)
            setEditingReservation(null)
          }}
          saving={saving}
        />
      )}

      {/* Guest Modal */}
      {showGuestModal && editingGuest && (
        <GuestModal
          guest={editingGuest}
          onSave={saveGuest}
          onClose={() => {
            setShowGuestModal(false)
            setEditingGuest(null)
          }}
          saving={saving}
        />
      )}
    </div>
  )
}

// Reservation Modal
function ReservationModal({
  reservation,
  guests,
  properties,
  onSave,
  onClose,
  saving
}: {
  reservation: Reservation
  guests: Guest[]
  properties: Property[]
  onSave: (r: Partial<Reservation>) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState(reservation)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Set propertyId from propertyCode
    const property = properties.find(p => p.referenceCode === form.propertyCode)
    onSave({
      ...form,
      propertyId: property?.id || ''
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {reservation.id.startsWith('new-') ? 'Nueva Reserva' : 'Editar Reserva'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Propiedad</label>
              <select
                value={form.propertyCode}
                onChange={(e) => setForm({ ...form, propertyCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Seleccionar propiedad</option>
                {properties.filter(p => p.referenceCode).map(p => (
                  <option key={p.id} value={p.referenceCode}>
                    {p.referenceCode} - {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Huésped</label>
              <select
                value={form.guestId}
                onChange={(e) => setForm({ ...form, guestId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Seleccionar huésped</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
              <input
                type="date"
                value={form.checkIn}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
              <input
                type="date"
                value={form.checkOut}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ReservationStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as ReservationSource })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total</label>
              <input
                type="number"
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="USD">USD</option>
                <option value="UYU">UYU</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Pagado</label>
              <input
                type="number"
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold px-6 py-2 rounded-lg"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Guest Modal
function GuestModal({
  guest,
  onSave,
  onClose,
  saving
}: {
  guest: Guest
  onSave: (g: Partial<Guest>) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState(guest)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {guest.id.startsWith('new-') ? 'Nuevo Huésped' : 'Editar Huésped'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp) *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="5491126569371"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <input
              type="text"
              value={form.country || ''}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Argentina"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Preferencias, comentarios..."
            />
          </div>
        </form>

        <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold px-6 py-2 rounded-lg"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
