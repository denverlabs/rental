import { put, list, del } from '@vercel/blob'
import type { Property, SiteSettings } from '@/types'

// Default data (used as fallback and initial data)
import defaultSettings from '@/data/settings.json'
import defaultProperties from '@/data/properties.json'

const SETTINGS_KEY = 'data/settings.json'
const PROPERTIES_KEY = 'data/properties.json'

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
