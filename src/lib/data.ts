import { put, list, del } from '@vercel/blob'
import type { Property, SiteSettings, Reservation, Guest } from '@/types'

// Default data (used as fallback and initial data)
import defaultSettings from '@/data/settings.json'
import defaultProperties from '@/data/properties.json'
import defaultReservations from '@/data/reservations.json'
import defaultGuests from '@/data/guests.json'

const SETTINGS_KEY = 'data/settings.json'
const PROPERTIES_KEY = 'data/properties.json'
const RESERVATIONS_KEY = 'data/reservations.json'
const GUESTS_KEY = 'data/guests.json'

// Check if Blob is available
function hasBlobToken(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

// Helper to get blob by prefix
async function getBlobByPrefix(prefix: string): Promise<{ url: string } | null> {
  if (!hasBlobToken()) return null

  try {
    const { blobs } = await list({ prefix })
    if (blobs.length > 0) {
      // Get the most recent blob
      const sorted = blobs.sort((a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )
      return { url: sorted[0].url }
    }
  } catch (error) {
    console.error('Error listing blobs:', error)
  }
  return null
}

// Helper to fetch JSON from URL with cache busting
async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    // Add cache busting parameter
    const cacheBustUrl = `${url}?t=${Date.now()}`
    const response = await fetch(cacheBustUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Error fetching JSON:', error)
  }
  return null
}

// Helper to save JSON to blob
async function saveToBlob(key: string, data: unknown): Promise<boolean> {
  if (!hasBlobToken()) {
    console.log('No BLOB_READ_WRITE_TOKEN, skipping blob save')
    return false
  }

  try {
    // First, delete ALL existing blobs with this prefix
    const { blobs } = await list({ prefix: key })
    for (const blob of blobs) {
      try {
        await del(blob.url)
        console.log('Deleted old blob:', blob.url)
      } catch (e) {
        console.log('Could not delete existing blob:', e)
      }
    }

    // Save new blob
    const blob = await put(key, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false, // Keep consistent filename
    })

    console.log('Saved to blob:', blob.url)
    return true
  } catch (error) {
    console.error('Error saving to blob:', error)
    return false
  }
}

// SETTINGS - Always fetch fresh from Blob
export async function getSettings(): Promise<SiteSettings> {
  // Try to get from blob
  if (hasBlobToken()) {
    const blob = await getBlobByPrefix(SETTINGS_KEY)
    if (blob) {
      const data = await fetchJson<SiteSettings>(blob.url)
      if (data) {
        console.log('Loaded settings from blob')
        return data
      }
    }
  }

  // Return defaults if no blob data
  console.log('Using default settings')
  return defaultSettings as SiteSettings
}

export async function saveSettings(settings: SiteSettings): Promise<boolean> {
  // Save to blob
  const saved = await saveToBlob(SETTINGS_KEY, settings)

  if (!saved) {
    console.error('Failed to save settings to blob')
    return false
  }

  return true
}

// PROPERTIES - Always fetch fresh from Blob
export async function getProperties(): Promise<Property[]> {
  // Try to get from blob
  if (hasBlobToken()) {
    const blob = await getBlobByPrefix(PROPERTIES_KEY)
    if (blob) {
      const data = await fetchJson<Property[]>(blob.url)
      if (data) {
        console.log('Loaded properties from blob')
        return data
      }
    }
  }

  // Return defaults if no blob data
  console.log('Using default properties')
  return defaultProperties as Property[]
}

export async function saveProperties(properties: Property[]): Promise<boolean> {
  // Save to blob
  const saved = await saveToBlob(PROPERTIES_KEY, properties)

  if (!saved) {
    console.error('Failed to save properties to blob')
    return false
  }

  return true
}

export async function getProperty(id: string): Promise<Property | undefined> {
  const properties = await getProperties()
  return properties.find(p => p.id === id)
}

export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
  const properties = await getProperties()
  const index = properties.findIndex(p => p.id === id)
  if (index === -1) return null

  properties[index] = { ...properties[index], ...updates }
  await saveProperties(properties)
  return properties[index]
}

export async function createProperty(property: Omit<Property, 'id'>): Promise<Property> {
  const properties = await getProperties()
  const newProperty: Property = {
    ...property,
    id: `prop-${Date.now()}`
  }
  properties.push(newProperty)
  await saveProperties(properties)
  return newProperty
}

export async function deleteProperty(id: string): Promise<boolean> {
  const properties = await getProperties()
  const filtered = properties.filter(p => p.id !== id)
  if (filtered.length === properties.length) return false

  await saveProperties(filtered)
  return true
}

// ============================================
// GUESTS
// ============================================

export async function getGuests(): Promise<Guest[]> {
  if (hasBlobToken()) {
    const blob = await getBlobByPrefix(GUESTS_KEY)
    if (blob) {
      const data = await fetchJson<Guest[]>(blob.url)
      if (data) {
        console.log('Loaded guests from blob')
        return data
      }
    }
  }
  console.log('Using default guests')
  return defaultGuests as Guest[]
}

