import { put, list, del } from '@vercel/blob'
import type { Property, SiteSettings } from '@/types'

// Default data (used as fallback and initial data)
import defaultSettings from '@/data/settings.json'
import defaultProperties from '@/data/properties.json'

const SETTINGS_KEY = 'data/settings.json'
const PROPERTIES_KEY = 'data/properties.json'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Check if Blob is available (keep for legacy or other uses if needed)
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

// SETTINGS - Fetch fresh from API
export async function getSettings(): Promise<SiteSettings> {
  try {
    const response = await fetch(`${API_URL}/api/settings`, {
      cache: 'no-store'
    })
    if (response.ok) {
      const data = await response.json()
      console.log('Loaded settings from API')
      return data
    }
  } catch (error) {
    console.error('Error fetching settings from API:', error)
  }

  // Fallback to blob if configured
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
  try {
    const response = await fetch(`${API_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    })
    return response.ok
  } catch (error) {
    console.error('Error saving settings to API:', error)
    return false
  }
}

// PROPERTIES - Fetch fresh from API
export async function getProperties(): Promise<Property[]> {
  try {
    const response = await fetch(`${API_URL}/api/properties`, {
      cache: 'no-store'
    })
    if (response.ok) {
      const data = await response.json()
      console.log('Loaded properties from API')
      // Extract properties array if wrapped in an object (as returned by the backend)
      return Array.isArray(data) ? data : (data?.properties || [])
    }
  } catch (error) {
    console.error('Error fetching properties from API:', error)
  }

  // Fallback to blob if configured
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

// Note: saveProperties is deprecated in favor of atomic updates via REST API
export async function saveProperties(properties: Property[]): Promise<boolean> {
  console.warn('saveProperties is deprecated. Use updateProperty, createProperty, or deleteProperty.')
  return false
}

// PROPERTIES - Fetch single from API
export async function getProperty(id: string): Promise<Property | undefined> {
  const url = `${API_URL}/api/properties/${id}`
  console.log('[DEBUG] getProperty calling:', url)
  try {
    const response = await fetch(url, {
      cache: 'no-store'
    })
    console.log('[DEBUG] getProperty response status:', response.status)
    if (response.ok) {
      const data = await response.json()
      console.log('[DEBUG] getProperty loaded:', id)
      return data
    }
  } catch (error) {
    console.error('[DEBUG] getProperty fetch error:', id, error)
  }

  // Fallback to searching in all properties
  console.log('[DEBUG] Falling back to local search for property:', id)
  const properties = await getProperties()
  const found = properties.find(p => p.id === id)
  console.log('[DEBUG] Fallback found:', found ? 'yes' : 'no')
  return found
}

export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
  const url = `${API_URL}/api/properties/${id}`
  console.log('[DEBUG] updateProperty calling:', url)
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    console.log('[DEBUG] updateProperty response status:', response.status)
    if (response.ok) {
      console.log('[DEBUG] Updated property in API:', id)
      // Re-fetch to get full updated object
      const result = await getProperty(id)
      console.log('[DEBUG] Re-fetch after update result:', result ? 'success' : 'failed')
      return result || null
    }
  } catch (error) {
    console.error('[DEBUG] updateProperty API error:', id, error)
  }
  return null
}

export async function createProperty(property: Omit<Property, 'id'>): Promise<Property> {
  try {
    const response = await fetch(`${API_URL}/api/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(property)
    })

    if (response.ok) {
      const newProp = await response.json()
      console.log('Created property in API:', newProp.id)
      return newProp
    }
  } catch (error) {
    console.error('Error creating property in API:', error)
  }
  // Fallback to local-looking ID if API fails (though it will fail to save elsewhere)
  return { ...property, id: `prop-${Date.now()}` } as Property
}

export async function deleteProperty(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/properties/${id}`, {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('Error deleting property from API:', id, error)
    return false
  }
}