export async function saveGuests(guests: Guest[]): Promise<boolean> {
  const saved = await saveToBlob(GUESTS_KEY, guests)
  if (!saved) {
    console.error('Failed to save guests to blob')
    return false
  }
  return true
}

export async function getGuest(id: string): Promise<Guest | undefined> {
  const guests = await getGuests()
  return guests.find(g => g.id === id)
}

export async function createGuest(guest: Omit<Guest, 'id' | 'createdAt'>): Promise<Guest> {
  const guests = await getGuests()
  const newGuest: Guest = {
    ...guest,
    id: `guest-${Date.now()}`,
    createdAt: new Date().toISOString()
  }
  guests.push(newGuest)
  await saveGuests(guests)
  return newGuest
}

export async function updateGuest(id: string, updates: Partial<Guest>): Promise<Guest | null> {
  const guests = await getGuests()
  const index = guests.findIndex(g => g.id === id)
  if (index === -1) return null

  guests[index] = { ...guests[index], ...updates }
  await saveGuests(guests)
  return guests[index]
}

export async function deleteGuest(id: string): Promise<boolean> {
  const guests = await getGuests()
  const filtered = guests.filter(g => g.id !== id)
  if (filtered.length === guests.length) return false

  await saveGuests(filtered)
  return true
}

// Find guest by phone (useful for WhatsApp bot)
export async function findGuestByPhone(phone: string): Promise<Guest | undefined> {
  const guests = await getGuests()
  return guests.find(g => g.phone === phone)
}

// ============================================
// RESERVATIONS
// ============================================

export async function getReservations(): Promise<Reservation[]> {
  if (hasBlobToken()) {
    const blob = await getBlobByPrefix(RESERVATIONS_KEY)
    if (blob) {
      const data = await fetchJson<Reservation[]>(blob.url)
      if (data) {
        console.log('Loaded reservations from blob')
        return data
      }
    }
  }
  console.log('Using default reservations')
  return defaultReservations as Reservation[]
}

export async function saveReservations(reservations: Reservation[]): Promise<boolean> {
  const saved = await saveToBlob(RESERVATIONS_KEY, reservations)
  if (!saved) {
    console.error('Failed to save reservations to blob')
    return false
  }
  return true
}

export async function getReservation(id: string): Promise<Reservation | undefined> {
  const reservations = await getReservations()
  return reservations.find(r => r.id === id)
}

export async function createReservation(reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> {
  const reservations = await getReservations()
  const now = new Date().toISOString()
  const newReservation: Reservation = {
    ...reservation,
    id: `res-${Date.now()}`,
    createdAt: now,
    updatedAt: now
  }
  reservations.push(newReservation)
  await saveReservations(reservations)
  return newReservation
}

export async function updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
  const reservations = await getReservations()
  const index = reservations.findIndex(r => r.id === id)
  if (index === -1) return null

  reservations[index] = {
    ...reservations[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  await saveReservations(reservations)
  return reservations[index]
}

export async function deleteReservation(id: string): Promise<boolean> {
  const reservations = await getReservations()
  const filtered = reservations.filter(r => r.id !== id)
  if (filtered.length === reservations.length) return false

  await saveReservations(filtered)
  return true
}

// Get reservations by property code (for bot)
export async function getReservationsByPropertyCode(propertyCode: string): Promise<Reservation[]> {
  const reservations = await getReservations()
  return reservations.filter(r => r.propertyCode === propertyCode)
}

// Get active reservations (checked_in today)
export async function getActiveReservations(): Promise<Reservation[]> {
  const reservations = await getReservations()
  const today = new Date().toISOString().split('T')[0]
  return reservations.filter(r =>
    r.status === 'checked_in' ||
    (r.status === 'confirmed' && r.checkIn <= today && r.checkOut >= today)
  )
}

// Get today's check-ins
export async function getTodayCheckIns(): Promise<Reservation[]> {
  const reservations = await getReservations()
  const today = new Date().toISOString().split('T')[0]
  return reservations.filter(r => r.checkIn === today && r.status !== 'cancelled')
}

// Get today's check-outs
export async function getTodayCheckOuts(): Promise<Reservation[]> {
  const reservations = await getReservations()
  const today = new Date().toISOString().split('T')[0]
  return reservations.filter(r => r.checkOut === today && r.status !== 'cancelled')
}

// Check property availability for dates
export async function checkPropertyAvailability(
  propertyCode: string,
  checkIn: string,
  checkOut: string,
  excludeReservationId?: string
): Promise<boolean> {
  const reservations = await getReservations()
  const conflicting = reservations.find(r => {
    if (r.propertyCode !== propertyCode) return false
    if (r.status === 'cancelled') return false
    if (excludeReservationId && r.id === excludeReservationId) return false

    // Check for date overlap
    return !(checkOut <= r.checkIn || checkIn >= r.checkOut)
  })

  return !conflicting
}
